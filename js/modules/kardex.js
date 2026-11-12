let itemsGrid = [];
let editIndex = -1;
let modoRecogida = false;

// 1. AGRUPACIÓN CONSOLIDADA POR CONSECUTIVO (Un solo registro por documento)
window.agruparRegistrosPorConsecutivo = function(listaOriginal) {
  if (!listaOriginal || !Array.isArray(listaOriginal)) return [];
  
  const mapa = new Map();
  
  listaOriginal.forEach(item => {
    const key = `${item.consecutivo || '000000'}_${item.tercero || ''}_${item.fecha ? item.fecha.slice(0,10) : ''}`;
    
    if (!mapa.has(key)) {
      mapa.set(key, {
        consecutivo: item.consecutivo,
        tipo: item.tipo,
        bodega: item.bodega,
        nit: item.nit,
        tercero: item.tercero,
        esRecogida: item.esRecogida,
        fecha: item.fecha,
        observaciones: item.observaciones,
        items: [item],
        cantTotal: Number(item.cantidad || 0),
        valTotal: Number(item.valor || 0)
      });
    } else {
      const doc = mapa.get(key);
      doc.items.push(item);
      doc.cantTotal += Number(item.cantidad || 0);
      doc.valTotal += Number(item.valor || 0);
    }
  });

  return Array.from(mapa.values());
};

// 2. COPIAR DOCUMENTO COMPLETO (Trae Pan, Frutas y todos los productos al modal)
window.duplicarRegistroConsecutivo = function(consecutivo) {
  const registrosDoc = (window.todosLosRegistros || []).filter(r => r.consecutivo === consecutivo);

  if(!registrosDoc || registrosDoc.length === 0) {
    alert("No se encontraron ítems para copiar de este documento.");
    return;
  }

  const base = registrosDoc[0];
  abrirModalInventario(base.esRecogida || false);

  document.getElementById('doc-tipo').value = base.tipo || "16";
  document.getElementById('doc-bodega').value = base.bodega || "PA";
  document.getElementById('doc-nit').value = base.nit || "";
  document.getElementById('doc-nombre-tercero').value = base.tercero || "";
  document.getElementById('doc-observaciones').value = base.observaciones ? `Copia de ${consecutivo}: ${base.observaciones}` : `Copia de ${consecutivo}`;

  itemsGrid = [];
  registrosDoc.forEach(r => {
    itemsGrid.push({
      referencia: r.referencia,
      unidad: r.unidad || 'Kilos',
      cantidad: Number(r.cantidad || 0),
      valUnit: Number(r.valUnit || 0),
      valor: Number(r.valor || 0)
    });
  });

  renderizarGrid();
};

// 3. RENDERIZADO DE TABLA (MOSTRANDO 1 FILA POR DOCUMENTO CONSOLIDADO)
window.renderizarTablaKardex = function(lista) {
  const tabla = document.getElementById('tabla-inventario');
  const contador = document.getElementById('contador-registros');
  if(!tabla) return;

  const documentosAgrupados = window.agruparRegistrosPorConsecutivo(lista);

  if(contador) contador.innerText = `${documentosAgrupados.length} Documentos (${lista.length} Ítems)`;

  if(documentosAgrupados.length === 0) {
    tabla.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 1.5rem; color: #9ca3af;">No se encontraron registros en el rango seleccionado.</td></tr>`;
    return;
  }

  let htmlRows = "";
  documentosAgrupados.forEach((doc) => {
    const tipoBadge = doc.esRecogida ? `<span style="background: #e0f2fe; color: #0369a1; padding: 0.2rem 0.5rem; border-radius: 0.25rem; font-weight: bold;"><i class="fa-solid fa-truck-pickup"></i> Recogida</span>`
                    : doc.tipo == "16" ? `<span style="background: #dcfce7; color: #15803d; padding: 0.2rem 0.5rem; border-radius: 0.25rem; font-weight: bold;">16 - Entrada</span>`
                    : doc.tipo == "30" ? `<span style="background: #fef3c7; color: #b45309; padding: 0.2rem 0.5rem; border-radius: 0.25rem; font-weight: bold;">30 - Salida Compras</span>`
                    : `<span style="background: #fee2e2; color: #b91c1c; padding: 0.2rem 0.5rem; border-radius: 0.25rem; font-weight: bold;">17 - Salida</span>`;

    let refTexto = "";
    if (doc.items.length === 1) {
      refTexto = doc.items[0].referencia;
    } else {
      refTexto = `<strong style="color: #1e3a8a;">${doc.items[0].referencia}</strong> <span style="background: #e2e8f0; color: #475569; padding: 0.1rem 0.4rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: bold;">+${doc.items.length - 1} más</span>`;
    }

    const btnPdf = doc.esRecogida ? `<button onclick="window.reimprimirPDF('${doc.consecutivo}')" style="background: #0284c7; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; cursor: pointer; font-weight: bold;" title="Descargar PDF"><i class="fa-solid fa-file-pdf"></i> PDF</button>` : ``;
    const btnCopiar = `<button onclick="window.duplicarRegistroConsecutivo('${doc.consecutivo}')" style="background: #8b5cf6; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; cursor: pointer; font-weight: bold; margin-left: 0.2rem;" title="Copiar este documento completo"><i class="fa-solid fa-copy"></i> Copiar</button>`;

    htmlRows += `
      <tr style="border-bottom: 1px solid #f3f4f6;">
        <td style="padding: 0.75rem; font-weight: bold; color: #1e3a8a;">${doc.consecutivo || '000001'}</td>
        <td style="padding: 0.75rem;">${tipoBadge}</td>
        <td style="padding: 0.75rem; font-size: 0.75rem; color: #475569;">${doc.nit || 'N/A'}</td>
        <td style="padding: 0.75rem; font-weight: 600; color: #1e3a8a;">${doc.tercero}</td>
        <td style="padding: 0.75rem; font-weight: bold; color: #374151;">${doc.bodega}</td>
        <td style="padding: 0.75rem; font-size: 0.85rem;">${refTexto}</td>
        <td style="padding: 0.75rem; font-weight: bold; color: #0284c7;">${doc.cantTotal.toLocaleString('es-CO')}</td>
        <td style="padding: 0.75rem; color: #059669; font-weight: bold;">$${Number(doc.valTotal || 0).toLocaleString('es-CO')}</td>
        <td style="padding: 0.75rem; color: #6b7280; font-size: 0.75rem;">${doc.fecha ? new Date(doc.fecha).toLocaleString() : 'N/A'}</td>
        <td style="padding: 0.75rem; font-size: 0.75rem; color: #475569; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${doc.observaciones || ''}</td>
        <td style="padding: 0.75rem; text-align: center; white-space: nowrap;">${btnPdf}${btnCopiar}</td>
      </tr>
    `;
  });
  tabla.innerHTML = htmlRows;
};

// 4. CONSULTA POR RANGO DE FECHAS (DESDE / HASTA)
window.consultarPorRangoFechas = function() {
  const inicioStr = document.getElementById('filtro-fecha-inicio').value;
  const finStr = document.getElementById('filtro-fecha-fin').value;

  if(!inicioStr || !finStr) {
    alert("Por favor selecciona una Fecha Inicio y una Fecha Fin.");
    return;
  }

  const fInicio = new Date(inicioStr + 'T00:00:00');
  const fFin = new Date(finStr + 'T23:59:59');

  const filtrados = (window.todosLosRegistros || []).filter(item => {
    if (!item.fecha) return false;
    const fItem = new Date(item.fecha);
    return fItem >= fInicio && fItem <= fFin;
  });

  window.renderizarTablaKardex(filtrados);
};

window.restablecerFiltroFechas = function() {
  document.getElementById('filtro-fecha-inicio').value = '';
  document.getElementById('filtro-fecha-fin').value = '';
  document.getElementById('filtro-kardex').value = '';
  window.cargarInicialPorFechaMesActual();
};

window.cargarInicialPorFechaMesActual = function() {
  const ahora = new Date();
  const primerDiaMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

  const delMes = (window.todosLosRegistros || []).filter(item => {
    if (!item.fecha) return true;
    const fItem = new Date(item.fecha);
    return fItem >= primerDiaMes;
  });

  if (delMes.length > 0) {
    window.renderizarTablaKardex(delMes);
  } else {
    window.renderizarTablaKardex(window.todosLosRegistros || []);
  }
};

window.autocompletarTerceroPorNit = function(val) {
  const nitBuscado = String(val || '').trim();
  const match = (window.todosLosTerceros || []).find(t => String(t.nit || '').trim() === nitBuscado);
  if(match) {
    document.getElementById('doc-nombre-tercero').value = match.nombre;
    document.getElementById('doc-nit').value = match.nit;
  }
};

window.autocompletarNitPorNombre = function(val) {
  const nombreBuscado = String(val || '').trim().toLocaleLowerCase('es');
  const match = (window.todosLosTerceros || []).find(t => String(t.nombre || '').trim().toLocaleLowerCase('es') === nombreBuscado);
  if(match) {
    document.getElementById('doc-nit').value = match.nit;
    document.getElementById('doc-nombre-tercero').value = match.nombre;
  }
};

window.autocompletarItemRef = function(val) {
  const match = (window.todasLasReferencias || []).find(r => val.includes(r.codigo) || val.includes(r.nombre));
  if(match) {
    document.getElementById('item-referencia').value = `${match.codigo} - ${match.nombre}`;
    if(match.unidad) document.getElementById('item-unidad').value = match.unidad;
    if(match.precio) document.getElementById('item-val-unit').value = match.precio;
    calcularValorTotalItem();
  }
};

window.filtrarTablaKardex = function() {
  const q = document.getElementById('filtro-kardex').value.toLowerCase().trim();
  if(!q) {
    window.cargarInicialPorFechaMesActual();
    return;
  }

  const filtrados = (window.todosLosRegistros || []).filter(item => {
    const cons = (item.consecutivo || '').toLowerCase();
    const terc = (item.tercero || '').toLowerCase();
    const nit = (item.nit || '').toLowerCase();
    const ref = (item.referencia || '').toLowerCase();
    const obs = (item.observaciones || '').toLowerCase();
    return cons.includes(q) || terc.includes(q) || nit.includes(q) || ref.includes(q) || obs.includes(q);
  });

  window.renderizarTablaKardex(filtrados);
};

window.abrirModalInventario = function(esRecogida = false) {
  modoRecogida = esRecogida;
  itemsGrid = [];
  editIndex = -1;
  const m = document.getElementById('modal-inventario');
  m.classList.remove('hidden');
  m.style.display = 'flex';

  const numCons = Math.floor(100000 + Math.random() * 900000);
  document.getElementById('doc-consecutivo').value = (esRecogida ? "REC-" : "DOC-") + numCons;
  
  const ahora = new Date();
  ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
  document.getElementById('doc-fecha').value = ahora.toISOString().slice(0, 16);

  document.getElementById('doc-tipo').value = "16";
  document.getElementById('doc-bodega').value = "PA";
  ['doc-nit','doc-nombre-tercero','item-referencia','item-cantidad','item-val-unit','item-val-total','doc-observaciones'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.value = '';
  });
  document.getElementById('item-unidad').value = 'Kilos';
  cancelarEdicionGrid();
  renderizarGrid();

  document.getElementById('modal-titulo').textContent = esRecogida ? 'Registrar Recogida / Comprobante de Entrega' : 'Registrar Documento / Movimiento en Lote';
  document.getElementById('bloque-firma-recogida').classList.toggle('hidden', !esRecogida);
  document.getElementById('btn-guardar-kardex-std').classList.toggle('hidden', esRecogida);
  document.getElementById('btn-guardar-kardex-recogida').classList.toggle('hidden', !esRecogida);
  if (esRecogida) setTimeout(() => { if (typeof inicializarCanvasFirma === 'function') inicializarCanvasFirma(); }, 50);
};

window.cerrarModalInventario = function() {
  const m = document.getElementById('modal-inventario');
  m.classList.add('hidden');
  m.style.display = 'none';
  cancelarEdicionGrid();
};

window.calcularValorTotalItem = function() {
  const cant = Number(document.getElementById('item-cantidad').value) || 0;
  const unit = Number(document.getElementById('item-val-unit').value) || 0;
  const total = cant * unit;
  document.getElementById('item-val-total').value = total ? total.toFixed(2) : "";
};

window.agregarItemAlGrid = function() {
  const ref = document.getElementById('item-referencia').value;
  const unidad = document.getElementById('item-unidad').value;
  const cant = Number(document.getElementById('item-cantidad').value);
  const valUnit = Number(document.getElementById('item-val-unit').value);
  const valTotal = cant * valUnit;

  if(!ref || !cant || !valUnit) {
    alert("Por favor ingresa Referencia, Cantidad y Valor Unitario.");
    return;
  }

  if (editIndex >= 0) {
    itemsGrid[editIndex] = { referencia: ref, unidad: unidad, cantidad: cant, valUnit: valUnit, valor: valTotal };
    cancelarEdicionGrid();
  } else {
    itemsGrid.push({ referencia: ref, unidad: unidad, cantidad: cant, valUnit: valUnit, valor: valTotal });
  }

  document.getElementById('item-referencia').value = "";
  document.getElementById('item-cantidad').value = "";
  document.getElementById('item-val-unit').value = "";
  document.getElementById('item-val-total').value = "";
  renderizarGrid();
};

window.editarItemGrid = function(idx) {
  if (idx < 0 || idx >= itemsGrid.length) return;
  editIndex = idx;
  const item = itemsGrid[idx];

  document.getElementById('item-referencia').value = item.referencia;
  document.getElementById('item-unidad').value = item.unidad || 'Kilos';
  document.getElementById('item-cantidad').value = item.cantidad;
  document.getElementById('item-val-unit').value = item.valUnit;
  document.getElementById('item-val-total').value = item.valor.toFixed(2);

  document.getElementById('titulo-form-item').innerText = "EDITAR PRODUCTO DEL GRID";
  document.getElementById('btn-agregar-item').innerText = "Guardar Cambios del Ítem";
  document.getElementById('btn-agregar-item').style.backgroundColor = "#f59e0b";
  document.getElementById('btn-cancelar-edit').classList.remove('hidden');
};

window.cancelarEdicionGrid = function() {
  editIndex = -1;
  document.getElementById('item-referencia').value = "";
  document.getElementById('item-cantidad').value = "";
  document.getElementById('item-val-unit').value = "";
  document.getElementById('item-val-total').value = "";

  document.getElementById('titulo-form-item').innerText = "AGREGAR PRODUCTO AL GRID";
  document.getElementById('btn-agregar-item').innerText = "+ Agregar Ítem al Grid";
  document.getElementById('btn-agregar-item').style.backgroundColor = "#0284c7";
  document.getElementById('btn-cancelar-edit').classList.add('hidden');
};

function renderizarGrid() {
  const body = document.getElementById('grid-items-body');
  const cantSpan = document.getElementById('resumen-cant-items');
  const totalCantSpan = document.getElementById('resumen-total-cantidad');
  const totalKgSpan = document.getElementById('resumen-total-kilos');
  const valSpan = document.getElementById('resumen-valor-total');

  if(itemsGrid.length === 0) {
    body.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #9ca3af; padding: 1rem;">No hay ítems agregados al grid aún.</td></tr>`;
    cantSpan.innerText = "0";
    if(totalCantSpan) totalCantSpan.innerText = "0";
    if(totalKgSpan) totalKgSpan.innerText = "0.00 Kg";
    valSpan.innerText = "0";
    return;
  }

  let htmlGrid = "";
  let totalVal = 0;
  let totalCantidad = 0;
  let totalKilos = 0;

  itemsGrid.forEach((item, idx) => {
    totalVal += item.valor;
    totalCantidad += Number(item.cantidad || 0);

    const undLower = String(item.unidad || '').toLowerCase();
    if (undLower.includes('kilo') || undLower.includes('kg')) {
      totalKilos += Number(item.cantidad || 0);
    } else if (undLower.includes('gramo') || undLower.includes('gr')) {
      totalKilos += Number(item.cantidad || 0) / 1000;
    }

    htmlGrid += `
      <tr>
        <td style="padding: 0.5rem; font-weight: bold; text-align: center; color: #64748b;">${idx + 1}</td>
        <td style="padding: 0.5rem; font-weight: 600;">${item.referencia}</td>
        <td style="padding: 0.5rem; font-weight: bold;">${item.cantidad}</td>
        <td style="padding: 0.5rem; font-size: 0.75rem; color: #64748b;">${item.unidad}</td>
        <td style="padding: 0.5rem; color: #3b82f6;">$${item.valUnit.toLocaleString('es-CO')}</td>
        <td style="padding: 0.5rem; color: #059669; font-weight: bold;">$${item.valor.toLocaleString('es-CO')}</td>
        <td style="padding: 0.5rem; text-align: center; white-space: nowrap;">
          <button onclick="editarItemGrid(${idx})" style="color: #f59e0b; border: none; background: none; cursor: pointer; margin-right: 0.4rem;" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
          <button onclick="itemsGrid.splice(${idx},1); if(editIndex===${idx}) cancelarEdicionGrid(); renderizarGrid();" style="color: #dc2626; border: none; background: none; cursor: pointer;" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `;
  });

  body.innerHTML = htmlGrid;
  cantSpan.innerText = itemsGrid.length;
  if(totalCantSpan) totalCantSpan.innerText = totalCantidad.toLocaleString('es-CO');
  if(totalKgSpan) totalKgSpan.innerText = `${totalKilos.toFixed(2)} Kg`;
  valSpan.innerText = totalVal.toLocaleString('es-CO');
}

window.getItemsGrid = function() { return itemsGrid; };
