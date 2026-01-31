import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IconArrowRight } from '@tabler/icons-react';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { 
  Navbar, 
  NavBody, 
  MobileNav, 
  MobileNavHeader, 
  MobileNavToggle, 
  MobileNavMenu, 
  NavbarButton 
} from '@/components/ui/resizable-navbar';

const Header = ({ theme, toggleTheme, setIsContactModalOpen }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('hero');

  const navItems = [
    { name: 'Home', link: '#hero' },
    { name: 'Features', link: '#features' },
    { name: 'Docs', link: 'https://docs.oversightai.in', external: true },
    { name: 'FAQ', link: '#faq' }
  ];

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

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <Navbar className={`top-0 transition-all duration-300 ease-in-out`}>
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
              <span className="text-bold">OverSight</span>
              <span className="text-muted-foreground font-small">ai</span>
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
            <AnimatedThemeToggler />
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <NavbarButton 
                href="#contact" 
                variant="primary" 
                className={`bg-[#7C3AED] text-white hover:bg-[#6D28D9] transition-all duration-200 hover:scale-105 ${
                  isScrolled ? 'px-4 py-1.5 text-sm' : 'px-6 py-2'
                }`}
              >
                Get Started
              </NavbarButton>
            </motion.div>
          </div>
        </div>
      </NavBody>

      <MobileNav className="w-full">
        <MobileNavHeader className="justify-between h-14">
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
              <span className="text-bold">OverSight</span>
            </p>
          </a>
          <div className="flex items-center gap-2 relative z-50">
            <AnimatedThemeToggler />
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
                <motion.a
                  key={item.name}
                  href={item.link}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`block px-4 py-3 transition-all duration-200 text-sm font-medium rounded-lg group ${
                    isActive
                      ? 'text-[#7C3AED] bg-[#7C3AED]/10 border-l-2 border-[#7C3AED]'
                      : 'text-muted-foreground hover:text-[#7C3AED] hover:bg-[#7C3AED]/5'
                  }`}
                  onClick={item.external ? undefined : closeMobileMenu}
                >
                  <span className="flex items-center justify-between">
                    {item.name}
                    {item.external && <IconArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" />}
                  </span>
                </motion.a>
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
  );
};

export default Header;
