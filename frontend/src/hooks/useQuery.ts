import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseQueryOptions<T> {
  queryKey: unknown[];
  queryFn: () => Promise<T>;
  refetchInterval?: number;
  initialData?: T;
  enabled?: boolean;
  keepPreviousData?: boolean;
}

export interface UseQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom React Query (useQuery) hook tối ưu cho React 19:
 * - Hỗ trợ Polling định kỳ bằng refetchInterval (e.g. 30000ms)
 * - Tích hợp cơ chế Anti-Flicker (keepPreviousData): Khi fetch ngầm, không kích hoạt isLoading
 *   giúp giao diện giữ nguyên không bị giật lác hay hiện lại skeleton.
 */
export function useQuery<T>({
  queryKey,
  queryFn,
  refetchInterval,
  initialData,
  enabled = true,
  keepPreviousData = true,
}: UseQueryOptions<T>): UseQueryResult<T> {
  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(!initialData);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;

  const isMountedRef = useRef(true);
  const hasLoadedOnceRef = useRef(Boolean(initialData));

  const executeFetch = useCallback(async (isBackground = false) => {
    if (!enabled) return;

    // Nếu không phải fetch ngầm và chưa từng có dữ liệu -> Bật isLoading
    if (!isBackground && !hasLoadedOnceRef.current) {
      setIsLoading(true);
    }
    setIsFetching(true);

    try {
      const result = await queryFnRef.current();
      if (isMountedRef.current) {
        setData(result);
        setError(null);
        hasLoadedOnceRef.current = true;
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsFetching(false);
      }
    }
  }, [enabled]);

  // Initial fetch on mount & when queryKey changes
  const queryKeyString = JSON.stringify(queryKey);
  useEffect(() => {
    isMountedRef.current = true;
    const isBackground = keepPreviousData && Boolean(data);
    executeFetch(isBackground);

    return () => {
      isMountedRef.current = false;
    };
  }, [queryKeyString, executeFetch]);

  // Polling refetchInterval (chạy ngầm tự động mỗi X ms)
  useEffect(() => {
    if (!refetchInterval || refetchInterval <= 0 || !enabled) return;

    const intervalId = setInterval(() => {
      // Background fetch: isBackground = true -> KHÔNG trigger isLoading -> Không flicker
      executeFetch(true);
    }, refetchInterval);

    return () => clearInterval(intervalId);
  }, [refetchInterval, enabled, executeFetch]);

  return {
    data,
    isLoading,
    isFetching,
    error,
    refetch: () => executeFetch(false),
  };
}

