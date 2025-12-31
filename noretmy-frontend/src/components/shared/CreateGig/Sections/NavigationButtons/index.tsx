import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ButtonProps {
  onClick: () => void;
  text: string;
  className?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

interface NavigationButtonsProps {
  leftButton?: ButtonProps;
  rightButton?: ButtonProps;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  leftButton,
  rightButton,
}) => (
  <div className="flex justify-between mt-4">
    {leftButton ? (
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={leftButton.onClick}
        className={leftButton.className}
      >
        {leftButton.icon && leftButton.iconPosition === 'left' && (
          <span className="mr-2">{leftButton.icon}</span>
        )}
        {leftButton.text}
        {leftButton.icon && leftButton.iconPosition === 'right' && (
          <span className="ml-2">{leftButton.icon}</span>
        )}
      </motion.button>
    ) : (
      <div />
    )}
    {rightButton && (
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={rightButton.onClick}
        className={rightButton.className}
      >
        {rightButton.icon && rightButton.iconPosition === 'left' && (
          <span className="mr-2">{rightButton.icon}</span>
        )}
        {rightButton.text}
        {rightButton.icon && rightButton.iconPosition === 'right' && (
          <span className="ml-2">{rightButton.icon}</span>
        )}
      </motion.button>
    )}
  </div>
);

export default NavigationButtons;
