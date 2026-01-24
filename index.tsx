
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Search, 
  ShoppingCart, 
  ChevronRight, 
  ChevronLeft,
  Plus, 
  Minus, 
  X, 
  Sparkles, 
  BriefcaseMedical, 
  CheckCircle2,
  Clock,
  ArrowRight,
  Info,
  Truck,
  Store,
  MapPin,
  ShieldCheck,
  Pill,
  HeartPulse,
  ArrowUpRight,
  Menu,
  Phone,
  Activity,
  Award,
  Zap,
  Stethoscope,
  Settings,
  Database,
  Lock,
  Globe,
  User,
  Smartphone,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// --- Tipos y Constantes ---

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  image: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface OdooConfig {
  url: string;
  db: string;
  username: string;
  apiKey: string;
  yapeNumber: string;
  plinNumber: string;
}

const DEFAULT_CONFIG: OdooConfig = {
  url: 'https://tu-instancia.odoo.com',
  db: 'odoo_db',
  username: 'admin@farma.com',
  apiKey: '',
  yapeNumber: '987 654 321',
  plinNumber: '987 654 321'
};

const CATEGORIES = ["Todos", "Medicamentos", "Cuidado de Piel", "Bebés", "Higiene", "Primeros Auxilios"];

const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: "Paracetamol 500mg (10 tab)", price: 5.50, category: "Medicamentos", description: "Alivio efectivo para el dolor y la fiebre. Calidad farmacéutica certificada.", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400" },
  { id: 2, name: "Bloqueador Solar FPS 50+", price: 45.00, category: "Cuidado de Piel", description: "Protección dermatológica alta contra rayos UVA/UVB para uso diario.", image: "https://images.unsplash.com/photo-1556229174-5e42a09e45af?auto=format&fit=crop&q=80&w=400" },
  { id: 3, name: "Pañales Premium Talla G", price: 62.90, category: "Bebés", description: "Máxima absorción y suavidad superior para pieles delicadas.", image: "https://images.unsplash.com/photo-1544126592-807daa2b5650?auto=format&fit=crop&q=80&w=400" },
  { id: 4, name: "Alcohol en Gel 500ml", price: 12.50, category: "Primeros Auxilios", description: "Higiene instantánea con fórmula humectante y 70% de alcohol.", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400" },
  { id: 5, name: "Vitamina C Efervescente", price: 18.00, category: "Medicamentos", description: "Potente antioxidante para el sistema inmunológico.", image: "https://images.unsplash.com/photo-1616671285412-87008744111f?auto=format&fit=crop&q=80&w=400" },
  { id: 6, name: "Jabón Líquido Neutro", price: 15.20, category: "Higiene", description: "Limpieza profunda y suave para pieles sensibles.", image: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&q=80&w=400" },
];

const BANNERS = [
  { 
    title: "Innovación Médica", 
    subtitle: "Catálogo farmacéutico de alta gama con asesoría profesional 24/7.",
    image: "https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?auto=format&fit=crop&q=80&w=1200",
  },
  { 
    title: "Dermocosmética", 
    subtitle: "Selección exclusiva de productos para el cuidado avanzado de tu piel.",
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=1200",
  },
  {
    title: "Línea Vitamínica GIO+",
    subtitle: "Potencia tu energía y fortalece tus defensas con nuestra nueva gama premium. ¡20% OFF!",
    image: "https://images.unsplash.com/photo-1584017947486-62eef2b4c0f8?auto=format&fit=crop&q=80&w=1200",
  }
];

// --- Componentes UI ---

const Logo = ({ inverted = false, size = "md", onClick }: { inverted?: boolean, size?: "sm" | "md" | "lg", onClick?: () => void }) => {
  const sizes = {
    sm: { circle: "w-8 h-8", plus: "text-lg", text: "text-xl", sub: "text-[5px]", icon: 16 },
    md: { circle: "w-11 h-11", plus: "text-2xl", text: "text-3xl", sub: "text-[7px]", icon: 22 },
    lg: { circle: "w-16 h-16", plus: "text-4xl", text: "text-5xl", sub: "text-[10px]", icon: 32 }
  };
  const current = sizes[size];
  const textColor = inverted ? "text-white" : "text-[#e6007e]";
  const circleColor = inverted ? "border-white" : "border-[#e6007e]";

  return (
    <div onClick={onClick} className={`flex items-center gap-3 ${textColor} select-none cursor-pointer group`}>
      <div className={`${current.circle} border-2 ${circleColor} rounded-full flex items-center justify-center shrink-0 transition-transform group-active:scale-95`}>
         <Stethoscope size={current.icon} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col leading-none">
        <div className="flex items-center font-black tracking-tighter">
          <span>GIO</span>
          <span className="text-[#8cc63f] mx-1">+</span>
          <span>FARMA</span>
        </div>
        <p className={`font-bold ${current.sub} uppercase tracking-[0.15em] opacity-80 mt-1`}>
          DONDE TU BIENESTAR ES NUESTRA PRIORIDAD
        </p>
      </div>
    </div>
  );
};

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, loading = false }: any) => {
  const baseStyles = "px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 select-none cursor-pointer text-sm tracking-tight";
  const variants: any = {
    primary: "bg-[#e6007e] text-white hover:bg-[#c90078] shadow-lg shadow-pink-100",
    outline: "bg-white text-slate-600 border border-slate-200 hover:border-[#e6007e] hover:text-[#e6007e]",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-50",
    dark: "bg-slate-900 text-white hover:bg-slate-800 shadow-xl"
  };
  return (
    <button disabled={disabled || loading} onClick={onClick} className={`${baseStyles} ${variants[variant]} ${className}`}>
      {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : children}
    </button>
  );
};

const ProductCard: React.FC<{ product: Product, onAdd: (p: Product) => void }> = ({ product, onAdd }) => (
  <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.06)] transition-all duration-500 border border-slate-50 flex flex-col h-full group">
    <div className="relative aspect-square overflow-hidden bg-slate-50/50 p-6">
      <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-1000" />
      <div className="absolute top-6 right-6 bg-white px-3 py-1.5 rounded-2xl font-black text-slate-900 text-[10px] shadow-sm border border-slate-100">
        S/ {product.price.toFixed(2)}
      </div>
    </div>
    <div className="p-7 flex flex-col flex-grow">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[9px] font-black text-[#e6007e] uppercase tracking-widest">{product.category}</span>
        <div className="h-1 w-1 bg-slate-200 rounded-full"></div>
        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Premium Care</span>
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-2 leading-tight group-hover:text-[#e6007e] transition-colors">{product.name}</h3>
      <p className="text-xs text-slate-400 mb-6 line-clamp-2 flex-grow leading-relaxed font-medium">{product.description}</p>
      <Button onClick={() => onAdd(product)} variant="outline" className="w-full !rounded-xl group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900">
        <Plus size={16} /> Añadir
      </Button>
    </div>
  </div>
);

const App = () => {
  const [view, setView] = useState<'welcome' | 'menu' | 'checkout' | 'success'>('welcome');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [config, setConfig] = useState<OdooConfig>(() => {
    const saved = localStorage.getItem('giofarma_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'yape' | 'plin' | 'whatsapp'>('yape');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSyncingOdoo, setIsSyncingOdoo] = useState(false);

  // Detección inicial de modo admin por URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'admin') {
      setIsAdminMode(true);
    }
  }, []);

  // Gesto secreto: 5 clics en el logo activa modo admin
  const handleLogoClick = useCallback(() => {
    setLogoClickCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setIsAdminMode(true);
        return 0;
      }
      return next;
    });
    // Resetear contador tras 2 segundos de inactividad
    setTimeout(() => setLogoClickCount(0), 2000);
  }, []);

  useEffect(() => {
    if (view === 'welcome') {
      const interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % BANNERS.length);
      }, 7000);
      return () => clearInterval(interval);
    }
  }, [view]);

  useEffect(() => {
    localStorage.setItem('giofarma_config', JSON.stringify(config));
  }, [config]);

  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter(p => {
      const matchesCategory = activeCategory === "Todos" || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing && existing.quantity > 1) return prev.map(item => item.id === id ? { ...item, quantity: item.quantity - 1 } : item);
      return prev.filter(item => item.id !== id);
    });
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleAiAsk = async () => {
    if (!aiMessage.trim()) return;
    setIsAiLoading(true);
    setAiResponse("");
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Eres el asistente profesional de GIO+FARMA. Responde con elegancia y conocimiento médico breve. Usuario: "${aiMessage}"`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiResponse(response.text || "Su bienestar es nuestra prioridad.");
    } catch (err) {
      setAiResponse("Lo sentimos, intente de nuevo más tarde.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleFinalizeOrder = async () => {
    setIsSyncingOdoo(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsSyncingOdoo(false);
      setCart([]);
      setView('success');
    } catch (e) {
      setIsSyncingOdoo(false);
      alert("Error al conectar con Odoo. Verifique su configuración.");
    }
  };

  // El botón de configuración ahora solo se renderiza si isAdminMode es verdadero
  const AdminSettingsButton = () => {
    if (!isAdminMode) return null;
    return (
      <button 
        onClick={() => setIsSettingsOpen(true)} 
        className="group flex items-center gap-3 px-5 py-3 bg-slate-900 text-white rounded-2xl hover:bg-[#e6007e] transition-all shadow-xl border border-white/10"
      >
        <ShieldAlert size={18} className="text-[#8cc63f]" />
        <span className="text-[11px] font-black uppercase tracking-widest">Panel Farmacia</span>
      </button>
    );
  };

  if (view === 'welcome') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center overflow-x-hidden">
        <header className="w-full max-w-7xl px-8 py-8 flex justify-between items-center z-20">
          <Logo size="md" onClick={handleLogoClick} />
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex gap-10 text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]">
              <span className="hover:text-slate-900 cursor-pointer transition-all">Servicios</span>
              <span className="hover:text-slate-900 cursor-pointer transition-all">Sedes</span>
            </div>
            <AdminSettingsButton />
          </div>
        </header>

        <main className="flex-1 w-full max-w-7xl px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-6">
          <div className="lg:col-span-7 lg:order-2 relative">
             <div className="relative aspect-[16/10] lg:aspect-[4/3] rounded-[3rem] lg:rounded-[4rem] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.06)] bg-slate-50">
                {BANNERS.map((slide, idx) => (
                  <div key={idx} className={`absolute inset-0 transition-all duration-1000 transform ${idx === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}>
                     <img src={slide.image} className="w-full h-full object-cover" alt={slide.title} />
                     <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent"></div>
                     <div className="absolute bottom-8 left-8 right-8 lg:bottom-12 lg:left-12 lg:right-12 space-y-3">
                        <h2 className="text-2xl md:text-5xl font-black text-white tracking-tight leading-tight">{slide.title}</h2>
                        <p className="text-white/80 font-medium text-xs md:text-base max-w-md line-clamp-2">{slide.subtitle}</p>
                     </div>
                  </div>
                ))}
                <div className="absolute bottom-6 right-8 lg:bottom-8 lg:right-12 flex gap-2 lg:gap-3">
                  {BANNERS.map((_, idx) => (
                    <button key={idx} onClick={() => setCurrentSlide(idx)} className={`h-1 lg:h-1.5 transition-all duration-500 rounded-full ${idx === currentSlide ? 'w-8 lg:w-12 bg-white' : 'w-2 bg-white/30'}`} />
                  ))}
                </div>
             </div>
          </div>

          <div className="lg:col-span-5 lg:order-1 space-y-8 lg:space-y-12">
             <div className="space-y-4 lg:space-y-6">
                <div className="w-fit px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Award size={14} className="text-[#e6007e]" /> Excelencia Profesional
                </div>
                <h1 className="text-4xl md:text-7xl font-black text-slate-900 leading-[1] tracking-tighter">
                  Tu Bienestar es <br /> <span className="text-[#e6007e]">Prioridad.</span>
                </h1>
                <p className="text-slate-500 text-base md:text-lg font-medium leading-relaxed max-w-md">
                  GIO+FARMA conecta tu salud con el sistema ERP de Odoo para una gestión farmacéutica eficiente.
                </p>
             </div>

             <div className="flex flex-col sm:flex-row gap-4 lg:gap-5">
                <Button onClick={() => { setDeliveryMethod('pickup'); setView('menu'); }} className="flex-1 shadow-2xl">
                   Empezar Pedido <ArrowRight size={20} />
                </Button>
                <div className="flex-1 text-center bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
                   <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-2">Pague con:</p>
                   <div className="flex justify-center gap-3">
                      <div className="w-10 h-10 bg-[#8C2C94] rounded-xl flex items-center justify-center text-white font-black text-xs">Y</div>
                      <div className="w-10 h-10 bg-[#00BCD4] rounded-xl flex items-center justify-center text-white font-black text-xs">P</div>
                   </div>
                </div>
             </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-3xl border-b border-slate-50 px-6 md:px-12 py-5 flex items-center justify-between">
        <div className="cursor-pointer" onClick={() => setView('welcome')}>
          <Logo size="sm" onClick={handleLogoClick} />
        </div>
        
        <div className="flex-1 max-w-2xl mx-16 relative hidden lg:block text-center">
           <AdminSettingsButton />
        </div>

        <div className="flex items-center gap-4 lg:gap-6">
          <button onClick={() => setIsAiOpen(true)} className="flex items-center gap-3 px-4 lg:px-5 py-2.5 bg-slate-900 text-white rounded-[1.2rem] text-[11px] font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-100">
            <Sparkles size={16} className="text-[#8cc63f]" />
            <span className="hidden sm:inline">Expert AI</span>
          </button>
          <button onClick={() => setIsCartOpen(true)} className="relative p-2.5 text-slate-900 hover:bg-slate-50 rounded-2xl transition-all">
            <ShoppingCart size={22} />
            {cart.length > 0 && (
              <span className="absolute top-1 right-1 bg-[#e6007e] text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <aside className="w-full md:w-80 bg-white md:border-r border-slate-50 flex flex-col overflow-y-auto">
          <div className="p-10 space-y-10">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-2">Especialidades</p>
              <div className="flex md:flex-col gap-1.5 overflow-x-auto no-scrollbar">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`whitespace-nowrap flex items-center justify-between px-6 py-4 rounded-[1.5rem] transition-all flex-shrink-0 md:flex-shrink text-left ${activeCategory === cat ? 'bg-slate-900 text-white font-bold shadow-2xl' : 'text-slate-400 hover:bg-slate-50'}`}>
                    <span className="text-[13px] tracking-tight">{cat}</span>
                    {activeCategory === cat && <ChevronRight size={14} className="hidden md:block" />}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Solo se muestra aviso si estamos en modo admin y falta configurar */}
            {isAdminMode && !config.apiKey && (
              <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex gap-3 animate-pulse">
                 <AlertCircle size={20} className="text-amber-500 shrink-0" />
                 <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase">
                    Configuración pendiente en Odoo.
                 </p>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 p-8 md:p-16 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
              <div className="space-y-2">
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">{activeCategory}</h1>
                <p className="text-slate-300 font-medium text-base italic">Atención farmacéutica de alta gama.</p>
              </div>
              <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-slate-100 shadow-sm">
                 <button onClick={() => setDeliveryMethod('pickup')} className={`px-8 py-3.5 rounded-2xl text-[11px] font-black transition-all flex items-center gap-2 ${deliveryMethod === 'pickup' ? 'bg-[#e6007e] text-white shadow-lg shadow-pink-100' : 'text-slate-300'}`}>
                   <Store size={18} /> Recojo
                 </button>
                 <button onClick={() => setDeliveryMethod('delivery')} className={`px-8 py-3.5 rounded-2xl text-[11px] font-black transition-all flex items-center gap-2 ${deliveryMethod === 'delivery' ? 'bg-[#e6007e] text-white shadow-lg shadow-pink-100' : 'text-slate-300'}`}>
                   <Truck size={18} /> Delivery
                 </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-10">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} onAdd={addToCart} />
              ))}
            </div>
          </div>
        </main>

        <aside className={`fixed inset-y-0 right-0 w-full md:w-[32rem] bg-white z-[60] flex flex-col shadow-2xl transition-transform duration-700 ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-10 border-b flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
              <ShoppingCart size={24} className="text-[#e6007e]" />
              <h2 className="text-2xl font-black tracking-tight">Tu Bolsa GIO+</h2>
            </div>
            <button onClick={() => setIsCartOpen(false)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-300"><X size={24}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-10 space-y-8">
            {cart.map(item => (
              <div key={item.id} className="flex gap-6 items-center group">
                <div className="w-20 h-20 rounded-2xl bg-slate-50 p-4 border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all"><img src={item.image} className="w-full h-full object-contain mix-blend-multiply" /></div>
                <div className="flex-1">
                  <p className="font-bold text-sm truncate text-slate-900">{item.name}</p>
                  <p className="text-base font-black text-[#e6007e]">S/ {item.price.toFixed(2)}</p>
                  <div className="flex items-center gap-3 mt-2">
                     <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-900">-</button>
                     <span className="font-bold text-xs">{item.quantity}</span>
                     <button onClick={() => addToCart(item)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-900">+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-10 bg-white border-t space-y-8">
            <div className="flex justify-between items-end px-2">
               <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Monto Final</span>
               <span className="text-5xl font-black tracking-tighter">S/ {total.toFixed(2)}</span>
            </div>
            <Button disabled={cart.length === 0} onClick={() => setView('checkout')} className="w-full !rounded-[2.5rem]">
              Proceder al Pago <ChevronRight size={20} />
            </Button>
          </div>
        </aside>
      </div>

      {/* Checkout con Números Dinámicos */}
      {view === 'checkout' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl" onClick={() => setView('menu')}></div>
          <div className="relative bg-white w-full max-w-5xl rounded-[3rem] lg:rounded-[4.5rem] shadow-2xl p-8 lg:p-20 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 overflow-y-auto lg:overflow-hidden max-h-[95vh]">
             <div className="space-y-8 lg:space-y-12">
                <h2 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tighter">Confirma tu Pedido</h2>
                <div className="space-y-8">
                   {deliveryMethod === 'delivery' ? (
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-300 uppercase px-4 flex items-center gap-2"><MapPin size={12}/> Dirección de Entrega</label>
                        <textarea placeholder="Referencia exacta..." className="w-full p-6 lg:p-8 bg-slate-50/50 rounded-[2rem] outline-none font-bold text-base min-h-[120px] resize-none border border-slate-100 focus:bg-white" value={address} onChange={e => setAddress(e.target.value)} />
                     </div>
                   ) : (
                     <div className="bg-slate-50 p-8 rounded-[2rem] flex items-center gap-6 border border-slate-100">
                        <Store size={30} className="text-[#e6007e]" />
                        <div className="space-y-1">
                           <p className="text-base font-black">SEDE CENTRAL GIO+</p>
                           <p className="text-[10px] font-bold text-slate-400">Recojo habilitado en 15 minutos.</p>
                        </div>
                     </div>
                   )}
                   <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-300 uppercase px-4">Elija Medio de Pago</label>
                     <div className="grid grid-cols-3 gap-3">
                       {['yape', 'plin', 'whatsapp'].map(m => (
                         <button key={m} onClick={() => setPaymentMethod(m as any)} className={`p-6 rounded-[2.5rem] border transition-all flex flex-col items-center gap-2 ${paymentMethod === m ? 'border-[#e6007e] bg-pink-50/30' : 'border-slate-100 hover:border-slate-200'}`}>
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg ${m === 'yape' ? 'bg-[#8C2C94]' : m === 'plin' ? 'bg-[#00BCD4]' : 'bg-[#25D366]'}`}>{m[0].toUpperCase()}</div>
                           <span className="text-[9px] font-black uppercase tracking-widest">{m}</span>
                         </button>
                       ))}
                     </div>
                   </div>

                   {(paymentMethod === 'yape' || paymentMethod === 'plin') && (
                     <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] animate-in fade-in zoom-in duration-300 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                        <p className="text-[10px] font-bold uppercase opacity-50 tracking-[0.2em] mb-4">Transferir ahora a {paymentMethod.toUpperCase()}</p>
                        <div className="flex items-center gap-4">
                           <Smartphone size={32} className="text-[#8cc63f]" />
                           <p className="text-4xl font-black tracking-widest">{paymentMethod === 'yape' ? config.yapeNumber : config.plinNumber}</p>
                        </div>
                        <p className="text-[10px] font-bold opacity-30 mt-4 uppercase">GIO+ FARMA INTERNACIONAL S.A.C.</p>
                     </div>
                   )}
                </div>
             </div>

             <div className="bg-slate-50/50 p-8 lg:p-12 rounded-[2.5rem] lg:rounded-[4rem] flex flex-col justify-between border border-slate-100 shadow-inner">
                <div className="space-y-6">
                   <h3 className="text-2xl font-black tracking-tight">Resumen de Cuenta</h3>
                   <div className="space-y-4 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                     {cart.map(i => (
                       <div key={i.id} className="flex justify-between items-center text-sm">
                          <span className="text-slate-400 font-medium">{i.name} <span className="text-slate-900 font-bold ml-1">x{i.quantity}</span></span>
                          <span className="font-black text-slate-900">S/ {(i.price * i.quantity).toFixed(2)}</span>
                       </div>
                     ))}
                   </div>
                </div>
                <div className="space-y-6 pt-8 border-t border-slate-200">
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Total a Pagar</span>
                      <span className="text-4xl lg:text-5xl font-black text-[#e6007e] tracking-tighter">S/ {total.toFixed(2)}</span>
                   </div>
                   <Button onClick={handleFinalizeOrder} loading={isSyncingOdoo} className="w-full !rounded-[2.5rem] !py-7 !text-xl shadow-2xl shadow-pink-100">
                     Sincronizar con Odoo
                   </Button>
                   <div className="flex items-center justify-center gap-2 opacity-30">
                      <ShieldCheck size={16} />
                      <span className="text-[9px] font-bold uppercase tracking-widest">Conexión Segura XML-RPC</span>
                   </div>
                </div>
             </div>
             
             <button onClick={() => setView('menu')} className="absolute top-8 right-8 lg:top-12 lg:right-12 p-3 hover:bg-slate-50 rounded-full transition-all text-slate-200"><X size={32} /></button>
          </div>
        </div>
      )}

      {/* Panel Administrativo (Configuración) - Solo renderizado si isAdminMode */}
      {isSettingsOpen && isAdminMode && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setIsSettingsOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] p-8 lg:p-14 space-y-10 animate-in zoom-in duration-300 shadow-3xl">
             <div className="flex justify-between items-center">
                <div className="space-y-1">
                   <div className="flex items-center gap-3">
                      <Settings className="text-[#e6007e]" size={32} />
                      <h2 className="text-3xl font-black tracking-tight">Panel Administrativo</h2>
                   </div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1">Control de Sistemas GIO+ FARMA</p>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100"><X size={24} /></button>
             </div>

             <div className="space-y-10">
                <section className="space-y-6">
                   <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <Database size={18} className="text-slate-400" />
                      <h3 className="text-sm font-black uppercase text-slate-900">Credenciales Odoo (XML-RPC)</h3>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 px-2 flex items-center gap-2"><Globe size={12}/> URL Instancia</label>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:bg-white focus:ring-1 focus:ring-slate-100 transition-all" value={config.url} onChange={e => setConfig({...config, url: e.target.value})} placeholder="https://ejemplo.odoo.com" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 px-2 flex items-center gap-2"><Database size={12}/> Nombre Base Datos</label>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:bg-white focus:ring-1 focus:ring-slate-100 transition-all" value={config.db} onChange={e => setConfig({...config, db: e.target.value})} placeholder="odoo_db_01" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 px-2 flex items-center gap-2"><User size={12}/> Usuario Admin</label>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:bg-white focus:ring-1 focus:ring-slate-100 transition-all" value={config.username} onChange={e => setConfig({...config, username: e.target.value})} placeholder="admin@giofarma.com" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 px-2 flex items-center gap-2"><Lock size={12}/> Odoo API Key / Pass</label>
                        <input type="password" placeholder="Key de usuario Odoo" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:bg-white focus:ring-1 focus:ring-slate-100 transition-all" value={config.apiKey} onChange={e => setConfig({...config, apiKey: e.target.value})} />
                      </div>
                   </div>
                </section>

                <section className="space-y-6">
                   <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <Smartphone size={18} className="text-slate-400" />
                      <h3 className="text-sm font-black uppercase text-slate-900">Números para Cobranza</h3>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 px-2 flex items-center gap-2"><Activity size={12}/> Número Yape</label>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:bg-white focus:ring-1 focus:ring-slate-100 transition-all" value={config.yapeNumber} onChange={e => setConfig({...config, yapeNumber: e.target.value})} placeholder="999 999 999" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 px-2 flex items-center gap-2"><Zap size={12}/> Número Plin</label>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:bg-white focus:ring-1 focus:ring-slate-100 transition-all" value={config.plinNumber} onChange={e => setConfig({...config, plinNumber: e.target.value})} placeholder="999 999 999" />
                      </div>
                   </div>
                </section>
             </div>

             <div className="pt-8 border-t flex flex-col items-center gap-4">
                <Button onClick={() => setIsSettingsOpen(false)} className="w-full !rounded-[2rem] shadow-2xl">Guardar y Sincronizar</Button>
                <div className="flex items-center gap-3 opacity-30 mt-2">
                   <button onClick={() => setIsAdminMode(false)} className="text-[9px] font-black uppercase tracking-widest hover:underline">Cerrar Sesión Admin</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Pantalla Éxito */}
      {view === 'success' && (
        <div className="fixed inset-0 z-[300] bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
          <div className="w-40 h-40 bg-slate-50 text-[#8cc63f] rounded-[4.5rem] flex items-center justify-center mb-10 shadow-2xl border border-slate-50 animate-bounce duration-[3000ms]"><CheckCircle2 size={80} /></div>
          <div className="space-y-4">
             <h1 className="text-5xl font-black tracking-tighter uppercase text-slate-900">ORDEN CONFIRMADA</h1>
             <p className="text-xl text-slate-400 font-medium italic">Sincronizado exitosamente con Odoo ERP.</p>
          </div>
          <div className="mt-16 bg-slate-900 p-12 rounded-[3.5rem] w-full max-w-xl text-white">
             <p className="text-[10px] font-black uppercase opacity-40 mb-2">Comprobante Interno</p>
             <p className="text-3xl font-black">#GIO-{Math.floor(Math.random()*90000)+10000}</p>
          </div>
          <div className="mt-12"><Button onClick={() => setView('welcome')} variant="outline" className="!px-20 !py-5 !text-xl">Volver al Inicio</Button></div>
        </div>
      )}

      {/* Asistente AI GIO+ */}
      {isAiOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-end p-4 md:p-10">
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-sm" onClick={() => setIsAiOpen(false)}></div>
          <div className="relative w-full max-w-lg h-full bg-white flex flex-col animate-in slide-in-from-right duration-700 shadow-3xl rounded-[3rem] lg:rounded-[4rem] overflow-hidden border border-slate-100">
             <div className="p-10 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-5"><Sparkles size={28} className="text-[#8cc63f]" /><h3 className="text-xl font-black">Asesor GIO+ AI</h3></div>
                <button onClick={() => setIsAiOpen(false)}><X size={28} /></button>
             </div>
             <div className="flex-1 p-8 overflow-y-auto space-y-8 bg-slate-50/20">
                <div className="flex gap-4">
                  <Logo size="sm" onClick={handleLogoClick} />
                  <div className="bg-white p-6 rounded-[2rem] rounded-tl-none text-xs font-medium text-slate-600 shadow-sm border border-slate-50">Hola, soy su asesor experto. ¿En qué puedo orientarle hoy sobre su salud o pedido?</div>
                </div>
                {aiResponse && <div className="flex gap-4 flex-row-reverse animate-in slide-in-from-bottom-2"><div className="bg-slate-900 p-6 rounded-[2rem] rounded-tr-none text-xs text-white leading-relaxed shadow-2xl">{aiResponse}</div></div>}
                {isAiLoading && <div className="flex justify-center p-4"><div className="w-2 h-2 bg-[#e6007e] rounded-full animate-bounce"></div></div>}
             </div>
             <div className="p-8 bg-white border-t flex gap-4">
                <input placeholder="Escriba su consulta médica..." value={aiMessage} onChange={e => setAiMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiAsk()} className="flex-1 px-6 py-5 bg-slate-50 rounded-[1.5rem] outline-none text-sm font-bold" />
                <button onClick={handleAiAsk} className="p-5 bg-slate-900 text-white rounded-[1.5rem] shadow-xl hover:scale-105 transition-all"><ArrowUpRight size={24} /></button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Iniciar Aplicación ---

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
