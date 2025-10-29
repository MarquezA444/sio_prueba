# 🧪 Guía de Pruebas - Hackathon 2025

## 📋 Pasos para Probar la Aplicación

### Paso 1: Iniciar el Validador Python

**Opción A: Con Docker Compose (Recomendado)**
```bash
cd C:\Users\dejes\OneDrive\Desktop\siomav_1
docker-compose up -d python-validator
```

**Opción B: Manual con Docker**
```bash
cd python-validator
docker build -t sioma-validator .
docker run -d -p 8001:8001 --name sioma-validator sioma-validator
```

**Verificar que el servicio está corriendo:**
```bash
curl http://localhost:8001/health
```

Deberías ver:
```json
{"status":"healthy","service":"sioma-spots-validator"}
```

---

### Paso 2: Verificar Variables de Entorno

Abre el archivo `.env` y verifica que tengas configurado:

```env
# API Sioma
SIOMA_API_BASE=https://api.sioma.dev
SIOMA_API_TOKEN=tu_token_aqui
SIOMA_API_TIMEOUT=30

# Validador Python
PYTHON_VALIDATOR_URL=http://localhost:8001
PYTHON_VALIDATOR_TIMEOUT=120
```

---

### Paso 3: Iniciar la Aplicación Laravel

**Terminal 1: Servidor Laravel**
```bash
php artisan serve
```

**Terminal 2: Frontend con Hot Reload**
```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:8000`

---

### Paso 4: Crear Usuario e Iniciar Sesión

1. Ve a `http://localhost:8000/register`
2. Crea un usuario
3. Inicia sesión
4. Accede al Dashboard

---

### Paso 5: Probar la Integración con API Sioma

En el Dashboard, haz clic en:

**📍 Obtener Fincas** - Deberías ver las fincas disponibles
**🗺️ Obtener Lotes** - Deberías ver los lotes disponibles

---

### Paso 6: Probar Carga y Validación de Archivos

#### 6.1 Preparar Archivo de Prueba

Crea un archivo CSV de ejemplo llamado `spots_ejemplo.csv`:

```csv
Latitud,Longitud,Línea palma,Posición palma,Lote
7.336576854,-76.72322992,1,1,1
7.336536382,-76.72316139,1,2,1
7.336495910,-76.72309286,2,1,La gloria
7.336455438,-76.72302433,2,2,La gloria
7.336576854,-76.72322992,1,3,1
```

**Archivo con errores** (para probar validación):

```csv
Latitud,Longitud,Línea palma,Posición palma,Lote
7.336576854,-76.72322992,1,1,1
7.336576854,-76.72322992,1,1,1
7.336536382,-76.72316139,1,2,1
7.336495910,-76.72309286,2,1,La gloria
250.5,800.0,3,1,1
```

#### 6.2 Subir y Validar

1. **Selecciona una finca** del dropdown (si la API está disponible)
2. **Haz clic en "Archivo CSV/XLSX"** y selecciona tu archivo
3. **Verás la previsualización** con paginación
4. **Haz clic en "✅ Validar Archivo"**
5. **Revisa los resultados:**
   - ✅ Si el archivo es válido: verás mensaje de éxito
   - ⚠️ Si tiene errores: verás lista de errores por tipo

---

### Paso 7: Probar el Mapa Interactivo

**Solo aparece si el archivo está válido:**

1. Selecciona un **lote** del dropdown
2. Verás el mapa con:
   - 🗺️ Puntos georreferenciados (spots)
   - 📏 Líneas de palma conectadas por color
   - 🎯 Perímetro del lote (área verde semitransparente)
3. **Haz clic en cualquier punto** para ver información detallada

---

### Paso 8: Probar Archivo Corregido

Si tu archivo tenía errores:

1. **Haz clic en "📥 Descargar Archivo Corregido"**
2. Se descargará un CSV con columnas adicionales:
   - `Estado`: OK o ERROR
   - `Errores`: Tipo de error encontrado
3. **Abre el archivo** y verifica las filas marcadas

---

### Paso 9: Probar Envío a Sioma

**Solo funciona si el archivo está válido:**

1. Haz clic en **"🚀 Enviar a Sioma"**
2. Espera la confirmación
3. Verás el mensaje: **"✅ Datos enviados exitosamente a Sioma"**

---

## 🐛 Solución de Problemas

### El validador Python no responde

```bash
# Verificar logs del contenedor
docker logs sioma-python-validator

# Reiniciar el servicio
docker-compose restart python-validator
```

### Error de conexión con Python

Verifica que el puerto 8001 esté libre y el servicio corriendo:
```bash
curl http://localhost:8001/health
```

Si no funciona, Laravel automáticamente usará el validador PHP como fallback.

### Problemas con la API de Sioma

Verifica en el archivo `.env` que tengas configurado:
```env
SIOMA_API_BASE=https://api.sioma.dev
SIOMA_API_TOKEN=tu_token_valido
```

Los endpoints de prueba seguirán funcionando aunque no tengas un token válido.

---

## ✅ Checklist de Pruebas

Marca cada funcionalidad que pruebes:

- [ ] Validador Python responde en `/health`
- [ ] Puedo iniciar sesión en la aplicación
- [ ] Puedo obtener fincas desde la API
- [ ] Puedo obtener lotes desde la API
- [ ] Puedo subir un archivo CSV
- [ ] Veo la previsualización del archivo
- [ ] Las validaciones detectan coordenadas duplicadas
- [ ] Las validaciones detectan líneas duplicadas
- [ ] Las validaciones detectan rangos inválidos
- [ ] Veo el mapa interactivo cuando el archivo es válido
- [ ] Puedo seleccionar un lote en el mapa
- [ ] Veo las líneas de palma en el mapa
- [ ] Puedo descargar archivo corregido si hay errores
- [ ] Puedo enviar datos a Sioma

---

## 📊 Datos de Prueba Sugeridos

### Archivo Válido Completo
```csv
Latitud,Longitud,Línea palma,Posición palma,Lote
7.336576854,-76.72322992,1,1,Lote A
7.336536382,-76.72316139,1,2,Lote A
7.336495910,-76.72309286,1,3,Lote A
7.336455438,-76.72302433,2,1,Lote A
7.336414966,-76.72295580,2,2,Lote A
7.336374494,-76.72288727,2,3,Lote A
7.336334022,-76.72281874,1,1,Lote B
7.336293550,-76.72275021,1,2,Lote B
7.336253078,-76.72268168,2,1,Lote B
7.336212606,-76.72261315,2,2,Lote B
```

### Archivo con Múltiples Errores
```csv
Latitud,Longitud,Línea palma,Posición palma,Lote
7.336576854,-76.72322992,1,1,Lote A
7.336576854,-76.72322992,1,2,Lote A
7.336495910,-76.72309286,1,1,Lote A
7.336455438,-76.72302433,2,2,Lote A
200.0,500.0,3,1,Lote A
7.336374494,-200.0,1,1,Lote B
,,,,Lote B
```

---

## 🎯 Resultados Esperados

### Validación Exitosa
```json
{
  "ok": true,
  "meta": {
    "rows_total": 10,
    "sheets": 1
  },
  "errors": null,
  "validator_used": "python"
}
```

### Validación con Errores
```json
{
  "ok": false,
  "errors": {
    "coords_duplicadas": [...],
    "linea_duplicada_en_lote": [...],
    "rango_coord": [...]
  },
  "validator_used": "python"
}
```

---

¡Listo para las pruebas! 🚀

