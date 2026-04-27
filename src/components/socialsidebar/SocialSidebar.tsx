import { useState, useEffect } from "react";
import { LayoutGroup, motion, type Variants } from "framer-motion";
import "./SocialSidebar.css";

const whatsappNumber = "917207845556";
const whatsappMessage = encodeURIComponent(
  "Hi Arelia, I want to book a consultation"
);
const whatsappChatLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

const socialLinks = [
 {
    name: "WhatsApp",
    href: whatsappChatLink,
    bgColor: "#25D366", // Exact WhatsApp Green from ref
    iconColor: "#ffffff",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="w-[22px] h-[22px]">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/areliaspace/",
    bgColor: "#0077B5",
    iconColor: "#ffffff",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="w-5 h-5">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/areliaspace/",
    bgColor: "linear-gradient(45deg, #FF7A45 0%, #FF3053 50%, #C12283 100%)", // Re-mapped to match ref exactly
    iconColor: "#ffffff",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61584344340267",
    bgColor: "#0077B5", // Exact dark brownish-black from ref
    iconColor: "#E6D19E", // Exact pale gold icon color from ref
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="w-5 h-5">
        <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
      </svg>
    ),
  },
];

export const SocialSidebar = () => {
  const [showItems, setShowItems] = useState(false);

  useEffect(() => {
    const itemsTimer = setTimeout(() => setShowItems(true), 1250);
    return () => clearTimeout(itemsTimer);
  }, []);

  const staggerContainer: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } }
  };

  const iconVariant: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 20 }
    }
  };

  return (
    <motion.div
      initial={false}
      // Fixed to Bottom Right
      animate={{ 
        bottom: "30px", 
        right: "30px",
      }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="fixed z-50 flex items-center justify-center social-sidebar-container"
      // Removed the background, border, and backdrop-filter entirely
    >
      <LayoutGroup>
        <motion.div
          className="flex flex-col gap-4 items-center justify-center z-10" // Always column now since it's bottom right
          variants={staggerContainer}
          initial="hidden"
          animate={showItems ? "visible" : "hidden"}
        >
          {socialLinks.map((link) => (
            <motion.div
              key={link.name}
              variants={iconVariant}
              className="relative flex items-center justify-center w-12 h-12 flex-shrink-0"
            >
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.name}
                className="social-icon-btn relative z-10 flex items-center justify-center w-full h-full rounded-full transition-transform duration-300 hover:scale-110"
                style={{
                  background: link.bgColor,
                  color: link.iconColor,
                  // Added a soft shadow so they pop off the background without a container
                  boxShadow: link.name === "LinkedIn"
                    ? "0 6px 18px rgba(0, 119, 181, 0.32), 0 8px 20px rgba(0,0,0,0.35)"
                    : "0 6px 16px rgba(0,0,0,0.4)" 
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
