import { useState } from 'react';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';

const Header = ({ theme, toggleTheme }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  const navItems = [
    { name: 'Home', link: '#hero' },
    { name: 'Features', link: '#features' },
    { name: 'Docs', link: 'https://docs.oversightai.in', external: true },
    { name: 'FAQ', link: '#faq' }
  ];

  return (
    <>
      {/* Desktop & Mobile Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-background/80 backdrop-blur-lg border-b border-border shadow-sm' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <a href="#hero" className="flex items-center gap-3 group flex-shrink-0">
              <div className="relative flex items-center justify-center rounded-lg group-hover:bg-[#7C3AED]/5 transition-colors">
                <img 
                  src="/OverSight.png" 
                  alt="OverSight Logo" 
                  className="h-10 w-auto object-contain"
                />
              </div>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.link}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  className="text-sm font-medium text-muted-foreground hover:text-[#7C3AED] transition-colors relative group"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#7C3AED] transition-all group-hover:w-full" />
                </a>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2.5 text-muted-foreground hover:text-[#7C3AED] transition-colors rounded-lg hover:bg-[#7C3AED]/5"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <IconMoon size={20} /> : <IconSun size={20} />}
              </button>

              <a
                href="#contact"
                className="hidden md:flex h-10 px-6 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold items-center gap-2 hover:bg-[#6D28D9] transition-all shadow-lg shadow-purple-900/20 hover:scale-105 active:scale-95"
              >
                Get Started
              </a>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-muted-foreground hover:text-[#7C3AED] transition-colors"
                aria-label="Toggle menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {mobileMenuOpen ? (
                    <path d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-lg border-t border-border"
          >
            <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.link}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-base font-medium text-muted-foreground hover:text-[#7C3AED] transition-colors py-2"
                >
                  {item.name}
                </a>
              ))}
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-12 px-6 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold items-center justify-center gap-2 hover:bg-[#6D28D9] transition-all shadow-lg shadow-purple-900/20 w-full mt-4"
              >
                Get Started
              </a>
            </div>
          </motion.div>
        )}
      </motion.header>

      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-16 md:h-20" />
    </>
  );
};

export default Header;
