
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

  // Use React Query's hook directly with proper callback handling
  return useQuery<TQueryFnData, TError, TData, TQueryKey>({
    ...queryOptions,
    meta: {
      ...queryOptions.meta,
      // You can add additional metadata here
    },
    gcTime: queryOptions.gcTime,
    staleTime: queryOptions.staleTime,
    queryFn: async (...args) => {
      try {
        // Call the original queryFn
        if (!queryOptions.queryFn) {
          throw new Error('Query function is required');
        }
        return await queryOptions.queryFn(...args);
      } catch (error) {
        // Handle error in queryFn
        if (showErrorToast) {
          toast({
            title: 'Error',
            description:
              customErrorMessage ||
              (error instanceof Error ? error.message : 'An error occurred'),
            variant: 'destructive',
          });
        }
        throw error; // Re-throw so React Query can handle it
      }
    },
    onSuccess: (data) => {
      if (showSuccessToast && customSuccessMessage) {
        toast({
          title: 'Success',
          description: customSuccessMessage,
        });
      }
      // Call the original onSuccess if it exists
      if (queryOptions.onSuccess) {
        queryOptions.onSuccess(data);
      }
    },
    onError: (error) => {
      if (showErrorToast) {
        toast({
          title: 'Error',
          description:
            customErrorMessage ||
            (error instanceof Error ? error.message : 'An error occurred'),
          variant: 'destructive',
        });
      }
      // Call the original onError if it exists
      if (queryOptions.onError) {
        queryOptions.onError(error);
      }
    },
  });
}
