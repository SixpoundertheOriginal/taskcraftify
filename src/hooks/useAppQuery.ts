
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

  // Use React Query's hook directly
  const result = useQuery({
    ...queryOptions,
    meta: {
      ...queryOptions.meta,
      // Allows global onError handling via meta if you want
    },
    onError: (error: any) => {
      if (showErrorToast) {
        toast({
          title: 'Error',
          description:
            customErrorMessage ||
            (error instanceof Error ? error.message : 'An error occurred'),
          variant: 'destructive',
        });
      }
      if (queryOptions.onError) {
        // Type assertion needed due to differing types
        (queryOptions.onError as (err: unknown) => void)(error);
      }
    },
    onSuccess: (data: any) => {
      if (showSuccessToast && customSuccessMessage) {
        toast({
          title: 'Success',
          description: customSuccessMessage,
        });
      }
      if (queryOptions.onSuccess) {
        (queryOptions.onSuccess as (data: unknown) => void)(data);
      }
    },
  });

  return result;
}
