import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ButtonProps {
  onClick: () => void;
  text: string;
  className?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
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
        whileHover={{ scale: leftButton.disabled ? 1 : 1.1 }}
        whileTap={{ scale: leftButton.disabled ? 1 : 0.95 }}
        onClick={leftButton.onClick}
        className={leftButton.className}
        disabled={leftButton.disabled}
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
        whileHover={{ scale: rightButton.disabled ? 1 : 1.1 }}
        whileTap={{ scale: rightButton.disabled ? 1 : 0.95 }}
        onClick={rightButton.onClick}
        className={rightButton.className}
        disabled={rightButton.disabled}
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
