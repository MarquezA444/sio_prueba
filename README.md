# 🧠 Hackathon 2025 – Interfaz Inteligente de Spots

## 📋 Descripción

Aplicación web desarrollada para el Hackathon 2025 que permite validar y enviar datos georreferenciados de palmas (spots) a la plataforma Sioma.

## 🎯 Características Principales

- ✅ **Carga de archivos** CSV/XLSX con datos de spots
- ✅ **Validación automática** de datos (duplicados, inconsistencias, rangos)
- ✅ **Integración con API Sioma** para obtener fincas y lotes
- ✅ **Mapa interactivo** con visualización por lote
- ✅ **Líneas de palma** y perímetro del lote visibles
- ✅ **Archivos corregidos** con errores marcados
- ✅ **Envío a Sioma** de datos validados

## 🚀 Instalación

### Requisitos

- PHP 8.2 o superior
- Python 3.11+ (opcional, para validaciones robustas)
- Composer
- Node.js y npm
- Base de datos SQLite (incluida)
- Docker (opcional, para el validador Python)

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd siomav_1
   ```

2. **Instalar dependencias PHP**
   ```bash
   composer install
   ```

3. **Instalar dependencias JavaScript**
   ```bash
   npm install
   ```

4. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

   Editar `.env` y agregar:
   ```env
   SIOMA_API_BASE=https://api.sioma.dev
   SIOMA_API_TOKEN=tu_token_aqui
   SIOMA_API_TIMEOUT=30
   
   # Validador Python (opcional, usa PHP si no está disponible)
   PYTHON_VALIDATOR_URL=http://localhost:8001
   PYTHON_VALIDATOR_TIMEOUT=120
   ```

5. **Instalar validador Python (opcional pero recomendado)**
   
   **Opción A: Con Docker Compose (Más fácil)**
   ```bash
   docker-compose up -d python-validator
   ```
   
   **Opción B: Con Docker manual**
   ```bash
   cd python-validator
   docker build -t sioma-validator .
   docker run -d -p 8001:8001 --name sioma-validator sioma-validator
   ```
   
   **Opción C: Sin Docker**
   ```bash
   cd python-validator
   python -m venv venv
   source venv/bin/activate  # En Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --host 0.0.0.0 --port 8001
   ```
   
   Verificar que el servicio está funcionando:
   ```bash
   curl http://localhost:8001/health
   ```

6. **Ejecutar migraciones**
   ```bash
   php artisan migrate
   ```

7. **Compilar assets frontend**
   ```bash
   npm run build
   ```

## 🏃 Ejecución

### Modo desarrollo

Ejecutar en terminales separadas:

**Terminal 1: Servidor Laravel**
```bash
php artisan serve
```

**Terminal 2: Vite (Hot reload)**
```bash
npm run dev
```

Acceder a: `http://localhost:8000`

### Iniciar sesión

- Registrarse en `/register`
- O usar las credenciales por defecto (si existen)

## 📖 Uso

### Flujo de trabajo

1. **Seleccionar Finca**: Elegir una finca del dropdown (obtenida desde API Sioma)

2. **Subir archivo**: 
   - Seleccionar archivo CSV/XLSX con estructura:
   ```
   Latitud,Longitud,Línea palma,Posición palma,Lote
   7.33657685,-76.72322992,1,1,1
   ```

3. **Validar datos**: 
   - Click en "Validar Archivo"
   - Se ejecutarán las validaciones:
     - Coordenadas duplicadas
     - Líneas duplicadas en lote
     - Posiciones duplicadas en línea
     - Rangos de coordenadas
     - Lotes válidos según finca

4. **Revisar errores**: 
   - Si hay errores, descargar archivo corregido con filas marcadas
   - Corregir manualmente según indicaciones

5. **Visualizar en mapa**: 
   - Seleccionar un lote específico
   - Ver puntos, líneas y perímetro en el mapa interactivo

6. **Enviar a Sioma**: 
   - Click en "Enviar a Sioma" cuando los datos estén correctos
   - Confirmar el envío exitoso

## 🗂️ Estructura del Proyecto

```
siomav_1/
├── app/
│   ├── Http/Controllers/
│   │   ├── SiomaController.php      # Proxy API Sioma
│   │   └── SpotController.php       # Validación y envío
│   ├── Services/
│   │   ├── ApiSiomaClient.php       # Cliente HTTP para Sioma
│   │   └── SpotValidationService.php # Lógica de validación
│   └── Imports/
│       └── SpotsImport.php          # Importador Excel
├── resources/js/
│   ├── Pages/
│   │   └── Dashboard.jsx            # Panel principal
│   └── Components/
│       └── SpotsMap.jsx             # Componente de mapa
├── routes/
│   └── web.php                      # Rutas de la aplicación
└── config/
    └── sioma.php                    # Configuración API Sioma
```

## 🧪 Validaciones Implementadas

### ✅ Validaciones de Lógica

- **Coordenadas duplicadas**: No permite lat/lon repetidos
- **Líneas en lote**: Verifica que no se repitan líneas en el mismo lote
- **Posiciones en línea**: Verifica que no se repitan posiciones en la misma línea
- **Rangos válidos**: Latitud [-90, 90], Longitud [-180, 180]
- **Lotes válidos**: Verifica contra la API de Sioma si se selecciona finca

### 🔧 Sistema de Validación Híbrido

La aplicación usa un sistema **híbrido** de validación:

1. **Validador Python (Primera opción)**: 
   - Usa **pandas** para procesamiento eficiente de datos
   - Más robusto para archivos grandes
   - Validaciones optimizadas con DataFrames
   - Generación de archivos corregidos

2. **Validador PHP (Fallback)**:
   - Se activa si Python no está disponible
   - Validaciones básicas implementadas con Laravel Collections
   - Garantiza funcionamiento continuo

El sistema automáticamente usa Python si está disponible, haciendo fallback a PHP si no lo está.

### ⚠️ Archivo Corregido

Cuando hay errores, se genera un archivo CSV con una columna adicional "Estado" que marca:
- `OK`: Fila sin errores
- `ERROR`: Fila con algún error

## 🗺️ Mapa Interactivo

Características:
- Visualización por lote seleccionado
- Marcadores para cada spot
- Líneas de palma conectadas por color
- Perímetro aproximado del lote
- Popups con información de cada spot

## 🔌 API Endpoints

### Consultar Fincas
```http
GET /api/sioma/fincas
```

### Consultar Lotes
```http
GET /api/sioma/lotes
```

### Subir y Validar Spots
```http
POST /api/v1/spots/upload
Content-Type: multipart/form-data

file: <archivo>
finca_id: <opcional>
```

### Enviar a Sioma
```http
POST /api/v1/spots/send-sioma
Content-Type: application/json

{
  "spots": [...],
  "finca_id": "..."
}
```

## 🛠️ Tecnologías

### Backend
- **Laravel 12** - Framework PHP
- **Inertia.js** - Bridge SPA
- **Maatwebsite Excel** - Procesamiento de archivos
- **Guzzle HTTP** - Cliente API

### Frontend
- **React 18** - UI Library
- **Tailwind CSS** - Estilos
- **Leaflet** - Mapas interactivos
- **Axios** - HTTP Client

## 📝 Notas de Implementación

### Pendiente según Documentación API Sioma

El endpoint de envío a Sioma está implementado pero necesita ajustes según la documentación oficial de la API:

- Endpoint exacto para enviar spots
- Formato de payload requerido
- Parámetros de autenticación adicionales

Archivo: `app/Services/ApiSiomaClient.php` - Método `sendSpots()`

## 🎯 Criterios del Hackathon

| Criterio | Estado | Nota |
|----------|--------|------|
| **Integración técnica** | ✅ Completo | API Sioma + Procesamiento archivos |
| **Validación de datos** | ✅ Completo | Todas las validaciones requeridas |
| **Visualización** | ✅ Completo | Mapa interactivo con líneas y perímetro |
| **UX/UI** | ✅ Completo | Interfaz intuitiva y moderna |
| **Código y documentación** | ✅ Completo | README y código organizado |

## 👥 Autores

Desarrollado para Hackathon 2025

## 🐍 Validador Python - Detalles Técnicos

### Arquitectura

El validador Python es un microservicio independiente que usa:
- **FastAPI**: Framework web moderno y rápido
- **Pandas**: Procesamiento eficiente de datos
- **OpenPyXL**: Lectura de archivos Excel

### Endpoints disponibles

```http
GET /health
# Verifica el estado del servicio

POST /api/validate-spots
Content-Type: multipart/form-data

# Parámetros:
- file: Archivo CSV/XLSX
- finca_id: ID de finca (opcional)

# Respuesta:
{
  "meta": {...},
  "columns_detected": [...],
  "errors": {...},
  "warnings": [],
  "ok": true/false
}
```

### Ventajas del validador Python

1. **Performance**: Pandas es extremadamente eficiente para procesar datasets grandes
2. **Validaciones avanzadas**: Más fácil implementar validaciones complejas
3. **Escalabilidad**: Puede manejar miles de registros sin problema
4. **Independencia**: No afecta el rendimiento de Laravel
5. **Reutilizable**: Puede usarse desde otras aplicaciones

### Sin validador Python

Si no se configura el servicio Python, la aplicación funcionará normalmente usando el validador PHP como fallback. Las validaciones funcionarán igual, pero con menor rendimiento en archivos grandes.

## 📄 Licencia

MIT License
