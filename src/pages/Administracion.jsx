import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatCLP, resolveProductImage } from '../lib/storage';
import { useAuth } from '../context/AuthContext';


export default function Administracion() {
  const { user: currentUser } = useAuth();
  // Todos los datos administrativos se cargan desde la API conectada a MySQL.
  const [products, setProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [categoryRows, setCategoryRows] = useState([]);
  const [apiError, setApiError] = useState('');
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [productRows, categoryData, userRows, orderRows] = await Promise.all([
          api.products(), api.categories(), api.users(), api.orders()
        ]);
        if (!alive) return;
        setProducts(productRows.map(p => ({ ...p, precio: Number(p.precio), precioOferta: p.precioOferta == null ? null : Number(p.precioOferta), enOferta: Boolean(p.enOferta) })));
        setCategoryRows(categoryData);
        setCategories(categoryData.map(c => c.nombre));
        setUsers(userRows);
        setOrders(orderRows.map(o => ({
          id: o.id, cliente: o.usuarioEmail || `Usuario #${o.usuarioId ?? 'N/D'}`,
          fecha: o.fecha, total: Number(o.total), estado: o.estado,
          items: (o.productos || []).map(d => ({ nombre: d.nombre, cant: d.cantidad, precio: Number(d.precio) }))
        })));
        setApiError('');
      } catch (error) {
        if (alive) setApiError(`No se pudo cargar la información de MySQL: ${error.message}`);
      } finally {
        if (alive) setLoadingData(false);
      }
    })();
    return () => { alive = false; };
  }, []);

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
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState(null); // { index, nombre }

  // Guardar Cambios
  function saveProducts(next) { setProducts(next); }
  function saveUsers(next) { setUsers(next); }
  function saveCategories(next) { setCategories(next); }

  // Gestor Productos
  function openProduct(index = null) {
    if (index === null) {
      setProductModal({ index: null, nombre: '', precio: '', precioOferta: '', enOferta: false, stock: 10, categoria: categories[0] || '', imagen: '' });
    } else {
      setProductModal({ index, ...products[index] });
    }
  }

  async function submitProduct(event) {
    event.preventDefault();
    if (!productModal) return;

    const form = new FormData(event.currentTarget);
    const product = {
      nombre: (form.get('nombre') || '').toString().trim(),
      precio: Number(form.get('precio')) || 0,
      precioOferta: Number(form.get('precioOferta')) || null,
      enOferta: form.get('enOferta') === 'on',
      stock: Number(form.get('stock')) || 0,
      categoria: form.get('categoria') || '',
      imagen: (form.get('imagen') || '').toString().trim(),
    };

    try {
      const saved = productModal.index === null
        ? await api.createProduct(product)
        : await api.updateProduct(products[productModal.index].id, product);
      const normalized = { ...saved, precio: Number(saved.precio), precioOferta: saved.precioOferta == null ? null : Number(saved.precioOferta), enOferta: Boolean(saved.enOferta) };
      const next = productModal.index === null
        ? [...products, normalized]
        : products.map((item, index) => index === productModal.index ? normalized : item);
      saveProducts(next);
      setApiError('');
      setProductModal(null);
    } catch (error) {
      setApiError(`No se pudo guardar el producto: ${error.message}`);
    }
  }

  // Confirmación Eliminación Producto
  function confirmRemoveProduct(index) {
    setDeleteProductConfirm({ index, nombre: products[index]?.nombre || 'este producto' });
  }

  function handleExecuteDeleteProduct() {
    if (deleteProductConfirm !== null) {
      (async () => { try { const p = products[deleteProductConfirm.index]; await api.deleteProduct(p.id); saveProducts(products.filter((_, i) => i !== deleteProductConfirm.index)); setApiError(''); } catch(e) { setApiError(`No se pudo eliminar: ${e.message}`); } })();
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
    (async () => { try { let rows; if (categoryModal.index === null) { await api.createCategory(catName); } else { const old = categoryRows.find(c => c.nombre === categories[categoryModal.index]); await api.updateCategory(old.id, catName); } rows = await api.categories(); setCategoryRows(rows); saveCategories(rows.map(c=>c.nombre)); setApiError(''); } catch(e) { setApiError(`No se pudo guardar categoría: ${e.message}`); } })();
    setCategoryModal(null);
  }

  // Confirmación Eliminación Categoría
  function confirmRemoveCategory(index) {
    setDeleteCategoryConfirm({ index, nombre: categories[index] || 'esta categoría' });
  }

  function handleExecuteDeleteCategory() {
    if (deleteCategoryConfirm !== null) {
      (async () => { try { const old = categoryRows.find(c => c.nombre === categories[deleteCategoryConfirm.index]); if(old) await api.deleteCategory(old.id); const rows=await api.categories(); setCategoryRows(rows); saveCategories(rows.map(c=>c.nombre)); setApiError(''); } catch(e) { setApiError(`No se pudo eliminar categoría: ${e.message}`); } })();
      setDeleteCategoryConfirm(null);
    }
  }

  // Gestor Usuarios
  function openUser(index = null) {
    if (index === null) {
      setUserModal({ index: null, nombre: '', email: '', rol: 'Cliente', password: '' });
    } else {
      setUserModal({ index, ...users[index] });
    }
  }

  async function submitUser(event) {
    event.preventDefault();
    if (!userModal) return;
    const form = new FormData(event.currentTarget);
    const email = (form.get('email') || '').toString().trim().toLowerCase();
    const password = (form.get('password') || '').toString();
    const user = {
      nombre: (form.get('nombre') || '').toString().trim(),
      email,
      rol: form.get('rol') || 'Cliente',
      password,
    };
    if (userModal.index === null && !password) {
      setApiError('Debes asignar una contraseña a la nueva cuenta.');
      return;
    }
    try {
      const saved = userModal.index === null
        ? await api.createUser(user)
        : await api.updateUser(users[userModal.index].id, user);
      const next = userModal.index === null
        ? [...users, saved]
        : users.map((current, index) => index === userModal.index ? saved : current);
      saveUsers(next);
      setApiError('');
      setUserModal(null);
    } catch (error) {
      setApiError(`No se pudo guardar el usuario en MySQL: ${error.message}`);
    }
  }

  // Confirmación Eliminación Usuario
  function confirmRemoveUser(index) {
    setDeleteUserConfirm({ index, nombre: users[index]?.nombre || 'este usuario' });
  }

  function handleExecuteDeleteUser() {
    if (deleteUserConfirm !== null) {
      (async () => {
        try {
          const user = users[deleteUserConfirm.index];
          await api.deleteUser(user.id);
          saveUsers(users.filter((_, i) => i !== deleteUserConfirm.index));
          setApiError('');
        } catch (error) { setApiError(`No se pudo eliminar el usuario: ${error.message}`); }
      })();
      setDeleteUserConfirm(null);
    }
  }

  // Filtrado Productos Críticos (Stock menor a 5)
  const displayedProducts = filterCritical ? products.filter(p => (p.stock ?? 10) < 5) : products;

  return (
    <div>
      {apiError && <div className="alert alert-warning m-3">{apiError}</div>}
    <div className="container my-5 text-white">
      <h2 className="mb-4">Gestión del Sistema</h2>
      {loadingData && <p className="text-secondary" role="status">Cargando datos desde MySQL...</p>}

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
                          src={resolveProductImage(product?.imagen, '')}
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
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => confirmRemoveCategory(index)}>Eliminar</button>
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
                {orders.length === 0 ? <tr><td colSpan="5" className="text-center">Todavía no hay pedidos registrados en el backend.</td></tr> : orders.map((o) => (
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
            <p className="mt-3"><strong>Nombre:</strong> {currentUser?.nombre || 'No disponible'}</p>
            <p><strong>Correo Electrónico:</strong> {currentUser?.email || 'No disponible'}</p>
            <p><strong>Rol:</strong> {currentUser?.rol || 'No disponible'}</p>
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

      {/* ALERTA EN PÁGINA: ELIMINAR CATEGORÍA */}
      {Boolean(deleteCategoryConfirm) && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border border-danger">
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title text-danger">⚠️ Confirmar Eliminación</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setDeleteCategoryConfirm(null)} aria-label="Cerrar" />
              </div>
              <div className="modal-body">
                <p className="mb-0">¿Estás seguro de que deseas eliminar la categoría <strong>"{deleteCategoryConfirm?.nombre}"</strong>?</p>
              </div>
              <div className="modal-footer border-top border-secondary">
                <button type="button" className="btn btn-secondary" onClick={() => setDeleteCategoryConfirm(null)}>Cancelar</button>
                <button type="button" className="btn btn-danger" onClick={handleExecuteDeleteCategory}>Sí, Eliminar</button>
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
                    <label htmlFor="prodPrecioOferta" className="form-label">Precio de oferta (opcional)</label>
                    <input name="precioOferta" defaultValue={productModal?.precioOferta || ''} id="prodPrecioOferta" type="number" min="0" className="form-control" placeholder="Ej: 12000" />
                    <div className="form-check mt-2">
                      <input name="enOferta" defaultChecked={Boolean(productModal?.enOferta)} id="prodEnOferta" type="checkbox" className="form-check-input" />
                      <label htmlFor="prodEnOferta" className="form-check-label">Marcar como juego en oferta</label>
                    </div>
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
                    <label htmlFor="userPassword" className="form-label">Contraseña {userModal?.index !== null ? '(dejar vacía para conservar la actual)' : ''}</label>
                    <input name="password" defaultValue="" id="userPassword" type="password" className="form-control" minLength="6" autoComplete="new-password" placeholder={userModal?.index === null ? 'Contraseña para iniciar sesión' : 'Nueva contraseña (opcional)'} required={userModal?.index === null} />
                    {userModal?.index === null && <small className="text-secondary">La contraseña se usará para iniciar sesión en Yakarta.</small>}
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
                <p><strong>Cliente:</strong> {invoiceModal?.cliente}</p>\n                <p><strong>Estado:</strong> {invoiceModal?.estado || 'Sin estado'}</p>
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
     {/* yocuando borro los juegos: hola soy mixe */}
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
      {(Boolean(productModal) || Boolean(userModal) || Boolean(categoryModal) || Boolean(invoiceModal) || Boolean(userHistoryModal) || Boolean(deleteProductConfirm) || Boolean(deleteUserConfirm) || Boolean(deleteCategoryConfirm)) && (
        <div className="modal-backdrop fade show" />
      )}
    </div>
    </div>
  );
}