import { motion, type Variants } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./navigationMenu.css";

const navItems = ["Home", "About Us", "Services", "Contact Us"];
const logoSrc = "/images/Logos/Arelia.png";
const phoneHref = "tel:+919652380588";
const brandTitle = "ARELIA";

const navLineVariants: Variants = {
  hidden: {
    scaleX: 0,
    opacity: 0,
  },
  visible: (index: number) => ({
    scaleX: 1,
    opacity: [0, 1, 1, 0],
    transition: {
      duration: 0.5,
      delay: 0.04 + index * 0.06,
      ease: [0.22, 1, 0.36, 1],
      times: [0, 0.28, 0.72, 1],
    },
  }),
};

const navTextVariants: Variants = {
  hidden: {
    y: "120%",
    opacity: 0,
  },
  visible: (index: number) => ({
    y: "0%",
    opacity: 1,
    transition: {
      duration: 0.46,
      delay: 0.1 + index * 0.06,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const navHighlightTransition = {
  type: "spring" as const,
  stiffness: 380,
  damping: 34,
  mass: 0.8,
};

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="navigationMenu__phoneIcon"
    >
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < 1024,
  );

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

  const renderNavLink = (item: string, index: number, isMobileLink = false) => {
    const targetPath = getNavItemPath(item);
    const isActive = pathname === targetPath;

    return (
      <li
        key={item}
        className={`navigationMenu__item${isActive ? " is-active" : ""}`}
      >
        <button
          type="button"
          className={`navigationMenu__linkButton${
            isMobileLink ? " navigationMenu__linkButton--mobile" : ""
          }`}
          onClick={() => handleNavClick(item)}
          aria-current={isActive ? "page" : undefined}
        >
          {isActive ? (
            <motion.div
              layoutId="nav-highlight"
              className="navigationMenu__activeHighlight"
              transition={navHighlightTransition}
              aria-hidden="true"
            >
              <span className="navigationMenu__activeHighlightAccent" />
            </motion.div>
          ) : null}

          <span className="navigationMenu__linkReveal">
            <span className="navigationMenu__linkTextMask">
              <motion.span
                className="navigationMenu__linkText"
                custom={index}
                initial="hidden"
                animate="visible"
                variants={navTextVariants}
                style={{ fontWeight: 500 }}
              >
                <motion.span
                  animate={{
                    color: isActive
                      ? "#f8f6f2"
                      : "rgba(248, 246, 242, 0.52)",
                  }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="navigationMenu__linkTextLabel"
                >
                  {item}
                </motion.span>
              </motion.span>
            </span>
            <motion.span
              className="navigationMenu__spawnLine"
              custom={index}
              initial="hidden"
              animate="visible"
              variants={navLineVariants}
              aria-hidden="true"
            />
          </span>
        </button>
      </li>
    );
  };

  return (
    <>
      {!isMobile ? (
        <div className="navigationMenu navigationMenu--desktop">
          <nav className="navigationMenu__desktopBar" aria-label="Primary">
            <div className="navigationMenu__desktopInner">
              <button
                type="button"
                className="navigationMenu__brand"
                onClick={handleHomeClick}
                aria-label="Go to home page"
              >
                <img
                  src={logoSrc}
                  alt="Arelia logo"
                  className="navigationMenu__brandLogo"
                  draggable={false}
                />
                <span className="navigationMenu__brandTitle">{brandTitle}</span>
              </button>

              <ul className="navigationMenu__links">
                {navItems.map((item, index) => renderNavLink(item, index))}
              </ul>

              <div className="navigationMenu__actions">
                <button
                  type="button"
                  onClick={onOpenConsultation}
                  className="navigationMenu__consultation"
                >
                  Book Consultation
                </button>
                <a
                  href={phoneHref}
                  aria-label="Call Arelia"
                  className="navigationMenu__iconButton"
                >
                  <PhoneIcon />
                </a>
              </div>
            </div>
          </nav>
        </div>
      ) : (
        <>
          <div className="navigationMenu navigationMenu--mobile">
            <div className="navigationMenu__mobileBar">
              <button
                type="button"
                className="navigationMenu__brand navigationMenu__brand--mobile"
                onClick={handleHomeClick}
                aria-label="Go to home page"
              >
                <img
                  src={logoSrc}
                  alt="Arelia logo"
                  className="navigationMenu__brandLogo navigationMenu__brandLogo--mobile"
                  draggable={false}
                />
                <span className="navigationMenu__brandTitle navigationMenu__brandTitle--mobile">
                  {brandTitle}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((current) => !current)}
                className={`navigationMenu__toggle${
                  isMobileMenuOpen ? " is-open" : ""
                }`}
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="navigationMenu__toggleLine" />
                <span className="navigationMenu__toggleLine" />
                <span className="navigationMenu__toggleLine" />
              </button>
            </div>
          </div>

          {isMobileMenuOpen ? (
            <>
              <div className="navigationMenu__mobilePanel">
                <ul className="navigationMenu__mobileLinks">
                  {navItems.map((item, index) =>
                    renderNavLink(item, index, true),
                  )}
                </ul>

                <div className="navigationMenu__mobileActions">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenConsultation();
                      setIsMobileMenuOpen(false);
                    }}
                    className="navigationMenu__consultation navigationMenu__consultation--mobile"
                  >
                    Book Consultation
                  </button>

                  <a
                    href={phoneHref}
                    aria-label="Call Arelia"
                    className="navigationMenu__iconButton navigationMenu__iconButton--mobile"
                  >
                    <PhoneIcon />
                  </a>
                </div>
              </div>

              <div
                onClick={() => setIsMobileMenuOpen(false)}
                className="navigationMenu__mobileBackdrop"
              />
            </>
          ) : null}
        </>
      )}
    </>
  );
}
