import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedSectionProps {
  isVisible: boolean;
  children: ReactNode;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  isVisible,
  children,
}) => (
  <AnimatePresence mode="wait">
    {isVisible && (
      <motion.div
        key="animated-section"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className="section py-6 mb-6 bg-white shadow-lg rounded-lg p-6"
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

export default AnimatedSection;
