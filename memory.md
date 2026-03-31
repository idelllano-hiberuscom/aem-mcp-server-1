# Project Memory (ThisIsBarcelona)

## Context Snapshot
- Date: 2026-03-31
- Workspace root: C:/desa/PTBC_barcelona/code/ThisIsBarcelona
- User decision captured: stop Java code changes unless explicitly requested.

## Project Shape
- Multi-module AEM Maven project.
- Main modules: core, ui.apps, ui.content, ui.config, ui.frontend, all.
- Build command validated: `mvn clean install -pl core` (successful on 2026-03-31).

## Excel Source Analyzed
- File in repo root: `TMP_POI_PreProduccio_ThisIsBCN_CA_20260326_173817.xlsx` (real filename contains accent in "PreProduccio").
- 12 sheets detected:
  - CSV_Accessibilitat_CA_POI
  - CSV_CARDS_CA_POI
  - CSV_FAQS_CA_POI
  - CSV_Galeria_CA_POI
  - CSV_GoodToKnow_CA_POI
  - CSV_Hero_CA_POI
  - CSV_InfoPractica_CA_POI
  - CSV_Introduccion_CA_POI
  - CSV_MenuSticky_CA_POI
  - CSV_RelatedContent_CA_POI
  - CSV_Restaurantes_CA_POI
  - CSV_SEO_CA_POI
- Per sheet volume observed:
  - 858 rows total
  - 836 rows with `url_base`
  - 835 unique `url_base`
- Sticky group union (InfoPractica + MenuSticky + Accessibilitat): 835 unique `url_base`.

## User Rules Captured
- Use `url_base` as the effective path input.
- Treat `InfoPractica`, `MenuSticky`, and `Accessibilitat` under one component group: Menu Sticky.

## Migration Rules Captured (2026-03-31)
- POI pages are already created from template before migration.
- Import strategy must be create-or-update per node: check if node exists first, then update; create only if missing.
- Node names in container do not always match component naming in conversations/spreadsheets:
  - Hero component -> node `hero_component` (`cmp-hero-component`).
  - Introductory text component -> node `cmp_introductory_tex` (`cmp-introductory-text`).
  - Good To Know component -> node `cmp_good_know` (`cmp-good-know`).
- Even with different node names, property mapping is the same and is centralized in `PropCollectorUtils`.
- Go To Home is treated as fixed/default content in current flow (same values for all POI pages).

## Import Pipeline Understanding
- Excel parsing entrypoint:
  - `core/src/main/java/com/barcelona/thisisbarcelona/core/services/impl/ExcelProcessingServiceImpl.java`
- URL/path normalization:
  - `core/src/main/java/com/barcelona/thisisbarcelona/core/utils/ExcelProcessatorUtils.java`
- JCR write orchestrator:
  - `core/src/main/java/com/barcelona/thisisbarcelona/core/jobs/ExcelImportJobConsumer.java`
- Property mapping helpers:
  - `core/src/main/java/com/barcelona/thisisbarcelona/core/utils/Migration/PropCollectorUtils.java`
- JCR helper methods:
  - `core/src/main/java/com/barcelona/thisisbarcelona/core/utils/Migration/JcrUtils.java`
- Dynamic content builders:
  - Gallery: `GoodtoKnowAndGalleryUtils.java`
  - FAQ: `FaqUtils.java`
- Order orchestrator:
  - `core/src/main/java/com/barcelona/thisisbarcelona/core/utils/Migration/ComponentOrderUtils.java`
- Node create/update helper:
  - `core/src/main/java/com/barcelona/thisisbarcelona/core/utils/Migration/JcrUtils.java` (`getOrCreateComponent`, `getOrCreateNode`)

## Sheet To Destination Matching
- `CSV_Hero_CA_POI` -> Hero component (`cmp-hero-component`).
- `CSV_Introduccion_CA_POI` -> Introductory Text component (`cmp-introductory-text`).
- `CSV_GoodToKnow_CA_POI` -> Good To Know component (`cmp-good-know`).
- `CSV_Accessibilitat_CA_POI` + `CSV_InfoPractica_CA_POI` + `CSV_MenuSticky_CA_POI` -> Menu Sticky (`cmp-menu-sticky/v1/menu-sticky`).
- `CSV_Galeria_CA_POI` -> Gallery structure (`cmp-gallery` + `core/image` rows/columns).
- `CSV_FAQS_CA_POI` -> FAQ structure (`cmp-columns` + `core/accordion`).
- `CSV_SEO_CA_POI` -> page-level properties in core page dialog.
- `CSV_CARDS_CA_POI` -> page-level card properties in core page dialog.
- `CSV_RelatedContent_CA_POI` -> parsed in Excel service (DTO level).
- `CSV_Restaurantes_CA_POI` -> parsed in Excel service (DTO level).

## Important Technical Notes
- Parser currently recognizes `csv_restaurantes` alias for restaurantes sheet key.
- Parser currently uses resilient sustainability read order:
  - `sostenibilidad` -> `sustainbility` -> `sustainability`.
- MenuSticky parser reads `labelComprar` and maps practical/accessibility fields to sticky properties.
- Transport field normalization in current mapping:
  - Excel input column read: `transportFGC`.
  - Stored property key used by collector/constants: `transportTGC`.

## Confirmed Component Node Naming (Container Level)
- Hero: `hero_component`
- Menu Sticky: `menu_sticky`
- Introductory Text: `cmp_introductory_tex`
- Good To Know: `cmp_good_know`
- Gallery rows: `cmp_gallery_fila1`, `cmp_gallery_fila2`, `cmp_gallery_fila3`
- FAQ base name passed to builder: `cmp-columns_wrapper`
- FAQ outer wrapper effectively ordered as: `cmp-columns_wrapper_wrapper`
- Go To Home: `cmp_go_to_home`

## Gallery Structure Rule (Complex)
- Gallery is generated dynamically based on available image fields in each Excel row (`buildGalleryRows`).
- Layout decision is conditional:
  - Can produce one, two, or three gallery row nodes.
  - Each row can be `col-1` (full) or `col-2` (normal), depending on image presence.
- Each gallery row node uses `cmp-gallery` resourceType and stores style/theme/id props.
- Inside each gallery row:
  - Child columns `col_1` and/or `col_2` are created.
  - Each column contains child node `image` with `core/image` resourceType and image metadata.
- Result: gallery must be treated as structural generation, not a flat property update.

## FAQ Structure Rule (Complex)
- FAQ is generated as nested structure by `FaqUtils.syncFaqAccordion`:
  - Outer wrapper container: `<columnsNodeName>_wrapper` (with `wrapperContainer=true`).
  - Inside wrapper: `cmp-columns` node (`cols=col-2`).
  - `col_1` contains a fixed text component (`<h5>Preguntas frecuentes</h5>`).
  - `col_2` contains `accordion` component.
  - Accordion contains `item_1..item_5` container nodes (only valid pairs panelTitle+text).
  - Each item contains a `text` child; accordion stores `cq:panelNames`.
- Result: FAQ must be treated as a multi-node tree (container + accordion + text), not as a single simple component node.

## Go To Home Rule
- Current import flow always ensures node `cmp_go_to_home` exists and applies fixed defaults:
  - `ctaLabel=Discover`
  - `ctaUrl=/content/thisisbarcelona/ca`
  - `enableModule=true`
  - `moduleImage=/content/dam/thisisbarcelona/imagenes/976717d71f2b93df15b61f37391c50e44d3d842b.jpg`
  - `moduleSubtitle=Discover more on our homepage.`
  - `moduleTitle=Everything you need, all in one place.`

## Component Order Rule
- Final enforced order in container (when nodes exist):
  - `hero_component` -> `menu_sticky` -> `cmp_introductory_tex` -> `cmp_good_know` -> gallery rows (`cmp_gallery_fila1/2/3`) -> FAQ -> `cmp_go_to_home`.
- Order logic is centralized in `ComponentOrderUtils.enforceComponentOrder`.

## Current Risk/Behavior To Recheck Before Production Import
- Current `ExcelImportJobConsumer` (latest observed state in repo) includes cleanup logic that can remove existing nodes/properties before re-creation.
- This cleanup currently removes template-existing component nodes listed in `nodesToClean` before recreate; this is stricter than pure update-in-place behavior.
- GoodToKnow flow includes removal behavior when all text blocks are empty.
- RelatedContent/Restaurantes are parsed in service layer; persistence path should be explicitly validated in job flow before a production run.

## Dry-Run Prevalidation Outputs (2026-03-31)
- Coverage report generated:
  - `reports/prevalidation-coverage.json`
  - `reports/prevalidation-coverage.md`
- Structural report generated:
  - `reports/prevalidation-structure.json`
  - `reports/prevalidation-structure.md`

## Dry-Run Coverage Result (Excel-only)
- Total unique URLs analyzed: 835
- Full cross-component coverage (Hero/Intro/GoodToKnow/MenuSticky group/Gallery/FAQ/SEO/Cards): 835/835
- URLs with any component gap: 0
- Each relevant sheet contributes 835 unique `url_base`.

## Dry-Run Structural Result (Gallery + FAQ)
- Gallery rows analyzed: 836
  - Predicted renderable layout nodes:
    - n0: 620 rows (no gallery rows generated by current builder)
    - n1: 96 rows
    - n2: 120 rows
  - Rows with orphan image data without fila1 base: 2
  - `fila3 dcha` input presence: 0 rows in this file
- FAQ rows analyzed: 836
  - Rows with 0 valid FAQ items (component omitted): 334
  - Rows with partial title/text pairs (some items will be dropped): 118
  - Valid item distribution:
    - 0 items: 334
    - 5 items: 502

## Pilot Selection Note
- Pilot candidate URLs were generated in `reports/prevalidation-structure.md` (15 examples) prioritizing:
  - gallery orphan-image patterns
  - faq partial-pair patterns

## Pilot Execution State (Started)
- Pilot workbook generated with 15 URLs:
  - `reports/TMP_POI_PILOT_15_URLS.xlsx`
- Pilot workbook filtering summary:
  - `reports/pilot-workbook-summary.md`
- Pilot execution runbook (endpoint + checks):
  - `reports/pilot-runbook.md`
- Pilot validation reports preserved:
  - `reports/pilot-prevalidation-coverage.json`
  - `reports/pilot-prevalidation-coverage.md`
  - `reports/pilot-prevalidation-structure.json`
  - `reports/pilot-prevalidation-structure.md`
- Baseline full-file reports regenerated after pilot extraction:
  - `reports/prevalidation-coverage.json`
  - `reports/prevalidation-coverage.md`
  - `reports/prevalidation-structure.json`
  - `reports/prevalidation-structure.md`

## Pilot Metrics (15 URLs)
- Coverage:
  - TotalUniqueUrls: 15
  - FullCoverageUrls: 15
  - UrlsWithAnyGap: 0
- Gallery (pilot subset):
  - RowsAnalyzed: 15
  - n0: 15, n1: 0, n2: 0
  - Orphan images without fila1: 2
- FAQ (pilot subset):
  - RowsAnalyzed: 15
  - Zero valid items: 13
  - Partial title/text pairs: 13
  - Exactly 5 valid items: 2

## Quick Operational Notes
- If running import servlet, expected payload uses `excelPath`.
- Build/test state for core is healthy after latest verification.

## Full Import Outcome (2026-03-31 14:19)
- Full workbook import for `TMP_POI_FULL_20260331.xlsx` was executed in Author and completed content updates.
- Verified metrics from generated DAM report `report_20260331_1419.csv`:
  - 7002 component result rows
  - 778 unique page paths
  - Component rows per page set: SEO, Cards, Hero, MenuSticky, IntroduccionPOI, GoodToKnow, Gallery, FAQ, GoToHome
  - Status breakdown: OK (created)=5010, OK (updated)=1556, FAILED=436 (all FAILED are GoodToKnow rows with empty-text removal behavior)
- Import log confirms: "IMPORTACION COMPLETADA. Paginas modificadas con exito: 778".

## Failure Pattern Observed During Full Run
- A duplicate concurrent job execution occurred for topic `thisisbarcelona-catalog/excel-import-content`.
- One job instance completed and committed changes; a parallel instance failed at `ExcelImportJobConsumer.java:175` on `resourceResolver.commit()` (concurrent conflict/stale commit pattern).
- After the successful instance archived the source Excel into `/content/dam/thisisbarcelona/migration/archieve`, retry attempts from the failed instance could not find original path and ended in cancelled/error state.
- Practical implication: content migration succeeded, but job history shows ERROR/CANCEL due duplicate launch overlap.

## DAM Evidence Captured
- Report present: `/content/dam/thisisbarcelona/migration/reports/report_20260331_1419.csv`.
- Source file archived: `/content/dam/thisisbarcelona/migration/archieve/TMP_POI_FULL_20260331.xlsx`.
- Migration root no longer contains `TMP_POI_FULL_20260331.xlsx` (moved to archieve).

## Manual Package Workflow (No Servlet/Job/Listener)
- Date: 2026-03-31
- User requested package-based delivery instead of runtime trigger flow.
- Script created: `scripts/create_migrated_pages_package.ps1`
- Script behavior:
  - Reads migration report CSV (`Page Path` column)
  - Generates CRX package filter from unique page paths
  - Uploads package to `/crx/packmgr/service/.json`
  - Builds package in Author via `cmd=build`
  - Downloads built package locally
- Executed command:
  - `./scripts/create_migrated_pages_package.ps1 -ReportCsvPath "reports/report_20260331_1419.csv" -PackageName "migrated-pages-full-20260331-1419" -PackageVersion "1.0" -FilterMode replace`
- Output artifacts:
  - `reports/packages/migrated-pages-full-20260331-1419-1.0.filter.xml`
  - `reports/packages/migrated-pages-full-20260331-1419-1.0.definition.zip`
  - `reports/packages/migrated-pages-full-20260331-1419-1.0.built.zip`
  - `reports/packages/migrated-pages-full-20260331-1419-1.0.summary.md`
- AEM package path:
  - `/etc/packages/thisisbarcelona-migration/migrated-pages-full-20260331-1419-1.0.zip`
- Verification:
  - Built ZIP contains repository content under `jcr_root/content/thisisbarcelona/...`
  - Sample verified: `jcr_root/content/thisisbarcelona/ca/esports/masella/.content.xml`
