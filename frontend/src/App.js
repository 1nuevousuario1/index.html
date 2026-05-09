import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import "@/App.css";

import { CartProvider } from "./lib/CartContext";
import Header from "./components/Header";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import Rewards from "./pages/Rewards";
import PrivacyNotice from "./pages/PrivacyNotice";
import TermsConditions from "./pages/TermsConditions";
import Contact from "./pages/Contact";

function App() {
  return (
    <div className="App min-h-screen flex flex-col bg-[#F9F9F9]">
      <BrowserRouter>
        <CartProvider>
          <Toaster position="top-right" richColors />
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/catalogo" element={<Catalog />} />
              <Route path="/producto/:id" element={<ProductDetail />} />
              <Route path="/carrito" element={<Cart />} />
              <Route path="/recompensas" element={<Rewards />} />
              <Route path="/aviso-de-privacidad" element={<PrivacyNotice />} />
              <Route path="/terminos-y-condiciones" element={<TermsConditions />} />
              <Route path="/contacto" element={<Contact />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
            </Routes>
          </main>
          <Footer />
        </CartProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
