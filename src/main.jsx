import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles.css';

import PageLayout from './components/PageLayout';
import HomePage from './pages/HomePage';
import BlogsPage from './pages/BlogsPage';
import DeadByDaylightPage from './pages/DeadByDaylightPage';
import NeedForSpeedPage from './pages/NeedForSpeedPage';
import MidnightClubPage from './pages/MidnightClubPage';
import AboutPage from './pages/AboutPage';
import StorePage from './pages/StorePage';
import CartPage from './pages/CartPage';
import PurchasesPage from './pages/PurchasesPage';
import ContactPage from './pages/ContactPage';
import AddressPage from './pages/AddressPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SummaryPage from './pages/SummaryPage';
import AdminPage from './pages/AdminPage';

function Layout({ children }) {
  return <PageLayout>{children}</PageLayout>;
}

function Routed({ component, layout = true }) {
  return layout ? <Layout>{component}</Layout> : component;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Routed component={<HomePage />} />} />
        <Route path="/blogs" element={<Routed component={<BlogsPage />} />} />
        <Route path="/blogs/dead-by-daylight" element={<Routed component={<DeadByDaylightPage />} />} />
        <Route path="/blogs/need-for-speed-shift" element={<Routed component={<NeedForSpeedPage />} />} />
        <Route path="/midnight-club" element={<Routed component={<MidnightClubPage />} />} />
        <Route path="/somos" element={<Routed component={<AboutPage />} />} />
        <Route path="/tienda" element={<Routed component={<StorePage />} />} />
        <Route path="/carrito" element={<Routed component={<CartPage />} layout={false} />} />
        <Route path="/compras" element={<Routed component={<PurchasesPage />} />} />
        <Route path="/contactanos" element={<Routed component={<ContactPage />} />} />
        <Route path="/direccion" element={<Routed component={<AddressPage />} layout={false} />} />
        <Route path="/login" element={<Routed component={<LoginPage />} layout={false} />} />
        <Route path="/registro" element={<Routed component={<RegisterPage />} layout={false} />} />
        <Route path="/resumen" element={<Routed component={<SummaryPage />} layout={false} />} />
        <Route path="/admin" element={<Routed component={<AdminPage />} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<App />);
