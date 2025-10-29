# 🗺️ Implementación de Mapbox en React - Guía Completa

## 📦 1. Instalación de Dependencias

Ya se han instalado las siguientes librerías:

```bash
npm install mapbox-gl react-map-gl
```

**Paquetes instalados:**
- `mapbox-gl`: Librería principal de Mapbox para JavaScript
- `react-map-gl`: Wrapper de React para mapbox-gl

---

## 🎨 2. Configuración de CSS

El CSS de Mapbox ya está importado en `resources/js/app.jsx`:

```javascript
import 'mapbox-gl/dist/mapbox-gl.css';
```

**Ubicación:** `resources/js/app.jsx` (línea 4)

Este import es **obligatorio** para que el mapa se renderice correctamente con todos sus estilos.

---

## 🧩 3. Componentes Creados

### 3.1. MapboxMap.jsx - Mapa Básico Interactivo

**Ubicación:** `resources/js/Components/MapboxMap.jsx`

**Características:**
- ✅ Estado inicial configurable (latitud, longitud, zoom)
- ✅ Interactivo con `onMove` para actualizar el estado
- ✅ Marcador por defecto en Torre Eiffel
- ✅ Soporte para múltiples marcadores personalizados
- ✅ Token de Mapbox configurado
- ✅ Tamaño configurable (por defecto 100% ancho x 500px alto)

**Ejemplo de uso básico:**

```jsx
import MapboxMap from '@/Components/MapboxMap';

function MiComponente() {
    return (
        <MapboxMap 
            initialLatitude={48.8584}
            initialLongitude={2.2945}
            initialZoom={12}
            height="500px"
        />
    );
}
```

**Ejemplo con marcadores personalizados:**

```jsx
import MapboxMap from '@/Components/MapboxMap';

function MiComponente() {
    const markers = [
        {
            lat: 48.8584,
            lng: 2.2945,
            label: 'Torre Eiffel',
            color: '#ef4444',
            icon: '🗼'
        },
        {
            lat: 48.8606,
            lng: 2.3376,
            label: 'Louvre',
            color: '#3b82f6',
            icon: '🏛️'
        }
    ];

    return (
        <MapboxMap 
            markers={markers}
            height="600px"
            onMarkerClick={(marker) => {
                console.log('Marcador clickeado:', marker);
            }}
        />
    );
}
```

### 3.2. MapboxSpotsMap.jsx - Mapa para Spots (Alternativa a Leaflet)

**Ubicación:** `resources/js/Components/MapboxSpotsMap.jsx`

**Características:**
- ✅ Diseñado para mostrar spots de palmas
- ✅ Filtrado por lote
- ✅ Popups informativos
- ✅ Marcadores coloreados por línea
- ✅ Centro automático basado en los spots

**Ejemplo de uso:**

```jsx
import MapboxSpotsMap from '@/Components/MapboxSpotsMap';

function Dashboard() {
    const spots = [
        {
            latitud: 7.33657685,
            longitud: -76.72322992,
            linea: 1,
            posicion: 1,
            lote: 'Lote A'
        },
        // ... más spots
    ];

    return (
        <MapboxSpotsMap 
            spots={spots}
            selectedLote=""
            showLines={true}
            height="600px"
        />
    );
}
```

---

## 🚀 4. Integración en el Dashboard

Para usar Mapbox en lugar de Leaflet en el Dashboard:

### Opción A: Reemplazar el mapa existente

En `resources/js/Pages/Dashboard.jsx`, busca la sección del mapa y reemplaza:

```jsx
// ANTES (Leaflet)
import SpotsMap from '@/Components/SpotsMap';

// DESPUÉS (Mapbox)
import MapboxSpotsMap from '@/Components/MapboxSpotsMap';
```

Y cambia el componente:

```jsx
// ANTES
<SpotsMap 
    spots={spotsData}
    selectedLote={selectedLote}
    showLines={true}
    showPerimeter={true}
    height="600px"
/>

// DESPUÉS
<MapboxSpotsMap 
    spots={spotsData}
    selectedLote={selectedLote}
    showLines={true}
    height="600px"
/>
```

### Opción B: Agregar un mapa de prueba

Agrega una nueva sección en el Dashboard para probar Mapbox:

```jsx
import MapboxMap from '@/Components/MapboxMap';

// Dentro del return del componente Dashboard
<div className="mt-6 overflow-hidden bg-white shadow-sm sm:rounded-lg">
    <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🗺️ Mapa de Prueba - Mapbox
        </h3>
        <MapboxMap 
            initialLatitude={48.8584}
            initialLongitude={2.2945}
            initialZoom={12}
            height="400px"
        />
    </div>
</div>
```

---

## 📝 5. Props del Componente MapboxMap

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `initialLatitude` | number | 48.8584 | Latitud inicial del mapa |
| `initialLongitude` | number | 2.2945 | Longitud inicial del mapa |
| `initialZoom` | number | 12 | Nivel de zoom inicial |
| `markers` | Array | [] | Array de marcadores a mostrar |
| `height` | string | '500px' | Altura del mapa |
| `interactive` | boolean | true | Si el mapa es interactivo |
| `onMarkerClick` | function | null | Callback al hacer clic en marcador |

---

## 🎯 6. Formato de Marcadores

Cada marcador en el array `markers` debe tener:

```javascript
{
    lat: 48.8584,           // Latitud (o 'latitud')
    lng: 2.2945,            // Longitud (o 'longitud', 'lon')
    label: 'Mi Marcador',   // Texto a mostrar (opcional)
    color: '#ef4444',       // Color del marcador (opcional)
    icon: '📍',             // Emoji o ícono (opcional)
    size: '30px'            // Tamaño del marcador (opcional)
}
```

---

## ✅ 7. Token de Acceso

El token ya está configurado en ambos componentes:

```javascript
const MAPBOX_TOKEN = 'pk.eyJ1Ijoibmljb2xhczE4LSIsImEiOiJjbWhiaWM4b2IwaG14MmlxMGxyMnNhb3UzIn0.stPqraeqf8gbCctt4D4NiA';
```

**Nota:** Para producción, considera mover el token a una variable de entorno.

---

## 🔧 8. Compilar los Assets

Después de los cambios, ejecuta:

```bash
npm run build
```

O para desarrollo con hot-reload:

```bash
npm run dev
```

---

## 🎨 9. Estilos de Mapa Disponibles

Puedes cambiar el estilo del mapa modificando el prop `mapStyle`:

- `mapbox://styles/mapbox/streets-v12` - Calles (default)
- `mapbox://styles/mapbox/outdoors-v12` - Exterior
- `mapbox://styles/mapbox/light-v11` - Claro
- `mapbox://styles/mapbox/dark-v11` - Oscuro
- `mapbox://styles/mapbox/satellite-v9` - Satelital
- `mapbox://styles/mapbox/satellite-streets-v12` - Satelital + calles

Ejemplo:

```jsx
<Map
    mapStyle="mapbox://styles/mapbox/satellite-v9"
    // ... otras props
/>
```

---

## 📚 10. Documentación Adicional

- [Documentación de react-map-gl](https://visgl.github.io/react-map-gl/)
- [Documentación de Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [Mapbox Styles](https://docs.mapbox.com/api/maps/styles/)

---

## ✨ Características Implementadas

✅ Instalación completa  
✅ CSS configurado correctamente  
✅ Componente principal con estado inicial  
✅ Token de acceso configurado  
✅ Marcador por defecto en Torre Eiffel  
✅ Mapa interactivo con `onMove`  
✅ Tamaño del contenedor definido (100% x 500px)  
✅ Soporte para múltiples marcadores  
✅ Popups informativos  
✅ Filtrado y agrupación de datos  

¡El mapa está listo para usar! 🎉

