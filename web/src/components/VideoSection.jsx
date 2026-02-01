import { motion, useScroll, useTransform } from 'framer-motion';
import { IconPlayerPlay } from '@tabler/icons-react';
import { useRef } from 'react';

const VideoSection = () => {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  // Transform scale based on scroll position
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0.8]);

  const containerVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <section 
      ref={sectionRef}
      id="video" 
      className="w-full py-24 md:py-32 px-6 bg-background relative overflow-hidden"
    >
    
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="max-w-6xl mx-auto relative z-10"
      >

          <div className="text-center mb-16">
            {/* <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/30 mb-8 backdrop-blur-sm hover:bg-[#7C3AED]/20 transition-colors"
            >
              <span className="text-sm font-semibold text-[#7C3AED]"></span>
            </motion.div> */}
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-foreground"
            >
              Why Choose OverSightAI ?
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Discover how leading teams use OverSight to govern, monitor, and scale their enterprise AI infrastructure
            </motion.p>
          </div>

          {/* Video Container with Scroll Animation */}
        <motion.div
          style={{ scale, opacity }}
          className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-card group hover:shadow-[0_0_50px_rgba(124,58,237,0.2)] transition-all duration-300 hover:border-[#7C3AED]/30"
          whileInView={{ scale: 1 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Animated border glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#7C3AED]/20 via-transparent to-[#7C3AED]/20 opacity-0 group-hover:opacity-50 blur-lg transition-opacity duration-500 pointer-events-none -z-10" />
          
          <div style={{ paddingTop: '56.25%' }} className="relative overflow-hidden">
            <iframe
              loading="lazy"
              className="absolute top-0 left-0 w-full h-full"
              src="https://www.youtube.com/embed/MwNcHePGghM?si=2bcQH9uOZOpXsq4z" title="OverSightAI" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" 
              referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>
            </iframe>
          </div>
        </motion.div>

        {/* Video Caption */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {[
            {
              title: "Real-time Monitoring",
              description: "Track all AI agent activities with millisecond precision"
            },
            {
              title: "Policy Enforcement",
              description: "Automated compliance checks and violation detection"
            },
            {
              title: "Audit Trails",
              description: "Complete immutable records for regulatory compliance"
            }
          ].map((item, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-xl bg-card border border-border hover:border-[#7C3AED]/30 transition-all hover:shadow-lg group"
            >
              <h3 className="font-semibold text-lg mb-2 group-hover:text-[#7C3AED] transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default VideoSection;
