from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from typing import Optional, List
import io
import json
from app.validators import SpotValidator

app = FastAPI(title="SIOMA Spots Validator API")

# CORS para permitir conexión desde Laravel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, configurar dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Endpoint de salud del servicio"""
    return {"status": "healthy", "service": "sioma-spots-validator"}

@app.post("/api/validate-spots")
async def validate_spots(
    file: UploadFile = File(...),
    finca_id: Optional[str] = Form(None),
    valid_lotes: Optional[str] = Form(None)  # JSON string con lista de lotes
):
    """
    Valida un archivo de spots (CSV o Excel)
    
    Args:
        file: Archivo CSV o Excel con datos de spots
        finca_id: ID de la finca (opcional)
        valid_lotes: JSON string con lista de lotes válidos (opcional)
    
    Returns:
        JSON con resultados de validación
    """
    try:
        # Leer el archivo
        contents = await file.read()
        
        # Determinar tipo de archivo
        file_extension = file.filename.split('.')[-1].lower()
        
        if file_extension in ['xlsx', 'xls']:
            df = pd.read_excel(io.BytesIO(contents))
        elif file_extension == 'csv':
            df = pd.read_csv(io.BytesIO(contents), encoding='utf-8')
        else:
            raise HTTPException(
                status_code=400,
                detail="Formato de archivo no soportado. Use CSV o Excel."
            )
        
        # Parsear lotes válidos si se proporcionan
        valid_lotes_list = None
        if valid_lotes:
            try:
                valid_lotes_list = json.loads(valid_lotes)
            except:
                pass
        
        # Validar datos
        validator = SpotValidator(df, valid_lotes=valid_lotes_list)
        result = validator.validate_all()
        
        return JSONResponse(content=result)
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "error": True,
                "message": f"Error al procesar archivo: {str(e)}"
            }
        )

@app.post("/api/generate-corrected-file")
async def generate_corrected_file(
    file: UploadFile = File(...),
    errors: str = Form(...)  # JSON string de errores
):
    """
    Genera un archivo corregido con columnas de estado
    
    Args:
        file: Archivo original
        errors: JSON con los errores encontrados
        
    Returns:
        Archivo CSV corregido
    """
    try:
        # Leer archivo original
        contents = await file.read()
        file_extension = file.filename.split('.')[-1].lower()
        
        if file_extension in ['xlsx', 'xls']:
            df = pd.read_excel(io.BytesIO(contents))
        elif file_extension == 'csv':
            df = pd.read_csv(io.BytesIO(contents), encoding='utf-8')
        else:
            raise HTTPException(status_code=400, detail="Formato no soportado")
        
        # Parsear errores
        error_data = json.loads(errors)
        
        # Marcar filas con errores
        df['Estado'] = 'OK'
        df['Errores'] = ''
        
        # Procesar errores
        error_rows = set()
        for error_type, error_list in error_data.items():
            if isinstance(error_list, list):
                for error in error_list:
                    if 'row' in error:
                        row_idx = error['row'] - 2  # -2 por header y index base 0
                        if row_idx >= 0 and row_idx < len(df):
                            df.at[row_idx, 'Estado'] = 'ERROR'
                            if pd.isna(df.at[row_idx, 'Errores']) or df.at[row_idx, 'Errores'] == '':
                                df.at[row_idx, 'Errores'] = error_type
                            else:
                                df.at[row_idx, 'Errores'] += f', {error_type}'
        
        # Convertir a CSV
        output = io.StringIO()
        df.to_csv(output, index=False, encoding='utf-8')
        output.seek(0)
        
        filename = file.filename.replace('.xlsx', '').replace('.xls', '').replace('.csv', '')
        filename = f"{filename}_corregido.csv"
        
        return JSONResponse(
            content={
                "success": True,
                "filename": filename,
                "data": output.getvalue(),
                "errors_count": len(error_rows)
            }
        )
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "error": True,
                "message": f"Error al generar archivo: {str(e)}"
            }
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

