
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
  // Use a ref to track if the timeout is already set to avoid creating multiple timeouts
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Clear any existing timeout first
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    
    if (isExiting) {
      // Set the new timeout and store it in the ref
      timeoutIdRef.current = setTimeout(() => {
        // Clear the ref before executing callback to prevent issues
        timeoutIdRef.current = null;
        finishExiting();
      }, EXIT_ANIMATION_DURATION);
    }
    
    // Clean up the timeout on unmount or when dependencies change
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, [isExiting, finishExiting, EXIT_ANIMATION_DURATION]);
  
  // Return null as this is a behavior component, not a UI component
  return null;
}
