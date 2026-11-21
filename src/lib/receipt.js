import { formatCLP } from './storage.js';

function safeName(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function receiptData(purchase, user) {
  const products = Array.isArray(purchase?.productos) ? purchase.productos : [];
  return {
    id: purchase?.id ?? 'N/D',
    date: purchase?.fecha ?? new Date().toISOString().slice(0, 10),
    status: purchase?.estado ?? 'Registrada',
    customerName: user?.nombre || purchase?.usuarioNombre || 'Cliente Yakarta',
    customerEmail: user?.email || purchase?.usuarioEmail || '',
    address: purchase?.direccion || {},
    products,
    total: Number(purchase?.total || 0),
  };
}

function wrapText(value, maxLength = 78) {
  const words = safeName(value).split(/\s+/).filter(Boolean);
  const result = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      result.push(current);
      current = word;
    } else current = next;
  }
  if (current) result.push(current);
  return result.length ? result : [''];
}

function createPdfLines(data) {
  const lines = [
    { text: 'YAKARTA', size: 22, bold: true },
    { text: 'BOLETA DE COMPRA', size: 13, bold: true },
    { text: `Pedido: #${data.id}` },
    { text: `Fecha: ${data.date}` },
    { text: `Estado: ${data.status}` },
    { text: '' },
    { text: 'DATOS DEL CLIENTE', bold: true },
    ...wrapText(`Nombre: ${data.customerName}`).map((text) => ({ text })),
    ...wrapText(`Correo: ${data.customerEmail}`).map((text) => ({ text })),
    { text: '' },
    { text: 'DIRECCION DE DESPACHO', bold: true },
    ...wrapText(`Nombre: ${data.address.nombre || 'No registrada'}`).map((text) => ({ text })),
    ...wrapText(`Direccion: ${data.address.calle || 'No registrada'}`).map((text) => ({ text })),
    ...wrapText(`Comuna / ciudad: ${data.address.comuna || 'No registrada'}`).map((text) => ({ text })),
    ...wrapText(`Telefono: ${data.address.telefono || 'No registrado'}`).map((text) => ({ text })),
    { text: '' },
    { text: 'DETALLE DE LA COMPRA', bold: true },
    { text: 'Producto | Cantidad | Precio unitario | Subtotal', bold: true },
  ];

  data.products.forEach((product) => {
    const nameLines = wrapText(product.nombre || 'Producto', 78);
    nameLines.forEach((name) => lines.push({ text: name }));
    const quantity = Number(product.cantidad || 0);
    const price = Number(product.precio || 0);
    lines.push({ text: `  ${quantity} x ${formatCLP(price)} = ${formatCLP(price * quantity)}` });
  });

  lines.push({ text: '' }, { text: `TOTAL PAGADO: ${formatCLP(data.total)}`, size: 15, bold: true },
    { text: '' }, { text: 'Gracias por comprar en Yakarta.' });
  return lines;
}

function pdfEscape(value) {
  return safeName(value).replace(/[^\x20-\x7E]/g, '?')
    .replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildPdf(lines) {
  const pages = [];
  for (let index = 0; index < lines.length; index += 52) pages.push(lines.slice(index, index + 52));
  if (!pages.length) pages.push([]);

  const objects = [];
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
  const pageIds = [];

  pages.forEach((pageLines, pageIndex) => {
    const pageId = 5 + pageIndex * 2;
    const contentId = pageId + 1;
    pageIds.push(`${pageId} 0 R`);

    let y = 790;
    const commands = pageLines.map((line) => {
      const size = line.size || 10;
      const font = line.bold ? 'F2' : 'F1';
      const command = `BT /${font} ${size} Tf 48 ${y} Td (${pdfEscape(line.text)}) Tj ET`;
      y -= Math.max(13, size + 3);
      return command;
    }).join('\n');

    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`;
  });

  objects[2] = `<< /Type /Pages /Kids [${pageIds.join(' ')}] /Count ${pages.length} >>`;
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

export function downloadReceiptPdf(purchase, user) {
  const data = receiptData(purchase, user);
  const blob = buildPdf(createPdfLines(data));
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `boleta-yakarta-${data.id}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function printReceipt(purchase, user) {
  const data = receiptData(purchase, user);
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.alert('El navegador bloqueó la ventana de impresión. Habilita las ventanas emergentes para este sitio.');
    return;
  }

  const productRows = data.products.map((product) => {
    const quantity = Number(product.cantidad || 0);
    const price = Number(product.precio || 0);
    return `<tr><td>${escapeHtml(product.nombre || 'Producto')}</td><td>${quantity}</td><td>${escapeHtml(formatCLP(price))}</td><td>${escapeHtml(formatCLP(price * quantity))}</td></tr>`;
  }).join('');

  printWindow.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Boleta Yakarta #${escapeHtml(data.id)}</title>
    <style>
      body{font-family:Arial,sans-serif;color:#171717;margin:32px;font-size:13px}h1{margin:0 0 4px;font-size:26px}h2{font-size:16px;margin:24px 0 8px;border-bottom:1px solid #bbb;padding-bottom:6px}.muted{color:#555}.meta{display:flex;gap:24px;flex-wrap:wrap;margin:12px 0 20px}.columns{display:grid;grid-template-columns:1fr 1fr;gap:24px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{padding:9px 7px;border-bottom:1px solid #ddd;text-align:left}th{background:#f1f1f1}.total{text-align:right;font-size:20px;font-weight:bold;margin-top:22px}.thanks{text-align:center;margin-top:42px;color:#555}@media print{body{margin:12mm}.no-print{display:none}}
    </style></head><body>
    <h1>YAKARTA</h1><div class="muted">Boleta de compra</div>
    <div class="meta"><span><strong>Pedido:</strong> #${escapeHtml(data.id)}</span><span><strong>Fecha:</strong> ${escapeHtml(data.date)}</span><span><strong>Estado:</strong> ${escapeHtml(data.status)}</span></div>
    <div class="columns"><section><h2>Cliente</h2><div>${escapeHtml(data.customerName)}</div><div>${escapeHtml(data.customerEmail)}</div></section>
    <section><h2>Despacho</h2><div>${escapeHtml(data.address.nombre || 'No registrada')}</div><div>${escapeHtml(data.address.calle || 'No registrada')}</div><div>${escapeHtml(data.address.comuna || '')}</div><div>${escapeHtml(data.address.telefono || '')}</div></section></div>
    <h2>Detalle de la compra</h2><table><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead><tbody>${productRows}</tbody></table>
    <div class="total">Total pagado: ${escapeHtml(formatCLP(data.total))}</div><div class="thanks">Gracias por comprar en Yakarta.</div>
    <script>window.addEventListener('load',()=>window.print());</script></body></html>`);
  printWindow.document.close();
  printWindow.focus();
}
