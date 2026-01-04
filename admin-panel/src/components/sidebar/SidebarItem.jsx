const SidebarItem = ({ icon: Icon, label, isOpen, isSelected, onClick, darkMode, isLogout }) => {
  // Format label: add space between characters for 2-char labels (e.g., "US" -> "U S")
  // and convert to Title Case
  const formatLabel = (text) => {
    if (!text) return text;
    
    // For 2-character labels (ignoring case), convert each to uppercase and add space
    if (text.length === 2 && /^[a-zA-Z]{2}$/.test(text.trim())) {
      return text.trim().toUpperCase().split('').join(' ');
    }
    
    // Convert to Title Case (capitalize first letter of each word)
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  const getItemClasses = () => {
    if (isLogout) {
      return darkMode 
        ? 'text-red-400 hover:bg-red-900/30' 
        : 'text-red-500 hover:bg-red-50';
    }
    if (isSelected) {
      return darkMode 
        ? 'bg-orange-500/20 text-orange-400 border-l-3 border-orange-500' 
        : 'bg-orange-50 text-orange-700 border-l-3 border-orange-500';
    }
    return darkMode 
      ? 'text-gray-300 hover:bg-gray-800 hover:text-white' 
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';
  };

  const getIconClasses = () => {
    if (isLogout) {
      return darkMode ? 'text-red-400' : 'text-red-500';
    }
    if (isSelected) {
      return darkMode ? 'text-orange-400' : 'text-orange-600';
    }
    return darkMode ? 'text-gray-400' : 'text-slate-400';
  };

  const getLabelClasses = () => {
    if (isLogout) {
      return darkMode ? 'text-red-400' : 'text-red-500';
    }
    if (isSelected) {
      return darkMode ? 'text-orange-400' : 'text-orange-700';
    }
    return '';
  };

  return (
    <div
      onClick={onClick}
      className={`lg:mx-3 md:mx-2 mx-1 mb-1 lg:px-3 md:px-2 px-1.5 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all duration-200 ${getItemClasses()}`}
    >
      {Icon && (
        <Icon className={`w-5 h-5 flex-shrink-0 ${getIconClasses()}`} />
      )}
      {isOpen && (
        <span className={`lg:text-sm md:text-sm text-xs font-medium truncate ${getLabelClasses()}`}>
          {formatLabel(label)}
        </span>
      )}
      
      {/* Active indicator */}
      {isSelected && !isLogout && (
        <div className="ml-auto w-2 h-2 rounded-full bg-orange-500"></div>
      )}
    </div>
  );
};

export default SidebarItem;
