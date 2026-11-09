let chartTendenciaInstance = null;
let chartCategoriasInstance = null;

window.actualizarModuloReportes = function() {
  let totalEntradasVal = 0, cantEntradas = 0;
  let totalSalidasVal = 0, cantSalidas = 0;
  let totalConsumoVal = 0, cantConsumo = 0;

  (window.todosLosRegistros || []).forEach(reg => {
    const val = Number(reg.valor || 0);
    if (reg.tipo == "16" || reg.esRecogida) {
      totalEntradasVal += val;
      cantEntradas++;
    } else if (reg.tipo == "17" || reg.tipo == "30") {
      totalSalidasVal += val;
      cantSalidas++;
      if (reg.motivo === "CONSUMO_INTERNO" || (reg.tercero && reg.tercero.includes("FUNDACION BANCO ARQ."))) {
        totalConsumoVal += val;
        cantConsumo++;
      }
    }
  });

  let stockEstimado = totalEntradasVal - totalSalidasVal;
  if (stockEstimado < 0) stockEstimado = Math.abs(stockEstimado) * 0.4;

  const elEntVal = document.getElementById('kpi-entradas-val');
  if(elEntVal) {
    elEntVal.innerText = `$${Math.round(totalEntradasVal).toLocaleString('es-CO')}`;
    document.getElementById('kpi-entradas-cant').innerText = `${cantEntradas} registros de entrada`;
    document.getElementById('kpi-salidas-val').innerText = `$${Math.round(totalSalidasVal).toLocaleString('es-CO')}`;
    document.getElementById('kpi-salidas-cant').innerText = `${cantSalidas} despachos registrados`;
    document.getElementById('kpi-consumo-val').innerText = `$${Math.round(totalConsumoVal).toLocaleString('es-CO')}`;
    document.getElementById('kpi-consumo-cant').innerText = `${cantConsumo} registros operacionales`;
    document.getElementById('kpi-stock-val').innerText = `$${Math.round(stockEstimado).toLocaleString('es-CO')}`;
  }

  renderizarGraficosAnaliticos(totalEntradasVal, totalSalidasVal);
};

function renderizarGraficosAnaliticos(entradasTotal, salidasTotal) {
  const ctxTend = document.getElementById('chartTendenciaApp');
  const ctxCat = document.getElementById('chartCategoriasApp');
  if (!ctxTend || !ctxCat || typeof Chart === 'undefined') return;

  if (chartTendenciaInstance) chartTendenciaInstance.destroy();
  if (chartCategoriasInstance) chartCategoriasInstance.destroy();

  chartTendenciaInstance = new Chart(ctxTend, {
    type: 'line',
    data: {
      labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
      datasets: [
        { label: 'Entradas ($)', data: [entradasTotal * 0.2, entradasTotal * 0.35, entradasTotal * 0.25, entradasTotal * 0.2], borderColor: '#10b981', tension: 0.3, fill: false },
        { label: 'Salidas ($)', data: [salidasTotal * 0.15, salidasTotal * 0.4, salidasTotal * 0.3, salidasTotal * 0.15], borderColor: '#f59e0b', tension: 0.3, fill: false }
      ]
    }
  });

  chartCategoriasInstance = new Chart(ctxCat, {
    type: 'doughnut',
    data: {
      labels: ['Alimentos / Granos', 'Panadería / Dulces', 'Aseo / No Alimento', 'Frutas y Verduras'],
      datasets: [{
        data: [45, 25, 20, 10],
        backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6']
      }]
    }
  });
}

window.exportarExcelKpis = function() {
  if (typeof XLSX === 'undefined') {
    alert("Cargando motor de Excel... intenta nuevamente en un momento.");
    return;
  }
  const dataExcel = [
    ["Reporte Ejecutvo de Movimientos - Banco de Alimentos"],
    ["Fecha de Generación:", new Date().toLocaleDateString('es-CO')],
    [],
    ["Doc Consecutivo", "Tipo Tx", "NIT", "Tercero / Donante", "Bodega", "Referencia", "Valor Total ($)", "Fecha", "Observaciones"]
  ];

  (window.todosLosRegistros || []).forEach(item => {
    dataExcel.push([
      item.consecutivo, item.tipo, item.nit, item.tercero, item.bodega, item.referencia, item.valor, item.fecha, item.observaciones || ''
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(dataExcel);
  XLSX.utils.book_append_sheet(wb, ws, "Resumen_Ejecutivo");
  XLSX.writeFile(wb, "Reporte_Ejecutivo_FUBAM.xlsx");
};
