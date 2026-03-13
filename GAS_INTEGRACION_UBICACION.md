# Cambios necesarios en GAS para guardar ubicación normalizada

Sí: **hay que tocar tu Google Apps Script** para que los nuevos campos de Google Places se persistan en la hoja.

El front ya envía estos campos:

- `ubicacion-municipio`
- `ubicacion-provincia`
- `ubicacion-comunidad`
- `ubicacion-pais`
- `ubicacion-latitud`
- `ubicacion-longitud`

## 1) Añadir columnas en `expectedHeaders`

En tu `doPost`, en el array `expectedHeaders`, añade estos 6 headers (recomendado justo después de `ubicacion-terreno`):

```javascript
const expectedHeaders = [
  'your-name','your-email','tel-686','checkbox-374','cualidades-otros',
  'radio-188','ubicacion-terreno',
  'ubicacion-municipio','ubicacion-provincia','ubicacion-comunidad','ubicacion-pais','ubicacion-latitud','ubicacion-longitud',
  'number-419','date-33','number-420',
  'number-421','number-422','number-423','coherencia-dormitorios',
  'coherencia-presupuesto','Fecha','Respondido','Notas','FechaSeguimiento',
  'Prioridad','Estado','Llamado','ID','fecha-llamada','como-conocido',
  'como-conocido-otros','descripcion-vivienda','distribucion-dia','garaje',
  'piscina','estancia-adicional','superficie-parcela','edificabilidad',
  'ocupacion','referencia-catastral','presupuesto-deseado','viabilidad',
  'informacion-adicional','fecha-mail','info-enviada','fecha-reunion',
  'imprescindible','NoContestados','procedencia-contacto','vivienda-interesada',
  'documentacion','eliminado','MotivoSeguimiento','FechaNotificacion','HoraNotificacion','estudio-viabilidad'
];
```

> Importante: en tu script también aparece `expectedHeaders` dentro de `onEdit` y `testearHeaders`. Deben quedar **idénticos** para no reescribir cabeceras sin estos campos.

## 2) No hace falta lógica extra en `doPost`

Tu bloque actual ya hace:

- Parseo de `POST`
- Fusión `finalData = { ...existingData, ...data }`
- Escritura por cabeceras (`expectedHeaders.map(...)`)

Con los headers nuevos, los valores se guardarán automáticamente.

## 3) (Opcional) Tipado de lat/lng

Si quieres guardar coordenadas como número en la hoja, puedes normalizar antes de `rowData`:

```javascript
['ubicacion-latitud', 'ubicacion-longitud'].forEach((k) => {
  if (finalData[k] !== undefined && finalData[k] !== '') {
    const n = Number(finalData[k]);
    finalData[k] = Number.isFinite(n) ? n : '';
  }
});
```

## 4) Comprobación rápida

1. Envía una ficha desde `crearficha.html` seleccionando una ciudad sugerida por Google Places.
2. En la hoja, verifica que se rellenan:
   - `ubicacion-terreno`
   - `ubicacion-municipio`
   - `ubicacion-provincia`
   - `ubicacion-comunidad`
   - `ubicacion-pais`
   - `ubicacion-latitud`
   - `ubicacion-longitud`

Si no aparecen, casi siempre es porque `expectedHeaders` no incluye esos nombres exactos o fue sobrescrito por `onEdit`.
