import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInfiniteStepCarousel } from '@/hooks/useInfiniteStepCarousel';

interface Card {
  id: string;
  title: string;
  description: string;
  logo_url: string | null;
  sort_order: number;
}

export default function FeaturedCards() {
  const [cards, setCards] = useState<Card[]>([]);
  const isMobile = useIsMobile();
  const visibleCount = isMobile ? 1 : 3;
  const needsCarousel = cards.length > visibleCount;

  const {
    index,
    animate,
    goNext,
    handleTransitionEnd,
    slideWidth,
    duplicatedCount,
  } = useInfiniteStepCarousel(cards.length, visibleCount, needsCarousel);

  useEffect(() => {
    const loadCards = () => {
      supabase
        .from('featured_cards')
        .select('*')
        .order('sort_order')
        .then(({ data }) => {
          if (data) setCards(data);
        });
    };

    loadCards();

    const channel = supabase
      .channel('featured_cards_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'featured_cards' },
        loadCards
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const displayCards = useMemo(
    () => [...cards, ...cards.slice(0, duplicatedCount)],
    [cards, duplicatedCount]
  );

  if (cards.length === 0) return null;

  const raisedCardIndex =
    !isMobile && needsCarousel ? (index + 1) % cards.length : -1;

  return (
    <section className="py-10 md:py-14">
      <div className="container mx-auto px-4">
        {needsCarousel ? (
          <div className="relative">
            <div className="overflow-hidden py-6">
              <div
                className="flex"
                onTransitionEnd={handleTransitionEnd}
                style={{
                  transform: `translateX(-${index * slideWidth}%)`,
                  transition: animate ? 'transform 650ms ease' : 'none',
                }}
              >
                {displayCards.map((card, displayIndex) => {
                  const realIndex = displayIndex % cards.length;
                  const isRaised = realIndex === raisedCardIndex;

                  return (
                    <div
                      key={`${card.id}-${displayIndex}`}
                      className="flex-none px-2.5"
                      style={{ width: `${slideWidth}%` }}
                    >
                      <div
                        className={`h-full min-h-[250px] rounded-[28px] pt-10 pl-8 pr-6 pb-6 transition-all duration-300 ${
                          isRaised
                            ? 'bg-card shadow-[0_20px_50px_rgba(15,23,42,0.12)]'
                            : 'bg-[#fcf9f5]'
                        }`}
                      >
                        {card.logo_url && (
                          <div className="mb-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl">
                            <img
                              src={card.logo_url}
                              alt={card.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <h3 className="mb-2 text-2xl font-semibold leading-tight">
                          {card.title}
                        </h3>
                        <p className="text-base leading-relaxed text-muted-foreground">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex">
            {cards.map((card, index) => (
              <div key={card.id} className="flex-1 px-2.5">
                <div
                  className={`h-full min-h-[300px] rounded-[28px] pt-10 pl-8 pr-6 pb-6 transition-all duration-300 ${
                    index === 1
                      ? 'bg-card shadow-[0_20px_50px_rgba(15,23,42,0.12)]'
                      : 'bg-[#fcf9f5]'
                  }`}
                >
                  {card.logo_url && (
                    <div className="mb-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl">
                      <img
                        src={card.logo_url}
                        alt={card.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <h3 className="mb-2 text-xl font-semibold leading-tight">
                    {card.title}
                  </h3>
                  <p className="text-base leading-relaxed text-muted-foreground">
                    {card.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
