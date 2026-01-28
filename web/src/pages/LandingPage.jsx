import { useState, useEffect, useRef } from 'react';
import { ReactLenis } from 'lenis/react';
import { 
  IconArrowRight,
  IconStack,
  IconActivity,
  IconBrain,
  IconShield,
  IconCloud,
  IconChartBar,
  IconCheck,
  IconChevronDown,
  IconSun,
  IconMoon,
  IconBrandGithub,
  IconBrandGithubFilled
} from '@tabler/icons-react';
import { 
  Navbar, 
  NavBody, 
  NavItems, 
  MobileNav, 
  MobileNavHeader, 
  MobileNavToggle, 
  MobileNavMenu, 
  NavbarButton 
} from '@/components/ui/resizable-navbar';
import HeroSection from '@/components/HeroSection';
import VideoSection from '@/components/VideoSection';
import FeaturesSection from '@/components/FeaturesSection';
import GetInTouchModal from '@/components/GetInTouchModal';

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
    <div className="transition-all duration-300 ease-[cubic-bezier(0.165,0.84,0.44,1)] translate-y-0 group-hover:-translate-y-3 flex items-center justify-center w-full h-full text-muted-foreground group-hover:text-[#7C3AED]">
      {children}
    </div>
    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-6 group-hover:translate-y-3 transition-all duration-300 ease-[cubic-bezier(0.165,0.84,0.44,1)]">
      <span className="text-sm font-medium text-[#7C3AED] flex items-center gap-1">
        View Case Study <IconArrowRight size={14} />
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

// Shadcn-like Button Component
const Button = ({ className, variant = "default", size = "default", ...props }) => {
  const variants = {
    default: "bg-[#7C3AED] text-white hover:bg-[#6D28D9]",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
    white: "bg-white text-[#7C3AED] hover:bg-gray-100"
  }
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  }
  return (
    <button 
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  )
}

export default function LandingPage() {
  const [theme, setTheme] = useState(() => {
    // Check localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });
  const [openAccordion, setOpenAccordion] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('hero');

  // Handle navbar scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);

      // Detect active section
      const sections = ['hero', 'features', 'faq'];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveTab(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Apply theme to document root
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const toggleAccordion = (index) => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const navItems = [
    { name: 'Home', link: '#hero' },
    { name: 'Features', link: '#features' },
    { name: 'Docs', link: 'https://docs.oversightai.in', external: true },
    { name: 'FAQ', link: '#faq' }
  ];

  return (
    <ReactLenis root>
      <div className="min-h-screen font-sans selection:bg-primary/20">
        <div className="max-w-full mx-auto border-x min-h-screen relative bg-background text-foreground transition-colors duration-300">
        
        {/* Get In Touch Modal */}
        <GetInTouchModal 
          isOpen={isContactModalOpen} 
          onClose={() => setIsContactModalOpen(false)} 
        />
        
        {/* Resizable Navbar with Theme */}
        <Navbar className={`top-0 transition-all duration-300 ease-in-out `}>
          <NavBody className="w-full">
            <div className="flex items-center justify-between w-full">
              <a href="#hero" className="flex items-center gap-2 group flex-shrink-0">
                <div className="relative flex items-center justify-center p-1 rounded-lg group-hover:bg-[#7C3AED]/5 transition-colors duration-200">
                  <img 
                    src="/OverSight.png" 
                    alt="OverSight Logo" 
                    className={`rounded-md object-cover transition-all duration-300 ${
                      isScrolled ? 'w-6 h-6' : 'w-7 h-7'
                    }`}
                  />
                </div>
                <p className={`font-bold tracking-tight transition-all duration-300 ${
                  isScrolled ? 'text-sm' : 'text-base'
                }`}>
                  <span className="text-[#7C3AED]">OverSight</span>
                  <span className="text-muted-foreground font-normal">AI</span>
                </p>
              </a>
              
              <div className="hidden md:flex items-center justify-center space-x-1 absolute inset-0 pointer-events-none">
                <div className="flex items-center space-x-1 pointer-events-auto">
                  {navItems.map((item) => {
                    const itemLink = item.link.replace('#', '');
                    const isActive = activeTab === itemLink && !item.external;
                    return (
                      <a
                        key={item.name}
                        href={item.link}
                        target={item.external ? "_blank" : undefined}
                        rel={item.external ? "noopener noreferrer" : undefined}
                        className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg group ${
                          isActive
                            ? 'text-[#7C3AED] bg-[#7C3AED]/10'
                            : 'text-muted-foreground hover:text-[#7C3AED] hover:bg-[#7C3AED]/5'
                        }`}
                      >
                        <span className="relative z-10">{item.name}</span>
                        {isActive && (
                          <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#7C3AED] rounded-full" />
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 ml-auto relative z-50">
                <button
                  onClick={toggleTheme}
                  className="p-2 text-muted-foreground hover:text-[#7C3AED] transition-colors duration-200 rounded-lg hover:bg-[#7C3AED]/5"
                  aria-label="Toggle theme"
                >
                  {theme === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />}
                </button>
                <NavbarButton 
                  href="#contact" 
                  variant="primary" 
                  className={`bg-[#7C3AED] text-white hover:bg-[#6D28D9] transition-all duration-200 hover:scale-105 ${
                    isScrolled ? 'px-4 py-1.5 text-sm' : 'px-6 py-2'
                  }`}
                >
                  Get Started
                </NavbarButton>
              </div>
            </div>
          </NavBody>

          <MobileNav className="w-full">
            <MobileNavHeader className="justify-between">
              <a href="#hero" className="flex items-center gap-2 group flex-shrink-0">
                <div className="relative flex items-center justify-center p-1 rounded-lg group-hover:bg-[#7C3AED]/5 transition-colors duration-200">
                  <img 
                    src="/OverSight.png" 
                    alt="OverSight Logo" 
                    className={`rounded-md object-cover transition-all duration-300 ${
                      isScrolled ? 'w-5 h-5' : 'w-6 h-6'
                    }`}
                  />
                </div>
                <p className={`font-bold tracking-tight transition-all duration-300 ${
                  isScrolled ? 'text-xs' : 'text-sm'
                }`}>
                  <span className="text-[#7C3AED]">OverSight</span>
                </p>
              </a>
              <div className="flex items-center gap-2 relative z-50">
                <button
                  onClick={toggleTheme}
                  className="p-2 text-muted-foreground hover:text-[#7C3AED] transition-colors duration-200 rounded-lg hover:bg-[#7C3AED]/5"
                  aria-label="Toggle theme"
                >
                  {theme === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />}
                </button>
                <MobileNavToggle 
                  isOpen={mobileMenuOpen} 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                />
              </div>
            </MobileNavHeader>
            <MobileNavMenu isOpen={mobileMenuOpen} onClose={closeMobileMenu}>
              <div className="w-full space-y-2 p-4">
                {navItems.map((item, index) => {
                  const itemLink = item.link.replace('#', '');
                  const isActive = activeTab === itemLink && !item.external;
                  return (
                    <a
                      key={item.name}
                      href={item.link}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      className={`block px-4 py-3 transition-all duration-200 text-sm font-medium rounded-lg group ${
                        isActive
                          ? 'text-[#7C3AED] bg-[#7C3AED]/10 border-l-2 border-[#7C3AED]'
                          : 'text-muted-foreground hover:text-[#7C3AED] hover:bg-[#7C3AED]/5'
                      }`}
                      onClick={item.external ? undefined : closeMobileMenu}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <span className="flex items-center justify-between">
                        {item.name}
                        {item.external && <IconArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" />}
                      </span>
                    </a>
                  );
                })}
                <div className="pt-4 border-t border-border/50">
                  <NavbarButton 
                    href="#contact" 
                    variant="primary" 
                    className="bg-[#7C3AED] text-white hover:bg-[#6D28D9] w-full transition-all duration-200 hover:scale-105"
                    onClick={closeMobileMenu}
                  >
                    Get Started
                  </NavbarButton>
                </div>
              </div>
            </MobileNavMenu>
          </MobileNav>
        </Navbar>

        {/* Main Content */}
        <main className="flex flex-col w-full relative z-10">
          
          {/* Hero Section with Animated Diagram */}
          <HeroSection />

          {/* Video Section - Introduction */}
          <VideoSection />

          {/* Features Section - New with Product Screenshots */}
          <FeaturesSection />

          {/* FAQ */}
          <section id="faq" className="py-32 px-6 bg-muted/20 border-y border-border">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-16">
                        {/* Badge removed for cleaner look */}
                        <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
                        <p className="text-muted-foreground">Everything you need to know about OverSight</p>
                    </div>
                    
                    <div className="space-y-4">
                        {[
                          {
                              q: "What is OverSight?",
                              a: "OverSight is an AI & Data Governance Control Plane that provides real-time visibility into how AI agents use data, enforce governance policies, and generate audit-ready compliance evidence."
                          },
                          {
                              q: "What problem does OverSight solve?",
                              a: "OverSight closes the governance gap by answering who used what data, through which AI agent, for what purpose, and whether it complied with organizational and regulatory policies."
                          },
                          {
                              q: "What is an AI Agent?",
                              a: "An AI Agent is an autonomous system that consumes data, reasons over it, and takes actions or decisions. OverSight tracks and governs every data interaction and decision made by AI agents."
                          },
                          {
                              q: "How does OverSight work?",
                              a: "OverSight collects telemetry from data pipelines and AI agents, enriches it with metadata and context, evaluates actions against governance rules, and continuously monitors compliance in real time."
                          },
                          {
                              q: "Does OverSight add latency to AI systems?",
                              a: "No. Telemetry collection is asynchronous and non-blocking. Governance evaluation and monitoring do not impact agent execution or response times."
                          },
                          {
                              q: "What kind of data does OverSight monitor?",
                              a: "OverSight monitors structured and unstructured data, including logs, files, media, databases, and application data, along with their sensitivity, ownership, and usage context."
                          },
                          {
                              q: "Which compliance standards does OverSight support?",
                              a: "OverSight supports GDPR, CCPA, HIPAA, SOX, and enterprise internal governance policies. Compliance rules are explicit, explainable, and version-controlled."
                          },
                          {
                              q: "Can OverSight detect violations in real time?",
                              a: "Yes. OverSight evaluates AI actions as they occur and immediately flags policy violations, risky behavior, and non-compliant data usage."
                          },
                          {
                              q: "Does OverSight maintain audit logs?",
                              a: "Yes. Every decision, policy evaluation, and violation is recorded in immutable audit logs that can be exported for regulatory and internal audits."
                          },
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

                    <div className="mt-12 text-center p-8 rounded-2xl bg-card border border-border">
                        <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
                        <p className="text-muted-foreground mb-6">Our team is here to help you get started with OverSight</p>
                        <Button 
                            variant="default" 
                            className="bg-[#7C3AED] hover:bg-[#6D28D9]"
                            onClick={() => setIsContactModalOpen(true)}
                        >
                            Contact Us
                        </Button>
                    </div>
                </div>
          </section>

          {/* CTA - Inspired by the provided image design */}
          <section id="contact" className="py-32 px-6 bg-[#2563EB] relative overflow-hidden">
                {/* Clean blue background with subtle shape hint */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1)_0%,transparent_40%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,transparent_0%,rgba(0,0,0,0.05)_100%)]" />
                
                <div className="max-w-5xl mx-auto text-center relative z-10 text-white">
                    <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-10 leading-tight">
                        Govern.<br/>Monitor. Trust.
                    </h2>
                    
                    <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-2xl mx-auto">
                        Join leading enterprises in building trustworthy AI systems.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
                        <Button 
                            variant="white" 
                            size="lg" 
                            className="rounded-full h-14 px-8 text-base font-bold shadow-xl hover:scale-105 transition-all duration-300 text-[#2563EB] w-full sm:w-auto"
                            onClick={() => window.open('https://github.com/abhi2k4/GRACE_Knowcode_OverSight', '_blank')}
                        >
                            Get Started
                        </Button>
                        <Button 
                            variant="outline" 
                            size="lg" 
                            className="rounded-full h-14 px-8 text-base font-bold bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm w-full sm:w-auto"
                            onClick={() => window.open('https://docs.oversightai.in', '_blank')}
                        >
                            View Documentation
                        </Button>
                    </div>
                   
                </div>
          </section>

          {/* Footer */}
          <footer className="py-16 border-t border-border bg-muted/30">
             <div className="max-w-7xl mx-auto px-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                     {/* Brand Section */}
                     <div className="md:col-span-1">
                         <div className="flex items-center gap-2.5 mb-4">
                            <div className="relative flex items-center justify-center p-1 rounded-lg group hover:bg-[#7C3AED]/5 transition-colors duration-200">
                                <img 
                                    src="/OverSight.png" 
                                    alt="OverSight Logo" 
                                    className="w-8 h-8 rounded-md object-cover"
                                />
                            </div>
                            <span className="font-bold text-xl text-primary">OverSight<span className="text-muted-foreground font-normal">AI</span></span>
                         </div>
                         <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                             Taming Enterprise AI with unified governance, real-time monitoring, and immutable audit trails.
                         </p>
                     </div>

                     {/* Resources Links */}
                     <div>
                         <h4 className="font-semibold text-sm mb-4">Resources</h4>
                         <ul className="space-y-3 text-sm text-muted-foreground">
                             {[
                               { label: 'Documentation', href: 'https://docs.oversightai.in', external: true },
                               { label: 'GitHub Repository', href: 'https://github.com/abhi2k4/GRACE_Knowcode_OverSight', external: true },
                               { label: 'FAQ', href: '#faq' }
                             ].map((item) => (
                                 <li key={item.label}>
                                     <a 
                                       href={item.href}
                                       target={item.external ? '_blank' : undefined}
                                       rel={item.external ? 'noopener noreferrer' : undefined}
                                       className="hover:text-[#7C3AED] transition-colors duration-200 flex items-center gap-2 group"
                                     >
                                       {item.label}
                                       {item.external && <IconArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" />}
                                     </a>
                                 </li>
                             ))}
                         </ul>
                     </div>

                     {/* Connect Section */}
                     <div>
                         <h4 className="font-semibold text-sm mb-4">Connect</h4>
                         <ul className="space-y-3 text-sm text-muted-foreground">
                             {[
                               { label: 'Get in Touch', href: '#faq', action: () => setIsContactModalOpen(true) },
                               { label: 'View on GitHub', href: 'https://github.com/abhi2k4', external: true }
                             ].map((item) => (
                                 <li key={item.label}>
                                     {item.action ? (
                                       <button 
                                         onClick={item.action}
                                         className="hover:text-[#7C3AED] transition-colors duration-200 flex items-center gap-2 group text-left"
                                       >
                                         {item.label}
                                         <IconArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                       </button>
                                     ) : (
                                       <a 
                                         href={item.href}
                                         target={item.external ? '_blank' : undefined}
                                         rel={item.external ? 'noopener noreferrer' : undefined}
                                         className="hover:text-[#7C3AED] transition-colors duration-200 flex items-center gap-2 group"
                                       >
                                         {item.label}
                                         {item.external && <IconArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" />}
                                       </a>
                                     )}
                                 </li>
                             ))}
                         </ul>
                     </div>
                 </div>

                 {/* Divider */}
                 <div className="h-px bg-border/50 mb-8" />

                 {/* Bottom Bar - Simplified */}
                 <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                     <p className="text-sm text-muted-foreground">
                         © 2026 OverSight AI. All rights reserved.
                     </p>
                     <div className="flex items-center gap-6 text-sm text-muted-foreground">
                         <a 
                           href="https://docs.oversightai.in" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="hover:text-[#7C3AED] transition-colors duration-200"
                         >
                           Documentation
                         </a>
                         <a 
                           href="https://github.com/abhi2k4/GRACE_Knowcode_OverSight" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="hover:text-[#7C3AED] transition-colors duration-200"
                         >
                           GitHub
                         </a>
                     </div>
                 </div>
             </div>
          </footer>
        </main>
      </div>
    </div>
    </ReactLenis>
  );
}
