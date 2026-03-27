import { motion, useReducedMotion } from 'framer-motion';

export default function AnimatedList({ children, className = '' }) {
  const shouldReduce = useReducedMotion();

  const container = {
    hidden: {},
    show: {
      transition: shouldReduce ? {} : { staggerChildren: 0.05 },
    },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedItem({ children, className = '' }) {
  const shouldReduce = useReducedMotion();

  const item = shouldReduce
    ? { hidden: {}, show: {} }
    : { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };

  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  );
}
