
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
  // Use a ref to track if the timeout is already set
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Only set up timeout if isExiting is true and we don't already have one
    if (isExiting && !timeoutIdRef.current) {
      console.log(`TaskCardAnimation: Setting animation timeout for ${EXIT_ANIMATION_DURATION}ms`);
      
      // Set the new timeout and store it in the ref
      timeoutIdRef.current = setTimeout(() => {
        console.log(`TaskCardAnimation: Animation timeout completed`);
        // Clear the ref before executing callback
        timeoutIdRef.current = null;
        finishExiting();
      }, EXIT_ANIMATION_DURATION);
      
      // Clean up the timeout on unmount or when dependencies change
      return () => {
        if (timeoutIdRef.current) {
          console.log(`TaskCardAnimation: Cleaning up animation timeout`);
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }
      };
    }
  }, [isExiting, EXIT_ANIMATION_DURATION, finishExiting]);
  
  // Return null as this is a behavior component, not a UI component
  return null;
}
