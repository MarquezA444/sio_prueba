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

            const res = await axios.post('/api/v1/spots/upload', formData, {
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
                const res = await axios.get('/api/sioma/lotes');
                if (res.data && !res.data.error) {
                    const lotesData = Array.isArray(res.data) ? res.data : [];
                    setLotes(lotesData);
                } else {
                    console.error('Error loading lotes:', res.data);
                }
            } catch (err) {
                console.error('Error loading lotes:', err);
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
            const res = await axios.post('/api/v1/spots/send-sioma', {
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
    const handleDownloadCorrectedFile = () => {
        if (!csvPreview || !response) {
            setError({ message: 'No hay datos para corregir' });
            return;
        }

        try {
            const headers = csvPreview.headers;
            const rows = csvPreview.allRows;
            
            // Marcar filas con errores
            const errorRows = new Set();
            if (response.errors) {
                Object.values(response.errors).forEach(errorList => {
                    if (Array.isArray(errorList)) {
                        errorList.forEach(err => {
                            if (err.row) errorRows.add(err.row);
                        });
                    }
                });
            }

            // Generar CSV con columna de errores
            let csvContent = [...headers, 'Estado'].join(',') + '\n';
            
            rows.forEach((row, idx) => {
                const rowNum = idx + 2;
                const status = errorRows.has(rowNum) ? 'ERROR' : 'OK';
                csvContent += [...row, status].join(',') + '\n';
            });

            // Descargar archivo
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            const fileName = selectedFile.name.replace(/\.(csv|xlsx|xls)$/i, '') + '_corregido.csv';
            
            link.setAttribute('href', url);
            link.setAttribute('download', fileName);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            setError({ message: 'Error al generar archivo corregido: ' + err.message });
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
                                            <option key={idx} value={finca.id || finca.codigo || idx}>
                                                {finca.nombre || finca.name || `Finca ${finca.id || idx}`}
                                            </option>
                                        ))}
                                    </select>
                                    {fincas.length === 0 && !loadingFincas && (
                                        <p className="mt-1 text-sm text-amber-600">
                                            ⚠️ No se pudieron cargar las fincas. Verifique la conexión con la API.
                                        </p>
                                    )}
                                    {fincas.length > 0 && (
                                        <p className="mt-1 text-sm text-gray-500">
                                            ✅ {fincas.length} finca(s) disponible(s)
                                        </p>
                                    )}
                                </div>

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
                                        {Object.entries(response.errors).map(([errorType, errors]) => (
                                            <div key={errorType} className="mb-3">
                                                <h6 className="font-medium text-gray-900 mb-1">
                                                    {errorType.replace(/_/g, ' ').toUpperCase()} ({errors.length})
                                                </h6>
                                                <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded max-h-40 overflow-auto">
                                                    <pre>{JSON.stringify(errors, null, 2)}</pre>
                                                </div>
                                            </div>
                                        ))}
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

                    {/* Mapa Interactivo - Solo se muestra si hay datos validados */}
                    {response && response.ok && spotsData.length > 0 && (
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    🗺️ Visualización en Mapa
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
                                        {lotes.map((lote, idx) => (
                                            <option key={idx} value={lote.nombre || lote.name || lote.id || idx}>
                                                {lote.nombre || lote.name || `Lote ${lote.id || idx}`}
                                            </option>
                                        ))}
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
