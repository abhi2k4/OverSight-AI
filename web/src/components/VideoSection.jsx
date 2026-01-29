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
      className="w-full py-24 md:py-32 px-6 bg-background relative overflow-hidden border-y border-border"
    >
      {/* Subtle background accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#7C3AED]/5 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="max-w-6xl mx-auto relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/20 mb-6"
          >
            <IconPlayerPlay size={16} className="text-[#7C3AED]" />
            <span className="text-sm font-medium text-[#7C3AED]">OverSight AI</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
          >
            A Birds'-Eye View for Data & AI across Enterprise
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
          className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-border bg-card group hover:shadow-purple-900/20 transition-all duration-300"
          whileInView={{ scale: 1 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Hover overlay accent */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#7C3AED]/0 to-[#7C3AED]/0 group-hover:from-[#7C3AED]/5 group-hover:to-[#7C3AED]/0 pointer-events-none transition-all duration-300 z-10" />
          
          <div style={{ paddingTop: '56.25%' }} className="relative overflow-hidden">
            <iframe
              loading="lazy"
              className="absolute top-0 left-0 w-full h-full"
              src="https://www.canva.com/design/DAG_Q64M128/SGio7fZPi7Rp9x61nKb7vw/watch?embed&controls"
              allowFullScreen
              allow="fullscreen"
              title="OverSight AI Governance Platform Demo"
              referrerPolicy="no-referrer"
              style={{ border: 'none', display: 'block' }}
            />
          </div>
        </motion.div>

        {/* Video Caption */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-6"
        >
          <p className="text-sm text-muted-foreground items-center mx-auto">
              Leverages proven open-source components (DataHub + Langfuse observability + MinIO storage + Keycloak auth) already running in 10,000+ enterprise environments and delivers unified control instead of siloed tools
          </p>
        </motion.div>

        {/* Key Highlights */}
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
