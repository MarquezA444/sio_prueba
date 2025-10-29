import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

const MapboxMap = ({ spots = [], selectedLote = null, fincaId = null }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    // Configuración del mapa
    const MAPBOX_TOKEN = 'pk.eyJ1Ijoibmljb2xhczE4LSIsImEiOiJjbWhiaWM4b2IwaG14MmlxMGxyMnNhb3UzIn0.stPqraeqf8gbCctt4D4NiA'; // Token público de ejemplo

    useEffect(() => {
        if (map.current) return; // Evitar múltiples inicializaciones

        // Configurar token de Mapbox
        mapboxgl.accessToken = MAPBOX_TOKEN;

        // Crear mapa
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/satellite-streets-v12',
            center: [-73.6557, 3.8865], // Centro aproximado de los lotes
            zoom: 12.5
        });

        map.current.on('load', () => {
            setMapLoaded(true);
            loadSpotsData();
        });

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (mapLoaded && spots.length > 0) {
            loadSpotsData();
        }
    }, [spots, selectedLote, mapLoaded]);

    const loadSpotsData = () => {
        if (!map.current || !mapLoaded) return;

        // Limpiar fuentes y capas existentes
        if (map.current.getSource('spots')) {
            map.current.removeLayer('spots-circles');
            map.current.removeLayer('spots-labels');
            map.current.removeSource('spots');
        }

        // Filtrar spots por lote seleccionado
        const filteredSpots = selectedLote 
            ? spots.filter(spot => spot.lote === selectedLote)
            : spots.slice(0, 1000); // Limitar a 1000 spots máximo para rendimiento

        if (filteredSpots.length === 0) return;

        // Mostrar mensaje si hay muchos spots
        if (spots.length > 1000 && !selectedLote) {
            console.warn(`Mostrando solo los primeros 1000 spots de ${spots.length} totales. Selecciona un lote específico para ver todos los datos.`);
        }

        // Crear GeoJSON para los spots
        const spotsGeoJSON = {
            type: 'FeatureCollection',
            features: filteredSpots.map((spot, index) => ({
                type: 'Feature',
                properties: {
                    id: index,
                    lote: spot.lote,
                    linea: spot.linea,
                    posicion: spot.posicion,
                    latitud: spot.latitud,
                    longitud: spot.longitud
                },
                geometry: {
                    type: 'Point',
                    coordinates: [spot.longitud, spot.latitud]
                }
            }))
        };

        // Agregar fuente de datos
        map.current.addSource('spots', {
            type: 'geojson',
            data: spotsGeoJSON
        });

        // Capa de círculos para los spots
        map.current.addLayer({
            id: 'spots-circles',
            type: 'circle',
            source: 'spots',
            paint: {
                'circle-color': [
                    'match',
                    ['get', 'lote'],
                    '62-LA CEIBA', '#4c00ff',
                    '63-CERCA ELECTRICA', '#00ff73',
                    '67-CASA ROJA', '#ff0000',
                    '83 - EL MIRADOR', '#ffbb00',
                    '#CCCCCC'
                ],
                'circle-radius': 6,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
            }
        });

        // Capa de etiquetas para los spots
        map.current.addLayer({
            id: 'spots-labels',
            type: 'symbol',
            source: 'spots',
            layout: {
                'text-field': ['get', 'posicion'],
                'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                'text-offset': [0, 0],
                'text-anchor': 'center',
                'text-size': 10
            },
            paint: {
                'text-color': '#ffffff',
                'text-halo-color': '#000000',
                'text-halo-width': 1
            }
        });

        // Ajustar vista para mostrar todos los spots (con límite de tiempo)
        if (filteredSpots.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            filteredSpots.forEach(spot => {
                bounds.extend([spot.longitud, spot.latitud]);
            });
            
            // Usar setTimeout para evitar bloqueos en la UI
            setTimeout(() => {
                map.current.fitBounds(bounds, {
                    padding: 50,
                    maxZoom: 16,
                    duration: 1000 // Animación más rápida
                });
            }, 100);
        }

        // Agregar interacción con popups
        map.current.on('click', 'spots-circles', (e) => {
            const feature = e.features[0];
            const properties = feature.properties;
            
            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`
                    <div class="p-2">
                        <h3 class="font-bold text-sm">Spot ${properties.posicion}</h3>
                        <p class="text-xs"><strong>Lote:</strong> ${properties.lote}</p>
                        <p class="text-xs"><strong>Línea:</strong> ${properties.linea}</p>
                        <p class="text-xs"><strong>Posición:</strong> ${properties.posicion}</p>
                        <p class="text-xs"><strong>Coordenadas:</strong> ${properties.latitud.toFixed(6)}, ${properties.longitud.toFixed(6)}</p>
                    </div>
                `)
                .addTo(map.current);
        });

        // Cambiar cursor al pasar sobre los spots
        map.current.on('mouseenter', 'spots-circles', () => {
            map.current.getCanvas().style.cursor = 'pointer';
        });

        map.current.on('mouseleave', 'spots-circles', () => {
            map.current.getCanvas().style.cursor = '';
        });
    };

    return (
        <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-300 relative">
            <div ref={mapContainer} className="w-full h-full" />
            {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Cargando mapa...</p>
                    </div>
                </div>
            )}
            {mapLoaded && spots.length > 1000 && !selectedLote && (
                <div className="absolute top-2 right-2 bg-yellow-100 border border-yellow-400 rounded-lg p-2 max-w-xs">
                    <div className="flex items-center gap-2">
                        <span className="text-yellow-600">⚠️</span>
                        <div className="text-xs text-yellow-800">
                            <p className="font-semibold">Mostrando 1000 de {spots.length} spots</p>
                            <p>Selecciona un lote para ver todos los datos</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapboxMap;