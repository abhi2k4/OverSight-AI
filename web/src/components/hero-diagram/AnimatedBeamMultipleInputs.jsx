import { forwardRef, useRef } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";

// Import logos
import datahubLogo from '@/assets/hero/datahub.png';
import langfuseLogo from '@/assets/hero/langfuse.png';
import keycloakLogo from '@/assets/hero/keycloak.webp';
import minioLogo from '@/assets/hero/minio.svg';

const Circle = forwardRef(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className,
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

export default function AnimatedBeamMultipleInputs() {
  const containerRef = useRef(null);
  const div1Ref = useRef(null);
  const div2Ref = useRef(null);
  const div3Ref = useRef(null);
  const div4Ref = useRef(null);
  const div5Ref = useRef(null);
  const div6Ref = useRef(null);

  return (
    <div
      className="relative flex w-full max-w-[700px] items-center justify-center overflow-hidden p-10"
      ref={containerRef}
    >
      <div className="flex h-full w-full flex-row items-center justify-between gap-10">
        {/* Left side - 4 logos stacked vertically */}
        <div className="flex flex-col justify-center gap-6">
          <Circle ref={div1Ref} className="h-16 w-16">
            <img src={datahubLogo} alt="DataHub" className="h-full w-full object-contain" />
          </Circle>
          <Circle ref={div2Ref} className="h-16 w-16">
            <img src={langfuseLogo} alt="Langfuse" className="h-full w-full object-contain" />
          </Circle>
          <Circle ref={div3Ref} className="h-16 w-16">
            <img src={keycloakLogo} alt="Keycloak" className="h-full w-full object-contain" />
          </Circle>
          <Circle ref={div4Ref} className="h-16 w-16">
            <img src={minioLogo} alt="Minio" className="h-full w-full object-contain" />
          </Circle>
        </div>

        {/* Center - OverSight */}
        <div className="flex flex-col justify-center">
          <Circle ref={div5Ref} className="h-20 w-20">
            <img src="/OverSight.png" alt="OverSight" className="h-full w-full object-contain rounded-full" />
          </Circle>
        </div>

        {/* Right side - Client/Company */}
        <div className="flex flex-col justify-center">
          <Circle ref={div6Ref} className="h-16 w-16">
            <Icons.user />
          </Circle>
        </div>
      </div>

      {/* Animated Beams - Many to One (4 logos → OverSight → Client) */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div5Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div5Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div5Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div4Ref}
        toRef={div5Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div5Ref}
        toRef={div6Ref}
      />
    </div>
  );
}

const Icons = {
  user: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#000000"
      strokeWidth="2"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};
