# AEM MCP Server - Plan de Pruebas Intensivo (Para el Agente IA)

**INSTRUCCIONES PARA EL AGENTE:**
Hola, Agente. Este es un manifiesto de prueba intensiva de tus capacidades MCP contra una instancia local de AEM.
Debes ejecutar cada una de las siguientes Fases secuencialmente haciendo uso de tus herramientas (`callTool`).
No avances a la siguiente fase hasta confirmar que la actual se ha completado con éxito. Repórtale al usuario los resultados de cada paso.

*Nota: Se han omitido deliberadamente las pruebas de GraphQL, Dispatcher y Workflows.*

---

## Fase 1: Diagnóstico de Sistema y Búsquedas

1. **Estado de OSGi**: Usa la herramienta `listBundles` para obtener el listado de configuraciones de Java. Dime cuántos bundles en total hay y si identificas alguno que empiece por `com.adobe.cq`.
2. **Revisión de Logs**: Usa `tailLogs` con los parámetros `{"lines": 100, "logFile": "error.log"}`. Resume brevemente si hay algún "ERROR" o "Exception" reciente, o si el log está limpio.
3. **Query Builder**: Ejecuta una búqueda usando `runQueryBuilder`. Parámetros sugeridos: `{"path": "/content", "type": "cq:Page", "p.limit": "5"}`. Lista los nombres de las primeras 5 páginas que encuentres.

---

## Fase 2: Identidades y Permisos (User Management & ACLs)

4. **Creación de Grupo y Usuario**:
   - Usa `createGroup` para crear un grupo llamado `mcp-test-group`.
   - Usa `createUser` para crear un usuario llamado `mcp-test-user` (puedes omitir la contraseña para que use por defecto el mismo nombre).
5. **Afiliación**: Usa `addMemberToGroup` para meter a `mcp-test-user` dentro de `mcp-test-group`.
6. **Manejo de ACLs (Permisos)**: 
   - Usa `setAcl` sobre la ruta `/content` para el `principalId` que acabamos de crear (`mcp-test-group`).
   - Otórgale permisos de lectura y deniégale escritura: `{"jcr:read": "granted", "jcr:write": "denied"}`.
   - Verifica que se han aplicado usando `getAcl` sobre `/content`.

---

## Fase 3: Gestión de Taxonomía y Contenido

7. **Creación de Etiquetas (Tags)**: Usa `createTag` para crear un tag nuevo. Usa el namespace `mcp-test` y el nombre de tag `hello-world`. (Título: "MCP Test Tag").
8. **Asignación de Etiquetas**: 
   - Asume una página base existente que hayas visto en la Fase 1 (por ejemplo, el root de tu proyecto, como `/content/mysite/us/en`).
   - Usa `setTags` (o `updateComponent` en su nodo `jcr:content`) para añadirle la etiqueta `mcp-test:hello-world`.

---

## Fase 4: Código Frontend y Manipulación de Archivos RAW (Hot-Patching)

9. **Inyección de Código**: 
   - Vamos a crear/sobrescribir un archivo ficticio. Usa `writeAemFile` en la ruta `/apps/mcp-test-script.html`.
   - Contenido a inyectar: `<h1>Hello World from MCP Agent!</h1><sly data-sly-test="${properties.title}">${properties.title}</sly>`
10. **Lectura de Código**: Usa `readAemFile` sobre la misma ruta `/apps/mcp-test-script.html` para comprobar que AEM te devuelve exactamente el texto y sintaxis que acabas de guardar.

---

## Fase 5: Limpieza del Entorno (Rollover / Rollback)

Es hora de dejar el servidor AEM tal como estaba:
11. **Limpieza de Archivos**: Pista: Aunque creamos `mcp-test-script.html` con la herramienta write, el archivo reside bajo `/apps`. Usa una herramienta genérica de borrado / ejecución JCR para limpiar `/apps/mcp-test-script.html` (o solicita permiso y bórralo manualmente).
12. **Purga de Permisos**: Usa `removeAcl` apuntando a `/content` y pasándole tu `principalId` (`mcp-test-group`).
13. **Purga de Cuentas**: Usa `deleteAuthorizable` para eliminar `mcp-test-user` y luego repítelo para `mcp-test-group`.
14. **Borrado de Tag**: Usa `deleteTag` para eliminar `mcp-test:hello-world` (o el tagBase `mcp-test`).

---

**Reporte Final:**
Una vez concluyas la Fase 5, realiza un resumen ejecutivo de cómo se comunicaron las herramientas entre sí y si AEM respondió con los formatos JSON y de Texto Plano esperados.