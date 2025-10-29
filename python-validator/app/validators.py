import pandas as pd
from typing import Dict, List, Any, Optional
import numpy as np

class SpotValidator:
    """Validador de datos de spots georreferenciados"""
    
    def __init__(self, df: pd.DataFrame, valid_lotes: Optional[List[str]] = None):
        self.df = df.copy()
        self.df.columns = self.df.columns.str.lower().str.strip()
        self.valid_lotes = valid_lotes or []
        self.normalize_columns()
        
    def normalize_columns(self):
        """Normaliza nombres de columnas para facilitar el procesamiento"""
        column_mapping = {}
        for col in self.df.columns:
            col_lower = col.lower()
            
            # Latitud
            if 'latitud' in col_lower or col_lower in ['lat', 'latitude']:
                column_mapping[col] = 'latitud'
            # Longitud
            elif 'longitud' in col_lower or col_lower in ['lon', 'lng', 'long', 'longitude']:
                column_mapping[col] = 'longitud'
            # Línea
            elif 'linea' in col_lower or col_lower in ['línea', 'line', 'linea_palma']:
                column_mapping[col] = 'linea'
            # Posición
            elif 'posicion' in col_lower or col_lower in ['posición', 'position', 'posicion_palma', 'palma', 'palma_num']:
                column_mapping[col] = 'posicion'
            # Lote
            elif 'lote' in col_lower or col_lower in ['lot']:
                column_mapping[col] = 'lote'
        
        self.df.rename(columns=column_mapping, inplace=True)
    
    def validate_all(self) -> Dict[str, Any]:
        """Ejecuta todas las validaciones"""
        
        # Verificar columnas requeridas
        required_cols = ['latitud', 'longitud', 'linea', 'posicion', 'lote']
        missing_cols = [col for col in required_cols if col not in self.df.columns]
        
        if missing_cols:
            return {
                "meta": {
                    "rows_total": len(self.df),
                    "sheets": 1
                },
                "columns_detected": list(self.df.columns),
                "errors": {
                    "columnas_faltantes": missing_cols
                },
                "warnings": [],
                "ok": False
            }
        
        errors = {
            "coords_duplicadas": [],
            "linea_duplicada_en_lote": [],
            "posicion_duplicada_en_linea": [],
            "rango_coord": [],
            "valores_vacios": [],
            "lote_invalido": []
        }
        
        warnings = []
        
        # Agregar número de fila (para reporte de errores)
        self.df['_row_number'] = range(2, len(self.df) + 2)  # +2 por header
        
        # 1. Validar valores vacíos ANTES de convertir tipos
        for col in required_cols:
            # Verificar si la columna existe y tiene valores vacíos
            if col in self.df.columns:
                null_mask = self.df[col].isna() | (self.df[col] == '') | (self.df[col].astype(str).str.strip() == '')
                if null_mask.any():
                    for idx, is_null in enumerate(null_mask):
                        if is_null:
                            row_num = int(self.df.at[idx, '_row_number'])
                            errors["valores_vacios"].append({
                                "row": row_num,
                                "column": col
                            })
        
        # Validar tipos de datos (después de detectar vacíos)
        self.df['latitud'] = pd.to_numeric(self.df['latitud'], errors='coerce')
        self.df['longitud'] = pd.to_numeric(self.df['longitud'], errors='coerce')
        self.df['linea'] = self.df['linea'].astype(str)
        self.df['posicion'] = pd.to_numeric(self.df['posicion'], errors='coerce')
        self.df['lote'] = self.df['lote'].astype(str)
        
        # 2. Validar rangos de coordenadas
        lat_mask = (self.df['latitud'] < -90) | (self.df['latitud'] > 90)
        lon_mask = (self.df['longitud'] < -180) | (self.df['longitud'] > 180)
        
        for row_num in self.df[lat_mask]['_row_number']:
            errors["rango_coord"].append({
                "row": int(row_num),
                "field": "latitud",
                "value": float(self.df[self.df['_row_number'] == row_num]['latitud'].iloc[0])
            })
        
        for row_num in self.df[lon_mask]['_row_number']:
            errors["rango_coord"].append({
                "row": int(row_num),
                "field": "longitud",
                "value": float(self.df[self.df['_row_number'] == row_num]['longitud'].iloc[0])
            })
        
        # 3. Validar coordenadas duplicadas
        coord_groups = self.df.groupby(['latitud', 'longitud'], dropna=False)
        for (lat, lon), group in coord_groups:
            if len(group) > 1:
                rows = sorted(group['_row_number'].tolist())
                for i, row in enumerate(rows[1:], 1):
                    errors["coords_duplicadas"].append({
                        "row": int(row),
                        "duplicate_of_row": int(rows[0]),
                        "lat": float(lat),
                        "lon": float(lon)
                    })
        
        # 4. Validar líneas duplicadas en lote
        # Solo reporta error si hay MÚLTIPLES registros con EXACTAMENTE la misma línea EN EL MISMO lote
        # (Una línea puede tener múltiples posiciones, eso es normal)
        lote_linea_groups = self.df.groupby(['lote', 'linea'], dropna=False)
        for (lote, linea), group in lote_linea_groups:
            # Obtener posiciones únicas
            posiciones_unicas = group['posicion'].nunique()
            total_registros = len(group)
            
            # Solo es error si hay más registros que posiciones únicas
            # (significa que alguna posición está duplicada)
            if posiciones_unicas < total_registros:
                rows = sorted(group['_row_number'].tolist())
                # Reportar todas las filas duplicadas
                posiciones_counts = group.groupby('posicion').size()
                for pos, count in posiciones_counts.items():
                    if count > 1:
                        duplicados = group[group['posicion'] == pos]['_row_number'].tolist()
                        duplicados_sorted = sorted(duplicados)
                        for row in duplicados_sorted[1:]:
                            errors["linea_duplicada_en_lote"].append({
                                "lote": str(lote),
                                "linea": str(linea),
                                "posicion": float(pos) if pd.notna(pos) else None,
                                "row": int(row),
                                "duplicate_of_row": int(duplicados_sorted[0])
                            })
        
        # 5. Validar posiciones duplicadas en línea
        lote_linea_pos_groups = self.df.groupby(['lote', 'linea', 'posicion'], dropna=False)
        for (lote, linea, pos), group in lote_linea_pos_groups:
            if len(group) > 1:
                rows = sorted(group['_row_number'].tolist())
                for row in rows[1:]:
                    errors["posicion_duplicada_en_linea"].append({
                        "lote": str(lote),
                        "linea": str(linea),
                        "posicion": float(pos),
                        "row": int(row),
                        "duplicate_of_row": int(rows[0])
                    })
        
        # 6. Validar lotes inválidos (si se proporciona lista de lotes válidos)
        if self.valid_lotes:
            for idx, row in self.df.iterrows():
                lote = str(row['lote'])
                if lote and lote not in self.valid_lotes:
                    row_num = int(row['_row_number'])
                    errors["lote_invalido"].append({
                        "row": row_num,
                        "lote": lote
                    })
        
        # Limpiar errores vacíos
        errors = {k: v for k, v in errors.items() if v}
        
        return {
            "meta": {
                "rows_total": len(self.df),
                "sheets": 1
            },
            "columns_detected": list(self.df.columns.drop('_row_number')),
            "errors": errors if errors else None,
            "warnings": warnings,
            "ok": len(errors) == 0
        }

