import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCLP } from '../lib/storage';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { createReceiptPdf, downloadReceiptPdf, printReceipt } from '../lib/receipt';
import { resolveProductImage } from '../lib/storage';

function ReceiptActions({ purchase, user, compact = false }) {
  return (
    <div className={`d-flex flex-wrap gap-2 ${compact ? '' : 'mt-3'}`}>
      <button type="button" className="btn btn-outline-success btn-sm" onClick={() => downloadReceiptPdf(purchase, user)}>
        <i className="bi bi-file-earmark-pdf me-1" />Descargar boleta
      </button>
      <button type="button" className="btn btn-outline-light btn-sm" onClick={() => printReceipt(purchase, user)}>
        <i className="bi bi-printer me-1" />Imprimir boleta
      </button>
    </div>
  );
}

export default function Compras() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [selected, setSelected] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [error, setError] = useState('');
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [sendingReceipt, setSendingReceipt] = useState(false);
  const [receiptEmailMessage, setReceiptEmailMessage] = useState('');
  const [receiptEmailError, setReceiptEmailError] = useState('');

  useEffect(() => {
    let active = true;
    if (user) {
      api.orders()
        .then((rows) => {
          if (!active) return;
          setPurchases((rows || []).map((purchase) => ({
            ...purchase,
            productos: (purchase.productos || []).map((detail) => ({
              productoId: detail.productoId,
              nombre: detail.nombre,
              cantidad: Number(detail.cantidad || 0),
              precio: Number(detail.precio || 0),
              imagen: detail.imagen || '',
            })),
          })));
        })
        .catch((err) => { if (active) setError(err.message); })
        .finally(() => { if (active) setLoadingPurchases(false); });
    } else if (!authLoading) {
      setLoadingPurchases(false);
    }
    return () => { active = false; };
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [navigate, user, authLoading]);

  if (authLoading || !user) return null;

  async function sendReceiptCopy() {
    if (!selected || user.authProvider !== 'GOOGLE') return;
    setSendingReceipt(true);
    setReceiptEmailMessage('');
    setReceiptEmailError('');
    try {
      const pdf = await createReceiptPdf(selected, user);
      const result = await api.sendReceiptEmail(selected.id, pdf);
      if (result?.acceptedBySmtp !== true) {
        throw new Error(result?.message || 'El servidor de correo no confirmó la aceptación del mensaje.');
      }
      const recipient = result.recipient || result.email || user.email;
      const sender = result.sender ? ` Remitente: ${result.sender}.` : '';
      const messageId = result.messageId ? ` Identificador del mensaje: ${result.messageId}.` : '';
      setReceiptEmailMessage(
        `Se envio el correo a: ${recipient} Revisa Spam, Promociones, Todos los correos y la carpeta Enviados del remitente`
      );
    } catch (err) {
      setReceiptEmailError(err.message || 'No se pudo enviar la boleta.');
    } finally {
      setSendingReceipt(false);
    }
  }

  return (
    <div className="container my-5">
      {error && <div className="alert alert-warning" role="alert">{error}</div>}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <h2 className="mb-0">Mis Compras Recientes</h2>
        <Link to="/tienda" className="btn btn-outline-info">Seguir Comprando</Link>
      </div>
      <div className="row g-3">
        {loadingPurchases ? (
          <div className="col-12 text-center py-5 text-secondary">Cargando tus compras...</div>
        ) : purchases.length === 0 ? (
          <div className="col-12 text-center py-5">
            <i className="bi bi-bag-x display-1 text-secondary" />
            <h4 className="mt-3">Aún no has realizado ninguna compra</h4>
            <p className="text-secondary">Explora nuestro catálogo y agrega tus juegos favoritos al carrito.</p>
            <Link to="/tienda" className="btn btn-primary mt-2">Ir a la Tienda</Link>
          </div>
        ) : purchases.map((purchase) => (
          <div className="col-12" key={purchase.id}>
            <div className="card card-compra p-3 rounded-3" style={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div>
                  <span className="badge bg-info text-dark me-2">Pedido #{purchase.id}</span>
                  <span className="text-secondary small"><i className="bi bi-calendar3 me-1" />{purchase.fecha}</span>
                </div>
                <div><span className="badge bg-success me-3">{purchase.estado}</span><strong className="text-warning fs-5">{formatCLP(purchase.total)}</strong></div>
              </div>
              <hr className="border-secondary my-2" />
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <span className="small text-secondary">{purchase.productos.length} producto(s) en este pedido</span>
                <button type="button" className="btn btn-outline-info btn-sm" onClick={() => {
                  setSelected(purchase);
                  setReceiptEmailMessage('');
                  setReceiptEmailError('');
                }}>
                  <i className="bi bi-eye me-1" />Ver Detalle
                </button>
              </div>
              <ReceiptActions purchase={purchase} user={user} />
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true" onClick={(event) => event.target === event.currentTarget && setSelected(null)}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content bg-dark text-white">
              <div className="modal-header">
                <h5 className="modal-title">Boleta / Pedido #{selected.id}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelected(null)} aria-label="Cerrar" />
              </div>
              <div className="modal-body">
                <div className="receipt-modal-brand text-center mb-4">
                  <img
                    src="/img/logofeoyakarta.png"
                    alt="Logo de Yakarta"
                    width="72"
                    height="72"
                    style={{ width: 72, height: 72, maxWidth: 72, maxHeight: 72, objectFit: 'contain', display: 'block', margin: '0 auto' }}
                  />
                  <div className="small text-secondary mt-2">BOLETA DE COMPRA · #{selected.id}</div>
                </div>
                <p><strong>Fecha:</strong> {selected.fecha}</p>
                <p><strong>Estado:</strong> <span className="badge bg-success">{selected.estado}</span></p>
                {selected.direccion && <div className="mb-3"><strong>Despacho:</strong><div>{selected.direccion.nombre}</div><div>{selected.direccion.calle}, {selected.direccion.comuna}</div><div>{selected.direccion.telefono}</div></div>}
                <div className="table-responsive">
                  <table className="table table-dark table-striped align-middle mt-3">
                    <thead><tr><th>Juego</th><th className="text-center">Cant.</th><th className="text-end">Precio unit.</th><th className="text-end">Subtotal</th></tr></thead>
                    <tbody>{selected.productos.map((product, index) => (
                      <tr key={`${product.productoId ?? product.nombre}-${index}`}>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            {product.imagen ? (
                              <img
                                src={resolveProductImage(product.imagen, '')}
                                alt={product.nombre || 'Miniatura del juego'}
                                className="receipt-product-thumbnail"
                                onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }}
                              />
                            ) : (
                              <div className="receipt-product-thumbnail receipt-product-placeholder"><i className="bi bi-controller" /></div>
                            )}
                            <span>{product.nombre}</span>
                          </div>
                        </td>
                        <td className="text-center">{product.cantidad}</td>
                        <td className="text-end">{formatCLP(product.precio)}</td>
                        <td className="text-end">{formatCLP(product.precio * product.cantidad)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                <div className="text-end mt-3"><h5 className="fw-bold">Total: <span className="text-warning">{formatCLP(selected.total)}</span></h5></div>
                <ReceiptActions purchase={selected} user={user} />
                {user.authProvider === 'GOOGLE' && (
                  <div className="receipt-email-panel mt-4 p-3 rounded-3">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                      <div>
                        <strong><i className="bi bi-envelope-check me-2" />Enviar copia al correo de Google</strong>
                        <div className="small text-secondary mt-1">Destinatario verificado: {user.email}</div>
                      </div>
                      <button type="button" className="btn btn-outline-info" onClick={sendReceiptCopy} disabled={sendingReceipt}>
                        {sendingReceipt ? <><span className="spinner-border spinner-border-sm me-2" />Enviando…</> : <><i className="bi bi-send me-2" />Enviar boleta</>}
                      </button>
                    </div>
                    {receiptEmailMessage && <div className="alert alert-info mt-3 mb-0 py-2" role="status">{receiptEmailMessage}</div>}
                    {receiptEmailError && <div className="alert alert-danger mt-3 mb-0 py-2" role="alert">{receiptEmailError}</div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
