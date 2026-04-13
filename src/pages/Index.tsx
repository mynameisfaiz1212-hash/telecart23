import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import FeaturedCards from '@/components/home/FeaturedCards';
import CategoriesSection from '@/components/home/CategoriesSection';
import OffersSection from '@/components/home/OffersSection';
import Ads2ColSection from '@/components/home/Ads2ColSection';
import Ads3ColSection from '@/components/home/Ads3ColSection';

interface PageSection {
  id: string;
  section_type: string;
  sort_order: number;
  is_visible: boolean;
}

const SECTION_MAP: Record<string, React.FC> = {
  hero: HeroSection,
  cards: FeaturedCards,
  categories: CategoriesSection,
  offers: OffersSection,
  ads_2col: Ads2ColSection,
  ads_3col: Ads3ColSection,
};

export default function Index() {
  const [sections, setSections] = useState<PageSection[]>([]);

  useEffect(() => {
    supabase.from('page_sections').select('*').order('sort_order').then(({ data }) => {
      if (data) setSections(data);
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {sections.filter(s => s.is_visible).map((section) => {
          const Component = SECTION_MAP[section.section_type];
          if (!Component) return null;
          return <Component key={section.id} />;
        })}
      </main>
      <Footer />
    </div>
  );
}
