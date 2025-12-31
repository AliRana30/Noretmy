import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function PageTransitionWrapper({ children }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextPath, setNextPath] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  // Reset transition state when pathname changes (navigation complete)
  useEffect(() => {
    if (isTransitioning && nextPath) {
      // Check if we've navigated to the target page
      const targetPath = nextPath.split('?')[0]; // Remove query params for comparison
      if (pathname === targetPath || pathname.startsWith(targetPath)) {
        // Wait a bit for the page content to start rendering
        const timer = setTimeout(() => {
          setIsTransitioning(false);
          setNextPath('');
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [pathname, isTransitioning, nextPath]);

  // Effect to handle the actual navigation after animation starts
  useEffect(() => {
    if (isTransitioning && nextPath) {
      const timer = setTimeout(() => {
        router.push(nextPath);
      }, 150); // Small delay for fade-out animation

      return () => clearTimeout(timer);
    }
  }, [isTransitioning, nextPath, router]);

  // Function to be passed to children components that need to trigger page transitions
  const navigateWithTransition = (path) => {
    setNextPath(path);
    setIsTransitioning(true);
  };

  return (
    <div className="relative w-full h-full">
      {/* Main content with fade transition */}
      <div
        className={`w-full transition-opacity duration-300 ease-out ${
          isTransitioning ? 'opacity-50' : 'opacity-100'
        }`}
      >
        {/* Clone the children and pass the navigation function */}
        {typeof children === 'function' 
          ? children(navigateWithTransition) 
          : children}
      </div>
      
      {/* Subtle loading indicator at top of page */}
      {isTransitioning && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-300 ease-out animate-progress" 
               style={{ width: isTransitioning ? '80%' : '100%' }} />
        </div>
      )}
      
      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 50%; }
          80% { width: 80%; }
          100% { width: 95%; }
        }
        .animate-progress {
          animation: progress 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}