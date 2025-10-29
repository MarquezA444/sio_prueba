# 🧠 Hackathon 2025 – Geo‑Visor de Spots (Laravel + React + Mapbox + FastAPI)

Aplicación web que permite cargar, validar, previsualizar por lote y enviar a la API de Sioma datos georreferenciados de palmas (spots). Incluye un validador híbrido (Python + PHP) y visualización profesional con Mapbox GL JS.

## 🎯 Características

- ✅ Carga de archivos `.csv`/`.xlsx`
- ✅ Validación automática (coordenadas duplicadas, línea/posición por lote, lotes válidos, valores vacíos)
- ✅ Resumen de errores/advertencias y descarga de archivo corregido
- ✅ Mapa interactivo por lote con puntos, líneas de palma y perímetro aproximado
- ✅ Envío de datos validados a la API de Sioma
- ✅ Optimizada para archivos grandes (clustering, límites progresivos y líneas segmentadas)

---

## 🛠 Tecnologías utilizadas

### Backend (PHP)
- Laravel 12 (Framework)
- Inertia.js (Bridge SPA)
- Guzzle (Cliente HTTP)
- Maatwebsite/Excel (Importación CSV/XLSX)

### Frontend (JS)
- React 18
- Vite (Dev server y build)
- Tailwind CSS
- Axios (HTTP)
- Mapbox GL JS + react-map-gl (Mapa satelital 3D y capas vectoriales)

### Validador (Python)
- FastAPI (Microservicio)
- Pandas (Procesamiento de datos)
- OpenPyXL (Lectura XLSX)

### Infraestructura / Otros
- Docker y Docker Compose (opcional para el validador)
- SQLite por defecto (puedes cambiar a MySQL/PostgreSQL)

---

## 📦 Requisitos

- PHP 8.2+
- Composer
- Node.js 18+ y npm
- Python 3.11+ (si usas el validador local sin Docker)
- Docker Desktop (opcional, recomendado para el validador)
- Token de Mapbox (gratuito)

---

## 🚀 Instalación y configuración

1) Clonar e instalar dependencias
```bash
git clone <url-del-repositorio>
cd siomav_1
composer install
npm install
```

2) Variables de entorno
```bash
cp .env.example .env
php artisan key:generate
```
Editar `.env` (valores de ejemplo):
```env
APP_URL=http://localhost

SIOMA_API_BASE=https://api.sioma.dev
SIOMA_API_TOKEN=tu_token_sioma
SIOMA_API_TIMEOUT=30

# Dirección del microservicio Python (FastAPI)
PYTHON_VALIDATOR_URL=http://localhost:8001
PYTHON_VALIDATOR_TIMEOUT=120

# Token de Mapbox (obligatorio para el mapa)
VITE_MAPBOX_TOKEN=pk.tu_token_publico
```

3) Base de datos y migraciones
```bash
php artisan migrate
```

4) Validador Python (elige una opción)

- Opción A: Docker Compose (recomendado)
```bash
docker-compose up -d python-validator
# Verifica salud
curl http://localhost:8001/health
```

- Opción B: Local (sin Docker)
```bash
cd python-validator
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

5) Token de Mapbox

- Crea una cuenta y token público en `https://account.mapbox.com`
- Colócalo en `VITE_MAPBOX_TOKEN` del `.env`

6) Ejecutar en desarrollo

En dos terminales:
```bash
# Terminal 1 – API Laravel
php artisan serve

# Terminal 2 – Frontend Vite
npm run dev
```
App: `http://localhost:8000`

7) Build de producción (opcional)
```bash
npm run build
```

---

## 🧭 Flujo de uso

1. Selecciona la finca (lista desde API Sioma) y el lote (por finca).
2. Sube un archivo `.csv` o `.xlsx` con columnas base:
   ```
   Latitud, Longitud, Línea palma, Posición palma, Lote
   ```
3. Presiona “Validar datos”. El sistema usa el validador Python (si está disponible) o PHP si no.
4. Revisa el resumen de errores/advertencias. Descarga opcionalmente el archivo corregido.
5. Previsualiza el lote en el mapa (puntos, líneas, perímetro). Cambia de lote para evitar cargar toda la finca.
6. Envía los datos validados a la API de Sioma.

---

## 🧪 Validaciones implementadas

- ❌ Coordenadas duplicadas (latitud/longitud)
- ❌ En un mismo lote no se repiten líneas
- ❌ En una línea no se repiten posiciones
- ❌ Lotes válidos según la finca seleccionada
- ⚠️ Valores vacíos o en blanco
- Resumen total de errores/advertencias y detalle por filas

Archivo corregido: se filtran duplicados, opcionalmente se eliminan filas vacías (confirmación en UI) y se generan columnas `Estado` y `Errores`.

---

## 🗺 Visualización (Mapbox GL JS)

- Estilo satélite con cámara animada
- Terreno 3D (habilitado para datasets medianos)
- Clustering de puntos a bajos niveles de zoom
- Puntos individuales con etiquetas de posición
- Líneas de palma por lote (ordenadas por posición y segmentadas por distancia)
- Perímetro aproximado por lote (bounding box)
- Optimizaciones anti‑bloqueo para archivos grandes

El token se inyecta desde `VITE_MAPBOX_TOKEN` y se usa en `resources/js/Components/MapboxMap.jsx`.

---

## 🔌 Endpoints internos

Backend Laravel expone (prefijo principal puede variar según rutas):

- `GET /api/sioma/fincas`
- `GET /api/sioma/lotes?finca_id=...`
- `POST /api/v1/map/upload-spots` (subida + validación)
- `POST /api/v1/map/send-to-sioma` (envío a Sioma)
- `POST /api/v1/map/download-corrected` (descarga CSV corregido)

Cliente Sioma: `app/Services/ApiSiomaClient.php`
Validación PHP: `app/Services/SpotValidationService.php`
Validador Python: `python-validator/app/main.py` y `python-validator/app/validators.py`

---

## 🗂 Estructura relevante

```
resources/js/
├── Pages/Dashboard.jsx          # UI principal (carga/validación/mapa)
└── Components/MapboxMap.jsx     # Mapa (Mapbox GL JS)

app/Http/Controllers/
├── MapController.php            # Flujo de mapa, descarga corregido y envío
├── SpotController.php           # Flujo de upload/validación clásico
└── SiomaController.php          # Proxy a API Sioma (fincas/lotes)

app/Services/
├── ApiSiomaClient.php           # Cliente HTTP Sioma
└── SpotValidationService.php    # Validador PHP (fallback)

python-validator/
└── app/{main.py, validators.py} # FastAPI + Pandas
```

---

## 🧰 Troubleshooting

- “Style is not done loading” en Mapbox: el componente espera a que cargue el estilo antes de agregar capas.
- “Out of Memory”: selecciona un lote; el mapa limita spots y líneas progresivamente.
- 500 al descargar corregidos: usa `/api/v1/map/download-corrected` (implementado en `MapController`).
- Token de Mapbox inválido: revisa `VITE_MAPBOX_TOKEN` y reinicia `npm run dev`.

---

## 📄 Licencia

MIT License
