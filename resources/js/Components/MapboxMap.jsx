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
            // OPTIMIZACIÓN: Terreno 3D deshabilitado solo para archivos muy grandes
            if (spots.length < 5000) {
                try {
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
                } catch (terrainError) {
                    console.warn('Terreno 3D deshabilitado por optimización:', terrainError);
                }
            } else {
                console.log('Terreno 3D deshabilitado para optimización de memoria');
            }

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
        // Verificaciones más robustas antes de manipular el mapa
        if (!map.current || !mapLoaded) {
            console.log('Mapa no está listo');
            return;
        }

        // Verificar que el estilo del mapa esté completamente cargado
        if (!map.current.isStyleLoaded()) {
            console.log('Estilo del mapa no está cargado, esperando...');
            // Esperar a que el estilo se cargue completamente
            map.current.once('styledata', () => {
                setTimeout(() => loadSpotsData(), 100);
            });
            return;
        }

        // Limpiar capas existentes de manera segura
        try {
            const layersToRemove = ['spots-clusters', 'spots-cluster-count', 'spots-unclustered', 'spots-labels', 'spots-lines', 'lotes-polygons-fill', 'lotes-polygons-line', 'lotes-labels'];
            const sourcesToRemove = ['spots', 'spots-lines-src', 'lotes-polygons'];

            // Remover capas de manera segura
            layersToRemove.forEach(layerId => {
                try {
                    if (map.current.getLayer(layerId)) {
                        map.current.removeLayer(layerId);
                    }
                } catch (layerError) {
                    console.warn(`Error removiendo capa ${layerId}:`, layerError);
                }
            });

            // Remover fuentes de manera segura
            sourcesToRemove.forEach(sourceId => {
                try {
                    if (map.current.getSource(sourceId)) {
                        map.current.removeSource(sourceId);
                    }
                } catch (sourceError) {
                    console.warn(`Error removiendo fuente ${sourceId}:`, sourceError);
                }
            });
        } catch (error) {
            console.warn('Error general limpiando capas:', error);
            return; // Salir si hay error crítico
        }

        // OPTIMIZACIÓN: Límites equilibrados para evitar "Out of Memory"
        const MAX_SPOTS_WITHOUT_LOTE = 1500; // Aumentado de 500 a 1500
        const MAX_SPOTS_WITH_LOTE = 5000;     // Aumentado de 2000 a 5000
        
        // Filtrar spots por lote seleccionado con límites estrictos
        let filteredSpots;
        if (selectedLote) {
            filteredSpots = spots.filter(spot => spot.lote === selectedLote).slice(0, MAX_SPOTS_WITH_LOTE);
        } else {
            filteredSpots = spots.slice(0, MAX_SPOTS_WITHOUT_LOTE);
        }

        if (filteredSpots.length === 0) {
            console.log('No hay spots para mostrar');
            setCurrentFilteredSpots([]);
            return;
        }

        // Actualizar estado
        setCurrentFilteredSpots(filteredSpots);

        // OPTIMIZACIÓN: GeoJSON simplificado para reducir memoria
        const spotsGeoJSON = {
            type: 'FeatureCollection',
            features: filteredSpots.map((spot, index) => ({
                type: 'Feature',
                properties: {
                    id: index,
                    lote: spot.lote || 'Sin lote',
                    linea: spot.linea || 'N/A',
                    // Manejar posicion correctamente: puede ser 0 (válido) o null/undefined
                    posicion: spot.posicion !== null && spot.posicion !== undefined ? spot.posicion : null,
                    latitud: spot.latitud || null,
                    longitud: spot.longitud || null,
                    // Solo coordenadas necesarias, sin datos extra
                },
                geometry: {
                    type: 'Point',
                    coordinates: [spot.longitud, spot.latitud]
                }
            }))
        };

        // Agregar fuente con clustering de manera segura
        try {
            map.current.addSource('spots', {
                type: 'geojson',
                data: spotsGeoJSON,
                cluster: true,
                clusterMaxZoom: 14,
                clusterRadius: 50
            });
        } catch (sourceError) {
            console.error('Error agregando fuente spots:', sourceError);
            return;
        }

        // Agregar capas de manera segura
        try {
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
                filter: [
                    'all',
                    ['!', ['has', 'point_count']],
                    ['!=', ['get', 'posicion'], null],
                    ['!=', ['get', 'posicion'], ['literal', null]]
                ],
                minzoom: 12, // Reducido de 15 a 12 para ver las etiquetas antes
                layout: {
                    // Convertir posicion a string (solo mostrar si no es null)
                    'text-field': ['to-string', ['get', 'posicion']],
                    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                    'text-size': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        12, 9,  // Tamaño 9 en zoom 12
                        15, 11  // Tamaño 11 en zoom 15+
                    ],
                    'text-anchor': 'center'
                },
                paint: {
                    'text-color': '#ffffff',
                    'text-halo-color': '#000000',
                    'text-halo-width': 1.5,
                    'text-halo-blur': 1
                }
            });
        } catch (layerError) {
            console.error('Error agregando capas de spots:', layerError);
            return;
        }

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

        // === Líneas por línea de palma (conexión de spots ordenados por posición) ===
        const lineGroups = {};
        filteredSpots.forEach(spot => {
            const lineaKey = `${(spot.lote || 'Sin lote').toString().trim()}|||${(spot.linea || 'N/A').toString().trim()}`;
            if (!lineGroups[lineaKey]) lineGroups[lineaKey] = [];
            lineGroups[lineaKey].push({
                lon: spot.longitud,
                lat: spot.latitud,
                posicion: Number(spot.posicion) || 0,
                lote: spot.lote || 'Sin lote',
                linea: spot.linea || 'N/A',
            });
        });

        // Distancia Haversine en metros
        const distanceMeters = (a, b) => {
            const toRad = deg => (deg * Math.PI) / 180;
            const R = 6371000;
            const dLat = toRad(b.lat - a.lat);
            const dLon = toRad(b.lon - a.lon);
            const lat1 = toRad(a.lat);
            const lat2 = toRad(b.lat);
            const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
            return 2 * R * Math.asin(Math.sqrt(h));
        };

        // OPTIMIZACIÓN: Algoritmo más eficiente para líneas
        const MAX_GAP_METERS = 50;
        const MIN_POINTS_PER_LINE = 2;
        const MAX_POSITION_GAP = 10;
        const MAX_LINES_TO_PROCESS = 100; // Aumentado de 50 a 100 líneas

        const lineFeatures = [];
        const lineGroupsArray = Object.values(lineGroups);
        
        // OPTIMIZACIÓN: Procesar solo las primeras N líneas para evitar sobrecarga
        const linesToProcess = lineGroupsArray.slice(0, MAX_LINES_TO_PROCESS);
        
        linesToProcess.forEach(points => {
            if (points.length < MIN_POINTS_PER_LINE) return;
            
            // Ordenar por posición numérica
            points.sort((a, b) => a.posicion - b.posicion);
            
            // Algoritmo de reconstrucción inteligente
            const segments = [];
            let currentSegment = [points[0]];
            
            for (let i = 1; i < points.length; i++) {
                const prev = currentSegment[currentSegment.length - 1];
                const curr = points[i];
                const distance = distanceMeters(prev, curr);
                const positionGap = Math.abs(curr.posicion - prev.posicion);
                
                // Criterios más flexibles para continuar la línea
                const shouldContinue = (
                    distance <= MAX_GAP_METERS && 
                    positionGap <= MAX_POSITION_GAP &&
                    // Verificar que no haya un salto geográfico muy grande
                    distance < 100 // Límite absoluto de distancia
                );
                
                if (shouldContinue) {
                    currentSegment.push(curr);
                } else {
                    // Finalizar segmento actual si tiene suficientes puntos
                    if (currentSegment.length >= MIN_POINTS_PER_LINE) {
                        segments.push([...currentSegment]);
                    }
                    currentSegment = [curr];
                }
            }
            
            // Agregar último segmento
            if (currentSegment.length >= MIN_POINTS_PER_LINE) {
                segments.push(currentSegment);
            }
            
            // Crear LineString para cada segmento válido
            segments.forEach(segment => {
                lineFeatures.push({
                    type: 'Feature',
                    properties: { 
                        lote: segment[0].lote, 
                        linea: segment[0].linea,
                        puntos: segment.length,
                        rango: `${segment[0].posicion}-${segment[segment.length-1].posicion}`,
                        distancia_total: segment.reduce((total, point, i) => {
                            if (i === 0) return 0;
                            return total + distanceMeters(segment[i-1], point);
                        }, 0).toFixed(1) + 'm'
                    },
                    geometry: { 
                        type: 'LineString', 
                        coordinates: segment.map(p => [p.lon, p.lat]) 
                    },
                });
            });
        });

        // Algoritmo adicional: conectar segmentos cercanos de la misma línea
        const connectedFeatures = [];
        const processedSegments = new Set();
        
        lineFeatures.forEach((segment, index) => {
            if (processedSegments.has(index)) return;
            
            const connectedSegments = [segment];
            processedSegments.add(index);
            
            // Buscar otros segmentos de la misma línea que puedan conectarse
            lineFeatures.forEach((otherSegment, otherIndex) => {
                if (processedSegments.has(otherIndex)) return;
                if (segment.properties.lote !== otherSegment.properties.lote) return;
                if (segment.properties.linea !== otherSegment.properties.linea) return;
                
                const segmentCoords = segment.geometry.coordinates;
                const otherCoords = otherSegment.geometry.coordinates;
                
                // Calcular distancia entre extremos de los segmentos
                const lastPoint = segmentCoords[segmentCoords.length - 1];
                const firstPoint = otherCoords[0];
                const distance = distanceMeters(
                    { lat: lastPoint[1], lon: lastPoint[0] },
                    { lat: firstPoint[1], lon: firstPoint[0] }
                );
                
                // Si están cerca, conectarlos
                if (distance <= MAX_GAP_METERS) {
                    connectedSegments.push(otherSegment);
                    processedSegments.add(otherIndex);
                }
            });
            
            // Si hay múltiples segmentos conectados, crear uno solo
            if (connectedSegments.length > 1) {
                const allCoords = connectedSegments.flatMap(s => s.geometry.coordinates);
                const totalPoints = allCoords.length;
                const totalDistance = connectedSegments.reduce((sum, s) => 
                    sum + parseFloat(s.properties.distancia_total), 0
                );
                
                connectedFeatures.push({
                    type: 'Feature',
                    properties: {
                        lote: segment.properties.lote,
                        linea: segment.properties.linea,
                        puntos: totalPoints,
                        segmentos_conectados: connectedSegments.length,
                        distancia_total: totalDistance.toFixed(1) + 'm',
                        rango: `${connectedSegments[0].properties.rango.split('-')[0]}-${connectedSegments[connectedSegments.length-1].properties.rango.split('-')[1]}`
                    },
                    geometry: {
                        type: 'LineString',
                        coordinates: allCoords
                    }
                });
            } else {
                connectedFeatures.push(segment);
            }
        });

        // Agregar líneas de manera segura
        if (connectedFeatures.length > 0) {
            try {
                map.current.addSource('spots-lines-src', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: connectedFeatures,
                    },
                });

                map.current.addLayer({
                    id: 'spots-lines',
                    type: 'line',
                    source: 'spots-lines-src',
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round',
                    },
                    paint: {
                        'line-color': [
                            'match',
                            ['get', 'lote'],
                            '62-LA CEIBA', '#1f78b4',
                            '63-CERCA ELECTRICA', '#33a02c',
                            '67-CASA ROJA', '#e31a1c',
                            '83 - EL MIRADOR', '#ff7f00',
                            '#888'
                        ],
                        'line-width': 2.5,
                        'line-opacity': 0.9,
                    },
                }, 'spots-unclustered');
            } catch (linesError) {
                console.error('Error agregando líneas:', linesError);
            }
        }

        // Ajustar vista de manera segura
        if (filteredSpots.length > 0) {
            try {
                const bounds = new mapboxgl.LngLatBounds();
                filteredSpots.forEach(spot => {
                    bounds.extend([spot.longitud, spot.latitud]);
                });
                
                setTimeout(() => {
                    if (map.current && map.current.isStyleLoaded()) {
                        map.current.fitBounds(bounds, {
                            padding: 80,
                            maxZoom: 16,
                            duration: 1500
                        });
                    }
                }, 200);
            } catch (boundsError) {
                console.warn('Error ajustando vista:', boundsError);
            }
        }

        // Agregar event listeners de manera segura
        try {
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
        } catch (listenerError) {
            console.warn('Error removiendo listeners previos:', listenerError);
        }

        // Agregar event listeners de manera segura
        try {
            // Interacción con clusters: expandir al hacer clic
            map.current.on('click', 'spots-clusters', (e) => {
                try {
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
                } catch (clusterError) {
                    console.warn('Error en interacción con cluster:', clusterError);
                }
            });

            // Popup para puntos individuales
            map.current.on('click', 'spots-unclustered', (e) => {
                try {
                    const feature = e.features[0];
                    const props = feature.properties;
                    
                    // Obtener coordenadas desde propiedades o desde el geometry/evento
                    const latitud = props.latitud ?? feature.geometry.coordinates[1] ?? e.lngLat.lat;
                    const longitud = props.longitud ?? feature.geometry.coordinates[0] ?? e.lngLat.lng;
                    
                    // Formatear coordenadas de forma segura
                    const latFormatted = (typeof latitud === 'number' && !isNaN(latitud)) 
                        ? latitud.toFixed(7) 
                        : 'N/A';
                    const lonFormatted = (typeof longitud === 'number' && !isNaN(longitud)) 
                        ? longitud.toFixed(7) 
                        : 'N/A';
                    
                    new mapboxgl.Popup({
                        closeButton: true,
                        closeOnClick: true,
                        className: 'spot-popup'
                    })
                        .setLngLat(e.lngLat)
                        .setHTML(`
                            <div class="p-3 min-w-[200px]">
                                <h3 class="font-bold text-base mb-2 text-blue-900 border-b pb-2">🌴 Palma #${props.posicion ?? 'N/A'}</h3>
                                <div class="space-y-1 text-sm">
                                    <p><strong class="text-gray-700">Lote:</strong> <span class="text-gray-900">${props.lote ?? 'N/A'}</span></p>
                                    <p><strong class="text-gray-700">Línea:</strong> <span class="text-gray-900">${props.linea ?? 'N/A'}</span></p>
                                    <p><strong class="text-gray-700">Posición:</strong> <span class="text-gray-900">${props.posicion ?? 'N/A'}</span></p>
                                    <div class="mt-2 pt-2 border-t">
                                        <p class="text-xs text-gray-600"><strong>Coordenadas:</strong></p>
                                        <p class="text-xs font-mono text-gray-800">Lat: ${latFormatted}</p>
                                        <p class="text-xs font-mono text-gray-800">Lon: ${lonFormatted}</p>
                                    </div>
                                </div>
                            </div>
                        `)
                        .addTo(map.current);
                } catch (popupError) {
                    console.warn('Error mostrando popup:', popupError);
                }
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
        } catch (eventError) {
            console.warn('Error agregando event listeners:', eventError);
        }
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
            
            {/* Warning equilibrado para archivos grandes */}
            {mapLoaded && spots.length > 2000 && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg shadow-xl p-3 max-w-xs">
                    <div className="flex items-start gap-2">
                        <span className="text-xl">⚠️</span>
                        <div className="text-xs">
                            <p className="font-bold">Dataset Grande</p>
                            <p className="mt-1">
                                {selectedLote 
                                    ? `Mostrando ${Math.min(currentFilteredSpots.length, 5000)} de ${spots.filter(s => s.lote === selectedLote).length.toLocaleString()} spots`
                                    : `Mostrando ${Math.min(currentFilteredSpots.length, 1500)} de ${spots.length.toLocaleString()} spots`
                                }
                            </p>
                            <p className="mt-1 text-yellow-100">💡 Selecciona un lote para ver más datos</p>
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
