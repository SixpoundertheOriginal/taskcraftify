
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

// Create a custom options type without onSuccess/onError to avoid type errors
type UseAppQueryOptions<TQueryFnData, TError, TData, TQueryKey extends QueryKey> = Omit<
  UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'onSuccess' | 'onError'
> & 
  ToastOptions & {
    // Add these back as optional functions so we can use them later
    onSuccess?: (data: TData) => void;
    onError?: (error: TError) => void;
  };

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
    onSuccess,
    onError,
    ...queryOptions
  } = options;

  // Initialize state to track first successful data fetch
  const query = useQuery<TQueryFnData, TError, TData, TQueryKey>({
    ...queryOptions,
  });

  // Handle success with toast if data is available and it's the first successful fetch
  if (query.isSuccess && query.data && showSuccessToast && customSuccessMessage && !query.isFetching) {
    // Call the original onSuccess callback if provided
    if (onSuccess && query.data) {
      onSuccess(query.data as TData);
    }
    
    // Show success toast
    toast({
      title: 'Success',
      description: customSuccessMessage,
    });
  }
  
  // Handle error with toast
  if (query.isError && query.error && showErrorToast) {
    // Call the original onError callback if provided
    if (onError && query.error) {
      onError(query.error as TError);
    }
    
    // Show error toast
    toast({
      title: 'Error',
      description: 
        customErrorMessage ||
        (query.error instanceof Error ? query.error.message : 'An error occurred'),
      variant: 'destructive',
    });
  }

  return query;
}
