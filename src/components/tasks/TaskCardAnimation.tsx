
import { useEffect, useRef } from 'react';

interface TaskCardAnimationProps {
  isExiting: boolean;
  finishExiting: () => void;
  EXIT_ANIMATION_DURATION: number;
}

export function TaskCardAnimation({ 
  finishExiting,
  EXIT_ANIMATION_DURATION 
}: TaskCardAnimationProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    console.log(`TaskCardAnimation: Setting animation timeout for ${EXIT_ANIMATION_DURATION}ms`);
    
    timeoutRef.current = setTimeout(() => {
      console.log(`TaskCardAnimation: Animation timeout completed`);
      finishExiting();
    }, EXIT_ANIMATION_DURATION);
    
    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        console.log(`TaskCardAnimation: Cleaning up animation timeout`);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [finishExiting, EXIT_ANIMATION_DURATION]);
  
  return null;
}
