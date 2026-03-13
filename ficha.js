document.addEventListener('DOMContentLoaded', () => {
  const apiUrl = 'https://script.google.com/macros/s/AKfycbzhw3QMxMyVBuSzbabj8wPc5hm5X75AODXqz7Kn737rn46G670fl844EWLhy0G13bc/exec';

  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  // Elementos del DOM
  const nombreInput = document.getElementById('nombre');
  const fechaInput = document.getElementById('fecha');
  const navNombre = document.getElementById('nav-nombre');
  const navFecha = document.getElementById('nav-fecha');
  const interesSelect = document.getElementById('interes-select');
  const interesInput = document.getElementById('interes');
  const interesOtrosContainer = document.getElementById('interes-otros-container');
  const formCompletoContainer = document.getElementById('form-completo');
  const viviendaInteresadaContainer = document.getElementById('vivienda-interesada-container');
  const origenSelect = document.getElementById('origen-contacto');
  const origenOtrosContainer = document.getElementById('origen-otros-container');
  const terrenoSelect = document.getElementById('terreno');
  const ubicacionContainer = document.getElementById('ubicacion-container');
  const comoConocidoSelect = document.getElementById('como-conocido');
  const comoConocidoOtrosContainer = document.getElementById('como-conocido-otros-container');


function mapearCampos(data) {
  const mapeo = {
    'origen-contacto': 'procedencia-contacto',
    'origen-otros-text': 'como-conocido-otros',
    'ubicacion': 'ubicacion-terreno',
    'terreno': 'radio-188',
	
  };
  
  const resultado = {};
  for (const key in data) {
    if (mapeo[key]) {
      resultado[mapeo[key]] = data[key];
    } else {
      resultado[key] = data[key];
    }
  }
  
  // Asegurar que estudio-viabilidad siempre se incluya
  if (data['estudio-viabilidad']) {
    resultado['estudio-viabilidad'] = data['estudio-viabilidad'];
  }
  
  return resultado;
}

  // Función para determinar el tipo de vivienda basado en los datos
  function determinarTipoVivienda(data) {
    const viviendaInteresada = data['vivienda-interesada'];
    if (viviendaInteresada && viviendaInteresada.trim() !== '' && viviendaInteresada.trim() !== '—') {
      return 'Villas isla de Cortegada';
    }
    if (data['interes'] && data['interes'].trim() !== '') {
      return data['interes'];
    }
    return 'Vivienda normal';
  }

  // Actualizar barra de navegación
  function updateNavBar() {
    navNombre.textContent = `Nombre: ${nombreInput.value || '-'}`;
    navFecha.textContent = `Fecha: ${fechaInput.value || '-'}`;
  }

  if (nombreInput && fechaInput) {
    nombreInput.addEventListener('input', updateNavBar);
    fechaInput.addEventListener('input', updateNavBar);
  }

  // Control de visibilidad según el interés seleccionado
  interesSelect.addEventListener('change', () => {
    const valorInteres = interesSelect.value;
    interesInput.value = valorInteres;
    if (valorInteres === 'Otros') {
      interesOtrosContainer.style.display = 'block';
    } else {
      interesOtrosContainer.style.display = 'none';
      document.getElementById('interes-otros').value = '';
    }
    if (valorInteres === 'Villas isla de Cortegada') {
      formCompletoContainer.style.display = 'none';
      viviendaInteresadaContainer.style.display = 'block';
    } else {
      formCompletoContainer.style.display = 'block';
      viviendaInteresadaContainer.style.display = 'none';
    }
  });

  // Control de campo "Otros" en origen de contacto
  origenSelect.addEventListener('change', () => {
    origenOtrosContainer.style.display = origenSelect.value === 'Otros' ? 'block' : 'none';
    if (origenSelect.value !== 'Otros') {
      document.getElementById('origen-otros-text').value = '';
    }
  });

  // Control de ubicación del terreno
  if (terrenoSelect && ubicacionContainer) {
    terrenoSelect.addEventListener('change', () => {
      ubicacionContainer.style.display = terrenoSelect.value === 'No' ? 'none' : 'block';
      if (terrenoSelect.value === 'No') {
        document.getElementById('ubicacion-terreno').value = '';
      }
    });
  }

  // Control de campo "Otros" en cómo conocido
  if (comoConocidoSelect && comoConocidoOtrosContainer) {
    comoConocidoSelect.addEventListener('change', () => {
      comoConocidoOtrosContainer.style.display = comoConocidoSelect.value === 'Otros' ? 'block' : 'none';
      if (comoConocidoSelect.value !== 'Otros') {
        document.getElementById('como-conocido-otros').value = '';
      }
    });
  }



  // Formateo para fechas input[type=date]
  function formatDateForInput(dateString) {
    if (!dateString) return '';
    return dateString.split('T')[0];
  }

  // Variable para guardar datos cargados o guardados
  let datosGuardados = null;

  // Cargar datos por ID
const id = getQueryParam('id');
if (id) {
    document.getElementById('ficha-id').value = id;
    fetch(`${apiUrl}?id=${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.status === 'success') {
          const data = json.data;
// Cargar fecha de creación (Fecha) - NO confundir con date-33
const fechaCreacion = data['Fecha'] || '';
document.querySelector('[name=Fecha]').value = formatDateForInput(fechaCreacion);
          document.querySelector('[name=your-name]').value = data['your-name'] || '';
          document.querySelector('[name=your-email]').value = data['your-email'] || '';
          document.querySelector('[name=tel-686]').value = data['tel-686'] || '';
          
          const interesValue = determinarTipoVivienda(data);
          console.log('Tipo de vivienda detectado:', interesValue, data);
          if (interesValue) {
            interesSelect.value = interesValue;
            interesInput.value = interesValue;
          }
          if (interesValue === 'Otros') {
            interesOtrosContainer.style.display = 'block';
            document.getElementById('interes-otros').value = data['interes-otros'] || '';
          } else {
            interesOtrosContainer.style.display = 'none';
          }
          if (interesValue === 'Villas isla de Cortegada') {
            formCompletoContainer.style.display = 'none';
            viviendaInteresadaContainer.style.display = 'block';
            const viviendaInteresadaSelect = document.querySelector('[name=vivienda-interesada]');
            if (viviendaInteresadaSelect) {
              viviendaInteresadaSelect.value = data['vivienda-interesada'] || '';
            }
          } else if (interesValue) {
            formCompletoContainer.style.display = 'block';
            viviendaInteresadaContainer.style.display = 'none';
          } else {
            formCompletoContainer.style.display = 'block';
            viviendaInteresadaContainer.style.display = 'none';
          }
          
          const origenContacto = data['procedencia-contacto'] || data['origen-contacto'] || '';
          document.querySelector('[name=origen-contacto]').value = origenContacto;
          if (origenContacto === 'Otros') {
            origenOtrosContainer.style.display = 'block';
            document.getElementById('origen-otros-text').value = data['como-conocido-otros'] || data['origen-otros-text'] || '';
          } else {
            origenOtrosContainer.style.display = 'none';
          }
        
          if (interesValue !== 'Villas isla de Cortegada') {
            document.querySelector('[name=terreno]').value = data['radio-188'] || data['terreno'] || '';
            if ((data['radio-188'] || data['terreno']) === 'No') {
              ubicacionContainer.style.display = 'none';
              document.querySelector('[name=ubicacion-terreno]').value = '';
            } else {
              ubicacionContainer.style.display = 'block';
              document.querySelector('[name=ubicacion-terreno]').value = data['ubicacion-terreno'] || '';
            }
            document.querySelector('[name=number-419]').value = data['number-419'] || '';
            // Cargar plazo o fecha deseada (date-33) - campo independiente
const plazoDeseado = data['date-33'] || '';
document.querySelector('[name=date-33]').value = formatDateForInput(plazoDeseado);
            document.querySelector('[name=number-420]').value = data['number-420'] || '';
            document.querySelector('[name=number-421]').value = data['number-421'] || '';
            document.querySelector('[name=number-422]').value = data['number-422'] || '';
            document.querySelector('[name=number-423]').value = data['number-423'] || '';
            document.querySelector('[name=fecha-llamada]').value = formatDateForInput(data['fecha-llamada']) || '';
            document.querySelector('[name=como-conocido]').value = data['como-conocido'] || '';
            if (data['como-conocido'] === 'Otros') {
              comoConocidoOtrosContainer.style.display = 'block';
              document.getElementById('como-conocido-otros').value = data['como-conocido-otros'] || '';
            } else {
              comoConocidoOtrosContainer.style.display = 'none';
              document.getElementById('como-conocido-otros').value = '';
            }

            document.querySelector('[name=distribucion-dia]').value = data['distribucion-dia'] || '';
            document.querySelector('[name=garaje]').value = data['garaje'] || '';
            document.querySelector('[name=piscina]').value = data['piscina'] || '';
            document.querySelector('[name=estancia-adicional]').value = data['estancia-adicional'] || '';
            document.querySelector('[name=superficie-parcela]').value = data['superficie-parcela'] || '';
            document.querySelector('[name=edificabilidad]').value = data['edificabilidad'] || '';
            document.querySelector('[name=ocupacion]').value = data['ocupacion'] || '';
            document.querySelector('[name=referencia-catastral]').value = data['referencia-catastral'] || '';
            document.querySelector('[name=fecha-mail]').value = formatDateForInput(data['fecha-mail']) || '';
            document.querySelector('[name=info-enviada]').value = data['info-enviada'] || '';
            document.querySelector('[name=fecha-reunion]').value = formatDateForInput(data['fecha-reunion']) || '';
            document.querySelector('[name=imprescindible]').value = data['imprescindible'] || '';
			
			// CARGAR ESTUDIO DE VIABILIDAD
const selectViabilidad = document.querySelector('[name=estudio-viabilidad]');
if (selectViabilidad) {
  selectViabilidad.value = data['estudio-viabilidad'] || '';
  console.log('✅ Estudio viabilidad cargado:', data['estudio-viabilidad']);
}
          }
			
         document.querySelector('[name=Notas]').value = data['Notas'] || '';

// Asegurar que datosGuardados tenga el valor actualizado del DOM
datosGuardados = { ...data };

// Si estudio-viabilidad no vino en data, usar el valor del select actual
const selectViabilidadFinal = document.querySelector('[name=estudio-viabilidad]');
if (selectViabilidadFinal && !datosGuardados['estudio-viabilidad']) {
  datosGuardados['estudio-viabilidad'] = selectViabilidadFinal.value || '';
}

console.log('💾 Datos guardados después de cargar (con estudio-viabilidad):', datosGuardados);
          console.log('Datos guardados después de cargar:', datosGuardados);
          document.getElementById('exportarWord').disabled = false;
          document.getElementById('exportarZip').disabled = false;
          updateNavBar();
        } else {
          alert('No se encontraron datos para este ID');
        }
      })
      .catch(err => {
        console.error('Error al cargar datos:', err);
        alert('Hubo un problema al cargar los datos.');
      });
  } else {
    interesSelect.value = '';
    interesInput.value = '';
    formCompletoContainer.style.display = 'block';
    viviendaInteresadaContainer.style.display = 'none';
  }

// Evento Guardar datos
document.getElementById('guardarDatos').addEventListener('click', async (event) => {
    event.preventDefault();
    const formData = new FormData(document.getElementById('form-ficha'));
    const dataToSend = {};

    for (let [key, value] of formData.entries()) {
      if (key === 'cualidades') {
        dataToSend[key] = dataToSend[key] ? dataToSend[key] + ', ' + value : value;
      } else {
        dataToSend[key] = value;
      }
    }

    // CAPTURAR EXPLÍCITAMENTE estudio-viabilidad
    const estudioViabilidadSelect = document.getElementById('estudio-viabilidad');
    if (estudioViabilidadSelect) {
      dataToSend['estudio-viabilidad'] = estudioViabilidadSelect.value || '';
      console.log('📊 Estudio de viabilidad capturado:', dataToSend['estudio-viabilidad']);
    }
	
	// Garantizar que Fecha (creación) y date-33 (plazo deseado) sean independientes
const inputFechaCreacion = document.getElementById('fecha');
const inputPlazoDeseado = document.querySelector('[name=date-33]');

if (inputFechaCreacion && inputFechaCreacion.value) {
  dataToSend['Fecha'] = inputFechaCreacion.value;
}

if (inputPlazoDeseado && inputPlazoDeseado.value) {
  dataToSend['date-33'] = inputPlazoDeseado.value;
}

    dataToSend['interes'] = interesInput.value || '';
    if (dataToSend['interes'] === 'Otros') {
      dataToSend['interes-otros'] = document.getElementById('interes-otros').value.trim();
    }

    if (dataToSend['origen-contacto']) {
      dataToSend['procedencia-contacto'] = dataToSend['origen-contacto'];
    }
    if (dataToSend['origen-contacto'] === 'Otros') {
      dataToSend['origen-otros-text'] = document.getElementById('origen-otros-text').value.trim();
    }

    dataToSend['vivienda-interesada'] = dataToSend['vivienda-interesada'] || '—';
    dataToSend['source'] = 'ficha';
    dataToSend['action'] = 'saveFormData';
    dataToSend['ID'] = document.getElementById('ficha-id').value || '';

    console.log('📦 Datos antes del mapeo:', dataToSend);

    const dataMapeada = mapearCampos(dataToSend);

    console.log('📦 Datos después del mapeo:', dataMapeada);
    console.log('🔍 estudio-viabilidad en dataMapeada:', dataMapeada['estudio-viabilidad']);

    try {
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(dataMapeada)
      });
      const result = await resp.json();
      console.log('✅ Respuesta del servidor:', result);
      if (result.status === 'success') {
  alert('Datos guardados correctamente');
  // Actualizar datosGuardados con TODOS los campos incluyendo estudio-viabilidad
  datosGuardados = { ...dataToSend };
  console.log('💾 Datos guardados después de guardar (verificar estudio-viabilidad):', datosGuardados['estudio-viabilidad']);
        document.getElementById('exportarWord').disabled = false;
        document.getElementById('exportarZip').disabled = false;
        updateNavBar();
      } else {
        alert('Error al guardar: ' + (result.message || result));
      }
    } catch (err) {
      console.error('❌ Error al enviar datos:', err);
      alert('Error al guardar los datos: ' + err.message);
    }
});

  // Función para generar el documento Word
  async function generarDocumentoWord(datosGuardados) {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } = window.docx;

    const formatearFecha = fecha => {
      if (!fecha) return '-';
      const d = new Date(fecha);
      return isNaN(d) ? '-' : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    const textoALista = texto => {
      if (!texto) return ['-'];
      return texto.split(',').map(i => i.trim()).filter(Boolean);
    };

    const camposFecha = ['Fecha', 'date-33', 'fecha-llamada', 'fecha-mail', 'fecha-reunion'];
    const camposLista = ['cualidades', 'checkbox-374'];
    const camposMultilinea = [
      'coherencia-dormitorios', 'coherencia-presupuesto', 'descripcion-vivienda', 'estancia-adicional',
      'presupuesto-deseado', 'viabilidad', 'informacion-adicional', 'info-enviada', 'imprescindible', 'Notas'
    ];

    const crearFilasTabla = (label, key, otrosKey = null, valorFijo = null) => {
      let valorOriginal = valorFijo ?? datosGuardados[key] ?? '-';

if (typeof valorOriginal !== 'string') {
  valorOriginal = String(valorOriginal);
}

      const valorOtros = otrosKey ? datosGuardados[otrosKey] || '' : '';
      
      const labelCell = new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({ 
                text: `${label}:`, 
                bold: true, 
                size: 20, 
                font: 'Calibri',
                color: '2F4F4F'
              })
            ],
            spacing: { before: 100, after: 100 }
          })
        ],
        width: { size: 35, type: WidthType.PERCENTAGE },
        margins: { top: 200, bottom: 200, left: 300, right: 200 },
        shading: { fill: 'F8F9FA' }
      });

      if (camposFecha.includes(key)) {
        return [
          new TableRow({
            children: [
              labelCell,
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ 
                        text: formatearFecha(valorOriginal), 
                        size: 20, 
                        font: 'Calibri',
                        color: '000000'
                      })
                    ],
                    spacing: { before: 100, after: 100 }
                  })
                ],
                width: { size: 65, type: WidthType.PERCENTAGE },
                margins: { top: 200, bottom: 200, left: 200, right: 300 }
              })
            ]
          })
        ];
      }

      if (camposLista.includes(key)) {
        const items = textoALista(valorOriginal);
        const filas = [
          new TableRow({
            children: [
              labelCell,
              new TableCell({
                children: items.map(item => new Paragraph({
                  children: [
                    new TextRun({ 
                      text: `• ${item}`, 
                      size: 20, 
                      font: 'Calibri',
                      color: '000000'
                    })
                  ],
                  spacing: { before: 50, after: 50 }
                })),
                width: { size: 65, type: WidthType.PERCENTAGE },
                margins: { top: 200, bottom: 200, left: 200, right: 300 }
              })
            ]
          })
        ];
        if (otrosKey && valorOtros && items.includes('Otros')) {
          filas.push(
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph('')],
                  width: { size: 35, type: WidthType.PERCENTAGE },
                  margins: { top: 100, bottom: 100, left: 300, right: 200 },
                  shading: { fill: 'F8F9FA' }
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ 
                          text: `• ${valorOtros}`, 
                          size: 20, 
                          font: 'Calibri',
                          color: '000000'
                        })
                      ],
                      spacing: { before: 50, after: 50 }
                    })
                  ],
                  width: { size: 65, type: WidthType.PERCENTAGE },
                  margins: { top: 100, bottom: 100, left: 200, right: 300 }
                })
              ]
            })
          );
        }
        return filas;
      }

      if (camposMultilinea.includes(key)) {
        const lineas = valorOriginal.split('\n').filter(l => l.trim() !== '');
        if (lineas.length === 0) {
          return [
            new TableRow({
              children: [
                labelCell,
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ 
                          text: '-', 
                          size: 20, 
                          font: 'Calibri',
                          color: '000000'
                        })
                      ],
                      spacing: { before: 100, after: 100 }
                    })
                  ],
                  width: { size: 65, type: WidthType.PERCENTAGE },
                  margins: { top: 200, bottom: 200, left: 200, right: 300 }
                })
              ]
            })
          ];
        }
        return [
          new TableRow({
            children: [
              labelCell,
              new TableCell({
                children: lineas.map((linea, index) => new Paragraph({
                  children: [
                    new TextRun({ 
                      text: linea, 
                      size: 20, 
                      font: 'Calibri',
                      color: '000000'
                    })
                  ],
                  spacing: { before: index === 0 ? 100 : 50, after: index === lineas.length - 1 ? 100 : 50 }
                })),
                width: { size: 65, type: WidthType.PERCENTAGE },
                margins: { top: 200, bottom: 200, left: 200, right: 300 }
              })
            ]
          })
        ];
      }

      return [
        new TableRow({
          children: [
            labelCell,
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: valorOriginal, 
                      size: 20, 
                      font: 'Calibri',
                      color: '000000'
                    })
                  ],
                  spacing: { before: 100, after: 100 }
                })
              ],
              width: { size: 65, type: WidthType.PERCENTAGE },
              margins: { top: 200, bottom: 200, left: 200, right: 300 }
            })
          ]
        })
      ];
    };

    let secciones = [];
    if (datosGuardados['interes'] === 'Villas isla de Cortegada') {
      secciones = [
        {
          titulo: 'VILLAS ISLA DE CORTEGADA',
          campos: [
            ['Nombre/s', 'your-name'],
            ['Correo electrónico', 'your-email'],
            ['Teléfono', 'tel-686'],
            ['Procedencia del contacto', 'procedencia-contacto', 'origen-otros-text'],
            ['Vivienda interesada', 'vivienda-interesada'],
            ['Notas adicionales', 'Notas']
          ]
        }
      ];
    } else {
      secciones = [
        {
   
    titulo: 'DATOS VÍA WEB O VÍA MAIL',
    subtitulo: 'A medida de tus posibilidades',
    campos: [
      ['Nombre/s', 'your-name'],
      ['Correo electrónico', 'your-email'],
      ['Teléfono', 'tel-686'],
      ['Dispones de terreno', 'radio-188'],
      ['Ubicación del terreno', 'ubicacion-terreno'],
      ['Inversión estimada', 'number-419'],
      ['Plazo o fecha deseada', 'date-33'],
    ]
  },
  {
    subtitulo: 'A medida de tus necesidades',
    campos: [
      ['Número de plantas', 'number-420'],
      ['Superficie de la vivienda', 'number-421'],
      ['Número de dormitorios', 'number-422'],
      ['Número de baños', 'number-423'],
    ]
  },
  {
    titulo: 'LLAMADA 01',
    campos: [
      ['¿Cómo nos has conocido?', 'como-conocido', 'como-conocido-otros'],
      ['Distribución zona de día', 'distribucion-dia'],
      ['Garaje', 'garaje'],
      ['Piscina', 'piscina'],
      ['Estancia adicional', 'estancia-adicional'],
      ['Superficie de la parcela', 'superficie-parcela'],
      ['Edificabilidad', 'edificabilidad'],
      ['Ocupación', 'ocupacion'],
      ['Referencia catastral', 'referencia-catastral'],
      ['Estudio de viabilidad', 'estudio-viabilidad'], 
    ]
  },
  {
    titulo: 'MAIL 01',
    campos: [
      ['Detallar información enviada', 'info-enviada'],
    ]
  },
  {
  titulo: 'ESTUDIO DE VIABILIDAD',
  campos: [
    ['Estudio de viabilidad', 'estudio-viabilidad'],
    ['Fecha de reunión', 'fecha-reunion'],
    ['Imprescindible', 'imprescindible'],
  ]
},
  {
    titulo: 'NOTAS',
    campos: [
      ['Notas adicionales', 'Notas']
    ]
  }
];
    }

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { size: 20, font: 'Calibri' },
            paragraph: { spacing: { line: 360 } }
          }
        }
      },
      sections: [
        {
          properties: { 
            page: { 
              margin: { 
                top: 1440, 
                bottom: 1440, 
                left: 1440, 
                right: 1440 
              } 
            }
          },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'CUESTIONARIO 2025',
                  bold: true,
                  size: 32,
                  font: 'Calibri',
                  color: '849901'
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 600 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Cliente: ${datosGuardados['your-name'] || '-'}`,
                  size: 22,
                  font: 'Calibri',
                  color: '2F4F4F'
                }),
                new TextRun({
                  text: `     •     Fecha: ${formatearFecha(datosGuardados['Fecha'] || document.querySelector('[name=Fecha]').value || '-')}`,
                  size: 22,
                  font: 'Calibri',
                  color: '2F4F4F'
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 400 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                  size: 16,
                  color: '849901'
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 400 }
            }),
            ...secciones.flatMap(seccion => {
              const elementos = [];
              if (seccion.titulo) {
                elementos.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: seccion.titulo,
                        bold: true,
                        size: 26,
                        font: 'Calibri',
                        color: '849901'
                      })
                    ],
                    spacing: { before: 600, after: 300 }
                  })
                );
              }
              if (seccion.subtitulo) {
                elementos.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: seccion.subtitulo,
                        bold: true,
                        size: 22,
                        font: 'Calibri',
                        color: '6B7C01',
                        italics: true
                      })
                    ],
                    spacing: { before: 400, after: 200 }
                  })
                );
              }
              const tableRows = seccion.campos.flatMap(([label, key, otrosKey, valorFijo]) => {
                if (key === 'ubicacion-terreno' && datosGuardados['radio-188'] === 'No') {
                  return [];
                }
                if (key === 'cualidades-otros' && !datosGuardados['checkbox-374']?.includes('Otros')) {
                  return [];
                }
                if (key === 'como-conocido-otros' && datosGuardados['como-conocido'] !== 'Otros') {
                  return [];
                }
                return crearFilasTabla(label, key, otrosKey, valorFijo);
              });
              if (tableRows.length > 0) {
                elementos.push(
                  new Table({
                    rows: tableRows,
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
                      left: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
                      right: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
                      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'EEEEEE' },
                      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' }
                    }
                  }),
                  new Paragraph({
                    text: '',
                    spacing: { before: 0, after: 300 }
                  })
                );
              }
              return elementos;
            })
          ]
        }
      ]
    });

    return await Packer.toBlob(doc);
  }

  // Evento Exportar a Word
  document.getElementById('exportarWord').addEventListener('click', async (event) => {
    event.preventDefault();
    if (!datosGuardados) {
      alert('Primero debes guardar o cargar los datos.');
      return;
    }
    if (!window.docx) {
      alert('La librería docx no está cargada. Asegúrate de incluir docx.js.');
      return;
    }
    if (!window.saveAs) {
      alert('La librería FileSaver no está cargada. Asegúrate de incluir FileSaver.js.');
      return;
    }

    try {
      const blob = await generarDocumentoWord(datosGuardados);
      let nombrePersona = (datosGuardados['your-name'] || 'SIN_NOMBRE').toUpperCase();
      const fecha = new Date();
      const docxFileName = `cuestionario_${nombrePersona.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')}_${fecha.getDate()}_${fecha.getMonth() + 1}_${fecha.getFullYear()}.docx`;
      saveAs(blob, docxFileName);
    } catch (err) {
      console.error('Error al exportar Word:', err);
      alert('Error al generar el documento Word: ' + err.message);
    }
  });

  // Evento Exportar con Carpeta (ZIP sin carpeta interna)
  document.getElementById('exportarZip').addEventListener('click', async (event) => {
    event.preventDefault();
    if (!datosGuardados) {
      alert('Primero debes guardar o cargar los datos.');
      return;
    }
    if (!window.docx) {
      alert('La librería docx no está cargada. Asegúrate de incluir docx.js.');
      return;
    }
    if (!window.saveAs) {
      alert('La librería FileSaver no está cargada. Asegúrate de incluir FileSaver.js.');
      return;
    }
    if (!window.JSZip) {
      alert('La librería JSZip no está cargada. Asegúrate de incluir jszip.js.');
      return;
    }

    console.log('Librerías disponibles:', {
      docx: !!window.docx,
      saveAs: !!window.saveAs,
      JSZip: !!window.JSZip
    });
    console.log('Datos guardados:', datosGuardados);

    try {
      const blob = await generarDocumentoWord(datosGuardados);
      let nombrePersona = (datosGuardados['your-name'] || 'SIN_NOMBRE').toUpperCase();
      let zipFileName;
      if (datosGuardados['interes'] === 'Villas isla de Cortegada') {
        zipFileName = `${nombrePersona} (PROMO VILLA).zip`;
      } else {
        let ubicacion = datosGuardados['ubicacion-terreno'] || 'SIN_UBICACION';
        zipFileName = `${nombrePersona} (${ubicacion.toUpperCase()}).zip`;
      }
      zipFileName = zipFileName.replace(/[/\\?%*:|"<>]/g, '_');
      const fecha = new Date();
      const docxFileName = `cuestionario_${nombrePersona.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')}_${fecha.getDate()}_${fecha.getMonth() + 1}_${fecha.getFullYear()}.docx`;
      const zip = new JSZip();
      zip.file(docxFileName, blob);
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, zipFileName);
    } catch (err) {
      console.error('Error al exportar ZIP:', err);
      alert('Error al generar el ZIP: ' + err.message);
    }
  });

  // Iconos SVG para botón copiar y tick
  const copiarSVG = `
    <svg width="25" height="25" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="7" width="9" height="9" rx="2" fill="#ffffff" stroke="#64748b" stroke-width="1.5"/>
      <rect x="4" y="4" width="9" height="9" rx="2" fill="#ffffff" stroke="#a3a3a3" stroke-width="1.2"/>
    </svg>
  `;
  const tickSVG = `
    <svg width="25" height="25" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 11.3L9.15 14.5L14.2 8.5" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  // Elementos
  const btnCopiarRef = document.getElementById('btnCopiarRef');
  const inputRefCat = document.getElementById('referencia-catastral');
  const btnAbrirMapa = document.getElementById('btnAbrirMapa');

  // Inicializar icono copiar
  btnCopiarRef.innerHTML = copiarSVG;

  // Evento para copiar referencia
  btnCopiarRef.addEventListener('click', () => {
    const ref = inputRefCat.value.trim();
    if (!ref) return;
    if (navigator.clipboard && navigator.clipboard.write) {
      const clipboardItem = new ClipboardItem({
        'text/plain': new Blob([ref], { type: 'text/plain' }),
      });
      navigator.clipboard.write([clipboardItem]).then(() => {
        btnCopiarRef.innerHTML = tickSVG;
        setTimeout(() => {
          btnCopiarRef.innerHTML = copiarSVG;
        }, 1500);
      }).catch(() => {
        fallbackCopy(ref);
      });
    } else {
      fallbackCopy(ref);
    }
  });

  // Evento para abrir mapa
  btnAbrirMapa.addEventListener('click', () => {
    window.open("https://www1.sedecatastro.gob.es/Cartografia/mapa.aspx?buscar=S", '_blank');
  });

  // Método fallback de copiar texto clásico
  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      btnCopiarRef.innerHTML = tickSVG;
      setTimeout(() => {
        btnCopiarRef.innerHTML = copiarSVG;
      }, 1500);
    } catch (e) {
      console.error('No se pudo copiar la referencia', e);
    }
    document.body.removeChild(textarea);
  }

// Evento para abrir Google Maps con la ubicación del terreno
  const btnAbrirMapaUbicacion = document.getElementById('btnAbrirMapaUbicacion');
  if (btnAbrirMapaUbicacion) {
    btnAbrirMapaUbicacion.addEventListener('click', () => {
      const ubicacion = document.getElementById('ubicacion-terreno').value.trim();
      if (!ubicacion) {
        alert('Por favor, introduce una ubicación primero');
        return;
      }
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ubicacion)}`;
      window.open(url, '_blank');
    });
  }


  updateNavBar();
});


// ============================================
// CONFIGURACIÓN CAMPO INVERSIÓN ESTIMADA
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  const inversionInput = document.getElementById('inversion');
  
  if (inversionInput) {
    // Detectar cuando se pulsa la flecha arriba estando el campo vacío
    inversionInput.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowUp' && (this.value === '' || this.value === null)) {
        e.preventDefault();
        this.value = 100000;
      }
    });
    
    // Detectar clic en las flechas del input (spinner)
    inversionInput.addEventListener('input', function(e) {
      // Si el campo tenía valor vacío y ahora tiene 5000 (primer incremento)
      if (this.value !== '' && parseFloat(this.value) === 5000) {
        this.value = 100000;
      }
    });
  }
});