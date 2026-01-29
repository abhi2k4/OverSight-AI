import { useRef } from 'react';
import { useTransform, motion, useScroll } from 'framer-motion';
import dashboardImg from '@/assets/dashboard.jpeg';
import datasetImg from '@/assets/dataset.jpeg';
import policyImg from '@/assets/policy-governance.jpeg';
import alertsImg from '@/assets/alerts.jpeg';
import agentsDiscoveryImg from '@/assets/agents-discovery.jpeg';

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
          top: `calc(-5vh + ${i * 25}px)`,
        }}
        className="flex flex-col relative -top-[25%] h-[500px] w-[75%] rounded-3xl p-6 lg:p-10 origin-top shadow-2xl"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-black/10 text-white font-bold text-lg">
            0{i + 1}
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white">{title}</h2>
        </div>

        <div className="flex flex-col lg:flex-row h-full gap-6 lg:gap-10">
          <div className="lg:w-[35%] flex flex-col justify-center">
            <p className="text-base lg:text-lg text-white/90 leading-relaxed">{description}</p>
          </div>

          <div className="relative lg:w-[65%] h-full rounded-2xl overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10">
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
      color: 'hsl(var(--primary))',
    },
    {
      title: "AI Agents Discovery",
      description: "Automatically discover and inventory all AI agents operating within your network. Visualize agent interactions and dependencies to understand your complete AI footprint.",
      image: agentsDiscoveryImg,
      color: 'hsl(262, 83%, 58%)',
    },
    {
      title: "Dataset & Context Management",
      description: "Centralize dataset visibility with sensitivity classification, access controls, lineage tracking, and compliance monitoring. Ensure data is used safely and responsibly.",
      image: datasetImg,
      color: 'hsl(258, 90%, 66%)',
    },
    {
      title: "Policy & Governance Engine",
      description: "Define, apply, and enforce AI policies in real time. Get clear visibility into coverage, violations, and risk levels across all agents to ensure consistent compliance.",
      image: policyImg,
      color: 'hsl(271, 91%, 65%)',
    },
    {
      title: "Alerts & Violations Center",
      description: "Centralize real-time detection, investigation, and resolution of AI policy breaches. Empower your teams to act fast on critical risks before they escalate.",
      image: alertsImg,
      color: 'hsl(280, 100%, 70%)',
    },
  ];

  return (
    <section id="features" ref={container} className="relative bg-background">
      {/* Section Header */}
      <div className="relative z-10 py-20 lg:py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              Feature Tour
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-foreground">
              Everything you need to <span className="text-primary">govern AI & Data</span>
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              From policy enforcement to real-time monitoring, OverSight gives you the complete toolkit for enterprise AI governance.
            </p>
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
