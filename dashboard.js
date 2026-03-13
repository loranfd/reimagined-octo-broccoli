// dashboard.js - Full code with fixes: Align villas classification to only 'vivienda-interesada' with specific keywords, no procedencia in general count; embudo strict web + villas; normalizar with accents removal to match script.js

const urlApi = 'https://script.google.com/macros/s/AKfycbzhw3QMxMyVBuSzbabj8wPc5hm5X75AODXqz7Kn737rn46G670fl844EWLhy0G13bc/exec';

let datosGlobales = null;
let datosFiltrados = null;
let datosCompletos = null;

// Tooltip div global
const tooltip = document.createElement('div');
tooltip.style.position = 'absolute';
tooltip.style.background = 'rgba(0,0,0,0.8)';
tooltip.style.color = 'white';
tooltip.style.padding = '5px 10px';
tooltip.style.borderRadius = '4px';
tooltip.style.pointerEvents = 'none';
tooltip.style.display = 'none';
document.body.appendChild(tooltip);

// Normalizar aligned with script.js
const normalizar = (str) => String(str ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Funciones
function configurarFiltros() {
  const tipoFiltro = document.getElementById('filtro-tipo');
  const mesFiltro = document.getElementById('filtro-mes');
  const inicioFiltro = document.getElementById('filtro-inicio');
  const finFiltro = document.getElementById('filtro-fin');
  const btnAplicar = document.getElementById('aplicar-filtro');

  tipoFiltro.addEventListener('change', (e) => {
    mesFiltro.style.display = 'none';
    inicioFiltro.style.display = 'none';
    finFiltro.style.display = 'none';
    if (e.target.value === 'mensual') {
      mesFiltro.style.display = 'block';
    } else if (e.target.value === 'rango') {
      inicioFiltro.style.display = 'block';
      finFiltro.style.display = 'block';
    }
  });

  btnAplicar.addEventListener('click', aplicarFiltro);
}

function aplicarFiltro() {
  if (!datosCompletos) return;

  const tipo = document.getElementById('filtro-tipo').value;
  let filtrados = datosCompletos;

  if (tipo === 'mensual') {
    const mes = document.getElementById('filtro-mes').value;
    if (mes) {
      filtrados = datosCompletos.filter(c => {
        const fecha = new Date(c['Fecha']);
        return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}` === mes;
      });
    }
  } else if (tipo === 'rango') {
    const inicioVal = document.getElementById('filtro-inicio').value;
    const finVal = document.getElementById('filtro-fin').value;
    if (inicioVal && finVal) {
      const inicio = new Date(inicioVal);
      const fin = new Date(finVal);
      filtrados = datosCompletos.filter(c => {
        const fecha = new Date(c['Fecha']);
        return fecha >= inicio && fecha <= fin;
      });
    }
  }

  datosGlobales = procesarDatos(filtrados);
  mostrarDashboard();
}

async function cargarDatos() {
  try {
    const response = await fetch(urlApi, { method: 'GET', redirect: 'follow' });
    const result = await response.json();
    
    if (result.status === 'success' && Array.isArray(result.data)) {
      datosCompletos = result.data;
      datosGlobales = procesarDatos(datosCompletos);
      datosFiltrados = datosCompletos;
      poblarMeses(datosCompletos);
      mostrarDashboard();
    } else {
      throw new Error(result.message || 'Respuesta inválida');
    }
  } catch (error) {
    console.error('Error GAS:', error);
    alert('Error conexión GAS. Detalles consola.');
  } finally {
    ocultarLoading();
  }
}

function poblarMeses(data) {
  const meses = new Set();
  data.forEach(c => {
    if (c['Fecha']) {
      const fecha = new Date(c['Fecha']);
      if (!isNaN(fecha)) meses.add(`${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`);
    }
  });
  const mesFiltro = document.getElementById('filtro-mes');
  mesFiltro.innerHTML = '';
  Array.from(meses).sort().forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = new Date(m + '-01').toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    mesFiltro.appendChild(opt);
  });
}

function procesarDatos(data) {
  if (!Array.isArray(data)) return { total: 0, viviendaNormal: 0, villasIsla: 0, procedencias: {}, ubicacionesPorProv: {}, contactosTiempo: {}, dataCompleta: [] };

  const villasKeywords = ['promocion general', 'vivienda 03', 'vivienda 04', 'vivienda 05'];
  const villasIsla = data.filter(c => {
    const viviendaInteresada = normalizar(c['vivienda-interesada'] ?? '');
    return villasKeywords.some(k => viviendaInteresada.includes(k));
  });

  console.log('Villas detectadas:', villasIsla.length, 'Normal:', data.length - villasIsla.length);  // Debug counts

  const viviendaNormal = data.filter(c => !villasIsla.includes(c));

  const procedencias = {};
  data.forEach(c => {
    const proc = c['procedencia-contacto'] ?? c['origen-contacto'] ?? 'Sin especificar';
    procedencias[proc] = (procedencias[proc] || 0) + 1;
  });

// Ubicaciones: Parse avanzado con normalización inteligente y diccionario de equivalencias
  const provinciasComunes = ['madrid', 'barcelona', 'valencia', 'sevilla', 'zaragoza', 'malaga', 'murcia', 'palma', 'las palmas', 'bilbao', 'alicante', 'cordoba', 'valladolid', 'vigo', 'gijon', 'hospitalet', 'vitoria', 'a coruna', 'coruña', 'granada', 'elche', 'pontevedra', 'galicia', 'cataluña', 'catalunya', 'euskadi', 'pais vasco'];
  
// Diccionario de equivalencias para unificar ubicaciones similares
  const equivalenciasUbicaciones = {
    // Variaciones de A Coruña
    'la coruna': 'a coruna',
    'coruña': 'a coruna',
    'la coruña': 'a coruna',
    'coruna': 'a coruna',
    // Otras ciudades
    'san sebastian': 'donostia',
    'donostia san sebastian': 'donostia',
    'las palmas de gran canaria': 'las palmas',
    'palma de mallorca': 'palma',
    'jerez de la frontera': 'jerez',
    'castello de la plana': 'castellon',
    'castellon de la plana': 'castellon',
  };
  
  // Función para normalizar ubicaciones y eliminar variaciones
 // Función para normalizar ubicaciones y eliminar variaciones
  const normalizarUbicacion = (texto) => {
    let normalizado = normalizar(texto)
      .replace(/\([^)]*\)/g, '')  // Eliminar paréntesis y contenido: Montijo (Badajoz) → Montijo
      .replace(/\[[^\]]*\]/g, '')  // Eliminar corchetes y contenido
      .replace(/\s+/g, ' ')  // Múltiples espacios a uno solo
      .replace(/[.,;]/g, '')  // Eliminar puntuación
      .replace(/\s*-\s*/g, ' ')  // Guiones con espacios
      .replace(/\b(de|del|la|las|los|el)\b/gi, ' ')  // Eliminar artículos
      .replace(/\s+/g, ' ')  // Limpiar espacios dobles de nuevo
      .trim();
    
    // Aplicar equivalencias del diccionario
    for (const [variacion, oficial] of Object.entries(equivalenciasUbicaciones)) {
      if (normalizado === variacion || normalizado.includes(' ' + variacion + ' ') || normalizado.startsWith(variacion + ' ') || normalizado.endsWith(' ' + variacion)) {
        normalizado = normalizado.replace(new RegExp(variacion, 'g'), oficial);
      }
    }
    
    return normalizado.replace(/\s+/g, ' ').trim();
  };
  
 const ubicacionesPorProv = {};
  const ubicacionesNormalizadas = new Map(); // Para detectar duplicados
  const ubicacionesOriginales = []; // Para debugging
  
  viviendaNormal.forEach(c => {
    let ubi = String(c['ubicacion-terreno'] ?? '').trim();
    if (!ubi || normalizar(ubi) === 'sin especificar' || normalizar(ubi) === 'sin terreno') return;

    // Guardar ubicación original para debugging
    ubicacionesOriginales.push(ubi);

    // Normalizar la ubicación completa
    const ubiNormalizada = normalizarUbicacion(ubi);
    
    // Limpiar paréntesis ANTES de separar
    const ubiLimpia = ubi.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').trim();
    
    // Separar por comas, punto y coma
    const parts = ubiLimpia.split(/[,;]/).map(p => p.trim()).filter(p => p);
    const partsNorm = parts.map(p => normalizar(p));
    
    // Detectar provincia (última parte que coincida con provincias conocidas)
    let provincia = 'Otros';
    let provinciaOriginal = '';
    for (let i = partsNorm.length - 1; i >= 0; i--) {
      if (provinciasComunes.includes(partsNorm[i])) {
        provinciaOriginal = parts[i];
        provincia = provinciaOriginal.charAt(0).toUpperCase() + provinciaOriginal.slice(1).toLowerCase();
        break;
      }
    }
    
    // Si no encontramos provincia conocida, usar la última parte como provincia
    if (provincia === 'Otros' && parts.length > 0) {
      const ultimaParte = parts[parts.length - 1];
      if (ultimaParte.length > 3 && !/[\d]/.test(ultimaParte)) {
        provinciaOriginal = ultimaParte;
        provincia = provinciaOriginal.charAt(0).toUpperCase() + provinciaOriginal.slice(1).toLowerCase();
      }
    }
    
    // Construir el sitio (todo menos la provincia)
    let sitio = parts.slice(0, -1).join(', ').trim() || parts[0] || ubi;
    const sitioNormalizado = normalizarUbicacion(sitio);
    
   // Verificar si ya existe esta ubicación normalizada
    let sitioFinal = sitio;
    if (ubicacionesNormalizadas.has(sitioNormalizado)) {
      sitioFinal = ubicacionesNormalizadas.get(sitioNormalizado);
    } else {
      // Limpiar espacios extras antes de capitalizar
      sitio = sitio.replace(/\s+/g, ' ').trim();
      
      // Capitalizar correctamente el sitio
      sitioFinal = sitio.split(' ').map(palabra => 
        palabra.length > 0 ? palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase() : ''
      ).join(' ');
      ubicacionesNormalizadas.set(sitioNormalizado, sitioFinal);
    }

    if (!ubicacionesPorProv[provincia]) {
      ubicacionesPorProv[provincia] = { count: 0, sitios: new Set() };
    }
    ubicacionesPorProv[provincia].count++;
    if (sitioFinal) {
      ubicacionesPorProv[provincia].sitios.add(sitioFinal);
    }
  });
  

  // DEBUGGING: Mostrar ubicaciones para detectar duplicados
  console.log('=== ANÁLISIS DE UBICACIONES ===');
  console.log('Total ubicaciones originales:', ubicacionesOriginales.length);
  console.log('Total ubicaciones únicas después de normalizar:', ubicacionesNormalizadas.size);
  console.log('=== ANÁLISIS DE UBICACIONES ===');
  console.log('🔍 FORZANDO APARICIÓN - Si ves esto, la consola funciona');
  console.log('Total ubicaciones originales:', ubicacionesOriginales.length);
  
  // Agrupar ubicaciones originales por su versión normalizada
  const gruposDuplicados = new Map();
  ubicacionesOriginales.forEach(original => {
    const norm = normalizarUbicacion(original);
    if (!gruposDuplicados.has(norm)) {
      gruposDuplicados.set(norm, []);
    }
    gruposDuplicados.get(norm).push(original);
  });
  
  // Mostrar solo grupos con más de una variación
  console.log('Ubicaciones con variaciones detectadas:');
  gruposDuplicados.forEach((variaciones, normalizada) => {
    if (variaciones.length > 1) {
      // Eliminar duplicados exactos en las variaciones
      const variacionesUnicas = [...new Set(variaciones)];
      if (variacionesUnicas.length > 1) {
        console.log(`📍 "${normalizada}" tiene ${variacionesUnicas.length} variaciones:`);
        variacionesUnicas.forEach(v => console.log(`   - "${v}"`));
      }
    }
  });
  console.log('=================================');

  const contactosTiempo = { normal: {}, villas: {}, total: {} };
  data.forEach(c => {
    const fechaStr = c['Fecha'];
    if (fechaStr) {
      const fecha = new Date(fechaStr);
      if (!isNaN(fecha)) {
        const key = fecha.toISOString().split('T')[0];
        contactosTiempo.total[key] = (contactosTiempo.total[key] || 0) + 1;
        if (villasIsla.includes(c)) {
          contactosTiempo.villas[key] = (contactosTiempo.villas[key] || 0) + 1;
        } else {
          contactosTiempo.normal[key] = (contactosTiempo.normal[key] || 0) + 1;
        }
      }
    }
  });

  return {
    total: data.length,
    viviendaNormal: viviendaNormal.length,
    villasIsla: villasIsla.length,
    procedencias,
    ubicacionesPorProv,
    contactosTiempo,
    dataCompleta: data
  };
}

function mostrarDashboard() {
  if (!datosGlobales) return;

  document.getElementById('kpi-total').textContent = datosGlobales.total;
  document.getElementById('kpi-normal').textContent = datosGlobales.viviendaNormal;
  document.getElementById('kpi-villas').textContent = datosGlobales.villasIsla;
  document.getElementById('kpi-ubicaciones').textContent = Object.keys(datosGlobales.ubicacionesPorProv).length;

  mostrarGraficoTipos();
  mostrarGraficoProcedencia();
  mostrarGraficoTiempo();
  mostrarMapaUbicaciones();
}

// Pie with tooltip
function mostrarGraficoTipos() {
  const container = document.getElementById('chart-tipos');
  const total = datosGlobales.total || 1;
  const normal = datosGlobales.viviendaNormal;
  const villas = datosGlobales.villasIsla;
  const degNormal = (normal / total) * 360;

  const pathNormal = `M 100,100 L 100,0 A 100,100 0 ${degNormal > 180 ? 1 : 0},1 ${100 + Math.sin(degNormal * Math.PI / 180) * 100},${100 - Math.cos(degNormal * Math.PI / 180) * 100} Z`;
  const pathVillas = `M 100,100 L ${100 + Math.sin(degNormal * Math.PI / 180) * 100},${100 - Math.cos(degNormal * Math.PI / 180) * 100} A 100,100 0 ${degNormal < 180 ? 1 : 0},1 100,0 Z`;

  const porcentajeNormal = ((normal / total) * 100).toFixed(1);
  const porcentajeVillas = ((villas / total) * 100).toFixed(1);

  container.innerHTML = `
    <svg id="pie-svg" width="250" height="250" viewBox="0 0 200 200" style="margin: 0 auto; display: block;">
      <path class="pie-slice" data-tooltip="Vivienda Normal: ${porcentajeNormal}% (${normal})" d="${pathNormal}" fill="#48bb78" />
      <path class="pie-slice" data-tooltip="Villas Isla de Cortegada: ${porcentajeVillas}% (${villas})" d="${pathVillas}" fill="#9f7aea" />
      <circle cx="100" cy="100" r="60" fill="white"/>
      <text x="100" y="95" text-anchor="middle" font-size="14" fill="#1a202c">${total}</text>
      <text x="100" y="115" text-anchor="middle" font-size="12" fill="#718096">Total</text>
    </svg>
    <div style="text-align: center; margin-top: 1rem;">
      <span style="color: #48bb78;">Vivienda Normal: ${porcentajeNormal}%</span><br>
      <span style="color: #9f7aea;">Villas Isla de Cortegada: ${porcentajeVillas}%</span>
    </div>
  `;

 // JS tooltip
  const slices = container.querySelectorAll('.pie-slice');
  slices.forEach(slice => {
    slice.addEventListener('mouseenter', (e) => {
      tooltip.textContent = slice.dataset.tooltip;
      tooltip.style.display = 'block';
    });
    slice.addEventListener('mousemove', (e) => {
      tooltip.style.left = `${e.pageX + 10}px`;
      tooltip.style.top = `${e.pageY}px`;
    });
    slice.addEventListener('mouseleave', () => tooltip.style.display = 'none');
  });
}

function mostrarGraficoProcedencia() {
  const container = document.getElementById('chart-procedencia');
  const total = datosGlobales.total;
  
  const topProcedencias = Object.entries(datosGlobales.procedencias)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6);

  const colores = ['blue', 'green', 'purple', 'orange', 'pink', 'indigo'];

  const html = topProcedencias.map(([proc, count], idx) => {
    const porcentaje = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
    const color = colores[idx % colores.length];

    return `
      <div class="progress-item">
        <div class="progress-header">
          <span style="color: #4a5568;">${proc}</span>
          <span style="font-weight: bold; color: #1a202c;">${count}</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar ${color}" style="width: 0%;" data-width="${porcentaje}">
            ${porcentaje}%
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;

  setTimeout(() => {
    container.querySelectorAll('.progress-bar').forEach((bar, idx) => {
      if (bar.dataset.width) {
        setTimeout(() => bar.style.width = bar.dataset.width + '%', idx * 100);
      }
    });
  }, 200);
}

function mostrarGraficoTiempo() {
  const container = document.getElementById('chart-tiempo');
  const periodoInfo = document.getElementById('periodo-info');
  const { normal, villas, total } = datosGlobales.contactosTiempo;
  let entradasTotal = Object.entries(total).sort(([a], [b]) => a.localeCompare(b));
  
  if (entradasTotal.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #718096; padding: 2rem;">No hay datos de contactos en el tiempo</p>';
    return;
  }

  const tipoFiltro = document.getElementById('filtro-tipo').value;
  
  // Calcular rango de días
  const primeraFecha = new Date(entradasTotal[0][0] + 'T00:00:00');
  const ultimaFecha = new Date(entradasTotal[entradasTotal.length - 1][0] + 'T00:00:00');
  const diffDias = Math.ceil((ultimaFecha - primeraFecha) / (1000 * 60 * 60 * 24)) + 1;
  
  let labels = [];
  let valuesNormal = [];
  let valuesVillas = [];
  let valuesTotal = [];
  let periodoTexto = '';
  let modoVisualizacion = '';

  // LÓGICA AUTOMÁTICA según filtro y rango
  if (tipoFiltro === 'global') {
    // GLOBAL → Agrupar por MESES
    modoVisualizacion = 'Por meses';
    const agrupadoN = {}, agrupadoV = {}, agrupadoT = {};
    
    entradasTotal.forEach(([fecha, count]) => {
      const d = new Date(fecha + 'T00:00:00');
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      agrupadoT[key] = (agrupadoT[key] || 0) + count;
      agrupadoN[key] = (agrupadoN[key] || 0) + (normal[fecha] || 0);
      agrupadoV[key] = (agrupadoV[key] || 0) + (villas[fecha] || 0);
    });

    Object.keys(agrupadoT).sort().forEach(key => {
      const [year, month] = key.split('-');
      const fecha = new Date(parseInt(year), parseInt(month) - 1);
      labels.push(fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }));
      valuesTotal.push(agrupadoT[key]);
      valuesNormal.push(agrupadoN[key]);
      valuesVillas.push(agrupadoV[key]);
    });

    periodoTexto = `${primeraFecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })} - ${ultimaFecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`;

  } else if (tipoFiltro === 'mensual') {
    // MENSUAL → Agrupar por DÍAS
    modoVisualizacion = 'Por días';
    entradasTotal.forEach(([f, c]) => {
      const fecha = new Date(f + 'T00:00:00');
      labels.push(fecha.getDate());
      valuesTotal.push(c);
      valuesNormal.push(normal[f] || 0);
      valuesVillas.push(villas[f] || 0);
    });

    periodoTexto = primeraFecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  } else if (tipoFiltro === 'rango') {
    // RANGO → Lógica según días
    if (diffDias <= 31) {
      // ≤ 31 días → Por DÍAS
      modoVisualizacion = 'Por días';
      entradasTotal.forEach(([f, c]) => {
        const fecha = new Date(f + 'T00:00:00');
        labels.push(`${fecha.getDate()}/${fecha.getMonth() + 1}`);
        valuesTotal.push(c);
        valuesNormal.push(normal[f] || 0);
        valuesVillas.push(villas[f] || 0);
      });

    } else if (diffDias <= 90) {
      // 32-90 días → Agrupar de 5 en 5 DÍAS
      modoVisualizacion = 'Cada 5 días';
      const agrupadoN = {}, agrupadoV = {}, agrupadoT = {};
      
      entradasTotal.forEach(([fecha, count]) => {
        const d = new Date(fecha + 'T00:00:00');
        const daysSinceStart = Math.floor((d - primeraFecha) / (1000 * 60 * 60 * 24));
        const grupoIndex = Math.floor(daysSinceStart / 5);
        const key = `grupo-${grupoIndex}`;
        
        agrupadoT[key] = (agrupadoT[key] || 0) + count;
        agrupadoN[key] = (agrupadoN[key] || 0) + (normal[fecha] || 0);
        agrupadoV[key] = (agrupadoV[key] || 0) + (villas[fecha] || 0);
      });

      Object.keys(agrupadoT).sort().forEach((key, idx) => {
        const diaInicio = idx * 5 + 1;
        const diaFin = Math.min((idx + 1) * 5, diffDias);
        labels.push(`${diaInicio}-${diaFin}`);
        valuesTotal.push(agrupadoT[key]);
        valuesNormal.push(agrupadoN[key]);
        valuesVillas.push(agrupadoV[key]);
      });

    } else {
      // > 90 días → Por MESES
      modoVisualizacion = 'Por meses';
      const agrupadoN = {}, agrupadoV = {}, agrupadoT = {};
      
      entradasTotal.forEach(([fecha, count]) => {
        const d = new Date(fecha + 'T00:00:00');
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        agrupadoT[key] = (agrupadoT[key] || 0) + count;
        agrupadoN[key] = (agrupadoN[key] || 0) + (normal[fecha] || 0);
        agrupadoV[key] = (agrupadoV[key] || 0) + (villas[fecha] || 0);
      });

      Object.keys(agrupadoT).sort().forEach(key => {
        const [year, month] = key.split('-');
        const fecha = new Date(parseInt(year), parseInt(month) - 1);
        labels.push(fecha.toLocaleDateString('es-ES', { month: 'short' }));
        valuesTotal.push(agrupadoT[key]);
        valuesNormal.push(agrupadoN[key]);
        valuesVillas.push(agrupadoV[key]);
      });
    }

    periodoTexto = `${primeraFecha.toLocaleDateString('es-ES')} - ${ultimaFecha.toLocaleDateString('es-ES')}`;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 650;
  canvas.style.maxWidth = '100%';
  canvas.style.height = 'auto';
  
  const controlsHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
      <div style="display: flex; gap: 0.5rem;">
        <button class="toggle-line active" data-line="total" style="padding: 0.5rem 1rem; border-radius: 8px; border: 2px solid #cbd5e0; background: white; cursor: pointer; font-weight: 600; transition: all 0.3s;">
          Total
        </button>
        <button class="toggle-line active" data-line="normal" style="padding: 0.5rem 1rem; border-radius: 8px; border: 2px solid #48bb78; background: white; cursor: pointer; font-weight: 600; color: #48bb78; transition: all 0.3s;">
          Normal
        </button>
        <button class="toggle-line active" data-line="villas" style="padding: 0.5rem 1rem; border-radius: 8px; border: 2px solid #9f7aea; background: white; cursor: pointer; font-weight: 600; color: #9f7aea; transition: all 0.3s;">
          Villas
        </button>
      </div>
      <div style="color: #64748b; font-size: 0.9rem; font-weight: 500;">
        ${modoVisualizacion}
      </div>
    </div>
  `;
  
  container.innerHTML = controlsHTML;
  container.appendChild(canvas);
  periodoInfo.textContent = periodoTexto;

  const ctx = canvas.getContext('2d');
  const padding = 60;
  const width = canvas.width - 2 * padding;
  const height = canvas.height - 2 * padding - 50;
  const stepX = width / (labels.length - 1 || 1);
  const maxVal = Math.max(...valuesTotal, 1);
  const stepY = maxVal / 5;

  let highlightedI = -1;
  let activeLines = { total: true, normal: true, villas: true };

  const lines = [
    { key: 'total', data: valuesTotal, color: '#cbd5e0', label: 'Total', width: 2 },
    { key: 'normal', data: valuesNormal, color: '#48bb78', label: 'Normal', width: 3 },
    { key: 'villas', data: valuesVillas, color: '#9f7aea', label: 'Villas', width: 3 }
  ];

  function drawChart(progress = 1) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#f7fafc';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#a0aec0';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = padding + height - (i / 5) * height;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + width, y);
      ctx.stroke();
      ctx.fillText(Math.round(stepY * i), padding - 10, y + 4);
    }

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + height);
    ctx.lineTo(padding + width, padding + height);
    ctx.stroke();

    ctx.fillStyle = '#718096';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    labels.forEach((label, i) => {
      const x = padding + i * stepX;
      ctx.fillText(label, x, padding + height + 20);
    });

    const maxX = padding + progress * width;
    lines.forEach(line => {
      if (!activeLines[line.key]) return;
      
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.width;
      ctx.beginPath();
      let prevX = padding;
      let prevY = padding + height - (line.data[0] / maxVal) * height;
      ctx.moveTo(prevX, prevY);
      
      for (let i = 1; i < line.data.length; i++) {
        const x = padding + i * stepX;
        const y = padding + height - (line.data[i] / maxVal) * height;
        if (x > maxX) {
          const frac = (maxX - prevX) / (x - prevX);
          const interpY = prevY + frac * (y - prevY);
          ctx.lineTo(maxX, interpY);
          break;
        }
        ctx.lineTo(x, y);
        prevX = x;
        prevY = y;
      }
      ctx.stroke();
    });

    if (progress >= 1) {
      if (highlightedI >= 0) {
        ctx.strokeStyle = 'rgba(203, 213, 224, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        const x = padding + highlightedI * stepX;
        ctx.moveTo(x, padding);
        ctx.lineTo(x, padding + height);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      lines.forEach(line => {
        if (!activeLines[line.key]) return;
        
        ctx.fillStyle = line.color;
        line.data.forEach((val, i) => {
          const x = padding + i * stepX;
          const y = padding + height - (val / maxVal) * height;
          const radius = (i === highlightedI ? 6 : 4);
          
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
          
          if (i === highlightedI) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        });
      });
    }
  }

  let progress = 0;
  function anim() {
    progress += 0.03;
    drawChart(progress);
    if (progress < 1) requestAnimationFrame(anim);
  }
  anim();

  const toggleBtns = container.querySelectorAll('.toggle-line');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const lineKey = btn.dataset.line;
      const isActive = btn.classList.contains('active');
      const activeCount = Object.values(activeLines).filter(v => v).length;
      
      if (isActive && activeCount === 1) {
        activeLines = { total: true, normal: true, villas: true };
        toggleBtns.forEach(b => {
          b.classList.add('active');
          b.style.opacity = '1';
          b.style.background = 'white';
        });
      } else if (isActive) {
        activeLines[lineKey] = false;
        btn.classList.remove('active');
        btn.style.opacity = '0.4';
        btn.style.background = '#f7fafc';
      } else {
        activeLines = { total: false, normal: false, villas: false };
        activeLines[lineKey] = true;
        toggleBtns.forEach(b => {
          b.classList.remove('active');
          b.style.opacity = '0.4';
          b.style.background = '#f7fafc';
        });
        btn.classList.add('active');
        btn.style.opacity = '1';
        btn.style.background = 'white';
      }
      
      drawChart();
    });
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    let closestI = Math.round((mouseX - padding) / stepX);
    if (closestI < 0) closestI = 0;
    if (closestI >= labels.length) closestI = labels.length - 1;

    if (closestI !== highlightedI) {
      highlightedI = closestI;
      drawChart();
    }

    const n = valuesNormal[closestI] || 0;
    const v = valuesVillas[closestI] || 0;
    const t = valuesTotal[closestI] || 0;
    
    tooltip.innerHTML = `<strong>${labels[closestI]}</strong><br>Normal: ${n}<br>Villas: ${v}<br>Total: ${t}`;
    tooltip.style.left = `${e.pageX + 10}px`;
    tooltip.style.top = `${e.pageY}px`;
    tooltip.style.display = 'block';
  });
  
  canvas.addEventListener('mouseout', () => {
    if (highlightedI !== -1) {
      highlightedI = -1;
      drawChart();
    }
    tooltip.style.display = 'none';
  });
}

function mostrarMapaUbicaciones() {
  const container = document.getElementById('mapa-ubicaciones');
  const porProv = datosGlobales.ubicacionesPorProv;

  if (Object.keys(porProv).length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #718096; padding: 2rem;">No hay ubicaciones registradas</p>';
    return;
  }

  // Sort alphabetically, Otros last
  let entries = Object.entries(porProv)
    .filter(([prov]) => prov !== 'Otros')
    .sort(([a], [b]) => a.localeCompare(b));
  const otrosEntry = Object.entries(porProv).find(([prov]) => prov === 'Otros');
  if (otrosEntry) entries.push(otrosEntry);

  const html = entries.map(([prov, {count, sitios}]) => {
    const sitiosSorted = [...sitios].sort((a, b) => a.localeCompare(b));
    return `
      <details class="ubicacion-prov">
        <summary>
          <span class="ubicacion-icon">📍</span>
          ${prov} <span class="ubicacion-badge">${count}</span>
        </summary>
        <ul style="list-style: none; padding-left: 20px; margin-top: 0.5rem;">
          ${sitiosSorted.map(s => `<li>${s}</li>`).join('')}
        </ul>
      </details>
    `;
  }).join('');

  container.innerHTML = html;
}

function configurarEmbudo() {
  const btnCalcular = document.getElementById('btn-calcular-embudo');
  if (btnCalcular) {
    btnCalcular.removeEventListener('click', calcularEmbudo);
    btnCalcular.addEventListener('click', calcularEmbudo);
  }
}

function calcularEmbudo() {
  const clics = parseInt(document.getElementById('input-clics').value) || 0;
  const cpc = parseFloat(document.getElementById('input-cpc').value) || 0.5;
  const fechaInicio = document.getElementById('input-fecha-inicio').value;
  const finVal = document.getElementById('input-fecha-fin').value;

  if (!clics || !fechaInicio || !finVal || !datosGlobales) {
    document.getElementById('embudo-resultados').style.display = 'none';
    document.getElementById('embudo-grafica').style.display = 'none';
    alert('Por favor, completa todos los campos del embudo.');
    return;
  }

  // Crear fechas con hora local para evitar problemas de zona horaria
  const inicio = new Date(fechaInicio + 'T00:00:00');
  const fin = new Date(finVal + 'T23:59:59');

  console.log('=== DEBUG EMBUDO ===');
  console.log('Fecha inicio:', inicio);
  console.log('Fecha fin:', fin);

  // Palabras clave para identificar Villas
  const villasKeywords = ['promocion general', 'vivienda 03', 'vivienda 04', 'vivienda 05'];
  
  // Filtrar contactos del rango que sean de Villas y de procedencia Web
  const contactosEnRango = datosGlobales.dataCompleta.filter(c => {
    // 1. Validar fecha
    if (!c['Fecha']) return false;
    
    // Parsear fecha del contacto (sin conversión UTC)
    let fechaContacto;
    if (c['Fecha'] instanceof Date) {
      fechaContacto = c['Fecha'];
    } else {
      const fechaStr = String(c['Fecha']).trim();
      // Si viene como YYYY-MM-DD, añadir T00:00:00
      if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
        fechaContacto = new Date(fechaStr + 'T00:00:00');
      } else {
        fechaContacto = new Date(fechaStr);
      }
    }
    
    if (isNaN(fechaContacto)) return false;
    
    // Verificar que esté en el rango
    if (fechaContacto < inicio || fechaContacto > fin) return false;
    
    // 2. Verificar procedencia Web
    const procedenciaRaw = c['procedencia-contacto'] || c['origen-contacto'] || '';
    const procedencia = normalizar(procedenciaRaw);
    const isWeb = procedencia.includes('web') || procedencia.includes('pagina web');
    
    // 3. Verificar que sea Villas
    const viviendaInteresada = normalizar(c['vivienda-interesada'] || '');
    const isVillas = villasKeywords.some(keyword => viviendaInteresada.includes(keyword));
    
    const cumpleCondiciones = isWeb && isVillas;
    
    // Debug detallado
    if (cumpleCondiciones) {
      console.log('✅ Contacto válido:', {
        nombre: c['your-name'],
        fecha: fechaContacto.toLocaleDateString('es-ES'),
        procedencia: procedenciaRaw,
        viviendaInteresada: c['vivienda-interesada'],
        isWeb,
        isVillas
      });
    }
    
    return cumpleCondiciones;
  });

  console.log('Total contactos válidos:', contactosEnRango.length);
  console.log('===================');

  const tasaConversion = clics > 0 ? ((contactosEnRango.length / clics) * 100) : 0;
  const costoTotal = clics * cpc;
  const costoPorContacto = contactosEnRango.length > 0 ? (costoTotal / contactosEnRango.length) : 0;

  const resultadosDiv = document.getElementById('embudo-resultados');
  resultadosDiv.style.display = 'grid';
  resultadosDiv.style.opacity = '0';
  
  document.getElementById('embudo-clics').textContent = clics.toLocaleString('es-ES');
  document.getElementById('embudo-contactos').textContent = contactosEnRango.length;
  document.getElementById('embudo-conversion').textContent = tasaConversion.toFixed(2) + '%';
  document.getElementById('embudo-costo-total').textContent = costoTotal.toFixed(2) + '€';
  document.getElementById('embudo-costo-contacto').textContent = costoPorContacto.toFixed(2) + '€';

  setTimeout(() => {
    resultadosDiv.style.transition = 'opacity 0.5s ease';
    resultadosDiv.style.opacity = '1';
  }, 50);

  const graficaDiv = document.getElementById('embudo-grafica');
  graficaDiv.style.display = 'block';
  document.getElementById('embudo-porcentaje').textContent = tasaConversion.toFixed(2) + '%';
  
  const bar = graficaDiv.querySelector('.progress-bar');
  bar.style.width = '0%';
  setTimeout(() => {
    bar.style.transition = 'width 1s ease';
    bar.style.width = Math.min(tasaConversion, 100) + '%';
  }, 100);
}



function exportarDatos() {
  if (!datosGlobales) {
    alert('No hay datos para exportar');
    return;
  }

  const nota = document.getElementById('nota-texto').value.trim();
  
  const tipoFiltro = document.getElementById('filtro-tipo').value;
  let rangoFechas = 'Todos los datos';
  
  if (tipoFiltro === 'mensual') {
    const mesSeleccionado = document.getElementById('filtro-mes').value;
    if (mesSeleccionado) {
      const fecha = new Date(mesSeleccionado + '-01');
      rangoFechas = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    }
  } else if (tipoFiltro === 'rango') {
    const inicio = document.getElementById('filtro-inicio').value;
    const fin = document.getElementById('filtro-fin').value;
    if (inicio && fin) {
      rangoFechas = `${new Date(inicio).toLocaleDateString('es-ES')} - ${new Date(fin).toLocaleDateString('es-ES')}`;
    }
  }

  // Calcular porcentajes
  const porcNormal = datosGlobales.total > 0 ? ((datosGlobales.viviendaNormal / datosGlobales.total) * 100).toFixed(1) : 0;
  const porcVillas = datosGlobales.total > 0 ? ((datosGlobales.villasIsla / datosGlobales.total) * 100).toFixed(1) : 0;

  // Top 5 procedencias
  const topProcedencias = Object.entries(datosGlobales.procedencias)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const maxProcedencia = topProcedencias.length > 0 ? topProcedencias[0][1] : 1;

  // Crear HTML con estilos embebidos
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resumen de Contactos - Proyectopía</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
      color: #1a202c;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      padding: 3rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #667eea;
      padding-bottom: 2rem;
      margin-bottom: 2rem;
    }
    .header h1 {
      font-size: 2.5rem;
      color: #667eea;
      margin-bottom: 0.5rem;
    }
    .header .date {
      color: #718096;
      font-size: 1rem;
    }
    .info-box {
      background: #f7fafc;
      border-left: 4px solid #667eea;
      padding: 1rem 1.5rem;
      margin-bottom: 2rem;
      border-radius: 8px;
    }
    .section {
      margin-bottom: 3rem;
    }
    .section-title {
      font-size: 1.5rem;
      color: #2d3748;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .kpi-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      text-align: center;
    }
    .kpi-label {
      font-size: 0.9rem;
      opacity: 0.9;
      margin-bottom: 0.5rem;
    }
    .kpi-value {
      font-size: 3rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    .kpi-percentage {
      font-size: 0.9rem;
      opacity: 0.8;
    }
    .chart-container {
      background: #f7fafc;
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
    }
    .bar-item {
      margin-bottom: 1.5rem;
    }
    .bar-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #2d3748;
    }
    .bar-bg {
      width: 100%;
      height: 30px;
      background: #e2e8f0;
      border-radius: 15px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 1rem;
      color: white;
      font-weight: bold;
      font-size: 0.9rem;
      border-radius: 15px;
    }
    .nota-section {
      background: #fff5e6;
      border-left: 4px solid #ed8936;
      padding: 1.5rem;
      border-radius: 8px;
      margin-top: 2rem;
    }
    .nota-title {
      font-weight: 600;
      color: #ed8936;
      margin-bottom: 0.5rem;
    }
    .pie-chart {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3rem;
      margin: 2rem 0;
    }
    .pie-svg {
      width: 200px;
      height: 200px;
    }
    .legend {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .legend-color {
      width: 30px;
      height: 20px;
      border-radius: 4px;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Resumen de Contactos</h1>
      <p style="font-size: 1.2rem; color: #667eea; margin: 0.5rem 0;">PROYECTOPÍA</p>
      <p class="date">Fecha de exportación: ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>

    <div class="info-box">
      <strong>Período analizado:</strong> ${rangoFechas}
    </div>

    <div class="section">
      <div class="section-title">📈 Métricas Principales</div>
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Total Contactos</div>
          <div class="kpi-value">${datosGlobales.total}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Vivienda Normal</div>
          <div class="kpi-value">${datosGlobales.viviendaNormal}</div>
          <div class="kpi-percentage">${porcNormal}% del total</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Villas Cortegada</div>
          <div class="kpi-value">${datosGlobales.villasIsla}</div>
          <div class="kpi-percentage">${porcVillas}% del total</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Ubicaciones</div>
          <div class="kpi-value">${Object.keys(datosGlobales.ubicacionesPorProv).length}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">🥧 Distribución por Tipo</div>
      <div class="pie-chart">
        <svg class="pie-svg" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="80" fill="#48bb78" 
            stroke-dasharray="${(datosGlobales.viviendaNormal / datosGlobales.total * 502.4).toFixed(1)} 502.4"
            stroke-dashoffset="0"
            stroke-width="80"
            fill="none"
            transform="rotate(-90 100 100)"/>
          <circle cx="100" cy="100" r="80" fill="#9f7aea" 
            stroke-dasharray="${(datosGlobales.villasIsla / datosGlobales.total * 502.4).toFixed(1)} 502.4"
            stroke-dashoffset="${-(datosGlobales.viviendaNormal / datosGlobales.total * 502.4).toFixed(1)}"
            stroke-width="80"
            fill="none"
            transform="rotate(-90 100 100)"/>
          <circle cx="100" cy="100" r="40" fill="white"/>
          <text x="100" y="95" text-anchor="middle" font-size="18" fill="#1a202c" font-weight="bold">${datosGlobales.total}</text>
          <text x="100" y="115" text-anchor="middle" font-size="12" fill="#718096">Total</text>
        </svg>
        <div class="legend">
          <div class="legend-item">
            <div class="legend-color" style="background: #48bb78;"></div>
            <div>
              <div style="font-weight: 600;">Vivienda Normal</div>
              <div style="color: #718096; font-size: 0.9rem;">${datosGlobales.viviendaNormal} contactos (${porcNormal}%)</div>
            </div>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background: #9f7aea;"></div>
            <div>
              <div style="font-weight: 600;">Villas Cortegada</div>
              <div style="color: #718096; font-size: 0.9rem;">${datosGlobales.villasIsla} contactos (${porcVillas}%)</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">📍 Top 5 Procedencias</div>
      <div class="chart-container">
        ${topProcedencias.map(([proc, count]) => {
          const percentage = ((count / datosGlobales.total) * 100).toFixed(1);
          const width = ((count / maxProcedencia) * 100).toFixed(1);
          return `
            <div class="bar-item">
              <div class="bar-header">
                <span>${proc}</span>
                <span>${count} (${percentage}%)</span>
              </div>
              <div class="bar-bg">
                <div class="bar-fill" style="width: ${width}%">${percentage}%</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    ${nota ? `
    <div class="nota-section">
      <div class="nota-title">📝 Nota del Usuario</div>
      <p>${nota.replace(/\n/g, '<br>')}</p>
    </div>
    ` : ''}

  </div>
</body>
</html>
  `;

  // Crear blob y descargar
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const link = document.createElement('a');
  const fechaExport = new Date().toISOString().split('T')[0];
  link.href = URL.createObjectURL(blob);
  link.download = `resumen-contactos-${fechaExport}.html`;
  link.click();
  
  alert('✅ Resumen exportado correctamente.\n\n💡 Tip: Puedes abrir el archivo .html con Excel o cualquier navegador.');
}

function ocultarLoading() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('dashboard-content').style.display = 'block';
  if (datosGlobales) mostrarDashboard();
}
function configurarNotasExport() {
  const btnToggleNota = document.getElementById('btn-toggle-nota');
  const notaContainer = document.getElementById('nota-container');
  const btnExportar = document.getElementById('btn-exportar');

  if (btnToggleNota) {
    btnToggleNota.addEventListener('click', () => {
      if (notaContainer.style.display === 'none') {
        notaContainer.style.display = 'block';
      } else {
        notaContainer.style.display = 'none';
      }
    });
  }

  if (btnExportar) {
    btnExportar.addEventListener('click', exportarDatos);
  }
}


document.addEventListener('DOMContentLoaded', () => {
  configurarFiltros();
  configurarEmbudo();
  configurarNotasExport();
  cargarDatos();
});