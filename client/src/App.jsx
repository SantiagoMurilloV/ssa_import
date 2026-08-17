import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { CatalogProvider } from './context/CatalogContext.jsx';
import { SiteContentProvider } from './context/SiteContentContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { useReveal } from './hooks/useReveal.js';
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';
import CartDrawer from './components/layout/CartDrawer.jsx';
import SkyBackground from './components/layout/SkyBackground.jsx';
import HomePage from './pages/HomePage.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import ThankYouPage from './pages/ThankYouPage.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Shell() {
  useReveal();
  return (
    <>
      <SkyBackground />
      <ScrollToTop />
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route path="/producto/:id" element={<ProductPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/gracias" element={<ThankYouPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
      <Footer />
      <CartDrawer />
    </>
  );
}

export default function App() {
  return (
    <CatalogProvider>
      <SiteContentProvider>
        <CartProvider>
          <Shell />
        </CartProvider>
      </SiteContentProvider>
    </CatalogProvider>
  );
}
