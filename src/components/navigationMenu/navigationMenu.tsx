import { LayoutGroup, motion, type Variants } from "framer-motion";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./navigationMenu.css";

const navItems = ["Home", "About Us", "Services", "Contact Us"];
const logoSrc = "/images/Logos/Arelia.png";
const phoneHref = "tel:+919652380588";
const brandTitle = "ARELIA";

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-[18px] w-[18px]">
      <path
        d="M6.94 5.78a1.6 1.6 0 0 1 1.63-1.03l2.08.25a1.6 1.6 0 0 1 1.36 1.21l.38 1.67a1.6 1.6 0 0 1-.46 1.51l-1.05 1.03a13.1 13.1 0 0 0 2.73 2.73l1.03-1.05a1.6 1.6 0 0 1 1.51-.46l1.67.38a1.6 1.6 0 0 1 1.21 1.36l.25 2.08a1.6 1.6 0 0 1-1.03 1.63l-1.28.52a3.2 3.2 0 0 1-2.95-.28 20.14 20.14 0 0 1-9.01-9.01 3.2 3.2 0 0 1-.28-2.95l.52-1.28Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const getNavItemPath = (item: string) => {
  if (item === "Home") return "/";
  if (item === "About Us") return "/about-us";
  if (item === "Services") return "/services";
  if (item === "Contact Us") return "/contact-us";
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

  const handleHomeClick = () => {
    if (pathname !== "/") {
      navigate("/");
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

  const navTextClass =
    "text-[11px] lg:text-[12px] xl:text-[13px] tracking-[0.16em] lg:tracking-[0.18em] xl:tracking-[0.2em] uppercase font-sans font-medium";
  const navItemBaseClass =
    "relative px-5 lg:px-6 xl:px-7 py-3 cursor-pointer rounded-full group flex items-center justify-center shrink-0 overflow-hidden";

  return (
    <>
      {!isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 px-0">
          <motion.nav
            initial={{ opacity: 0, y: -10, scaleX: 0.22 }}
            animate={{
              opacity: isExpanded ? 1 : 0.85,
              y: isExpanded ? 0 : -10,
              scaleX: isExpanded ? 1 : 0.22,
            }}
            transition={{ duration: 1.4, ease: [0.77, 0, 0.175, 1] }}
            style={{ originX: 0.5 }}
            className="h-[90px] lg:h-[94px] w-full border-b border-white/10 bg-[linear-gradient(180deg,rgba(26,26,26,0.94),rgba(18,18,18,0.88))] backdrop-blur-[28px] flex items-center shadow-[0_18px_40px_-18px_rgba(0,0,0,0.6)] overflow-hidden px-5 lg:px-8 xl:px-10"
          >
            {/* Asymmetric Architectural Pattern Animation */}
            <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none opacity-70">
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
              <motion.div
                className="absolute inset-y-0 left-[-20%] w-[40%]"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(212,175,55,0.12), rgba(255,255,255,0.08), rgba(212,175,55,0.14), transparent)",
                  filter: "blur(22px)",
                }}
                animate={{ x: ["0%", "320%"] }}
                transition={{ duration: 9, ease: "linear", repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-y-0 right-[-24%] w-[36%]"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(212,175,55,0.16) 0%, rgba(212,175,55,0.05) 36%, transparent 72%)",
                  filter: "blur(26px)",
                }}
                animate={{ x: ["0%", "-210%"], opacity: [0.45, 0.7, 0.45] }}
                transition={{ duration: 10, ease: "easeInOut", repeat: Infinity }}
              />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.04)_0%,_rgba(12,12,12,0.72)_72%,_rgba(12,12,12,0.95)_100%)]" />
            </div>

            {/* Centered Links & Right-Aligned Button */}
            <div className="grid w-full h-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 lg:gap-6 xl:gap-8 relative z-0">
              <motion.div
                initial={{ opacity: 0, filter: "blur(12px)", scale: 0.94 }}
                animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                transition={{
                  opacity: { duration: 1.2, ease: "easeOut" },
                  filter: { duration: 1.2, ease: "easeOut" },
                  scale: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
                }}
                className="h-full w-[152px] lg:w-[170px] xl:w-[184px] shrink-0 flex items-center cursor-pointer"
                onClick={handleHomeClick}
              >
                <div className="flex items-center gap-3 lg:gap-4">
                  <img
                    src={logoSrc}
                    alt="Arelia logo"
                    className="h-[64px] lg:h-[72px] xl:h-[76px] w-auto object-contain select-none drop-shadow-[0_12px_24px_rgba(0,0,0,0.42)]"
                    draggable={false}
                  />
                  <div className="text-left">
                    <div className="w-full text-[1rem] lg:text-[1.08rem] xl:text-[1.16rem] leading-none font-serif font-bold tracking-[0.16em] text-[#d9b85f] uppercase drop-shadow-[0_4px_10px_rgba(0,0,0,0.35)]">
                      {brandTitle}
                    </div>
                  </div>
                </div>
              </motion.div>

              <LayoutGroup>
                <motion.div
                  className="flex items-center justify-center min-w-0 w-full h-full"
                  variants={staggerContainer}
                  initial="hidden"
                  animate={showItems ? "visible" : "hidden"}
                >
                  {/* Navigation Links */}
                  <div className="relative flex h-[58px] items-center px-1">
                    <ul className={`relative z-10 flex items-center justify-center min-w-0 gap-1 lg:gap-1.5 xl:gap-2 m-0 p-0 ${navTextClass}`}>
                    {navItems.map((item) => (
                      <motion.li
                        key={item}
                        variants={navItemWrapper}
                        className={navItemBaseClass}
                        onClick={() => handleNavClick(item)}
                      >
                        <div className="absolute inset-0 rounded-full transition-colors duration-300 group-hover:bg-white/[0.035]" />
                        {isFullyExpanded && pathname === getNavItemPath(item) && (
                          <motion.div
                            layoutId="nav-highlight"
                            className="absolute inset-0 rounded-full z-0"
                            style={{
                              background: "linear-gradient(145deg, rgba(212,175,55,0.22) 0%, rgba(139,115,36,0.1) 52%, rgba(255,255,255,0.04) 100%)",
                              boxShadow: "inset 0px 1px 1px rgba(255,255,255,0.2), inset 0px -1px 3px rgba(0,0,0,0.35), 0 8px 18px rgba(0,0,0,0.24)",
                              border: "1px solid rgba(212,175,55,0.34)",
                              backdropFilter: "blur(8px)",
                            }}
                            initial={{ opacity: 0, scale: 0.4 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.9 }}
                          />
                        )}

                        <motion.div
                          variants={lineVariant}
                          className="absolute bottom-1.5 left-5 right-5 h-[1px] bg-white/80 shadow-[0_0_10px_2px_rgba(255,255,255,0.35)] origin-center rounded-full z-0 pointer-events-none"
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
                  </div>
                </motion.div>
              </LayoutGroup>

              <motion.div
                variants={buttonRevealItem}
                initial="hidden"
                animate={showItems ? "visible" : "hidden"}
                className="flex items-center justify-end shrink-0 gap-2.5 lg:gap-3"
              >
                <button
                  type="button"
                  onClick={onOpenConsultation}
                  className="relative px-6 lg:px-7 xl:px-9 py-3.5 rounded-full overflow-hidden group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: "radial-gradient(120% 100% at 50% 0%, rgba(30, 25, 10, 0.82) 0%, rgba(10, 10, 10, 0.72) 70%)",
                    border: "1px solid rgba(212, 175, 55, 0.42)",
                    boxShadow: "inset 0 1px 2px rgba(212, 175, 55, 0.16), 0 4px 15px rgba(0,0,0,0.35)",
                  }}
                >
                  <motion.div
                    className="absolute top-0 bottom-0 w-[40%] z-0 pointer-events-none"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)", transform: "skewX(-25deg)" }}
                    animate={{ left: ["-50%", "150%"] }}
                    transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 3 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#D4AF37]/0 to-[#D4AF37]/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full z-0 pointer-events-none" />
                  <span className={`relative z-10 text-[#f5f5f0] transition-colors duration-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] group-hover:text-[#D4AF37] whitespace-nowrap ${navTextClass}`}>
                    Book Consultation
                  </span>
                </button>
                <a
                  href={phoneHref}
                  aria-label="Call Arelia"
                  className="relative h-[52px] w-[52px] rounded-full overflow-hidden group transition-all duration-300 hover:scale-[1.04] active:scale-[0.98] text-[#D4AF37] border border-[#D4AF37]/35 bg-[radial-gradient(120%_100%_at_50%_0%,rgba(28,23,12,0.68)_0%,rgba(10,10,10,0.28)_70%)] backdrop-blur-[18px] shadow-[inset_0_1px_2px_rgba(212,175,55,0.16),0_4px_15px_rgba(0,0,0,0.24)] hover:text-white"
                >
                  <motion.div
                    className="absolute top-0 bottom-0 w-[40%] z-0 pointer-events-none"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.42), transparent)", transform: "skewX(-25deg)" }}
                    animate={{ left: ["-55%", "155%"] }}
                    transition={{ duration: 2.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 3.5 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#D4AF37]/0 to-[#D4AF37]/12 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full z-0 pointer-events-none" />
                  <span className="relative z-10 flex h-full w-full items-center justify-center">
                    <PhoneIcon />
                  </span>
                </a>
              </motion.div>
            </div>
          </motion.nav>
        </div>
      )}

      {/* MOBILE NAVIGATION */}
      {isMobile && (
        <>
          {/* Mobile Header with Logo & Hamburger */}
          <motion.div 
            className="fixed top-0 left-0 right-0 z-50 h-[72px] border-b border-white/10 bg-[linear-gradient(180deg,rgba(26,26,26,0.94),rgba(20,20,20,0.84))] backdrop-blur-[24px] flex items-center justify-between shadow-[0_18px_40px_-18px_rgba(0,0,0,0.65)] px-3"
          >
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.8 }}
              className="ml-2 sm:ml-4"
            >
              <div className="flex items-center gap-3 cursor-pointer" onClick={handleHomeClick}>
                <img
                  src={logoSrc}
                  alt="Arelia logo"
                  className="w-20 sm:w-24 h-auto object-contain select-none"
                  draggable={false}
                />
                <div className="text-left">
                  <div className="text-[0.95rem] sm:text-[1.05rem] leading-none font-serif tracking-[0.2em] text-[#d9b85f] uppercase drop-shadow-[0_4px_10px_rgba(0,0,0,0.35)]">
                    {brandTitle}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Hamburger Menu Button */}
            <motion.button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mr-2 sm:mr-4 p-2 flex flex-col gap-1.5 hover:opacity-75 transition-opacity"
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
              className="fixed inset-x-0 bottom-0 top-[72px] z-40 bg-[linear-gradient(180deg,rgba(20,20,20,0.94),rgba(12,12,12,0.88))] backdrop-blur-[28px] border-t border-white/10"
            >
              <div className="flex flex-col h-full p-5 sm:p-6 gap-4 overflow-y-auto">
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
                      className="relative px-6 py-4 cursor-pointer rounded-2xl group flex items-center overflow-hidden"
                      onClick={() => handleNavClick(item)}
                    >
                      <div
                        className={`absolute inset-0 rounded-full transition-all duration-300 ${
                          pathname === getNavItemPath(item)
                            ? "border border-[#D4AF37]/35 bg-[linear-gradient(145deg,rgba(212,175,55,0.17)_0%,rgba(139,115,36,0.08)_42%,rgba(255,255,255,0.05)_100%)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.18),inset_0_-1px_3px_rgba(0,0,0,0.35),0_10px_18px_rgba(0,0,0,0.26)]"
                            : "border border-transparent bg-transparent group-hover:bg-white/[0.04]"
                        }`}
                      />
                      <motion.div
                        className="absolute top-0 bottom-0 w-[38%] z-0 pointer-events-none"
                        style={{
                          background:
                            "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                          transform: "skewX(-24deg)",
                        }}
                        animate={{ left: ["-55%", "155%"] }}
                        transition={{ duration: 2.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 3.6 }}
                      />
                      <motion.div
                        variants={lineVariant}
                        className="absolute bottom-2 left-6 right-6 h-[1px] bg-white shadow-[0_0_10px_2px_rgba(255,255,255,0.45)] origin-center rounded-full z-0 pointer-events-none"
                      />
                      <span 
                        className={`relative z-10 text-sm md:text-base tracking-[0.2em] uppercase font-sans font-medium transition-colors duration-300 ${
                          pathname === getNavItemPath(item)
                            ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.45)]"
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

                <motion.a
                  variants={mobileMenuItemVariant}
                  href={phoneHref}
                  aria-label="Call Arelia"
                  className="relative mx-auto flex h-[58px] w-[58px] items-center justify-center rounded-full overflow-hidden text-[#D4AF37] border border-[#D4AF37]/30 bg-[radial-gradient(120%_100%_at_50%_0%,rgba(28,23,12,0.7)_0%,rgba(255,255,255,0.03)_100%)] transition-colors duration-300 hover:text-white hover:border-[#D4AF37]/45"
                >
                  <motion.div
                    className="absolute top-0 bottom-0 w-[40%] z-0 pointer-events-none"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.22), transparent)", transform: "skewX(-25deg)" }}
                    animate={{ left: ["-55%", "155%"] }}
                    transition={{ duration: 2.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 3.5 }}
                  />
                  <span className="relative z-10">
                    <PhoneIcon />
                  </span>
                </motion.a>
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
