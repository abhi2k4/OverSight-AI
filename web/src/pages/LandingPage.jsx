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
    { name: 'Docs', link: 'https://oversight-docs.vercel.app/docs', external: true },
    { name: 'FAQ', link: '#faq' }
  ];

  return (
    <ReactLenis root>
      <div className="min-h-screen font-sans selection:bg-primary/20">
        <div className="max-w-full mx-auto border-x min-h-screen relative bg-background text-foreground transition-colors duration-300">
        
        {/* Resizable Navbar with Theme */}
        <Navbar className="top-0">
          <NavBody className="w-full">
            <div className="flex items-center justify-between w-full">
              <a href="#hero" className="flex items-center gap-2 group flex-shrink-0">
                <div className="relative flex items-center justify-center p-1 rounded-lg group-hover:bg-[#7C3AED]/5 transition-colors">
                  <img 
                    src="/OverSight.png" 
                    alt="OverSight Logo" 
                    className="w-7 h-7 rounded-md object-cover"
                  />
                </div>
                <p className="text-base font-bold tracking-tight">
                  <span className="text-[#7C3AED]">OverSight</span>
                  <span className="text-muted-foreground font-normal">AI</span>
                </p>
              </a>
              
              <NavItems 
                items={navItems}
                className="!absolute !inset-0 !flex !flex-row !items-center !justify-center !space-x-2 md:!space-x-6 text-sm font-medium"
              />

              <div className="flex items-center gap-3 ml-auto relative z-50">
                <button
                  onClick={toggleTheme}
                  className="p-2 text-muted-foreground hover:text-[#7C3AED] transition-colors cursor-pointer"
                  aria-label="Toggle theme"
                >
                  {theme === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />}
                </button>
                <NavbarButton href="#contact" variant="primary" className="bg-[#7C3AED] text-white hover:bg-[#6D28D9] px-6">
                  Get Started
                </NavbarButton>
              </div>
            </div>
          </NavBody>

          <MobileNav className="w-full">
            <MobileNavHeader className="justify-between">
              <a href="#hero" className="flex items-center gap-2 group flex-shrink-0">
                <div className="relative flex items-center justify-center p-1 rounded-lg group-hover:bg-[#7C3AED]/5 transition-colors">
                  <img 
                    src="/OverSight.png" 
                    alt="OverSight Logo" 
                    className="w-6 h-6 rounded-md object-cover"
                  />
                </div>
                <p className="text-sm font-bold tracking-tight">
                  <span className="text-[#7C3AED]">OverSight</span>
                </p>
              </a>
              <div className="flex items-center gap-2 relative z-50">
                <button
                  onClick={toggleTheme}
                  className="p-2 text-muted-foreground hover:text-[#7C3AED] transition-colors cursor-pointer"
                  aria-label="Toggle theme"
                >
                  {theme === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />}
                </button>
                <MobileNavToggle isOpen={mobileMenuOpen} />
              </div>
            </MobileNavHeader>
            <MobileNavMenu isOpen={mobileMenuOpen} onClose={closeMobileMenu}>
              <div className="w-full space-y-4">
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.link}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="text-muted-foreground hover:text-[#7C3AED] transition-colors text-sm font-medium block"
                    onClick={item.external ? undefined : closeMobileMenu}
                  >
                    {item.name}
                  </a>
                ))}
                <NavbarButton 
                  href="#contact" 
                  variant="primary" 
                  className="bg-[#7C3AED] text-white hover:bg-[#6D28D9] w-full"
                  onClick={closeMobileMenu}
                >
                  Get Started
                </NavbarButton>
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
                                q: "What is an AI Agent?", 
                                a: "An AI Agent is an autonomous system that can perceive its environment, reason about how to achieve goals, and pass actions to accomplish them. OverSight provides comprehensive oversight for all your AI agents." 
                            },
                            { 
                                q: "How does OverSight work?", 
                                a: "We provide an SDK that you integrate into your agent code. It asynchronously sends telemetry to our cloud or your self-hosted instance without adding latency. All monitoring happens in real-time with zero impact on performance." 
                            },
                            { 
                                q: "Is there a performance impact?", 
                                a: "Minimal to none. Our SDK operations are non-blocking and batched to ensure your agent's response time remains unaffected. Most customers see less than 1ms overhead." 
                            },
                            { 
                                q: "Can I self-host OverSight?", 
                                a: "Yes! The Enterprise plan allows you to deploy the entire stack within your own VPC for complete data isolation. We support AWS, Azure, GCP, and on-premises deployments." 
                            },
                            {
                                q: "What integrations do you support?",
                                a: "We integrate with all major LLM providers (OpenAI, Anthropic, Google, etc.), observability tools (Langfuse, DataHub), and authentication systems (Keycloak, Auth0). Custom integrations are available on Enterprise plans."
                            },
                            {
                                q: "How does billing work?",
                                a: "Billing is based on the number of traces (LLM calls) per month. You can start with our free tier and upgrade as needed. No surprise charges - you only pay for what you use."
                            }
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
                        <Button variant="default" className="bg-[#7C3AED] hover:bg-[#6D28D9]">
                            Contact Support
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
                            onClick={() => window.open('https://oversight-docs.vercel.app/docs', '_blank')}
                        >
                            View Documentation
                        </Button>
                    </div>
                   
                </div>
          </section>

          {/* Footer */}
          <footer className="py-16 border-t border-border bg-muted/30">
             <div className="max-w-7xl mx-auto px-6">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                     {/* Brand */}
                     <div className="md:col-span-2">
                         <div className="flex items-center gap-2.5 mb-4">
                            <div className="relative flex items-center justify-center p-1 rounded-lg">
                                <img 
                                    src="/OverSight.png" 
                                    alt="OverSight Logo" 
                                    className="w-8 h-8 rounded-md object-cover"
                                />
                            </div>
                            <span className="font-bold text-xl text-primary">OverSight<span className="text-muted-foreground font-normal">AI</span></span>
                         </div>
                         <p className="text-sm text-muted-foreground max-w-sm mb-6">
                             Taming Enterprise AI with unified governance, real-time monitoring, and immutable audit trails.
                         </p>
                         
                     </div>

                     {/* Product Links */}
                     <div>
                         <h4 className="font-semibold text-sm mb-4">Product</h4>
                         <ul className="space-y-3 text-sm text-muted-foreground">
                             {['Features', 'Pricing', 'Documentation', 'API Reference', 'Changelog', 'Roadmap'].map((item) => (
                                 <li key={item}>
                                     <a href="#" className="hover:text-[#7C3AED] transition-colors">{item}</a>
                                 </li>
                             ))}
                         </ul>
                     </div>

                     {/* Company Links */}
                     <div>
                         <h4 className="font-semibold text-sm mb-4">Company</h4>
                         <ul className="space-y-3 text-sm text-muted-foreground">
                             {['About', 'Blog', 'Careers', 'Contact', 'Privacy Policy', 'Terms of Service'].map((item) => (
                                 <li key={item}>
                                     <a href="#" className="hover:text-[#7C3AED] transition-colors">{item}</a>
                                 </li>
                             ))}
                         </ul>
                     </div>
                 </div>

                 {/* Bottom Bar */}
                 <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
                     <p className="text-sm text-muted-foreground">
                         © 2026 OverSight AI. All rights reserved.
                     </p>
                     <div className="flex items-center gap-6 text-sm text-muted-foreground">
                         <a href="#" className="hover:text-[#7C3AED] transition-colors">Status</a>
                         <a href="#" className="hover:text-[#7C3AED] transition-colors">Security</a>
                         <a href="#" className="hover:text-[#7C3AED] transition-colors">Compliance</a>
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
