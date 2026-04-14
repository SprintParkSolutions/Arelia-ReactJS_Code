import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";
import { useEffect, useRef, useState } from "react";

import {
  AnimatePresence,
  motion,
  useInView,
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
  href: string;
  label: string;
  variant?: "gold" | "ghost";
};

type SectionHeadingProps = {
  align?: "left" | "center";
  description: string;
  eyebrow: string;
  title: string;
};

const serviceProcess = [
  {
    title: "Discover",
    description:
      "We begin with lifestyle, operational, and aesthetic clarity so the scope feels tailored from the outset.",
  },
  {
    title: "Design",
    description:
      "Layouts, finishes, joinery, and furniture decisions are refined into one cohesive luxury narrative.",
  },
  {
    title: "Deliver",
    description:
      "Selections and implementation are coordinated with care so the finished space feels calm and complete.",
  },
];

const BASE_IMG_PATH = "/images/Service%20Page";
const serviceImagePath = (category: string, fileName: string) =>
  `${BASE_IMG_PATH}/${category}/${fileName}`;

const FALLBACK_SERVICE_IMAGE = serviceImagePath(
  "residential",
  "services-residential-01.jpg",
);
const CURSOR_BADGE_SIZE = 100;
const thumbnailRadius = 18;
const expandedRadius = 32;

const servicesData: ServiceItem[] = [
  {
    note: "01 / Signature Living",
    title: "Residential Services",
    caption:
      "We shape homes around ritual, proportion, and atmosphere. Every room is tailored to feel deeply personal while remaining quietly luxurious.",
    images: [
      serviceImagePath("residential", "services-residential-01.jpg"),
      serviceImagePath("residential", "services-residential-02.jpg"),
      serviceImagePath("residential", "services-residential-03.jpg"),
      serviceImagePath("residential", "services-residential-04.jpg"),
      serviceImagePath("residential", "services-residential-05.jpg"),
    ],
  },
  {
    note: "02 / Branded Environments",
    title: "Commercial Spaces",
    caption:
      "Boutique offices and guest-facing interiors are designed to express confidence with restraint. The result is a space that feels polished, intuitive, and memorable from first arrival.",
    images: [
      serviceImagePath("commercial", "services-commercial-01.avif"),
      serviceImagePath("commercial", "services-commercial-02.jpg"),
      serviceImagePath("commercial", "services-commercial-03.jpg"),
      serviceImagePath("commercial", "services-commercial-04.jpg"),
      serviceImagePath("commercial", "services-commercial-05.jpg"),
    ],
  },
  {
    note: "03 / Bespoke Craft",
    title: "Custom Furniture",
    caption:
      "Bespoke furniture introduces a final layer of identity that off-the-shelf pieces rarely achieve. We refine silhouettes, finishes, and proportions so each piece belongs naturally to the room.",
    images: [
      serviceImagePath("custom-furniture", "services-custom-furniture-01.jpg"),
      serviceImagePath("custom-furniture", "services-custom-furniture-02.jpg"),
      serviceImagePath("custom-furniture", "services-custom-furniture-03.jpg"),
      serviceImagePath("custom-furniture", "services-custom-furniture-04.jpg"),
      serviceImagePath("custom-furniture", "services-custom-furniture-05.jpg"),
    ],
  },
  {
    note: "04 / Culinary Joinery",
    title: "Modular Kitchens",
    caption:
      "Our kitchens balance elegant detailing with seamless daily use. Smart storage, resolved joinery, and premium materials turn utility into an experience of ease.",
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
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true, amount: 0.25 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function LuxuryButton({ href, label, variant = "gold" }: LuxuryButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-xs font-medium uppercase tracking-[0.28em] transition-all duration-300";

  const variantClasses =
    variant === "gold"
      ? "border border-[#d4a373] bg-[linear-gradient(135deg,rgba(212,163,115,0.18),rgba(212,163,115,0.34))] text-[#f8f6f2] shadow-[0_18px_45px_rgba(212,163,115,0.16)] hover:-translate-y-0.5 hover:border-[#f0c48d] hover:shadow-[0_24px_60px_rgba(212,163,115,0.22)]"
      : "border border-white/15 bg-white/5 text-[#f8f6f2] backdrop-blur-sm hover:-translate-y-0.5 hover:border-[#d4a373]/60 hover:bg-white/10";

  return (
    <a href={href} className={`${baseClasses} ${variantClasses}`}>
      {label}
    </a>
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
    <div className={`max-w-2xl ${alignment}`}>
      <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#d4a373]">
        {eyebrow}
      </p>
      <h2 className="mb-5 text-3xl leading-tight text-[#f8f6f2] sm:text-4xl lg:text-5xl [font-family:var(--font-serif)]">
        {title}
      </h2>
      <p className="text-sm leading-7 text-[#d8d1c6] sm:text-base">
        {description}
      </p>
    </div>
  );
}

function ServicesHero() {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-[7.5rem] sm:px-8 sm:pt-[8rem] lg:px-10 lg:pb-28 lg:pt-[8.5rem]">
      <div className="mx-auto max-w-7xl">
        <FadeIn>
          <article className="relative isolate flex min-h-[82vh] items-center justify-center overflow-hidden rounded-[2.4rem] border border-white/10 px-6 py-20 shadow-[0_28px_90px_rgba(0,0,0,0.28)] sm:px-10 lg:min-h-[92vh] lg:px-16 lg:py-24">
            <video
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            >
              <source src="/videos/services-hero-loop.mp4" type="video/mp4" />
            </video>

            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,6,8,0.5),rgba(4,6,8,0.28)_24%,rgba(4,6,8,0.66)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,163,115,0.18),transparent_24%),radial-gradient(circle_at_bottom,rgba(0,0,0,0.24),transparent_38%)]" />

            <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center text-center">
              <div className="mb-8 h-px w-full max-w-3xl bg-gradient-to-r from-transparent via-white/18 to-transparent sm:mb-10" />

              <p className="mb-5 text-[11px] uppercase tracking-[0.42em] text-[#e1bd93] sm:text-xs">
                Services
              </p>

              <h1 className="max-w-4xl text-4xl leading-[0.95] text-[#f8f6f2] sm:text-5xl lg:text-7xl [font-family:var(--font-serif)]">
                Spaces that breathe softly,
                <br />
                and linger beautifully.
              </h1>

              <p className="mt-6 max-w-2xl text-sm leading-7 text-[#e5ddd2] sm:text-base sm:leading-8">
                Residential, commercial, kitchens, and custom furniture shaped
                with quiet precision and enduring grace.
              </p>

              <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row">
                <LuxuryButton href="#services" label="View Signature Services" />
                <LuxuryButton
                  href="#contact"
                  label="Book A Consultation"
                  variant="ghost"
                />
              </div>
            </div>
          </article>
        </FadeIn>
      </div>
    </section>
  );
}

function ServicesCatalogueIntro() {
  return (
    <section className="-mt-10 px-6 pb-3 pt-4 sm:-mt-12 sm:px-8 sm:pt-5 lg:-mt-14 lg:px-10 lg:pt-6">
      <div className="mx-auto max-w-7xl">
        <FadeIn className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center justify-center">
            <p className="bg-[linear-gradient(180deg,#f3d2a4_0%,#d4a373_38%,#9f6b2f_100%)] bg-clip-text text-xs font-medium uppercase tracking-[0.22em] text-transparent [text-shadow:0_4px_15px_rgba(212,175,55,0.2)] sm:text-sm">
              Service Catalogue
            </p>
          </div>
        </FadeIn>
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
    damping: 25,
    stiffness: 300,
    mass: 0.5,
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
  };

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
                  onMouseLeave={() => closeExpandedImage(index)}
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
                          onClick={() => closeExpandedImage(index)}
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
                                className={styles.cursorBadge}
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
                                <span className={styles.cursorBadgeLabel}>
                                  View Projects
                                </span>
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </motion.div>
                      </>
                    )}
                  </div>

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
                        <a
                          href="#contact"
                          aria-label={`View ${service.title} projects`}
                          className={styles.button}
                        >
                          <span className={styles.buttonLabel}>View Projects</span>
                          <span className={styles.buttonIcon} aria-hidden="true">
                            <span className={styles.buttonIconArrow}>
                              &#8599;
                            </span>
                          </span>
                        </a>
                      </div>
                    </div>
                  </motion.div>
                </article>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ServicesProcessSection() {
  return (
    <section className="px-6 py-20 sm:px-8 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <FadeIn>
          <SectionHeading
            eyebrow="Process"
            title="The service experience stays clear, tailored, and highly detailed from first brief to final layer."
            description="We work with a calm, considered process so the design feels luxurious not only in the result, but in the way it comes together."
            align="center"
          />
        </FadeIn>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {serviceProcess.map((step, index) => (
            <FadeIn key={step.title} delay={index * 0.08} className="h-full">
              <article className="flex h-full flex-col rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(18,25,34,0.92))] p-7">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d4a373]/35 bg-[#d4a373]/10 text-sm uppercase tracking-[0.24em] text-[#f1d4aa]">
                  0{index + 1}
                </span>
                <h3 className="mt-7 text-2xl text-[#f8f6f2] [font-family:var(--font-serif)]">
                  {step.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-[#dcd3c7]">
                  {step.description}
                </p>
              </article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServicesConsultationSection() {
  return (
    <section id="contact" className="px-6 py-20 sm:px-8 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <FadeIn>
          <div className="overflow-hidden rounded-[2rem] border border-[#d4a373]/25 bg-[linear-gradient(135deg,rgba(212,163,115,0.16),rgba(13,17,22,0.96)_40%,rgba(13,17,22,1)_100%)] px-8 py-10 sm:px-10 sm:py-12 lg:flex lg:items-center lg:justify-between lg:px-14">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.35em] text-[#f0c48d]">
                Tailored Consultation
              </p>
              <h2 className="mt-4 text-3xl leading-tight text-[#f8f6f2] sm:text-4xl lg:text-5xl [font-family:var(--font-serif)]">
                Tell us which space you are shaping, and we&apos;ll guide the right
                service scope around it.
              </h2>
              <p className="mt-5 text-base leading-8 text-[#e4ddd3]">
                Whether it starts with one room or a full property, the design
                direction is always tailored to the life of the space.
              </p>
            </div>

            <div className="mt-8 lg:mt-0 lg:pl-8">
              <LuxuryButton href="#contact" label="Start A Consultation" />
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

export default function ServicesSection() {
  return (
    <main className="relative overflow-hidden bg-transparent text-[#f8f6f2]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-0 h-[34rem] w-[34rem] bg-[radial-gradient(circle,rgba(212,163,115,0.14),transparent_62%)]" />
        <div className="absolute right-[-6rem] top-[18rem] h-[28rem] w-[28rem] bg-[radial-gradient(circle,rgba(212,163,115,0.1),transparent_60%)]" />
      </div>

      <ServicesHero />
      <ServicesCatalogueIntro />
      <SignatureServicesSection />
      <ServicesProcessSection />
      <ServicesConsultationSection />
    </main>
  );
}
