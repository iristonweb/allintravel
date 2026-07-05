import type { Variants } from "framer-motion";

const AIT_EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, delay, ease: AIT_EASE_OUT },
  }),
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.38, ease: AIT_EASE_OUT },
  },
};

export const heartBurstVariants: Variants = {
  hidden: { opacity: 0, scale: 0.3 },
  visible: {
    opacity: [0, 1, 1, 0],
    scale: [0.4, 1.15, 1.05, 1.35],
    transition: { duration: 0.75, times: [0, 0.15, 0.45, 1], ease: AIT_EASE_OUT },
  },
};

export const slideUpPanel: Variants = {
  hidden: { opacity: 0, y: "100%" },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 420, damping: 34 },
  },
  exit: {
    opacity: 0,
    y: "100%",
    transition: { duration: 0.22, ease: AIT_EASE_OUT },
  },
};

export const scaleTap = { whileTap: { scale: 0.9 }, whileHover: { scale: 1.06 } };
