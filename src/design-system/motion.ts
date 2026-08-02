/**
 * Motion primitives — easing curves and durations matching the
 * Business Operating System "calm premium" feel.
 *
 * Adopted from the Deptify visual language:
 *   smooth: cubic-bezier(0.32, 0.72, 0, 1)
 *   spring: cubic-bezier(0.34, 1.56, 0.64, 1)
 */

export const easing = {
  smooth: [0.32, 0.72, 0, 1],
  spring: [0.34, 1.56, 0.64, 1],
  standard: [0.4, 0, 0.2, 1],
} as const;

export const duration = {
  instant: 0.08,
  fast: 0.16,
  base: 0.22,
  slow: 0.32,
  page: 0.4,
} as const;

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: duration.base, ease: easing.smooth },
};

export const slideUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 16 },
  transition: { duration: duration.base, ease: easing.smooth },
};

export const slideUpStagger = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 12 },
  transition: { duration: duration.slow, ease: easing.spring },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
  transition: { duration: duration.base, ease: easing.spring },
};

export const stagger = (delay = 0.04) => ({
  animate: {
    transition: {
      staggerChildren: delay,
      delayChildren: 0.02,
    },
  },
});

/** Shared container variants for page-level entrances. */
export const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const pageTransition = {
  duration: duration.slow,
  ease: easing.smooth,
};

/**
 * Staggered children animation for card grids and lists.
 * Usage: <motion.div variants={staggerChildren} initial="initial" animate="animate">
 */
export const staggerChildren = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: duration.base, ease: easing.smooth },
};

/**
 * Card hover lift — premium DeptIA micro-interaction.
 */
export const cardHover = {
  whileHover: { y: -2, transition: { type: 'spring', stiffness: 400, damping: 26 } },
  whileTap: { scale: 0.985 },
};

/**
 * Thinking dot animation variants.
 */
export const thinkingDots = {
  initial: { opacity: 0.4, y: 0 },
  animate: {
    opacity: [0.4, 1, 0.4],
    y: [0, -2, 0],
  },
  transition: {
    duration: 1.4,
    repeat: Infinity,
    ease: easing.smooth,
  },
};
