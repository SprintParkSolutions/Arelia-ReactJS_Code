import { LayoutGroup, motion, type Variants } from "framer-motion";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./navigationMenu.css";

const navItems = ["Home", "About Us", "Services", "Reach Us"];

const getNavItemPath = (item: string) => {
  if (item === "Home") return "/";
  if (item === "About Us") return "/about-us";
  if (item === "Services") return "/services";
  if (item === "Reach Us") return "/contact-us";
  return "/";
};

interface NavigationMenuProps {
  onOpenConsultation: () => void;
}

export default function NavigationMenu({
  onOpenConsultation,
}: NavigationMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const [isExpanded, setIsExpanded] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [isFullyExpanded, setIsFullyExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 1024);

  useEffect(() => {
    const expandTimer = setTimeout(() => setIsExpanded(true), 800);
    const itemsTimer = setTimeout(() => setShowItems(true), 1250);
    const fullyExpandedTimer = setTimeout(() => setIsFullyExpanded(true), 1400);

    return () => { 
      clearTimeout(expandTimer); 
      clearTimeout(itemsTimer);
      clearTimeout(fullyExpandedTimer);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNavClick = (item: string) => {
    const targetPath = getNavItemPath(item);
    if (pathname !== targetPath) {
      navigate(targetPath);
    }
    setIsMobileMenuOpen(false);
  };

  const staggerContainer: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } } 
  };

  const navItemWrapper: Variants = {
    hidden: {},
    visible: {}
  };

  const lineVariant: Variants = {
    hidden: { scaleX: 0, opacity: 0 },
    visible: {
      scaleX: [0, 1, 1, 0],
      opacity: [0, 1, 1, 0],
      transition: { 
        duration: 1.1, 
        times: [0, 0.25, 0.75, 1],
        ease: "easeInOut" 
      }
    }
  };

  const textVariant: Variants = {
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

  const buttonRevealItem: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  const mobileMenuVariant: Variants = {
    hidden: { x: "100%", opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1, 
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } 
    },
    exit: { 
      x: "100%", 
      opacity: 0, 
      transition: { duration: 0.3, ease: "easeIn" } 
    }
  };

  const mobileMenuItemVariant: Variants = {
    hidden: { opacity: 0, x: 20 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 0.3 } 
    }
  };

  return (
    <>
      <motion.nav 
        initial={false}
        animate={{ width: isExpanded ? "95%" : "220px" }}
        transition={{ duration: 1.4, ease: [0.77, 0, 0.175, 1] }}
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-6xl h-[72px] min-h-[72px] max-h-[72px] rounded-2xl border-t border-white/10 border-b border-black/50 bg-[#070707]/95 backdrop-blur-2xl flex items-center shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),_0_0_20px_rgba(212,175,55,0.05)] overflow-hidden px-8 ${
          isMobile ? "hidden" : "flex"
        }`}
      >
        {/* Asymmetric Architectural Pattern Animation */}
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

        {/* Cinematic Logo Reveal */}
        <motion.div
          initial={{ opacity: 0, filter: "blur(12px)", scale: 1.1, left: "50%", x: "-50%", y: "-50%", top: "50%" }}
          animate={{ opacity: 1, filter: "blur(0px)", scale: 1, left: isExpanded ? "32px" : "50%", x: isExpanded ? "0%" : "-50%", y: "-50%", top: "50%" }}
          transition={{ 
            opacity: { duration: 1.2, ease: "easeOut" }, 
            filter: { duration: 1.2, ease: "easeOut" }, 
            scale: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
            left: { duration: 1.4, ease: [0.77, 0, 0.175, 1], delay: 0.2 }, 
            x: { duration: 1.4, ease: [0.77, 0, 0.175, 1], delay: 0.2 }
          }}
          className="absolute text-2xl md:text-3xl font-serif tracking-[0.15em] text-[#D4AF37] uppercase drop-shadow-md whitespace-nowrap z-10"
        >
          ARELIA
        </motion.div>

        {/* Centered Links & Right-Aligned Button */}
        <div className="flex w-full h-full justify-center items-center relative z-0">
          <LayoutGroup>
            <motion.div 
              className="flex items-center justify-center w-full h-full"
              variants={staggerContainer}
              initial="hidden"
              animate={showItems ? "visible" : "hidden"}
            >
              {/* Navigation Links */}
              <ul className="flex gap-2 text-[11px] md:text-[13px] tracking-[0.2em] uppercase font-sans font-medium m-0 p-0">
                {navItems.map((item) => (
                  <motion.li
                    key={item}
                    variants={navItemWrapper}
                    className="relative px-5 py-2.5 cursor-pointer rounded-xl group flex items-center justify-center shrink-0"
                    onClick={() => handleNavClick(item)}
                  >
                    {isFullyExpanded && pathname === getNavItemPath(item) && (
                      <motion.div
                        layoutId="nav-highlight"
                        className="absolute inset-0 rounded-xl z-[-1]"
                        style={{
                          background: "linear-gradient(145deg, rgba(212,175,55,0.15) 0%, rgba(139,115,36,0.05) 100%)",
                          boxShadow: "inset 0px 1px 1px rgba(255,255,255,0.2), inset 0px -1px 3px rgba(0,0,0,0.4), 0 4px 10px rgba(0,0,0,0.3)",
                          border: "1px solid rgba(212,175,55,0.3)",
                          backdropFilter: "blur(8px)"
                        }}
                        initial={{ opacity: 0, scale: 0.4 }} 
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.9 }}
                      />
                    )}
                    
                    <motion.div
                      variants={lineVariant}
                      className="absolute bottom-1 left-4 right-4 h-[1px] bg-white shadow-[0_0_10px_2px_rgba(255,255,255,0.6)] origin-center rounded-full z-0 pointer-events-none"
                    />

                    <motion.span 
                      variants={textVariant}
                      className={`relative z-10 transition-colors duration-300 ${
                        pathname === getNavItemPath(item)
                          ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                          : "text-gray-400 group-hover:text-white"
                      }`}
                    >
                      {item}
                    </motion.span>
                  </motion.li>
                ))}
              </ul>

              {/* Book Consultation Button */}
              <motion.div variants={buttonRevealItem} className="absolute right-0 shrink-0">
                <button
                  type="button"
                  onClick={onOpenConsultation}
                  className="relative px-8 py-3 rounded-full overflow-hidden group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: "radial-gradient(120% 100% at 50% 0%, rgba(30, 25, 10, 1) 0%, rgba(10, 10, 10, 1) 70%)",
                    border: "1px solid rgba(212, 175, 55, 0.4)",
                    boxShadow: "inset 0 1px 2px rgba(212, 175, 55, 0.2), 0 4px 15px rgba(0,0,0,0.5)",
                  }}
                >
                  <motion.div
                    className="absolute top-0 bottom-0 w-[40%] z-0 pointer-events-none"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)", transform: "skewX(-25deg)" }}
                    animate={{ left: ["-50%", "150%"] }}
                    transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 3 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#D4AF37]/0 to-[#D4AF37]/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full z-0 pointer-events-none" />
                  <span className="relative z-10 text-[10px] md:text-[11.5px] text-[#f5f5f0] tracking-[0.2em] uppercase font-sans font-medium transition-colors duration-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] group-hover:text-[#D4AF37]">
                    Book Consultation
                  </span>
                </button>
              </motion.div>
              
            </motion.div>
          </LayoutGroup>
        </div>
      </motion.nav>

      {/* MOBILE NAVIGATION */}
      {isMobile && (
        <>
          {/* Mobile Header with Logo & Hamburger */}
          <motion.div 
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl h-[72px] rounded-2xl border-t border-white/10 border-b border-black/50 bg-[#070707]/95 backdrop-blur-2xl flex items-center justify-between shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]"
          >
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.8 }}
              className="ml-4"
            >
              <span className="text-xl md:text-2xl font-serif tracking-[0.15em] text-[#D4AF37] uppercase drop-shadow-md">
                ARELIA
              </span>
            </motion.div>

            {/* Hamburger Menu Button */}
            <motion.button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mr-4 p-2 flex flex-col gap-1.5 hover:opacity-75 transition-opacity"
              aria-label="Toggle navigation menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 1.25 }}
            >
              <motion.span
                className="w-6 h-0.5 bg-white rounded-full"
                animate={isMobileMenuOpen ? { rotate: 45, y: 12 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3 }}
              />
              <motion.span
                className="w-6 h-0.5 bg-white rounded-full"
                animate={isMobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              <motion.span
                className="w-6 h-0.5 bg-white rounded-full"
                animate={isMobileMenuOpen ? { rotate: -45, y: -12 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          </motion.div>

          {/* Mobile Menu - Slides from Right */}
          {isMobileMenuOpen && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={mobileMenuVariant}
              className="fixed inset-0 z-40 top-[100px] bg-[#070707]/98 backdrop-blur-xl rounded-3xl m-4"
            >
              <div className="flex flex-col h-full p-6 gap-4">
                {/* Navigation Links */}
                <motion.ul 
                  className="flex flex-col gap-3"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {navItems.map((item) => (
                    <motion.li
                      key={item}
                      variants={mobileMenuItemVariant}
                      className="relative px-6 py-4 cursor-pointer rounded-xl group flex items-center"
                      onClick={() => handleNavClick(item)}
                      style={{
                        background: pathname === getNavItemPath(item) 
                          ? "linear-gradient(145deg, rgba(212,175,55,0.15) 0%, rgba(139,115,36,0.05) 100%)"
                          : "transparent",
                        border: pathname === getNavItemPath(item) 
                          ? "1px solid rgba(212,175,55,0.3)"
                          : "1px solid transparent",
                      }}
                    >
                      <span 
                        className={`text-sm md:text-base tracking-[0.2em] uppercase font-sans font-medium transition-colors duration-300 ${
                          pathname === getNavItemPath(item)
                            ? "text-[#D4AF37]"
                            : "text-gray-300 group-hover:text-white"
                        }`}
                      >
                        {item}
                      </span>
                    </motion.li>
                  ))}
                </motion.ul>

                {/* Divider */}
                <motion.div 
                  className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent my-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                />

                {/* Book Consultation Button */}
                <motion.button
                  variants={mobileMenuItemVariant}
                  onClick={() => {
                    onOpenConsultation();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-6 py-4 rounded-xl overflow-hidden group transition-all duration-300"
                  style={{
                    background: "radial-gradient(120% 100% at 50% 0%, rgba(30, 25, 10, 1) 0%, rgba(10, 10, 10, 1) 70%)",
                    border: "1px solid rgba(212, 175, 55, 0.4)",
                    boxShadow: "inset 0 1px 2px rgba(212, 175, 55, 0.2), 0 4px 15px rgba(0,0,0,0.5)",
                  }}
                >
                  <span className="text-sm md:text-base text-[#f5f5f0] tracking-[0.2em] uppercase font-sans font-medium transition-colors duration-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] group-hover:text-[#D4AF37]">
                    Book Consultation
                  </span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Mobile Menu Backdrop */}
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-30 top-[100px]"
            />
          )}
        </>
      )}
    </>
  );
}
