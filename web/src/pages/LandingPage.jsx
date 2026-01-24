import { useState, useEffect, useRef } from 'react';
import { 
  IconSun, 
  IconMoon, 
  IconMenu, 
  IconArrowRight,
  IconStack,
  IconActivity,
  IconBrain,
  IconShield,
  IconCloud,
  IconChartBar,
  IconCheck,
  IconX,
  IconChevronDown
} from '@tabler/icons-react';
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavbarButton
} from '@/components/ui/resizable-navbar';

// --- Components ---

const FadeIn = ({ children, delay = 0, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const CompanyLogo = ({ name, children }) => (
  <a 
    href="#"
    className="group w-full h-28 flex items-center justify-center relative p-4 
    before:absolute before:-left-1 before:top-0 before:z-10 before:h-screen before:w-px before:bg-border before:content-[''] 
    after:absolute after:-top-1 after:left-0 after:z-10 after:h-px after:w-screen after:bg-border after:content-[''] overflow-hidden"
  >
    <div className="transition-all duration-300 ease-[cubic-bezier(0.165,0.84,0.44,1)] translate-y-0 group-hover:-translate-y-4 flex items-center justify-center w-full h-full text-muted-foreground group-hover:text-primary">
      {children}
    </div>
    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-8 group-hover:translate-y-4 transition-all duration-300 ease-[cubic-bezier(0.165,0.84,0.44,1)]">
      <span className="text-sm font-medium text-primary flex items-center gap-1">
        Read Story <IconArrowRight size={14} />
      </span>
    </div>
  </a>
);

const AccordionItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="border-b border-border last:border-0">
      <button
        className="w-full py-4 px-2 flex items-center justify-between text-left focus:outline-none group"
        onClick={onClick}
      >
        <span className="text-base font-medium group-hover:text-primary transition-colors">{question}</span>
        <IconChevronDown 
          size={20} 
          className={`text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-48 opacity-100 pb-4' : 'max-h-0 opacity-0'}`}
      >
        <p className="text-muted-foreground text-sm px-2 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
};

export default function LandingPage() {
  const [theme, setTheme] = useState('light');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState(null);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleAccordion = (index) => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  const navItems = [
    { name: 'Home', link: '#hero' },
    { name: 'Features', link: '#features' },
    { name: 'Pricing', link: '#pricing' },
    { name: 'FAQ', link: '#faq' }
  ];

  return (
    <div className={`min-h-screen font-sans selection:bg-primary/20 ${theme === 'dark' ? 'dark' : ''}`}>
      <style>{`
        @keyframes marquee-vertical {
          from { transform: translateY(0); }
          to { transform: translateY(-50%); }
        }
        .animate-marquee-vertical {
          animation: marquee-vertical 20s linear infinite;
        }
        .animate-marquee-vertical:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="max-w-full mx-auto border-x min-h-screen relative bg-background text-foreground transition-colors duration-300">
        {/* Background Grid Lines */}
        <div className="hidden md:block w-px h-full border-l border-border absolute top-0 left-6 z-0" />
        <div className="hidden md:block w-px h-full border-r border-border absolute top-0 right-6 z-0" />
        
        {/* Navbar with Resizable Component */}
        <Navbar>
          <NavBody className="!min-w-0">
            <div className="flex items-center justify-between w-full px-6">
              <a className="flex items-center gap-2.5 group flex-shrink-0" href="#">
                <div className="relative flex items-center justify-center p-1 rounded-lg group-hover:bg-primary/5 transition-colors">
                  <img 
                    src="/OverSight.png" 
                    alt="OverSight Logo" 
                    className="w-7 h-7 rounded-md object-cover"
                  />
                </div>
                <p className="text-sm font-bold tracking-tight text-primary">OverSight<span className="text-muted-foreground font-normal">AI</span></p>
              </a>

              <NavItems items={navItems} />

              <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                <NavbarButton variant="gradient" className="!px-5 !py-1.5 !text-xs">
                  Get Started
                </NavbarButton>
                <button onClick={toggleTheme} className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary">
                  {theme === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />}
                </button>
              </div>
            </div>
          </NavBody>

          <MobileNav>
            <MobileNavHeader>
              <a className="flex items-center gap-2.5 group" href="#">
                <div className="relative flex items-center justify-center p-1 rounded-lg group-hover:bg-primary/5 transition-colors">
                  <img 
                    src="/OverSight.png" 
                    alt="OverSight Logo" 
                    className="w-7 h-7 rounded-md object-cover"
                  />
                </div>
                <p className="text-sm font-bold tracking-tight text-primary">OverSight<span className="text-muted-foreground font-normal">AI</span></p>
              </a>
              <div className="flex items-center gap-2">
                <button onClick={toggleTheme} className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary">
                  {theme === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />}
                </button>
                <MobileNavToggle
                  isOpen={mobileMenuOpen}
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                />
              </div>
            </MobileNavHeader>
            <MobileNavMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.link}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <NavbarButton variant="gradient" className="w-full !mt-4">
                Get Started
              </NavbarButton>
            </MobileNavMenu>
          </MobileNav>
        </Navbar>

        {/* Main Content */}
        <main className="flex flex-col w-full relative z-10">
          
          {/* Hero Section */}
          <section id="hero" className="w-full relative overflow-hidden pt-20 md:pt-32 pb-20">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[#1E40AF]/20 blur-[120px] rounded-full pointer-events-none -z-10" />
            
            <div className="flex flex-col items-center px-6 relative z-10">
              <FadeIn className="flex flex-col items-center gap-8 text-center max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  v2.0 is now live
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60 leading-[1.1]">
                  Governance for the <br/>
                  <span className="text-[#1E40AF]">Age of AI Agents</span>
                </h1>
                
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl text-balance leading-relaxed">
                  Complete oversight, compliance, and monitoring for your autonomous agents. 
                  Simple enough for developers, powerful enough for enterprise security.
                </p>

                <div className="flex items-center gap-4 pt-4">
                  <a href="#" className="h-12 px-8 rounded-full bg-[#1E40AF] text-white font-medium flex items-center gap-2 hover:bg-[#1e3a8a] transition-all shadow-xl shadow-blue-900/20 hover:scale-105 active:scale-95">
                    Start Free Trial <IconArrowRight size={18} />
                  </a>
                  <a href="#" className="h-12 px-8 rounded-full border border-border bg-background hover:bg-secondary text-foreground font-medium flex items-center gap-2 transition-all hover:scale-105 active:scale-95">
                    View Demo
                  </a>
                </div>
              </FadeIn>

              <FadeIn delay={200} className="mt-20 w-full max-w-6xl relative">
                <div className="rounded-xl border border-border/50 bg-background/50 backdrop-blur shadow-2xl overflow-hidden aspect-[16/9] md:aspect-[2/1] group relative">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50" />
                  
                  {/* Mock Dashboard UI */}
                  <div className="w-full h-full bg-slate-50 dark:bg-slate-900/50 p-4 md:p-8 flex flex-col gap-6">
                    <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                    <div className="grid grid-cols-3 gap-6">
                      <div className="h-32 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-4 space-y-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50" />
                        <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-700 rounded" />
                        <div className="h-8 w-1/2 bg-slate-100 dark:bg-slate-700 rounded" />
                      </div>
                      <div className="h-32 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-4 space-y-3">
                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/50" />
                        <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-700 rounded" />
                        <div className="h-8 w-1/2 bg-slate-100 dark:bg-slate-700 rounded" />
                      </div>
                      <div className="h-32 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-4 space-y-3">
                        <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/50" />
                        <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-700 rounded" />
                        <div className="h-8 w-1/2 bg-slate-100 dark:bg-slate-700 rounded" />
                      </div>
                    </div>
                    <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6">
                        <div className="flex items-end gap-2 h-full pb-0">
                            {[40, 65, 45, 80, 55, 70, 40, 60, 75, 50, 65, 85].map((h, i) => (
                                <div key={i} className="flex-1 bg-blue-500/10 dark:bg-blue-500/20 rounded-t-sm relative group/bar overflow-hidden" style={{height: `${h}%`}}>
                                    <div className="absolute inset-x-0 bottom-0 top-full bg-blue-500 transition-all duration-700 group-hover/bar:top-0" />
                                </div>
                            ))}
                        </div>
                    </div>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center bg-background/10 backdrop-blur-[2px] transition-opacity duration-500 group-hover:opacity-0">
                    <div className="bg-background/80 backdrop-blur-md border border-border px-6 py-3 rounded-full shadow-xl flex items-center gap-3">
                        <IconActivity className="text-blue-600 animate-pulse" />
                        <span className="font-medium">Live Monitoring Preview</span>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </section>

          {/* Company Section - Infinity Grid */}
          <section id="company" className="relative py-20 border-y border-border bg-slate-50/50 dark:bg-slate-900/20">
             <div className="max-w-7xl mx-auto px-6 mb-10 text-center">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Trusted by innovative teams at</p>
             </div>
             
             <div className="w-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background z-10 pointer-events-none" />
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 border-t border-border">
                    {['Acme Corp', 'GlobalBank', 'TechStart', 'Nebula AI', 'Quantasoft', 'BlueSky', 'Vertex', 'Horizon', 'Pinnacle', 'Zenith'].map((name, i) => (
                       <CompanyLogo key={i} name={name}>
                          <span className="flex items-center gap-2 text-lg font-bold">
                             {/* Simple generic logo shapes */}
                             <div className={`w-6 h-6 rounded bg-gradient-to-tr opacity-80 ${[
                                 'from-blue-500 to-cyan-500', 
                                 'from-purple-500 to-pink-500', 
                                 'from-green-500 to-emerald-500',
                                 'from-orange-500 to-yellow-500',
                                 'from-red-500 to-rose-500'
                             ][i % 5]}`} />
                             {name}
                          </span>
                       </CompanyLogo>
                    ))}
                </div>
             </div>
          </section>

          {/* Features Bento Grid */}
          <section id="features" className="py-32 px-6 relative">
             <div className="max-w-3xl mx-auto text-center mb-20">
                <FadeIn>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Capabilities used by the best</h2>
                    <p className="text-lg text-muted-foreground">Governance isn't just about blocking—it's about enabling safe, scalable AI adoption.</p>
                </FadeIn>
             </div>

             <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-6 gap-6 auto-rows-[400px]">
                {/* Large Card 1 */}
                <FadeIn className="md:col-span-4 relative group overflow-hidden rounded-3xl border border-border bg-card p-8 flex flex-col justify-between">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                        <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 mb-6">
                            <IconChartBar size={24} />
                        </div>
                        <h3 className="text-2xl font-semibold mb-2">Real-time Analytics</h3>
                        <p className="text-muted-foreground">Trace every token, cost, and latency metrics across all your LLM calls.</p>
                    </div>
                    <div className="absolute right-0 bottom-0 w-2/3 h-2/3 bg-gradient-to-tl from-slate-100 dark:from-slate-800 rounded-tl-3xl border-t border-l border-border p-4 shadow-sm translate-y-4 translate-x-4 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform">
                        {/* Fake chart */}
                        <div className="w-full h-full flex items-end gap-2 px-4 pb-4">
                            {[30, 45, 35, 60, 50, 75, 45, 65, 80].map((h, i) => (
                                <div key={i} className="flex-1 bg-blue-500 rounded-t opacity-80" style={{height: `${h}%`}} />
                            ))}
                        </div>
                    </div>
                </FadeIn>

                {/* Tall Card 2 */}
                <FadeIn delay={100} className="md:col-span-2 relative group overflow-hidden rounded-3xl border border-border bg-card p-8">
                     <div className="absolute inset-0 bg-mesh-gradient opacity-10" />
                     <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 mb-6">
                        <IconShield size={24} />
                    </div>
                    <h3 className="text-2xl font-semibold mb-2">Policy Guardrails</h3>
                    <p className="text-muted-foreground">Block sensitive data and enforce compliance rules before they happen.</p>
                    
                    <div className="mt-8 space-y-3">
                        {['PII Detection', 'Topic Filtering', 'Rate Limiting', 'Cost Caps'].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                                <IconCheck size={16} className="text-green-500" />
                                <span className="text-sm font-medium">{item}</span>
                            </div>
                        ))}
                    </div>
                </FadeIn>

                 {/* Card 3 */}
                 <FadeIn delay={200} className="md:col-span-3 relative group overflow-hidden rounded-3xl border border-border bg-card p-8">
                    <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 mb-6">
                        <IconBrain size={24} />
                    </div>
                    <h3 className="text-2xl font-semibold mb-2">Model Agnostic</h3>
                    <p className="text-muted-foreground">Works with OpenAI, Anthropic, Llama, and your custom fine-tuned models.</p>
                    <div className="mt-8 flex flex-wrap gap-2">
                        {['GPT-4', 'Claude 3', 'Llama 3', 'Mistral', 'Gemini'].map((badge) => (
                            <span key={badge} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium border border-border">
                                {badge}
                            </span>
                        ))}
                    </div>
                 </FadeIn>

                 {/* Card 4 */}
                 <FadeIn delay={300} className="md:col-span-3 relative group overflow-hidden rounded-3xl border border-border bg-card p-8">
                    <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 mb-6">
                        <IconCloud size={24} />
                    </div>
                    <h3 className="text-2xl font-semibold mb-2">Data Sovereignity</h3>
                    <p className="text-muted-foreground">Keep your data in your VPC. We never train on your logs.</p>
                    <div className="mt-6 p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                            <div className="w-2 h-2 rounded-full bg-red-500"/>
                            <div className="w-2 h-2 rounded-full bg-yellow-500"/>
                            <div className="w-2 h-2 rounded-full bg-green-500"/>
                        </div>
                        <p className="text-emerald-400">$ deployment_mode <span className="text-white">=</span> <span className="text-amber-300">"self-hosted"</span></p>
                        <p className="text-blue-400">✓ Analytics pipeline initialized</p>
                        <p className="text-blue-400">✓ PII redaction active</p>
                    </div>
                 </FadeIn>
             </div>
          </section>

          {/* Testimonials Marquee */}
          <section className="py-24 overflow-hidden border-y border-border bg-slate-50 dark:bg-black/20">
             <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
                <h2 className="text-3xl font-bold tracking-tight">Loved by Engineering Teams</h2>
             </div>
             
             <div className="relative w-full h-[500px] overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-slate-50 dark:from-background to-transparent z-10" />
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-50 dark:from-background to-transparent z-10" />
                
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[0, 1, 2].map((colIndex) => (
                        <div key={colIndex} className={`flex flex-col gap-6 animate-marquee-vertical ${colIndex % 2 === 1 ? 'mt-10' : ''}`} style={{animationDuration: `${20 + colIndex * 5}s`}}>
                             {[...Array(6)].map((_, i) => (
                                 <div key={i} className="p-6 rounded-2xl bg-background border border-border shadow-sm hover:shadow-md transition-shadow">
                                     <div className="flex items-center gap-1 mb-4 text-amber-400">
                                         {[...Array(5)].map((_,star) => <svg key={star} width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
                                     </div>
                                     <p className="text-sm leading-relaxed mb-4 text-muted-foreground">
                                         "OverSight has completely changed how we deploy AI agents. The visibility into cost and latency is unmatched."
                                     </p>
                                     <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500" />
                                         <div>
                                             <p className="text-xs font-bold text-foreground">Sarah Jenkins</p>
                                             <p className="text-xs text-muted-foreground">CTO at TechFlow</p>
                                         </div>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    ))}
                </div>
             </div>
          </section>

          {/* Pricing */}
          <section id="pricing" className="py-32 px-6">
                <div className="max-w-3xl mx-auto text-center mb-20">
                    <h2 className="text-4xl font-bold mb-4">Transparent Pricing</h2>
                    <p className="text-muted-foreground">Start small and scale as your agent fleet grows.</p>
                </div>

                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Free Tier */}
                    <div className="rounded-3xl border border-border p-8 bg-background flex flex-col hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                        <h3 className="text-xl font-bold">Developer</h3>
                        <div className="mt-4 mb-8">
                            <span className="text-4xl font-bold">$0</span>
                            <span className="text-muted-foreground">/mo</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            {['Up to 5k traces/mo', '7-day retention', '1 user'].map(f => (
                                <li key={f} className="flex items-center gap-3 text-sm">
                                    <IconCheck size={18} className="text-blue-500" /> {f}
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-3 rounded-full border border-border font-medium hover:bg-secondary transition-colors">Start Free</button>
                    </div>

                    {/* Pro Tier */}
                    <div className="rounded-3xl border-2 border-[#1E40AF] p-8 bg-background flex flex-col relative shadow-2xl">
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 md:translate-x-0 mr-8 bg-[#1E40AF] text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Most Popular</div>
                        <h3 className="text-xl font-bold">Startup</h3>
                        <div className="mt-4 mb-8">
                            <span className="text-4xl font-bold">$199</span>
                            <span className="text-muted-foreground">/mo</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            {['1M traces/mo', '30-day retention', '5 users', 'Email Support', 'Custom Evaluators'].map(f => (
                                <li key={f} className="flex items-center gap-3 text-sm font-medium">
                                    <IconCheck size={18} className="text-[#1E40AF]" /> {f}
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-3 rounded-full bg-[#1E40AF] text-white font-medium hover:bg-[#1e3a8a] transition-colors shadow-lg">Get Started</button>
                    </div>

                    {/* Enterprise Tier */}
                    <div className="rounded-3xl border border-border p-8 bg-background flex flex-col hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                        <h3 className="text-xl font-bold">Scale</h3>
                        <div className="mt-4 mb-8">
                            <span className="text-4xl font-bold">Custom</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            {['Unlimited traces', '90-day retention', 'SSO & SAML', 'VPC Deployment', 'SLA Support'].map(f => (
                                <li key={f} className="flex items-center gap-3 text-sm">
                                    <IconCheck size={18} className="text-blue-500" /> {f}
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-3 rounded-full border border-border font-medium hover:bg-secondary transition-colors">Contact Sales</button>
                    </div>
                </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="py-24 px-6 bg-secondary/30">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {[
                            { q: "What is an AI Agent?", a: "An AI Agent is an autonomous system that can perceive its environment, reason about how to achieve goals, and take actions to accomplish them." },
                            { q: "How does OverSight work?", a: "We provide an SDK that you drop into your agent code. It asynchronously sends telemetry to our cloud or your self-hosted instance without adding latency." },
                            { q: "Is there a performance impact?", a: "Minimal to none. Our SDK operations are non-blocking and batched to ensure your agent's response time remains unaffected." },
                            { q: "Can I self-host this?", a: "Yes! The Enterprise plan allows you to deploy the entire stack within your own VPC for complete data isolation." }
                        ].map((item, i) => (
                            <AccordionItem 
                                key={i} 
                                question={item.q} 
                                answer={item.a} 
                                isOpen={openAccordion === i} 
                                onClick={() => toggleAccordion(i)} 
                            />
                        ))}
                    </div>
                </div>
          </section>

          {/* CTA */}
          <section className="py-24 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[#1E40AF] z-0">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                
                <div className="max-w-4xl mx-auto text-center relative z-10 text-white">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">Ready to govern your AI fleet?</h2>
                    <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">Join the leading teams who trust OverSight for their AI governance and monitoring needs.</p>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <button className="h-14 px-8 rounded-full bg-white text-blue-900 font-bold text-lg hover:bg-blue-50 transition-colors shadow-xl">
                            Start Building Now
                        </button>
                        <button className="h-14 px-8 rounded-full border border-white/30 hover:bg-white/10 text-white font-semibold text-lg transition-colors backdrop-blur-sm">
                            Read Documentation
                        </button>
                    </div>
                </div>
          </section>

          {/* Footer */}
          <footer className="py-12 border-t border-border bg-background">
             <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                 <div className="flex items-center gap-2">
                     <span className="font-bold text-xl text-primary">OverSight AI</span>
                     <span className="text-xs text-muted-foreground ml-2">© 2026</span>
                 </div>
                 <div className="flex items-center gap-8 text-sm text-muted-foreground">
                     <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                     <a href="#" className="hover:text-primary transition-colors">Terms</a>
                     <a href="#" className="hover:text-primary transition-colors">Twitter</a>
                     <a href="#" className="hover:text-primary transition-colors">GitHub</a>
                 </div>
             </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
