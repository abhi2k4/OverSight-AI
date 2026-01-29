import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Import hero diagram
import cloudDiagram from '../assets/hero/cloud-diagram.png';

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 1, ease: "easeOut" }
    }
  };

  const diagramVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5,
        ease: "easeOut"
      }
    }
  };

  const floatAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  return (
    <section id="hero" className="w-full relative overflow-hidden pt-8 pb-24 md:pb-32 min-h-screen flex items-center">
      {/* Background gradient blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[#7C3AED]/20 blur-[120px] rounded-full pointer-events-none -z-10" />
      
      <div className="w-full max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            className="flex flex-col gap-8 text-left"
          >
            <motion.div variants={fadeInUp}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
                <span className="block text-foreground">Enterprise AI & Data</span>
                <span className="block text-foreground">Governance Control Plane</span>
              </h1>
            </motion.div>

            <motion.p 
              variants={fadeInUp}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed"
            >
              Unified, automated oversight for AI agents, data context, & compliance: built on battle-tested open source.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex items-center gap-4 pt-4">
              <a 
                href="https://docs.oversightai.in/getting-started#architecture-overview" 
                className="h-12 px-8 rounded-full bg-[#7C3AED] text-white font-medium flex items-center gap-2 hover:bg-[#6D28D9] transition-all shadow-xl shadow-purple-900/20 hover:scale-105 active:scale-95"
              >
                Explore Architecture
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </motion.div>
          </motion.div>

          {/* Right Diagram */}
          <motion.div
            variants={diagramVariants}
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            className="relative w-full flex items-center justify-center"
          >
            <motion.div
              animate={floatAnimation}
              className="w-full max-w-[650px] lg:max-w-[700px]"
            >
              <img 
                src={cloudDiagram} 
                alt="OverSight Architecture - AI Governance Control Plane with DataHub, Langfuse, KeyCloak, and Minio integrations" 
                className="w-full h-auto drop-shadow-2xl"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
