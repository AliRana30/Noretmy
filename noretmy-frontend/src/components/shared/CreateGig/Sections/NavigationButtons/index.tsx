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
}) => {
  const containerClass = leftButton && rightButton 
    ? 'flex items-center justify-between mt-6 gap-4 w-full'
    : 'flex items-center justify-end mt-6 gap-4 w-full';

  return (
    <div className={containerClass}>
      {leftButton && (
        <button
          onClick={leftButton.disabled ? undefined : leftButton.onClick}
          className={`${leftButton.className} flex items-center gap-2 ${leftButton.disabled ? 'pointer-events-none' : ''}`}
          disabled={leftButton.disabled}
        >
          {leftButton.icon && leftButton.iconPosition === 'left' && (
            <span className="flex-shrink-0">{leftButton.icon}</span>
          )}
          <span>{leftButton.text}</span>
          {leftButton.icon && leftButton.iconPosition === 'right' && (
            <span className="flex-shrink-0">{leftButton.icon}</span>
          )}
        </button>
      )}
      {rightButton && (
        <button
          onClick={rightButton.disabled ? undefined : rightButton.onClick}
          className={`${rightButton.className} flex items-center gap-2 ${rightButton.disabled ? 'pointer-events-none' : ''}`}
          disabled={rightButton.disabled}
        >
          {rightButton.icon && rightButton.iconPosition === 'left' && (
            <span className="flex-shrink-0">{rightButton.icon}</span>
          )}
          <span>{rightButton.text}</span>
          {rightButton.icon && rightButton.iconPosition === 'right' && (
            <span className="flex-shrink-0">{rightButton.icon}</span>
          )}
        </button>
      )}
    </div>
  );
};

export default NavigationButtons;
