
import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

/**
 * App-standardized React Query fetch hook.
 * Provides:
 *  - Consistent error/state handling
 *  - Optional toast notifications on error/success
 *  - Caching via queryKey
 */
type ToastOptions = {
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  customErrorMessage?: string;
  customSuccessMessage?: string;
};

type UseAppQueryOptions<TQueryFnData, TError, TData, TQueryKey extends QueryKey> =
  UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & ToastOptions;

/**
 * useAppQuery: Standardized data fetcher for the app.
 * @param options - All options for useQuery, plus optional toast options.
 */
export function useAppQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  options: UseAppQueryOptions<TQueryFnData, TError, TData, TQueryKey>
) {
  const {
    showErrorToast = true,
    showSuccessToast = false,
    customErrorMessage,
    customSuccessMessage,
    ...queryOptions
  } = options;

  // Extract the original callbacks for use later
  const originalOnSuccess = queryOptions.onSuccess;
  const originalOnError = queryOptions.onError;

  // Remove callbacks from options to handle properly with React Query v5
  const updatedOptions = { ...queryOptions };
  
  // Clean up by deleting instead of destructuring to avoid TypeScript errors
  delete updatedOptions.onSuccess;
  delete updatedOptions.onError;

  const query = useQuery<TQueryFnData, TError, TData, TQueryKey>({
    ...updatedOptions,
  });

  // Handle success case with toast if data is available
  if (query.data && showSuccessToast && customSuccessMessage && !query.isFetched) {
    // Direct toast for simplicity
    toast({
      title: 'Success',
      description: customSuccessMessage,
    });
    
    // Call the original onSuccess callback if provided
    if (originalOnSuccess) {
      originalOnSuccess(query.data);
    }
  }
  
  // Handle error case with toast
  if (query.error && showErrorToast) {
    toast({
      title: 'Error',
      description: 
        customErrorMessage ||
        (query.error instanceof Error ? query.error.message : 'An error occurred'),
      variant: 'destructive',
    });
    
    // Call the original onError callback if provided
    if (originalOnError) {
      originalOnError(query.error);
    }
  }

  return query;
}
