import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatCLP } from '../lib/utils';

const AMOUNTS = [1000, 2000, 5000, 10000];

export default function Fondos() {
  const { user, setUser } = useAuth();
  const [balance, setBalance] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let active = true;
    if (user?.rol !== 'Cliente') {
      setLoading(false);
      return () => { active = false; };
    }
    api.balance()
      .then((value) => active && setBalance(value))
      .catch((error) => active && setMessage(error.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [user]);

  async function addFunds(amount) {
    if (!user || user.rol !== 'Cliente') {
      setMessage('Inicia sesión con una cuenta de cliente para agregar fondos.');
      return;
    }
    setProcessing(true);
    setMessage('');
    try {
      const nextBalance = await api.addFunds(amount);
      setBalance(nextBalance);
      setUser((current) => current ? { ...current, saldo: nextBalance } : current);
      setMessage(`Se agregaron ${formatCLP(amount)} a tu saldo. El nuevo saldo quedó guardado en MySQL.`);
    } catch (error) {
      setMessage(error.message || 'No se pudieron agregar fondos.');
    } finally {
      setProcessing(false);
    }
  }

  if (!user || user.rol !== 'Cliente') {
    return <div className="container py-5 text-white"><div className="alert alert-warning">Esta página está disponible para cuentas con rol Cliente. <Link to="/login" className="alert-link">Inicia sesión</Link>.</div></div>;
  }

  return (
    <main className="container py-5 text-white" style={{ maxWidth: 850 }}>
      <div className="card bg-dark border-secondary shadow p-4">
        <div className="text-center mb-4"><i className="bi bi-wallet2 display-4 text-info" /><h2 className="mt-2">Agregar fondos</h2><p className="text-secondary">Elige un monto para añadirlo al saldo de tu cuenta.</p></div>
        <div className="text-center rounded bg-black p-4 mb-4"><p className="text-secondary mb-1">Tu saldo actual</p><h2 className="text-success mb-0" aria-live="polite">{loading ? 'Cargando...' : formatCLP(balance)}</h2></div>
        {message && <div className={`alert ${message.includes('No se') ? 'alert-danger' : 'alert-success'}`} role="status">{message}</div>}
        <div className="row g-3">
          {AMOUNTS.map((amount) => <div className="col-6 col-md-3" key={amount}><button type="button" className="btn btn-outline-info w-100 h-100 py-3" onClick={() => addFunds(amount)} disabled={loading || processing}><i className="bi bi-plus-circle me-2" />{formatCLP(amount)}</button></div>)}
        </div>
        <p className="small text-secondary mt-3 mb-0">Modo demostración: los abonos se simulan y quedan registrados en MySQL; no se realiza un cobro bancario real.</p>
        <div className="text-center mt-4"><Link to="/tienda" className="btn btn-primary">Volver a la tienda</Link></div>
      </div>
    </main>
  );
}
