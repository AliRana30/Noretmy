import { useContext } from 'react';
import { DarkModeContext } from '../../context/darkModeContext';

const SidebarLogo = ({ isOpen }) => {
  const { darkMode } = useContext(DarkModeContext);
  
  return (
    <div className="h-16 flex items-center px-4">
      <div className="flex items-center gap-3">
        {/* Logo Icon */}
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)'
          }}
        >
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        
        {/* Logo Text */}
        {isOpen && (
          <div className="flex flex-col">
            <span 
              className="text-lg font-bold"
              style={{
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Noretmy
            </span>
            <span className={`text-[10px] uppercase tracking-widest font-medium ${
              darkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              Admin Panel
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarLogo;
