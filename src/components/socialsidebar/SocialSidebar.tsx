/**
 * SocialSidebar Component
 * 
 * Perfectly synchronized with NavigationMenu:
 * - Same animation timing (expandTimer: 800ms, itemsTimer: 1250ms)
 * - Height animation with matching easing curve: [0.77, 0, 0.175, 1]
 * - Identical background pattern with asymmetric architectural gradients
 * - Icons fade/stagger in after itemsTimer (1250ms)
 * - Brand-color hover effects for each social platform
 * - Sliding golden pill highlight on hover
 * 
 * MOUNTING INSTRUCTIONS:
 * Already mounted globally in src/App.tsx (after ConsultationModal)
 */

import { useState, useEffect, useRef } from "react";
import { LayoutGroup, motion, type Variants } from "framer-motion";
import "./SocialSidebar.css";

const socialLinks = [
  {
    name: "Instagram",
    href: "https://instagram.com",
    color: "#E1306C",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
      </svg>
    ),
  },
  {
    name: "WhatsApp",
    href: "https://whatsapp.com",
    color: "#25D366",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com",
    color: "#0A66C2",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
        <rect x="2" y="9" width="4" height="12"></rect>
        <circle cx="4" cy="4" r="2"></circle>
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://facebook.com",
    color: "#1877F2",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
      </svg>
    ),
  },
  // {
  //   name: "Gmail",
  //   href: "mailto:contact@arelia.com",
  //   color: "#EA4335",
  //   icon: (
  //     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
  //       <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
  //       <path d="M2 4l10 8 10-8"></path>
  //     </svg>
  //   ),
  // },
];

export const SocialSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const directionRef = useRef(1); // 1 for forward, -1 for backward

  useEffect(() => {
    const expandTimer = setTimeout(() => setIsExpanded(true), 800);
    const itemsTimer = setTimeout(() => setShowItems(true), 1250);

    return () => {
      clearTimeout(expandTimer);
      clearTimeout(itemsTimer);
    };
  }, []);

  // Auto-cycling pill effect with ping-pong loop (pauses on hover)
  useEffect(() => {
    if (isHovered) return; // Pause interval when hovering

    const cycleTimer = setInterval(() => {
      setActiveIndex((prev) => {
        const nextIndex = prev + directionRef.current;

        // Reverse direction at boundaries and apply the direction with the new momentum
        if (nextIndex >= socialLinks.length) {
          directionRef.current = -1;
          return prev - 1;
        } else if (nextIndex < 0) {
          directionRef.current = 1;
          return prev + 1;
        }

        return nextIndex;
      });
    }, 1800); // Cycle every 1.8 seconds

    return () => clearInterval(cycleTimer);
  }, [isHovered]); // Re-run effect when isHovered changes

  const staggerContainer: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } }
  };

  const iconVariant: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: [0, 0, 1, 1],
      y: [8, 8, 0, 0],
      transition: {
        duration: 1.1,
        times: [0, 0.25, 0.6, 1],
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{ height: isExpanded ? "auto" : "72px" }}
      transition={{ duration: 1.4, ease: [0.77, 0, 0.175, 1] }}
      className="fixed top-1/2 -translate-y-1/2 right-6 z-50 w-[72px] rounded-2xl border-t border-white/10 border-b border-black/50 bg-[#070707]/95 backdrop-blur-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),_0_0_20px_rgba(212,175,55,0.05)] overflow-hidden flex flex-col items-center justify-start py-4 px-2"
    >
      {/* Asymmetric Architectural Pattern Animation - Synchronized with Nav */}
      <div className="absolute inset-0 z-[-1] overflow-hidden rounded-2xl pointer-events-none opacity-60">
        <motion.div
          className="absolute inset-[-100%] w-[300%] h-[300%]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(45deg, transparent, transparent 15px, rgba(212,175,55,0.08) 15px, rgba(212,175,55,0.08) 16px),
              repeating-linear-gradient(-25deg, transparent, transparent 35px, rgba(212,175,55,0.05) 35px, rgba(212,175,55,0.05) 37px),
              repeating-linear-gradient(110deg, transparent, transparent 70px, rgba(139,115,36,0.06) 70px, rgba(139,115,36,0.06) 71px)
            `,
          }}
          animate={{ x: ["0%", "-10%"], y: ["0%", "-10%"] }}
          transition={{ duration: 15, ease: "linear", repeat: Infinity }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_#070707_100%)]" />
      </div>

      {/* Arelia Logo - Cinematic Reveal (Immediate, Not Delayed) */}
      <motion.div
        initial={{ opacity: 0, filter: "blur(12px)", scale: 1.1 }}
        animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="mb-5"
      >
        <img
          src="/images/Logos/Arelia_Logo.png"
          alt="Arelia Logo"
          className="w-12 h-12 object-contain drop-shadow-[0_4px_12px_rgba(212,175,55,0.6)]"
        />
      </motion.div>

      {/* Social Icons Container */}
      <LayoutGroup>
        <motion.div
          className="flex flex-col gap-3 items-center justify-center w-full z-10"
          variants={staggerContainer}
          initial="hidden"
          animate={showItems ? "visible" : "hidden"}
          onMouseLeave={() => setIsHovered(false)}
        >
          {socialLinks.map((link, index) => (
            <motion.div
              key={link.name}
              variants={iconVariant}
              className="relative flex items-center justify-center w-11 h-11 cursor-pointer"
              onMouseEnter={() => {
                setActiveIndex(index);
                setIsHovered(true);
              }}
            >
              {/* Sliding Pill Highlighter - Auto-cycling based on activeIndex */}
              {activeIndex === index && (
                <motion.div
                  layoutId={`socialHighlighter-${link.name}`}
                  className="absolute inset-0 rounded-full z-0"
                  style={{
                    background: "radial-gradient(circle, rgba(214, 160, 84, 0.25), transparent)",
                    border: "1px solid rgba(214, 160, 84, 0.15)",
                  }}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {/* Social Icon Link */}
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.name}
                className="relative z-10 flex items-center justify-center w-full h-full transition-colors duration-300"
                style={{
                  color: activeIndex === index ? link.color : "rgb(156, 163, 175)",
                }}
                title={link.name}
              >
                {link.icon}
              </a>
            </motion.div>
          ))}
        </motion.div>
      </LayoutGroup>
    </motion.div>
  );
};