import { useEffect, useMemo, useState } from 'react';

export function useInfiniteStepCarousel(
  itemCount: number,
  visibleCount: number,
  enabled: boolean,
  delay = 3500,
) {
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    setIndex(0);
    setAnimate(true);
  }, [itemCount, visibleCount]);

  useEffect(() => {
    if (!enabled || itemCount === 0) return;

    const interval = window.setInterval(() => {
      setAnimate(true);
      setIndex((current) => current + 1);
    }, delay);

    return () => window.clearInterval(interval);
  }, [delay, enabled, itemCount]);

  const duplicatedCount = Math.min(visibleCount, itemCount);

  const slideWidth = useMemo(() => 100 / visibleCount, [visibleCount]);

  const handleTransitionEnd = () => {
    if (index < itemCount) return;
    setAnimate(false);
    setIndex(0);
  };

  useEffect(() => {
    if (animate) return;

    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setAnimate(true);
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [animate]);

  const goNext = () => {
    if (!enabled) return;
    setAnimate(true);
    setIndex((current) => current + 1);
  };

  return {
    index,
    animate,
    goNext,
    handleTransitionEnd,
    slideWidth,
    duplicatedCount,
  };
}
