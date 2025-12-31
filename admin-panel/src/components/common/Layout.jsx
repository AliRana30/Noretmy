import { Outlet } from 'react-router-dom';
import { useContext } from 'react';
import Sidebar from '../sidebar/Sidebar';
import AppHeader from './AppHeader';
import { DarkModeContext } from '../../context/darkModeContext';

export default function Layout() {
  const { darkMode } = useContext(DarkModeContext);
  
  return (
    <div className={`flex w-full h-screen overflow-hidden ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar - Fixed */}
      <div className="flex-shrink-0 h-screen overflow-hidden">
        <Sidebar />
      </div>
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden"
        style={{
          background: darkMode 
            ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #f8fafc 100%)'
        }}
      >
        {/* Header - Fixed at top */}
        <div className="flex-shrink-0">
          <AppHeader />
        </div>
        
        {/* Page Content - Scrollable */}
        <div className={`flex-1 overflow-y-auto p-6 ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
