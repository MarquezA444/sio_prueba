import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

const MapboxMap = ({ spots = [], selectedLote = null, fincaId = null }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [currentFilteredSpots, setCurrentFilteredSpots] = useState([]);

    // Token de Mapbox
const MAPBOX_TOKEN = 'pk.eyJ1Ijoibmljb2xhczE4LSIsImEiOiJjbWhiaWM4b2IwaG14MmlxMGxyMnNhb3UzIn0.stPqraeqf8gbCctt4D4NiA';

    useEffect(() => {
        if (map.current) return;

        mapboxgl.accessToken = MAPBOX_TOKEN;

        // Centro aproximado de los lotes
        const centerLongitude = -73.6557;
        const centerLatitude = 3.8865;

        // Crear mapa con configuración 3D
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/satellite-streets-v12',
            center: [centerLongitude, centerLatitude],
            zoom: 12.5,
            pitch: 45, // Ángulo de inclinación para efecto 3D
            bearing: -17.6, // Rotación inicial
            antialias: true // Mejor calidad visual
        });

        // Agregar controles de navegación
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

        map.current.on('load', () => {
            // Activar terreno 3D
            map.current.addSource('mapbox-dem', {
                'type': 'raster-dem',
                'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                'tileSize': 512,
                'maxzoom': 14
            });

            map.current.setTerrain({ 
                'source': 'mapbox-dem', 
                'exaggeration': 1.5 
            });

            // Animación inicial dramática
            setTimeout(() => {
                map.current.flyTo({
                    center: [centerLongitude, centerLatitude],
                    zoom: 15,
                    pitch: 60,
                    bearing: 0,
                    speed: 1.2,
                    curve: 1.5,
                    essential: true
                });
            }, 500);

            setMapLoaded(true);
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

        // Limpiar capas existentes de manera segura
        try {
            ['spots-clusters', 'spots-cluster-count', 'spots-unclustered', 'spots-labels', 'lotes-polygons-fill', 'lotes-polygons-line', 'lotes-labels'].forEach(layerId => {
                if (map.current.getLayer(layerId)) {
                    map.current.removeLayer(layerId);
                }
            });

            // Limpiar fuentes
            ['spots', 'lotes-polygons'].forEach(sourceId => {
                if (map.current.getSource(sourceId)) {
                    map.current.removeSource(sourceId);
                }
            });
        } catch (error) {
            console.warn('Error limpiando capas:', error);
        }

        // Filtrar spots por lote seleccionado
        const filteredSpots = selectedLote 
            ? spots.filter(spot => spot.lote === selectedLote)
            : spots.slice(0, 1000);

        if (filteredSpots.length === 0) {
            console.log('No hay spots para mostrar');
            setCurrentFilteredSpots([]);
            return;
        }

        // Actualizar estado
        setCurrentFilteredSpots(filteredSpots);

        // Crear GeoJSON para spots con clustering
        const spotsGeoJSON = {
            type: 'FeatureCollection',
            features: filteredSpots.map((spot, index) => ({
                type: 'Feature',
                properties: {
                    id: index,
                    lote: spot.lote || 'Sin lote',
                    linea: spot.linea || 'N/A',
                    posicion: spot.posicion || 0,
                    latitud: spot.latitud,
                    longitud: spot.longitud
                },
                geometry: {
                    type: 'Point',
                    coordinates: [spot.longitud, spot.latitud]
                }
            }))
        };

        // Agregar fuente con clustering
        map.current.addSource('spots', {
            type: 'geojson',
            data: spotsGeoJSON,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50
        });

        // CAPA 1: Clusters (grupos de puntos)
        map.current.addLayer({
            id: 'spots-clusters',
            type: 'circle',
            source: 'spots',
            filter: ['has', 'point_count'],
            paint: {
                'circle-color': [
                    'step',
                    ['get', 'point_count'],
                    '#51bbd6', // Azul claro
                    100,
                    '#f1f075', // Amarillo
                    750,
                    '#f28cb1' // Rosa
                ],
                'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    20, // Radio base
                    100,
                    30,
                    750,
                    40
                ],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
            }
        });

        // CAPA 2: Contador de clusters
        map.current.addLayer({
            id: 'spots-cluster-count',
            type: 'symbol',
            source: 'spots',
            filter: ['has', 'point_count'],
            layout: {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12
            },
            paint: {
                'text-color': '#000000'
            }
        });

        // CAPA 3: Puntos individuales (cuando no están en cluster)
        map.current.addLayer({
            id: 'spots-unclustered',
            type: 'circle',
            source: 'spots',
            filter: ['!', ['has', 'point_count']],
            paint: {
                'circle-color': [
                    'match',
                    ['get', 'lote'],
                    '62-LA CEIBA', '#1f78b4',
                    '63-CERCA ELECTRICA', '#33a02c',
                    '67-CASA ROJA', '#e31a1c',
                    '83 - EL MIRADOR', '#ff7f00',
                    '#CCCCCC'
                ],
                'circle-radius': 6,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
            }
        });

        // CAPA 4: Etiquetas de posición en puntos individuales
        map.current.addLayer({
            id: 'spots-labels',
            type: 'symbol',
            source: 'spots',
            filter: ['!', ['has', 'point_count']],
            minzoom: 15,
            layout: {
                'text-field': ['get', 'posicion'],
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 10,
                'text-anchor': 'center'
            },
            paint: {
                'text-color': '#ffffff',
                'text-halo-color': '#000000',
                'text-halo-width': 1.5
            }
        });

        // Crear polígonos para los lotes (aproximados)
        const loteGroups = {};
        filteredSpots.forEach(spot => {
            if (!loteGroups[spot.lote]) {
                loteGroups[spot.lote] = [];
            }
            loteGroups[spot.lote].push([spot.longitud, spot.latitud]);
        });

        // Crear polígonos convexos (simplificado)
        const lotePolygons = Object.entries(loteGroups).map(([loteName, coords]) => {
            if (coords.length < 3) return null;
            
            // Calcular bounding box simple
            const lons = coords.map(c => c[0]);
            const lats = coords.map(c => c[1]);
            const minLon = Math.min(...lons);
            const maxLon = Math.max(...lons);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            
            return {
                type: 'Feature',
                properties: { Lote: loteName },
                geometry: {
                    type: 'Polygon',
                    coordinates: [[
                        [minLon, minLat],
                        [maxLon, minLat],
                        [maxLon, maxLat],
                        [minLon, maxLat],
                        [minLon, minLat]
                    ]]
                }
            };
        }).filter(Boolean);

        if (lotePolygons.length > 0) {
            map.current.addSource('lotes-polygons', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: lotePolygons
                }
            });

            // Relleno de polígonos
            map.current.addLayer({
                id: 'lotes-polygons-fill',
                type: 'fill',
                source: 'lotes-polygons',
                paint: {
                    'fill-color': [
                        'match',
                        ['get', 'Lote'],
                        '62-LA CEIBA', '#1f78b4',
                        '63-CERCA ELECTRICA', '#33a02c',
                        '67-CASA ROJA', '#e31a1c',
                        '83 - EL MIRADOR', '#ff7f00',
                        '#CCCCCC'
                    ],
                    'fill-opacity': 0.25
                }
            }, 'spots-clusters');

            // Borde de polígonos (estilo profesional)
            map.current.addLayer({
                id: 'lotes-polygons-line',
                type: 'line',
                source: 'lotes-polygons',
                paint: {
                    'line-color': '#FFD700', // Amarillo dorado
                    'line-width': 3,
                    'line-dasharray': [4, 2]
                }
            }, 'spots-clusters');

            // Etiquetas de lotes
            map.current.addLayer({
                id: 'lotes-labels',
                type: 'symbol',
                source: 'lotes-polygons',
                layout: {
                    'text-field': ['get', 'Lote'],
                    'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
                    'text-size': 14,
                    'text-anchor': 'center'
                },
                paint: {
                    'text-color': '#FFFFFF',
                    'text-halo-color': '#000000',
                    'text-halo-width': 2
                }
            });
        }

        // Ajustar vista
        if (filteredSpots.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            filteredSpots.forEach(spot => {
                bounds.extend([spot.longitud, spot.latitud]);
            });
            
            setTimeout(() => {
                map.current.fitBounds(bounds, {
                    padding: 80,
                    maxZoom: 16,
                    duration: 1500
                });
            }, 200);
        }

        // Agregar event listeners de manera segura
        // Remover listeners previos si existen
        if (map.current.getLayer('spots-clusters')) {
            map.current.off('click', 'spots-clusters');
            map.current.off('mouseenter', 'spots-clusters');
            map.current.off('mouseleave', 'spots-clusters');
        }

        if (map.current.getLayer('spots-unclustered')) {
            map.current.off('click', 'spots-unclustered');
            map.current.off('mouseenter', 'spots-unclustered');
            map.current.off('mouseleave', 'spots-unclustered');
        }

        // Interacción con clusters: expandir al hacer clic
        map.current.on('click', 'spots-clusters', (e) => {
            const features = map.current.queryRenderedFeatures(e.point, {
                layers: ['spots-clusters']
            });
            
            if (features.length > 0) {
                const clusterId = features[0].properties.cluster_id;
                map.current.getSource('spots').getClusterExpansionZoom(
                    clusterId,
                    (err, zoom) => {
                        if (err) return;

                        map.current.easeTo({
                            center: features[0].geometry.coordinates,
                            zoom: zoom,
                            duration: 800
                        });
                    }
                );
            }
        });

        // Popup para puntos individuales
        map.current.on('click', 'spots-unclustered', (e) => {
            const feature = e.features[0];
            const props = feature.properties;
            
            new mapboxgl.Popup({
                closeButton: true,
                closeOnClick: true,
                className: 'spot-popup'
            })
                .setLngLat(e.lngLat)
                .setHTML(`
                    <div class="p-3 min-w-[200px]">
                        <h3 class="font-bold text-base mb-2 text-blue-900 border-b pb-2">🌴 Palma #${props.posicion}</h3>
                        <div class="space-y-1 text-sm">
                            <p><strong class="text-gray-700">Lote:</strong> <span class="text-gray-900">${props.lote}</span></p>
                            <p><strong class="text-gray-700">Línea:</strong> <span class="text-gray-900">${props.linea}</span></p>
                            <p><strong class="text-gray-700">Posición:</strong> <span class="text-gray-900">${props.posicion}</span></p>
                            <div class="mt-2 pt-2 border-t">
                                <p class="text-xs text-gray-600"><strong>Coordenadas:</strong></p>
                                <p class="text-xs font-mono text-gray-800">Lat: ${props.latitud.toFixed(7)}</p>
                                <p class="text-xs font-mono text-gray-800">Lon: ${props.longitud.toFixed(7)}</p>
                            </div>
                        </div>
                    </div>
                `)
                .addTo(map.current);
        });

        // Cambiar cursor en clusters y puntos
        map.current.on('mouseenter', 'spots-clusters', () => {
            map.current.getCanvas().style.cursor = 'pointer';
        });

        map.current.on('mouseleave', 'spots-clusters', () => {
            map.current.getCanvas().style.cursor = '';
        });

        map.current.on('mouseenter', 'spots-unclustered', () => {
            map.current.getCanvas().style.cursor = 'pointer';
        });

        map.current.on('mouseleave', 'spots-unclustered', () => {
            map.current.getCanvas().style.cursor = '';
        });
    };

    return (
        <div className="w-full rounded-lg overflow-hidden border-2 border-gray-300 shadow-lg relative" style={{ height: '600px' }}>
            <div ref={mapContainer} className="w-full h-full" />
            
            {/* Loading overlay */}
            {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-3"></div>
                        <p className="text-white font-semibold">Cargando Geo-Visor...</p>
                        <p className="text-gray-300 text-sm mt-1">Preparando visualización 3D</p>
                    </div>
                </div>
            )}
            
            {/* Warning para archivos grandes */}
            {mapLoaded && spots.length > 1000 && !selectedLote && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg shadow-xl p-3 max-w-xs">
                    <div className="flex items-start gap-2">
                        <span className="text-xl">⚠️</span>
                        <div className="text-xs">
                            <p className="font-bold">Dataset Grande Detectado</p>
                            <p className="mt-1">Mostrando 1,000 de {spots.length.toLocaleString()} spots</p>
                            <p className="mt-1 text-yellow-100">💡 Selecciona un lote específico para ver todos los datos</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Info panel */}
            {mapLoaded && currentFilteredSpots.length > 0 && (
                <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 rounded-lg shadow-lg p-3 text-xs">
                    <div className="font-semibold text-gray-900 mb-2">📊 Estadísticas del Mapa</div>
                    <div className="space-y-1 text-gray-700">
                        <p><strong>Total de Spots:</strong> {currentFilteredSpots.length.toLocaleString()}</p>
                        <p><strong>Total en Archivo:</strong> {spots.length.toLocaleString()}</p>
                        {selectedLote && (
                            <p><strong>Lote Activo:</strong> {selectedLote}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">🔍 Usa la rueda del mouse para hacer zoom</p>
                        <p className="text-xs text-gray-500">🖱️ Mantén Ctrl + arrastrar para rotar</p>
                    </div>
                                </div>
                            )}

            {/* Leyenda de colores */}
            {mapLoaded && (
                <div className="absolute top-4 left-4 bg-white bg-opacity-95 rounded-lg shadow-lg p-3">
                    <div className="font-semibold text-gray-900 mb-2 text-sm">Leyenda de Lotes</div>
                    <div className="space-y-1 text-xs">
                        {[
                            { name: '62-LA CEIBA', color: '#1f78b4' },
                            { name: '63-CERCA ELECTRICA', color: '#33a02c' },
                            { name: '67-CASA ROJA', color: '#e31a1c' },
                            { name: '83 - EL MIRADOR', color: '#ff7f00' }
                        ].map(lote => (
                            <div key={lote.name} className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full border-2 border-white shadow" style={{ backgroundColor: lote.color }}></div>
                                <span className="text-gray-700">{lote.name}</span>
                        </div>
                ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapboxMap;
