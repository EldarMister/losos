import { useCallback, useEffect, useRef, useState } from "react";

export function useOptimisticNumber(value: number) {
  const [displayValue, setDisplayValue] = useState(value);
  const displayValueRef = useRef(value);
  const confirmedValueRef = useRef(value);
  const pendingDeltaRef = useRef(0);

  useEffect(() => {
    const confirmedDelta = value - confirmedValueRef.current;
    confirmedValueRef.current = value;
    const pendingBefore = pendingDeltaRef.current;
    const pendingAfter = pendingBefore - confirmedDelta;
    pendingDeltaRef.current = pendingBefore === 0
      || pendingAfter === 0
      || Math.sign(pendingAfter) !== Math.sign(pendingBefore)
      ? 0
      : pendingAfter;

    if (pendingDeltaRef.current === 0) {
      displayValueRef.current = value;
      setDisplayValue(value);
    }
  }, [value]);

  const setOptimisticValue = useCallback((
    nextValueOrUpdater: number | ((current: number) => number),
  ) => {
    const current = displayValueRef.current;
    const nextValue = typeof nextValueOrUpdater === "function"
      ? nextValueOrUpdater(current)
      : nextValueOrUpdater;
    if (nextValue === current) return current;
    pendingDeltaRef.current += nextValue - current;
    displayValueRef.current = nextValue;
    setDisplayValue(nextValue);
    return nextValue;
  }, []);

  return [displayValue, setOptimisticValue] as const;
}
