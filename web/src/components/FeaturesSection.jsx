import { IconFlag } from '@tabler/icons-react';
import dashboardImg from '@/assets/dashboard.png';
import datasetImg from '@/assets/dataset.png';

const FeaturesSection = () => {
  return (
    <section id="features" className="w-full py-24 md:py-32 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Key Features
          </h2>
        </div>

        {/* Feature 1: Global Governance Dashboard */}
        <div className="mb-32">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left: Content */}
            <div className="space-y-6">
              
              {/* Title */}
              <h3 className="text-3xl font-bold text-foreground">
                Global Governance Dashboard
              </h3>
              
              {/* Description */}
              <p className="text-base text-muted-foreground leading-relaxed">
                Global Governance Dashboard gives a real-time, unified view of AI agents, policies, 
                compliance health, and active risks, so teams can spot issues and stay audit-ready 
                and spot risks at a glance.
              </p>
            </div>

            {/* Right: Dashboard Screenshot */}
            <div>
              <div className="relative rounded-lg overflow-hidden border border-border bg-card shadow-sm">
                <img 
                  src={dashboardImg} 
                  alt="Global Governance Dashboard"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Dataset & Context Management */}
        <div>
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left: Dataset Screenshot */}
            <div className="order-2 lg:order-1">
              <div className="relative rounded-lg overflow-hidden border border-border bg-card shadow-sm">
                <img 
                  src={datasetImg} 
                  alt="Dataset & Context Management"
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Right: Content */}
            <div className="space-y-6 order-1 lg:order-2">
              {/* Title */}
              <h3 className="text-3xl font-bold text-foreground">
                Dataset & Context Management
              </h3>
              
              {/* Description */}
              <p className="text-base text-muted-foreground leading-relaxed">
                Dataset & Context Management centralizes dataset visibility with sensitivity, access, 
                lineage, and compliance tracking so data is used safely, transparently, and responsibly 
                across AI systems.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
