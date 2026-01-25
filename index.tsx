
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Search, 
  ShoppingCart, 
  ChevronRight, 
  Plus, 
  Minus,
  X, 
  Sparkles, 
  CheckCircle2,
  ArrowRight,
  Truck,
  Store,
  Award,
  Stethoscope,
  LayoutDashboard,
  Trash2,
  Info,
  ArrowUpRight,
  Zap,
  Tag,
  Clock,
  Heart,
  ShieldCheck,
  Home,
  Menu as MenuIcon,
  Stethoscope as DoctorIcon,
  KeyRound,
  Activity,
  User
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
  const [view, setView] = useState<'welcome' | 'menu' | 'checkout' | 'success' | 'admin_dashboard'>('welcome');
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

  // Gestos Admin
  const [logoClickCount, setLogoClickCount] = useState(0);
  const handleLogoClick = () => {
    if (isAdminMode) { setView('admin_dashboard'); return; }
    const next = logoClickCount + 1;
    setLogoClickCount(next);
    if (next >= 3) { setShowPassModal(true); setLogoClickCount(0); }
    setTimeout(() => setLogoClickCount(0), 3000);
  };

  const handleVerifyPass = () => {
    if (passInput === "admin123") {
      setIsAdminMode(true);
      setShowPassModal(false);
      setPassInput("");
      setView('admin_dashboard');
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

  // --- Views ---

  if (view === 'welcome') {
    return (
      <div className="min-h-screen relative flex flex-col bg-white overflow-hidden">
        {/* Animated Background Elements */}
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        
        {/* Cabecera Móvil Corregida y Premium */}
        <header className="fixed top-0 left-0 right-0 z-[100] px-6 py-6 lg:px-12 glass-nav">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Logo size="md" onClick={handleLogoClick} />
            <div className="flex items-center gap-4">
              <button className="hidden sm:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <ShieldCheck size={16} className="text-[#8cc63f]" /> Calidad Asegurada
              </button>
              {isAdminMode && (
                <button onClick={() => setView('admin_dashboard')} className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl animate-scale-in">
                  <LayoutDashboard size={20} />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-12 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
            
            {/* Texto y Llamada a la acción */}
            <div className="text-center lg:text-left space-y-8 order-2 lg:order-1">
              <div className="inline-flex items-center gap-3 px-6 py-2 bg-slate-100 rounded-full animate-fade-up stagger-1">
                <Activity size={16} className="text-[#e6007e]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Salud Certificada GIO+</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9] animate-fade-up stagger-2">
                Elevamos tu <br />
                <span className="text-[#e6007e]">bienestar.</span>
              </h1>
              
              <p className="text-lg lg:text-xl text-slate-500 font-medium max-w-lg mx-auto lg:mx-0 animate-fade-up stagger-3">
                Una experiencia de farmacia redefinida. Productos de alta gama, entrega inteligente y asesoría inmediata en la palma de tu mano.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-fade-up stagger-3">
                <Button onClick={() => setView('menu')} className="w-full sm:w-fit text-lg py-7">
                  Comenzar Experiencia <ArrowRight size={22} />
                </Button>
                <div className="flex items-center justify-center gap-4 px-8 py-4 border border-slate-100 rounded-3xl bg-white/50 backdrop-blur-sm shadow-sm">
                  <div className="flex -space-x-3">
                    {[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-200 overflow-hidden"><img src={`https://i.pravatar.cc/100?u=${i}`} /></div>)}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-left leading-tight">
                    +10k Usuarios <br /> Confían en GIO+
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Assets Section */}
            <div className="relative order-1 lg:order-2 flex justify-center animate-scale-in">
              <div className="relative w-full max-w-[500px]">
                <div className="aspect-[4/5] rounded-[4rem] overflow-hidden premium-shadow transform -rotate-2 hover:rotate-0 transition-all duration-700">
                  <img src="https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover scale-110 hover:scale-100 transition-all duration-1000" />
                </div>
                
                {/* Floating Cards */}
                <div className="absolute -bottom-10 -right-4 lg:-right-12 bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-50 animate-bounce transition-all duration-1000">
                   <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-[#e6007e] rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-pink-100">
                        <Truck size={32} />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entrega Express</p>
                        <p className="text-xl font-black text-slate-900 leading-tight">30 Minutos</p>
                      </div>
                   </div>
                </div>

                <div className="absolute top-1/4 -left-12 hidden lg:flex bg-white/90 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-2xl border border-white gap-4 animate-pulse">
                   <div className="w-12 h-12 bg-[#8cc63f] rounded-2xl flex items-center justify-center text-white">
                      <Zap size={24} />
                   </div>
                   <div className="text-left">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Asesoría IA</p>
                      <p className="text-sm font-bold text-slate-900">Activa 24/7</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcfc] pb-24 lg:pb-0 animate-fade-up">
      {/* Header Catalogo - Corregido y Unificado */}
      <header className="sticky top-0 z-[100] glass-nav px-6 lg:px-12 py-5 flex items-center justify-between">
         <Logo size="sm" onClick={handleLogoClick} />
         
         <div className="hidden md:flex flex-1 max-w-xl mx-16 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#e6007e] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Encuentra salud y bienestar..." 
              className="w-full pl-16 pr-8 py-4 bg-slate-100/50 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#e6007e]/10 transition-all outline-none" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
         </div>

         <div className="flex items-center gap-6">
            <button onClick={() => setIsAiOpen(true)} className="hidden sm:flex items-center gap-3 px-6 py-3 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-[#e6007e] transition-all">
               <Sparkles size={16} className="text-[#8cc63f]"/> Especialista IA
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

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
         {/* Sidebar Navigation */}
         <aside className="lg:w-80 lg:border-r border-slate-100 bg-white shrink-0 overflow-x-auto lg:overflow-y-auto no-scrollbar scroll-smooth">
            <div className="flex lg:flex-col p-4 lg:p-10 gap-3 lg:gap-2">
               <p className="hidden lg:block text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-5 mb-5">Nuestras Secciones</p>
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
            
            <div className="hidden lg:block p-10 mt-8">
              <div className="p-8 bg-slate-950 rounded-[2.5rem] text-white relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-[#e6007e] blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                 <Tag className="mb-4 opacity-40" />
                 <h4 className="font-black text-2xl leading-tight mb-2">Club GIO+</h4>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Únete y recibe beneficios <br /> exclusivos cada mes.</p>
              </div>
            </div>
         </aside>

         <main className="flex-1 overflow-y-auto p-4 lg:p-12 no-scrollbar bg-[#f8fafc]/50">
            <div className="max-w-7xl mx-auto space-y-12">
               
               {/* Search Móvil - Solo aparece si el buscador desktop está oculto */}
               <div className="md:hidden">
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text" 
                      placeholder="Buscar medicinas..." 
                      className="w-full pl-14 pr-6 py-4 bg-white rounded-2xl shadow-sm border-none font-bold text-sm outline-none" 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
               </div>

               {/* Grid de Productos Premium */}
               <section className="space-y-10">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                     <div className="space-y-2">
                        <h2 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter">{activeCategory}</h2>
                        <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           <Activity size={14} className="text-[#8cc63f]" /> Stock disponible en tiempo real
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-10">
                     {filteredProducts.map((p, idx) => (
                       <div key={p.id} className="bg-white rounded-[2rem] lg:rounded-[3rem] p-5 lg:p-10 border border-slate-50 shadow-sm hover:shadow-2xl transition-all duration-500 group flex flex-col h-full animate-fade-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                          <div className="aspect-square bg-slate-50/50 rounded-[2rem] p-6 mb-6 lg:mb-10 relative overflow-hidden shrink-0">
                             {p.promo && <div className="absolute top-4 left-4 bg-[#e6007e] text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl">Oferta</div>}
                             <img src={p.image} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700" />
                          </div>
                          
                          <div className="flex-1 space-y-2 mb-8">
                             <span className="text-[8px] lg:text-[10px] font-black text-[#8cc63f] uppercase tracking-widest">{p.category}</span>
                             <h3 className="font-black text-slate-900 text-sm lg:text-xl leading-tight line-clamp-2">{p.name}</h3>
                             {p.scientific_name && <p className="text-[9px] font-bold text-slate-400 italic">Comp: {p.scientific_name}</p>}
                          </div>

                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-auto">
                             <div className="flex flex-col">
                                <span className="text-[8px] lg:text-[10px] font-black text-slate-300 uppercase">P. Sugerido</span>
                                <span className="text-xl lg:text-3xl font-black text-slate-900">S/ {p.price.toFixed(2)}</span>
                             </div>
                             <button onClick={() => addToCart(p)} className="p-4 lg:p-5 bg-slate-900 text-white rounded-2xl hover:bg-[#e6007e] transition-all flex items-center justify-center shadow-lg active:scale-90">
                                <Plus size={24} strokeWidth={3} />
                             </button>
                          </div>
                       </div>
                     ))}
                  </div>
               </section>
            </div>
         </main>
      </div>

      {/* Navegación Móvil Inferior con Estilo Apple */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-24 bg-white/80 backdrop-blur-xl border-t border-slate-50 flex items-center justify-around px-6 z-[150] pb-4">
         {[
           { icon: Home, label: 'Inicio', view: 'welcome' },
           { icon: MenuIcon, label: 'Catálogo', view: 'menu' },
           { icon: Activity, label: 'IA Salud', action: () => setIsAiOpen(true) },
           { icon: User, label: 'Perfil' }
         ].map((item, i) => (
           <button 
             key={i}
             onClick={() => item.view ? setView(item.view as any) : item.action && item.action()}
             className={`flex flex-col items-center gap-1.5 ${view === item.view ? 'text-[#e6007e]' : 'text-slate-300'} transition-all`}
           >
              <item.icon size={22} strokeWidth={view === item.view ? 2.5 : 2} />
              <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
           </button>
         ))}
      </nav>

      {/* Carrito y AI Assist Modals */}
      {/* ... (Se mantienen las funciones de Cart y AI pero con refinamientos de UI en el fondo) ... */}
      
      {/* Cart Drawer Premium */}
      <div className={`fixed inset-0 z-[300] ${isCartOpen ? 'visible' : 'invisible'} transition-all`}>
         <div className={`absolute inset-0 bg-slate-950/20 backdrop-blur-md transition-opacity duration-500 ${isCartOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsCartOpen(false)}></div>
         <div className={`absolute right-0 top-0 h-full w-full lg:max-w-lg bg-white shadow-[0_0_100px_rgba(0,0,0,0.1)] transform transition-transform duration-700 flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-10 border-b flex justify-between items-center bg-slate-50/30">
               <div>
                  <h3 className="text-2xl font-black tracking-tight">Tu Selección</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Garantía de calidad GIO+</p>
               </div>
               <button onClick={() => setIsCartOpen(false)} className="p-3 bg-white rounded-2xl border border-slate-100 hover:text-red-500 transition-all"><X size={28}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
               {cart.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center opacity-20 text-center gap-6">
                    <ShoppingCart size={100} strokeWidth={1} />
                    <p className="font-black text-sm uppercase tracking-widest">Aún no has agregado salud</p>
                 </div>
               ) : cart.map(item => (
                 <div key={item.id} className="flex gap-6 p-4 hover:bg-slate-50 rounded-[2rem] transition-all">
                    <div className="w-24 h-24 bg-white p-3 rounded-2xl shrink-0 border border-slate-50 shadow-sm"><img src={item.image} className="w-full h-full object-contain" /></div>
                    <div className="flex-1 py-1 space-y-1">
                       <p className="font-black text-slate-900">{item.name}</p>
                       <p className="font-black text-[#e6007e] text-lg">S/ {item.price.toFixed(2)}</p>
                       <div className="flex items-center gap-4 pt-3">
                          <div className="flex items-center bg-white border border-slate-100 rounded-xl p-1 shadow-sm">
                             <button onClick={() => setCart(prev => prev.map(i => i.id === item.id ? {...i, quantity: Math.max(1, i.quantity - 1)} : i))} className="p-2 hover:text-[#e6007e] transition-colors"><Minus size={14}/></button>
                             <span className="w-10 text-center text-sm font-black">{item.quantity}</span>
                             <button onClick={() => addToCart(item)} className="p-2 hover:text-[#e6007e] transition-colors"><Plus size={14}/></button>
                          </div>
                       </div>
                    </div>
                    <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} className="text-slate-200 hover:text-red-500 transition-colors self-start mt-2"><Trash2 size={20}/></button>
                 </div>
               ))}
            </div>
            <div className="p-10 border-t bg-slate-50/50 space-y-6">
               <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Inversión</span>
                  <span className="text-5xl font-black text-slate-900 leading-none">S/ {total.toFixed(2)}</span>
               </div>
               <Button disabled={cart.length === 0} onClick={() => setView('checkout')} className="w-full py-7 text-lg shadow-2xl">Confirmar Mi Pedido</Button>
            </div>
         </div>
      </div>

      {/* AI Assistant Full Screen Mobile */}
      {isAiOpen && (
        <div className="fixed inset-0 z-[400] flex justify-center lg:justify-end lg:p-10 animate-fade-up">
           <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-xl hidden lg:block" onClick={() => setIsAiOpen(false)}></div>
           <div className="relative w-full lg:max-w-xl h-full bg-white lg:rounded-[4rem] shadow-3xl flex flex-col overflow-hidden">
              <div className="p-10 bg-slate-950 text-white flex justify-between items-center shrink-0">
                 <div className="space-y-1">
                    <h3 className="text-2xl font-black flex items-center gap-3">Asistente GIO+ <Sparkles size={20} className="text-[#8cc63f]"/></h3>
                    <p className="text-[10px] font-bold text-[#8cc63f] uppercase tracking-widest">Profesional Farmacéutico Certificado</p>
                 </div>
                 <button onClick={() => setIsAiOpen(false)} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20"><X size={28}/></button>
              </div>
              <div className="flex-1 p-10 overflow-y-auto space-y-8 bg-slate-50/30 no-scrollbar">
                 {aiResponse && (
                   <div className="bg-white p-10 rounded-[2.5rem] rounded-tr-none text-base font-medium text-slate-700 border border-slate-100 shadow-sm leading-relaxed animate-scale-in">
                      {aiResponse}
                      <div className="mt-8 pt-6 border-t border-slate-50 flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <Info size={16} className="text-[#8cc63f]"/> Nota: Consulta siempre a tu médico.
                      </div>
                   </div>
                 )}
                 {isAiLoading && <div className="flex gap-2 p-6 bg-white rounded-full w-fit shadow-sm"><div className="w-2 h-2 bg-[#e6007e] rounded-full animate-bounce"></div><div className="w-2 h-2 bg-[#e6007e] rounded-full animate-bounce delay-75"></div><div className="w-2 h-2 bg-[#e6007e] rounded-full animate-bounce delay-150"></div></div>}
              </div>
              <div className="p-8 lg:p-10 bg-white border-t flex gap-4 shrink-0 pb-16 lg:pb-10">
                 <input 
                    className="flex-1 bg-slate-50 p-6 rounded-[2rem] outline-none font-bold text-sm focus:ring-2 focus:ring-[#e6007e]/10 transition-all border border-slate-100" 
                    placeholder="Escribe tu consulta de salud..." 
                    value={aiMessage} 
                    onChange={e => setAiMessage(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleAiAsk()} 
                 />
                 <button onClick={handleAiAsk} className="p-6 bg-slate-950 text-white rounded-[2rem] hover:bg-[#e6007e] transition-all shadow-xl"><ArrowUpRight size={28}/></button>
              </div>
           </div>
        </div>
      )}

      {/* Success View Premium */}
      {view === 'success' && (
        <div className="fixed inset-0 z-[600] bg-white flex flex-col items-center justify-center p-8 text-center animate-fade-up">
           <div className="w-40 h-40 bg-[#8cc63f]/10 text-[#8cc63f] rounded-[4rem] flex items-center justify-center mb-10 shadow-inner animate-pulse">
              <CheckCircle2 size={80} strokeWidth={2.5} />
           </div>
           <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter mb-4">¡PEDIDO RECIBIDO!</h1>
           <p className="text-xl text-slate-400 font-medium italic mb-12 max-w-md mx-auto leading-relaxed">Tu salud está en camino. GIO+FARMA te garantiza la entrega en 30 minutos o menos.</p>
           <Button onClick={() => { setView('welcome'); setCart([]); }} variant="dark" className="px-16">Volver al Portal Principal</Button>
        </div>
      )}

      {/* Auth Modal Admin */}
      {showPassModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 animate-fade-up">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl" onClick={() => setShowPassModal(false)}></div>
           <div className="relative bg-white w-full max-w-md rounded-[4rem] p-16 text-center space-y-10 shadow-3xl border border-white">
              <div className="w-24 h-24 bg-[#e6007e]/10 text-[#e6007e] rounded-[2.5rem] flex items-center justify-center mx-auto"><KeyRound size={48}/></div>
              <div className="space-y-2">
                 <h3 className="text-3xl font-black text-slate-900 tracking-tight">Acceso Central</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Identificación de Personal GIO+ FARMA</p>
              </div>
              <input type="password" autoFocus placeholder="PIN" className="w-full p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 text-center text-4xl font-black outline-none focus:border-[#e6007e] transition-all tracking-[0.4em]" value={passInput} onChange={e => setPassInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleVerifyPass()} />
              <Button onClick={handleVerifyPass} className="w-full py-7 text-xl">Ingresar al Sistema</Button>
           </div>
        </div>
      )}

      {/* Checkout Modal Premium */}
      {view === 'checkout' && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 lg:p-6 animate-fade-up">
           <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xl" onClick={() => setView('menu')}></div>
           <div className="relative bg-white w-full max-w-xl rounded-[4rem] p-10 lg:p-16 space-y-10 shadow-3xl overflow-y-auto max-h-[90vh] no-scrollbar">
              <div className="flex justify-between items-start">
                 <h2 className="text-4xl lg:text-5xl font-black tracking-tighter">Resumen <br /> de Pedido</h2>
                 <ShieldCheck size={40} className="text-[#8cc63f]" />
              </div>
              <div className="bg-slate-50 p-10 rounded-[3rem] space-y-5 border border-slate-100 shadow-inner">
                 <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]"><span>Salud & Bienestar</span><span>S/ {total.toFixed(2)}</span></div>
                 <div className="flex justify-between text-[10px] font-black text-[#8cc63f] uppercase tracking-[0.2em]"><span>Logística GIO+</span><span>Cortesía</span></div>
                 <div className="flex justify-between items-end border-t border-slate-200 pt-8 text-[#e6007e]">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Inversión Total</span>
                    <span className="text-5xl font-black leading-none tracking-tighter">S/ {total.toFixed(2)}</span>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4 lg:gap-6">
                 <button className="p-6 lg:p-8 border-2 border-slate-100 rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest flex flex-col items-center gap-3 hover:border-slate-900 transition-all"><Store size={22}/> Recojo Tienda</button>
                 <button className="p-6 lg:p-8 border-2 border-[#e6007e] bg-pink-50/50 rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest text-[#e6007e] flex flex-col items-center gap-3 shadow-xl shadow-pink-100"><Truck size={22}/> Delivery VIP</button>
              </div>
              <Button onClick={() => setView('success')} className="w-full py-8 text-xl shadow-2xl">Finalizar Mi Compra</Button>
           </div>
        </div>
      )}
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
