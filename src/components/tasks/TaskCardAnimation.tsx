
import { useEffect, useRef } from 'react';

interface TaskCardAnimationProps {
  isExiting: boolean;
  finishExiting: () => void;
  EXIT_ANIMATION_DURATION: number;
}

export function TaskCardAnimation({ 
  isExiting, 
  finishExiting,
  EXIT_ANIMATION_DURATION 
}: TaskCardAnimationProps) {
  const hasSetupTimeoutRef = useRef(false);
  
  useEffect(() => {
    // Only set up timeout once when component mounts and isExiting is true
    if (isExiting && !hasSetupTimeoutRef.current) {
      console.log(`TaskCardAnimation: Setting animation timeout for ${EXIT_ANIMATION_DURATION}ms`);
      hasSetupTimeoutRef.current = true;
      
      const timeoutId = setTimeout(() => {
        console.log(`TaskCardAnimation: Animation timeout completed`);
        finishExiting();
      }, EXIT_ANIMATION_DURATION);
      
      // Cleanup function
      return () => {
        console.log(`TaskCardAnimation: Cleaning up animation timeout`);
        clearTimeout(timeoutId);
      };
    }
  }, []); // Empty dependency array - only run on mount
  
  return null;
}
