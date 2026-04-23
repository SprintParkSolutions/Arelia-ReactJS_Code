import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";
import { useEffect, useRef, useState } from "react";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

import "./ServicesSection.css";

const styles = {
  rows: "rows",
  row: "row",
  rowReverse: "rowReverse",
  rowPaused: "rowPaused",
  rowExpanded: "rowExpanded",
  cardShield: "cardShield",
  marqueeFrame: "marqueeFrame",
  marqueeTrack: "marqueeTrack",
  marqueeGroup: "marqueeGroup",
  marqueeLeft: "marqueeLeft",
  marqueeRight: "marqueeRight",
  imageCard: "imageCard",
  imageCardActive: "imageCardActive",
  imageMedia: "imageMedia",
  image: "image",
  imageOverlay: "imageOverlay",
  cardShell: "cardShell",
  textPane: "textPane",
  textGlow: "textGlow",
  textContent: "textContent",
  note: "note",
  title: "title",
  caption: "caption",
  textFooter: "textFooter",
  button: "button",
  buttonLabel: "buttonLabel",
  buttonIcon: "buttonIcon",
  buttonIconArrow: "buttonIconArrow",
  expandedBackdrop: "expandedBackdrop",
  expandedImageCard: "expandedImageCard",
  expandedImageCardClosing: "expandedImageCardClosing",
  expandedImageMedia: "expandedImageMedia",
  expandedImage: "expandedImage",
  expandedImageOverlay: "expandedImageOverlay",
  cursorBadge: "cursorBadge",
  cursorBadgeLabel: "cursorBadgeLabel",
} as const;

type FadeInProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
};

interface ServiceItem {
  caption: string;
  images: string[];
  note: string;
  title: string;
}

type ExpandedImage = {
  alt: string;
  coverRect: MotionRect;
  id: string;
  phase: "open" | "closing";
  rect: MotionRect;
  rowIndex: number;
  src: string;
};

type MotionRect = {
  borderRadius: number;
  height: number;
  width: number;
  x: number;
  y: number;
};

type ServiceImageProps = {
  alt: string;
  className: string;
  src: string;
};

type LuxuryButtonProps = {
  href?: string;
  label: string;
  onClick?: () => void;
  variant?: "gold" | "ghost";
};

type SectionHeadingProps = {
  align?: "left" | "center";
  description: string;
  eyebrow: string;
  title: ReactNode;
};

const serviceProcess = [
  {
    title: "Understand",
    description:
      "We begin by listening  capturing your vision, requirements, and lifestyle so every design decision is built entirely around you from the very start.",
  },
  {
    title: "Design",
    description:
      "Your ideas take shape through detailed 3D visualizations, premium material selections, and thoughtful layouts  crafted to perfectly balance beauty and functionality.",
  },
  {
    title: "Deliver",
    description:
      "With dedicated site supervision, live project tracking, and daily updates  we execute every detail with precision and hand over your dream space with pride.",
  },
];

const BASE_IMG_PATH = `${import.meta.env.BASE_URL}images/Service%20Page`;
const serviceImagePath = (category: string, fileName: string) =>
  `${BASE_IMG_PATH}/${category}/${fileName}`;
const SERVICES_CONSULTATION_BACKGROUND = serviceImagePath(
  "LandingPage",
  "services%20hero.webp",
);
const FALLBACK_SERVICE_IMAGE = serviceImagePath(
  "residential",
  "services-residential-01.jpg",
);
const CURSOR_BADGE_SIZE = 100;
const thumbnailRadius = 18;
const expandedRadius = 32;

const servicesData: ServiceItem[] = [
  {
    note: "01 / LIVING BY DESIGN",
    title: "Residential Interiors",
    caption:
      "We shape modern home interiors around the way you truly live  every corner of your residential interior design thoughtfully crafted for comfort, elegance and lasting beauty.",
    images: [
      serviceImagePath("residential", "services-residential-01.jpg"),
      serviceImagePath("residential", "services-residential-02.jpg"),
      serviceImagePath("residential", "services-residential-03.jpg"),
      serviceImagePath("residential", "services-residential-04.jpg"),
      serviceImagePath("residential", "services-residential-05.jpg"),
    ],
  },
  {
    note: "02 / BUILT FOR BUSINESS",
    title: "Commercial Spaces",
    caption:
      "From dynamic office interior design to branded retail store interiors  we design commercial spaces that express confidence, inspire productivity and leave a lasting impression from the very first visit.",
    images: [
      serviceImagePath("commercial", "services-commercial-01.jpg"),
      serviceImagePath("commercial", "services-commercial-02.jpg"),
      serviceImagePath("commercial", "services-commercial-03.jpg"),
      serviceImagePath("commercial", "services-commercial-04.jpg"),
      serviceImagePath("commercial", "services-commercial-05.jpg"),
    ],
  },
  {
    note: "03 / CRAFTED FOR GUESTS",
    title: "Hospital Interiors",
    caption:
      "Hotels, resorts, restaurants and lounges crafted through thoughtful hospitality interior design  creating unforgettable guest experiences that feel warm, refined and beautifully considered.",
    images: [
      serviceImagePath("custom-furniture", "services-custom-furniture-01.jpg"),
      serviceImagePath("custom-furniture", "services-custom-furniture-02.jpg"),
      serviceImagePath("custom-furniture", "services-custom-furniture-03.jpg"),
      serviceImagePath("custom-furniture", "services-custom-furniture-04.jpg"),
      serviceImagePath("custom-furniture", "services-custom-furniture-05.jpg"),
    ],
  },
  {
    note: "04 /  BEYOND FOUR WALLS",
    title: "Full Home & Turnkey Design",
    caption:
      "A complete end-to-end interior design service  from 3D interior design visualization and premium material selection to dedicated site supervision and final project handover, every room perfectly brought to life. ",
    images: [
      serviceImagePath("kitchen", "services-kitchen-01.jpg"),
      serviceImagePath("kitchen", "services-kitchen-02.jpg"),
      serviceImagePath("kitchen", "services-kitchen-03.jpg"),
      serviceImagePath("kitchen", "services-kitchen-04.jpg"),
      serviceImagePath("kitchen", "services-kitchen-05.jpg"),
    ],
  },
];

const imageTransition = {
  damping: 28,
  mass: 1,
  stiffness: 250,
  type: "spring" as const,
};

function FadeIn({ children, className, delay = 0, y = 32 }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function LuxuryButton({ href, label, onClick, variant = "gold" }: LuxuryButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-xs font-medium uppercase tracking-[0.28em] transition-all duration-300";

  const variantClasses =
    variant === "gold"
      ? "border border-[#d4a373] bg-[linear-gradient(135deg,rgba(212,163,115,0.18),rgba(212,163,115,0.34))] text-[#f8f6f2] shadow-[0_18px_45px_rgba(212,163,115,0.16)] hover:-translate-y-0.5 hover:border-[#f0c48d] hover:shadow-[0_24px_60px_rgba(212,163,115,0.22)]"
      : "border border-white/15 bg-white/5 text-[#f8f6f2] backdrop-blur-sm hover:-translate-y-0.5 hover:border-[#d4a373]/60 hover:bg-white/10";

  const className = `${baseClasses} ${variantClasses}`;

  if (href) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {label}
    </button>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  const alignment = align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <div className={`servicesProcessHeading ${alignment}`}>
      <p className="servicesProcessHeadingEyebrow">{eyebrow}</p>
      <h2 className="servicesProcessHeadingTitle">{title}</h2>
      <p className="servicesProcessHeadingDescription">
        {description}
      </p>
    </div>
  );
}

function ServicesHero() {
  return (
    <section className="servicesHero" aria-labelledby="services-hero-title">
      <div className="servicesHeroAura servicesHeroAura--left" aria-hidden="true" />
      <div className="servicesHeroAura servicesHeroAura--right" aria-hidden="true" />
      <div className="servicesHeroMarquee" aria-hidden="true">
        <div className="servicesHeroMarqueeRow servicesHeroMarqueeRow--top">
          <div className="servicesHeroMarqueeTrack servicesHeroMarqueeTrack--rtl">
            <span className="servicesHeroMarqueeText">
              ARCHITECTURE &bull; INTERIORS &bull; DESIGN &bull; ELEGANCE &bull; CURATED
            </span>
            <span className="servicesHeroMarqueeText">
              ARCHITECTURE &bull; INTERIORS &bull; DESIGN &bull; ELEGANCE &bull; CURATED
            </span>
            <span className="servicesHeroMarqueeText">
              ARCHITECTURE &bull; INTERIORS &bull; DESIGN &bull; ELEGANCE &bull; CURATED
            </span>
            <span className="servicesHeroMarqueeText">
              ARCHITECTURE &bull; INTERIORS &bull; DESIGN &bull; ELEGANCE &bull; CURATED
            </span>
          </div>
        </div>
        <div className="servicesHeroMarqueeRow servicesHeroMarqueeRow--middle">
          <div className="servicesHeroMarqueeTrack servicesHeroMarqueeTrack--ltr">
            <span className="servicesHeroMarqueeText">
              ARCHITECTURE &bull; INTERIORS &bull; DESIGN &bull; ELEGANCE &bull; CURATED
            </span>
            <span className="servicesHeroMarqueeText">
              ARCHITECTURE &bull; INTERIORS &bull; DESIGN &bull; ELEGANCE &bull; CURATED
            </span>
            <span className="servicesHeroMarqueeText">
              ARCHITECTURE &bull; INTERIORS &bull; DESIGN &bull; ELEGANCE &bull; CURATED
            </span>
            <span className="servicesHeroMarqueeText">
              ARCHITECTURE &bull; INTERIORS &bull; DESIGN &bull; ELEGANCE &bull; CURATED
            </span>
          </div>
        </div>
        <div className="servicesHeroMarqueeRow servicesHeroMarqueeRow--bottom">
          <div className="servicesHeroMarqueeTrack servicesHeroMarqueeTrack--rtl">
            <span className="servicesHeroMarqueeText">
              ARCHITECTURE &bull; INTERIORS &bull; DESIGN &bull; ELEGANCE &bull; CURATED
            </span>
            <span className="servicesHeroMarqueeText">
              ARCHITECTURE &bull; INTERIORS &bull; DESIGN &bull; ELEGANCE &bull; CURATED
            </span>
            <span className="servicesHeroMarqueeText">
              ARCHITECTURE &bull; INTERIORS &bull; DESIGN &bull; ELEGANCE &bull; CURATED
            </span>
            <span className="servicesHeroMarqueeText">
              ARCHITECTURE &bull; INTERIORS &bull; DESIGN &bull; ELEGANCE &bull; CURATED
            </span>
          </div>
        </div>
      </div>

      <div className="servicesHeroShell">
        <p className="servicesHeroEyebrow">Service Catalogue</p>
        <h1 id="services-hero-title" className="servicesHeroHeading">
          <span className="servicesHeroHeadingPrimary">Our</span>{" "}
          <span className="servicesHeroHeadingAccent">Offerings</span>
        </h1>
        <p className="servicesHeroDescription">
          Every Space Crafted with Purpose, Precision and Pride.
        </p>
      </div>
    </section>
  );
}

function ServiceImage({ alt, className, src }: ServiceImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState(src);

  useEffect(() => {
    setResolvedSrc(src);
  }, [src]);

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        if (resolvedSrc !== FALLBACK_SERVICE_IMAGE) {
          setResolvedSrc(FALLBACK_SERVICE_IMAGE);
        }
      }}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
      }}
    />
  );
}

function SignatureServicesSection() {
  const [expandedImage, setExpandedImage] = useState<ExpandedImage | null>(null);
  const [isCursorVisible, setIsCursorVisible] = useState(false);
  const [isExpandedImageReady, setIsExpandedImageReady] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const cardHoverRowRef = useRef<number | null>(null);
  const frameRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const imageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const cursorX = useMotionValue(-CURSOR_BADGE_SIZE);
  const cursorY = useMotionValue(-CURSOR_BADGE_SIZE);
  const smoothPointerX = useSpring(pointerX, {
    damping: 20,
    stiffness: 150,
  });
  const smoothPointerY = useSpring(pointerY, {
    damping: 20,
    stiffness: 150,
  });
  const cursorSpringConfig = {
    damping: 35,
    stiffness: 100,
    mass: 1.2,
  };
  const cursorXSpring = useSpring(cursorX, cursorSpringConfig);
  const cursorYSpring = useSpring(cursorY, cursorSpringConfig);
  const panX = useTransform(smoothPointerX, [-1, 1], [32, -32]);
  const panY = useTransform(smoothPointerY, [-1, 1], [24, -24]);

  const resetExpandedPan = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  const resetFollowerCursor = () => {
    setIsCursorVisible(false);
    cursorX.set(-CURSOR_BADGE_SIZE);
    cursorY.set(-CURSOR_BADGE_SIZE);
  };

  const handleExpandedMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const normalizedX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const normalizedY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;

    pointerX.set(Math.max(-1, Math.min(1, normalizedX)));
    pointerY.set(Math.max(-1, Math.min(1, normalizedY)));
    cursorX.set(event.clientX - bounds.left - CURSOR_BADGE_SIZE / 2);
    cursorY.set(event.clientY - bounds.top - CURSOR_BADGE_SIZE / 2);

    if (!isCursorVisible) {
      setIsCursorVisible(true);
    }
  };

  const handleExpandedMouseLeave = () => {
    setIsCursorVisible(false);
  };

  const getFrameRadius = (frameElement: HTMLElement) => {
    const computedRadius = Number.parseFloat(
      getComputedStyle(frameElement).borderTopLeftRadius,
    );

    return Number.isNaN(computedRadius) ? expandedRadius : computedRadius;
  };

  const getCoverRect = (frameElement: HTMLElement): MotionRect => ({
    borderRadius: getFrameRadius(frameElement),
    height: frameElement.clientHeight,
    width: frameElement.clientWidth,
    x: 0,
    y: 0,
  });

  const getRectWithinFrame = (
    frameElement: HTMLElement,
    sourceElement: HTMLElement | null,
    borderRadius: number,
  ): MotionRect => {
    if (!sourceElement) {
      return getCoverRect(frameElement);
    }

    const frameBounds = frameElement.getBoundingClientRect();
    const sourceBounds = sourceElement.getBoundingClientRect();

    return {
      borderRadius,
      height: sourceBounds.height,
      width: sourceBounds.width,
      x: sourceBounds.left - frameBounds.left,
      y: sourceBounds.top - frameBounds.top,
    };
  };

  const openExpandedImage = (
    image: Omit<ExpandedImage, "coverRect" | "phase" | "rect">,
    sourceElement: HTMLDivElement | null,
  ) => {
    resetExpandedPan();
    resetFollowerCursor();
    setIsExpandedImageReady(false);

    setExpandedImage((current) => {
      if (cardHoverRowRef.current === image.rowIndex) {
        return current;
      }

      const frameElement = frameRefs.current[image.rowIndex];

      if (!frameElement) {
        return current;
      }

      return {
        ...image,
        coverRect: getCoverRect(frameElement),
        phase: "open",
        rect: getRectWithinFrame(frameElement, sourceElement, thumbnailRadius),
      };
    });
  };

  const closeExpandedImage = (rowIndex: number) => {
    resetExpandedPan();
    resetFollowerCursor();
    setIsExpandedImageReady(false);

    setExpandedImage((current) => {
      if (!current || current.rowIndex !== rowIndex) {
        return current;
      }

      const frameElement = frameRefs.current[rowIndex];

      if (!frameElement) {
        return null;
      }

      return {
        ...current,
        phase: "closing",
        rect: getRectWithinFrame(
          frameElement,
          imageRefs.current[current.id],
          thumbnailRadius,
        ),
      };
    });
  };

  const handleCardMouseEnter = (rowIndex: number) => {
    cardHoverRowRef.current = rowIndex;
    closeExpandedImage(rowIndex);
  };

  const handleCardMouseLeave = (rowIndex: number) => {
    if (cardHoverRowRef.current === rowIndex) {
      cardHoverRowRef.current = null;
    }
    // Guard: Do not close expanded image if lightbox is open
    if (lightboxIndex === null) {
      closeExpandedImage(rowIndex);
    }
  };

  const openLightbox = (imageIndex: number) => {
    setLightboxIndex(imageIndex);
    resetExpandedPan();
    resetFollowerCursor();
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    setExpandedImage(null);
  };

  const goToPrevImage = () => {
    if (lightboxIndex !== null && expandedImage) {
      const currentService = servicesData[expandedImage.rowIndex];
      const prevIndex =
        lightboxIndex === 0 ? currentService.images.length - 1 : lightboxIndex - 1;
      setLightboxIndex(prevIndex);
    }
  };

  const goToNextImage = () => {
    if (lightboxIndex !== null && expandedImage) {
      const currentService = servicesData[expandedImage.rowIndex];
      const nextIndex =
        lightboxIndex === currentService.images.length - 1 ? 0 : lightboxIndex + 1;
      setLightboxIndex(nextIndex);
    }
  };

  // Lock page scroll when lightbox is open
  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [lightboxIndex]);

  // Guard: Do not close expanded image if lightbox is open
  // (This is now integrated into handleCardMouseLeave)

  return (
    <section
      id="services"
      className="scroll-mt-32 px-6 pb-20 pt-6 sm:px-8 sm:pt-8 lg:px-10 lg:pb-28 lg:pt-10"
    >
      <div className="mx-auto max-w-[96rem]">
        <div className={styles.rows}>
          {servicesData.map((service, index) => {
            const isReverse = index % 2 === 1;
            const marqueeStyle = {
              "--marquee-duration": `${28 + index * 2}s`,
            } as CSSProperties;
            const isExpanded = expandedImage?.rowIndex === index;
            const isPaused = expandedImage?.rowIndex === index;

            return (
              <FadeIn key={service.title} delay={index * 0.08}>
                <article
                  className={`${styles.row} ${
                    isReverse ? styles.rowReverse : ""
                  } ${isPaused ? styles.rowPaused : ""} ${
                    isExpanded ? styles.rowExpanded : ""
                  }`}
                  onMouseLeave={() => handleCardMouseLeave(index)}
                >
                  <div
                    ref={(node) => {
                      frameRefs.current[index] = node;
                    }}
                    className={styles.marqueeFrame}
                  >
                    <div
                      className={`${styles.marqueeTrack} ${
                        isReverse ? styles.marqueeRight : styles.marqueeLeft
                      }`}
                      style={marqueeStyle}
                    >
                      {[0, 1].map((copyIndex) => (
                        <div
                          key={`${service.title}-${copyIndex}`}
                          className={styles.marqueeGroup}
                        >
                          {service.images.map((image, imageIndex) => {
                            const imageId = `service-image-${index}-${copyIndex}-${imageIndex}`;
                            const imageAlt = `${service.title} visual ${imageIndex + 1}`;

                            return (
                              <figure
                                key={imageId}
                                className={`${styles.imageCard} ${
                                  expandedImage?.id === imageId
                                    ? styles.imageCardActive
                                    : ""
                                }`}
                              >
                                <motion.div
                                  ref={(node) => {
                                    imageRefs.current[imageId] = node;
                                  }}
                                  className={styles.imageMedia}
                                  style={{ borderRadius: thumbnailRadius }}
                                  transition={imageTransition}
                                  onMouseEnter={(event) =>
                                    openExpandedImage(
                                      {
                                        alt: imageAlt,
                                        id: imageId,
                                        rowIndex: index,
                                        src: image,
                                      },
                                      event.currentTarget,
                                    )
                                  }
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openExpandedImage(
                                      {
                                        alt: imageAlt,
                                        id: imageId,
                                        rowIndex: index,
                                        src: image,
                                      },
                                      event.currentTarget,
                                    );
                                  }}
                                >
                                  <ServiceImage
                                    src={image}
                                    alt={imageAlt}
                                    className={styles.image}
                                  />
                                  <div className={styles.imageOverlay} />
                                </motion.div>
                              </figure>
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    {expandedImage?.rowIndex === index && (
                      <>
                        <motion.div
                          className={styles.expandedBackdrop}
                          initial={{ opacity: 0 }}
                          animate={{
                            opacity: expandedImage.phase === "closing" ? 0 : 1,
                          }}
                          transition={{
                            duration: 0.26,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        />
                        <motion.div
                          key={expandedImage.id}
                          className={`${styles.expandedImageCard} ${
                            expandedImage.phase === "closing"
                              ? styles.expandedImageCardClosing
                              : ""
                          }`}
                          initial={expandedImage.rect}
                          animate={
                            expandedImage.phase === "closing"
                              ? expandedImage.rect
                              : expandedImage.coverRect
                          }
                          transition={imageTransition}
                          onAnimationComplete={() => {
                            setExpandedImage((current) => {
                              if (!current || current.rowIndex !== index) {
                                return current;
                              }

                              if (current.phase === "closing") {
                                setIsExpandedImageReady(false);
                                return null;
                              }

                              setIsExpandedImageReady(true);
                              return current;
                            });
                          }}
                          onClick={() => {
                            if (expandedImage) {
                              const imageIndex = servicesData[
                                expandedImage.rowIndex
                              ].images.indexOf(expandedImage.src);
                              openLightbox(imageIndex);
                            }
                          }}
                          onMouseLeave={handleExpandedMouseLeave}
                          onMouseMove={handleExpandedMouseMove}
                        >
                          <motion.div
                            className={styles.expandedImageMedia}
                            animate={{
                              scale: expandedImage.phase === "closing" ? 1 : 1.1,
                            }}
                            style={{
                              x: panX,
                              y: panY,
                            }}
                            transition={{
                              duration: 0.32,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                          >
                            <ServiceImage
                              src={expandedImage.src}
                              alt={expandedImage.alt}
                              className={styles.expandedImage}
                            />
                            <div className={styles.expandedImageOverlay} />
                          </motion.div>

                          <AnimatePresence>
                            {expandedImage.phase === "open" &&
                            isExpandedImageReady &&
                            isCursorVisible ? (
                              <motion.div
                                className="absolute flex items-center justify-center w-24 h-24 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-[inset_0_0_15px_rgba(255,255,255,0.2),_0_8px_32px_rgba(0,0,0,0.3)] text-white/70 hover:text-white transition-colors pointer-events-none"
                                style={{
                                  x: cursorXSpring,
                                  y: cursorYSpring,
                                }}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0 }}
                                transition={{
                                  duration: 0.22,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                              >
                                <span className="text-xs font-medium uppercase tracking-widest">
                                  Gallery
                                </span>
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </motion.div>
                      </>
                    )}
                  </div>

                  <div
                    className={styles.cardShield}
                    onMouseEnter={() => handleCardMouseEnter(index)}
                    onMouseLeave={() => handleCardMouseLeave(index)}
                    aria-hidden="true"
                  />

                  <motion.div
                    className={styles.cardShell}
                    animate={{ opacity: isExpanded ? 0 : 1 }}
                    style={{ pointerEvents: isExpanded ? "none" : "auto" }}
                    transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                    onMouseEnter={() => handleCardMouseEnter(index)}
                    onMouseLeave={() => handleCardMouseLeave(index)}
                  >
                    <div className={styles.textPane}>
                      <div className={styles.textGlow} />

                      <div className={styles.textContent}>
                        <p className={styles.note}>{service.note}</p>
                        <h3 className={styles.title}>{service.title}</h3>
                        <p className={styles.caption}>{service.caption}</p>
                      </div>

                      <div className={styles.textFooter}>
                        <button
                          type="button"
                          aria-label={`View ${service.title} projects`}
                          className={styles.button}
                          onClick={(event) => {
                            const imageId = `service-image-${index}-0-0`;
                            const imageSrc = servicesData[index].images[0];
                            const imageAlt = `${service.title} visual 1`;
                            const frameElement = frameRefs.current[index];

                            event.stopPropagation();
                            event.preventDefault();

                            if (!frameElement) {
                              return;
                            }

                            const coverRect = getCoverRect(frameElement);

                            setExpandedImage({
                              alt: imageAlt,
                              coverRect,
                              id: imageId,
                              phase: "open",
                              rect: coverRect,
                              rowIndex: index,
                              src: imageSrc,
                            });
                            setLightboxIndex(0);
                            resetExpandedPan();
                            resetFollowerCursor();
                          }}
                        >
                          <span className={styles.buttonLabel}>View Gallery</span>
                          <span className={styles.buttonIcon} aria-hidden="true">
                            <span className={styles.buttonIconArrow}>
                              &#8599;
                            </span>
                          </span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </article>
              </FadeIn>
            );
          })}
        </div>
      </div>

      {/* Lightbox Popup */}
      <AnimatePresence>
        {lightboxIndex !== null && expandedImage && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/85 backdrop-blur-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="relative w-[90vw] h-[85vh] rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-4 overflow-hidden flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <motion.button
                className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-md text-white/70 hover:text-white hover:bg-white/10 hover:scale-110 transition-all"
                onClick={closeLightbox}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-xl leading-none">×</span>
              </motion.button>

              {/* Image Container */}
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={servicesData[expandedImage.rowIndex].images[lightboxIndex]}
                  alt={`${servicesData[expandedImage.rowIndex].title} - Image ${lightboxIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* Navigation Buttons */}
              <motion.button
                className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-md text-white/70 hover:text-white hover:bg-white/10 hover:scale-110 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevImage();
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-lg leading-none">‹</span>
              </motion.button>

              <motion.button
                className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-md text-white/70 hover:text-white hover:bg-white/10 hover:scale-110 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNextImage();
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-lg leading-none">›</span>
              </motion.button>

              {/* Image Counter */}
              <motion.div
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-white/60 text-xs font-medium tracking-wide"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                {lightboxIndex + 1} / {servicesData[expandedImage.rowIndex].images.length}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ServicesProcessSection() {
  return (
    <section className="servicesProcessSection">
      <div className="servicesProcessBackdrop" aria-hidden="true">
        <div className="servicesProcessGlow servicesProcessGlow--left" />
        <div className="servicesProcessGlow servicesProcessGlow--right" />
        <div className="servicesProcessMesh" />
      </div>

      <div className="servicesProcessShell">
        <FadeIn className="servicesProcessHeadingWrap">
          <SectionHeading
            eyebrow="Process"
            title={
              <>
                <span className="servicesProcessHeadingPrimary">
                  A Clear Process,
                </span>{" "}
                <span className="servicesProcessHeadingAccent">
                  From Vision to Handover.
                </span>
              </>
            }
            description="We follow a smart, structured process so every design decision feels confident, every step feels clear, and every result feels exactly right."
            align="center"
          />
        </FadeIn>

        <div className="servicesProcessTimeline">
          <div className="servicesProcessRail" aria-hidden="true" />
          <div className="servicesProcessGrid">
            {serviceProcess.map((step, index) => (
              <motion.article
                key={step.title}
                initial={{ opacity: 0, y: 56, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{
                  duration: 0.78,
                  ease: [0.22, 1, 0.36, 1],
                  delay: index * 0.12,
                }}
                whileHover={{ y: -10 }}
                className={`servicesProcessStep ${
                  index % 2 === 0
                    ? "servicesProcessStep--rise"
                    : "servicesProcessStep--fall"
                }`}
              >
                <span className="servicesProcessConnector" aria-hidden="true" />
                <span className="servicesProcessBadge">
                  <span className="servicesProcessBadgeInner">0{index + 1}</span>
                </span>

                <div className="servicesProcessCard">
                  <div
                    className="servicesProcessCardSheen"
                    aria-hidden="true"
                  />
                  <p className="servicesProcessStage">Stage 0{index + 1}</p>
                  <h3 className="servicesProcessCardTitle">{step.title}</h3>
                  <p className="servicesProcessCardText">{step.description}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesConsultationSection({
  onOpenConsultation,
}: {
  onOpenConsultation: () => void;
}) {
  return (
    <section id="contact" className="px-6 py-20 sm:px-8 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <FadeIn>
          <div
            className="servicesConsultationCard overflow-hidden rounded-[2rem] border border-[#d4a373]/25 px-8 py-10 sm:px-10 sm:py-12 lg:flex lg:items-center lg:justify-between lg:px-14"
            style={{
              "--services-consultation-bg": `url("${SERVICES_CONSULTATION_BACKGROUND}")`,
            } as CSSProperties}
          >
            <div className="max-w-2xl">
              <p className="type-label text-[#f0c48d]">
                 START YOUR JOURNEY
              </p>
              <h2 className="type-h2 mt-4 text-[#f8f6f2]">
                Your Perfect Interior is Just One Conversation Away
              </h2>
              <p className="type-body mt-5 text-[#e4ddd3]">
                Whether it's a single room or a complete property our interior design experts will craft a personalized plan built entirely around your space, your style, and your budget. 
              </p>
            </div>

            <div className="mt-8 lg:mt-0 lg:pl-8">
              <LuxuryButton label="BOOK A FREE CONSULTATION" onClick={onOpenConsultation} />
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

export default function ServicesSection({
  onOpenConsultation,
}: {
  onOpenConsultation: () => void;
}) {
  return (
    <main className="relative overflow-hidden bg-transparent text-[#f8f6f2]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-0 h-[34rem] w-[34rem] bg-[radial-gradient(circle,rgba(212,163,115,0.14),transparent_62%)]" />
        <div className="absolute right-[-6rem] top-[18rem] h-[28rem] w-[28rem] bg-[radial-gradient(circle,rgba(212,163,115,0.1),transparent_60%)]" />
      </div>

      <ServicesHero />
      <SignatureServicesSection />
      <ServicesProcessSection />
      <ServicesConsultationSection onOpenConsultation={onOpenConsultation} />
    </main>
  );
}
