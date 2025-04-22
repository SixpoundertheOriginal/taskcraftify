
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

  // Store the original callbacks
  const originalOnSuccess = queryOptions.onSuccess;
  const originalOnError = queryOptions.onError;
  
  // Create new options without the callbacks (we'll handle them ourselves)
  const { onSuccess, onError, ...restOptions } = queryOptions;

  return useQuery<TQueryFnData, TError, TData, TQueryKey>({
    ...restOptions,
    meta: {
      ...restOptions.meta,
    },
    onSuccess: (data) => {
      // Show success toast if requested
      if (showSuccessToast && customSuccessMessage) {
        toast({
          title: 'Success',
          description: customSuccessMessage,
        });
      }
      
      // Call the original onSuccess if provided
      if (originalOnSuccess) {
        originalOnSuccess(data);
      }
    },
    onError: (error) => {
      // Show error toast if requested
      if (showErrorToast) {
        toast({
          title: 'Error',
          description:
            customErrorMessage ||
            (error instanceof Error ? error.message : 'An error occurred'),
          variant: 'destructive',
        });
      }
      
      // Call the original onError if provided
      if (originalOnError) {
        originalOnError(error);
      }
    },
  });
}
