import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInfiniteStepCarousel } from '@/hooks/useInfiniteStepCarousel';

interface Ad {
  id: string;
  image_url: string | null;
  link: string | null;
  sort_order: number;
}

export default function Ads3ColSection() {
  const [ads, setAds] = useState<Ad[]>([]);
  const isMobile = useIsMobile();
  const visibleCount = isMobile ? 1 : 3;
  const needsCarousel = ads.length > visibleCount;
  const {
    index,
    animate,
    goNext,
    handleTransitionEnd,
    slideWidth,
    duplicatedCount,
  } = useInfiniteStepCarousel(ads.length, visibleCount, needsCarousel);

  useEffect(() => {
    const loadAds = () => {
      supabase.from('ads_3col').select('*').order('sort_order').then(({ data }) => {
        if (data) setAds(data);
      });
    };

    loadAds();

    const channel = supabase
      .channel('ads_3col_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ads_3col' }, loadAds)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const displayAds = useMemo(
    () => [...ads, ...ads.slice(0, duplicatedCount)],
    [ads, duplicatedCount],
  );

  if (ads.length === 0) return null;

  return (
    <section className="py-6 md:py-10">
      <div className="container mx-auto px-4">
        {needsCarousel ? (
          <div className="relative">
            <button onClick={goNext} className="absolute -right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center text-foreground/80 md:flex">
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="overflow-hidden">
              <div
                className="flex"
                onTransitionEnd={handleTransitionEnd}
                style={{
                  transform: `translateX(-${index * slideWidth}%)`,
                  transition: animate ? 'transform 650ms ease' : 'none',
                }}
              >
                {displayAds.map((ad, displayIndex) => (
                  <div
                    key={`${ad.id}-${displayIndex}`}
                    className="flex-none px-2.5"
                    style={{ width: `${slideWidth}%` }}
                  >
                    <a href={ad.link || '#'} className="block aspect-[16/9] overflow-hidden rounded-xl bg-muted">
                      {ad.image_url && <img src={ad.image_url} alt="Ad" className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex">
            {ads.map((ad) => (
              <div key={ad.id} className="flex-1 px-2.5">
                <a href={ad.link || '#'} className="block aspect-[16/9] overflow-hidden rounded-xl bg-muted">
                  {ad.image_url && <img src={ad.image_url} alt="Ad" className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
