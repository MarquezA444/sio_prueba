# 📋 Instrucciones para Agregar el Logo de SIOMA

## 🎯 Pasos para agregar tu logo:

### 1️⃣ Guarda la imagen del logo
- Descarga/guarda la imagen del logo de SIOMA que me compartiste
- Asegúrate de que esté en formato PNG con fondo transparente (preferible) o JPG

### 2️⃣ Coloca el archivo en la carpeta correcta
```
C:\xampp\htdocs\sio_prueba\public\images\sioma-logo.png
```

### 3️⃣ Renombra el archivo
- El archivo debe llamarse exactamente: `sioma-logo.png`
- Puede ser `.png`, `.jpg`, `.jpeg` o `.svg`

### 4️⃣ Si usas un formato diferente
Si tu logo NO es PNG, actualiza el archivo:
`resources/js/Components/SiomaLogo.jsx`

Cambia la línea 12:
```jsx
src="/images/sioma-logo.png"
```

Por el formato correcto:
```jsx
src="/images/sioma-logo.svg"  // Si es SVG
src="/images/sioma-logo.jpg"  // Si es JPG
```

### 5️⃣ Recompila los assets
Después de agregar el logo, ejecuta:
```bash
npm run build
```

O si quieres desarrollo en tiempo real:
```bash
npm run dev
```

### 6️⃣ Recarga el navegador
- Presiona `Ctrl + F5` para hacer un hard refresh
- O limpia la caché del navegador

## ✅ El logo aparecerá en:
- ✅ Header del sitio (esquina superior izquierda)
- ✅ Todas las páginas de la aplicación
- ✅ Versión responsive en móviles

## 📐 Recomendaciones para el logo:
- **Formato:** PNG con fondo transparente (mejor)
- **Ancho:** 150-200px (se escalará automáticamente)
- **Alto:** 40-60px
- **Peso:** Menos de 100KB para carga rápida

## 🔍 Verificación
Una vez agregado el logo, visita:
- http://127.0.0.1:8000/dashboard

Deberías ver tu logo de SIOMA en el header rojo.

---

**Nota:** El componente ya está configurado y listo. Solo necesitas colocar la imagen en la carpeta indicada.

