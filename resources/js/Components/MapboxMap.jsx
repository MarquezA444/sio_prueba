import { useState } from 'react';
import Map, { Marker } from 'react-map-gl';

// Token de acceso de Mapbox
const MAPBOX_TOKEN = 'pk.eyJ1Ijoibmljb2xhczE4LSIsImEiOiJjbWhiaWM4b2IwaG14MmlxMGxyMnNhb3UzIn0.stPqraeqf8gbCctt4D4NiA';

/**
 * Componente MapboxMap - Mapa interactivo con Mapbox
 * 
 * Props:
 * @param {number} initialLatitude - Latitud inicial del mapa (default: 48.8584 - Torre Eiffel)
 * @param {number} initialLongitude - Longitud inicial del mapa (default: 2.2945 - Torre Eiffel)
 * @param {number} initialZoom - Nivel de zoom inicial (default: 12)
 * @param {Array} markers - Array de marcadores a mostrar [{ lat, lng, label }]
 * @param {string} height - Altura del mapa (default: '500px')
 * @param {boolean} interactive - Si el mapa es interactivo (default: true)
 * @param {function} onMarkerClick - Callback cuando se hace clic en un marcador
 */
export default function MapboxMap({
    initialLatitude = 48.8584,  // Torre Eiffel
    initialLongitude = 2.2945,  // Torre Eiffel
    initialZoom = 12,
    markers = [],
    height = '500px',
    interactive = true,
    onMarkerClick = null
}) {
    // Estado para la vista del mapa (latitud, longitud, zoom)
    const [viewState, setViewState] = useState({
        latitude: initialLatitude,
        longitude: initialLongitude,
        zoom: initialZoom
    });

    return (
        <div style={{ width: '100%', height: height, borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <Map
                {...viewState}
                onMove={evt => {
                    // Actualizar el estado cuando el usuario mueve el mapa
                    setViewState(evt.viewState);
                }}
                mapboxAccessToken={MAPBOX_TOKEN}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                interactive={interactive}
            >
                {/* Marcador por defecto en Torre Eiffel si no hay marcadores */}
                {markers.length === 0 && (
                    <Marker
                        longitude={initialLongitude}
                        latitude={initialLatitude}
                        anchor="bottom"
                        onClick={() => {
                            if (onMarkerClick) {
                                onMarkerClick({ lat: initialLatitude, lng: initialLongitude, label: 'Torre Eiffel' });
                            }
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: '#3b82f6',
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                border: '3px solid white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                            }}
                            title="Torre Eiffel"
                        >
                            <span style={{ color: 'white', fontSize: '16px' }}>📍</span>
                        </div>
                    </Marker>
                )}

                {/* Renderizar marcadores personalizados */}
                {markers.map((marker, index) => (
                    <Marker
                        key={index}
                        longitude={marker.lng || marker.longitud || marker.longitude}
                        latitude={marker.lat || marker.latitud || marker.latitude}
                        anchor="bottom"
                        onClick={() => {
                            if (onMarkerClick) {
                                onMarkerClick(marker);
                            }
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: marker.color || '#ef4444',
                                width: marker.size || '30px',
                                height: marker.size || '30px',
                                borderRadius: '50%',
                                border: '3px solid white',
                                cursor: onMarkerClick ? 'pointer' : 'default',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                position: 'relative'
                            }}
                            title={marker.label || marker.nombre || `Marcador ${index + 1}`}
                        >
                            <span style={{ color: 'white', fontSize: '14px' }}>
                                {marker.icon || '📍'}
                            </span>
                            {marker.label && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: '100%',
                                        marginBottom: '5px',
                                        backgroundColor: 'rgba(0,0,0,0.8)',
                                        color: 'white',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        whiteSpace: 'nowrap',
                                        pointerEvents: 'none'
                                    }}
                                >
                                    {marker.label}
                                </div>
                            )}
                        </div>
                    </Marker>
                ))}
            </Map>
        </div>
    );
}

