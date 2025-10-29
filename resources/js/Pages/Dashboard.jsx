import SiomaLayout from '@/Layouts/SiomaLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import MapboxMap from '@/Components/MapboxMap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faUpload, 
    faFolder, 
    faWheatAwn, 
    faFileCircleCheck,
    faCloudArrowUp,
    faSpinner,
    faCheckCircle,
    faXmark,
    faCircleCheck,
    faExclamationTriangle,
    faFile,
    faChevronLeft,
    faChevronRight,
    faArrowRight,
    faLeaf,
    faMapLocationDot,
    faEdit,
    faSave,
    faTimes
} from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

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
    
    // Estado para editor manual de filas con errores
    const [editableRows, setEditableRows] = useState({});
    const [showManualEditor, setShowManualEditor] = useState(false);
    const [rowsWithErrors, setRowsWithErrors] = useState([]);

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
            Swal.fire({
                icon: 'warning',
                title: 'Archivo Requerido',
                text: 'Por favor selecciona un archivo CSV o XLSX',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#A51C24',
            });
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

            // Mostrar alerta de éxito
            if (res.data.ok) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Validación Exitosa!',
                    text: 'El archivo fue validado correctamente sin errores',
                    confirmButtonText: 'Continuar',
                    confirmButtonColor: '#10B981',
                    timer: 3000,
                    timerProgressBar: true,
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Errores Encontrados',
                    text: 'Se encontraron errores en el archivo. Revisa los detalles abajo.',
                    confirmButtonText: 'Ver Errores',
                    confirmButtonColor: '#A51C24',
                });
            }
        } catch (err) {
            setError(err.response?.data || err.message);
            Swal.fire({
                icon: 'error',
                title: 'Error al Procesar',
                text: err.response?.data?.message || 'Ocurrió un error al procesar el archivo',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#A51C24',
            });
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
                const value = row[idx];
                
                // Ignorar columnas de estado y errores (vienen del archivo corregido)
                if (key === 'estado' || key === 'errores' || key === 'ok' || key === 'error') {
                    return; // Saltar estas columnas
                }
                
                // Normalizar nombres de columnas
                if (key.includes('latitud') || key.includes('lat')) {
                    const parsed = parseFloat(value);
                    spot.latitud = !isNaN(parsed) ? parsed : null;
                } else if (key.includes('longitud') || key.includes('lon') || key.includes('lng')) {
                    const parsed = parseFloat(value);
                    spot.longitud = !isNaN(parsed) ? parsed : null;
                } else if (key.includes('linea') || key.includes('línea') || key === 'linea_palma') {
                    spot.linea = value ? String(value).trim() : null;
                } else if (
                    key.includes('posicion') || 
                    key.includes('posición') || 
                    key === 'posicion_palma' || 
                    key === 'palma' ||
                    key === 'palma_num'
                ) {
                    // Manejar posición correctamente (puede ser 0, que es válido)
                    const trimmed = value ? String(value).trim() : '';
                    if (trimmed === '' || trimmed.toLowerCase() === 'nan') {
                        spot.posicion = null;
                    } else {
                        const parsed = parseInt(trimmed, 10);
                        spot.posicion = !isNaN(parsed) ? parsed : null;
                    }
                } else if (key.includes('lote') || key === 'lot') {
                    spot.lote = value ? String(value).trim() : null;
                }
            });
            return spot;
        }).filter(spot => spot.latitud !== null && spot.longitud !== null && !isNaN(spot.latitud) && !isNaN(spot.longitud));
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
            Swal.fire({
                icon: 'warning',
                title: 'Validación Requerida',
                text: 'Primero debe validar los datos correctamente antes de enviar',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#A51C24',
            });
            return;
        }

        if (!fincaId) {
            Swal.fire({
                icon: 'info',
                title: 'Finca Requerida',
                text: 'Debe seleccionar una finca antes de enviar los datos',
                confirmButtonText: 'Seleccionar Finca',
                confirmButtonColor: '#A51C24',
            });
            return;
        }

        if (!spotsData || spotsData.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Sin Datos',
                text: 'No hay datos válidos para enviar',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#A51C24',
            });
            return;
        }

        // Confirmar envío
        const result = await Swal.fire({
            icon: 'question',
            title: '¿Enviar a SIOMA?',
            html: `Se enviarán <strong>${spotsData.length}</strong> spots a la plataforma SIOMA.<br><br>¿Desea continuar?`,
            showCancelButton: true,
            confirmButtonText: 'Sí, Enviar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#10B981',
            cancelButtonColor: '#6B7280',
        });

        if (!result.isConfirmed) return;

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
                
                Swal.fire({
                    icon: 'success',
                    title: '¡Enviado con Éxito!',
                    html: `Los datos fueron enviados correctamente a SIOMA.<br><br><strong>${spotsData.length}</strong> spots procesados`,
                    confirmButtonText: 'Excelente',
                    confirmButtonColor: '#10B981',
                    timer: 4000,
                    timerProgressBar: true,
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al Enviar',
                    text: res.data.message || 'No se pudo completar el envío a SIOMA',
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#A51C24',
                });
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Error desconocido';
            Swal.fire({
                icon: 'error',
                title: 'Error de Conexión',
                text: 'Error al enviar a SIOMA: ' + errorMsg,
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#A51C24',
            });
        } finally {
            setSendingToSioma(false);
        }
    };

    // Función auxiliar para obtener todos los errores de una fila específica
    const getRowErrors = (rowNumber, errors) => {
        const rowErrors = [];
        Object.entries(errors).forEach(([errorType, errorList]) => {
            if (errorType === 'columnas_faltantes') return;
            const errorsArray = Array.isArray(errorList) ? errorList : [errorList];
            errorsArray.forEach(error => {
                if (error && error.row === rowNumber) {
                    rowErrors.push({
                        type: errorType,
                        errorData: error // Guardamos los datos del error, no el mensaje renderizado
                    });
                }
            });
        });
        return rowErrors;
    };

    // Función para preparar filas con errores para edición manual
    useEffect(() => {
        if (response && response.errors && csvPreview && csvPreview.allRows) {
            const errorRowsSet = new Set();
            
            // Recopilar todos los números de fila que tienen errores
            Object.entries(response.errors).forEach(([errorType, errors]) => {
                if (errorType === 'columnas_faltantes') return; // Ignorar este tipo
                
                const errorsArray = Array.isArray(errors) ? errors : [errors];
                errorsArray.forEach(error => {
                    if (error && error.row) {
                        errorRowsSet.add(error.row - 1); // -1 porque row es 1-indexed pero allRows es 0-indexed
                    }
                });
            });
            
            // Crear array de filas con errores incluyendo los datos originales
            const rowsWithErrorsData = Array.from(errorRowsSet)
                .filter(rowIdx => rowIdx >= 0 && rowIdx < csvPreview.allRows.length)
                .map(rowIdx => ({
                    rowNumber: rowIdx + 1, // 1-indexed para mostrar
                    rowIndex: rowIdx, // 0-indexed para acceder a allRows
                    originalRow: [...csvPreview.allRows[rowIdx]],
                    editedRow: [...csvPreview.allRows[rowIdx]], // Inicialmente igual al original
                    errors: getRowErrors(rowIdx + 1, response.errors)
                }));
            
            setRowsWithErrors(rowsWithErrorsData);
        } else {
            setRowsWithErrors([]);
        }
    }, [response, csvPreview]);

    // Función para abrir el editor manual
    const handleOpenManualEditor = () => {
        if (rowsWithErrors.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'Sin Filas para Editar',
                text: 'No hay filas con errores para editar manualmente',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#A51C24',
            });
            return;
        }
        setShowManualEditor(true);
    };

    // Función para actualizar una celda editada
    const handleCellEdit = (rowIndex, cellIndex, newValue) => {
        setRowsWithErrors(prev => prev.map(row => {
            if (row.rowIndex === rowIndex) {
                const updatedRow = [...row.editedRow];
                updatedRow[cellIndex] = newValue;
                return { ...row, editedRow: updatedRow };
            }
            return row;
        }));
    };

    // Función para descartar cambios de una fila
    const handleDiscardRowChanges = (rowIndex) => {
        setRowsWithErrors(prev => prev.map(row => {
            if (row.rowIndex === rowIndex) {
                return { ...row, editedRow: [...row.originalRow] };
            }
            return row;
        }));
    };

    // Función para guardar cambios y generar nuevo CSV
    const handleSaveManualEdits = async () => {
        if (!csvPreview || !selectedFile) return;

        // Crear nuevo array con las filas editadas aplicadas
        const updatedRows = [...csvPreview.allRows];
        rowsWithErrors.forEach(rowData => {
            updatedRows[rowData.rowIndex] = rowData.editedRow;
        });

        // Crear CSV desde las filas actualizadas
        const csvContent = [
            csvPreview.headers.join(','),
            ...updatedRows.map(row => row.map(cell => {
                // Escapar comillas y comas en celdas
                const cellStr = String(cell || '');
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return `"${cellStr.replace(/"/g, '""')}"`;
                }
                return cellStr;
            }).join(','))
        ].join('\n');

        // Crear blob y descargar
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        const filename = selectedFile.name.replace(/\.(csv|xlsx|xls)$/i, '') + '_editado_manual.csv';
        
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        Swal.fire({
            icon: 'success',
            title: '¡Archivo Guardado!',
            html: `Se descargó el archivo con las <strong>${rowsWithErrors.length}</strong> fila(s) editadas manualmente.<br><br>Puedes subir este archivo nuevamente para validarlo.`,
            confirmButtonText: 'Perfecto',
            confirmButtonColor: '#10B981',
            timer: 4000,
            timerProgressBar: true,
        });

        // Cerrar editor
        setShowManualEditor(false);
    };

    // Generar archivo corregido
    const handleDownloadCorrectedFile = async () => {
        if (!selectedFile || !response || !response.errors) {
            Swal.fire({
                icon: 'warning',
                title: 'Sin Datos',
                text: 'No hay errores para corregir en el archivo',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#A51C24',
            });
            return;
        }

        try {
            // Verificar si hay valores vacíos
            const hasEmptyValues = response.errors.valores_vacios && response.errors.valores_vacios.length > 0;
            let removeEmptyValues = false;

            if (hasEmptyValues) {
                const result = await Swal.fire({
                    icon: 'question',
                    title: 'Valores Vacíos Detectados',
                    html: `Se encontraron <strong>${response.errors.valores_vacios.length}</strong> fila(s) con valores vacíos.<br><br>¿Qué desea hacer?`,
                    showDenyButton: true,
                    showCancelButton: true,
                    confirmButtonText: 'Eliminar Filas',
                    denyButtonText: 'Mantener (Marcadas ERROR)',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#EF4444',
                    denyButtonColor: '#F59E0B',
                    cancelButtonColor: '#6B7280',
                });

                if (result.isDismissed) return;
                removeEmptyValues = result.isConfirmed;
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
            
            // Mostrar alerta de éxito con info específica
            const message = removeEmptyValues 
                ? `Se eliminaron <strong>${response.errors.valores_vacios.length}</strong> fila(s) con valores vacíos`
                : 'Se marcaron los errores encontrados';
            
            Swal.fire({
                icon: 'success',
                title: '¡Archivo Descargado!',
                html: `El archivo corregido se descargó exitosamente.<br><br>${message}`,
                confirmButtonText: 'Perfecto',
                confirmButtonColor: '#10B981',
                timer: 4000,
                timerProgressBar: true,
            });
        } catch (err) {
            setLoading(false);
            setError({ message: 'Error al generar archivo corregido: ' + (err.message || 'Error desconocido') });
            Swal.fire({
                icon: 'error',
                title: 'Error al Descargar',
                text: 'No se pudo generar el archivo corregido',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#A51C24',
            });
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
            'coords_duplicadas': 'Coordenadas Duplicadas',
            'linea_duplicada_en_lote': 'Líneas Duplicadas en Lote',
            'posicion_duplicada_en_linea': 'Posiciones Duplicadas en Línea',
            'lote_invalido': 'Lotes Inválidos',
            'rango_coord': 'Coordenadas Fuera de Rango',
            'valores_vacios': 'Valores Vacíos',
            'columnas_faltantes': 'Columnas Faltantes',
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
        <SiomaLayout>
            <Head title="Dashboard - SIOMA" />

            {/* Hero Section Estilo SIOMA */}
            <section className="relative h-[600px] lg:h-[700px] overflow-hidden">
                {/* Background con overlay curvo estilo SIOMA */}
                <div className="absolute inset-0 grid grid-cols-1 lg:grid-cols-2">
                    {/* Lado Izquierdo - Imagen */}
                    <div className="relative bg-cover bg-center" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800)'}}>
                        <div className="absolute inset-0 bg-black/20"></div>
                    </div>
                    {/* Lado Derecho - Imagen */}
                    <div className="relative bg-cover bg-center hidden lg:block" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800)'}}>
                        <div className="absolute inset-0 bg-black/20"></div>
                    </div>
                </div>

                {/* Overlay Curvo Rojo Estilo SIOMA */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 700" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style={{stopColor:'#8B1538', stopOpacity:0.95}} />
                                <stop offset="50%" style={{stopColor:'#A51C24', stopOpacity:0.98}} />
                                <stop offset="100%" style={{stopColor:'#8B1538', stopOpacity:0.95}} />
                            </linearGradient>
                        </defs>
                        <path fill="url(#redGradient)" d="M0,350 Q360,250 720,350 T1440,350 L1440,700 L0,700 Z" />
                    </svg>
                </div>

                {/* Contenido Hero */}
                <div className="relative z-10 h-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-4xl">
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight drop-shadow-2xl">
                            CADA LABOR<br/>
                            <span className="text-red-600 bg-white px-4 inline-block shadow-2xl">BAJO CONTROL</span>
                        </h1>
                        <p className="text-xl sm:text-2xl text-white font-bold mb-8 max-w-2xl mx-auto drop-shadow-lg">
                            Administra tareas con precisión y asegura resultados visibles con nuestra tecnología
                        </p>
                        <div className="inline-block bg-white px-8 py-4 rounded-full shadow-2xl">
                            <span className="text-[#A51C24] font-black text-xl">SIOMA</span>
                        </div>
                    </div>
                </div>

                {/* Dots Pattern */}
                <div className="absolute bottom-20 right-10 opacity-30">
                    <div className="grid grid-cols-8 gap-2">
                        {[...Array(32)].map((_, i) => (
                            <div key={i} className="w-2 h-2 bg-gray-600 rounded-full"></div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Sección de Optimización (Estilo SIOMA con imagen y texto) */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Imagen del mapa */}
                        <div className="order-2 lg:order-1">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                                <img 
                                    src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800" 
                                    alt="Mapa de gestión" 
                                    className="w-full h-[500px] object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            </div>
                        </div>
                        
                        {/* Contenido */}
                        <div className="order-1 lg:order-2">
                            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 leading-tight">
                                Optimización eficiente de las labores agrícolas
                </h2>
                            <p className="text-lg text-gray-700 leading-relaxed mb-8">
                                Nos enfocamos en optimizar la administración de tus labores agrícolas. Sabemos que cada minuto y cada recurso cuenta, por lo que nuestras soluciones están diseñadas para ayudarte a organizar, planificar y ejecutar todas las tareas de tu plantación de manera eficiente, reduciendo la incertidumbre y mejorando los resultados.
                            </p>
                            <button className="px-8 py-4 bg-[#A51C24] text-white font-bold text-lg rounded-full hover:bg-[#8B1538] transition-colors shadow-lg">
                                QUIERO SABER MÁS
                                </button>
                            </div>
                        </div>
                    </div>
            </section>

            {/* Sección Principal de Trabajo */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="space-y-8">
                    {/* Upload Section - Diseño Profesional */}
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                        {/* Header del formulario */}
                        <div className="bg-gradient-to-r from-[#A51C24] to-[#8B1538] px-8 py-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                    <FontAwesomeIcon icon={faCloudArrowUp} className="text-3xl text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white mb-1">
                                        Carga y Validación de Datos
                            </h3>
                                    <p className="text-white/90 text-sm">
                                        Importa archivos CSV o XLSX para análisis y validación automática
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Contenido del formulario */}
                        <div className="p-8 space-y-8">
                            {/* Sección de carga de archivo */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <FontAwesomeIcon icon={faFolder} className="text-xl text-blue-600" />
                                    </div>
                                <div>
                                        <label className="block text-base font-black text-gray-900">
                                            Seleccionar Archivo
                                    </label>
                                        <p className="text-sm text-gray-500">Formatos permitidos: CSV, XLSX, XLS</p>
                                    </div>
                                </div>
                                
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".csv,.xlsx,.xls"
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-gray-700 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50/50 hover:bg-gray-50 hover:border-[#A51C24] focus:outline-none transition-all duration-300 file:mr-4 file:py-4 file:px-8 file:rounded-l-2xl file:border-0 file:text-sm file:font-bold file:bg-gradient-to-r file:from-[#A51C24] file:to-[#8B1538] file:text-white hover:file:from-[#8B1538] hover:file:to-[#A51C24] file:cursor-pointer file:transition-all file:shadow-lg"
                                    />
                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                </div>
                                
                                    {selectedFile && (
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-2xl border-2 border-green-200 shadow-sm">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-2xl text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-green-900 mb-1">Archivo cargado exitosamente</p>
                                                <p className="text-sm text-green-700 truncate">
                                                    <span className="font-semibold">{selectedFile.name}</span>
                                                </p>
                                            {selectedFile.size && (
                                                    <p className="text-xs text-green-600 mt-1">
                                                        Tamaño: {(selectedFile.size / 1024).toFixed(2)} KB
                                        </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    )}
                                </div>

                            {/* CSV Preview con diseño profesional */}
                                {loadingPreview && (
                                <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-200 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0">
                                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-blue-900">Procesando archivo...</p>
                                            <p className="text-xs text-blue-700 mt-1">Generando previsualización de datos</p>
                                        </div>
                                        </div>
                                    </div>
                                )}

                                {csvPreview && csvPreview.error && (
                                <div className="bg-red-50 p-6 rounded-2xl border-2 border-red-200 shadow-sm">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                                            <FontAwesomeIcon icon={faXmark} className="text-2xl text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-red-900 mb-1">Error al procesar archivo</p>
                                            <p className="text-sm text-red-700">{csvPreview.error}</p>
                                        </div>
                                    </div>
                                    </div>
                                )}

                                {csvPreview && !csvPreview.error && (() => {
                                    const startIdx = (currentPage - 1) * rowsPerPage;
                                    const endIdx = startIdx + rowsPerPage;
                                    const paginatedRows = csvPreview.allRows.slice(startIdx, endIdx);
                                    const totalPages = Math.ceil(csvPreview.totalRows / rowsPerPage);

                                    return (
                                    <div className="border-2 border-gray-200 rounded-2xl overflow-hidden shadow-lg">
                                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b-2 border-gray-200">
                                            <div className="flex items-center justify-between flex-wrap gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                                                        <FontAwesomeIcon icon={faFileCircleCheck} className="text-xl text-white" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-black text-gray-900">
                                                            Previsualización de Datos
                                                        </h4>
                                                        <p className="text-xs text-gray-600 mt-0.5">
                                                            {startIdx + 1}-{Math.min(endIdx, csvPreview.totalRows)} de {csvPreview.totalRows} registros
                                                        </p>
                                                    </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                            disabled={currentPage === 1}
                                                        className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-[#A51C24] hover:text-[#A51C24] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                                                        >
                                                        <FontAwesomeIcon icon={faChevronLeft} /> Anterior
                                                        </button>
                                                    <span className="px-4 py-2 text-sm font-bold text-gray-900 bg-white border-2 border-gray-300 rounded-xl">
                                                        {currentPage} / {totalPages}
                                                        </span>
                                                        <button
                                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                            disabled={currentPage === totalPages}
                                                        className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-[#A51C24] hover:text-[#A51C24] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                                                        >
                                                        Siguiente <FontAwesomeIcon icon={faChevronRight} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y-2 divide-gray-200">
                                                <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                                                        <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-black text-gray-700 uppercase tracking-wider bg-gray-100">
                                                                #
                                                            </th>
                                                            {csvPreview.headers.map((header, idx) => (
                                                            <th key={idx} className="px-4 py-3 text-left text-xs font-black text-gray-700 uppercase tracking-wider">
                                                                    {header}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {paginatedRows.map((row, rowIdx) => (
                                                        <tr key={rowIdx} className="hover:bg-blue-50 transition-colors">
                                                            <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-gray-500 bg-gray-50">
                                                                    {startIdx + rowIdx + 1}
                                                                </td>
                                                                {row.map((cell, cellIdx) => (
                                                                <td key={cellIdx} className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                    {cell || <span className="text-gray-400 italic text-xs">vacío</span>}
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

                            {/* Selector de Fincas - Diseño Profesional */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                        <FontAwesomeIcon icon={faWheatAwn} className="text-xl text-orange-600" />
                                    </div>
                                <div>
                                        <label className="block text-base font-black text-gray-900">
                                            Seleccionar Finca
                                            {loadingFincas && <span className="ml-2 text-sm font-normal text-gray-500">(Cargando...)</span>}
                                    </label>
                                        <p className="text-sm text-gray-500">Opcional: Asociar datos a una finca específica</p>
                                    </div>
                                </div>
                                
                                    <select
                                        value={fincaId}
                                        onChange={(e) => setFincaId(e.target.value)}
                                        disabled={loadingFincas}
                                    className="block w-full px-4 py-4 text-sm font-semibold text-gray-900 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#A51C24] focus:border-[#A51C24] disabled:bg-gray-100 disabled:cursor-not-allowed transition-all shadow-sm hover:border-[#A51C24] bg-white"
                                    >
                                    <option value="" className="font-semibold">-- Seleccione una finca (opcional) --</option>
                                        {fincas.map((finca, idx) => (
                                        <option key={idx} value={finca.key_value || finca.id || finca.codigo || idx} className="font-semibold">
                                            {finca.nombre || finca.name || `Finca ${finca.key_value || finca.id || idx}`}
                                            </option>
                                        ))}
                                    </select>
                                
                                {/* Indicadores de estado */}
                                    {fincas.length === 0 && !loadingFincas && (
                                    <div className="bg-amber-50 p-4 rounded-xl border-2 border-amber-200">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                                                <FontAwesomeIcon icon={faExclamationTriangle} className="text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-amber-900">No se encontraron fincas</p>
                                                <p className="text-xs text-amber-700 mt-1">Verifique la conexión con la API</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {fincas.length > 0 && !fincaId && (
                                    <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                                        <p className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                                            <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                                            {fincas.length} finca(s) disponible(s) para seleccionar
                                        </p>
                                    </div>
                                )}
                                
                                {fincaId && loadingLotes && (
                                    <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                                        <div className="flex items-center gap-3">
                                            <div className="animate-spin rounded-full h-6 w-6 border-3 border-blue-200 border-t-blue-600"></div>
                                            <p className="text-sm font-semibold text-blue-900">Cargando lotes asociados...</p>
                                        </div>
                                    </div>
                                )}
                                
                                {fincaId && !loadingLotes && lotes.length > 0 && (
                                    <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                                        <p className="text-sm font-bold text-green-900 flex items-center gap-2">
                                            <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
                                            {lotes.length} lote(s) encontrado(s) en esta finca
                                        </p>
                                    </div>
                                )}
                                
                                {fincaId && !loadingLotes && lotes.length === 0 && (
                                    <div className="bg-amber-50 p-4 rounded-xl border-2 border-amber-200">
                                        <p className="text-sm font-bold text-amber-900 flex items-center gap-2">
                                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-600" />
                                            No se encontraron lotes para esta finca
                                        </p>
                                    </div>
                                    )}
                                </div>

                                {/* Visualización de Lotes Asociados */}
                                {fincaId && !loadingLotes && lotes.length > 0 && (
                                    <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border-2 border-green-200 shadow-sm">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <FontAwesomeIcon icon={faMapLocationDot} className="text-2xl text-green-600" />
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
                                                        <FontAwesomeIcon icon={faLeaf} className="text-2xl text-green-500 opacity-50" />
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
                                        <p className="mt-3 text-sm text-gray-600 italic text-center flex items-center justify-center gap-2">
                                            <FontAwesomeIcon icon={faCircleCheck} className="text-blue-500" />
                                            <span>Haz clic en un lote para filtrarlo en el mapa</span>
                                        </p>
                                    </div>
                                )}

                                {fincaId && loadingLotes && (
                                    <div className="mt-4 p-6 bg-blue-50 rounded-lg border border-blue-200 text-center">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                        <p className="text-blue-700 font-medium">Cargando lotes asociados...</p>
                                    </div>
                                )}

                            {/* Botón de Validación - Diseño Profesional */}
                            <div className="pt-4 border-t-2 border-gray-200">
                                <button
                                    onClick={handleFileUpload}
                                    disabled={loading || !selectedFile}
                                    className="w-full px-8 py-5 bg-gradient-to-r from-[#A51C24] to-[#8B1538] text-white font-black text-base rounded-2xl hover:from-[#8B1538] hover:to-[#A51C24] disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                                >
                                    {loading ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} className="text-2xl animate-spin" />
                                            <span>PROCESANDO ARCHIVO...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faCircleCheck} className="text-xl" />
                                            <span>VALIDAR Y ANALIZAR ARCHIVO</span>
                                            <FontAwesomeIcon icon={faArrowRight} className="text-lg" />
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-sm text-gray-500 mt-3 flex items-center justify-center gap-2">
                                    {!selectedFile && (
                                        <>
                                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-500" />
                                            <span>Debe seleccionar un archivo para continuar</span>
                                        </>
                                    )}
                                    {selectedFile && !loading && (
                                        <>
                                            <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                                            <span>Listo para validar</span>
                                        </>
                                    )}
                                </p>
                            </div>
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
                                <h4 className="text-lg font-semibold text-red-800 mb-2 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faXmark} /> Error
                                </h4>
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
                                <h4 className="text-lg font-semibold text-green-800 mb-2 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faCheckCircle} /> Respuesta
                                </h4>
                                
                                {/* Validation Summary */}
                                {response.meta && (
                                    <div className="mb-4 p-4 bg-white rounded-lg border border-green-200">
                                        <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                            <FontAwesomeIcon icon={faFileCircleCheck} className="text-green-600" />
                                            Resumen
                                        </h5>
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
                                                    {response.ok ? (
                                                        <span className="flex items-center gap-2">
                                                            <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
                                                            Válido
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-2">
                                                            <FontAwesomeIcon icon={faXmark} className="text-red-600" />
                                                            Con errores
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Columns Detected */}
                                {response.columns_detected && (
                                    <div className="mb-4 p-4 bg-white rounded-lg border border-green-200">
                                        <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                            <FontAwesomeIcon icon={faFile} className="text-blue-600" />
                                            Columnas detectadas
                                        </h5>
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
                                        <h5 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600" />
                                            Errores encontrados
                                        </h5>
                                        
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
                                                <div className="mb-6 bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-2xl p-6 shadow-lg">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-md">
                                                                <FontAwesomeIcon icon={faFileCircleCheck} className="text-white text-xl" />
                                                            </div>
                                                            <div>
                                                                <h6 className="font-black text-xl text-red-900">Resumen de Validación</h6>
                                                                <p className="text-sm text-red-700">Revisa los detalles a continuación</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-4xl font-black text-red-600">{totalErrors}</div>
                                                            <div className="text-xs text-red-700 font-medium">Total Errores</div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Grid de estadísticas */}
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                                                        <div className="bg-white rounded-xl p-3 border border-red-200 shadow-sm">
                                                            <div className="text-2xl font-black text-red-600">{totalErrors}</div>
                                                            <div className="text-xs text-gray-600 mt-1">Errores Totales</div>
                                                        </div>
                                                        <div className="bg-white rounded-xl p-3 border border-red-200 shadow-sm">
                                                            <div className="text-2xl font-black text-orange-600">{errorSummary.length}</div>
                                                            <div className="text-xs text-gray-600 mt-1">Tipos de Error</div>
                                                        </div>
                                                        <div className="bg-white rounded-xl p-3 border border-red-200 shadow-sm col-span-2 md:col-span-1">
                                                            <div className="text-2xl font-black text-purple-600">{rowsWithErrors.length}</div>
                                                            <div className="text-xs text-gray-600 mt-1">Filas Afectadas</div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Breakdown visual */}
                                                    <div className="mt-4 pt-4 border-t border-red-200">
                                                        <p className="text-xs font-semibold text-red-700 mb-2 uppercase tracking-wide">Desglose por tipo:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {errorSummary.map((summary, idx) => (
                                                                <span 
                                                                    key={idx}
                                                                    className="px-3 py-1.5 bg-white border-2 border-red-300 rounded-lg text-xs font-semibold text-red-800 shadow-sm"
                                                                >
                                                                    {summary}
                                                                </span>
                                                            ))}
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
                                                    <div key={errorType} className="mb-4 bg-white rounded-xl border-2 border-yellow-300 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                        {/* Header */}
                                                        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b-2 border-yellow-300 p-4">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-2xl">📋</span>
                                                                    <div>
                                                                        <h6 className="font-black text-base text-gray-900">
                                                                            {getErrorLabel(errorType)}
                                                                        </h6>
                                                                        <p className="text-xs text-gray-600 mt-0.5">
                                                                            {missingCols.length} {missingCols.length === 1 ? 'columna faltante' : 'columnas faltantes'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="px-4 py-1.5 bg-white rounded-lg border-2 border-yellow-300 shadow-sm">
                                                                    <span className="text-lg font-black text-yellow-600">{missingCols.length}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Contenido */}
                                                        <div className="bg-yellow-50 p-4">
                                                            <div className="bg-white p-4 rounded-lg border border-yellow-200 shadow-sm">
                                                                <p className="text-sm font-semibold text-gray-900 mb-3">⚠️ Columnas requeridas que faltan:</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {missingCols.map((col, idx) => (
                                                                        <span 
                                                                            key={idx}
                                                                            className="px-3 py-1.5 bg-yellow-100 border-2 border-yellow-300 rounded-lg text-sm font-bold text-yellow-800 shadow-sm"
                                                                        >
                                                                            {col}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                                <p className="text-xs text-gray-600 mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                                    💡 <strong>Solución:</strong> Agrega estas columnas a tu archivo CSV/XLSX y vuelve a subirlo para continuar con la validación.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            
                                            // Asegurar que errors es un array para otros tipos
                                            const errorsArray = Array.isArray(errors) ? errors : [errors];
                                            
                                            // Color y icono por tipo de error
                                            const errorConfig = {
                                                'coords_duplicadas': { color: 'red', icon: '📍', bg: 'bg-red-50', border: 'border-red-300' },
                                                'linea_duplicada_en_lote': { color: 'orange', icon: '📊', bg: 'bg-orange-50', border: 'border-orange-300' },
                                                'posicion_duplicada_en_linea': { color: 'orange', icon: '🔢', bg: 'bg-orange-50', border: 'border-orange-300' },
                                                'lote_invalido': { color: 'purple', icon: '🏷️', bg: 'bg-purple-50', border: 'border-purple-300' },
                                                'rango_coord': { color: 'blue', icon: '🌐', bg: 'bg-blue-50', border: 'border-blue-300' },
                                                'valores_vacios': { color: 'amber', icon: '⚠️', bg: 'bg-amber-50', border: 'border-amber-300' }
                                            };
                                            const config = errorConfig[errorType] || { color: 'red', icon: '❌', bg: 'bg-red-50', border: 'border-red-300' };
                                            
                                            return (
                                                <div key={errorType} className="mb-4 bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                    {/* Header del tipo de error */}
                                                    <div className={`${config.bg} ${config.border} border-b-2 p-4`}>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-2xl">{config.icon}</span>
                                                                <div>
                                                                    <h6 className="font-black text-base text-gray-900">
                                                                        {getErrorLabel(errorType)}
                                                                    </h6>
                                                                    <p className="text-xs text-gray-600 mt-0.5">
                                                                        {errorsArray.length} {errorsArray.length === 1 ? 'error encontrado' : 'errores encontrados'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className={`px-4 py-1.5 bg-white rounded-lg border-2 ${config.border} shadow-sm`}>
                                                                <span className={`text-lg font-black ${config.color === 'red' ? 'text-red-600' : config.color === 'orange' ? 'text-orange-600' : config.color === 'purple' ? 'text-purple-600' : config.color === 'blue' ? 'text-blue-600' : config.color === 'amber' ? 'text-amber-600' : 'text-red-600'}`}>{errorsArray.length}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Lista de errores */}
                                                    <div className={`${config.bg} p-4 max-h-64 overflow-y-auto`}>
                                                        <div className="space-y-2">
                                                            {errorsArray.slice(0, 10).map((error, idx) => (
                                                                <div 
                                                                    key={idx} 
                                                                    className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow transition-shadow"
                                                                >
                                                                    <div className="text-sm text-gray-800 leading-relaxed">
                                                                        {renderErrorMessage(errorType, error)}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {errorsArray.length > 10 && (
                                                                <div className="bg-gray-100 p-3 rounded-lg border border-gray-300 text-center">
                                                                    <p className="text-sm text-gray-600 font-medium">
                                                                        <span className="font-black text-gray-900">+{errorsArray.length - 10}</span> error{errorsArray.length - 10 !== 1 ? 'es' : ''} más
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 mt-1">Usa el editor manual para corregirlos</p>
                                                                </div>
                                                            )}
                                                        </div>
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
                                                                <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-600" /> <strong>No se puede generar archivo corregido:</strong>
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
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <button
                                                            onClick={handleDownloadCorrectedFile}
                                                            disabled={loading}
                                                            className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                                                        >
                                                            <FontAwesomeIcon icon={faFileCircleCheck} />
                                                            Descargar Archivo Corregido
                                                        </button>
                                                        <button
                                                            onClick={handleOpenManualEditor}
                                                            disabled={loading || rowsWithErrors.length === 0}
                                                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} />
                                                            Editar Manualmente ({rowsWithErrors.length} fila{rowsWithErrors.length !== 1 ? 's' : ''})
                                                        </button>
                                                    </div>
                                                    <p className="mt-2 text-sm text-gray-600 text-center">
                                                        Los duplicados serán eliminados automáticamente • O edita manualmente las filas con errores
                                                    </p>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* Editor Manual de Filas con Errores */}
                                {showManualEditor && rowsWithErrors.length > 0 && (
                                    <div className="mt-6 p-6 bg-white border-2 border-blue-300 rounded-2xl shadow-xl">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h5 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                                    <FontAwesomeIcon icon={faEdit} className="text-blue-600" />
                                                    Editor Manual de Filas con Errores
                                                </h5>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Edita directamente las {rowsWithErrors.length} fila(s) que contienen errores
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setShowManualEditor(false)}
                                                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                                            >
                                                <FontAwesomeIcon icon={faTimes} className="text-xl" />
                                            </button>
                                        </div>

                                        <div className="overflow-x-auto border-2 border-gray-200 rounded-lg mb-4 max-h-96 overflow-y-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 sticky top-0">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">
                                                            #
                                                        </th>
                                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">
                                                            Errores
                                                        </th>
                                                        {csvPreview && csvPreview.headers.map((header, idx) => (
                                                            <th key={idx} className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase min-w-[120px]">
                                                                {header}
                                                            </th>
                                                        ))}
                                                        <th className="px-3 py-2 text-center text-xs font-bold text-gray-700 uppercase">
                                                            Acciones
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {rowsWithErrors.map((rowData) => (
                                                        <tr 
                                                            key={rowData.rowIndex} 
                                                            className="hover:bg-blue-50 transition-colors"
                                                        >
                                                            <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-gray-900 bg-gray-50">
                                                                {rowData.rowNumber}
                                                            </td>
                                                            <td className="px-3 py-2 text-xs">
                                                                <div className="space-y-1 max-w-xs">
                                                                    {rowData.errors.map((err, errIdx) => (
                                                                        <div key={errIdx} className="text-red-600 bg-red-50 px-2 py-1 rounded">
                                                                            {renderErrorMessage(err.type, err.errorData)}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            {rowData.editedRow.map((cell, cellIdx) => (
                                                                <td key={cellIdx} className="px-3 py-2">
                                                                    <input
                                                                        type="text"
                                                                        value={cell || ''}
                                                                        onChange={(e) => handleCellEdit(rowData.rowIndex, cellIdx, e.target.value)}
                                                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                    />
                                                                </td>
                                                            ))}
                                                            <td className="px-3 py-2 text-center">
                                                                <button
                                                                    onClick={() => handleDiscardRowChanges(rowData.rowIndex)}
                                                                    className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                                                                    title="Descartar cambios"
                                                                >
                                                                    <FontAwesomeIcon icon={faTimes} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                            <p className="text-sm text-gray-600">
                                                <strong>💡 Tip:</strong> Haz clic en cualquier celda para editarla. Los cambios se aplicarán al descargar el archivo.
                                            </p>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setShowManualEditor(false)}
                                                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={handleSaveManualEdits}
                                                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition flex items-center gap-2"
                                                >
                                                    <FontAwesomeIcon icon={faSave} />
                                                    Guardar y Descargar
                                                </button>
                                            </div>
                                        </div>
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
                                    <FontAwesomeIcon icon={faMapLocationDot} className="mr-2" />
                                    Visualización en Mapa
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
                                <MapboxMap 
                                    spots={spotsData}
                                    selectedLote={selectedLote}
                                    fincaId={fincaId}
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
                                            {sendingToSioma ? (
                                                <>
                                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Enviando...
                                                </>
                                            ) : response.sentToSioma ? (
                                                <>
                                                    <FontAwesomeIcon icon={faCheckCircle} /> Enviado a Sioma
                                                </>
                                            ) : (
                                                <>
                                                    <FontAwesomeIcon icon={faArrowRight} /> Enviar a Sioma
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {response.sentToSioma && (
                                        <div className="px-4 py-2 bg-green-100 border border-green-300 rounded-lg flex items-center gap-2">
                                            <span className="text-green-800 flex items-center gap-2">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
                                                Datos enviados exitosamente a Sioma
                                            </span>
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
            </section>
        </SiomaLayout>
    );
}
