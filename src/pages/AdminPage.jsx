import { useState } from 'react';
import { defaultProducts } from '../lib/products';
import { formatCLP, readStorage, writeStorage } from '../lib/storage';

const defaultUsers = [
  { nombre: 'Cristian Orlando', email: 'cristian@admin.com', rol: 'Administrador' },
  { nombre: 'Juan Pérez', email: 'juan@gmail.com', rol: 'Cliente' },
  { nombre: 'Mixin', email: 'mixin@admin.com', rol: 'Administrador' },
];

const defaultCategories = ['Acción', 'Aventura', 'RPG', 'Estrategia', 'Deportes'];

const defaultOrders = [
  { id: 'ORD-001', cliente: 'juan@gmail.com', fecha: '2026-03-20', total: 45000, items: [{ nombre: 'Zelda BOTW', precio: 45000, cant: 1 }] },
  { id: 'ORD-002', cliente: 'cristian@admin.com', fecha: '2026-03-21', total: 60000, items: [{ nombre: 'Mario Odyssey', precio: 30000, cant: 2 }] }
];

export default function AdminPage() {
  // Estados Principales
  const [products, setProducts] = useState(() => readStorage('productosTienda', defaultProducts) || []);
  const [users, setUsers] = useState(() => readStorage('usuariosAdmin', defaultUsers) || []);
  const [categories, setCategories] = useState(() => readStorage('categoriasTienda', defaultCategories) || []);
  const [orders] = useState(() => readStorage('ordenesTienda', defaultOrders) || []);

  // Control de Navegación: 'dashboard' | 'products' | 'categories' | 'users' | 'orders' | 'profile'
  const [tab, setTab] = useState('dashboard');
  const [filterCritical, setFilterCritical] = useState(false);

  // Modales
  const [productModal, setProductModal] = useState(null);
  const [userModal, setUserModal] = useState(null);
  const [categoryModal, setCategoryModal] = useState(null);
  const [invoiceModal, setInvoiceModal] = useState(null);
  const [userHistoryModal, setUserHistoryModal] = useState(null);
  
  // Alertas de Confirmación en Página
  const [deleteProductConfirm, setDeleteProductConfirm] = useState(null); // { index, nombre }
  const [deleteUserConfirm, setDeleteUserConfirm] = useState(null);       // { index, nombre }

  // Guardar Cambios
  function saveProducts(next) { setProducts(next); writeStorage('productosTienda', next); }
  function saveUsers(next) { setUsers(next); writeStorage('usuariosAdmin', next); }
  function saveCategories(next) { setCategories(next); writeStorage('categoriasTienda', next); }

  // Gestor Productos
  function openProduct(index = null) {
    if (index === null) {
      setProductModal({ index: null, nombre: '', precio: '', stock: 10, categoria: categories[0] || '', imagen: '' });
    } else {
      setProductModal({ index, ...products[index] });
    }
  }

  function submitProduct(event) {
    event.preventDefault();
    if (!productModal) return;

    const form = new FormData(event.currentTarget);
    const product = {
      nombre: (form.get('nombre') || '').toString().trim(),
      precio: Number(form.get('precio')) || 0,
      stock: Number(form.get('stock')) || 0,
      categoria: form.get('categoria') || '',
      imagen: (form.get('imagen') || '').toString().trim(),
    };

    const next = [...products];
    if (productModal.index === null) {
      next.push({ id: Date.now(), ...product });
    } else {
      next[productModal.index] = { ...next[productModal.index], ...product };
    }

    saveProducts(next);
    setProductModal(null);
  }

  // Confirmación Eliminación Producto
  function confirmRemoveProduct(index) {
    setDeleteProductConfirm({ index, nombre: products[index]?.nombre || 'este producto' });
  }

  function handleExecuteDeleteProduct() {
    if (deleteProductConfirm !== null) {
      saveProducts(products.filter((_, i) => i !== deleteProductConfirm.index));
      setDeleteProductConfirm(null);
    }
  }

  // Gestor Categorías
  function openCategory(index = null) {
    setCategoryModal(index === null ? { index: null, nombre: '' } : { index, nombre: categories[index] });
  }

  function submitCategory(event) {
    event.preventDefault();
    if (!categoryModal) return;

    const form = new FormData(event.currentTarget);
    const catName = (form.get('nombre') || '').toString().trim();
    const next = [...categories];

    if (categoryModal.index === null) next.push(catName);
    else next[categoryModal.index] = catName;

    saveCategories(next);
    setCategoryModal(null);
  }

  // Gestor Usuarios
  function openUser(index = null) {
    if (index === null) {
      setUserModal({ index: null, nombre: '', email: '', rol: 'Cliente' });
    } else {
      setUserModal({ index, ...users[index] });
    }
  }

  function submitUser(event) {
    event.preventDefault();
    if (!userModal) return;

    const form = new FormData(event.currentTarget);
    const user = {
      nombre: (form.get('nombre') || '').toString().trim(),
      email: (form.get('email') || '').toString().trim(),
      rol: form.get('rol') || 'Cliente',
    };

    const next = [...users];
    if (userModal.index === null) {
      next.push(user);
    } else {
      next[userModal.index] = user;
    }

    saveUsers(next);
    setUserModal(null);
  }

  // Confirmación Eliminación Usuario
  function confirmRemoveUser(index) {
    setDeleteUserConfirm({ index, nombre: users[index]?.nombre || 'este usuario' });
  }

  function handleExecuteDeleteUser() {
    if (deleteUserConfirm !== null) {
      saveUsers(users.filter((_, i) => i !== deleteUserConfirm.index));
      setDeleteUserConfirm(null);
    }
  }

  // Filtrado Productos Críticos (Stock menor a 5)
  const displayedProducts = filterCritical ? products.filter(p => (p.stock ?? 10) < 5) : products;

  return (
    <div className="container my-5 text-white">
      <h2 className="mb-4">Gestión del Sistema</h2>

      {/* Pestañas de Navegación */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button type="button" className={`nav-link ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>Dashboard</button>
        </li>
        <li className="nav-item">
          <button type="button" className={`nav-link ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>Productos</button>
        </li>
        <li className="nav-item">
          <button type="button" className={`nav-link ${tab === 'categories' ? 'active' : ''}`} onClick={() => setTab('categories')}>Categorías</button>
        </li>
        <li className="nav-item">
          <button type="button" className={`nav-link ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>Usuarios</button>
        </li>
        <li className="nav-item">
          <button type="button" className={`nav-link ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>Órdenes / Boletas</button>
        </li>
        <li className="nav-item">
          <button type="button" className={`nav-link ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>Perfil</button>
        </li>
      </ul>

      {/* 1. HOME / DASHBOARD */}
      {tab === 'dashboard' && (
        <section>
          <div className="row g-4 mb-4">
            <div className="col-md-3">
              <div className="card bg-dark text-white border-secondary p-3">
                <h5>Productos Totales</h5>
                <h2>{products.length}</h2>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-dark text-white border-secondary p-3">
                <h5>Categorías</h5>
                <h2>{categories.length}</h2>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-dark text-white border-secondary p-3">
                <h5>Usuarios</h5>
                <h2>{users.length}</h2>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-dark text-white border-danger p-3">
                <h5>Productos Críticos</h5>
                <h2>{products.filter(p => (p.stock ?? 10) < 5).length}</h2>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. PRODUCTO */}
      {tab === 'products' && (
        <section>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex gap-2 align-items-center">
              <h4>Inventario de Productos</h4>
              <button
                type="button"
                className={`btn btn-sm ${filterCritical ? 'btn-danger' : 'btn-outline-danger'}`}
                onClick={() => setFilterCritical(!filterCritical)}
              >
                {filterCritical ? 'Ver Todos' : 'Ver Productos Críticos (<5 stock)'}
              </button>
            </div>
            <button type="button" className="btn btn-success" onClick={() => openProduct()}>Nuevo Producto</button>
          </div>
          <div className="table-responsive">
            <table className="table table-dark table-striped align-middle">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Precio</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {displayedProducts.length === 0 ? (
                  <tr><td colSpan="6" className="text-center">No hay productos disponibles.</td></tr>
                ) : (
                  displayedProducts.map((product, index) => (
                    <tr key={product?.id ?? `prod-${index}`}>
                      <td>
                        <img
                          src={product?.imagen ? (product.imagen.startsWith('/') ? product.imagen : `/${product.imagen}`) : ''}
                          style={{ width: '40px', height: '50px', objectFit: 'cover' }}
                          className="rounded"
                          alt={product?.nombre || 'Producto'}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </td>
                      <td>{product?.nombre || 'Sin Nombre'}</td>
                      <td>{product?.categoria || 'Sin Categoría'}</td>
                      <td><span className={`badge ${product?.stock < 5 ? 'bg-danger' : 'bg-success'}`}>{product?.stock ?? 10}</span></td>
                      <td>{typeof formatCLP === 'function' ? formatCLP(product?.precio) : `$${product?.precio}`}</td>
                      <td className="text-center">
                        <button type="button" className="btn btn-sm btn-outline-warning me-1" onClick={() => openProduct(index)}>
                          <i className="bi bi-pencil" /> Editar
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => confirmRemoveProduct(index)}>
                          <i className="bi bi-trash" /> Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 3. CATEGORÍAS */}
      {tab === 'categories' && (
        <section>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>Lista de Categorías</h4>
            <button type="button" className="btn btn-warning text-dark fw-bold" onClick={() => openCategory()}>Nueva Categoría</button>
          </div>
          <ul className="list-group rounded border border-secondary">
            {categories.map((cat, index) => (
              <li key={index} className="list-group-item bg-dark text-white d-flex justify-content-between align-items-center">
                <span>{cat}</span>
                <div>
                  <button type="button" className="btn btn-sm btn-outline-warning me-2" onClick={() => openCategory(index)}>Editar</button>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => saveCategories(categories.filter((_, idx) => idx !== index))}>Eliminar</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 4. USUARIOS */}
      {tab === 'users' && (
        <section>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="text-white">Lista de Usuarios</h4>
            <button type="button" className="btn btn-warning text-dark fw-bold" onClick={() => openUser()}>Nuevo Usuario</button>
          </div>
          <div className="table-responsive">
            <table className="table table-dark table-striped">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user?.email ? `${user.email}-${index}` : `user-${index}`}>
                    <td>{user?.nombre || 'Sin Nombre'}</td>
                    <td>{user?.email || 'Sin Email'}</td>
                    <td><span className={`badge ${user?.rol === 'Administrador' ? 'bg-danger' : 'bg-info'}`}>{user?.rol || 'Cliente'}</span></td>
                    <td className="text-center">
                      <button type="button" className="btn btn-sm btn-outline-info me-1" onClick={() => setUserHistoryModal(user)}>Historial</button>
                      <button type="button" className="btn btn-sm btn-outline-warning me-1" onClick={() => openUser(index)}><i className="bi bi-pencil" /> Editar</button>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => confirmRemoveUser(index)}><i className="bi bi-trash" /> Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 5. ÓRDENES / BOLETAS */}
      {tab === 'orders' && (
        <section>
          <h4>Ordenes / Boletas</h4>
          <div className="table-responsive mt-3">
            <table className="table table-dark table-striped">
              <thead>
                <tr>
                  <th>ID Orden</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th className="text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{o.cliente}</td>
                    <td>{o.fecha}</td>
                    <td>{typeof formatCLP === 'function' ? formatCLP(o.total) : `$${o.total}`}</td>
                    <td className="text-center">
                      <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setInvoiceModal(o)}>Mostrar Boleta</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 6. PERFIL */}
      {tab === 'profile' && (
        <section>
          <div className="card bg-dark text-white border-secondary p-4">
            <h4>Perfil de Administrador</h4>
            <p className="mt-3"><strong>Nombre:</strong> Cristian Orlando</p>
            <p><strong>Correo Electrónico:</strong> cristian@admin.com</p>
            <p><strong>Rol:</strong> Administrador</p>
          </div>
        </section>
      )}

      {/* ALERTA EN PÁGINA: ELIMINAR PRODUCTO */}
      {Boolean(deleteProductConfirm) && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border border-danger">
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title text-danger">⚠️ Confirmar Eliminación</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setDeleteProductConfirm(null)} aria-label="Cerrar" />
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  ¿Estás seguro de que deseas eliminar permanentemente el producto <strong>"{deleteProductConfirm?.nombre}"</strong>?
                </p>
              </div>
              <div className="modal-footer border-top border-secondary">
                <button type="button" className="btn btn-secondary" onClick={() => setDeleteProductConfirm(null)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-danger" onClick={handleExecuteDeleteProduct}>
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ALERTA EN PÁGINA: ELIMINAR USUARIO */}
      {Boolean(deleteUserConfirm) && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border border-danger">
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title text-danger">⚠️ Confirmar Eliminación</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setDeleteUserConfirm(null)} aria-label="Cerrar" />
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  ¿Estás seguro de que deseas eliminar permanentemente al usuario <strong>"{deleteUserConfirm?.nombre}"</strong>?
                </p>
              </div>
              <div className="modal-footer border-top border-secondary">
                <button type="button" className="btn btn-secondary" onClick={() => setDeleteUserConfirm(null)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-danger" onClick={handleExecuteDeleteUser}>
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRODUCTO */}
      {Boolean(productModal) && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
          <div className="modal-dialog">
            <div className="modal-content bg-dark text-white">
              <form onSubmit={submitProduct}>
                <div className="modal-header">
                  <h5 className="modal-title">{productModal?.index === null ? 'Nuevo Producto' : 'Editar Producto'}</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setProductModal(null)} aria-label="Cerrar" />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="prodNombre" className="form-label">Nombre del Juego</label>
                    <input name="nombre" defaultValue={productModal?.nombre || ''} id="prodNombre" className="form-control" required />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="prodPrecio" className="form-label">Precio ($ CLP)</label>
                    <input name="precio" defaultValue={productModal?.precio || ''} id="prodPrecio" type="number" className="form-control" required />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="prodStock" className="form-label">Stock Actual</label>
                    <input name="stock" defaultValue={productModal?.stock ?? 10} id="prodStock" type="number" className="form-control" required />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="prodCategoria" className="form-label">Categoría</label>
                    <select name="categoria" defaultValue={productModal?.categoria || categories[0]} id="prodCategoria" className="form-select">
                      {categories.map((c, i) => <option key={i} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="prodImagen" className="form-label">Ruta de Imagen</label>
                    <input name="imagen" defaultValue={productModal?.imagen || ''} id="prodImagen" className="form-control" placeholder="imgtienda/juego.jpg" required />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setProductModal(null)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Guardar Producto</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL USUARIO */}
      {Boolean(userModal) && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
          <div className="modal-dialog">
            <div className="modal-content bg-dark text-white">
              <form onSubmit={submitUser}>
                <div className="modal-header">
                  <h5 className="modal-title">{userModal?.index === null ? 'Nuevo Usuario' : 'Editar Usuario'}</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setUserModal(null)} aria-label="Cerrar" />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="userNombre" className="form-label">Nombre Completo</label>
                    <input name="nombre" defaultValue={userModal?.nombre || ''} id="userNombre" className="form-control" required />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="userEmail" className="form-label">Correo Electrónico</label>
                    <input name="email" defaultValue={userModal?.email || ''} id="userEmail" type="email" className="form-control" required />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="userRol" className="form-label">Rol</label>
                    <select name="rol" defaultValue={userModal?.rol || 'Cliente'} id="userRol" className="form-select">
                      <option>Cliente</option>
                      <option>Administrador</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setUserModal(null)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Guardar Usuario</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CATEGORÍA */}
      {Boolean(categoryModal) && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
          <div className="modal-dialog">
            <div className="modal-content bg-dark text-white">
              <form onSubmit={submitCategory}>
                <div className="modal-header">
                  <h5 className="modal-title">{categoryModal?.index === null ? 'Nueva Categoría' : 'Editar Categoría'}</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setCategoryModal(null)} aria-label="Cerrar" />
                </div>
                <div className="modal-body">
                  <label htmlFor="catNombre" className="form-label">Nombre Categoría</label>
                  <input name="nombre" defaultValue={categoryModal?.nombre || ''} id="catNombre" className="form-control" required />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setCategoryModal(null)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MOSTRAR BOLETA */}
      {Boolean(invoiceModal) && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
          <div className="modal-dialog">
            <div className="modal-content bg-dark text-white border-light">
              <div className="modal-header">
                <h5 className="modal-title">Boleta: {invoiceModal?.id}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setInvoiceModal(null)} aria-label="Cerrar" />
              </div>
              <div className="modal-body">
                <p><strong>Cliente:</strong> {invoiceModal?.cliente}</p>
                <p><strong>Fecha:</strong> {invoiceModal?.fecha}</p>
                <hr />
                <h6>Detalle de Productos:</h6>
                <ul>
                  {invoiceModal?.items?.map((it, idx) => (
                    <li key={idx}>{it.nombre} - Cantidad: {it.cant} - ${it.precio}</li>
                  ))}
                </ul>
                <h5 className="text-end">Total: ${invoiceModal?.total}</h5>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setInvoiceModal(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTORIAL COMPRAS USUARIO */}
      {Boolean(userHistoryModal) && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
          <div className="modal-dialog">
            <div className="modal-content bg-dark text-white">
              <div className="modal-header">
                <h5 className="modal-title">Historial de Compras: {userHistoryModal?.nombre}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setUserHistoryModal(null)} aria-label="Cerrar" />
              </div>
              <div className="modal-body">
                {orders.filter(o => o.cliente === userHistoryModal?.email).length === 0 ? (
                  <p>Este usuario no registra compras previas.</p>
                ) : (
                  orders.filter(o => o.cliente === userHistoryModal?.email).map(o => (
                    <div key={o.id} className="border-bottom border-secondary pb-2 mb-2">
                      <p className="mb-0"><strong>ID Orden:</strong> {o.id} - <strong>Fecha:</strong> {o.fecha}</p>
                      <p className="mb-0"><strong>Monto Total:</strong> ${o.total}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setUserHistoryModal(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BACKDROP GENERAL */}
      {(Boolean(productModal) || Boolean(userModal) || Boolean(categoryModal) || Boolean(invoiceModal) || Boolean(userHistoryModal) || Boolean(deleteProductConfirm) || Boolean(deleteUserConfirm)) && (
        <div className="modal-backdrop fade show" />
      )}
    </div>
  );
}