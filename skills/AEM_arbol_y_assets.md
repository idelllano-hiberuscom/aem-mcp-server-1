# Skill: Estructura de árbol y assets en AEM

Mapeo de raíces JCR (usar rutas EXACTAS en llamadas MCP):

| Tipo | Ruta JCR (absoluta) | Tipo de nodo | Nota |
|---|---:|---|---|
| Sitio — Català | /content/thisisbarcelona/ca | cq:Page (carpeta de páginas) | Punto de inicio para operaciones de autoring locales (sites console)
| Sitio — Castellano | /content/thisisbarcelona/es | cq:Page | (si existe) consultar antes de operar
| Sitio — Inglés (US) | /content/thisisbarcelona/us | cq:Page | utilizado en plantillas y enlaces estáticos
| DAM — imágenes | /content/dam/thisisbarcelona/images | dam:Asset (carpeta) | raíz para búsquedas y subidas de imágenes
| DAM — assets generales | /content/dam/thisisbarcelona | dam:Asset | incluye subcarpetas y metadatos jcr:content

Reglas operativas estrictas:
- Siempre iniciar búsquedas de páginas bajo `/content/thisisbarcelona` y preferir la rama de locale indicada por el usuario (`/ca`, `/es`, `/us`).
- Para assets, usar `/content/dam/thisisbarcelona` y restringir operaciones a `/content/dam/thisisbarcelona/images` salvo que se indique otra subruta.
- No ejecutar borrados masivos sin confirmación humana explícita; advertir sobre hijos y replicas.

Visibilidad web (autor):
- Sites console: http://localhost:4502/sites.html/content/thisisbarcelona/ca
- Assets console: http://localhost:4502/assets.html/content/dam/thisisbarcelona/images