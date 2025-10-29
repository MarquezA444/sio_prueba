# 🚀 Inicio Rápido - Sin Docker

## Opción 1: Probar SIN Validador Python (Usar PHP)

La aplicación funciona perfectamente usando solo el validador PHP integrado.

### Pasos:

1. **Iniciar Laravel**
   ```bash
   php artisan serve
   ```

2. **Iniciar Frontend** (en otra terminal)
   ```bash
   npm run dev
   ```

3. **Acceder a:** `http://localhost:8000`

4. **Registrarse e iniciar sesión**

5. **Probar con archivo CSV:**
   - Subir archivo de prueba
   - Ver validación
   - Ver mapa interactivo
   - Descargar archivo corregido

---

## Opción 2: Con Validador Python (Más Robusto)

Si quieres usar Python para validaciones más robustas:

### Instalar Python (si no lo tienes)

1. Descarga Python 3.11+ desde: https://www.python.org/downloads/
2. Durante instalación, marca "Add Python to PATH"

### Pasos:

1. **Abrir terminal en la carpeta del proyecto**
   ```bash
   cd C:\Users\dejes\OneDrive\Desktop\siomav_1\python-validator
   ```

2. **Instalar dependencias** (primera vez)
   ```bash
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Iniciar validador Python** (en terminal separada)
   ```bash
   cd python-validator
   venv\Scripts\activate
   uvicorn app.main:app --host 0.0.0.0 --port 8001
   ```

4. **Iniciar Laravel** (en otra terminal)
   ```bash
   php artisan serve
   ```

5. **Iniciar Frontend** (en otra terminal)
   ```bash
   npm run dev
   ```

---

## 📝 Crear Archivo de Prueba

Crea un archivo `spots_test.csv` en tu escritorio:

```csv
Latitud,Longitud,Línea palma,Posición palma,Lote
7.336576854,-76.72322992,1,1,1
7.336536382,-76.72316139,1,2,1
7.336495910,-76.72309286,1,3,1
7.336455438,-76.72302433,2,1,1
7.336414966,-76.72295580,2,2,1
```

---

## 🎯 Qué Probar

1. ✅ Login/Registro
2. ✅ Obtener Fincas (botón en Dashboard)
3. ✅ Subir archivo CSV
4. ✅ Validar datos
5. ✅ Ver mapa interactivo (seleccionar lote)
6. ✅ Descargar archivo corregido (si hay errores)
7. ✅ Enviar a Sioma (si todo está OK)

---

## 🐛 Si algo falla

**Error de conexión con Python?**
- No pasa nada, Laravel usa PHP como fallback automáticamente
- Las validaciones funcionan igual, solo un poco más lentas

**Error 404 en rutas?**
- Ejecuta: `php artisan route:clear`

**Problemas con assets?**
- Ejecuta: `npm run build`

---

## ⚡ El más Rápido - Solo Laravel

```bash
# Terminal 1
php artisan serve

# Terminal 2  
npm run dev
```

¡Y listo! 🎉

