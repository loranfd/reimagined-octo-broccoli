# GAS (solo pegar) — ajustes mínimos para guardar Google Places

Perfecto. Aquí tienes **solo lo que debes pegar** en tu GAS actual, manteniendo tu estructura tal cual.

## 1) Sustituye los 3 `expectedHeaders` por este mismo bloque

Usa exactamente este array en:
- `doPost`
- `onEdit`
- `testearHeaders`

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

## 2) (Opcional, recomendado) convertir lat/lng a número en `doPost`

Pega este bloque justo después de:
```javascript
const finalData = { ...existingData, ...data };
```

```javascript
['ubicacion-latitud', 'ubicacion-longitud'].forEach((k) => {
  if (finalData[k] !== undefined && finalData[k] !== '') {
    const n = Number(finalData[k]);
    finalData[k] = Number.isFinite(n) ? n : '';
  }
});
```

## 3) Listo

Con eso, cuando el front envíe:
- `ubicacion-municipio`
- `ubicacion-provincia`
- `ubicacion-comunidad`
- `ubicacion-pais`
- `ubicacion-latitud`
- `ubicacion-longitud`

se guardarán en Google Sheets automáticamente.
