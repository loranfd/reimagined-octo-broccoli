const EXPECTED_HEADERS = [
  'your-name','your-email','tel-686','checkbox-374','cualidades-otros',
  'radio-188','ubicacion-terreno',
  'ubicacion-municipio','ubicacion-provincia','ubicacion-comunidad','ubicacion-pais','ubicacion-latitud','ubicacion-longitud',
  'number-419','date-33','number-420','number-421','number-422','number-423',
  'coherencia-dormitorios','coherencia-presupuesto','Fecha','Respondido','Notas','FechaSeguimiento',
  'Prioridad','Estado','Llamado','ID','fecha-llamada','como-conocido','como-conocido-otros',
  'descripcion-vivienda','distribucion-dia','garaje','piscina','estancia-adicional',
  'superficie-parcela','edificabilidad','ocupacion','referencia-catastral','presupuesto-deseado',
  'viabilidad','informacion-adicional','fecha-mail','info-enviada','fecha-reunion','imprescindible',
  'NoContestados','procedencia-contacto','vivienda-interesada','documentacion','eliminado',
  'MotivoSeguimiento','FechaNotificacion','HoraNotificacion','estudio-viabilidad'
];

function doGet(e) {
  try {
    if (!e || !e.parameter) {
      return createResponse({ status: 'error', message: 'Sin parámetros' });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Hoja 1');
    if (!sheet) throw new Error('Hoja no encontrada');
    const tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone() || 'Europe/Madrid';

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idIndex = headers.indexOf('ID');
    if (idIndex === -1) throw new Error('Columna ID no encontrada');

    let response;

    if (e.parameter.marcar) {
      const marcarData = e.parameter.marcar.split(':');
      if (marcarData.length < 3) {
        return createResponse({ status: 'error', message: 'Formato de marcar inválido' });
      }

      const campo = marcarData[0];
      const id = marcarData[1];
      const valor = marcarData.slice(2).join(':');

      let campoIndex = headers.indexOf(campo);

      if (campoIndex === -1 && (campo === 'FechaNotificacion' || campo === 'HoraNotificacion' || campo === 'MotivoSeguimiento')) {
        const lastCol = sheet.getLastColumn();
        sheet.getRange(1, lastCol + 1).setValue(campo);
        campoIndex = lastCol;
        headers.push(campo);
      }

      if (campoIndex === -1) throw new Error(`Columna ${campo} no encontrada`);

      const rowNum = findRowById_(sheet, id, headers);
      if (rowNum === -1) {
        return createResponse({ status: 'error', message: 'ID no encontrado' });
      }

      const rng = sheet.getRange(rowNum, campoIndex + 1);
      if (campo === 'HoraNotificacion') {
        rng.setNumberFormat('hh:mm').setValue(valor);
      } else if (campo === 'FechaNotificacion') {
        rng.setNumberFormat('yyyy-mm-dd').setValue(valor || null);
      } else {
        rng.setValue(valor);
      }

      const estadoIndex = headers.indexOf('Estado');
      const llamadoIndex = headers.indexOf('Llamado');
      const respondidoIndex = headers.indexOf('Respondido');

      if (estadoIndex !== -1 && llamadoIndex !== -1 && respondidoIndex !== -1) {
        const rowData = sheet.getRange(rowNum, 1, 1, headers.length).getValues()[0];

        let llamado = rowData[llamadoIndex];
        let respondido = rowData[respondidoIndex];

        if (campoIndex === llamadoIndex) llamado = valor;
        if (campoIndex === respondidoIndex) respondido = valor;

        let nuevoEstado = 'Sin Llamar';
        if (String(respondido).toLowerCase().startsWith('s')) {
          nuevoEstado = 'Respondido';
        } else if (String(llamado).toLowerCase().startsWith('s')) {
          nuevoEstado = 'Llamado';
        }

        sheet.getRange(rowNum, estadoIndex + 1).setValue(nuevoEstado);
      }

      const updatedRowData = sheet.getRange(rowNum, 1, 1, headers.length).getValues()[0];
      const dataObj = {};
      headers.forEach((h, j) => {
        let v = updatedRowData[j];
        if (Object.prototype.toString.call(v) === '[object Date]') {
          v = formatFechaOut_(v, tz);
        }
        dataObj[h] = (v !== undefined) ? v : '';
      });

      response = { status: 'success', message: `${campo} actualizado`, data: dataObj };
      return createResponse(response);
    }

    else if (e.parameter.deleteRow) {
      const id = e.parameter.deleteRow;
      const rowNum = findRowById_(sheet, id, headers);

      if (rowNum !== -1) {
        sheet.deleteRow(rowNum);
        response = { status: 'success', message: 'Fila eliminada' };
      } else {
        response = { status: 'error', message: 'ID no encontrado para eliminar' };
      }
    }

    else if (e.parameter.id) {
      const id = e.parameter.id;
      const rowNum = findRowById_(sheet, id, headers);

      if (rowNum !== -1) {
        const rowData = sheet.getRange(rowNum, 1, 1, headers.length).getValues()[0];
        const dataObj = convertRowToObject_(headers, rowData);
        dataObj.fila = rowNum;
        response = { status: 'success', data: dataObj };
      } else {
        response = { status: 'not_found', message: 'ID no encontrado' };
      }
    }

    else if (e.parameter.sendReminder) {
      const id = e.parameter.sendReminder;
      const when = e.parameter.when || 'exact';
      const rowNum = findRowById_(sheet, id, headers);
      if (rowNum === -1) {
        return createResponse({ status: 'error', message: 'ID no encontrado' });
      }
      const rowData = sheet.getRange(rowNum, 1, 1, headers.length).getValues()[0];
      const datos = convertRowToObject_(headers, rowData);
      const nombre = datos['your-name'] || '(sin nombre)';
      const telefono = datos['tel-686'] || '(sin teléfono)';
      const emailC = datos['your-email'] || '(sin email)';
      const motivo = datos['MotivoSeguimiento'] || '(sin motivo)';
      const fechaNotif = datos['FechaNotificacion'] || '';
      let horaNotif = datos['HoraNotificacion'] || '';

      if (Object.prototype.toString.call(horaNotif) === '[object Date]') {
        horaNotif = Utilities.formatDate(horaNotif, tz, 'HH:mm');
      } else if (typeof horaNotif === 'number') {
        const totalMin = Math.round(horaNotif * 24 * 60);
        const hh = String(Math.floor(totalMin / 60)).padStart(2, '0');
        const mm = String(totalMin % 60).padStart(2, '0');
        horaNotif = `${hh}:${mm}`;
      } else {
        horaNotif = String(horaNotif).replace(/^(\d{1,2}:\d{2}).*$/, '$1').trim();
      }

      const notas = datos.Notas || '(sin notas)';
      const viviendaInteresada = datos['vivienda-interesada'] || '';
      const tipoVivienda = viviendaInteresada
        ? `Villas Isla de Cortegada (${viviendaInteresada})`
        : 'Vivienda Normal';

      let fechaFormateada = '—';
      if (fechaNotif) {
        let fechaStr = fechaNotif;
        if (Object.prototype.toString.call(fechaNotif) === '[object Date]') {
          fechaStr = Utilities.formatDate(fechaNotif, tz, 'yyyy-MM-dd');
        } else {
          fechaStr = String(fechaNotif).replace(/^(\d{4}-\d{2}-\d{2})T.*$/, '$1').trim();
        }
        fechaFormateada = fechaStr.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$3/$2/$1');
      }

      const horaFormateada = horaNotif || '—';

      const asunto = `Recordatorio: llamar a ${nombre}`;
      const cuerpo =
        `RECORDATORIO DE SEGUIMIENTO\n` +
        `${'─'.repeat(35)}\n\n` +
        `👤 Contacto:       ${nombre}\n` +
        `📞 Teléfono:       ${telefono}\n` +
        `✉️  Email:          ${emailC}\n\n` +
        `📅 Fecha:          ${fechaFormateada}\n` +
        `🕐 Hora:           ${horaFormateada}\n\n` +
        `📝 Motivo:         ${motivo}\n` +
        `🏠 Tipo vivienda:  ${tipoVivienda}\n\n` +
        `💬 Notas:\n${notas}\n\n` +
        `${'─'.repeat(35)}\n` +
        `Enviado desde el sistema de gestión de contactos.`;

      if (when !== 'exact' && fechaNotif && horaNotif) {
        let fechaStr = '';
        if (Object.prototype.toString.call(fechaNotif) === '[object Date]') {
          fechaStr = Utilities.formatDate(fechaNotif, tz, 'yyyy-MM-dd');
        } else {
          fechaStr = String(fechaNotif).replace(/^(\d{4}-\d{2}-\d{2}).*$/, '$1').trim();
        }

        let horaStr = '';
        if (typeof horaNotif === 'number') {
          const totalMin = Math.round(horaNotif * 24 * 60);
          const hh = String(Math.floor(totalMin / 60)).padStart(2, '0');
          const mm = String(totalMin % 60).padStart(2, '0');
          horaStr = `${hh}:${mm}`;
        } else if (Object.prototype.toString.call(horaNotif) === '[object Date]') {
          horaStr = Utilities.formatDate(horaNotif, tz, 'HH:mm');
        } else {
          horaStr = String(horaNotif || '').replace(/^(\d{1,2}:\d{2}).*$/, '$1').trim();
        }

        if (fechaStr.match(/^\d{4}-\d{2}-\d{2}$/) && horaStr.match(/^\d{1,2}:\d{2}$/)) {
          const fechaBase = new Date(`${fechaStr}T${horaStr.padStart(5, '0')}:00`);
          if (when === '1h') fechaBase.setTime(fechaBase.getTime() - 60 * 60 * 1000);
          if (when === '1d') fechaBase.setTime(fechaBase.getTime() - 24 * 60 * 60 * 1000);
          if (fechaBase > new Date()) {
            const key = `reminder_${id}_${fechaBase.getTime()}`;
            PropertiesService.getScriptProperties().setProperty(key, JSON.stringify({
              asunto,
              cuerpo,
              enviarEn: fechaBase.getTime()
            }));
            crearTriggerPeriodicoSiNoExiste_();
            Logger.log(`Recordatorio programado: ${key} para ${Utilities.formatDate(fechaBase, tz, 'dd/MM/yyyy HH:mm')}`);
            return createResponse({ status: 'success', message: `Email programado para ${Utilities.formatDate(fechaBase, tz, 'dd/MM/yyyy HH:mm')}` });
          } else {
            Logger.log('Fecha pasada, enviando email inmediatamente');
          }
        } else {
          Logger.log('Formato de fecha/hora inválido o envío inmediato solicitado');
        }
      }

      Logger.log(`Enviando email inmediato a andrealoran@proyectopia.es - Asunto: ${asunto}`);
      MailApp.sendEmail('andrealoran@proyectopia.es', asunto, cuerpo);
      return createResponse({ status: 'success', message: 'Email enviado' });
    }

    else {
      const data = sheet.getDataRange().getValues();
      const headersAll = data[0];
      const resultados = data.slice(1).map((fila, i) => {
        const obj = {};
        headersAll.forEach((h, j) => {
          let v = fila[j];
          if (h === 'Fecha') v = formatFechaOut_(v, tz);
          obj[h] = v;
        });
        obj.fila = i + 2;
        return obj;
      });
      response = { status: 'success', data: resultados };
    }

    return createResponse(response);

  } catch (error) {
    Logger.log('Error en doGet: ' + error.message + '\nStack: ' + error.stack);
    return createResponse({ status: 'error', message: error.message });
  }
}

function doPost(e) {
  function parsePostData(evt) {
    if (!evt) return {};

    if (evt.postData && evt.postData.type === 'application/json') {
      try {
        return JSON.parse(evt.postData.contents);
      } catch (_) {
        return {};
      }
    }

    if (evt.postData) {
      try {
        return JSON.parse(evt.postData.contents);
      } catch (err) {
        const obj = {};
        const pairs = evt.postData.contents.split('&');
        for (let i = 0; i < pairs.length; ++i) {
          const parts = pairs[i].split('=');
          const key = decodeURIComponent(parts[0]);
          const value = decodeURIComponent((parts[1] || '').replace(/\+/g, ' '));
          obj[key] = value;
        }
        return obj;
      }
    }

    if (evt.parameter && Object.keys(evt.parameter).length > 0) return evt.parameter;
    return {};
  }

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Hoja 1');
    if (!sheet) throw new Error('Hoja no encontrada');
    const tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone() || 'Europe/Madrid';

    const data = parsePostData(e);
    Logger.log('Datos recibidos en doPost: ' + JSON.stringify(data));

    let currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (currentHeaders.length < EXPECTED_HEADERS.length ||
        currentHeaders.some((h, i) => String(h) !== EXPECTED_HEADERS[i] && i < EXPECTED_HEADERS.length)) {
      sheet.getRange(1, 1, 1, EXPECTED_HEADERS.length).setValues([EXPECTED_HEADERS]);
      currentHeaders = EXPECTED_HEADERS;
    }

    const isWordpress = !data.action && !data.source && data['your-name'];
    const id = data.id || data.ID || `contacto_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    Logger.log('ID usado para fila: ' + id);

    const rowNum = findRowById_(sheet, id, currentHeaders);
    const updated = (rowNum !== -1);
    let existingData = {};

    if (updated) {
      const existingRowValues = sheet.getRange(rowNum, 1, 1, currentHeaders.length).getValues()[0];
      existingData = convertRowToObject_(currentHeaders, existingRowValues);
    }

    const finalData = { ...existingData, ...data };

    ['ubicacion-latitud', 'ubicacion-longitud'].forEach((k) => {
      if (finalData[k] !== undefined && finalData[k] !== '') {
        const n = Number(finalData[k]);
        finalData[k] = Number.isFinite(n) ? n : '';
      }
    });

    const rowData = EXPECTED_HEADERS.map((h) => {
      if (h === 'ID') return id;
      if (h === 'Respondido') return finalData[h] || 'No';
      if (h === 'Estado') return finalData[h] || 'Sin Llamar';
      if (h === 'Llamado') return finalData[h] || 'No';

      if (h === 'Fecha') {
        if (isWordpress) {
          return Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
        }
        const v = finalData[h] || finalData['date-33'];
        return v || '';
      }

      if (h === 'checkbox-374') {
        if (Array.isArray(finalData[h])) return finalData[h].join(',');
        if (typeof finalData[h] === 'object' && finalData[h] !== null) return Object.values(finalData[h]).join(',');
      }

      return finalData[h] || '';
    });

    if (updated) {
      sheet.getRange(rowNum, 1, 1, EXPECTED_HEADERS.length).setValues([rowData]);
      Logger.log('Fila actualizada en posición: ' + rowNum);
    } else {
      sheet.appendRow(rowData);
      Logger.log('Fila añadida nueva');
    }

    const dataObj = convertRowToObject_(EXPECTED_HEADERS, rowData);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: updated ? 'Fila actualizada' : 'Fila añadida',
      id,
      data: dataObj
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error en doPost: ' + error.message + '\nStack: ' + error.stack);
    return createResponse({ status: 'error', message: error.message });
  }
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function formatFechaOut_(v, tz) {
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v)) {
    return Utilities.formatDate(v, tz, 'yyyy-MM-dd');
  }
  const s = String(v || '');
  const mISO = s.match(/^(\d{4}-\d{2}-\d{2})T/);
  if (mISO) return mISO[1];
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return s;
}

function onChange(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Hoja 1');
    if (!sheet) return;
    Logger.log('Evento onChange ejecutado');
  } catch (error) {
    Logger.log('Error en onChange: ' + error.message + '\nStack: ' + error.stack);
  }
}

function onEdit(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Hoja 1');
    if (!sheet) return;
    const range = e.range;

    if (range.getRow() === 1) {
      Logger.log('Intento de edición en cabeceras detectado: ' + JSON.stringify(range.getValues()));
      sheet.getRange(1, 1, 1, EXPECTED_HEADERS.length).setValues([EXPECTED_HEADERS]);
    }
  } catch (error) {
    Logger.log('Error en onEdit: ' + error.message + '\nStack: ' + error.stack);
  }
}

function testearHeaders() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Hoja 1');
    if (!sheet) throw new Error('Hoja no encontrada');

    sheet.getRange(1, 1, 1, EXPECTED_HEADERS.length).setValues([EXPECTED_HEADERS]);

    console.log('Headers actualizados correctamente');
    console.log('Total de columnas:', EXPECTED_HEADERS.length);
    console.log('Columna documentacion está en posición:', EXPECTED_HEADERS.indexOf('documentacion') + 1);

    return { status: 'success', message: 'Headers actualizados', totalColumns: EXPECTED_HEADERS.length };
  } catch (error) {
    console.error('Error al testear headers:', error.message);
    return { status: 'error', message: error.message };
  }
}

function findRowById_(sheet, id, headers) {
  const idIndex = headers.indexOf('ID');
  if (idIndex === -1) {
    Logger.log('Error: Columna ID no encontrada en findRowById_');
    return -1;
  }

  const numRows = Math.max(sheet.getLastRow() - 1, 1);
  const idColumnRange = sheet.getRange(2, idIndex + 1, numRows, 1);
  const textFinder = idColumnRange.createTextFinder(String(id)).matchEntireCell(true);
  const found = textFinder.findNext();

  return found ? found.getRow() : -1;
}

function convertRowToObject_(headers, rowData) {
  const obj = {};
  headers.forEach((h, j) => {
    obj[h] = (rowData[j] !== undefined) ? rowData[j] : '';
  });
  return obj;
}

function crearTriggerPeriodicoSiNoExiste_() {
  const triggers = ScriptApp.getProjectTriggers();
  const yaExiste = triggers.some((t) => {
    const handler = t.getHandlerFunction();
    Logger.log(`Trigger encontrado: ${handler}`);
    return handler === 'procesarEmailsProgramados';
  });

  if (!yaExiste) {
    try {
      ScriptApp.newTrigger('procesarEmailsProgramados')
        .timeBased()
        .everyMinutes(15)
        .create();
      Logger.log('Trigger creado: procesarEmailsProgramados cada 15 min');
      Logger.log('Trigger periódico creado exitosamente.');
    } catch (error) {
      Logger.log('Error creando trigger: ' + error.message);
    }
  } else {
    Logger.log('Trigger periódico ya existe, no se creó uno nuevo.');
  }
}

function procesarEmailsProgramados() {
  const props = PropertiesService.getScriptProperties().getProperties();
  const ahora = new Date().getTime();
  let enviados = 0;

  Logger.log('=== Ejecutando procesarEmailsProgramados ===');
  Logger.log(`Hora actual: ${new Date(ahora)}`);
  Logger.log(`Total propiedades: ${Object.keys(props).length}`);

  for (const key in props) {
    if (!key.startsWith('reminder_')) continue;
    Logger.log(`Procesando: ${key}`);
    try {
      const datos = JSON.parse(props[key]);
      if (datos.enviarEn <= ahora) {
        MailApp.sendEmail('andrealoran@proyectopia.es', datos.asunto, datos.cuerpo);
        PropertiesService.getScriptProperties().deleteProperty(key);
        enviados++;
        Logger.log('Email enviado para clave: ' + key);
      }
    } catch (err) {
      Logger.log('Error procesando clave ' + key + ': ' + err.message);
    }
  }

  const restantes = Object.keys(PropertiesService.getScriptProperties().getProperties())
    .filter((k) => k.startsWith('reminder_')).length;

  if (restantes === 0) {
    ScriptApp.getProjectTriggers()
      .filter((t) => t.getHandlerFunction() === 'procesarEmailsProgramados')
      .forEach((t) => ScriptApp.deleteTrigger(t));
    Logger.log('Trigger periódico eliminado (sin pendientes).');
  }

  Logger.log(`Emails enviados en esta ejecución: ${enviados}`);
}

function testEnvioInmediato() {
  MailApp.sendEmail('andrealoran@proyectopia.es', 'TEST', 'Email de prueba inmediato');
  Logger.log('Email de prueba enviado');
}

function testProgramado() {
  const key = 'reminder_test_' + Date.now();
  PropertiesService.getScriptProperties().setProperty(key, JSON.stringify({
    asunto: 'TEST Programado',
    cuerpo: 'Este es un test',
    enviarEn: Date.now() - 1000
  }));
  crearTriggerPeriodicoSiNoExiste_();
  Logger.log('Recordatorio de prueba guardado y trigger creado');
}
