import { formatCLP, resolveProductImage } from './storage.js';

const PAGE_WIDTH = 1275;
const PAGE_HEIGHT = 1800;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function receiptImageUrl(value) {
  if (!value || typeof window === 'undefined') return '';
  const resolved = resolveProductImage(value, '');
  if (!resolved) return '';
  try { return new URL(resolved, window.location.origin).href; } catch { return ''; }
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

function loadImage(src) {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function wrapCanvasText(context, value, x, y, maxWidth, lineHeight, maxLines = 2) {
  const words = String(value ?? '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && context.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = word;
    } else current = candidate;
  }
  if (current) lines.push(current);
  lines.slice(0, maxLines).forEach((line, index) => {
    const visible = index === maxLines - 1 && lines.length > maxLines ? `${line.slice(0, 38)}…` : line;
    context.fillText(visible, x, y + (index * lineHeight));
  });
}

function drawImageContain(context, image, x, y, width, height) {
  context.fillStyle = '#f2f2f2';
  context.fillRect(x, y, width, height);
  context.strokeStyle = '#d1d5db';
  context.lineWidth = 2;
  context.strokeRect(x, y, width, height);
  if (!image) {
    context.fillStyle = '#777';
    context.font = 'bold 18px Arial';
    context.textAlign = 'center';
    context.fillText('YAKARTA', x + width / 2, y + height / 2);
    context.textAlign = 'left';
    return;
  }
  const scale = Math.min((width - 8) / image.naturalWidth, (height - 8) / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

async function renderReceiptPages(data) {
  const logo = await loadImage(`${window.location.origin}/img/logofeoyakarta.png`);
  const products = await Promise.all(data.products.map(async (product) => ({
    ...product,
    _receiptImage: await loadImage(receiptImageUrl(product.imagen)),
  })));
  const groups = [];
  groups.push(products.slice(0, 8));
  for (let index = 8; index < products.length; index += 9) groups.push(products.slice(index, index + 9));
  if (groups.length === 0) groups.push([]);

  return groups.map((group, pageIndex) => {
    const canvas = document.createElement('canvas');
    canvas.width = PAGE_WIDTH;
    canvas.height = PAGE_HEIGHT;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    context.textBaseline = 'top';
    context.fillStyle = '#171717';
    context.textAlign = 'center';

    if (logo) {
      const logoSize = pageIndex === 0 ? 108 : 78;
      context.drawImage(logo, (PAGE_WIDTH - logoSize) / 2, pageIndex === 0 ? 28 : 18, logoSize, logoSize);
    } else {
      context.font = 'bold 48px Arial';
      context.fillText('YAKARTA', PAGE_WIDTH / 2, 90);
    }

    const titleY = pageIndex === 0 ? 158 : 112;
    context.font = 'bold 34px Arial';
    context.fillText('BOLETA DE COMPRA', PAGE_WIDTH / 2, titleY);
    context.textAlign = 'left';
    context.font = '22px Arial';
    context.fillStyle = '#333333';

    if (pageIndex === 0) {
      context.fillText(`Pedido: #${data.id}`, 85, 222);
      context.fillText(`Fecha: ${data.date}`, 440, 222);
      context.fillText(`Estado: ${data.status}`, 820, 222);
      context.strokeStyle = '#b8b8b8';
      context.beginPath(); context.moveTo(85, 260); context.lineTo(1190, 260); context.stroke();

      context.font = 'bold 24px Arial';
      context.fillStyle = '#111111';
      context.fillText('DATOS DEL CLIENTE', 85, 292);
      context.fillText('DIRECCIÓN DE DESPACHO', 655, 292);
      context.font = '21px Arial';
      context.fillStyle = '#333333';
      wrapCanvasText(context, `Nombre: ${data.customerName}`, 85, 335, 510, 27, 2);
      wrapCanvasText(context, `Correo: ${data.customerEmail || 'No registrado'}`, 85, 400, 510, 27, 2);
      wrapCanvasText(context, `Nombre: ${data.address.nombre || 'No registrada'}`, 655, 335, 520, 27, 2);
      wrapCanvasText(context, `Dirección: ${data.address.calle || 'No registrada'}`, 655, 370, 520, 27, 2);
      wrapCanvasText(context, `Comuna: ${data.address.comuna || 'No registrada'}`, 655, 405, 520, 27, 2);
      wrapCanvasText(context, `Teléfono: ${data.address.telefono || 'No registrado'}`, 655, 440, 520, 27, 2);
    } else {
      context.font = 'bold 24px Arial';
      context.fillText(`Pedido #${data.id} · Detalle de compra (continuación)`, 85, 190);
    }

    const headingY = pageIndex === 0 ? 485 : 245;
    const rowStart = pageIndex === 0 ? 535 : 295;
    const rowHeight = 120;
    context.fillStyle = '#202020';
    context.fillRect(70, headingY - 8, 1135, 48);
    context.fillStyle = '#ffffff';
    context.font = 'bold 20px Arial';
    context.fillText('JUEGO', 205, headingY + 4);
    context.textAlign = 'right';
    context.fillText('CANT.', 850, headingY + 4);
    context.fillText('PRECIO UNIT.', 1030, headingY + 4);
    context.fillText('SUBTOTAL', 1180, headingY + 4);
    context.textAlign = 'left';

    group.forEach((product, index) => {
      const y = rowStart + index * rowHeight;
      const quantity = Number(product.cantidad || 0);
      const price = Number(product.precio || 0);
      drawImageContain(context, product._receiptImage, 88, y + 7, 96, 96);
      context.fillStyle = '#171717';
      context.font = 'bold 22px Arial';
      wrapCanvasText(context, product.nombre || 'Producto', 205, y + 12, 590, 27, 2);
      context.font = '19px Arial';
      context.fillStyle = '#555555';
      context.fillText(`Cantidad: ${quantity}`, 205, y + 72);
      context.textAlign = 'right';
      context.fillStyle = '#222222';
      context.fillText(String(quantity), 850, y + 40);
      context.fillText(formatCLP(price), 1030, y + 40);
      context.font = 'bold 19px Arial';
      context.fillText(formatCLP(price * quantity), 1180, y + 40);
      context.textAlign = 'left';
      context.strokeStyle = '#dddddd';
      context.beginPath(); context.moveTo(70, y + 118); context.lineTo(1205, y + 118); context.stroke();
    });

    const afterRows = rowStart + group.length * rowHeight + 22;
    const isLastPage = pageIndex === groups.length - 1;
    context.fillStyle = '#333333';
    context.font = '20px Arial';
    if (!isLastPage) {
      context.fillText('Continúa en la página siguiente…', 85, Math.min(afterRows, 1660));
    } else {
      context.strokeStyle = '#999999';
      context.beginPath(); context.moveTo(650, afterRows + 2); context.lineTo(1205, afterRows + 2); context.stroke();
      context.textAlign = 'right';
      context.font = 'bold 32px Arial';
      context.fillStyle = '#111111';
      context.fillText(`TOTAL PAGADO: ${formatCLP(data.total)}`, 1205, afterRows + 28);
      context.textAlign = 'center';
      context.font = '22px Arial';
      context.fillStyle = '#555555';
      context.fillText('Gracias por comprar en Yakarta.', PAGE_WIDTH / 2, Math.min(afterRows + 105, 1710));
      context.textAlign = 'left';
    }
    context.font = '16px Arial';
    context.fillStyle = '#777777';
    context.textAlign = 'center';
    context.fillText(`Yakarta · Boleta #${data.id} · Página ${pageIndex + 1} de ${groups.length}`, PAGE_WIDTH / 2, 1745);
    context.textAlign = 'left';
    return canvas;
  });
}

function concatBytes(parts) {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(size);
  let offset = 0;
  parts.forEach((part) => { result.set(part, offset); offset += part.length; });
  return result;
}

async function canvasToJpeg(canvas) {
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error('No se pudo generar la imagen de la boleta.')), 'image/jpeg', 0.92);
  });
  return new Uint8Array(await blob.arrayBuffer());
}

function buildImagePdf(jpegPages) {
  const encoder = new TextEncoder();
  const ascii = (value) => encoder.encode(value);
  const pageCount = jpegPages.length;
  const objectCount = 2 + (pageCount * 3);
  const objects = new Map();
  objects.set(1, ascii('<< /Type /Catalog /Pages 2 0 R >>'));
  const pageRefs = [];

  jpegPages.forEach((jpeg, index) => {
    const pageId = 3 + (index * 3);
    const imageId = pageId + 1;
    const contentId = pageId + 2;
    pageRefs.push(`${pageId} 0 R`);
    objects.set(pageId, ascii(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`));
    objects.set(imageId, [
      ascii(`<< /Type /XObject /Subtype /Image /Width ${PAGE_WIDTH} /Height ${PAGE_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`),
      jpeg,
      ascii('\nendstream'),
    ]);
    const content = ascii('q\n595 0 0 842 0 0 cm\n/Im0 Do\nQ');
    objects.set(contentId, [ascii(`<< /Length ${content.length} >>\nstream\n`), content, ascii('\nendstream')]);
  });
  objects.set(2, ascii(`<< /Type /Pages /Kids [${pageRefs.join(' ')}] /Count ${pageCount} >>`));

  const chunks = [];
  let offset = 0;
  const push = (bytes) => { chunks.push(bytes); offset += bytes.length; };
  push(ascii('%PDF-1.4\n%YakartaReceipt\n'));
  const offsets = new Array(objectCount + 1).fill(0);
  for (let id = 1; id <= objectCount; id += 1) {
    offsets[id] = offset;
    push(ascii(`${id} 0 obj\n`));
    const body = objects.get(id);
    (Array.isArray(body) ? body : [body]).forEach(push);
    push(ascii('\nendobj\n'));
  }
  const xrefOffset = offset;
  let xref = `xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= objectCount; id += 1) xref += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  xref += `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  push(ascii(xref));
  return new Blob([concatBytes(chunks)], { type: 'application/pdf' });
}

export async function createReceiptPdf(purchase, user) {
  const data = receiptData(purchase, user);
  const pages = await renderReceiptPages(data);
  const jpegPages = await Promise.all(pages.map(canvasToJpeg));
  return buildImagePdf(jpegPages);
}

export async function downloadReceiptPdf(purchase, user) {
  const data = receiptData(purchase, user);
  const blob = await createReceiptPdf(purchase, user);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `boleta-yakarta-${data.id}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 3000);
  return blob;
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
    const image = receiptImageUrl(product.imagen);
    return `<tr><td class="product-cell"><img class="thumb" src="${escapeHtml(image)}" alt="${escapeHtml(product.nombre || 'Juego')}" /><span>${escapeHtml(product.nombre || 'Producto')}</span></td><td>${quantity}</td><td>${escapeHtml(formatCLP(price))}</td><td>${escapeHtml(formatCLP(price * quantity))}</td></tr>`;
  }).join('');
  const logo = `${window.location.origin}/img/logofeoyakarta.png`;

  printWindow.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Boleta Yakarta #${escapeHtml(data.id)}</title>
    <style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#171717;margin:32px;font-size:13px}.receipt-logo{display:block;width:76px;height:76px;max-width:76px;max-height:76px;object-fit:contain;margin:0 auto 8px}h1{text-align:center;margin:0 0 4px;font-size:20px;letter-spacing:.08em}h2{font-size:16px;margin:24px 0 8px;border-bottom:1px solid #bbb;padding-bottom:6px}.muted{color:#555;text-align:center}.meta{display:flex;gap:24px;flex-wrap:wrap;margin:16px 0 20px}.columns{display:grid;grid-template-columns:1fr 1fr;gap:24px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{padding:9px 7px;border-bottom:1px solid #ddd;text-align:left}th{background:#f1f1f1}.product-cell{display:flex;align-items:center;gap:10px}.thumb{width:58px;height:58px;object-fit:contain;border:1px solid #ddd;border-radius:5px;background:#f8f8f8}.total{text-align:right;font-size:20px;font-weight:bold;margin-top:22px}.thanks{text-align:center;margin-top:42px;color:#555}@media print{body{margin:12mm}.no-print{display:none}tr{break-inside:avoid}}
    </style></head><body>
    <img class="receipt-logo" src="${escapeHtml(logo)}" alt="Logo Yakarta" /><h1>BOLETA DE COMPRA</h1><div class="muted">Pedido #${escapeHtml(data.id)}</div>
    <div class="meta"><span><strong>Fecha:</strong> ${escapeHtml(data.date)}</span><span><strong>Estado:</strong> ${escapeHtml(data.status)}</span></div>
    <div class="columns"><section><h2>Cliente</h2><div>${escapeHtml(data.customerName)}</div><div>${escapeHtml(data.customerEmail)}</div></section>
    <section><h2>Despacho</h2><div>${escapeHtml(data.address.nombre || 'No registrada')}</div><div>${escapeHtml(data.address.calle || 'No registrada')}</div><div>${escapeHtml(data.address.comuna || '')}</div><div>${escapeHtml(data.address.telefono || '')}</div></section></div>
    <h2>Detalle de la compra</h2><table><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead><tbody>${productRows}</tbody></table>
    <div class="total">Total pagado: ${escapeHtml(formatCLP(data.total))}</div><div class="thanks">Gracias por comprar en Yakarta.</div>
    <script>window.addEventListener('load',()=>window.print());</script></body></html>`);
  printWindow.document.close();
  printWindow.focus();
}
