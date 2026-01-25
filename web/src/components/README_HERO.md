# Hero Section Component

## Overview
The HeroSection component is an animated landing page hero that showcases the OverSight platform architecture diagram with smooth fade-in animations and floating effect.

## Features

### Animations
- **Fade In Up**: Text content animates from bottom with fade effect
- **Floating Diagram**: Complete architecture diagram floats with continuous animation
- **Staggered Appearance**: Elements appear sequentially with delays
- **Scale & Fade**: Diagram scales up and fades in on page load

### Layout
- **Responsive Grid**: 2-column layout on desktop, stacks on mobile
- **Left Side**: 
  - Main heading: "Enterprise AI & Data Governance Control Plane"
  - Descriptive text
  - Purple CTA button with arrow
- **Right Side**:
  - Complete cloud architecture diagram
  - Shows Context, Observe, Trust cards
  - Platform with connections to DataHub, Langfuse, KeyCloak, Minio

## Assets Used
Single diagram image from `src/assets/hero/`:
- `cloud-diagram.png` - Complete architecture diagram with all elements

## Animation Timing
- Container: Stagger children by 0.2s, delay 0.3s
- Text elements: 0.8s duration with easeOut
- Diagram: 1s duration with 0.5s delay
- Floating: 4s infinite loop, moving up/down 10px

## Customization

### Colors
- Primary gradient: `#7C3AED` (purple)
- Background blur: Purple with 20% opacity

### Timing
Adjust animation delays:
```jsx
const diagramVariants = {
  visible: {
    transition: {
      duration: 1,
      delay: 0.5, // Change this
    }
  }
};
```

### Floating Speed
Modify the float animation:
```jsx
const floatAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 4, // Change this value
    repeat: Infinity,
    ease: "easeInOut"
  }
};
```

## Usage
```jsx
import HeroSection from '@/components/HeroSection';

function LandingPage() {
  return (
    <div>
      <HeroSection />
      {/* Other sections */}
    </div>
  );
}
```

## Dependencies
- `framer-motion` - For animations
- `react` - Core framework
- `cloud-diagram.png` in `src/assets/hero/`

## Browser Support
Works in all modern browsers that support:
- CSS transforms
- CSS animations
- Framer Motion library
