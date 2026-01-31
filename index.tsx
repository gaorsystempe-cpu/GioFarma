
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Search, ShoppingCart, Plus, Minus, X, RefreshCw, Settings, 
  ShoppingBag, ShieldCheck, ChevronRight, Package, Activity, 
  Layers, FileText, Heart, Truck, Store, HeartPulse, ChevronLeft, 
  Filter, LayoutGrid, Eye, EyeOff, Verified, ArrowUpRight, PackagePlus,
  CheckCircle2, Info, BookOpen, Sparkles, Zap, Shield, Clock, ChevronDown, 
  MapPin, User, Phone, Send, ChevronRight as ChevronRightIcon, Copy, Check,
  Building2, MessageCircle, Image as ImageIcon, Trash2, AlertCircle, Globe
} from 'lucide-react';

/* ============================================================
   ENGINE: ODOO XML-RPC MASTER (V29 - HYBRID PROXY SYSTEM)
   ============================================================ */

const xmlEscape = (str: string) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const serialize = (value: any): string => {
  if (value === null || value === undefined) return '<value><nil/></value>';
  let content = '';
  if (typeof value === 'number') {
    content = Number.isInteger(value) ? `<int>${value}</int>` : `<double>${value}</double>`;
  } else if (typeof value === 'string') {
    content = `<string>${xmlEscape(value)}</string>`;
  } else if (typeof value === 'boolean') {
    content = `<boolean>${value ? '1' : '0'}</boolean>`;
  } else if (Array.isArray(value)) {
    content = `<array><data>${value.map(v => serialize(v)).join('')}</data></array>`;
  } else if (typeof value === 'object') {
    if (value instanceof Date) {
      const iso = value.toISOString().replace(/\.\d+Z$/, '');
      content = `<dateTime.iso8601>${iso}</dateTime.iso8601>`;
    } else {
      content = `<struct>${Object.entries(value).map(([k, v]) =>
        `<member><name>${xmlEscape(k)}</name>${serialize(v)}</member>`
      ).join('')}</struct>`;
    }
  }
  return `<value>${content}</value>`;
};

const parseValue = (node: Element): any => {
  const child = node.firstElementChild;
  if (!child) return node.textContent;
  switch (child.tagName.toLowerCase()) {
    case 'string': return child.textContent;
    case 'int':
    case 'i4': return parseInt(child.textContent || '0', 10);
    case 'double': return parseFloat(child.textContent || '0');
    case 'boolean': return child.textContent === '1';
    case 'datetime.iso8601': return new Date(child.textContent || '');
    case 'array': return Array.from(child.querySelector('data')?.children || []).map(parseValue);
    case 'struct':
      const obj: any = {};
      Array.from(child.children).forEach(m => {
        const n = m.querySelector('name');
        const v = m.querySelector('value');
        if (n && v) obj[n.textContent || ''] = parseValue(v);
      });
      return obj;
    case 'nil': return null;
    default: return child.textContent;
  }
};

const PUBLIC_PROXIES = [
  { name: 'Backup (IO)', fn: (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}` },
  { name: 'Backup (AO)', fn: (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}` },
  { name: 'Backup (CT)', fn: (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}` }
];

class OdooClient {
  constructor(private url: string, private db: string, private onLog?: (msg: string) => void) {
    this.url = this.url.replace(/\/+$/, '').trim();
    if (!this.url.startsWith('http')) this.url = 'https://' + this.url;
  }

  async rpcCall(endpoint: string, method: string, params: any[]) {
    const xml = `<?xml version="1.0"?><methodCall><methodName>${method}</methodName><params>${params.map(p => `<param>${serialize(p)}</param>`).join('')}</params></methodCall>`;
    const baseUrl = `${this.url}/xmlrpc/2/${endpoint}`;
    
    // 1. Intentar Vía Backend Proxy Propio (ELIMINA CORS Y NETWORK ERRORS)
    try {
      if (this.onLog) this.onLog(`[Conector] Intentando vía Backend Proxy Local...`);
      const response = await fetch('/api/odoo-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: baseUrl, body: xml }),
        signal: AbortSignal.timeout(15000) 
      });

      if (response.ok) {
        const text = await response.text();
        const doc = new DOMParser().parseFromString(text, 'text/xml');
        const fault = doc.querySelector('fault value');
        if (fault) throw new Error(parseValue(fault).faultString || 'Error Odoo');
        const resultNode = doc.querySelector('params param value');
        if (this.onLog) this.onLog(`[Conector] ¡Éxito vía Backend Proxy!`);
        return resultNode ? parseValue(resultNode) : null;
      }
      if (this.onLog) this.onLog(`[Info] Backend Proxy no disponible (${response.status}). Activando rotación pública...`);
    } catch (e: any) {
      if (this.onLog) this.onLog(`[Info] Fallo en Backend Proxy: ${e.message}. Usando sistema de respaldo.`);
    }

    // 2. Sistema de Respaldo: Rotación de Proxies Públicos
    let lastError = "Todos los túneles de conexión están congestionados.";
    for (const proxy of PUBLIC_PROXIES) {
      try {
        if (this.onLog) this.onLog(`[Respaldo] Probando vía ${proxy.name}...`);
        const targetUrl = proxy.fn(baseUrl);
        const response = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/xml', 'X-Requested-With': 'XMLHttpRequest' },
          body: xml,
          mode: 'cors',
          signal: AbortSignal.timeout(12000) 
        });
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const text = await response.text();
        if (!text.includes('methodResponse')) throw new Error("Respuesta inválida.");
        const doc = new DOMParser().parseFromString(text, 'text/xml');
        const fault = doc.querySelector('fault value');
        if (fault) throw new Error(parseValue(fault).faultString || 'Error Odoo');
        const resultNode = doc.querySelector('params param value');
        if (this.onLog) this.onLog(`[Respaldo] ¡Éxito vía ${proxy.name}!`);
        return resultNode ? parseValue(resultNode) : null;
      } catch (e: any) { 
        lastError = e.message;
        if (this.onLog) this.onLog(`[Fallo] ${proxy.name}: ${e.message}`);
      }
    }
    throw new Error(lastError);
  }
}

const ADMIN_PASS = "admin123";
const DEFAULT_CONFIG = {
  url: "https://baltodano.facturaclic.pe",
  db: "baltodano_master",
  user: "luis@gaorsystem.com",
  apiKey: "8d06549a109c1c0f8847610a9f8d68250de8bd39",
  whatsapp: "51981383242",
  yape: "981383242",
  companyName: "GIOFARMA",
  hiddenProducts: [],
  hiddenCategories: [],
  banners: [
    { img: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80", title: "Salud en cada paso", desc: "Los mejores precios del mercado." },
    { img: "https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?auto=format&fit=crop&w=1200&q=80", title: "Cuidado Personal", desc: "Todo para tu bienestar diario." }
  ]
};

const PharmaLogo = ({ config, onAdminRequest }: { config: any, onAdminRequest: () => void }) => {
  const [clicks, setClicks] = useState(0);
  const timerRef = useRef<any>(null);
  const handleClick = () => {
    setClicks(c => c + 1);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setClicks(0), 1000);
    if (clicks + 1 >= 3) { setClicks(0); onAdminRequest(); }
  };
  const name = config?.companyName || "GIOFARMA";
  return (
    <div onClick={handleClick} className="flex items-center gap-3 cursor-pointer group select-none active:scale-95 transition-transform">
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center bg-[#e6007e] text-white shadow-xl group-hover:scale-105 transition-all"><HeartPulse size={28} /></div>
      <div className="flex flex-col -space-y-1">
        <span className="text-xl md:text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{name.substring(0, Math.ceil(name.length/2))}<span className="text-[#8cc63f]">{name.substring(Math.ceil(name.length/2))}</span></span>
        <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Portal Autopedido</span>
      </div>
    </div>
  );
};

const BannerCarousel = ({ config, compact = false }: { config: any, compact?: boolean }) => {
  const validBanners = useMemo(() => (config?.banners?.length > 0 ? config.banners : DEFAULT_CONFIG.banners), [config?.banners]);
  const [curr, setCurr] = useState(0);
  useEffect(() => {
    if (validBanners.length <= 1) return;
    const it = setInterval(() => setCurr(c => (c + 1) % validBanners.length), 7000);
    return () => clearInterval(it);
  }, [validBanners.length]);

  return (
    <div className={`relative w-full overflow-hidden rounded-[3.5rem] shadow-2xl animate-scale-in ${compact ? 'h-[250px] md:h-[400px]' : 'h-[350px] md:h-[550px]'} bg-slate-100`}>
      {validBanners.map((b: any, i: number) => (
        <div key={i} className={`absolute inset-0 transition-all duration-1000 ${i === curr ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
          <img src={b.img} className="w-full h-full object-cover" alt={b.title} />
          <div className={`absolute left-8 md:left-12 z-20 max-w-xl space-y-4 ${compact ? 'bottom-8' : 'bottom-12'}`}>
            <h2 className={`font-black text-white italic uppercase leading-[0.9] tracking-tighter ${compact ? 'text-3xl md:text-5xl' : 'text-4xl md:text-7xl'}`}>{b.title}</h2>
            <p className="text-white/90 font-medium uppercase italic tracking-wide text-sm md:text-2xl">{b.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const CheckoutModal = ({ cart, config, onClose, onOrderSuccess }: any) => {
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [userData, setUserData] = useState({ name: '', phone: '', address: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [numCopied, setNumCopied] = useState(false);
  const total = cart.reduce((acc: number, item: any) => acc + (item.finalPrice * item.q), 0);

  const handleCreateOrder = async () => {
    if (!userData.name || !userData.phone || (orderType === 'delivery' && !userData.address)) return alert("Datos incompletos");
    if (!numCopied) return alert("Copia el número de Yape");
    setIsProcessing(true);
    try {
      const client = new OdooClient(config.url, config.db);
      const uid = await client.rpcCall('common', 'authenticate', [config.db, config.user, config.apiKey, {}]);
      const partners = await client.rpcCall('object', 'execute_kw', [config.db, uid, config.apiKey, 'res.partner', 'search', [[['phone', '=', userData.phone]]]]);
      let partnerId = partners?.[0];
      if (!partnerId) partnerId = await client.rpcCall('object', 'execute_kw', [config.db, uid, config.apiKey, 'res.partner', 'create', [{ name: userData.name, phone: userData.phone, street: userData.address || 'Tienda', customer_rank: 1 }]]);
      const orderId = await client.rpcCall('object', 'execute_kw', [config.db, uid, config.apiKey, 'sale.order', 'create', [{ partner_id: partnerId, note: `Pedido Web: ${orderType.toUpperCase()} - YAPE` }]]);
      for (const item of cart) { await client.rpcCall('object', 'execute_kw', [config.db, uid, config.apiKey, 'sale.order.line', 'create', [{ order_id: orderId, product_id: item.id, product_uom_qty: item.q, price_unit: item.finalPrice, name: item.name }]]); }
      const summary = cart.map((i: any) => `• ${i.q}x ${i.name}`).join('%0A');
      const waMsg = `*🚀 NUEVO PEDIDO #${orderId}*%0A%0A*CLIENTE:* ${userData.name}%0A*DETALLE:*%0A${summary}%0A%0A*TOTAL: S/ ${total.toFixed(2)}*`;
      window.open(`https://wa.me/${config.whatsapp}?text=${waMsg}`, '_blank');
      onOrderSuccess();
    } catch (e: any) { alert(e.message); } finally { setIsProcessing(false); }
  };

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-slate-900/95 backdrop-blur-xl p-4">
      <div className="bg-white w-full max-w-[480px] rounded-[3rem] p-10 space-y-8 animate-scale-in">
        <div className="flex gap-4">
           <button onClick={() => setOrderType('delivery')} className={`flex-1 p-6 rounded-3xl border-2 flex flex-col items-center gap-2 ${orderType === 'delivery' ? 'bg-[#e6007e] border-[#e6007e] text-white shadow-lg' : 'border-slate-50 text-slate-300'}`}><Truck size={32}/><span>Domicilio</span></button>
           <button onClick={() => setOrderType('pickup')} className={`flex-1 p-6 rounded-3xl border-2 flex flex-col items-center gap-2 ${orderType === 'pickup' ? 'bg-[#8cc63f] border-[#8cc63f] text-white shadow-lg' : 'border-slate-50 text-slate-300'}`}><Store size={32}/><span>Tienda</span></button>
        </div>
        <input type="text" placeholder="Nombre completo" className="w-full px-8 py-5 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-[#e6007e] outline-none" value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} />
        <input type="tel" placeholder="Número celular" className="w-full px-8 py-5 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-[#e6007e] outline-none" value={userData.phone} onChange={e => setUserData({...userData, phone: e.target.value})} />
        {orderType === 'delivery' && <input type="text" placeholder="Dirección" className="w-full px-8 py-5 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-[#e6007e] outline-none" value={userData.address} onChange={e => setUserData({...userData, address: e.target.value})} />}
        <div className="p-6 bg-slate-50 rounded-2xl border flex items-center justify-between">
           <div><span className="text-[9px] font-black text-slate-400 uppercase">Yape:</span><div className="text-xl font-black italic">{config.yape}</div></div>
           <button onClick={() => {navigator.clipboard.writeText(config.yape); setNumCopied(true);}} className={`p-4 rounded-xl ${numCopied ? 'bg-[#8cc63f]' : 'bg-[#e6007e]'} text-white`}>{numCopied ? <Check size={18}/> : <Copy size={18}/>}</button>
        </div>
        <button disabled={isProcessing || !numCopied} onClick={handleCreateOrder} className={`w-full py-7 rounded-[2rem] font-black uppercase shadow-2xl flex items-center justify-center gap-4 ${isProcessing || !numCopied ? 'bg-slate-100 text-slate-300' : 'bg-[#e6007e] text-white hover:scale-105 active:scale-95 transition-all'}`}>
          {isProcessing ? <RefreshCw className="animate-spin"/> : <Send/>} {isProcessing ? 'Enviando...' : 'Confirmar Pedido'}
        </button>
        <button onClick={onClose} className="w-full text-[10px] font-black text-slate-300 uppercase">Cerrar</button>
      </div>
    </div>
  );
};

const App = () => {
  const [view, setView] = useState<'home' | 'shop' | 'admin'>('home');
  const [adminTab, setAdminTab] = useState<'status' | 'catalog' | 'banners' | 'config'>('status');
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);

  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('giofarma_config_v28');
    return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
  });

  const hiddenProducts = useMemo(() => new Set<number>(config.hiddenProducts || []), [config.hiddenProducts]);
  const hiddenCategories = useMemo(() => new Set<string>(config.hiddenCategories || []), [config.hiddenCategories]);
  const allCategories = useMemo(() => Array.from(new Set(products.map(p => p.category))).sort(), [products]);

  const addLog = (msg: string) => setSyncLogs(p => [new Date().toLocaleTimeString() + ": " + msg, ...p].slice(0, 30));
  const saveConfig = (newConfig: any) => { setConfig(newConfig); localStorage.setItem('giofarma_config_v28', JSON.stringify(newConfig)); };

  const syncERP = useCallback(async (isSilent = false) => {
    if (!config.apiKey || !config.url || !config.db) return setError("Configuración incompleta.");
    if (!isSilent) setLoading(true);
    setError(null);
    addLog("Iniciando secuencia de sincronización segura...");
    try {
      const client = new OdooClient(config.url, config.db, addLog);
      const uid = await client.rpcCall('common', 'authenticate', [config.db, config.user, config.apiKey, {}]);
      if (!uid) throw new Error("Acceso denegado.");
      const raw = await client.rpcCall('object', 'execute_kw', [config.db, uid, config.apiKey, 'product.product', 'search_read', [[['sale_ok', '=', true]]], { fields: ['name', 'list_price', 'qty_available', 'categ_id', 'image_128', 'display_name'], limit: 60 }]);
      if (Array.isArray(raw)) {
        const mapped = raw.map(p => ({ id: p.id, name: p.display_name || p.name, price: p.list_price || 0, stock: p.qty_available || 0, category: Array.isArray(p.categ_id) ? p.categ_id[1] : 'OTROS', finalPrice: p.list_price || 0, image: p.image_128 ? `data:image/png;base64,${p.image_128}` : null }));
        setProducts(mapped);
        addLog(`Catálogo actualizado: ${mapped.length} productos listos.`);
      }
    } catch (e: any) { setError(e.message); addLog(e.message); } finally { if (!isSilent) setLoading(false); }
  }, [config]);

  useEffect(() => { syncERP(); }, [syncERP]);

  const filteredProducts = useMemo(() => products.filter(p => !hiddenProducts.has(p.id) && !hiddenCategories.has(p.category) && p.name.toLowerCase().includes(searchQuery.toLowerCase())), [products, searchQuery, hiddenProducts, hiddenCategories]);

  if (view === 'home') {
    return (
      <div className="min-h-screen bg-white">
        <header className="h-28 px-10 md:px-24 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-50 border-b">
          <PharmaLogo config={config} onAdminRequest={() => setView('admin')} />
          <button onClick={() => setView('shop')} className="px-12 py-5 bg-slate-950 text-white rounded-3xl font-black uppercase text-[10px] shadow-xl hover:scale-105 active:scale-95 flex items-center gap-3 transition-all"><ShoppingBag size={20} className="text-[#e6007e]"/> Tienda Online</button>
        </header>
        <main className="p-10 md:p-24 space-y-24 max-w-[1800px] mx-auto">
           <h1 className="text-6xl md:text-[10rem] font-black text-slate-900 leading-[0.8] italic uppercase text-center animate-fade-up">Cuidamos <br/><span className="text-[#e6007e]">tu salud.</span></h1>
           <BannerCarousel config={config} />
        </main>
      </div>
    );
  }

  if (view === 'shop') {
    return (
      <div className="min-h-screen bg-[#f8f9fb]">
        {showCheckout && <CheckoutModal cart={cart} config={config} onClose={() => setShowCheckout(false)} onOrderSuccess={() => {setCart([]); setView('home');}} />}
        <header className="bg-white sticky top-0 z-[200] px-10 md:px-24 py-8 border-b shadow-sm space-y-6">
           <div className="flex items-center justify-between">
              <PharmaLogo config={config} onAdminRequest={() => setView('admin')} />
              <button onClick={() => cart.length > 0 && setShowCheckout(true)} className="relative w-14 h-14 bg-slate-950 text-white rounded-2xl flex items-center justify-center shadow-xl">{cart.length > 0 && <span className="absolute -top-3 -right-3 w-8 h-8 bg-[#e6007e] text-white text-[11px] font-black rounded-full flex items-center justify-center border-4 border-white animate-bounce">{cart.length}</span>}<ShoppingCart size={24} /></button>
           </div>
           <div className="relative"><input type="text" placeholder="Buscar en Odoo..." className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-[#e6007e] rounded-2xl font-bold outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20}/></div>
        </header>
        <main className="p-10 md:p-24 space-y-16">
           {/* Diapositivas en el catálogo de la web */}
           <BannerCarousel config={config} compact={true} />
           
           {loading ? (
             <div className="py-32 text-center">
               <RefreshCw size={48} className="animate-spin text-[#e6007e] mx-auto mb-4" />
               <p className="text-slate-400 font-black uppercase tracking-widest">Consultando Odoo...</p>
             </div>
           ) : error ? (
             <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-red-50 p-12">
               <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
               <p className="text-red-400 font-bold mb-4">{error}</p>
               <button onClick={() => syncERP()} className="px-8 py-4 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px]">Reintentar Conexión</button>
             </div>
           ) : (
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                {filteredProducts.map(p => (
                  <div key={p.id} className="bg-white p-6 rounded-[2.5rem] border shadow-sm hover:shadow-2xl transition-all group animate-fade-up">
                    <div className="aspect-square bg-slate-50 rounded-3xl p-4 mb-4 flex items-center justify-center overflow-hidden">{p.image ? <img src={p.image} className="h-full object-contain" /> : <Package className="text-slate-200"/>}</div>
                    <h3 className="text-xs font-black uppercase italic line-clamp-2 h-8 leading-tight">{p.name}</h3>
                    <div className="mt-4 flex items-center justify-between"><span className="text-lg font-black italic">S/ {p.price.toFixed(2)}</span><button onClick={() => setCart([...cart, {...p, q: 1}])} className="p-2 bg-slate-950 text-white rounded-lg hover:bg-[#e6007e] transition-colors"><Plus size={16}/></button></div>
                  </div>
                ))}
             </div>
           )}
        </main>
      </div>
    );
  }

  if (view === 'admin') {
    if (!adminAuth) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-10">
           <div className="w-full max-w-lg bg-white rounded-[4rem] p-16 shadow-2xl space-y-12 text-center">
              <PharmaLogo config={config} onAdminRequest={() => {}} />
              <input type="password" title="Pass" className="w-full bg-slate-50 border-2 rounded-3xl px-8 py-8 text-center text-6xl font-black outline-none focus:border-[#e6007e]" placeholder="••••" onChange={e => setAdminPassInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && adminPassInput === ADMIN_PASS && setAdminAuth(true)} />
              <button onClick={() => adminPassInput === ADMIN_PASS ? setAdminAuth(true) : alert("No")} className="w-full py-8 bg-slate-950 text-white rounded-3xl font-black uppercase text-xs shadow-2xl">Acceder</button>
              <button onClick={() => setView('home')} className="block w-full text-[10px] font-black text-slate-300">Regresar</button>
           </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
        <aside className="w-full md:w-80 bg-white border-r p-10 flex flex-col gap-6 sticky top-0 h-screen overflow-y-auto no-scrollbar">
           <PharmaLogo config={config} onAdminRequest={() => {}} />
           <nav className="flex flex-col gap-3">
              <button onClick={() => setAdminTab('status')} className={`flex items-center gap-3 px-6 py-4 rounded-xl text-[10px] font-black uppercase transition-all ${adminTab === 'status' ? 'bg-[#e6007e] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><Activity size={20}/> Monitor</button>
              <button onClick={() => setAdminTab('catalog')} className={`flex items-center gap-3 px-6 py-4 rounded-xl text-[10px] font-black uppercase transition-all ${adminTab === 'catalog' ? 'bg-[#e6007e] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><Package size={20}/> Catálogo</button>
              <button onClick={() => setAdminTab('banners')} className={`flex items-center gap-3 px-6 py-4 rounded-xl text-[10px] font-black uppercase transition-all ${adminTab === 'banners' ? 'bg-[#e6007e] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><ImageIcon size={20}/> Banners</button>
              <button onClick={() => setAdminTab('config')} className={`flex items-center gap-3 px-6 py-4 rounded-xl text-[10px] font-black uppercase transition-all ${adminTab === 'config' ? 'bg-[#e6007e] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><Settings size={20}/> ERP Odoo</button>
           </nav>
           <button onClick={() => setView('home')} className="mt-auto p-5 bg-red-50 text-red-500 rounded-xl font-black uppercase text-[9px] hover:bg-red-500 hover:text-white transition-all">Salir</button>
        </aside>
        
        <main className="flex-1 p-12 overflow-y-auto">
           {adminTab === 'status' && (
             <div className="space-y-8 animate-fade-up">
                <h2 className="text-5xl font-black text-slate-900 uppercase italic">Estado del Túnel</h2>
                <div className="bg-slate-900 rounded-[3rem] p-10 h-[500px] overflow-y-auto font-mono text-[13px] text-[#8cc63f] shadow-2xl no-scrollbar">
                   {syncLogs.length > 0 ? syncLogs.map((log, i) => <p key={i} className="mb-2 opacity-80"><span className="opacity-30 mr-4">[{i+1}]</span> {log}</p>) : <p className="opacity-40">Sin logs...</p>}
                </div>
             </div>
           )}

           {adminTab === 'catalog' && (
             <div className="space-y-12 animate-fade-up">
                <h2 className="text-5xl font-black text-slate-900 uppercase italic">Gestión Odoo</h2>
                <div className="bg-white p-10 rounded-[3rem] border shadow-sm space-y-8">
                   <h3 className="text-xl font-black uppercase text-slate-400 flex items-center gap-3"><Filter size={20}/> Ocultar Categorías</h3>
                   <div className="flex flex-wrap gap-3">
                      {allCategories.map(cat => (
                        <button key={cat} onClick={() => {
                          const newHidden = new Set(config.hiddenCategories);
                          if (newHidden.has(cat)) newHidden.delete(cat); else newHidden.add(cat);
                          saveConfig({...config, hiddenCategories: Array.from(newHidden)});
                        }} className={`px-6 py-4 rounded-2xl border-2 transition-all font-black uppercase text-[10px] ${!hiddenCategories.has(cat) ? 'bg-[#8cc63f] border-[#8cc63f] text-white' : 'text-slate-300'}`}>
                           {cat} {!hiddenCategories.has(cat) ? <Eye size={14} className="inline ml-2"/> : <EyeOff size={14} className="inline ml-2"/>}
                        </button>
                      ))}
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {products.map(p => (
                     <div key={p.id} className={`p-6 rounded-3xl border-2 flex items-center justify-between transition-all ${!hiddenProducts.has(p.id) ? 'bg-white border-slate-50 shadow-sm' : 'bg-slate-50 opacity-50'}`}>
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-white rounded-xl border flex items-center justify-center overflow-hidden">{p.image ? <img src={p.image} className="max-h-full" /> : <Package size={20} className="text-slate-100"/>}</div>
                           <div className="flex flex-col"><span className="text-xs font-bold text-slate-800 line-clamp-1">{p.name}</span><span className="text-[9px] font-black text-[#e6007e] uppercase">{p.category}</span></div>
                        </div>
                        <button onClick={() => {
                          const newHidden = new Set(config.hiddenProducts);
                          if (newHidden.has(p.id)) newHidden.delete(p.id); else newHidden.add(p.id);
                          saveConfig({...config, hiddenProducts: Array.from(newHidden)});
                        }} className="p-3 bg-slate-100 rounded-xl text-slate-400 hover:text-[#e6007e] transition-colors">{!hiddenProducts.has(p.id) ? <Eye size={18}/> : <EyeOff size={18}/>}</button>
                     </div>
                   ))}
                </div>
             </div>
           )}

           {adminTab === 'banners' && (
             <div className="space-y-12 animate-fade-up">
                <div className="flex justify-between items-center"><h2 className="text-5xl font-black text-slate-900 uppercase italic">Banners</h2><button onClick={() => saveConfig({...config, banners: [...(config.banners || []), {img: '', title: 'Nuevo', desc: 'Desc'}]})} className="px-8 py-5 bg-[#e6007e] text-white rounded-2xl font-black uppercase text-[10px] shadow-xl">+ Nuevo Banner</button></div>
                <div className="grid grid-cols-1 gap-8">
                   {config.banners?.map((b: any, idx: number) => (
                     <div key={idx} className="bg-white p-10 rounded-[3rem] border shadow-sm flex flex-col md:flex-row gap-8">
                        <div className="w-full md:w-64 h-40 bg-slate-50 rounded-3xl border overflow-hidden flex items-center justify-center">{b.img ? <img src={b.img} className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-200" size={40}/>}</div>
                        <div className="flex-1 space-y-4">
                           <input type="text" placeholder="URL Imagen" className="w-full bg-slate-50 px-6 py-4 rounded-xl font-bold border-2 border-transparent focus:border-[#e6007e] outline-none transition-all text-xs" value={b.img} onChange={e => { const nb = [...config.banners]; nb[idx].img = e.target.value; saveConfig({...config, banners: nb}); }} />
                           <input type="text" placeholder="Título" className="w-full bg-slate-50 px-6 py-4 rounded-xl font-bold border-2 border-transparent focus:border-[#e6007e] outline-none transition-all text-xs" value={b.title} onChange={e => { const nb = [...config.banners]; nb[idx].title = e.target.value; saveConfig({...config, banners: nb}); }} />
                        </div>
                        <button onClick={() => saveConfig({...config, banners: config.banners.filter((_:any, i:number) => i !== idx)})} className="p-6 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={24}/></button>
                     </div>
                   ))}
                </div>
             </div>
           )}

           {adminTab === 'config' && (
             <div className="max-w-4xl space-y-12 animate-fade-up">
                <div className="bg-white p-12 rounded-[4rem] border shadow-sm space-y-12">
                   <h3 className="text-3xl font-black text-slate-900 uppercase italic border-b pb-6">Ajustes ERP</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {['url', 'db', 'user', 'apiKey', 'whatsapp', 'yape', 'companyName'].map(key => (
                        <div key={key} className="space-y-3">
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-2">{key}</label>
                           <input type={key === 'apiKey' ? 'password' : 'text'} title={key} className="w-full bg-slate-50 px-6 py-5 rounded-2xl font-mono text-sm border-2 border-transparent focus:border-[#e6007e] outline-none" value={(config as any)[key]} onChange={e => saveConfig({...config, [key]: e.target.value})} />
                        </div>
                      ))}
                   </div>
                   <button onClick={() => syncERP()} className="w-full py-8 bg-[#8cc63f] text-white rounded-[2rem] font-black uppercase shadow-2xl text-xs tracking-[0.4em] hover:brightness-110 transition-all">Sincronizar Maestro</button>
                </div>
             </div>
           )}
        </main>
      </div>
    );
  }
  return null;
};

const rootElement = document.getElementById('root');
if (rootElement) createRoot(rootElement).render(<App />);
