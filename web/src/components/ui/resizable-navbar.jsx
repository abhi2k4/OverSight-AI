"use client";
import { cn } from "@/lib/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";

import React, { useRef, useState } from "react";


export const Navbar = ({
  children,
  className
}) => {
  const ref = useRef(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  return (
    <motion.div
      ref={ref}
      // IMPORTANT: Change this to class of `fixed` if you want the navbar to be fixed
      className={cn("sticky inset-x-0 top-20 z-40 w-full", className)}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { visible })
          : child)}
    </motion.div>
  );
};

export const NavBody = ({
  children,
  className,
  visible
}) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(16px)" : "blur(0px)",
        boxShadow: visible
          ? "0 8px 32px rgba(124, 58, 237, 0.12), 0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
          : "none",
        width: visible ? "35%" : "100%",
        y: visible ? 16 : 0,
        border: visible ? "1px solid rgba(124, 58, 237, 0.2)" : "1px solid rgba(124, 58, 237, 0.1)",
      }}
      transition={{
        type: "spring",
        stiffness: 250,
        damping: 35,
      }}
      style={{
        minWidth: "800px",
      }}
      className={cn(
        "relative z-[60] mx-auto hidden w-full max-w-7xl flex-row items-center justify-between self-start rounded-2xl bg-background/40 px-6 py-3 lg:flex backdrop-blur-md border border-border/50",
        visible && "bg-background/60 border-[#7C3AED]/20",
        className
      )}>
      {children}
    </motion.div>
  );
};

export const NavItems = ({
  items,
  className,
  onItemClick
}) => {
  const [hovered, setHovered] = useState(null);

  return (
    <motion.div
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium text-muted-foreground transition duration-200 lg:flex lg:space-x-2",
        className
      )}>
      {items.map((item, idx) => (
        <a
          onMouseEnter={() => setHovered(idx)}
          onClick={onItemClick}
          className="relative px-4 py-2 text-muted-foreground hover:text-[#7C3AED] transition-colors"
          key={`link-${idx}`}
          href={item.link}
          target={item.external ? "_blank" : undefined}
          rel={item.external ? "noopener noreferrer" : undefined}>
          {hovered === idx && (
            <motion.div
              layoutId="hovered"
              className="absolute inset-0 h-full w-full rounded-full bg-[#7C3AED]/5" />
          )}
          <span className="relative z-20 group">
            {item.name}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#7C3AED] group-hover:w-full transition-all" />
          </span>
        </a>
      ))}
    </motion.div>
  );
};

export const MobileNav = ({
  children,
  className,
  visible
}) => {
  return (
    <div
      className={cn(
        "relative z-50 mx-auto flex w-full max-w-[calc(100vw-1rem)] flex-col items-center justify-between lg:hidden",
        className
      )}>
      {children}
    </div>
  );
};

export const MobileNavHeader = ({
  children,
  className
}) => {
  return (
    <div
      className={cn("flex w-full flex-row items-center justify-between", className)}>
      {children}
    </div>
  );
};

export const MobileNavMenu = ({
  children,
  className,
  isOpen,
  onClose
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            "absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start justify-start gap-4 rounded-xl bg-background/80 backdrop-blur-lg px-6 py-6 border border-[#7C3AED]/20 shadow-lg shadow-purple-900/10",
            className
          )}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MobileNavToggle = ({
  isOpen,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className="p-2 hover:bg-muted rounded-md transition-colors"
      aria-label="Toggle menu"
    >
      {isOpen ? (
        <IconX className="text-foreground" size={24} />
      ) : (
        <IconMenu2 className="text-foreground" size={24} />
      )}
    </button>
  );
};

export const NavbarLogo = () => {
  return (
    <a
      href="#"
      className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-normal text-black">
      <img
        src="https://assets.aceternity.com/logo-dark.png"
        alt="logo"
        width={30}
        height={30} />
      <span className="font-medium text-black dark:text-white">Startup</span>
    </a>
  );
};

export const NavbarButton = ({
  href,
  as: Tag = "a",
  children,
  className,
  variant = "primary",
  ...props
}) => {
  const baseStyles =
    "px-4 py-2 rounded-md button text-sm font-bold relative cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center";

  const variantStyles = {
    primary:
      "bg-[#7C3AED] text-white shadow-lg shadow-purple-900/20 hover:bg-[#6D28D9]",
    secondary: "bg-transparent shadow-none dark:text-white hover:text-[#7C3AED]",
    dark: "bg-black text-white shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]",
    gradient:
      "bg-[#7C3AED] text-white shadow-lg shadow-purple-900/20 hover:bg-[#6D28D9]",
  };

  return (
    <Tag
      href={href || undefined}
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}>
      {children}
    </Tag>
  );
};
