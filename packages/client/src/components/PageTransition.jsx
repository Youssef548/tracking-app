import { motion, useReducedMotion } from 'framer-motion';

export default function PageTransition({ children }) {
  const shouldReduce = useReducedMotion();

  if (shouldReduce) {
    return <div>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
