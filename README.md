# GMC Servicios – Sitio web de servicios eléctricos y de seguridad

# Aplicaciones Web
Tarea de la Unidad 1: sitio de cuatro secciones (Inicio, Servicios, Cómo trabajamos, Contacto)
con HTML5 semántico, CSS mobile first y JavaScript sin dependencias.

## Estructura
- index.html – página única
- css/styles.css – estilos (variables, Grid/Flexbox, 2 media queries)
- js/main.js – menú, filtro de servicios y validación del formulario
- assets/img/ – imágenes
- docs/ – informe técnico (PDF) y capturas/ (360, 768 y 1280 px)

## Cómo ejecutarlo
El catálogo se carga por AJAX, por lo que **no funciona abriendo index.html con file://**.
1. Abra la carpeta en VS Code e inicie **Live Server** (puerto 5500).
2. Visite http://localhost:5500

## Pendiente antes de publicar
- Reemplazar teléfono, WhatsApp, correo y dirección de ejemplo en `index.html`.
- Añadir `integrity` y `crossorigin` a los CDN (hashes en getbootstrap.com y code.jquery.com).
- Conectar el formulario a un servicio real de envío (por ahora es una simulación).