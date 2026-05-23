import React, { useState, useEffect } from "react";
import "./index.css";

// Detectar si estamos dentro del browser interno de Instagram (o Facebook)
const isInstagramBrowser = () => {
  const ua = navigator.userAgent || "";
  return /Instagram|FBAN|FBAV|FB_IAB/.test(ua);
};

const MENU = [
  {
    id: "pastelito-membrillo",
    name: "Pastelito de Membrillo",
    description: "Pastelito artesanal hojaldrado de dulce de membrillo. Unidad $1.200 | 1/2 docena $6.000 | Docena $10.000",
    category: "pastelitos",
    image: "/pastelito-membrillo.jpeg"
  },
  {
    id: "pastelito-batata",
    name: "Pastelito de Batata",
    description: "Pastelito artesanal hojaldrado de dulce de batata. Unidad $1.200 | 1/2 docena $6.000 | Docena $10.000",
    category: "pastelitos",
    image: "/pastelito.jpeg"
  },
  {
    id: "pastelito-ddl",
    name: "Pastelito de Dulce de Leche",
    description: "Pastelito artesanal hojaldrado de dulce de leche. Unidad $1.200 | 1/2 docena $6.000 | Docena $10.000",
    category: "pastelitos",
    image: "/pastelito-ddl.jpeg"
  },
  {
    id: "medialuna-dulce",
    name: "Medialuna Dulce",
    description: "Medialuna de manteca dulce, tierna y glaseada. Unidad $1.200 | 1/2 docena $6.000 | Docena $10.000",
    category: "medialunas",
    image: "/medialuna.jpeg",
    soldOut: true
  }
];

const calculatePrice = (quantity) => {
  const docenas = Math.floor(quantity / 12);
  const restoDespuesDocenas = quantity % 12;
  const mediasDocenas = Math.floor(restoDespuesDocenas / 6);
  const unidadesSueltas = restoDespuesDocenas % 6;
  return (docenas * 10000) + (mediasDocenas * 6000) + (unidadesSueltas * 1200);
};

const MIXED_DOZEN_IDS = ["pastelito-membrillo", "pastelito-batata"];

const calculateCartTotal = (groupedCart) => {
  const mixedItems = groupedCart.filter(item => MIXED_DOZEN_IDS.includes(item.id));
  const otherItems = groupedCart.filter(item => !MIXED_DOZEN_IDS.includes(item.id));
  const totalMixedUnits = mixedItems.reduce((acc, item) => acc + item.quantity, 0);
  const fullMixedDozens = Math.floor(totalMixedUnits / 12);
  const leftoverMixed = totalMixedUnits % 12;
  const mixedTotal = (fullMixedDozens * 10000) + calculatePrice(leftoverMixed);
  const othersTotal = otherItems.reduce((acc, item) => acc + calculatePrice(item.quantity), 0);
  return mixedTotal + othersTotal;
};

const PAYMENTS = [
  { id: "efectivo", label: "Efectivo", icon: "cash" },
  { id: "transferencia", label: "Transferencia / QR", icon: "phone" }
];

const WA_NUMBER = "5493704628845";
const APP_URL = "https://kepastelito.vercel.app";
const formatPrice = (price) => `$${price.toLocaleString("es-AR")}`;

const clearAppState = () => {
  ["kp_page", "kp_cart", "kp_delivery", "kp_address", "kp_payment"].forEach(k => {
    try { sessionStorage.removeItem(k); } catch {}
  });
};

const saveState = (key, value) => {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {}
};

const loadState = (key, fallback) => {
  try {
    const item = sessionStorage.getItem(key);
    if (item === null) return fallback;
    const parsed = JSON.parse(item);
    if (typeof parsed !== typeof fallback) return fallback;
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    return parsed;
  } catch { return fallback; }
};

const loadCart = () => {
  try {
    const raw = sessionStorage.getItem("kp_cart");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(item =>
      item && typeof item.id === "string" && typeof item.name === "string" && typeof item.uid === "number"
    );
  } catch { return []; }
};

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() { clearAppState(); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1a0f0a', color: '#f0e0d5', padding: '32px', textAlign: 'center', gap: '24px' }}>
          <p style={{ fontSize: '16px', color: '#a08070' }}>Algo salió mal. Tocá el botón para volver al inicio.</p>
          <button onClick={() => { clearAppState(); window.location.reload(); }} style={{ background: 'linear-gradient(135deg, #e07830, #f09050)', color: '#fff', border: 'none', padding: '14px 32px', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
            Volver al inicio
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Pantalla que se muestra cuando el usuario abre desde Instagram
function InstagramWarning() {
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

  const handleOpen = () => {
    // En iOS el truco es usar un link con safari-https:// o simplemente copiar la URL
    if (isIOS) {
      // Intentar abrir en Safari directamente
      window.location.href = APP_URL;
    } else {
      window.open(APP_URL, "_blank");
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, #2a1810 0%, #1a0f0a 50%, #120a06 100%)',
      color: '#f0e0d5',
      padding: '32px',
      textAlign: 'center',
      gap: '28px'
    }}>
      <img src="/logo-kepa-sin-fondo.png" alt="Kepastelito" style={{ height: '80px', width: 'auto' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '32px', color: '#e07830', letterSpacing: '2px' }}>
          Abrí en tu navegador
        </h2>
        <p style={{ fontSize: '15px', color: '#a08070', lineHeight: '1.6', maxWidth: '300px' }}>
          Para hacer tu pedido por WhatsApp necesitás abrir esta página en Safari o Chrome.
        </p>
      </div>

      {/* Instrucción visual */}
      <div style={{
        background: 'rgba(224, 120, 48, 0.1)',
        border: '1px solid #c05820',
        borderRadius: '16px',
        padding: '20px 24px',
        maxWidth: '320px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
          <span style={{ fontSize: '24px' }}>1</span>
          <span style={{ fontSize: '14px', color: '#c0a090' }}>
            Tocá los <b style={{ color: '#e07830' }}>tres puntos</b> (···) arriba a la derecha
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
          <span style={{ fontSize: '24px' }}>2</span>
          <span style={{ fontSize: '14px', color: '#c0a090' }}>
            Elegí <b style={{ color: '#e07830' }}>"Abrir en Safari"</b> o <b style={{ color: '#e07830' }}>"Abrir en navegador"</b>
          </span>
        </div>
      </div>

      {/* Botón copiar URL como alternativa */}
      <button
        onClick={() => {
          navigator.clipboard?.writeText(APP_URL).catch(() => {});
          alert("¡Link copiado! Pegalo en Safari o Chrome.");
        }}
        style={{
          background: 'linear-gradient(135deg, #e07830, #f09050)',
          color: '#fff',
          border: 'none',
          padding: '16px 32px',
          borderRadius: '14px',
          fontSize: '15px',
          fontWeight: '700',
          cursor: 'pointer',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          boxShadow: '0 4px 20px rgba(224,120,48,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        Copiar link
      </button>
    </div>
  );
}

function App() {
  const [page, setPage] = useState(() => {
    const saved = loadState("kp_page", "menu");
    return saved === "done" ? "menu" : saved;
  });
  const [cart, setCart] = useState(loadCart);
  const [deliveryMode, setDeliveryMode] = useState(() => loadState("kp_delivery", "local"));
  const [address, setAddress] = useState(() => loadState("kp_address", ""));
  const [payment, setPayment] = useState(() => loadState("kp_payment", "efectivo"));
  const [quantities, setQuantities] = useState({});

  useEffect(() => { saveState("kp_page", page); }, [page]);
  useEffect(() => { saveState("kp_cart", cart); }, [cart]);
  useEffect(() => { saveState("kp_delivery", deliveryMode); }, [deliveryMode]);
  useEffect(() => { saveState("kp_address", address); }, [address]);
  useEffect(() => { saveState("kp_payment", payment); }, [payment]);

  const groupedCart = cart.reduce((acc, item) => {
    const existing = acc.find(g => g.id === item.id);
    if (existing) { existing.quantity += 1; existing.uids.push(item.uid); }
    else acc.push({ ...item, quantity: 1, uids: [item.uid] });
    return acc;
  }, []);

  const subtotal = calculateCartTotal(groupedCart);
  const mixedUnits = groupedCart.filter(item => MIXED_DOZEN_IDS.includes(item.id)).reduce((acc, item) => acc + item.quantity, 0);
  const fullMixedDozens = Math.floor(mixedUnits / 12);
  const leftoverMixed = mixedUnits % 12;

  const getQuantity = (productId) => quantities[productId] || 1;
  const updateQuantity = (productId, delta) => {
    setQuantities(prev => ({ ...prev, [productId]: Math.max(1, (prev[productId] || 1) + delta) }));
  };

  const addToCart = (product) => {
    const qty = getQuantity(product.id);
    const newItems = Array.from({ length: qty }, () => ({ ...product, uid: Date.now() + Math.random() }));
    setCart(prev => [...prev, ...newItems]);
    setQuantities(prev => ({ ...prev, [product.id]: 1 }));
  };

  const removeOneFromGroup = (productId) => {
    const itemToRemove = cart.find(item => item.id === productId);
    if (itemToRemove) setCart(cart.filter(item => item.uid !== itemToRemove.uid));
  };
  const addOneToGroup = (productId) => {
    const product = MENU.find(p => p.id === productId);
    if (product) setCart(prev => [...prev, { ...product, uid: Date.now() + Math.random() }]);
  };
  const removeAllFromGroup = (productId) => setCart(cart.filter(item => item.id !== productId));

  const goToMenu = () => { setCart([]); clearAppState(); setPage("menu"); };

  const sendOrder = () => {
    const lines = ["* PEDIDO — KEPASTELITO *", "------------------------", ""];
    groupedCart.forEach((item, i) => {
      lines.push(`${i + 1}. ${item.name} (x${item.quantity})`);
      lines.push(`   ${formatPrice(calculatePrice(item.quantity))}`);
      lines.push("");
    });
    if (fullMixedDozens > 0) {
      lines.push("⭐ DESCUENTO DOCENA MIXTA (Batata + Membrillo):");
      lines.push(`   ${fullMixedDozens} docena(s) mixta(s) x $10.000`);
      if (leftoverMixed > 0) lines.push(`   + ${leftoverMixed} unidad(es) suelta(s)`);
      lines.push("");
    }
    lines.push("------------------------");
    lines.push(`TOTAL: ${formatPrice(subtotal)}`);
    if (deliveryMode === "envio") {
      lines.push(`Envio: A domicilio (Costo a coordinar)`);
      lines.push(`Direccion: ${address}`);
    } else {
      lines.push(`Retiro: Por el local`);
      lines.push(`Direccion del local: Paraguay 169`);
    }
    lines.push(`Forma de pago: ${PAYMENTS.find(p => p.id === payment).label}`);
    lines.push("------------------------", "", "Gracias por tu pedido!");

    clearAppState();
    setCart([]);
    setPage("done");
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="brand" onClick={() => setPage("menu")}>
          <img src="/logo-kepa-sin-fondo.png" alt="Kepastelito Logo" className="logo-img" />
        </div>
        <button className="cart-btn" onClick={() => setPage("cart")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          Ver Pedido
          {cart.length > 0 && <span className="badge">{cart.length}</span>}
        </button>
      </nav>

      <main className="main-content">
        {page === "menu" && (
          <div className="product-grid">
            {MENU.map((product) => (
              <div key={product.id} className="card" style={product.soldOut ? { opacity: 0.75 } : {}}>
                <div className="card-img-wrapper" style={{ position: 'relative' }}>
                  <img src={product.image} alt={product.name} className="card-img" style={product.soldOut ? { filter: 'grayscale(40%)' } : {}} />
                  {product.soldOut && (
                    <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontWeight: '700', fontSize: '13px', padding: '4px 10px', borderRadius: '20px', letterSpacing: '0.5px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                      ¡Muy pronto!
                    </div>
                  )}
                </div>
                <div className="card-body">
                  <h3 className="card-title">{product.name}</h3>
                  <p className="card-desc">{product.description}</p>
                  <div className="card-footer">
                    {product.soldOut ? (
                      <div style={{ width: '100%', textAlign: 'center', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontStyle: 'italic' }}>
                        Próximamente disponible 🥐
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '10px' }}>
                          <span className="price">{formatPrice(calculatePrice(getQuantity(product.id)))}</span>
                          <div className="quantity-selector">
                            <button className="qty-btn" onClick={() => updateQuantity(product.id, -1)} disabled={getQuantity(product.id) <= 1}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            </button>
                            <span className="qty-value">{getQuantity(product.id)}</span>
                            <button className="qty-btn" onClick={() => updateQuantity(product.id, 1)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            </button>
                          </div>
                        </div>
                        {getQuantity(product.id) % 6 === 5 && <div className="alerta-promo">¡Agregá 1 más para precio promocional!</div>}
                        {getQuantity(product.id) % 6 === 0 && <div className="alerta-promo alerta-aplicada">¡Precio promocional aplicado!</div>}
                        <button className="btn-primary" onClick={() => addToCart(product)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle' }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          Agregar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {page === "cart" && (
          <div className="checkout-section">
            <h2>Tu Pedido</h2>
            {cart.length === 0 ? (
              <p className="empty-msg">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 16px', opacity: 0.5 }}>
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                El carrito esta vacio
              </p>
            ) : (
              <div className="cart-items">
                {groupedCart.map((item) => (
                  <div key={item.id} style={{ display: 'flex', flexDirection: 'column', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                    <div className="cart-row" style={{ borderBottom: 'none', paddingBottom: '0', marginBottom: '8px' }}>
                      <div className="item-name">{item.name}</div>
                      <div className="item-actions">
                        <div className="cart-qty-controls">
                          <button className="cart-qty-btn" onClick={() => removeOneFromGroup(item.id)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          </button>
                          <span className="cart-qty-value">{item.quantity}</span>
                          <button className="cart-qty-btn" onClick={() => addOneToGroup(item.id)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          </button>
                        </div>
                        <span className="item-price">{formatPrice(calculatePrice(item.quantity))}</span>
                        <button className="btn-remove" onClick={() => removeAllFromGroup(item.id)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    </div>
                    {item.quantity % 6 === 5 && <div className="alerta-promo" style={{ width: '100%', fontSize: '12px', padding: '6px' }}>¡Agregá 1 más para precio promocional!</div>}
                    {item.quantity % 6 === 0 && <div className="alerta-promo alerta-aplicada" style={{ width: '100%', fontSize: '12px', padding: '6px' }}>¡Precio promocional aplicado!</div>}
                  </div>
                ))}
                {fullMixedDozens > 0 && (
                  <div className="alerta-promo alerta-aplicada" style={{ width: '100%', fontSize: '13px', padding: '8px 10px', marginBottom: '8px' }}>
                    ⭐ {fullMixedDozens} docena{fullMixedDozens > 1 ? 's' : ''} mixta{fullMixedDozens > 1 ? 's' : ''} (Batata + Membrillo) — precio docena aplicado
                  </div>
                )}
                {leftoverMixed > 0 && leftoverMixed >= 6 && (
                  <div className="alerta-promo" style={{ width: '100%', fontSize: '13px', padding: '8px 10px', marginBottom: '8px' }}>
                    🥐 ¡Agregá {12 - leftoverMixed} más entre Batata y Membrillo para precio docena mixta ($10.000)!
                  </div>
                )}
              </div>
            )}

            {cart.length > 0 && (
              <div className="summary-box">
                <div className="form-group">
                  <label>Opciones de entrega</label>
                  <div className="toggle-group">
                    <button className={`btn-toggle ${deliveryMode === "local" ? "active" : ""}`} onClick={() => setDeliveryMode("local")}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      Retiro por el local
                    </button>
                    <button className={`btn-toggle ${deliveryMode === "envio" ? "active" : ""}`} onClick={() => setDeliveryMode("envio")}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                      Envio a domicilio
                    </button>
                  </div>
                </div>
                {deliveryMode === "local" && (
                  <div className="form-group">
                    <div className="local-address-box">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <div className="local-address-info">
                        <span className="local-address-label">Direccion del local</span>
                        <span className="local-address-text">Paraguay 169</span>
                      </div>
                    </div>
                  </div>
                )}
                {deliveryMode === "envio" && (
                  <div className="form-group">
                    <label>Direccion de entrega</label>
                    <input type="text" className="input-text" placeholder="Calle, numero, barrio..." value={address} onChange={(e) => setAddress(e.target.value)} />
                    <small className="hint">El costo del envio depende del cadete y la distancia.</small>
                  </div>
                )}
                <div className="form-group">
                  <label>Forma de pago</label>
                  <div className="toggle-group">
                    {PAYMENTS.map((method) => (
                      <button key={method.id} className={`btn-toggle ${payment === method.id ? "active" : ""}`} onClick={() => setPayment(method.id)}>
                        {method.icon === "cash" ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><circle cx="12" cy="12" r="3"/></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                        )}
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="total-row">
                  <span>Total a pagar:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <button className="btn-whatsapp" onClick={sendOrder} disabled={deliveryMode === "envio" && address.trim() === ""}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Realizar Pedido por WhatsApp
                </button>
              </div>
            )}
            <button className="btn-back" onClick={() => setPage("menu")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              Volver al menu
            </button>
          </div>
        )}

        {page === "done" && (
          <div className="success-section">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#25d366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 24px' }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <h2>Pedido enviado!</h2>
            <p>Se ha abierto WhatsApp con el detalle de tu pedido listo para enviar.<br/>Gracias por elegirnos!</p>
            <button className="btn-primary" onClick={goToMenu} style={{ marginTop: '16px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              Volver al inicio
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Root() {
  // Si estamos en el browser de Instagram, mostrar pantalla de aviso
  if (isInstagramBrowser()) return <InstagramWarning />;
  return <ErrorBoundary><App /></ErrorBoundary>;
}
