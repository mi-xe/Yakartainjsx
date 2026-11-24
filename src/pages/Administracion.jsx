import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatCLP, normalizeProductImagePath, resolveProductImage } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { findLegacyDescription, findLegacyPreviewImages } from '../lib/catalogMetadata';

const PLATFORM_OPTIONS = [
  'PC',
  'PlayStation 2',
  'PlayStation 3',
  'PlayStation 4',
  'PlayStation 5',
  'PSP',
  'Xbox Series S/X',
  'Nintendo Switch',
  'Nintendo Switch 2',
];


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
        setProducts(productRows.map(p => ({ ...p, precio: Number(p.precio), precioOferta: p.precioOferta == null ? null : Number(p.precioOferta), enOferta: Boolean(p.enOferta), stock: Math.max(0, Number(p.stock ?? 0)), descripcion: p.descripcion || '', imagenesPreview: Array.isArray(p.imagenesPreview) ? p.imagenesPreview : [], plataformas: Array.isArray(p.plataformas) && p.plataformas.length ? p.plataformas : ['PC'] })));
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

    // Actualiza el inventario cuando el administrador vuelve a esta pestaña,
    // por ejemplo después de que un cliente completa una compra en otra ventana.
    const refreshProducts = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const rows = await api.products();
        if (!alive) return;
        setProducts(rows.map(p => ({
          ...p,
          precio: Number(p.precio),
          precioOferta: p.precioOferta == null ? null : Number(p.precioOferta),
          enOferta: Boolean(p.enOferta),
          stock: Math.max(0, Number(p.stock ?? 0)),
          descripcion: p.descripcion || '',
          imagenesPreview: Array.isArray(p.imagenesPreview) ? p.imagenesPreview : [],
          plataformas: Array.isArray(p.plataformas) && p.plataformas.length ? p.plataformas : ['PC'],
        })));
      } catch (error) {
        if (alive) setApiError(`No se pudo actualizar el inventario: ${error.message}`);
      }
    };
    window.addEventListener('focus', refreshProducts);
    document.addEventListener('visibilitychange', refreshProducts);
    return () => {
      alive = false;
      window.removeEventListener('focus', refreshProducts);
      document.removeEventListener('visibilitychange', refreshProducts);
    };
  }, []);

  // Control de Navegación: 'dashboard' | 'products' | 'categories' | 'users' | 'orders' | 'profile'
  const [tab, setTab] = useState('dashboard');
  const [filterCritical, setFilterCritical] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(0);
  const [savingProduct, setSavingProduct] = useState(false);

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
      setProductModal({ index: null, nombre: '', precio: '', precioOferta: '', enOferta: false, stock: 10, categoria: categories[0] || '', imagen: '', descripcion: '', imagenesPreview: [''], plataformas: ['PC'] });
    } else {
      setProductModal({
        index,
        ...products[index],
        descripcion: products[index].descripcion || findLegacyDescription(products[index].nombre),
        imagenesPreview: Array.isArray(products[index].imagenesPreview) && products[index].imagenesPreview.length ? products[index].imagenesPreview : findLegacyPreviewImages(products[index].nombre),
        plataformas: Array.isArray(products[index].plataformas) && products[index].plataformas.length ? products[index].plataformas : ['PC'],
      });
    }
  }


  function updateProductDraft(field, value) {
    setProductModal(current => current ? { ...current, [field]: value } : current);
  }

  async function uploadImageFile(file, onUploaded) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setApiError('El archivo seleccionado no es una imagen.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setApiError('Cada imagen puede pesar como máximo 8 MB.');
      return;
    }
    setUploadingImages(current => current + 1);
    try {
      const result = await api.uploadProductImage(file);
      if (!result?.url) throw new Error('El backend no devolvió la dirección de la imagen.');
      onUploaded(result.url);
      setApiError('');
    } catch (error) {
      setApiError(`No se pudo subir la imagen: ${error.message}`);
    } finally {
      setUploadingImages(current => Math.max(0, current - 1));
    }
  }

  function handleCoverUpload(event) {
    const file = event.target.files?.[0];
    uploadImageFile(file, url => updateProductDraft('imagen', url));
    event.target.value = '';
  }

  function handlePreviewUpload(index, event) {
    const file = event.target.files?.[0];
    uploadImageFile(file, url => updatePreviewImage(index, url));
    event.target.value = '';
  }

  // Permite subir varias capturas en una sola selección. Los archivos se copian
  // al servidor; al producto se le guardan sus URL, no una ruta local de Windows.
  async function handlePreviewFilesUpload(event) {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = '';
    if (!selectedFiles.length || !productModal) return;

    const currentImages = productModal.imagenesPreview || [];
    const occupiedSlots = currentImages.filter(value => String(value || '').trim()).length;
    const capacity = Math.max(0, 12 - occupiedSlots);
    const errors = [];
    const validFiles = [];

    selectedFiles.forEach(file => {
      if (!file.type.startsWith('image/')) errors.push(`${file.name}: no es una imagen.`);
      else if (file.size > 8 * 1024 * 1024) errors.push(`${file.name}: supera el límite de 8 MB.`);
      else validFiles.push(file);
    });

    if (validFiles.length > capacity) {
      errors.push(`Solo se pueden agregar ${capacity} captura(s) más; el límite es 12.`);
    }
    const filesToUpload = validFiles.slice(0, capacity);
    if (!filesToUpload.length) {
      if (errors.length) setApiError(errors.join(' '));
      return;
    }

    setUploadingImages(count => count + filesToUpload.length);
    try {
      const results = await Promise.allSettled(filesToUpload.map(file => api.uploadProductImage(file)));
      const uploadedUrls = results
        .filter(result => result.status === 'fulfilled' && result.value?.url)
        .map(result => result.value.url);
      const failedUploads = results.filter(result => result.status === 'rejected' || !result.value?.url).length;

      if (uploadedUrls.length) {
        setProductModal(current => {
          if (!current) return current;
          const images = [...(current.imagenesPreview || [])];
          uploadedUrls.forEach(url => {
            const emptyIndex = images.findIndex(value => !String(value || '').trim());
            if (emptyIndex >= 0) images[emptyIndex] = url;
            else if (images.length < 12) images.push(url);
          });
          return { ...current, imagenesPreview: images };
        });
      }

      if (errors.length || failedUploads) {
        const failureText = failedUploads ? `${failedUploads} imagen(es) no pudieron subirse. Revisa que el backend esté iniciado y que tu sesión tenga permisos de administrador.` : '';
        setApiError([errors.join(' '), failureText].filter(Boolean).join(' '));
      } else {
        setApiError('');
      }
    } finally {
      setUploadingImages(count => Math.max(0, count - filesToUpload.length));
    }
  }

  function updatePreviewImage(index, value) {
    setProductModal(current => {
      if (!current) return current;
      const imagenesPreview = [...(current.imagenesPreview || [])];
      imagenesPreview[index] = value;
      return { ...current, imagenesPreview };
    });
  }

  function addPreviewImage() {
    if ((productModal?.imagenesPreview || []).length >= 12) {
      setApiError('Puedes agregar un máximo de 12 imágenes de previsualización.');
      return;
    }
    setProductModal(current => current ? { ...current, imagenesPreview: [...(current.imagenesPreview || []), ''] } : current);
  }

  function removePreviewImage(index) {
    setProductModal(current => current ? { ...current, imagenesPreview: (current.imagenesPreview || []).filter((_, imageIndex) => imageIndex !== index) } : current);
  }

  function togglePlatform(platform, checked) {
    setProductModal(current => {
      if (!current) return current;
      const platforms = new Set(current.plataformas || []);
      if (checked) platforms.add(platform);
      else platforms.delete(platform);
      return { ...current, plataformas: PLATFORM_OPTIONS.filter(option => platforms.has(option)) };
    });
  }

  async function submitProduct(event) {
    event.preventDefault();
    if (!productModal || savingProduct || uploadingImages > 0) return;

    const form = new FormData(event.currentTarget);
    let coverImage = '';
    let previewImages = [];
    try {
      coverImage = normalizeProductImagePath(productModal.imagen || '');
      previewImages = [...new Set((productModal.imagenesPreview || [])
        .map(value => normalizeProductImagePath(value))
        .filter(Boolean))];
    } catch (error) {
      setApiError(error.message);
      return;
    }

    if (!coverImage) {
      setApiError('Selecciona una portada o sube una imagen principal antes de guardar.');
      return;
    }

    const product = {
      nombre: (form.get('nombre') || '').toString().trim(),
      precio: Number(form.get('precio')) || 0,
      precioOferta: Number(form.get('precioOferta')) || null,
      enOferta: form.get('enOferta') === 'on',
      stock: Number(form.get('stock')) || 0,
      categoria: (form.get('categoria') || '').toString().trim(),
      imagen: coverImage,
      descripcion: (productModal.descripcion || '').toString().trim(),
      imagenesPreview: previewImages,
      plataformas: [...new Set((productModal.plataformas || [])
        .filter(value => PLATFORM_OPTIONS.includes(value)))],
    };

    if (!product.plataformas.length) {
      setApiError('Selecciona al menos una plataforma para el juego.');
      return;
    }

    setSavingProduct(true);
    let savedProduct = null;
    try {
      if (productModal.index !== null && !(productModal.id ?? products[productModal.index]?.id)) {
        throw new Error('No se encontró el identificador del producto que intentas editar. Cierra y vuelve a abrir el formulario desde la lista de productos.');
      }
      savedProduct = productModal.index === null
        ? await api.createProduct(product)
        : await api.updateProduct(productModal.id ?? products[productModal.index].id, product);

      if (!savedProduct?.id) throw new Error('El backend no devolvió el identificador del producto guardado.');

      // La respuesta de escritura no basta: leemos el registro desde un GET
      // independiente para confirmar que SQL contiene portada y galería.
      let persisted;
      try {
        persisted = await api.product(savedProduct.id);
      } catch (error) {
        // El POST/PUT ya devolvió un ID: refleja el producto en el estado local
        // y conserva ese ID en el modal. Así, una verificación GET fallida no
        // provoca que el siguiente intento cree un duplicado.
        const existingIndex = products.findIndex(item => Number(item.id) === Number(savedProduct.id));
        const optimistic = {
          ...product,
          id: savedProduct.id,
          precio: Number(product.precio),
          precioOferta: product.precioOferta == null ? null : Number(product.precioOferta),
          enOferta: Boolean(product.enOferta),
        };
        const optimisticProducts = existingIndex >= 0
          ? products.map(item => Number(item.id) === Number(savedProduct.id) ? optimistic : item)
          : [...products, optimistic];
        const savedIndex = optimisticProducts.findIndex(item => Number(item.id) === Number(savedProduct.id));
        saveProducts(optimisticProducts);
        setProductModal({ ...productModal, ...optimistic, index: savedIndex });
        throw new Error(`El backend aceptó el guardado, pero no se pudo verificar mediante GET /productos/${savedProduct.id}: ${error.message}. El formulario conserva el ID y las capturas para que puedas reintentar sin crear un duplicado.`);
      }

      const persistedImages = Array.isArray(persisted?.imagenesPreview)
        ? persisted.imagenesPreview.map(value => normalizeProductImagePath(value)).filter(Boolean)
        : [];
      const sameImages = persistedImages.length === product.imagenesPreview.length
        && persistedImages.every((value, index) => value === product.imagenesPreview[index]);
      const sameCover = normalizeProductImagePath(persisted?.imagen || '') === product.imagen;
      const sameDescription = String(persisted?.descripcion ?? '').trim() === product.descripcion;
      const persistedPlatforms = Array.isArray(persisted?.plataformas) ? persisted.plataformas : [];
      const samePlatforms = persistedPlatforms.length === product.plataformas.length
        && persistedPlatforms.every((value, index) => value === product.plataformas[index]);

      const normalized = {
        ...persisted,
        precio: Number(persisted.precio),
        precioOferta: persisted.precioOferta == null ? null : Number(persisted.precioOferta),
        enOferta: Boolean(persisted.enOferta),
        descripcion: String(persisted.descripcion ?? ''),
        imagenesPreview: persistedImages,
        plataformas: Array.isArray(persisted.plataformas) && persisted.plataformas.length ? persisted.plataformas : product.plataformas,
      };

      const existingIndex = products.findIndex(item => Number(item.id) === Number(savedProduct.id));
      const next = existingIndex >= 0
        ? products.map(item => Number(item.id) === Number(savedProduct.id) ? normalized : item)
        : [...products, normalized];
      const savedIndex = next.findIndex(item => Number(item.id) === Number(savedProduct.id));

      if (!sameImages || !sameCover || !sameDescription || !samePlatforms) {
        saveProducts(next);
        setProductModal({ ...productModal, ...product, id: savedProduct.id, index: savedIndex });
        const missing = [
          !sameCover ? 'portada' : '',
          !sameImages ? 'galería de capturas' : '',
          !sameDescription ? 'descripción' : '',
          !samePlatforms ? 'plataformas' : '',
        ].filter(Boolean).join(', ');
        setApiError(`El producto existe, pero el backend no devolvió los datos recién enviados (${missing}). Revisa que estés ejecutando el backend actualizado y aplica database/migrate_product_metadata.sql en la misma base de datos configurada en DB_URL. El formulario quedó abierto para que puedas corregirlo sin crear un duplicado.`);
        return;
      }

      saveProducts(next);
      setApiError('');
      setProductModal(null);
    } catch (error) {
      setApiError(`No se pudo guardar el producto: ${error.message}`);
    } finally {
      setSavingProduct(false);
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
    <div className="container-fluid admin-container text-white py-4 px-3 px-xl-5">
      <header className="admin-header mb-4">
        <div>
          <span className="admin-eyebrow">YAKARTA / CONTROL CENTRAL</span>
          <h2 className="mb-1">Gestión del sistema</h2>
          <p className="admin-header-subtitle mb-0">Administra el catálogo, las cuentas y las operaciones de tu tienda.</p>
        </div>
        <div className="admin-user-chip">
          <span className="admin-user-avatar"><i className="bi bi-person-fill-gear" /></span>
          <span><strong>{currentUser?.nombre || 'Administrador'}</strong><small>Sesión de administrador</small></span>
        </div>
      </header>

      <div className="admin-workspace">
        <aside className="admin-sidebar" aria-label="Navegación de administración">
          <span className="admin-sidebar-label">MENÚ PRINCIPAL</span>
          <button type="button" className={`admin-nav-link ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}><i className="bi bi-grid-1x2-fill" /><span>Resumen</span></button>
          <button type="button" className={`admin-nav-link ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}><i className="bi bi-controller" /><span>Juegos y productos</span><small>{products.length}</small></button>
          <button type="button" className={`admin-nav-link ${tab === 'categories' ? 'active' : ''}`} onClick={() => setTab('categories')}><i className="bi bi-collection" /><span>Categorías</span></button>
          <span className="admin-sidebar-label admin-sidebar-spaced">GESTIÓN DE TIENDA</span>
          <button type="button" className={`admin-nav-link ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}><i className="bi bi-people-fill" /><span>Usuarios</span><small>{users.length}</small></button>
          <button type="button" className={`admin-nav-link ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}><i className="bi bi-receipt-cutoff" /><span>Órdenes y boletas</span><small>{orders.length}</small></button>
          <span className="admin-sidebar-label admin-sidebar-spaced">CUENTA</span>
          <button type="button" className={`admin-nav-link ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}><i className="bi bi-person-circle" /><span>Mi perfil</span></button>
          <div className="admin-sidebar-footer"><i className="bi bi-shield-lock-fill" /><span>Acceso protegido<small>Panel de administración</small></span></div>
        </aside>

        <main className="admin-main">
          {loadingData && <p className="text-secondary" role="status">Cargando datos desde MySQL...</p>}

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
                  <th>Plataformas</th>
                  <th>Stock</th>
                  <th>Precio</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {displayedProducts.length === 0 ? (
                  <tr><td colSpan="7" className="text-center">No hay productos disponibles.</td></tr>
                ) : (
                  displayedProducts.map((product) => {
                    const productIndex = products.findIndex(item => item.id === product.id);
                    return (
                    <tr key={product?.id ?? `prod-${productIndex}`}>
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
                      <td><div className="admin-table-platforms">{(product?.plataformas?.length ? product.plataformas : ['PC']).map(platform => <span key={platform}>{platform}</span>)}</div></td>
                      <td><span className={`badge ${product?.stock < 5 ? 'bg-danger' : 'bg-success'}`}>{product?.stock ?? 10}</span></td>
                      <td>{typeof formatCLP === 'function' ? formatCLP(product?.precio) : `$${product?.precio}`}</td>
                      <td className="text-center">
                        <button type="button" className="btn btn-sm btn-outline-warning me-1" onClick={() => openProduct(productIndex)}>
                          <i className="bi bi-pencil" /> Editar
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => confirmRemoveProduct(productIndex)}>
                          <i className="bi bi-trash" /> Eliminar
                        </button>
                      </td>
                    </tr>
                    );
                  })
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

        </main>
      </div>

      {/* MODAL PRODUCTO */}
      {Boolean(productModal) && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <form className="modal-content admin-product-modal admin-product-form" onSubmit={submitProduct}>
                <div className="modal-header">
                  <div><span className="admin-eyebrow">CATÁLOGO / FICHA DE JUEGO</span><h5 className="modal-title">{productModal?.index === null ? 'Agregar nuevo juego' : 'Editar juego'}</h5></div>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setProductModal(null)} aria-label="Cerrar" disabled={uploadingImages > 0 || savingProduct} />
                </div>
                <div className="modal-body">
                  <div className="row g-4">
                    <div className="col-lg-7">
                      <section className="admin-form-section">
                        <h6><i className="bi bi-card-text me-2" />Información del juego</h6>
                        <div className="row g-3">
                          <div className="col-md-8"><label htmlFor="prodNombre" className="form-label">Nombre del juego</label><input name="nombre" defaultValue={productModal?.nombre || ''} id="prodNombre" className="form-control" required maxLength="160" /></div>
                          <div className="col-md-4"><label htmlFor="prodCategoria" className="form-label">Categoría</label><select name="categoria" defaultValue={productModal?.categoria || categories[0] || ''} id="prodCategoria" className="form-select" required>{categories.map((c, i) => <option key={i} value={c}>{c}</option>)}</select></div>
                          <div className="col-md-4"><label htmlFor="prodPrecio" className="form-label">Precio (CLP)</label><input name="precio" defaultValue={productModal?.precio ?? ''} id="prodPrecio" type="number" min="1" className="form-control" required /></div>
                          <div className="col-md-4"><label htmlFor="prodStock" className="form-label">Stock actual</label><input name="stock" defaultValue={productModal?.stock ?? 10} id="prodStock" type="number" min="0" className="form-control" required /></div>
                          <div className="col-md-4"><label htmlFor="prodPrecioOferta" className="form-label">Precio de oferta</label><input name="precioOferta" defaultValue={productModal?.precioOferta ?? ''} id="prodPrecioOferta" type="number" min="0" className="form-control" placeholder="Opcional" /></div>
                          <div className="col-12"><div className="form-check admin-sale-check"><input name="enOferta" defaultChecked={Boolean(productModal?.enOferta)} id="prodEnOferta" type="checkbox" className="form-check-input" /><label htmlFor="prodEnOferta" className="form-check-label">Marcar como juego en oferta</label></div></div>
                          <div className="col-12"><label htmlFor="prodDescripcion" className="form-label">Descripción personalizada</label><textarea name="descripcion" value={productModal?.descripcion || ''} onChange={event => updateProductDraft('descripcion', event.target.value)} id="prodDescripcion" className="form-control" rows="5" maxLength="3000" placeholder="Describe el juego, su historia, características o modos de juego..." /><small className="admin-field-help">Esta descripción aparecerá en la ficha de vista previa de la tienda.</small></div>
                          <div className="col-12"><label htmlFor="prodImagen" className="form-label">Imagen principal / portada</label><input name="imagen" value={productModal?.imagen || ''} onChange={event => updateProductDraft('imagen', event.target.value)} id="prodImagen" className="form-control" placeholder="https://... o /uploads/productos/portada.jpg" required disabled={savingProduct || uploadingImages > 0} /><div className="admin-cover-upload-row"><label className="admin-file-picker"><i className="bi bi-cloud-arrow-up me-2" />Subir portada desde el equipo<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleCoverUpload} disabled={uploadingImages > 0 || savingProduct} /></label>{productModal?.imagen && <img src={resolveProductImage(productModal.imagen, '')} alt="Vista previa de portada" onError={event => { event.currentTarget.style.visibility = 'hidden'; }} />}</div><small className="admin-field-help">Pega una URL pública o una ruta del servidor (/uploads/...). Para imágenes de tu PC, usa el botón de subida (JPG, PNG, WEBP o GIF; máximo 8 MB).</small></div>
                        </div>
                      </section>

                      <section className="admin-form-section mt-4">
                        <div className="admin-form-section-heading"><h6><i className="bi bi-images me-2" />Imágenes de previsualización</h6><div className="admin-gallery-actions"><label className={`admin-file-picker admin-gallery-file-picker ${uploadingImages > 0 || savingProduct ? 'disabled' : ''}`}><i className="bi bi-cloud-upload me-2" />Subir desde el equipo<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple onChange={handlePreviewFilesUpload} disabled={uploadingImages > 0 || savingProduct || (productModal?.imagenesPreview || []).filter(value => String(value || '').trim()).length >= 12} /></label><button type="button" className="btn admin-add-image-btn" onClick={addPreviewImage} disabled={(productModal?.imagenesPreview || []).length >= 12 || uploadingImages > 0 || savingProduct}><i className="bi bi-plus-lg me-1" />Agregar URL</button></div></div>
                        <p className="admin-field-help mb-3">Sube una o varias imágenes desde tu computador o pega una URL/ruta pública. Las rutas locales como C:\Users\... solo existen en tu PC: para que aparezcan en la tienda debes subir esos archivos al servidor.</p>
                        <div className="admin-image-list">
                          {(productModal?.imagenesPreview || []).map((image, index) => (
                            <div className="admin-image-row" key={`preview-${index}`}>
                              <span className="admin-image-index">{String(index + 1).padStart(2, '0')}</span>
                              <input name="imagenesPreview" value={image} onChange={event => updatePreviewImage(index, event.target.value)} className="form-control" disabled={savingProduct || uploadingImages > 0} aria-label={`URL de imagen ${index + 1}`} placeholder="URL pública, /uploads/... o imgtienda/..." maxLength="1000" />
                              {image && <img src={resolveProductImage(image, '')} alt={`Vista previa ${index + 1}`} onError={event => { event.currentTarget.style.visibility = 'hidden'; }} />}
                              <label className="admin-image-upload-btn" title="Subir archivo de imagen"><i className="bi bi-upload" /><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={event => handlePreviewUpload(index, event)} disabled={uploadingImages > 0 || savingProduct} /></label>
                              <button type="button" className="admin-remove-image-btn" onClick={() => removePreviewImage(index)} aria-label={`Quitar imagen ${index + 1}`} disabled={uploadingImages > 0 || savingProduct}><i className="bi bi-trash3" /></button>
                            </div>
                          ))}
                          {(!productModal?.imagenesPreview || productModal.imagenesPreview.length === 0) && <div className="admin-empty-images"><i className="bi bi-image" /><span>Aún no agregas capturas. Usa “Agregar imagen” para crear la galería.</span></div>}
                        </div>
                        <button type="button" className="btn admin-add-image-btn admin-add-image-bottom" onClick={addPreviewImage} disabled={(productModal?.imagenesPreview || []).length >= 12 || uploadingImages > 0 || savingProduct}>
                          <i className="bi bi-plus-lg me-1" />Agregar otra imagen ({(productModal?.imagenesPreview || []).length}/12)
                        </button>
                      </section>
                    </div>

                    <div className="col-lg-5">
                      <section className="admin-form-section admin-platform-section">
                        <h6><i className="bi bi-controller me-2" />Plataformas disponibles</h6>
                        <p className="admin-field-help">Selecciona una o varias plataformas compatibles. Estas etiquetas aparecerán en la vista previa de la tienda.</p>
                        <div className="admin-platform-grid">
                          {PLATFORM_OPTIONS.map(platform => (
                            <label key={platform} className={`admin-platform-option ${(productModal?.plataformas || []).includes(platform) ? 'selected' : ''}`}>
                              <input type="checkbox" name="plataformas" value={platform} checked={(productModal?.plataformas || []).includes(platform)} onChange={event => togglePlatform(platform, event.target.checked)} disabled={savingProduct || uploadingImages > 0} />
                              <span className="admin-platform-check"><i className="bi bi-check2" /></span>
                              <span className="admin-platform-name">{platform === 'PC' ? <><i className="bi bi-pc-display me-2" />{platform}</> : <><i className="bi bi-controller me-2" />{platform}</>}</span>
                            </label>
                          ))}
                        </div>
                        <div className="admin-platform-summary">
                          <small>ETIQUETAS SELECCIONADAS</small>
                          {(productModal?.plataformas || []).length ? <div>{productModal.plataformas.map(platform => <span key={platform}>{platform}</span>)}</div> : <p className="mb-0">Selecciona al menos una plataforma.</p>}
                        </div>
                      </section>
                      <section className="admin-preview-hint mt-4">
                        <i className="bi bi-eye" />
                        <div><strong>Vista previa en la tienda</strong><p className="mb-0">La ficha del juego mostrará la descripción personalizada, la galería de capturas y las etiquetas de todas las plataformas seleccionadas.</p></div>
                      </section>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  {uploadingImages > 0 && <span className="admin-upload-status"><i className="bi bi-arrow-repeat" /> Subiendo {uploadingImages} imagen(es)...</span>}
                  <button type="button" className="btn btn-outline-light" onClick={() => setProductModal(null)} disabled={uploadingImages > 0 || savingProduct}>Cancelar</button>
                  <button type="submit" className="btn admin-save-product-btn" disabled={uploadingImages > 0 || savingProduct}>
                    {savingProduct ? <><i className="bi bi-arrow-repeat me-2 admin-save-spinner" />Guardando...</> : <><i className="bi bi-check2-circle me-2" />{productModal?.index === null ? 'Crear juego' : 'Guardar cambios'}</>}
                  </button>
                </div>
            </form>
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