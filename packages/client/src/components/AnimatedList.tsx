import { motion, useReducedMotion } from 'framer-motion';

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
}

export default function AnimatedList({ children, className = '' }: AnimatedListProps) {
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

interface AnimatedItemProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedItem({ children, className = '' }: AnimatedItemProps) {
  const shouldReduce = useReducedMotion();

  const item = shouldReduce
    ? { hidden: {}, show: {} }
    : { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } } };

  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  );
}
