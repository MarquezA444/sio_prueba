import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix para iconos de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function SpotsMap({ spots, selectedLote, showLines = true, showPerimeter = false, height = '500px' }) {
    // Filtrar spots por lote si está seleccionado
    const filteredSpots = selectedLote 
        ? spots.filter(spot => spot.lote === selectedLote)
        : spots;

    if (filteredSpots.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg border border-gray-300">
                <p className="text-gray-500 text-center">
                    {selectedLote ? 'No hay datos para el lote seleccionado' : 'No hay datos para mostrar'}
                </p>
            </div>
        );
    }

    // Calcular centro del mapa
    const latAvg = filteredSpots.reduce((sum, spot) => sum + (spot.latitud || 0), 0) / filteredSpots.length;
    const lonAvg = filteredSpots.reduce((sum, spot) => sum + (spot.longitud || 0), 0) / filteredSpots.length;

    // Agrupar spots por línea
    const spotsByLine = {};
    filteredSpots.forEach(spot => {
        const linea = spot.linea || 'sin-linea';
        if (!spotsByLine[linea]) {
            spotsByLine[linea] = [];
        }
        spotsByLine[linea].push(spot);
    });

    // Ordenar cada línea por posición
    Object.keys(spotsByLine).forEach(linea => {
        spotsByLine[linea].sort((a, b) => (a.posicion || 0) - (b.posicion || 0));
    });

    // Generar polilíneas para cada línea
    const polylines = Object.entries(spotsByLine).map(([linea, spots]) => ({
        linea,
        positions: spots.map(spot => [spot.latitud, spot.longitud]),
        color: `hsl(${(parseInt(linea) || 0) * 60 % 360}, 70%, 50%)`,
    }));

    // Calcular perímetro aproximado (convex hull simple)
    const getConvexHull = (points) => {
        if (points.length < 3) return points;
        
        // Graham scan simplificado
        points.sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]);
        
        const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
        
        const lower = [];
        for (let i = 0; i < points.length; i++) {
            while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0) {
                lower.pop();
            }
            lower.push(points[i]);
        }
        
        const upper = [];
        for (let i = points.length - 1; i >= 0; i--) {
            while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0) {
                upper.pop();
            }
            upper.push(points[i]);
        }
        
        upper.pop();
        lower.pop();
        return lower.concat(upper);
    };

    const perimeterPoints = showPerimeter && filteredSpots.length > 2
        ? getConvexHull(filteredSpots.map(spot => [spot.latitud, spot.longitud]))
        : [];

    return (
        <div className="w-full rounded-lg overflow-hidden border border-gray-300" style={{ height }}>
            <MapContainer
                center={[latAvg, lonAvg]}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Dibujar perímetro del lote */}
                {showPerimeter && perimeterPoints.length > 0 && (
                    <Polygon
                        positions={perimeterPoints}
                        pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 3 }}
                    />
                )}

                {/* Dibujar líneas */}
                {showLines && polylines.map((polyline, idx) => (
                    <Polyline
                        key={`line-${idx}`}
                        positions={polyline.positions}
                        pathOptions={{ color: polyline.color, weight: 3, opacity: 0.7 }}
                    />
                ))}

                {/* Dibujar marcadores */}
                {filteredSpots.map((spot, idx) => (
                    <Marker key={`spot-${idx}`} position={[spot.latitud, spot.longitud]}>
                        <Popup>
                            <div className="text-sm">
                                <div className="font-semibold mb-1">🌴 Spot #{idx + 1}</div>
                                <div><strong>Línea:</strong> {spot.linea}</div>
                                <div><strong>Posición:</strong> {spot.posicion}</div>
                                <div><strong>Lote:</strong> {spot.lote}</div>
                                <div><strong>Lat:</strong> {spot.latitud}</div>
                                <div><strong>Lon:</strong> {spot.longitud}</div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}

