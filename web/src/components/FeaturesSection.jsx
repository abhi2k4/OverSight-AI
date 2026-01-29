import { useRef } from 'react';
import { useTransform, motion, useScroll } from 'framer-motion';
import dashboardImg from '@/assets/features/dashboard.jpeg';
import datasetImg from '@/assets/features/dataset.jpeg';
import policyImg from '@/assets/features/policy-governance.jpeg';
import alertsImg from '@/assets/features/alerts.jpeg';
import agentsDiscoveryImg from '@/assets/features/agents-discovery.jpeg';

const Card = ({ i, title, description, image, color, progress, range, targetScale }) => {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start end', 'start start'],
  });

  const imageScale = useTransform(scrollYProgress, [0, 1], [2, 1]);
  const scale = useTransform(progress, range, [1, targetScale]);

  return (
    <div
      ref={container}
      className="h-screen flex items-center justify-center sticky top-0"
    >
      <motion.div
        style={{
          backgroundColor: color,
          scale,
          top: `120px)`,
        }}
        className="flex flex-col relative -top-[25%] h-[500px] w-[75%] rounded-3xl p-6 lg:p-10 origin-top shadow-2xl overflow-hidden group hover:shadow-2xl transition-all duration-300"
      >
       
        {/* Animated Border Glow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/20 via-transparent to-white/20 opacity-0 group-hover:opacity-50 blur-lg transition-opacity duration-500 pointer-events-none -z-10" />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <motion.div 
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm text-white font-bold text-lg border border-white/30"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              0{i + 1}
            </motion.div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">{title}</h2>
          </div>

          <div className="flex flex-col lg:flex-row h-full gap-6 lg:gap-10">
            <div className="lg:w-[35%] flex flex-col justify-center">
              <p className="text-base lg:text-lg text-white/95 leading-relaxed font-light">{description}</p>      
            </div>

            <div className="relative lg:w-[65%] h-full rounded-2xl overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 shadow-inner group/image">
              {/* Image Border Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 via-transparent to-white/10 pointer-events-none opacity-0 group-hover/image:opacity-100 transition-opacity duration-500" />
              
              <motion.div
                className="w-full h-full"
                style={{ scale: imageScale }}
              >
                <img 
                  src={image} 
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const FeaturesSection = () => {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end'],
  });

  const features = [
    {
      title: "Global Governance Dashboard",
      description: "A real-time, unified view of AI agents, policies, compliance health, and active risks. Spot issues instantly and stay audit-ready with at-a-glance visibility.",
      image: dashboardImg,
      color: 'hsl(280, 70%, 50%)',
    },
    {
      title: "AI Agents Discovery",
      description: "Automatically discover and inventory all AI agents operating within your network. Visualize agent interactions and dependencies to understand your complete AI footprint.",
      image: agentsDiscoveryImg,
      color: 'hsl(260, 75%, 55%)',
    },
    {
      title: "Dataset & Context Management",
      description: "Centralize dataset visibility with sensitivity classification, access controls, lineage tracking, and compliance monitoring. Ensure data is used safely and responsibly.",
      image: datasetImg,
      color: 'hsl(270, 68%, 52%)',
    },
    {
      title: "Policy & Governance Engine",
      description: "Define, apply, and enforce AI policies in real time. Get clear visibility into coverage, violations, and risk levels across all agents to ensure consistent compliance.",
      image: policyImg,
      color: 'hsl(290, 72%, 48%)',
    },
    {
      title: "Alerts & Violations Center",
      description: "Centralize real-time detection, investigation, and resolution of AI policy breaches. Empower your teams to act fast on critical risks before they escalate.",
      image: alertsImg,
      color: 'hsl(275, 65%, 54%)',
    },
  ];

  return (
    <section id="features" ref={container} className="relative bg-background">
      
      {/* Section Header */}
      <div className="relative z-10 py-24 lg:py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/15 border border-primary/30 text-primary text-sm font-semibold mb-8 backdrop-blur-sm hover:bg-primary/20 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-primary/80 animate-pulse" />
              Feature Tour
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-foreground leading-tight"
            >
              Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-pink-400">govern AI & Data</span>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto"
            >
              From policy enforcement to real-time monitoring, OverSight gives you the complete toolkit for enterprise AI governance.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Stacking Cards */}
      <div className="relative">
        {features.map((feature, i) => {
          const targetScale = 1 - (features.length - i) * 0.05;
          return (
            <Card
              key={`feature_${i}`}
              i={i}
              title={feature.title}
              description={feature.description}
              image={feature.image}
              color={feature.color}
              progress={scrollYProgress}
              range={[i * 0.25, 1]}
              targetScale={targetScale}
            />
          );
        })}
      </div>

    </section>
  );
};

export default FeaturesSection;
