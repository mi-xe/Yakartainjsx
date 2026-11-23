import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCLP } from '../lib/storage';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const AMOUNTS = [1000, 2000, 5000, 10000];

export default function Fondos() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loadingAmount, setLoadingAmount] = useState(null);

  async function addFunds(amount) {
    setLoadingAmount(amount); setMessage(''); setError('');
    try {
      await api.addFunds(amount);
      await refreshUser();
      setMessage(`Se agregaron ${formatCLP(amount)} a tu saldo.`);
    } catch (err) { setError(err.message || 'No se pudieron agregar fondos.'); }
    finally { setLoadingAmount(null); }
  }

  if (authLoading) return <div className="container py-5 text-white">Comprobando sesión...</div>;

  if (!user || user.rol !== 'Cliente') {
    return <div className="container py-5 text-white"><div className="alert alert-warning">Esta página está disponible para cuentas con rol Cliente. <Link to="/login" className="alert-link">Inicia sesión</Link>.</div></div>;
  }

  return (
    <main className="container py-5 text-white" style={{ maxWidth: 850 }}>
      <div className="card bg-dark border-secondary shadow p-4">
        <div className="text-center mb-4"><i className="bi bi-wallet2 display-4 text-info" /><h2 className="mt-2">Agregar fondos</h2><p className="text-secondary">Elige un monto para añadirlo al saldo de tu cuenta.</p></div>
        <div className="text-center rounded bg-black p-4 mb-4"><p className="text-secondary mb-1">Tu saldo actual</p><h2 className="text-success mb-0" aria-live="polite">{formatCLP(user.saldo)}</h2></div>
        {message && <div className="alert alert-success" role="status">{message}</div>}
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        <div className="row g-3">{AMOUNTS.map((amount) => <div className="col-6 col-md-3" key={amount}><button type="button" className="btn btn-outline-info w-100 h-100 py-3" onClick={() => addFunds(amount)} disabled={loadingAmount !== null}><i className="bi bi-plus-circle me-2" />{loadingAmount === amount ? 'Procesando...' : formatCLP(amount)}</button></div>)}</div>
        <p className="small text-secondary mt-3 mb-0">Modo demostración: el saldo se almacena en MySQL en tu cuenta. No se realiza un cobro bancario real.</p>
        <div className="d-flex flex-wrap justify-content-center gap-2 mt-4"><Link to="/resumen" className="btn btn-success">Volver al resumen de compra</Link><Link to="/tienda" className="btn btn-outline-light">Volver a la tienda</Link></div>
      </div>
    </main>
  );
}
