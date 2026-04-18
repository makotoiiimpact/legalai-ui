"use client";

import { useEffect, useRef, useState } from "react";

export interface PollResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface PollOptions<T> {
  intervalMs: number;
  shouldStop?: (data: T) => boolean;
  enabled?: boolean;
  swallowStatus?: number[];
}

export function usePoll<T>(
  fn: () => Promise<T>,
  options: PollOptions<T>,
  deps: unknown[] = [],
): PollResult<T> {
  const { intervalMs, shouldStop, enabled = true, swallowStatus = [] } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | null>(null);
  const fnRef = useRef(fn);
  const shouldStopRef = useRef(shouldStop);

  useEffect(() => {
    fnRef.current = fn;
    shouldStopRef.current = shouldStop;
  });

  const swallowKey = swallowStatus.join(",");

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const swallow = swallowKey ? swallowKey.split(",").map(Number) : [];

    const runOnce = async () => {
      try {
        const next = await fnRef.current();
        if (cancelled) return;
        setData(next);
        setError(null);
        setIsLoading(false);
        if (shouldStopRef.current?.(next)) return;
        timer = setTimeout(runOnce, intervalMs);
      } catch (err) {
        if (cancelled) return;
        const e = err as Error & { status?: number };
        if (typeof e.status === "number" && swallow.includes(e.status)) {
          setIsLoading(false);
          timer = setTimeout(runOnce, intervalMs);
          return;
        }
        setError(e);
        setIsLoading(false);
      }
    };

    runOnce();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, intervalMs, swallowKey, ...deps]);

  const refetch = async () => {
    try {
      setIsLoading(true);
      const next = await fnRef.current();
      setData(next);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, refetch };
}
