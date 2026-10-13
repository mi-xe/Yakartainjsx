import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCLP, getCustomerBalance, getCurrentUser, setCustomerBalance } from '../lib/storage';

const AMOUNTS = [1000, 2000, 5000, 10000];

export default function Fondos() {
  const user = getCurrentUser();
  const [balance, setBalance] = useState(() => user?.rol === 'Cliente' ? getCustomerBalance(user.email) : 0);
  const [message, setMessage] = useState('');

  function addFunds(amount) {
    if (!user || user.rol !== 'Cliente') {
      setMessage('Inicia sesión con una cuenta de cliente para agregar fondos.');
      return;
    }
    const nextBalance = getCustomerBalance(user.email) + amount;
    setCustomerBalance(user.email, nextBalance);
    setBalance(nextBalance);
    setMessage(`Se agregaron ${formatCLP(amount)} a tu saldo.`);
  }

  if (!user || user.rol !== 'Cliente') {
    return <div className="container py-5 text-white"><div className="alert alert-warning">Esta página está disponible para cuentas con rol Cliente. <Link to="/login" className="alert-link">Inicia sesión</Link>.</div></div>;
  }

  return (
    <main className="container py-5 text-white" style={{ maxWidth: 850 }}>
      <div className="card bg-dark border-secondary shadow p-4">
        <div className="text-center mb-4"><i className="bi bi-wallet2 display-4 text-info" /><h2 className="mt-2">Agregar fondos</h2><p className="text-secondary">Elige un monto para añadirlo al saldo de tu cuenta.</p></div>
        <div className="text-center rounded bg-black p-4 mb-4"><p className="text-secondary mb-1">Tu saldo actual</p><h2 className="text-success mb-0" aria-live="polite">{formatCLP(balance)}</h2></div>
        {message && <div className="alert alert-success" role="status">{message}</div>}
        <div className="row g-3">
          {AMOUNTS.map((amount) => <div className="col-6 col-md-3" key={amount}><button type="button" className="btn btn-outline-info w-100 h-100 py-3" onClick={() => addFunds(amount)}><i className="bi bi-plus-circle me-2" />{formatCLP(amount)}</button></div>)}
        </div>
        <p className="small text-secondary mt-3 mb-0">Modo demostración: los fondos se guardan localmente en este navegador y persisten durante la navegación.</p>
        <div className="text-center mt-4"><Link to="/tienda" className="btn btn-primary">Volver a la tienda</Link></div>
      </div>
    </main>
  );
}
