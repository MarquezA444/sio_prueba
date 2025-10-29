import { useState, useMemo } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';

// Token de acceso de Mapbox
const MAPBOX_TOKEN = 'pk.eyJ1Ijoibmljb2xhczE4LSIsImEiOiJjbWhiaWM4b2IwaG14MmlxMGxyMnNhb3UzIn0.stPqraeqf8gbCctt4D4NiA';

/**
 * Componente MapboxSpotsMap - Mapa interactivo para visualizar spots con Mapbox
 * Similar a SpotsMap pero usando Mapbox en lugar de Leaflet
 * 
 * Props:
 * @param {Array} spots - Array de spots a mostrar [{ latitud, longitud, linea, posicion, lote }]
 * @param {string} selectedLote - Lote seleccionado para filtrar
 * @param {boolean} showLines - Mostrar líneas entre spots (default: true)
 * @param {boolean} showPerimeter - Mostrar perímetro (default: false)
 * @param {string} height - Altura del mapa (default: '500px')
 */
export default function MapboxSpotsMap({ 
    spots = [], 
    selectedLote = '', 
    showLines = true, 
    showPerimeter = false, 
    height = '500px' 
}) {
    const [selectedSpot, setSelectedSpot] = useState(null);
    const [viewState, setViewState] = useState({
        latitude: 7.3365,  // Coordenadas por defecto de Colombia
        longitude: -76.7232,
        zoom: 15
    });

    // Filtrar spots por lote si está seleccionado
    const filteredSpots = useMemo(() => {
        if (!selectedLote) return spots;
        return spots.filter(spot => spot.lote === selectedLote);
    }, [spots, selectedLote]);

    // Calcular centro del mapa basado en los spots
    const mapCenter = useMemo(() => {
        if (filteredSpots.length === 0) return { lat: 7.3365, lng: -76.7232 };
        
        const latAvg = filteredSpots.reduce((sum, spot) => sum + (spot.latitud || 0), 0) / filteredSpots.length;
        const lonAvg = filteredSpots.reduce((sum, spot) => sum + (spot.longitud || 0), 0) / filteredSpots.length;
        
        return { lat: latAvg, lng: lonAvg };
    }, [filteredSpots]);

    // Actualizar vista si hay spots
    useMemo(() => {
        if (filteredSpots.length > 0 && mapCenter.lat && mapCenter.lng) {
            setViewState({
                latitude: mapCenter.lat,
                longitude: mapCenter.lng,
                zoom: 15
            });
        }
    }, [mapCenter, filteredSpots.length]);

    // Agrupar spots por línea para dibujar líneas
    const spotsByLine = useMemo(() => {
        const grouped = {};
        filteredSpots.forEach(spot => {
            const linea = spot.linea || 'sin-linea';
            if (!grouped[linea]) {
                grouped[linea] = [];
            }
            grouped[linea].push(spot);
        });
        
        // Ordenar cada línea por posición
        Object.keys(grouped).forEach(linea => {
            grouped[linea].sort((a, b) => (a.posicion || 0) - (b.posicion || 0));
        });
        
        return grouped;
    }, [filteredSpots]);

    if (filteredSpots.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg border border-gray-300">
                <p className="text-gray-500 text-center">
                    {selectedLote ? 'No hay datos para el lote seleccionado' : 'No hay datos para mostrar'}
                </p>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: height, borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                mapboxAccessToken={MAPBOX_TOKEN}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/satellite-v9"
            >
                {/* Renderizar marcadores */}
                {filteredSpots.map((spot, idx) => {
                    const lineaColor = `hsl(${(parseInt(spot.linea) || 0) * 60 % 360}, 70%, 50%)`;
                    
                    return (
                        <Marker
                            key={idx}
                            longitude={spot.longitud}
                            latitude={spot.latitud}
                            anchor="center"
                            onClick={(e) => {
                                e.originalEvent.stopPropagation();
                                setSelectedSpot(spot);
                            }}
                        >
                            <div
                                style={{
                                    backgroundColor: lineaColor,
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    border: '2px solid white',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                }}
                                title={`Línea ${spot.linea} - Posición ${spot.posicion}`}
                            />
                        </Marker>
                    );
                })}

                {/* Popup para mostrar información del spot */}
                {selectedSpot && (
                    <Popup
                        longitude={selectedSpot.longitud}
                        latitude={selectedSpot.latitud}
                        anchor="bottom"
                        onClose={() => setSelectedSpot(null)}
                        closeButton={true}
                        closeOnClick={false}
                    >
                        <div className="p-2" style={{ minWidth: '200px' }}>
                            <div className="font-semibold mb-2 text-gray-900">🌴 Spot #{filteredSpots.indexOf(selectedSpot) + 1}</div>
                            <div className="text-sm space-y-1">
                                <div><strong>Línea:</strong> {selectedSpot.linea}</div>
                                <div><strong>Posición:</strong> {selectedSpot.posicion}</div>
                                <div><strong>Lote:</strong> {selectedSpot.lote}</div>
                                <div><strong>Lat:</strong> {selectedSpot.latitud?.toFixed(6)}</div>
                                <div><strong>Lon:</strong> {selectedSpot.longitud?.toFixed(6)}</div>
                            </div>
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    );
}

