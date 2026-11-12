window.mostrarSeccion = function(seccion) {
  const secciones = ['dashboard', 'reportes', 'inventario', 'referencias', 'terceros', 'crm', 'despacho', 'recepcion'];
  secciones.forEach(sec => {
    const el = document.getElementById('seccion-' + sec);
    if (el) el.classList.add('hidden');
  });
  const objetivo = document.getElementById('seccion-' + seccion);
  if (objetivo) objetivo.classList.remove('hidden');

  if (seccion === 'reportes' && typeof window.actualizarModuloReportes === 'function') {
    window.actualizarModuloReportes();
  }
};

window.popularDatalistsGlobales = function() {
  const datalistNit = document.getElementById('lista-terceros-nit');
  const datalistNombre = document.getElementById('lista-terceros-nombre');
  const datalistRef = document.getElementById('lista-referencias-global');

  if(window.todosLosTerceros) {
    if(datalistNit) {
      let htmlNit = "";
      window.todosLosTerceros.forEach(t => {
        htmlNit += `<option value="${String(t.nit || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">${t.nombre || ''} (${t.tipo || ''})</option>`;
      });
      datalistNit.innerHTML = htmlNit;
    }
    if(datalistNombre) {
      let htmlNombre = "";
      window.todosLosTerceros.forEach(t => {
        htmlNombre += `<option value="${String(t.nombre || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">${t.nit || ''} (${t.tipo || ''})</option>`;
      });
      datalistNombre.innerHTML = htmlNombre;
    }
  }

  if(datalistRef && window.todasLasReferencias) {
    let htmlRef = "";
    window.todasLasReferencias.forEach(r => {
      htmlRef += `<option value="${r.codigo} - ${r.nombre}">${r.nombre} (${r.unidad})</option>`;
    });
    datalistRef.innerHTML = htmlRef;
  }
};

window.renderizarTablaReferenciasUI = function() {
  const tablaRef = document.getElementById('tabla-referencias-body');
  if(!tablaRef || !window.todasLasReferencias) return;

  let htmlStr = "";
  window.todasLasReferencias.forEach(r => {
    const codEsc = (r.codigo || '').replace(/'/g, "\'");
    htmlStr += `
      <tr>
        <td style="font-weight: bold; color: #15803d;">${r.codigo}</td>
        <td style="font-weight: 600;">${r.nombre}</td>
        <td><span style="background: #f0fdf4; color: #166534; padding: 0.2rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem;">General</span></td>
        <td>${r.unidad}</td>
        <td style="color: #0284c7; font-weight: bold;">$${Number(r.precio || 0).toLocaleString('es-CO')}</td>
        <td style="text-align: center;"><span style="color: #16a34a; font-weight: bold;">● Activo</span></td>
        <td style="text-align: center;">
          <button onclick="abrirModalEditarReferencia('${codEsc}')" style="background: #f59e0b; color: white; border: none; padding: 0.25rem 0.6rem; border-radius: 0.25rem; font-weight: bold; cursor: pointer; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.3rem;">
            <i class="fa-solid fa-pen-to-square"></i> Editar
          </button>
        </td>
      </tr>
    `;
  });
  tablaRef.innerHTML = htmlStr;
};

window.renderizarTablaTercerosUI = function() {
  const tablaTerc = document.getElementById('tabla-terceros-body');
  if(!tablaTerc || !window.todosLosTerceros) return;

  let htmlStr = "";
  window.todosLosTerceros.forEach(t => {
    const badgeTipo = t.tipo === 'Donante' ? `<span style="background: #fef3c7; color: #b45309; padding: 0.2rem 0.5rem; border-radius: 0.25rem; font-weight: bold;">Donante</span>`
                    : `<span style="background: #f3e8ff; color: #6b21a8; padding: 0.2rem 0.5rem; border-radius: 0.25rem; font-weight: bold;">${t.tipo || 'Beneficiario'}</span>`;

    const nitEsc = (t.nit || '').replace(/'/g, "\'");
    htmlStr += `
      <tr>
        <td style="font-weight: bold; color: #1e3a8a;">${t.nit}</td>
        <td style="font-weight: 600; color: #0f172a;">${t.nombre}</td>
        <td>${badgeTipo}</td>
        <td>${t.telefono || 'N/A'}</td>
        <td>Medellín</td>
        <td style="text-align: center;">
          <button onclick="abrirModalEditarTercero('${nitEsc}')" style="background: #f59e0b; color: white; border: none; padding: 0.25rem 0.6rem; border-radius: 0.25rem; font-weight: bold; cursor: pointer; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.3rem;">
            <i class="fa-solid fa-pen-to-square"></i> Editar
          </button>
        </td>
      </tr>
    `;
  });
  tablaTerc.innerHTML = htmlStr;
};

// Crear y Editar Referencias / Terceros sin refresco ni salir de la sesión
window.guardarNuevaReferenciaDirecta = function(e) {
  if (e) e.preventDefault();
  const codigo = document.getElementById('ref-codigo').value.trim();
  const nombre = document.getElementById('ref-nombre').value.trim();
  const unidad = document.getElementById('ref-unidad').value;
  const precio = parseFloat(document.getElementById('ref-precio').value) || 0;

  if (!codigo || !nombre) return;

  const nuevaRef = { codigo: codigo, nombre: nombre, unidad: unidad, precio: precio };
  window.todasLasReferencias.unshift(nuevaRef);

  window.renderizarTablaReferenciasUI();
  window.popularDatalistsGlobales();

  document.getElementById('form-nueva-referencia').reset();
  cerrarModalNuevaReferencia();
  alert("✅ Nueva referencia agregada correctamente al catálogo.");
};

window.guardarNuevoTerceroDirecto = function(e) {
  if (e) e.preventDefault();
  const nit = document.getElementById('tercero-nit').value.trim();
  const nombre = document.getElementById('tercero-nombre').value.trim();
  const tipo = document.getElementById('tercero-tipo').value;
  const telefono = document.getElementById('tercero-telefono').value.trim();

  if (!nit || !nombre) return;

  const nuevoTerc = { nit: nit, nombre: nombre, tipo: tipo, telefono: telefono || '3000000000' };
  window.todosLosTerceros.unshift(nuevoTerc);

  window.renderizarTablaTercerosUI();
  window.popularDatalistsGlobales();

  document.getElementById('form-nuevo-tercero').reset();
  cerrarModalNuevoTercero();
  alert("✅ Nuevo tercero agregado correctamente al directorio.");
};

window.abrirModalEditarReferencia = function(codigo) {
  const ref = window.todasLasReferencias.find(r => String(r.codigo) === String(codigo));
  if(!ref) return;

  document.getElementById('edit-ref-codigo-original').value = ref.codigo;
  document.getElementById('edit-ref-codigo').value = ref.codigo;
  document.getElementById('edit-ref-nombre').value = ref.nombre || '';
  document.getElementById('edit-ref-precio').value = ref.precio || 0;
  document.getElementById('edit-ref-unidad').value = ref.unidad || 'Kilos';

  document.getElementById('modal-editar-referencia').classList.remove('hidden');
};

window.cerrarModalEditarReferencia = function() {
  document.getElementById('modal-editar-referencia').classList.add('hidden');
};

window.guardarEdicionReferencia = function(e) {
  e.preventDefault();
  const codigo = document.getElementById('edit-ref-codigo-original').value;
  const ref = window.todasLasReferencias.find(r => String(r.codigo) === String(codigo));

  if(ref) {
    ref.nombre = document.getElementById('edit-ref-nombre').value.trim();
    ref.precio = parseFloat(document.getElementById('edit-ref-precio').value) || 0;
    ref.unidad = document.getElementById('edit-ref-unidad').value;

    window.renderizarTablaReferenciasUI();
    window.popularDatalistsGlobales();
    cerrarModalEditarReferencia();
    alert("✅ Referencia y precio actualizados correctamente.");
  }
};

window.abrirModalEditarTercero = function(nit) {
  const terc = window.todosLosTerceros.find(t => String(t.nit) === String(nit));
  if(!terc) return;

  document.getElementById('edit-tercero-nit-original').value = terc.nit;
  document.getElementById('edit-tercero-nit').value = terc.nit;
  document.getElementById('edit-tercero-nombre').value = terc.nombre || '';
  document.getElementById('edit-tercero-tipo').value = terc.tipo || 'Donante';
  document.getElementById('edit-tercero-telefono').value = terc.telefono || '';

  document.getElementById('modal-editar-tercero').classList.remove('hidden');
};

window.cerrarModalEditarTercero = function() {
  document.getElementById('modal-editar-tercero').classList.add('hidden');
};

window.guardarEdicionTercero = function(e) {
  e.preventDefault();
  const nit = document.getElementById('edit-tercero-nit-original').value;
  const terc = window.todosLosTerceros.find(t => String(t.nit) === String(nit));

  if(terc) {
    terc.nombre = document.getElementById('edit-tercero-nombre').value.trim();
    terc.tipo = document.getElementById('edit-tercero-tipo').value;
    terc.telefono = document.getElementById('edit-tercero-telefono').value.trim();

    window.renderizarTablaTercerosUI();
    window.popularDatalistsGlobales();
    cerrarModalEditarTercero();
    alert("✅ Tercero / Razón Social actualizado correctamente.");
  }
};

window.abrirModalNuevaReferencia = function() { document.getElementById('modal-referencia').classList.remove('hidden'); }
window.cerrarModalNuevaReferencia = function() { document.getElementById('modal-referencia').classList.add('hidden'); }
window.abrirModalNuevoTercero = function() { document.getElementById('modal-tercero').classList.remove('hidden'); }
window.cerrarModalNuevoTercero = function() { document.getElementById('modal-tercero').classList.add('hidden'); }
