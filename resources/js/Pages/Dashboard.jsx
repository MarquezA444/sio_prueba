import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import SpotsMap from '@/Components/SpotsMap';

export default function Dashboard() {
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fincaId, setFincaId] = useState('');
    const [fincas, setFincas] = useState([]);
    const [loadingFincas, setLoadingFincas] = useState(false);
    const [csvPreview, setCsvPreview] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;
    
    // Nuevos estados para lotes y mapa
    const [lotes, setLotes] = useState([]);
    const [loadingLotes, setLoadingLotes] = useState(false);
    const [selectedLote, setSelectedLote] = useState('');
    const [spotsData, setSpotsData] = useState([]);
    const [sendingToSioma, setSendingToSioma] = useState(false);

    const handleApiCall = async (endpoint, method = 'GET', data = null) => {
        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const config = {
                method,
                url: endpoint,
            };

            if (data) {
                config.data = data;
            }

            const res = await axios(config);
            setResponse(res.data);
        } catch (err) {
            setError(err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile) {
            setError({ message: 'Por favor selecciona un archivo' });
            return;
        }

        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            if (fincaId) {
                formData.append('finca_id', fincaId);
            }

            const res = await axios.post('/api/v1/map/upload-spots', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setResponse(res.data);
            
            // Preparar datos para el mapa
            if (csvPreview && csvPreview.headers && csvPreview.allRows) {
                const normalizedData = normalizeSpotsData(csvPreview.headers, csvPreview.allRows);
                setSpotsData(normalizedData);
            }
        } catch (err) {
            setError(err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    };

    // Normalizar datos del CSV para el mapa
    const normalizeSpotsData = (headers, rows) => {
        return rows.map(row => {
            const spot = {};
            headers.forEach((header, idx) => {
                const key = header.toLowerCase().trim();
                // Normalizar nombres de columnas
                if (key.includes('latitud') || key.includes('lat')) {
                    spot.latitud = parseFloat(row[idx]) || null;
                } else if (key.includes('longitud') || key.includes('lon') || key.includes('lng')) {
                    spot.longitud = parseFloat(row[idx]) || null;
                } else if (key.includes('linea') || key.includes('línea')) {
                    spot.linea = row[idx];
                } else if (key.includes('posicion') || key.includes('posición')) {
                    spot.posicion = parseInt(row[idx]) || null;
                } else if (key.includes('lote')) {
                    spot.lote = row[idx];
                }
            });
            return spot;
        }).filter(spot => spot.latitud && spot.longitud);
    };

    // Cargar lotes cuando se selecciona una finca
    useEffect(() => {
        const loadLotes = async () => {
            if (!fincaId) {
                setLotes([]);
                setSelectedLote('');
                return;
            }

            setLoadingLotes(true);
            try {
                const res = await axios.get('/api/sioma/lotes', {
                    params: { finca_id: fincaId }
                });
                if (res.data && !res.data.error) {
                    const lotesData = Array.isArray(res.data) ? res.data : [];
                    setLotes(lotesData);
                } else {
                    console.error('Error loading lotes:', res.data);
                    setLotes([]);
                }
            } catch (err) {
                console.error('Error loading lotes:', err);
                setLotes([]);
            } finally {
                setLoadingLotes(false);
            }
        };

        loadLotes();
    }, [fincaId]);

    // Enviar datos validados a Sioma
    const handleSendToSioma = async () => {
        if (!response || !response.ok) {
            setError({ message: 'Primero debe validar los datos correctamente' });
            return;
        }

        if (!fincaId) {
            setError({ message: 'Debe seleccionar una finca' });
            return;
        }

        if (!spotsData || spotsData.length === 0) {
            setError({ message: 'No hay datos para enviar' });
            return;
        }

        setSendingToSioma(true);
        setError(null);

        try {
            const res = await axios.post('/api/v1/map/send-to-sioma', {
                spots: spotsData,
                finca_id: fincaId,
            });

            if (res.data.success) {
                setResponse({
                    ...response,
                    sentToSioma: true,
                    message: res.data.message || 'Datos enviados exitosamente a Sioma'
                });
                
                alert('✅ Datos enviados exitosamente a Sioma');
            } else {
                setError({ message: res.data.message || 'Error al enviar a Sioma' });
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Error desconocido';
            setError({ message: 'Error al enviar a Sioma: ' + errorMsg });
        } finally {
            setSendingToSioma(false);
        }
    };

    // Generar archivo corregido
    const handleDownloadCorrectedFile = async () => {
        if (!selectedFile || !response || !response.errors) {
            setError({ message: 'No hay datos para corregir' });
            return;
        }

        try {
            // Verificar si hay valores vacíos
            const hasEmptyValues = response.errors.valores_vacios && response.errors.valores_vacios.length > 0;
            let removeEmptyValues = false;

            if (hasEmptyValues) {
                const confirmMessage = `Se encontraron ${response.errors.valores_vacios.length} fila(s) con valores vacíos.\n\n¿Desea eliminar estas filas del archivo corregido?\n\nClic "Aceptar" para eliminarlas\nClic "Cancelar" para mantenerlas (marcadas como ERROR)`;
                removeEmptyValues = window.confirm(confirmMessage);
            }

            setLoading(true);
            
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('errors', JSON.stringify(response.errors));
            formData.append('remove_empty_values', removeEmptyValues ? '1' : '0');
            
            const res = await axios.post('/api/v1/map/download-corrected', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                responseType: 'blob',
            });

            // Crear URL del blob y descargar
            const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            // Obtener nombre del archivo desde headers
            const contentDisposition = res.headers['content-disposition'];
            let filename = selectedFile.name.replace(/\.(csv|xlsx|xls)$/i, '') + '_corregido.csv';
            
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
                if (filenameMatch) filename = filenameMatch[1];
            }
            
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            setLoading(false);
            
            // Mensaje de confirmación
            if (removeEmptyValues) {
                alert(`✅ Archivo descargado. Se eliminaron ${response.errors.valores_vacios.length} fila(s) con valores vacíos.`);
            }
        } catch (err) {
            setLoading(false);
            setError({ message: 'Error al generar archivo corregido: ' + (err.message || 'Error desconocido') });
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setCurrentPage(1); // Reset to first page
            await generatePreview(file);
        } else {
            setCsvPreview(null);
            setCurrentPage(1);
        }
    };

    const generatePreview = async (file) => {
        setLoadingPreview(true);
        setCsvPreview(null);

        try {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());
            
            if (lines.length === 0) {
                setCsvPreview({ error: 'El archivo está vacío' });
                return;
            }

            // Parse CSV (simple parser, handles basic cases)
            const parseCSVLine = (line) => {
                const result = [];
                let current = '';
                let inQuotes = false;
                
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        result.push(current.trim());
                        current = '';
                    } else {
                        current += char;
                    }
                }
                result.push(current.trim());
                return result;
            };

            const headers = parseCSVLine(lines[0]);
            const allRows = lines.slice(1).map(line => parseCSVLine(line));

            setCsvPreview({
                headers,
                allRows,
                totalRows: allRows.length,
            });
        } catch (err) {
            setCsvPreview({ error: 'Error al leer el archivo: ' + err.message });
        } finally {
            setLoadingPreview(false);
        }
    };

    // Función para obtener etiqueta legible del error
    const getErrorLabel = (errorType) => {
        const labels = {
            'coords_duplicadas': '📍 Coordenadas Duplicadas',
            'linea_duplicada_en_lote': '🔁 Líneas Duplicadas en Lote',
            'posicion_duplicada_en_linea': '🔀 Posiciones Duplicadas en Línea',
            'lote_invalido': '❌ Lotes Inválidos',
            'rango_coord': '⚠️ Coordenadas Fuera de Rango',
            'valores_vacios': '📭 Valores Vacíos',
            'columnas_faltantes': '📋 Columnas Faltantes',
        };
        return labels[errorType] || errorType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    // Función para renderizar mensaje de error legible
    const renderErrorMessage = (errorType, error) => {
        const commonStyle = "text-gray-800";
        
        // Si no es un objeto, mostrar directamente
        if (typeof error !== 'object' || error === null) {
            return <div className={commonStyle}>{String(error)}</div>;
        }
        
        switch (errorType) {
            case 'coords_duplicadas':
                return (
                    <div className={commonStyle}>
                        <span className="font-semibold">Fila {error.row || '?'}:</span> Coordenadas 
                        <span className="font-mono text-sm">({error.lat || '?'}, {error.lon || '?'})</span> duplicadas de la fila {error.duplicate_of_row || '?'}
                    </div>
                );
            case 'linea_duplicada_en_lote':
                return (
                    <div className={commonStyle}>
                        <span className="font-semibold">Fila {error.row || '?'}:</span> Línea <span className="font-semibold">{error.linea || '?'}</span> 
                        {' '}duplicada en lote <span className="font-semibold">"{error.lote || '?'}"</span> (duplicada de la fila {error.duplicate_of_row || '?'})
                    </div>
                );
            case 'posicion_duplicada_en_linea':
                return (
                    <div className={commonStyle}>
                        <span className="font-semibold">Fila {error.row || '?'}:</span> Posición <span className="font-semibold">{error.posicion || '?'}</span> 
                        {' '}duplicada en línea <span className="font-semibold">{error.linea || '?'}</span> del lote 
                        <span className="font-semibold"> "{error.lote || '?'}"</span> (duplicada de la fila {error.duplicate_of_row || '?'})
                    </div>
                );
            case 'lote_invalido':
                return (
                    <div className={commonStyle}>
                        <span className="font-semibold">Fila {error.row || '?'}:</span> Lote <span className="font-semibold">"{error.lote || '?'}"</span> 
                        {' '}no es válido para la finca seleccionada
                    </div>
                );
            case 'rango_coord':
                return (
                    <div className={commonStyle}>
                        <span className="font-semibold">Fila {error.row || '?'}:</span> {error.field === 'latitud' ? 'Latitud' : 'Longitud'} 
                        {' '}fuera de rango: <span className="font-semibold">{error.value || '?'}</span>
                    </div>
                );
            case 'valores_vacios':
                return (
                    <div className={commonStyle}>
                        <span className="font-semibold">Fila {error.row || '?'}:</span> Valor vacío en columna <span className="font-semibold">{error.column || '?'}</span>
                    </div>
                );
            case 'columnas_faltantes':
                const missingCols = Array.isArray(error) ? error : [error];
                return (
                    <div className={commonStyle}>
                        Faltan columnas requeridas: <span className="font-semibold">{missingCols.join(', ')}</span>
                    </div>
                );
            default:
                return <div className={commonStyle}>{JSON.stringify(error)}</div>;
        }
    };

    // Load fincas on component mount
    useEffect(() => {
        const loadFincas = async () => {
            setLoadingFincas(true);
            try {
                const res = await axios.get('/api/sioma/fincas');
                if (res.data && !res.data.error) {
                    setFincas(Array.isArray(res.data) ? res.data : []);
                } else {
                    console.error('Error loading fincas:', res.data);
                }
            } catch (err) {
                console.error('Error loading fincas:', err);
            } finally {
                setLoadingFincas(false);
            }
        };

        loadFincas();
    }, []);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard - Prueba de API Sioma
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    {/* API Sioma Section */}
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                🌴 API de Sioma - Endpoints
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => handleApiCall('/api/sioma/fincas')}
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                                >
                                    📍 Obtener Fincas
                                </button>
                                <button
                                    onClick={() => handleApiCall('/api/sioma/lotes')}
                                    disabled={loading}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                                >
                                    🗺️ Obtener Lotes
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Upload Section */}
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                📤 Subir y Validar Spots
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Archivo CSV/XLSX
                                    </label>
                                    <input
                                        type="file"
                                        accept=".csv,.xlsx,.xls"
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                                    />
                                    {selectedFile && (
                                        <p className="mt-2 text-sm text-gray-600">
                                            Archivo seleccionado: <span className="font-semibold">{selectedFile.name}</span>
                                            {selectedFile.size && (
                                                <span className="ml-2 text-gray-500">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
                                            )}
                                        </p>
                                    )}
                                </div>

                                {/* CSV Preview */}
                                {loadingPreview && (
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                            <span className="text-sm text-blue-700">Generando previsualización...</span>
                                        </div>
                                    </div>
                                )}

                                {csvPreview && csvPreview.error && (
                                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                        <p className="text-sm text-red-700">❌ {csvPreview.error}</p>
                                    </div>
                                )}

                                {csvPreview && !csvPreview.error && (() => {
                                    const startIdx = (currentPage - 1) * rowsPerPage;
                                    const endIdx = startIdx + rowsPerPage;
                                    const paginatedRows = csvPreview.allRows.slice(startIdx, endIdx);
                                    const totalPages = Math.ceil(csvPreview.totalRows / rowsPerPage);

                                    return (
                                        <div className="border border-gray-300 rounded-lg overflow-hidden">
                                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-300">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-gray-900">
                                                            📋 Previsualización del archivo
                                                        </h4>
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            Mostrando {startIdx + 1}-{Math.min(endIdx, csvPreview.totalRows)} de {csvPreview.totalRows} filas
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                            disabled={currentPage === 1}
                                                            className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            ← Anterior
                                                        </button>
                                                        <span className="text-xs text-gray-600">
                                                            Página {currentPage} de {totalPages}
                                                        </span>
                                                        <button
                                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                            disabled={currentPage === totalPages}
                                                            className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Siguiente →
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-100">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                #
                                                            </th>
                                                            {csvPreview.headers.map((header, idx) => (
                                                                <th key={idx} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    {header}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {paginatedRows.map((row, rowIdx) => (
                                                            <tr key={rowIdx} className="hover:bg-gray-50">
                                                                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                                                    {startIdx + rowIdx + 1}
                                                                </td>
                                                                {row.map((cell, cellIdx) => (
                                                                    <td key={cellIdx} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                                                        {cell || <span className="text-gray-400 italic">vacío</span>}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Seleccionar Finca {loadingFincas && <span className="text-gray-500 text-xs">(Cargando...)</span>}
                                    </label>
                                    <select
                                        value={fincaId}
                                        onChange={(e) => setFincaId(e.target.value)}
                                        disabled={loadingFincas}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        <option value="">-- Seleccione una finca (opcional) --</option>
                                        {fincas.map((finca, idx) => (
                                            <option key={idx} value={finca.key_value || finca.id || finca.codigo || idx}>
                                                {finca.nombre || finca.name || `Finca ${finca.key_value || finca.id || idx}`}
                                            </option>
                                        ))}
                                    </select>
                                    {fincas.length === 0 && !loadingFincas && (
                                        <p className="mt-1 text-sm text-amber-600">
                                            ⚠️ No se pudieron cargar las fincas. Verifique la conexión con la API.
                                        </p>
                                    )}
                                    {fincas.length > 0 && !fincaId && (
                                        <p className="mt-1 text-sm text-gray-500">
                                            ✅ {fincas.length} finca(s) disponible(s)
                                        </p>
                                    )}
                                    {fincaId && loadingLotes && (
                                        <p className="mt-1 text-sm text-blue-600">
                                            ⏳ Cargando lotes asociados...
                                        </p>
                                    )}
                                    {fincaId && !loadingLotes && lotes.length > 0 && (
                                        <p className="mt-1 text-sm text-green-600">
                                            ✅ {lotes.length} lote(s) asociado(s) a esta finca
                                        </p>
                                    )}
                                    {fincaId && !loadingLotes && lotes.length === 0 && (
                                        <p className="mt-1 text-sm text-amber-600">
                                            ⚠️ No se encontraron lotes asociados a esta finca
                                        </p>
                                    )}
                                </div>

                                {/* Visualización de Lotes Asociados */}
                                {fincaId && !loadingLotes && lotes.length > 0 && (
                                    <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border-2 border-green-200 shadow-sm">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <span className="text-2xl">🗺️</span>
                                            Lotes Asociados a la Finca ({lotes.length})
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {lotes.map((lote, idx) => (
                                                <div
                                                    key={idx}
                                                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 hover:border-green-400 cursor-pointer"
                                                    onClick={() => setSelectedLote(lote.nombre || lote.name)}
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <h5 className="font-bold text-gray-900 text-base mb-1">
                                                                {lote.nombre || lote.name || `Lote ${idx + 1}`}
                                                            </h5>
                                                            {lote.sigla && (
                                                                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                                                                    {lote.sigla}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-2xl opacity-50">🌴</span>
                                                    </div>
                                                    
                                                    {lote.grupo && (
                                                        <div className="mt-2 pt-2 border-t border-gray-100">
                                                            <p className="text-xs text-gray-600">
                                                                <span className="font-medium">Grupo:</span> {lote.grupo}
                                                            </p>
                                                        </div>
                                                    )}
                                                    
                                                    {lote.key_value && (
                                                        <div className="mt-1">
                                                            <p className="text-xs text-gray-500">
                                                                ID: <span className="font-mono">{lote.key_value}</span>
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <p className="mt-3 text-sm text-gray-600 italic text-center">
                                            💡 Haz clic en un lote para filtrarlo en el mapa
                                        </p>
                                    </div>
                                )}

                                {fincaId && loadingLotes && (
                                    <div className="mt-4 p-6 bg-blue-50 rounded-lg border border-blue-200 text-center">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                        <p className="text-blue-700 font-medium">Cargando lotes asociados...</p>
                                    </div>
                                )}

                                <button
                                    onClick={handleFileUpload}
                                    disabled={loading || !selectedFile}
                                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                                >
                                    {loading ? '⏳ Procesando...' : '✅ Validar Archivo'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Loading Indicator */}
                    {loading && (
                        <div className="overflow-hidden bg-blue-50 shadow-sm sm:rounded-lg">
                            <div className="p-6 text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <p className="mt-2 text-blue-600 font-medium">Cargando...</p>
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="overflow-hidden bg-red-50 shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h4 className="text-lg font-semibold text-red-800 mb-2">❌ Error</h4>
                                <pre className="text-sm text-red-700 whitespace-pre-wrap bg-red-100 p-4 rounded-lg overflow-auto max-h-96">
                                    {JSON.stringify(error, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* Response Display */}
                    {response && (
                        <div className="overflow-hidden bg-green-50 shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h4 className="text-lg font-semibold text-green-800 mb-2">✅ Respuesta</h4>
                                
                                {/* Validation Summary */}
                                {response.meta && (
                                    <div className="mb-4 p-4 bg-white rounded-lg border border-green-200">
                                        <h5 className="font-semibold text-gray-900 mb-2">📊 Resumen</h5>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="text-gray-600">Total de filas:</span>
                                                <span className="ml-2 font-semibold">{response.meta.rows_total}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Hojas:</span>
                                                <span className="ml-2 font-semibold">{response.meta.sheets}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-gray-600">Estado:</span>
                                                <span className={`ml-2 font-semibold ${response.ok ? 'text-green-600' : 'text-red-600'}`}>
                                                    {response.ok ? '✅ Válido' : '❌ Con errores'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Columns Detected */}
                                {response.columns_detected && (
                                    <div className="mb-4 p-4 bg-white rounded-lg border border-green-200">
                                        <h5 className="font-semibold text-gray-900 mb-2">📋 Columnas detectadas</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {response.columns_detected.map((col, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                                    {col}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Errors */}
                                {response.errors && Object.keys(response.errors).length > 0 && (
                                    <div className="mb-4 p-4 bg-white rounded-lg border border-red-200">
                                        <h5 className="font-semibold text-red-900 mb-2">⚠️ Errores encontrados</h5>
                                        
                                        {/* Resumen total de errores */}
                                        {(() => {
                                            let totalErrors = 0;
                                            let errorSummary = [];
                                            
                                            Object.entries(response.errors).forEach(([errorType, errors]) => {
                                                if (errorType === 'columnas_faltantes') {
                                                    const missingCols = Array.isArray(errors) ? errors : Object.keys(errors);
                                                    errorSummary.push(`${missingCols.length} columna(s) faltante(s)`);
                                                } else {
                                                    const errorsArray = Array.isArray(errors) ? errors : [errors];
                                                    totalErrors += errorsArray.length;
                                                    if (errorsArray.length > 0) {
                                                        errorSummary.push(`${errorsArray.length} ${getErrorLabel(errorType).toLowerCase()}`);
                                                    }
                                                }
                                            });
                                            
                                            return (
                                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-lg">📊</span>
                                                        <h6 className="font-semibold text-red-900">Resumen Total</h6>
                                                    </div>
                                                    <div className="text-sm text-red-800">
                                                        <p className="font-medium mb-1">
                                                            Total de errores encontrados: <span className="font-bold text-red-900">{totalErrors}</span>
                                                        </p>
                                                        <div className="text-xs text-red-700">
                                                            {errorSummary.join(' • ')}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        
                                        {(() => {
                                            // Verificar si hay columnas faltantes
                                            const hasMissingColumns = response.errors.columnas_faltantes && response.errors.columnas_faltantes.length > 0;
                                            return Object.entries(response.errors).map(([errorType, errors]) => {
                                            // Manejar columnas_faltantes como caso especial
                                            if (errorType === 'columnas_faltantes') {
                                                const missingCols = Array.isArray(errors) ? errors : Object.keys(errors);
                                                return (
                                                    <div key={errorType} className="mb-3">
                                                        <h6 className="font-medium text-gray-900 mb-2">
                                                            {getErrorLabel(errorType)} ({missingCols.length} {missingCols.length === 1 ? 'columna' : 'columnas'})
                                                        </h6>
                                                        <div className="text-sm text-gray-700 bg-red-50 p-3 rounded max-h-40 overflow-auto border border-red-200">
                                                            <div className="font-semibold">
                                                                Faltan las siguientes columnas requeridas: <span className="text-red-600">{missingCols.join(', ')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            
                                            // Asegurar que errors es un array para otros tipos
                                            const errorsArray = Array.isArray(errors) ? errors : [errors];
                                            
                                            return (
                                                <div key={errorType} className="mb-3">
                                                    <h6 className="font-medium text-gray-900 mb-2">
                                                        {getErrorLabel(errorType)} ({errorsArray.length} {errorsArray.length === 1 ? 'error' : 'errores'})
                                                    </h6>
                                                    <div className="text-sm text-gray-700 bg-red-50 p-3 rounded max-h-40 overflow-auto border border-red-200">
                                                        {errorsArray.slice(0, 10).map((error, idx) => (
                                                            <div key={idx} className="mb-2 pb-2 border-b border-red-200 last:border-b-0">
                                                                {renderErrorMessage(errorType, error)}
                                                            </div>
                                                        ))}
                                                        {errorsArray.length > 10 && (
                                                            <p className="text-gray-500 italic mt-2">
                                                                ...y {errorsArray.length - 10} error(es) más
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        });
                                        })()}
                                        
                                        {/* Botón de descarga de archivo corregido */}
                                        {(() => {
                                            // No mostrar botón si hay columnas faltantes en el archivo
                                            const hasMissingColumns = response.errors.columnas_faltantes && response.errors.columnas_faltantes.length > 0;
                                            
                                            if (hasMissingColumns) {
                                                return (
                                                    <div className="mt-4 pt-4 border-t border-red-200">
                                                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                            <p className="text-sm text-yellow-800 text-center">
                                                                ⚠️ <strong>No se puede generar archivo corregido:</strong>
                                                                <br />
                                                                El archivo debe tener <strong>TODAS</strong> las columnas requeridas.
                                                                <br /><br />
                                                                <strong>Columnas faltantes:</strong> 
                                                                {(() => {
                                                                    const missing = Array.isArray(response.errors.columnas_faltantes) 
                                                                        ? response.errors.columnas_faltantes 
                                                                        : Object.keys(response.errors.columnas_faltantes);
                                                                    return <span className="font-mono text-base"> {missing.join(', ')}</span>;
                                                                })()}
                                                                <br /><br />
                                                                <strong>Solución:</strong> Edita tu archivo y agrega las columnas faltantes, luego vuelve a subir.
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            
                                            return (
                                                <div className="mt-4 pt-4 border-t border-red-200">
                                                    <button
                                                        onClick={handleDownloadCorrectedFile}
                                                        disabled={loading}
                                                        className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                                                    >
                                                        📥 Descargar Archivo Corregido
                                                    </button>
                                                    <p className="mt-2 text-sm text-gray-600 text-center">
                                                        Los duplicados serán eliminados automáticamente
                                                    </p>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* Full JSON Response */}
                                <details className="mt-4">
                                    <summary className="cursor-pointer font-semibold text-gray-900 hover:text-green-700">
                                        Ver respuesta completa (JSON)
                                    </summary>
                                    <pre className="mt-2 text-sm text-gray-700 whitespace-pre-wrap bg-white p-4 rounded-lg overflow-auto max-h-96 border border-green-200">
                                        {JSON.stringify(response, null, 2)}
                                    </pre>
                                </details>
                            </div>
                        </div>
                    )}

                    {/* Mapa Interactivo - Se muestra si hay datos, incluso con errores */}
                    {response && spotsData.length > 0 && (
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    🗺️ Visualización en Mapa
                                    {!response.ok && (
                                        <span className="ml-2 text-sm text-amber-600 font-normal">
                                            (Mostrando datos con errores)
                                        </span>
                                    )}
                                </h3>
                                
                                {/* Selector de Lote */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Seleccionar Lote para Visualizar
                                    </label>
                                    <select
                                        value={selectedLote}
                                        onChange={(e) => setSelectedLote(e.target.value)}
                                        disabled={loadingLotes}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        <option value="">-- Ver todos los lotes --</option>
                                        {lotes.map((lote, idx) => {
                                            const loteNombre = lote.nombre || lote.name || `Lote ${lote.key_value || idx}`;
                                            const loteValue = lote.nombre || lote.name || lote.key_value || idx;
                                            return (
                                                <option key={idx} value={loteValue}>
                                                    {loteNombre} {lote.sigla && `(${lote.sigla})`}
                                                </option>
                                            );
                                        })}
                                        {/* Lotes desde el archivo */}
                                        {[...new Set(spotsData.map(s => s.lote))].map((loteName, idx) => (
                                            <option key={`file-${idx}`} value={loteName}>
                                                📄 {loteName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Mapa */}
                                <SpotsMap 
                                    spots={spotsData}
                                    selectedLote={selectedLote}
                                    showLines={true}
                                    showPerimeter={true}
                                    height="600px"
                                />

                                {/* Botones de acción */}
                                <div className="mt-4 flex flex-wrap gap-3">
                                    {/* Descargar archivo corregido - Solo si hay errores */}
                                    {response.errors && Object.keys(response.errors).length > 0 && (
                                        <button
                                            onClick={handleDownloadCorrectedFile}
                                            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                                        >
                                            📥 Descargar Archivo Corregido
                                        </button>
                                    )}

                                    {/* Enviar a Sioma */}
                                    {response.ok && (
                                        <button
                                            onClick={handleSendToSioma}
                                            disabled={sendingToSioma || response.sentToSioma}
                                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                                        >
                                            {sendingToSioma ? '⏳ Enviando...' : response.sentToSioma ? '✅ Enviado a Sioma' : '🚀 Enviar a Sioma'}
                                        </button>
                                    )}

                                    {response.sentToSioma && (
                                        <div className="px-4 py-2 bg-green-100 border border-green-300 rounded-lg flex items-center gap-2">
                                            <span className="text-green-800">✅ Datos enviados exitosamente a Sioma</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="overflow-hidden bg-gray-50 shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">📖 Instrucciones</h3>
                            <div className="space-y-2 text-sm text-gray-700">
                                <p><strong>1. Obtener Fincas/Lotes:</strong> Haz clic en los botones para consultar la API de Sioma.</p>
                                <p><strong>2. Validar Spots:</strong> Selecciona un archivo CSV/XLSX. Verás una previsualización antes de validar.</p>
                                <p><strong>3. Finca ID:</strong> Opcional. Si lo proporcionas, se validarán los lotes contra la API.</p>
                                <p className="mt-4 p-3 bg-blue-50 rounded-lg">
                                    <strong>Ejemplo de CSV:</strong><br/>
                                    <code className="text-xs">
                                        Latitud,Longitud,Línea palma,Posición palma,Lote<br/>
                                        7.33657685,-76.72322992,1,1,1<br/>
                                        7.33653638,-76.72316139,1,2,1
                                    </code>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
