# 📁 Archivos de Prueba Generados

## Archivos Incluidos

### 1. `archivo_prueba_validaciones.csv` - Con TODOS los errores

Este archivo contiene **15 filas** con múltiples errores para probar todas las validaciones:

#### Errores incluidos:

1. **Línea 3** - ❌ Coordenada duplicada de la línea 1
   - Misma lat/lon que línea 1 pero diferente posición

2. **Línea 4** - ❌ Línea duplicada en lote
   - Lote "1" tiene línea "1" repetida (línea 1 y 4)

3. **Línea 7** - ⚠️ Posición duplicada en lote
   - Lote "1" tiene posición "2" en línea "1" (línea 2 y 7)
   - Nota: Esto podría ser un falso positivo si las líneas son diferentes

4. **Línea 9** - ❌ Latitud fuera de rango (200.0 > 90)

5. **Línea 10** - ❌ Longitud fuera de rango (500.0 > 180)

6. **Línea 11** - ❌ Valores vacíos (latitud y longitud)

7. **Línea 12** - ❌ Valor vacío (línea)

8. **Línea 13** - ❌ Valor vacío (posición)

9. **Línea 14** - ❌ Posición duplicada en línea
   - Lote "1", línea "2", posición "1" aparece en líneas 5 y 14

10. **Línea 15** - ⚠️ Línea duplicada en lote
    - Lote "2" tiene línea "1" repetida

11. **Línea 16** - ❌ Latitud y Longitud fuera de rango negativo

**Resultado esperado**: Múltiples errores detectados

---

### 2. `archivo_prueba_VALIDO.csv` - Sin errores

Este archivo contiene **13 filas** con datos completamente válidos:

- ✅ Coordenadas únicas
- ✅ Líneas no duplicadas en cada lote
- ✅ Posiciones no duplicadas en cada línea
- ✅ Coordenadas en rangos válidos
- ✅ Sin valores vacíos
- ✅ Estructura correcta

**Resultado esperado**: Validación exitosa

---

## 🧪 Cómo usar los archivos

### Prueba con archivo CON errores:

1. **En el Dashboard**: Sube `archivo_prueba_validaciones.csv`
2. **Selecciona una finca** (opcional, para validar lotes)
3. **Haz clic en "✅ Validar Archivo"**
4. **Verás múltiples errores**:
   - 2 coordenadas duplicadas
   - 2-3 líneas duplicadas en lote
   - 2 posiciones duplicadas en línea
   - 2 coordenadas fuera de rango
   - 3 valores vacíos
   - Posiblemente lotes inválidos (según API)

5. **Descarga archivo corregido** con filas marcadas

### Prueba con archivo VÁLIDO:

1. **En el Dashboard**: Sube `archivo_prueba_VALIDO.csv`
2. **Haz clic en "✅ Validar Archivo"**
3. **Verás**: ✅ Mensaje de éxito
4. **Ver el mapa**: Todos los puntos aparecerán
5. **Seleccionar un lote**: Verás las líneas en el mapa
6. **Enviar a Sioma**: Botón habilitado

---

## 📊 Validaciones que se Probarán

| Validación | Archivo con Errores | Archivo Válido |
|------------|---------------------|----------------|
| Coordenadas duplicadas | ✅ 2 casos | ✅ Ninguno |
| Líneas duplicadas | ✅ 2 casos | ✅ Ninguno |
| Posiciones duplicadas | ✅ 1 caso | ✅ Ninguno |
| Rangos de coordenadas | ✅ 2 casos | ✅ Todos OK |
| Valores vacíos | ✅ 3 casos | ✅ Ninguno |
| Lotes válidos | ⚠️ Si seleccionas finca | ⚠️ Si seleccionas finca |

---

## 🎯 Flujo de Prueba Completo

### Paso 1: Probar Validaciones (Archivo con Errores)
```
1. Subir archivo_prueba_validaciones.csv
2. Seleccionar finca (opcional)
3. Validar
4. Ver resumen de errores
5. Descargar archivo corregido
```

### Paso 2: Corregir Errores
```
1. Abrir archivo corregido
2. Revisar columnas "Estado" y "Errores"
3. Eliminar o corregir filas con ERROR
```

### Paso 3: Validar Archivo Limpio
```
1. Crear archivo con solo filas "OK"
2. Subir nuevamente
3. Debe validar sin errores
```

### Paso 4: Visualizar y Enviar
```
1. Ver mapa con todos los puntos
2. Seleccionar lote específico
3. Ver líneas de palma
4. Enviar a Sioma
```

---

## 📝 Notas

- Los lotes "La gloria", "Lote X", etc. son solo para ejemplo
- Si seleccionas una finca real, los lotes inválidos se marcarán como error
- Las coordenadas usadas están en Colombia (cerca de -76° oeste, 7° norte)
- Puedes modificar los archivos para agregar más casos de prueba

---

¡Listo para probar todas las validaciones! 🚀

