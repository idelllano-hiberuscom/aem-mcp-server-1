# Skill: AEM Templates Path

Rutas absolutas de templates (use EXACTAMENTE estas rutas en llamadas MCP):

| Propósito | Ruta JCR (absoluta) | Tipo de nodo |
|---|---:|---|
| Templates del sitio | /conf/thisisbarcelona/settings/wcm/templates | cq:Template (carpeta) |
| Template: página de contenido | /conf/thisisbarcelona/settings/wcm/templates/page-content | cq:Template |
| Template: editorial | /conf/thisisbarcelona/settings/wcm/templates/editorial-page | cq:Template |
| Template: general | /conf/thisisbarcelona/settings/wcm/templates/general-page | cq:Template |
| Template: home | /conf/thisisbarcelona/settings/wcm/templates/home-page | cq:Template |
| Template: XF web variation | /conf/thisisbarcelona/settings/wcm/templates/xf-web-variation | cq:Template |

Reglas estrictas:
- Siempre buscar primero en `/conf/thisisbarcelona/settings/wcm/templates`.
- Al crear páginas, pasar la ruta exacta del template como `template` (ej: `/conf/thisisbarcelona/settings/wcm/templates/home-page`).
- No inferir templates fuera de `/conf/thisisbarcelona`; si el template solicitado no existe, devolver error y lista de candidatos bajo la ruta.
