# Skill: AEM Components Registry

Root components path: /apps/thisisbarcelona/components (nt:unstructured)

Nota: el `resourceType` a usar en operaciones Sling/AEM = "thisisbarcelona/components/<relative-path>", p.ej. `thisisbarcelona/components/tbc-components/cmp-gallery`.

| Intención del usuario | Recurso JCR (absoluta) | resourceType (Sling) | Tipo de nodo |
|---|---:|---|---|
| Header (Experience Fragment) | /apps/thisisbarcelona/components/tbc-components/headerxf | thisisbarcelona/components/tbc-components/headerxf | nt:unstructured (component)
| Footer (Experience Fragment) | /apps/thisisbarcelona/components/tbc-components/footerxf | thisisbarcelona/components/tbc-components/footerxf | nt:unstructured
| Hero component | /apps/thisisbarcelona/components/tbc-components/cmp-hero-component | thisisbarcelona/components/tbc-components/cmp-hero-component | nt:unstructured
| Banner component | /apps/thisisbarcelona/components/tbc-components/cmp-banner-component | thisisbarcelona/components/tbc-components/cmp-banner-component | nt:unstructured
| Gallery | /apps/thisisbarcelona/components/tbc-components/cmp-gallery | thisisbarcelona/components/tbc-components/cmp-gallery | nt:unstructured
| Maps (Google Maps) | /apps/thisisbarcelona/components/tbc-components/cmp-maps | thisisbarcelona/components/tbc-components/cmp-maps | nt:unstructured
| Timeline | /apps/thisisbarcelona/components/tbc-components/cmp-timeline | thisisbarcelona/components/tbc-components/cmp-timeline | nt:unstructured
| Cards / Columns | /apps/thisisbarcelona/components/tbc-components/cmp-columns | thisisbarcelona/components/tbc-components/cmp-columns | nt:unstructured
| Filters / Search widgets | /apps/thisisbarcelona/components/tbc-components/cmp-filters | thisisbarcelona/components/tbc-components/cmp-filters | nt:unstructured
| Misc core components (reusable) | /apps/thisisbarcelona/components/core/* | thisisbarcelona/components/core/<name> | nt:unstructured

Reglas y convenciones:
- Para añadir un componente a una página usar `resourceType` EXACTO según la tabla.
- Componentes de la carpeta `core` son auxiliares; preferir `thisisbarcelona/components/core/<name>` cuando exista.
- Para operaciones de lectura de archivos del componente (HTL/JS/CSS) usar `readAemFile` con la ruta absoluta al archivo (ej: `/apps/thisisbarcelona/components/tbc-components/cmp-gallery/cmp-gallery.html`).
- No modificar `/libs` ni `/etc`.

Si se solicita "lista de componentes disponibles", devolver todos los nodos bajo `/apps/thisisbarcelona/components`.