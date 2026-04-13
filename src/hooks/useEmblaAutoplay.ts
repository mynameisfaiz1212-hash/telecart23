import { useEffect } from 'react';

interface EmblaLikeApi {
  scrollNext: () => void;
}

export function useEmblaAutoplay(
  emblaApi: EmblaLikeApi | undefined,
  enabled: boolean,
  delay = 3500,
) {
  useEffect(() => {
    if (!emblaApi || !enabled) return;

    const interval = window.setInterval(() => {
      emblaApi.scrollNext();
    }, delay);

    return () => window.clearInterval(interval);
  }, [delay, emblaApi, enabled]);
}
