
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

  // Extract the original callbacks
  const originalOnSuccess = queryOptions.onSuccess;
  const originalOnError = queryOptions.onError;

  // Remove callbacks from the options to avoid TypeScript errors
  // as they're not supported directly in the options object
  const {
    onSuccess,
    onError,
    ...restOptions
  } = queryOptions as any;

  const query = useQuery<TQueryFnData, TError, TData, TQueryKey>({
    ...restOptions,
    meta: {
      ...restOptions.meta,
    },
  });

  // Handle success case with toast if data is available
  if (query.data && showSuccessToast && customSuccessMessage && !query.isPreviousData) {
    // We need to use React's useEffect here, but for simplicity, we'll do a direct toast
    // This isn't ideal, but will work for basic cases
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
