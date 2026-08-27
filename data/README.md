# Datos de origen

Ficheros de terceros que alimentan a los generadores de `app/scripts/`. No se
editan a mano y no se leen en tiempo de ejecución: se convierten en assets del
bundle y ahí acaba su vida.

## `geonames-ES.txt.gz`

Volcado de España de **GeoNames**, https://download.geonames.org/export/dump/ES.zip
(descargado el 2026-08-26). Guardado aquí comprimido, y en el repo a propósito:
regenerar el listado de municipios no debería depender de que una URL siga viva
dentro de dos años.

> Este trabajo usa datos de GeoNames (https://www.geonames.org/), publicados
> bajo licencia **Creative Commons Attribution 4.0** (CC BY 4.0).

La atribución es obligatoria por licencia. Cuando la app tenga pantalla de
créditos o de ajustes con "acerca de", **tiene que aparecer ahí** — igual que la
de las fuentes y la de `astronomy-engine`.

Lo consume `app/scripts/generateMunicipalities.mjs`
(`npm run generate:municipalities`), que filtra a lugares poblados con población
conocida —~8.000, prácticamente los 8.131 municipios de España— y escribe
`app/src/pet/ui/municipalities.generated.json`.
