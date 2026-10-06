import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCLP, getCurrentUser, readStorage } from '../lib/storage';

export default function PurchasesPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [selected, setSelected] = useState(null);
  const history = readStorage('historialCompras', []);
  const purchases = user ? history.filter((purchase) => purchase.usuarioEmail === (user.email || user.nombre) || !purchase.usuarioEmail) : [];

  useEffect(() => {
    if (!user) navigate('/login');
  }, [navigate, user]);

  if (!user) return null;

  return (
    <div className="container my-5">
      <div className="d-flex justify-content-between align-items-center mb-4"><h2>Mis Compras Recientes</h2><Link to="/tienda" className="btn btn-outline-info">Seguir Comprando</Link></div>
      <div className="row g-3">
        {purchases.length === 0 ? <div className="col-12 text-center py-5"><i className="bi bi-bag-x display-1 text-secondary" /><h4 className="mt-3">Aún no has realizado ninguna compra</h4><p className="text-secondary">Explora nuestro catálogo y agrega tus juegos favoritos al carrito.</p><Link to="/tienda" className="btn btn-primary mt-2">Ir a la Tienda</Link></div> : purchases.map((purchase) => (
          <div className="col-12" key={purchase.id}>
            <div className="card card-compra p-3 rounded-3" style={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2"><div><span className="badge bg-info text-dark me-2">{purchase.id}</span><span className="text-secondary small"><i className="bi bi-calendar3 me-1" />{purchase.fecha}</span></div><div><span className="badge bg-success me-3">{purchase.estado}</span><strong className="text-warning fs-5">{formatCLP(purchase.total)}</strong></div></div>
              <hr className="border-secondary my-2" />
              <div className="d-flex justify-content-between align-items-center"><span className="small text-secondary">{purchase.productos.length} producto(s) en este pedido</span><button type="button" className="btn btn-outline-info btn-sm" onClick={() => setSelected(purchase)}><i className="bi bi-eye me-1" />Ver Detalle</button></div>
            </div>
          </div>
        ))}
      </div>
      {selected && <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true" onClick={(event) => event.target === event.currentTarget && setSelected(null)}><div className="modal-dialog modal-lg modal-dialog-centered"><div className="modal-content bg-dark text-white"><div className="modal-header"><h5 className="modal-title">Detalle del Pedido: {selected.id}</h5><button type="button" className="btn-close btn-close-white" onClick={() => setSelected(null)} aria-label="Cerrar" /></div><div className="modal-body"><p><strong>Fecha:</strong> {selected.fecha}</p><p><strong>Estado:</strong> <span className="badge bg-success">{selected.estado}</span></p><div className="table-responsive"><table className="table table-dark table-striped align-middle mt-3"><thead><tr><th>Juego</th><th className="text-center">Cant.</th><th className="text-end">Subtotal</th></tr></thead><tbody>{selected.productos.map((product) => <tr key={product.nombre}><td>{product.nombre}</td><td className="text-center">{product.cantidad}</td><td className="text-end">{formatCLP(product.precio * product.cantidad)}</td></tr>)}</tbody></table></div><div className="text-end mt-3"><h5 className="fw-bold">Total: <span className="text-warning">{formatCLP(selected.total)}</span></h5></div></div></div></div></div>}
    </div>
  );
}
