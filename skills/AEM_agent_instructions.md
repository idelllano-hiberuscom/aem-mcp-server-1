# Skill: Instrucciones operativas para el Agente MCP (resumido)

Reglas obligatorias antes de ejecutar acciones:
- Confirmación requerida para cualquier operación de escritura/creación/borrado. Mensaje estándar: "Voy a ejecutar [acción] sobre [path]. ¿Confirmas?"
- Nunca modificar nodos bajo `/libs`.
- Validar existencia del `parentPath` antes de crear páginas o componentes.

Mapeo de intención -> herramienta MCP + parámetros mínimos (usar rutas ABSOLUTAS):

| Intención | MCP tool | Parámetros mínimos (JSON) |
|---|---|---|
| Crear página | callTool: `createPage` | {"instance":"local","parentPath":"/content/thisisbarcelona/ca","pageName":"node-name","title":"Title","template":"/conf/thisisbarcelona/settings/wcm/templates/home-page"} |
| Obtener templates list | callTool: `getTemplates` | {"sitePath":"/content/thisisbarcelona"} |
| Obtener estructura template | callTool: `getTemplateStructure` | {"templatePath":"/conf/thisisbarcelona/settings/wcm/templates/home-page"} |
| Añadir componente a página | callTool: `addComponent` | {"instance":"local","pagePath":"/content/thisisbarcelona/ca/home","resourceType":"thisisbarcelona/components/tbc-components/cmp-gallery","containerPath":"jcr:content/root/container","name":"cmp-gallery-1"} |
| Leer archivo HTL/JS/CSS | readResource OR callTool: `readAemFile` | {"path":"/apps/thisisbarcelona/components/tbc-components/cmp-gallery/cmp-gallery.html"} |
| Obtener metadata asset | callTool: `getAssetMetadata` | {"assetPath":"/content/dam/thisisbarcelona/images/photo.jpg"} |
| Subir/actualizar asset | callTool: `updateAsset` | {"assetPath":"/content/dam/thisisbarcelona/images/photo.jpg","binary":<base64>,"metadata":{}} |
| Publicar (activate) | callTool: `manageReplication` | {"path":"/content/thisisbarcelona/ca/home","action":"Activate"} |
| Ejecutar búsqueda avanzada | callTool: `runQueryBuilder` | {"queryParams": {"path":"/content/thisisbarcelona","type":"cq:Page","p.limit":"100"}} |

Comportamiento en errores comunes:
- Si el servidor devuelve "Not Acceptable" añadir `Accept: application/json, text/event-stream` y reintentar 1 vez.
- Si la sesión MCP expira: ejecutar `initialize` una sola vez y reintentar la llamada; si falla, reportar error.

Seguridad y límites:
- Confirmar explícitamente antes de borrar cualquier nodo bajo `/content` o `/apps`.
- Para operaciones masivas (p. ej. mover/cambiar resourceType en >10 páginas), devolver un plan de ejecución y pedir aprobación.

Formato de respuesta esperado por el Agente:
- Siempre devolver un JSON con: `{ "ok": <bool>, "action": "<name>", "statusCode": <int>, "sessionId": "<id|null>", "body": <raw server body|null>, "error": <error|null> }`.
