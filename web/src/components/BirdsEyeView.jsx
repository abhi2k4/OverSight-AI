import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import eagleImage from '@/assets/eagle.png';

const BirdsEyeView = () => {
  const sectionRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect theme mode
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          setIsDarkMode(isDark);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      setScrollProgress(latest);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Background parallax - moves slower (30% to 70%)
  const backgroundPositionX = useTransform(
    scrollYProgress,
    [0, 1],
    ['30%', '70%']
  );

  // Front bird image parallax - moves faster (0% to 13% left, 0% to -5% top)
  const birdLeft = useTransform(
    scrollYProgress,
    [0, 1],
    ['0%', '13%']
  );

  const birdTop = useTransform(
    scrollYProgress,
    [0, 1],
    ['0%', '-5%']
  );

  return (
    <section 
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-background sm:min-h-[33.33vh] lg:min-h-[66.66vh]"
      style={{ 
        // minHeight: '66.66vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Background Image with Parallax */}
      <motion.div
        className="absolute w-full h-full"
        style={{
          backgroundImage: isDarkMode
            // ? 'url(https://olivier3lanc.me/Scroll-Btween/img/gyp2-back-1000.webp)'
            // : 'url(https://olivier3lanc.me/Scroll-Btween/img/gyp-back-1000.webp)'
            ,
          backgroundSize: '120%',
          backgroundRepeat: 'no-repeat',
          backgroundPositionY: 'center',
          backgroundPositionX: backgroundPositionX,
        }}
      />

        <div className="relative z-10 text-center px-6 max-w-7xl mx-auto">
          <motion.header
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className={`text-[8vw] md:text-[6vw] lg:text-[8vw] font-bold leading-tight m-0 z-0 ${isDarkMode ? 'text-white/75' : 'text-black/75'}`}>
            A Bird's Eye View{' '}
            <span className="block relative z-20">on Data & AI</span>
            </h1>
          </motion.header>
        </div>

        {/* Front Bird Image with Parallax */}
      <motion.figure
        className="absolute w-full h-full flex items-center justify-center pointer-events-none z-c"
        style={{
          left: birdLeft,
          top: birdTop,
        }}
      >
        <img
          src={eagleImage}
          alt="Bearded vulture - Bird's eye view perspective"
          className="max-w-full max-h-full w-full h-auto object-contain z-10"
          loading="lazy"
        />
      </motion.figure>

      {/* Gradient overlay for better text readability */}
      {/* <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20 pointer-events-none" /> */}
    </section>
  );
};

export default BirdsEyeView;
