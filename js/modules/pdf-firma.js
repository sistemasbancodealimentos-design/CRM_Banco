window.inicializarCanvasFirma = function() {
  const canvas = document.getElementById('canvas-firma');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  let dibujando = false;
  
  const punto = (ev) => {
    const rect = canvas.getBoundingClientRect();
    return { x: (ev.clientX - rect.left) * canvas.width / rect.width,
             y: (ev.clientY - rect.top) * canvas.height / rect.height };
  };
  
  if (canvas.dataset.firmaEventos === '1') {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.dataset.firmaHecha = '0';
    return;
  }
  
  canvas.dataset.firmaEventos = '1';
  canvas.addEventListener('pointerdown', (ev) => {
    ev.preventDefault(); dibujando = true;
    canvas.setPointerCapture?.(ev.pointerId);
    const p = punto(ev); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 0.1, p.y + 0.1); ctx.stroke();
    canvas.dataset.firmaHecha = '1';
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!dibujando) return;
    ev.preventDefault(); const p = punto(ev); ctx.lineTo(p.x, p.y); ctx.stroke();
  });
  const terminar = () => { dibujando = false; ctx.beginPath(); };
  canvas.addEventListener('pointerup', terminar);
  canvas.addEventListener('pointercancel', terminar);
  canvas.addEventListener('pointerleave', (ev) => { if (ev.buttons === 0) terminar(); });
  canvas.dataset.firmaHecha = '0';
};

window.limpiarFirma = function() {
  const canvas = document.getElementById('canvas-firma');
  if (!canvas) return;
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  canvas.dataset.firmaHecha = '0';
};

window.generarPDFComprobante = function(consecutivo, tipo, bodega, nit, tercero, firmaDataURL, itemsArr, fechaDoc, obs) {
  try {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("La librería jsPDF aún se está cargando. Intenta de nuevo.");
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const listaItems = itemsArr || [];

    doc.setFillColor(11, 98, 164);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("BANCO DE ALIMENTOS DE MEDELLÍN", 14, 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text("Comprobante Oficial de Recogida / Entrada de Alimentos", 14, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`N° ${consecutivo}`, 155, 16);

    const strFecha = fechaDoc ? new Date(fechaDoc).toLocaleString('es-CO') : new Date().toLocaleString('es-CO');
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.text(`Fecha: ${strFecha}`, 14, 38);
    doc.text(`Tercero / Donante: ${tercero}`, 14, 45);
    doc.text(`NIT / Cédula: ${nit || 'N/A'}`, 14, 52);
    doc.text(`Bodega Destino: ${bodega}`, 130, 45);
    doc.text(`Tipo Transacción: ${tipo}`, 130, 52);
    if(obs) {
      doc.setFont('helvetica', 'italic');
      doc.text(`Observaciones: ${obs}`, 14, 58);
    }

    const tableData = listaItems.map((item, idx) => [
      idx + 1,
      item.referencia,
      item.cantidad,
      item.unidad || 'Kg',
      `$${Number(item.valUnit || 0).toLocaleString('es-CO')}`,
      `$${Number(item.valor || 0).toLocaleString('es-CO')}`
    ]);

    let totalVal = listaItems.reduce((sum, item) => sum + Number(item.valor || 0), 0);

    if (doc.autoTable) {
      doc.autoTable({
        startY: obs ? 62 : 57,
        head: [['#', 'Referencia / Insumo', 'Cantidad', 'Unidad', 'Val. Unitario', 'Val. Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [2, 132, 199] },
        foot: [['', '', '', '', 'TOTAL:', `$${totalVal.toLocaleString('es-CO')}`]],
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' }
      });
    }

    let yFirma = doc.lastAutoTable ? doc.lastAutoTable.finalY + 18 : 115;
    if (yFirma > 250) { doc.addPage(); yFirma = 30; }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Firma de quien entrega / recibe:', 14, yFirma);
    if (firmaDataURL && firmaDataURL.length > 1000) {
      doc.addImage(firmaDataURL, 'PNG', 14, yFirma + 3, 65, 22);
    } else {
      doc.setDrawColor(148, 163, 184);
      doc.line(14, yFirma + 27, 95, yFirma + 27);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Documento generado digitalmente por el ERP FUBAM.', 14, yFirma + 33);

    doc.save(`${consecutivo}_Recogida_FUBAM.pdf`);

  } catch (err) {
    alert("Error al generar el PDF: " + err.message);
  }
};
