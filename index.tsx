
import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  CheckCircle2,
  ArrowRight,
  Truck,
  Store,
  Stethoscope,
  LayoutDashboard,
  Trash2,
  Info,
  ArrowUpRight,
  Zap,
  Tag,
  Heart,
  ShieldCheck,
  Home,
  Menu as MenuIcon,
  Stethoscope as DoctorIcon,
  KeyRound,
  Activity,
  User,
  TrendingUp,
  Package,
  DollarSign,
  LogOut,
  BarChart3,
  Clock
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
  stock: number;
  promo?: boolean;
  scientific_name?: string;
}

interface CartItem extends Product {
  quantity: number;
}

const INITIAL_PRODUCTS: Product[] = [
  { id: 1, name: "Panadol Forte 500mg", scientific_name: "Paracetamol", price: 1.20, description: "Alivio efectivo para dolores moderados y fiebre.", category: "Medicamentos", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400", stock: 150, promo: true },
  { id: 2, name: "CeraVe Crema Facial", scientific_name: "Ceramidas", price: 89.00, description: "Hidratación profunda para pieles sensibles.", category: "Cuidado de Piel", image: "https://images.unsplash.com/photo-1556229174-5e42a09e45af?w=400", stock: 45, promo: true },
  { id: 3, name: "Suero Fisiológico 100ml", scientific_name: "Cloruro de Sodio", price: 4.50, description: "Ideal para limpieza nasal y heridas.", category: "Primeros Auxilios", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400", stock: 200 },
  { id: 4, name: "Huggies Premium Care G", price: 55.90, description: "Pañales con canales de aire para piel seca.", category: "Bebés", image: "https://images.unsplash.com/photo-1544126592-807daa2b5650?w=400", stock: 30, promo: true },
  { id: 5, name: "Jabón Neutro Glicerina", price: 12.00, description: "Hipoalergénico para toda la familia.", category: "Higiene", image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400", stock: 80 },
  { id: 6, name: "Vitamina C 1000mg", scientific_name: "Ácido Ascórbico", price: 45.00, description: "Refuerza tu sistema inmunológico.", category: "Medicamentos", image: "https://images.unsplash.com/photo-1616671285435-08e178047990?w=400", stock: 120, promo: true }
];

const PROMO_BANNERS = [
  { id: 1, title: "Cuidado Facial Premium", sub: "Hasta 40% OFF", img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1200", color: "from-blue-600/40" },
  { id: 2, title: "Kit de Vitaminas GIO+", sub: "Nuevos Ingresos", img: "https://images.unsplash.com/photo-1550573104-4eb6278a3cce?q=80&w=1200", color: "from-[#e6007e]/40" },
  { id: 3, title: "Mamá y Bebé", sub: "Cuidados Especiales", img: "https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=1200", color: "from-green-600/40" },
  { id: 4, title: "Bienestar Digestivo", sub: "Lo Mejor para Ti", img: "https://images.unsplash.com/photo-1540348563403-194098939630?q=80&w=1200", color: "from-amber-600/40" }
];

const WEB_CATEGORIES = ["Todos", "Medicamentos", "Cuidado de Piel", "Bebés", "Higiene", "Primeros Auxilios"];

// --- UI Components ---

const Logo = ({ inverted = false, size = "md", onClick }: { inverted?: boolean, size?: "sm" | "md" | "lg", onClick?: () => void }) => {
  const sizes = {
    sm: { circle: "w-8 h-8", text: "text-lg", sub: "text-[5px]", icon: 16 },
    md: { circle: "w-10 h-10", text: "text-2xl", sub: "text-[6px]", icon: 20 },
    lg: { circle: "w-16 h-16", text: "text-5xl", sub: "text-[10px]", icon: 32 }
  };
  const current = sizes[size];
  const textColor = inverted ? "text-white" : "text-[#e6007e]";
  const circleColor = inverted ? "border-white" : "border-[#e6007e]";

  return (
    <div onClick={(e) => { e.stopPropagation(); if(onClick) onClick(); }} className={`flex items-center gap-3 ${textColor} select-none cursor-pointer group`}>
      <div className={`${current.circle} border-2 ${circleColor} rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:rotate-[15deg] group-hover:bg-[#e6007e] group-hover:text-white group-hover:shadow-2xl`}>
         <Stethoscope size={current.icon} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col leading-none">
        <div className="flex items-center font-black tracking-tighter">
          <span>GIO</span>
          <span className="text-[#8cc63f] mx-1">+</span>
          <span>FARMA</span>
        </div>
        <p className={`font-bold ${current.sub} uppercase tracking-[0.2em] opacity-50 mt-1`}>La farmacia del futuro</p>
      </div>
    </div>
  );
};

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, loading = false }: any) => {
  const variants: any = {
    primary: "bg-[#e6007e] text-white hover:bg-[#c90078] shadow-lg shadow-pink-100 btn-glow",
    outline: "bg-white text-slate-900 border border-slate-200 hover:border-[#e6007e] hover:text-[#e6007e]",
    dark: "bg-slate-950 text-white hover:bg-slate-900 shadow-2xl",
    success: "bg-[#8cc63f] text-white shadow-lg"
  };
  return (
    <button disabled={disabled || loading} onClick={onClick} className={`px-10 py-5 rounded-[2rem] font-bold transition-all flex items-center justify-center gap-3 active:scale-95 text-sm tracking-wide ${variants[variant]} ${className}`}>
      {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : children}
    </button>
  );
};

const App = () => {
  const [view, setView] = useState<'welcome' | 'menu' | 'checkout' | 'success' | 'admin_dashboard'>(() => {
    const isAdmin = localStorage.getItem('giofarma_admin_active') === 'true';
    return isAdmin ? 'admin_dashboard' : 'welcome';
  });
  const [isAdminMode, setIsAdminMode] = useState(() => localStorage.getItem('giofarma_admin_active') === 'true');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [passInput, setPassInput] = useState("");
  
  const [products] = useState<Product[]>(INITIAL_PRODUCTS);
  const promoSliderRef = useRef<HTMLDivElement>(null);

  // Lógica de Scroll Automático para Banners
  useEffect(() => {
    if (view !== 'menu') return;
    
    const interval = setInterval(() => {
      if (promoSliderRef.current) {
        const slider = promoSliderRef.current;
        const maxScroll = slider.scrollWidth - slider.clientWidth;
        if (slider.scrollLeft >= maxScroll - 10) {
          slider.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          slider.scrollBy({ left: slider.clientWidth / 2, behavior: 'smooth' });
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [view]);

  const scrollSlider = (direction: 'left' | 'right') => {
    if (promoSliderRef.current) {
      const amount = promoSliderRef.current.clientWidth / 1.5;
      promoSliderRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  const handleLogoClick = () => {
    if (isAdminMode) { setView('admin_dashboard'); return; }
    setShowPassModal(true);
  };

  const handleVerifyPass = () => {
    if (passInput === "admin123") {
      setIsAdminMode(true);
      setShowPassModal(false);
      setPassInput("");
      localStorage.setItem('giofarma_admin_active', 'true');
      setView('admin_dashboard');
    } else {
      alert("Acceso denegado: PIN Incorrecto");
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = activeCategory === "Todos" || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery, products]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleAiAsk = async () => {
    if (!aiMessage.trim()) return;
    setIsAiLoading(true);
    setAiResponse("");
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Como asesor farmacéutico de GIO+FARMA, responde profesionalmente a: "${aiMessage}". Sé empático y claro.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiResponse(response.text || "Lo siento, ¿puedes repetir?");
    } catch (err) {
      setAiResponse("Disculpa, el asesor no está disponible ahora.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- RENDERING ADMIN DASHBOARD ---
  if (view === 'admin_dashboard' && isAdminMode) {
    return (
      <div className="min-h-screen bg-slate-50 flex overflow-hidden font-sans animate-fade-up">
        <aside className="w-80 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800">
          <div className="p-10 border-b border-slate-800 flex justify-between items-center">
            <Logo inverted size="sm" />
          </div>
          <nav className="flex-1 p-8 space-y-4">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Operaciones ERP</div>
            <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-[#e6007e] text-white shadow-xl shadow-pink-900/20 font-bold transition-all">
              <Package size={18} /> Inventario
            </button>
            <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-400 hover:bg-slate-800 font-bold transition-all">
              <TrendingUp size={18} /> Ventas & POS
            </button>
            <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-400 hover:bg-slate-800 font-bold transition-all">
               <Activity size={18} /> Logs de IA
            </button>
            <div className="pt-8 text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Configuración</div>
            <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-400 hover:bg-slate-800 font-bold transition-all">
               <User size={18} /> Usuarios
            </button>
          </nav>
          <div className="p-8 border-t border-slate-800">
             <button onClick={() => { setIsAdminMode(false); localStorage.removeItem('giofarma_admin_active'); setView('welcome'); }} className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-red-500/10 text-red-400 font-bold hover:bg-red-500/20 transition-all">
                <LogOut size={18} /> Salir del Sistema
             </button>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto p-12 space-y-12 bg-[#fcfcfc]">
           <header className="flex justify-between items-center">
              <div>
                <h1 className="text-5xl font-black tracking-tighter text-slate-900">Dashboard de Control</h1>
                <p className="text-slate-400 font-medium">GIO+ FARMA v2.5 - Nodo Principal</p>
              </div>
              <div className="flex gap-4">
                 <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center"><DollarSign size={24}/></div>
                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ventas Hoy</p><p className="text-xl font-black text-slate-900">S/ 4,200.00</p></div>
                 </div>
                 <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#e6007e]/10 text-[#e6007e] rounded-2xl flex items-center justify-center"><BarChart3 size={24}/></div>
                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visitantes</p><p className="text-xl font-black text-slate-900">1,245</p></div>
                 </div>
              </div>
           </header>

           <div className="grid grid-cols-1 gap-8">
              <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                 <div className="p-8 border-b flex justify-between items-center">
                    <h3 className="font-black text-xl">Estado de Inventario</h3>
                    <button className="text-xs font-bold text-[#e6007e] uppercase tracking-widest">Ver Todo</button>
                 </div>
                 <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                       <tr>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Salud de Stock</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y">
                       {products.map(p => (
                         <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-8 py-5 font-bold text-slate-800">{p.name}</td>
                            <td className="px-8 py-5 font-black">{p.stock} u.</td>
                            <td className="px-8 py-5">S/ {p.price.toFixed(2)}</td>
                            <td className="px-8 py-5">
                               <div className="w-full bg-slate-100 h-2 rounded-full max-w-[100px] overflow-hidden">
                                  <div className="bg-[#8cc63f] h-full" style={{ width: `${Math.min(100, p.stock/2)}%` }}></div>
                               </div>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </main>
      </div>
    );
  }

  // --- RENDERING WELCOME VIEW ---
  if (view === 'welcome') {
    return (
      <div className="min-h-screen relative flex flex-col bg-white overflow-hidden">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <header className="fixed top-0 left-0 right-0 z-[100] px-6 py-6 lg:px-12 glass-nav">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Logo size="md" onClick={handleLogoClick} />
            <div className="flex items-center gap-4">
              <button className="hidden sm:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <ShieldCheck size={16} className="text-[#8cc63f]" /> Boutique Certificada
              </button>
              {isAdminMode && (
                <button onClick={() => setView('admin_dashboard')} className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl animate-scale-in">
                  <LayoutDashboard size={20} />
                </button>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-12 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
            <div className="text-center lg:text-left space-y-8 order-2 lg:order-1">
              <div className="inline-flex items-center gap-3 px-6 py-2 bg-slate-100 rounded-full animate-fade-up stagger-1">
                <Activity size={16} className="text-[#e6007e]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Salud Digital Premium</span>
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9] animate-fade-up stagger-2">
                Bienvenido al <br /> <span className="text-[#e6007e]">bienestar.</span>
              </h1>
              <p className="text-lg lg:text-xl text-slate-500 font-medium max-w-lg mx-auto lg:mx-0 animate-fade-up stagger-3">
                Redefiniendo la farmacia con elegancia, tecnología y una red de entrega ultra-veloz.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-fade-up stagger-3">
                <Button onClick={() => setView('menu')} className="w-full sm:w-fit text-lg py-7">Explorar Catálogo <ArrowRight size={22} /></Button>
              </div>
            </div>
            <div className="relative order-1 lg:order-2 flex justify-center animate-scale-in">
              <div className="relative w-full max-w-[500px]">
                <div className="aspect-[4/5] rounded-[4rem] overflow-hidden premium-shadow transform rotate-1 hover:rotate-0 transition-all duration-700 border-8 border-white">
                  <img src="https://images.unsplash.com/photo-1512678080530-7760d81faba6?q=80&w=1200" className="w-full h-full object-cover scale-110 hover:scale-100 transition-all duration-1000" />
                </div>
                <div className="absolute -bottom-10 -right-4 lg:-right-12 bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-50">
                   <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-[#e6007e] rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-pink-100">
                        <Clock size={32} />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery GIO+</p>
                        <p className="text-xl font-black text-slate-900 leading-tight">En 25 min</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --- CATALOG & STORE RENDERING ---
  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcfc] pb-24 lg:pb-0 animate-fade-up">
      {/* Header Unificado */}
      <header className="sticky top-0 z-[100] glass-nav px-6 lg:px-12 py-5 flex items-center justify-between">
         <Logo size="sm" onClick={handleLogoClick} />
         <div className="hidden md:flex flex-1 max-w-xl mx-16 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#e6007e] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Buscar medicamentos o cuidado personal..." 
              className="w-full pl-16 pr-8 py-4 bg-slate-100/50 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#e6007e]/10 transition-all outline-none border border-transparent focus:border-slate-100" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
         </div>
         <div className="flex items-center gap-6">
            <button onClick={() => setIsAiOpen(true)} className="hidden sm:flex items-center gap-3 px-6 py-3 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-[#e6007e] transition-all">
               <Sparkles size={16} className="text-[#8cc63f]"/> IA Asistente
            </button>
            <button onClick={() => setIsCartOpen(true)} className="relative p-3.5 text-slate-900 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-all">
               <ShoppingCart size={24} />
               {cart.length > 0 && (
                 <span className="absolute -top-1 -right-1 bg-[#e6007e] text-white text-[9px] font-black w-6 h-6 flex items-center justify-center rounded-full border-4 border-white shadow-lg animate-bounce">
                   {cart.length}
                 </span>
               )}
            </button>
         </div>
      </header>

      {/* FLASH NEWS TICKER */}
      <div className="bg-slate-950 overflow-hidden relative h-10 flex items-center border-y border-white/5">
         <div className="flex whitespace-nowrap animate-marquee items-center gap-12">
            {[
              { icon: Zap, text: "OFERTA VIP: 2x1 EN PROTECTORES SOLARES SELECCIONADOS" },
              { icon: Truck, text: "DELIVERY GRATUITO EN TODO LIMA METROPOLITANA POR ESTE MES" },
              { icon: Activity, text: "NUEVA LÍNEA DE CUIDADO CAPIAL DERMATOLÓGICO DISPONIBLE" },
              { icon: DoctorIcon, text: "CONSULTA CON NUESTRA IA ESPECIALISTA EN DERMATOLOGÍA 24/7" }
            ].map((news, i) => (
              <div key={i} className="flex items-center gap-4 text-white">
                <news.icon size={12} className="text-[#8cc63f]" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em]">{news.text}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
              </div>
            ))}
         </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
         <aside className="lg:w-80 lg:border-r border-slate-100 bg-white shrink-0 overflow-x-auto lg:overflow-y-auto no-scrollbar scroll-smooth">
            <div className="flex lg:flex-col p-4 lg:p-10 gap-3 lg:gap-2">
               <p className="hidden lg:block text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-5 mb-5">Categorías</p>
               {WEB_CATEGORIES.map(c => (
                 <button 
                   key={c} 
                   onClick={() => setActiveCategory(c)} 
                   className={`whitespace-nowrap px-8 lg:px-6 py-4 lg:py-5 rounded-2xl font-black text-sm transition-all flex items-center justify-between group shrink-0 ${activeCategory === c ? 'bg-[#e6007e] text-white shadow-xl shadow-pink-100' : 'text-slate-400 bg-slate-50 lg:bg-transparent hover:bg-slate-50'}`}
                 >
                   <span>{c}</span>
                   <ChevronRight size={14} className={`hidden lg:block ${activeCategory === c ? 'opacity-100 translate-x-1' : 'opacity-0'} transition-all`} />
                 </button>
               ))}
            </div>
         </aside>

         <main className="flex-1 overflow-y-auto p-4 lg:p-12 no-scrollbar bg-[#fcfcfc]">
            <div className="max-w-7xl mx-auto space-y-12">
               
               {/* PROMOTIONAL IMAGE SLIDER (Actualizado con Movimiento) */}
               <section className="relative group/slider">
                  <div 
                    ref={promoSliderRef}
                    className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-4 cursor-grab active:cursor-grabbing"
                  >
                     {PROMO_BANNERS.map((banner) => (
                       <div key={banner.id} className="min-w-[85%] sm:min-w-[45%] lg:min-w-[32%] h-72 lg:h-80 relative rounded-[3rem] overflow-hidden snap-center flex-shrink-0 group/card shadow-xl border border-slate-100">
                          <img src={banner.img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover/card:scale-110" />
                          <div className={`absolute inset-0 bg-gradient-to-t ${banner.color} to-transparent opacity-80`}></div>
                          <div className="absolute inset-x-0 bottom-0 p-8 lg:p-10 flex flex-col justify-end text-white">
                             <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest w-fit mb-4">Campañas GIO+</span>
                             <h3 className="text-2xl lg:text-3xl font-black leading-tight tracking-tighter mb-2">{banner.title}</h3>
                             <p className="font-bold text-white/80">{banner.sub}</p>
                             <button className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest group/btn">
                                Ver Selección <ArrowRight size={16} className="group-hover/btn:translate-x-2 transition-transform"/>
                             </button>
                          </div>
                       </div>
                     ))}
                  </div>
                  
                  {/* Controles de Navegación del Slider */}
                  <div className="hidden lg:flex justify-between absolute top-1/2 -translate-y-1/2 -inset-x-8 pointer-events-none opacity-0 group-hover/slider:opacity-100 transition-opacity">
                     <button 
                       onClick={() => scrollSlider('left')}
                       className="w-16 h-16 bg-white rounded-full shadow-2xl flex items-center justify-center pointer-events-auto hover:bg-[#e6007e] hover:text-white transition-all transform active:scale-90"
                     >
                       <ChevronLeft size={28}/>
                     </button>
                     <button 
                       onClick={() => scrollSlider('right')}
                       className="w-16 h-16 bg-white rounded-full shadow-2xl flex items-center justify-center pointer-events-auto hover:bg-[#e6007e] hover:text-white transition-all transform active:scale-90"
                     >
                       <ChevronRight size={28}/>
                     </button>
                  </div>

                  {/* Mobile Indicator Helper */}
                  <div className="lg:hidden flex justify-center gap-2 mt-2">
                     {PROMO_BANNERS.map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                     ))}
                  </div>
               </section>

               {/* Grid de Productos */}
               <section className="space-y-10">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                     <div className="space-y-2">
                        <h2 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter">{activeCategory}</h2>
                        <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           <Activity size={14} className="text-[#8cc63f]" /> Stock disponible actualizado
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-10">
                     {filteredProducts.map((p, idx) => (
                       <div key={p.id} className="bg-white rounded-[2.5rem] lg:rounded-[3.5rem] p-6 lg:p-10 border border-slate-50 shadow-sm hover:shadow-2xl transition-all duration-500 group flex flex-col h-full animate-fade-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                          <div className="aspect-square bg-slate-50/50 rounded-[2.5rem] p-6 mb-6 lg:mb-10 relative overflow-hidden shrink-0 border border-slate-100/30">
                             {p.promo && <div className="absolute top-4 left-4 bg-[#e6007e] text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl">Hot Offer</div>}
                             <img src={p.image} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700" />
                          </div>
                          <div className="flex-1 space-y-2 mb-8">
                             <span className="text-[8px] lg:text-[10px] font-black text-[#8cc63f] uppercase tracking-widest">{p.category}</span>
                             <h3 className="font-black text-slate-900 text-sm lg:text-xl leading-tight line-clamp-2">{p.name}</h3>
                             <p className="text-[9px] font-bold text-slate-300 italic">Disponibilidad: {p.stock} unidades</p>
                          </div>
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-auto">
                             <div className="flex flex-col">
                                <span className="text-[8px] lg:text-[10px] font-black text-slate-300 uppercase">Precio</span>
                                <span className="text-xl lg:text-3xl font-black text-slate-900">S/ {p.price.toFixed(2)}</span>
                             </div>
                             <button onClick={() => addToCart(p)} className="p-4 lg:p-5 bg-slate-900 text-white rounded-[1.5rem] hover:bg-[#e6007e] transition-all flex items-center justify-center shadow-lg active:scale-90"><Plus size={24} strokeWidth={3} /></button>
                          </div>
                       </div>
                     ))}
                  </div>
               </section>
            </div>
         </main>
      </div>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-24 bg-white/95 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around px-6 z-[150] pb-4">
         {[
           { icon: Home, label: 'Inicio', view: 'welcome' },
           { icon: MenuIcon, label: 'Menú', view: 'menu' },
           { icon: Activity, label: 'IA Salud', action: () => setIsAiOpen(true) },
           { icon: LayoutDashboard, label: 'ERP', action: handleLogoClick }
         ].map((item, i) => (
           <button key={i} onClick={() => item.view ? setView(item.view as any) : item.action && item.action()} className={`flex flex-col items-center gap-1.5 ${view === item.view ? 'text-[#e6007e]' : 'text-slate-300'} transition-all`}>
              <item.icon size={22} strokeWidth={view === item.view ? 2.5 : 2} />
              <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
           </button>
         ))}
      </nav>

      {/* Auth Modal Admin */}
      {showPassModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 animate-fade-up">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl" onClick={() => setShowPassModal(false)}></div>
           <div className="relative bg-white w-full max-w-md rounded-[4rem] p-16 text-center space-y-10 shadow-3xl border border-white">
              <div className="w-24 h-24 bg-[#e6007e]/10 text-[#e6007e] rounded-[2.5rem] flex items-center justify-center mx-auto"><KeyRound size={48}/></div>
              <div className="space-y-2">
                 <h3 className="text-3xl font-black text-slate-900 tracking-tight">Acceso Central</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identificación Profesional Requerida</p>
              </div>
              <input type="password" autoFocus placeholder="PIN" className="w-full p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 text-center text-4xl font-black outline-none focus:border-[#e6007e] transition-all tracking-[0.4em]" value={passInput} onChange={e => setPassInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleVerifyPass()} />
              <Button onClick={handleVerifyPass} className="w-full py-7 text-xl">Autenticar Sistema</Button>
           </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[300] flex justify-end transition-all">
           <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-md" onClick={() => setIsCartOpen(false)}></div>
           <div className="relative w-full lg:max-w-lg h-full bg-white shadow-2xl flex flex-col">
              <div className="p-10 border-b flex justify-between items-center bg-slate-50/30 shrink-0">
                 <h3 className="text-2xl font-black">Tu Bolsa</h3>
                 <button onClick={() => setIsCartOpen(false)} className="p-3 bg-white rounded-2xl border border-slate-100"><X size={28}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
                 {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center gap-6">
                       <ShoppingCart size={100} strokeWidth={1} />
                       <p className="font-black text-sm uppercase tracking-widest">Aún no hay productos</p>
                    </div>
                 ) : cart.map(item => (
                    <div key={item.id} className="flex gap-6 p-4 bg-slate-50 rounded-[2.5rem]">
                       <div className="w-24 h-24 bg-white p-3 rounded-2xl shrink-0"><img src={item.image} className="w-full h-full object-contain" /></div>
                       <div className="flex-1">
                          <p className="font-black text-slate-900">{item.name}</p>
                          <p className="font-black text-[#e6007e] text-lg">S/ {item.price.toFixed(2)}</p>
                          <div className="flex items-center gap-4 mt-3">
                             <button onClick={() => setCart(prev => prev.map(i => i.id === item.id ? {...i, quantity: Math.max(1, i.quantity - 1)} : i))} className="p-2 bg-white rounded-lg"><Minus size={14}/></button>
                             <span className="font-black">{item.quantity}</span>
                             <button onClick={() => addToCart(item)} className="p-2 bg-white rounded-lg"><Plus size={14}/></button>
                          </div>
                       </div>
                       <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={20}/></button>
                    </div>
                 ))}
              </div>
              <div className="p-10 border-t bg-slate-50/50 space-y-6">
                 <div className="flex justify-between items-end"><span className="text-[10px] font-black uppercase tracking-widest">Total</span><span className="text-5xl font-black">S/ {total.toFixed(2)}</span></div>
                 <Button disabled={cart.length === 0} onClick={() => setView('checkout')} className="w-full py-7 text-lg shadow-2xl">Confirmar Pedido</Button>
              </div>
           </div>
        </div>
      )}

      {/* AI Assistant */}
      {isAiOpen && (
        <div className="fixed inset-0 z-[400] flex justify-center lg:justify-end animate-fade-up">
           <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-xl hidden lg:block" onClick={() => setIsAiOpen(false)}></div>
           <div className="relative w-full lg:max-w-xl h-full bg-white flex flex-col overflow-hidden">
              <div className="p-10 bg-slate-950 text-white flex justify-between items-center">
                 <h3 className="text-2xl font-black flex items-center gap-3">Asistente GIO+ <Sparkles size={20} className="text-[#8cc63f]"/></h3>
                 <button onClick={() => setIsAiOpen(false)} className="p-3 bg-white/10 rounded-2xl"><X size={28}/></button>
              </div>
              <div className="flex-1 p-10 overflow-y-auto space-y-8 bg-slate-50/30 no-scrollbar">
                 {aiResponse && <div className="bg-white p-10 rounded-[2.5rem] text-slate-700 font-medium border border-slate-100 shadow-sm leading-relaxed">{aiResponse}</div>}
                 {isAiLoading && <div className="flex gap-2 p-4 bg-white rounded-full w-fit"><div className="w-2 h-2 bg-[#e6007e] rounded-full animate-bounce"></div><div className="w-2 h-2 bg-[#e6007e] rounded-full animate-bounce delay-75"></div></div>}
              </div>
              <div className="p-8 lg:p-10 bg-white border-t flex gap-4 shrink-0">
                 <input className="flex-1 bg-slate-50 p-6 rounded-[2rem] outline-none font-bold text-sm border border-slate-100" placeholder="Pregunta sobre salud..." value={aiMessage} onChange={e => setAiMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiAsk()} />
                 <button onClick={handleAiAsk} className="p-6 bg-slate-950 text-white rounded-[2rem] shadow-xl"><ArrowUpRight size={28}/></button>
              </div>
           </div>
        </div>
      )}

      {/* Checkout Modal */}
      {view === 'checkout' && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xl" onClick={() => setView('menu')}></div>
           <div className="relative bg-white w-full max-w-xl rounded-[4rem] p-16 space-y-10 shadow-3xl animate-fade-up">
              <h2 className="text-5xl font-black tracking-tighter">Resumen <br /> Final</h2>
              <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 shadow-inner space-y-4">
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400"><span>Monto</span><span>S/ {total.toFixed(2)}</span></div>
                 <div className="flex justify-between items-end pt-4 border-t border-slate-200">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#e6007e]">Total a Pagar</span>
                    <span className="text-5xl font-black text-slate-900 leading-none">S/ {total.toFixed(2)}</span>
                 </div>
              </div>
              <Button onClick={() => setView('success')} className="w-full py-8 text-xl">Finalizar Compra</Button>
           </div>
        </div>
      )}

      {/* Success View */}
      {view === 'success' && (
        <div className="fixed inset-0 z-[700] bg-white flex flex-col items-center justify-center p-8 text-center animate-fade-up">
           <div className="w-40 h-40 bg-[#8cc63f]/10 text-[#8cc63f] rounded-[4rem] flex items-center justify-center mb-10"><CheckCircle2 size={80} /></div>
           <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-4">¡LOGRADO!</h1>
           <p className="text-xl text-slate-400 font-medium italic mb-12 max-w-md mx-auto">Tu salud llegará en 25 minutos. GIO+ FARMA te agradece.</p>
           <Button onClick={() => { setView('welcome'); setCart([]); }} variant="dark" className="px-16">Regresar</Button>
        </div>
      )}
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
