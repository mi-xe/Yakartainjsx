import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatCLP } from '../lib/utils';

function receiptMarkup(purchase) {
  const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const rows = (purchase.productos || []).map((item) => `<tr><td>${safe(item.nombre)}</td><td>${safe(item.cantidad)}</td><td>${safe(formatCLP(item.precio))}</td><td>${safe(formatCLP(item.precio * item.cantidad))}</td></tr>`).join('');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Boleta ${safe(purchase.id)}</title><style>body{font:14px Arial,sans-serif;color:#171717;max-width:760px;margin:40px auto;padding:24px}header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #222;padding-bottom:16px}header img{width:130px;object-fit:contain}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{padding:12px;border-bottom:1px solid #ddd;text-align:left}th:last-child,td:last-child{text-align:right}.total{text-align:right;font-size:20px;font-weight:bold;margin-top:24px}.muted{color:#555}@media print{body{margin:0}}</style></head><body><header><div><h1>Boleta de compra</h1><p class="muted">Yakarta · Mcyakartalovin@solab.cl</p></div><img src="${window.location.origin}/img/logofeoyakarta.png" alt="Yakarta"></header><p><b>Pedido:</b> ${safe(purchase.id)}<br><b>Fecha:</b> ${safe(purchase.fecha)}<br><b>Estado:</b> ${safe(purchase.estado)}</p><table><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead><tbody>${rows}</tbody></table><p class="total">Total: ${safe(formatCLP(purchase.total))}</p><p class="muted">Gracias por tu compra.</p></body></html>`;
}

function downloadReceipt(purchase) {
  const blob = new Blob([receiptMarkup(purchase)], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `boleta-yakarta-${purchase.id}.html`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function printReceipt(purchase) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(receiptMarkup(purchase));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export default function Compras() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [selected, setSelected] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      setLoading(false);
      return;
    }
    let active = true;
    api.orders()
      .then((rows) => {
        if (!active) return;
        const normalized = rows.map((purchase) => ({
          ...purchase,
          total: Number(purchase.total),
          productos: (purchase.productos || []).map((item) => ({ ...item, precio: Number(item.precio), cantidad: Number(item.cantidad) })),
        }));
        setPurchases(normalized);
        if (location.state?.purchaseCompleted && normalized.length) {
          const latest = [...normalized].sort((a, b) => Number(b.id) - Number(a.id))[0];
          setSelected(latest);
          navigate(location.pathname, { replace: true, state: null });
        }
      })
      .catch((reason) => active && setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [authLoading, user, navigate, location.pathname, location.state]);

  if (authLoading || !user) return null;

  return (
    <div className="container my-5">
      <div className="d-flex justify-content-between align-items-center mb-4"><h2>Mis Compras Recientes</h2><Link to="/tienda" className="btn btn-outline-info">Seguir Comprando</Link></div>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <div className="alert alert-info">Consultando historial en MySQL...</div>}
      <div className="row g-3">
        {!loading && purchases.length === 0 ? <div className="col-12 text-center py-5"><i className="bi bi-bag-x display-1 text-secondary" /><h4 className="mt-3">Aún no has realizado ninguna compra</h4><p className="text-secondary">Explora nuestro catálogo y agrega tus juegos favoritos al carrito.</p><Link to="/tienda" className="btn btn-primary mt-2">Ir a la Tienda</Link></div> : purchases.map((purchase) => (
          <div className="col-12" key={purchase.id}>
            <div className="card card-compra p-3 rounded-3" style={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2"><div><span className="badge bg-info text-dark me-2">{purchase.id}</span><span className="text-secondary small"><i className="bi bi-calendar3 me-1" />{purchase.fecha}</span></div><div><span className="badge bg-success me-3">{purchase.estado}</span><strong className="text-warning fs-5">{formatCLP(purchase.total)}</strong></div></div>
              <hr className="border-secondary my-2" />
              <div className="d-flex justify-content-between align-items-center"><span className="small text-secondary">{purchase.productos.length} producto(s) en este pedido</span><button type="button" className="btn btn-outline-info btn-sm" onClick={() => setSelected(purchase)}><i className="bi bi-eye me-1" />Ver Detalle</button></div>
            </div>
          </div>
        ))}
      </div>
      {selected && <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true" onClick={(event) => event.target === event.currentTarget && setSelected(null)}><div className="modal-dialog modal-lg modal-dialog-centered"><div className="modal-content bg-dark text-white"><div className="modal-header"><h5 className="modal-title">Boleta de compra · Pedido {selected.id}</h5><button type="button" className="btn-close btn-close-white" onClick={() => setSelected(null)} aria-label="Cerrar" /></div><div className="modal-body"><p><strong>Fecha:</strong> {selected.fecha}</p><p><strong>Estado:</strong> <span className="badge bg-success">{selected.estado}</span></p><div className="table-responsive"><table className="table table-dark table-striped align-middle mt-3"><thead><tr><th>Juego</th><th className="text-center">Cant.</th><th className="text-end">Subtotal</th></tr></thead><tbody>{selected.productos.map((product, index) => <tr key={`${product.nombre}-${index}`}><td>{product.nombre}</td><td className="text-center">{product.cantidad}</td><td className="text-end">{formatCLP(product.precio * product.cantidad)}</td></tr>)}</tbody></table></div><div className="text-end mt-3"><h5 className="fw-bold">Total: <span className="text-warning">{formatCLP(selected.total)}</span></h5></div><div className="d-flex flex-wrap justify-content-end gap-2 mt-4"><button type="button" className="btn btn-outline-info" onClick={() => downloadReceipt(selected)}><i className="bi bi-download me-2" />Descargar boleta</button><button type="button" className="btn btn-info text-dark fw-bold" onClick={() => printReceipt(selected)}><i className="bi bi-printer me-2" />Imprimir boleta</button></div></div></div></div></div>}
    </div>
  );
}
