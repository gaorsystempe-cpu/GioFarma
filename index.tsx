
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Search, ShoppingCart, Plus, Minus, X, RefreshCw, Settings, 
  ShoppingBag, ShieldCheck, ChevronRight, Package, Activity, 
  Layers, FileText, Heart, Truck, Store, HeartPulse, ChevronLeft, 
  Filter, LayoutGrid, Eye, EyeOff, Verified, ArrowUpRight, PackagePlus,
  CheckCircle2, Info, BookOpen, Sparkles, Zap, Shield, Clock, ChevronDown, 
  MapPin, User, Phone, Send, ChevronRight as ChevronRightIcon, Copy, Check,
  Building2, MessageCircle, Image as ImageIcon, Trash2, AlertCircle
} from 'lucide-react';

/* ============================================================
   ENGINE: ODOO XML-RPC MASTER (PRO CHECKOUT V26 - VERCEL FIX)
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

// LISTA DE PROXIES DINÁMICA PARA EVITAR "FAILED TO FETCH"
const PROXIES = [
  { name: 'CorsProxyIO', fn: (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}` },
  { name: 'AllOrigins', fn: (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}` },
  { name: 'ThingProxy', fn: (u: string) => `https://thingproxy.freeboard.io/fetch/${u}` }
];

class OdooClient {
  constructor(private url: string, private db: string, private onLog?: (msg: string) => void) {
    // Asegurar que la URL sea limpia
    this.url = this.url.replace(/\/+$/, '').trim();
    if (!this.url.startsWith('http')) this.url = 'https://' + this.url;
  }

  async rpcCall(endpoint: string, method: string, params: any[]) {
    const xml = `<?xml version="1.0"?><methodCall><methodName>${method}</methodName><params>${params.map(p => `<param>${serialize(p)}</param>`).join('')}</params></methodCall>`;
    const baseUrl = `${this.url}/xmlrpc/2/${endpoint}`;
    
    let lastError = "No se pudo establecer conexión con ningún proxy.";
    
    for (const proxy of PROXIES) {
      try {
        if (this.onLog) this.onLog(`Intentando vía ${proxy.name}...`);
        const targetUrl = proxy.fn(baseUrl);
        
        const response = await fetch(targetUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'text/xml',
            'Accept': 'text/xml'
          },
          body: xml,
          mode: 'cors', // Forzar modo CORS para Vercel
          signal: AbortSignal.timeout(15000) // Timeout de 15 segundos
        });

        if (!response.ok) {
          const status = response.status;
          if (status === 413) throw new Error("413: Catálogo demasiado pesado.");
          if (status === 404) throw new Error("404: Endpoint Odoo no encontrado.");
          throw new Error(`HTTP ${status} en ${proxy.name}`);
        }

        const text = await response.text();
        if (!text.includes('methodResponse')) {
          throw new Error(`Respuesta inválida desde ${proxy.name}`);
        }

        const doc = new DOMParser().parseFromString(text, 'text/xml');
        const fault = doc.querySelector('fault value');
        if (fault) {
          const faultData = parseValue(fault);
          throw new Error(faultData.faultString || 'Error interno de Odoo');
        }

        const resultNode = doc.querySelector('params param value');
        return resultNode ? parseValue(resultNode) : null;
      } catch (e: any) { 
        lastError = e.message;
        if (this.onLog) this.onLog(`Fallo ${proxy.name}: ${e.message}`);
        // Continuar al siguiente proxy
      }
    }
    throw new Error(lastError);
  }
}

// --- CONSTANTES ---
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
    { 
      img: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80", 
      title: "Salud en cada paso", 
      desc: "Los mejores precios del mercado sincronizados con Odoo." 
    },
    { 
      img: "https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?auto=format&fit=crop&w=1200&q=80", 
      title: "Cuidado Personal", 
      desc: "Todo lo que necesitas para tu bienestar diario." 
    }
  ]
};

// --- COMPONENTES UI ---

const PharmaLogo = ({ config, onAdminRequest }: { config: any, onAdminRequest: () => void }) => {
  const [clicks, setClicks] = useState(0);
  const timerRef = useRef<any>(null);

  const handleClick = () => {
    const newClicks = clicks + 1;
    setClicks(newClicks);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setClicks(0), 1000);

    if (newClicks >= 3) {
      setClicks(0);
      onAdminRequest();
    }
  };

  const name = config?.companyName || "GIOFARMA";
  const part1 = name.substring(0, Math.ceil(name.length/2));
  const part2 = name.substring(Math.ceil(name.length/2));

  return (
    <div onClick={handleClick} className="flex items-center gap-3 cursor-pointer group select-none transition-transform active:scale-95">
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center bg-[#e6007e] text-white shadow-xl group-hover:scale-105 transition-all">
        <HeartPulse size={28} />
      </div>
      <div className="flex flex-col -space-y-1">
        <span className="text-xl md:text-2xl font-black tracking-tighter text-slate-900 uppercase">{part1}<span className="text-[#8cc63f]">{part2}</span></span>
        <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Portal Autopedido</span>
      </div>
    </div>
  );
};

const BannerCarousel = ({ config, compact = false }: { config: any, compact?: boolean }) => {
  const validBanners = useMemo(() => {
    if (config?.banners && Array.isArray(config.banners) && config.banners.length > 0) {
      const filtered = config.banners.filter((b: any) => b && b.img && b.title);
      if (filtered.length > 0) return filtered;
    }
    return DEFAULT_CONFIG.banners;
  }, [config?.banners]);

  const [curr, setCurr] = useState(0);

  useEffect(() => {
    if (validBanners.length <= 1) return;
    const it = setInterval(() => setCurr(c => (c + 1) % validBanners.length), 6000);
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
            <p className={`text-white/90 font-medium uppercase italic tracking-wide ${compact ? 'text-[10px] md:text-lg' : 'text-sm md:text-2xl'}`}>{b.desc}</p>
          </div>
        </div>
      ))}
      {validBanners.length > 1 && (
        <div className="absolute bottom-6 right-8 z-30 flex gap-2.5">
          {validBanners.map((_: any, i: number) => (
            <div key={i} className={`h-2 rounded-full transition-all duration-500 ${i === curr ? 'w-10 bg-white shadow-lg' : 'w-3 bg-white/30'}`} />
          ))}
        </div>
      )}
    </div>
  );
};

const CheckoutModal = ({ cart, config, onClose, onOrderSuccess }: any) => {
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [userData, setUserData] = useState({ name: '', phone: '', address: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [numCopied, setNumCopied] = useState(false);

  const total = cart.reduce((acc: number, item: any) => acc + (item.finalPrice * item.q), 0);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(config.yape || "900000000");
    setNumCopied(true);
  };

  const handleCreateOrder = async () => {
    if (!userData.name || !userData.phone || (orderType === 'delivery' && !userData.address)) {
      alert("Por favor completa los datos requeridos.");
      return;
    }
    if (!numCopied) {
      alert("Por favor copia el número de Yape para continuar.");
      return;
    }

    setIsProcessing(true);
    try {
      const client = new OdooClient(config.url, config.db);
      const uid = await client.rpcCall('common', 'authenticate', [config.db, config.user, config.apiKey, {}]);
      if (!uid) throw new Error("Error de conexión con Odoo.");

      const partners = await client.rpcCall('object', 'execute_kw', [
        config.db, uid, config.apiKey,
        'res.partner', 'search',
        [[['phone', '=', userData.phone]]]
      ]);

      let finalPartnerId;
      if (Array.isArray(partners) && partners.length > 0) {
        finalPartnerId = partners[0];
      } else {
        finalPartnerId = await client.rpcCall('object', 'execute_kw', [
          config.db, uid, config.apiKey,
          'res.partner', 'create',
          [{
            name: userData.name,
            phone: userData.phone,
            street: userData.address || 'Recojo en tienda',
            customer_rank: 1,
            company_type: 'person'
          }]
        ]);
      }

      const orderId = await client.rpcCall('object', 'execute_kw', [
        config.db, uid, config.apiKey,
        'sale.order', 'create',
        [{
          partner_id: finalPartnerId, 
          note: `Portal Autopedido: ${orderType.toUpperCase()} - Cliente: ${userData.name} (${userData.phone}) - Pago via YAPE confirmado. Dirección: ${userData.address || 'RECOJO EN TIENDA'}`
        }]
      ]);

      for (const item of cart) {
        await client.rpcCall('object', 'execute_kw', [
          config.db, uid, config.apiKey,
          'sale.order.line', 'create',
          [{
            order_id: orderId,
            product_id: item.id,
            product_uom_qty: item.q,
            price_unit: item.finalPrice,
            name: `${item.name} (${item.u || 'Unidad'})`
          }]
        ]);
      }

      const summary = cart.map((i: any) => `• ${i.q}x ${i.name} (${i.u}) -> S/ ${(i.finalPrice * i.q).toFixed(2)}`).join('%0A');
      const waMsg = `*🚀 NUEVO PEDIDO - GIOFARMA*%0A%0A*ORDEN ODOO:* #${orderId}%0A*CLIENTE:* ${userData.name}%0A*TELÉFONO:* ${userData.phone}%0A*TIPO:* ${orderType === 'delivery' ? '🚚 DELIVERY' : '🏪 RECOJO EN TIENDA'}%0A${orderType === 'delivery' ? `*DIRECCIÓN:* ${userData.address}%0A` : ''}%0A*ESTADO PAGO:* Confirmado via YAPE%0A%0A*DETALLE:*%0A${summary}%0A%0A*TOTAL A PAGAR: S/ ${total.toFixed(2)}*%0A%0A_Enviado desde el Portal de Autopedido_`;
      
      let targetPhone = (config.whatsapp || DEFAULT_CONFIG.whatsapp).toString().replace(/\D/g, '');
      if (targetPhone.length === 9 && targetPhone.startsWith('9')) targetPhone = '51' + targetPhone;
      
      window.open(`https://wa.me/${targetPhone}?text=${waMsg}`, '_blank');
      onOrderSuccess();
    } catch (e: any) { 
      alert(`Error al procesar: ${e.message}`); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-slate-900/95 backdrop-blur-xl p-4 overflow-y-auto no-scrollbar">
      <div className="bg-white w-full max-w-[480px] rounded-[3.5rem] p-8 md:p-10 space-y-8 animate-scale-in shadow-2xl">
        <div className="flex gap-4">
           <button onClick={() => setOrderType('delivery')} className={`flex-1 p-6 rounded-3xl border-2 flex flex-col items-center gap-2 transition-all ${orderType === 'delivery' ? 'bg-[#e6007e] border-[#e6007e] text-white shadow-lg scale-105' : 'border-slate-50 text-slate-300 hover:border-slate-100'}`}>
              <Truck size={32}/> 
              <span className="text-[10px] font-black uppercase tracking-widest">Domicilio</span>
           </button>
           <button onClick={() => setOrderType('pickup')} className={`flex-1 p-6 rounded-3xl border-2 flex flex-col items-center gap-2 transition-all ${orderType === 'pickup' ? 'bg-[#8cc63f] border-[#8cc63f] text-white shadow-lg scale-105' : 'border-slate-50 text-slate-300 hover:border-slate-100'}`}>
              <Store size={32}/> 
              <span className="text-[10px] font-black uppercase tracking-widest">Tienda</span>
           </button>
        </div>

        <div className="space-y-4">
           <div className="relative">
              <input type="text" placeholder="Tu nombre completo" className="w-full pl-14 pr-6 py-5 bg-[#f8f9fb] rounded-2xl font-bold outline-none border-2 border-transparent focus:border-[#e6007e] transition-all text-sm" value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} />
              <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
           </div>
           <div className="relative">
              <input type="tel" placeholder="Número de celular" className="w-full pl-14 pr-6 py-5 bg-[#f8f9fb] rounded-2xl font-bold outline-none border-2 border-transparent focus:border-[#e6007e] transition-all text-sm" value={userData.phone} onChange={e => setUserData({...userData, phone: e.target.value})} />
              <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
           </div>
           {orderType === 'delivery' && (
             <div className="relative animate-fade-up">
                <input type="text" placeholder="Dirección exacta de entrega" className="w-full pl-14 pr-6 py-5 bg-[#f8f9fb] rounded-2xl font-bold outline-none border-2 border-transparent focus:border-[#e6007e] transition-all text-sm" value={userData.address} onChange={e => setUserData({...userData, address: e.target.value})} />
                <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
             </div>
           )}
        </div>

        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
           <div className="flex items-center justify-between">
              <div className="flex flex-col">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pagar con Yape</span>
                 <span className="text-xl font-black text-slate-900 tracking-tight italic">{config.yape}</span>
              </div>
              <button onClick={copyToClipboard} className={`p-4 rounded-2xl transition-all flex items-center gap-2 ${numCopied ? 'bg-[#8cc63f] text-white' : 'bg-[#e6007e] text-white hover:scale-105 active:scale-95'}`}>
                 {numCopied ? <Check size={18}/> : <Copy size={18}/>}
                 <span className="text-[10px] font-black uppercase tracking-widest">{numCopied ? 'Copiado' : 'Copiar'}</span>
              </button>
           </div>
           {!numCopied && <p className="text-[9px] text-[#e6007e] font-bold animate-pulse uppercase tracking-tighter">Debes copiar el número para habilitar el pedido</p>}
        </div>

        <div className="p-8 bg-slate-950 text-white rounded-[2.5rem] flex justify-between items-center shadow-inner relative overflow-hidden">
           <div className="flex flex-col z-10">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Total a pagar</span>
              <span className="text-4xl font-black italic tracking-tighter text-[#8cc63f]">S/ {total.toFixed(2)}</span>
           </div>
           <div className="text-right z-10 flex flex-col">
              <span className="text-[9px] font-bold text-white/60 uppercase">Sincronizado</span>
              <span className="text-[9px] font-bold text-white/60 uppercase">con Odoo</span>
           </div>
        </div>

        <button 
          disabled={isProcessing || !numCopied} 
          onClick={handleCreateOrder} 
          className={`w-full py-7 rounded-[2rem] font-black uppercase tracking-[0.4em] text-sm shadow-2xl transition-all flex items-center justify-center gap-4 ${isProcessing ? 'bg-slate-200 text-slate-400' : (!numCopied ? 'bg-slate-100 text-slate-300' : 'bg-[#e6007e] text-white hover:brightness-110 active:scale-95')}`}
        >
          {isProcessing ? <RefreshCw className="animate-spin" size={20}/> : <Send size={20}/>}
          {isProcessing ? 'Procesando...' : 'Enviar Pedido'}
        </button>

        <button onClick={onClose} className="w-full text-[10px] font-black uppercase text-slate-300 tracking-widest hover:text-red-400 transition-colors">Cancelar y Volver</button>
      </div>
    </div>
  );
};

const ProductDetailModal = ({ product, onClose, onAdd }: any) => {
  const [qty, setQty] = useState(1);
  const [uom, setUom] = useState(product.prices?.[0]?.uom || 'Unidad');
  const currentPrice = useMemo(() => product.prices?.find((p: any) => p.uom === uom)?.price || product.price, [uom, product]);

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-4 overflow-hidden">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative w-full max-w-6xl bg-white md:rounded-[4rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[92vh] animate-scale-in">
        <button onClick={onClose} className="absolute top-6 right-6 z-[610] p-4 bg-slate-100 rounded-full text-slate-400 hover:bg-[#e6007e] hover:text-white transition-all shadow-sm"><X size={26}/></button>
        
        <div className="w-full md:w-[58%] bg-[#fcfcfd] p-8 flex flex-col items-stretch border-b md:border-b-0 md:border-r border-slate-100 overflow-hidden">
           <div className="flex-1 min-h-[400px] max-h-[550px] flex items-center justify-center bg-white rounded-[3.5rem] p-6 shadow-sm border border-slate-50 overflow-hidden">
             {product.image ? (
               <img src={product.image} className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-700" alt={product.name}/>
             ) : (
               <Package size={160} className="text-slate-100 opacity-20"/>
             )}
           </div>
        </div>

        <div className="w-full md:w-[42%] p-10 md:p-14 flex flex-col justify-center bg-white">
           <div className="space-y-12">
              <div className="space-y-4">
                 <span className="px-5 py-2 bg-[#e6007e]/5 text-[#e6007e] rounded-xl text-[10px] font-black uppercase tracking-widest">{product.category}</span>
                 <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase italic leading-tight tracking-tight">{product.name}</h2>
              </div>
              <div className="py-10 border-y border-slate-100 space-y-2">
                 <div className="flex items-baseline justify-between">
                    <span className="text-6xl font-black text-slate-900 tracking-tighter italic leading-none">S/ {currentPrice.toFixed(2)}</span>
                    <span className="text-xl font-black text-[#8cc63f] italic uppercase tracking-widest">Web</span>
                 </div>
              </div>
              <div className="flex gap-4 pt-6">
                 <div className="flex items-center justify-between bg-slate-50 px-6 py-5 rounded-[2rem] min-w-[150px] border border-slate-100 shadow-inner">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="text-slate-400 hover:text-[#e6007e]"><Minus size={22}/></button>
                    <span className="text-3xl font-black italic text-slate-900">{qty}</span>
                    <button onClick={() => setQty(qty + 1)} className="text-slate-400 hover:text-[#e6007e]"><Plus size={22}/></button>
                 </div>
                 <button onClick={() => { onAdd(product, qty, uom, currentPrice); onClose(); }} className="flex-1 bg-[#e6007e] text-white rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-xl hover:brightness-110 active:scale-95 transition-all text-[11px] py-6">
                   Agregar
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---

const App = () => {
  const [view, setView] = useState<'home' | 'shop' | 'admin'>('home');
  const [adminTab, setAdminTab] = useState<'status' | 'catalog' | 'banners' | 'config'>('status');
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('giofarma_config_v26');
    return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
  });

  const hiddenProducts = useMemo(() => new Set<number>(config.hiddenProducts || []), [config.hiddenProducts]);
  const hiddenCategories = useMemo(() => new Set<string>(config.hiddenCategories || []), [config.hiddenCategories]);

  const addLog = (msg: string) => setSyncLogs(p => [new Date().toLocaleTimeString() + ": " + msg, ...p].slice(0, 30));

  const saveConfig = (newConfig: any) => {
    setConfig(newConfig);
    localStorage.setItem('giofarma_config_v26', JSON.stringify(newConfig));
  };

  const syncERP = useCallback(async (isSilent = false) => {
    if (!config.apiKey || !config.url || !config.db) {
        setError("Faltan credenciales");
        return;
    }
    if (!isSilent) setLoading(true);
    setError(null);
    addLog("Iniciando conexión XML-RPC segura...");

    try {
      const client = new OdooClient(config.url, config.db, addLog);
      const uid = await client.rpcCall('common', 'authenticate', [config.db, config.user, config.apiKey, {}]);
      if (!uid) throw new Error("Acceso denegado. Verifique su API Key en Odoo.");
      
      addLog("Autenticado. Cargando datos con límites optimizados...");

      // Límites estrictos para evitar Error 413 y Failed to Fetch
      const rawProducts = await client.rpcCall('object', 'execute_kw', [
        config.db, uid, config.apiKey, 
        'product.product', 'search_read', 
        [[['sale_ok', '=', true]]], 
        { 
          fields: ['name', 'list_price', 'qty_available', 'categ_id', 'image_128', 'display_name', 'product_tmpl_id'], 
          limit: 60 // Reducido aún más para asegurar conexión estable en Vercel
        }
      ]);

      if (Array.isArray(rawProducts)) {
          const mapped = rawProducts.map((p: any) => ({ 
              id: p.id, 
              name: p.display_name || p.name, 
              price: p.list_price || 0, 
              stock: p.qty_available || 0, 
              category: Array.isArray(p.categ_id) ? p.categ_id[1] : 'FARMACIA', 
              prices: [{ price: p.list_price || 0, uom: 'Unidad' }], 
              image: p.image_128 ? `data:image/png;base64,${p.image_128}` : null 
          }));

          setProducts(mapped);
          setAllCategories(Array.from(new Set(mapped.map(p => p.category))).sort());
          addLog(`Conexión exitosa: ${mapped.length} productos recibidos.`);
      } else {
          throw new Error("Respuesta de Odoo vacía o malformada.");
      }
    } catch (e: any) { 
      const msg = e.message.includes("Failed to fetch") 
        ? "Error de Red: El servidor de Odoo o el Proxy no responden." 
        : `Odoo Error: ${e.message}`;
      addLog(msg); 
      setError(msg);
    } finally { 
      if (!isSilent) setLoading(false); 
    }
  }, [config]);

  useEffect(() => { syncERP(); }, [syncERP]);

  const filteredProducts = useMemo(() => products.filter(p => 
    !hiddenProducts.has(p.id) && 
    !hiddenCategories.has(p.category) && 
    (activeCategory === "Todos" || p.category === activeCategory) && 
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  ).sort((a,b) => b.stock - a.stock), [products, searchQuery, activeCategory, hiddenProducts, hiddenCategories]);

  if (view === 'home') {
    return (
      <div className="min-h-screen bg-white">
        <header className="h-28 px-10 md:px-24 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-50 border-b border-slate-50">
          <PharmaLogo config={config} onAdminRequest={() => setView('admin')} />
          <button onClick={() => setView('shop')} className="px-12 py-5 bg-slate-950 text-white rounded-[1.8rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-xl hover:scale-105 active:scale-95 flex items-center gap-3">
            <ShoppingBag size={20} className="text-[#e6007e]"/> Pedido Online
          </button>
        </header>
        <main className="p-10 md:p-24 space-y-32 max-w-[1800px] mx-auto">
           <div className="text-center space-y-8 animate-fade-up">
              <h1 className="text-6xl md:text-[11rem] font-black text-slate-900 tracking-tighter leading-[0.8] italic uppercase">Tu salud no <br/><span className="text-[#e6007e]">puede esperar.</span></h1>
           </div>
           <BannerCarousel config={config} />
        </main>
      </div>
    );
  }

  if (view === 'shop') {
    return (
      <div className="min-h-screen bg-[#f8f9fb]">
        {selectedProduct && <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={(p: any, q: number, u: string, pr: number) => setCart([...cart, {...p, q, u, finalPrice: pr}])} />}
        {showCheckout && <CheckoutModal cart={cart} config={config} onClose={() => setShowCheckout(false)} onOrderSuccess={() => {setCart([]); setShowCheckout(false); setView('home');}} />}
        
        <header className="bg-white sticky top-0 z-[200] px-10 md:px-24 py-8 border-b border-slate-100 shadow-sm space-y-6">
           <div className="flex items-center justify-between">
              <PharmaLogo config={config} onAdminRequest={() => setView('admin')} />
              <button onClick={() => cart.length > 0 && setShowCheckout(true)} className="relative w-14 h-14 bg-slate-950 text-white rounded-2xl flex items-center justify-center shadow-xl transition-all"><ShoppingCart size={24} />{cart.length > 0 && <span className="absolute -top-3 -right-3 w-8 h-8 bg-[#e6007e] text-white text-[11px] font-black rounded-full flex items-center justify-center border-4 border-white animate-bounce">{cart.length}</span>}</button>
           </div>
           <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <input type="text" placeholder="Busca productos..." className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-[#e6007e] rounded-2xl font-bold outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
              </div>
              <button onClick={() => setShowCategorySelect(!showCategorySelect)} className="px-8 py-5 bg-white border-2 border-slate-100 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3">{activeCategory} <ChevronDown size={16}/></button>
           </div>
        </header>

        <main className="p-10 md:p-24 space-y-16">
           <BannerCarousel config={config} compact={true} />
           {loading ? (
             <div className="flex flex-col items-center justify-center py-32 space-y-6">
                <RefreshCw size={48} className="animate-spin text-[#e6007e]" />
                <p className="font-black uppercase tracking-[0.3em] text-slate-400">Verificando Inventario Odoo...</p>
             </div>
           ) : error ? (
             <div className="flex flex-col items-center justify-center py-32 space-y-8 bg-white rounded-[4rem] border-2 border-red-50 shadow-inner p-12 text-center">
                <AlertCircle size={64} className="text-red-400 mx-auto" />
                <div className="space-y-4">
                   <h2 className="text-2xl font-black uppercase text-slate-800">Error de Red</h2>
                   <p className="text-slate-400 font-medium italic max-w-md mx-auto">{error}</p>
                </div>
                <button onClick={() => syncERP()} className="px-12 py-5 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95">Reintentar Conexión</button>
             </div>
           ) : (
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                {filteredProducts.map(p => (
                  <div key={p.id} onClick={() => setSelectedProduct(p)} className="bg-white p-6 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl cursor-pointer group animate-fade-up">
                    <div className="aspect-square bg-white rounded-[2.5rem] p-4 mb-4 flex items-center justify-center overflow-hidden">
                       {p.image ? <img src={p.image} className="h-full w-full object-contain" /> : <Package size={40} className="text-slate-100"/>}
                    </div>
                    <h3 className="text-[13px] font-black text-slate-800 uppercase italic line-clamp-2 leading-tight">{p.name}</h3>
                    <div className="mt-6 text-2xl font-black text-slate-900 italic tracking-tighter">S/ {p.price.toFixed(2)}</div>
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
              <input type="password" title="Pass" className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-8 py-8 text-center text-6xl font-black outline-none focus:border-[#e6007e]" placeholder="••••" onChange={e => setAdminPassInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && adminPassInput === ADMIN_PASS && setAdminAuth(true)} />
              <button onClick={() => adminPassInput === ADMIN_PASS ? setAdminAuth(true) : alert("No")} className="w-full py-8 bg-slate-950 text-white rounded-3xl font-black uppercase tracking-[0.5em] text-xs">Entrar</button>
              <button onClick={() => setView('home')} className="block w-full text-[10px] font-black uppercase text-slate-300">Volver</button>
           </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
        <aside className="w-full md:w-80 bg-white border-r p-10 flex flex-col gap-10 sticky top-0 h-screen">
           <PharmaLogo config={config} onAdminRequest={() => {}} />
           <nav className="flex flex-col gap-3">
              <button onClick={() => setAdminTab('status')} className={`flex items-center gap-3 px-6 py-4 rounded-xl text-[10px] font-black uppercase ${adminTab === 'status' ? 'bg-[#e6007e] text-white' : 'text-slate-400'}`}><Activity size={20}/> Status</button>
              <button onClick={() => setAdminTab('config')} className={`flex items-center gap-3 px-6 py-4 rounded-xl text-[10px] font-black uppercase ${adminTab === 'config' ? 'bg-[#e6007e] text-white' : 'text-slate-400'}`}><Settings size={20}/> Ajustes</button>
           </nav>
           <button onClick={() => setView('home')} className="mt-auto p-5 bg-red-50 text-red-500 rounded-xl font-black uppercase text-[9px]">Salir</button>
        </aside>
        
        <main className="flex-1 p-12 overflow-y-auto">
           {adminTab === 'status' && (
             <div className="space-y-10">
                <div className="flex justify-between items-center">
                   <h2 className="text-5xl font-black text-slate-900 uppercase italic">Terminal</h2>
                   <button onClick={() => syncERP()} className="p-6 bg-slate-950 text-white rounded-2xl"><RefreshCw size={28} className={loading ? 'animate-spin' : ''}/></button>
                </div>
                <div className="bg-slate-900 rounded-[3rem] p-12 h-[500px] overflow-y-auto font-mono text-[13px] text-[#8cc63f] no-scrollbar">
                   {syncLogs.map((log, i) => <p key={i} className="mb-2 opacity-80"><span className="opacity-30 mr-4">[{i+1}]</span> {log}</p>)}
                </div>
             </div>
           )}

           {adminTab === 'config' && (
             <div className="max-w-4xl space-y-10">
                <div className="bg-white p-12 rounded-[4rem] border space-y-12">
                   <h3 className="text-3xl font-black text-slate-900 uppercase italic">Configuración ERP</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {['url', 'db', 'user', 'apiKey'].map(key => (
                        <div key={key} className="space-y-3">
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-2">{key}</label>
                           <input type={key === 'apiKey' ? 'password' : 'text'} title={key} className="w-full bg-slate-50 px-6 py-5 rounded-2xl font-mono text-sm border-2 border-transparent focus:border-[#e6007e] outline-none" value={(config as any)[key]} onChange={e => saveConfig({...config, [key]: e.target.value})} />
                        </div>
                      ))}
                   </div>
                   <button onClick={() => syncERP()} className="w-full py-8 bg-[#8cc63f] text-white rounded-[2rem] font-black uppercase shadow-2xl text-xs tracking-[0.4em]">Guardar y Probar Conexión</button>
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
