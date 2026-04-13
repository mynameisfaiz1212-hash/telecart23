import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Subcategory {
  id: string;
  name: string;
  link: string | null;
  sort_order: number;
}

interface Category {
  id: string;
  name: string;
  icon_url: string | null;
  bg_color: string;
  sort_order: number;
  subcategories: Subcategory[];
}

export default function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const { data: cats } = await supabase.from('categories').select('*').order('sort_order');
      if (!cats) return;
      const { data: subs } = await supabase.from('subcategories').select('*').order('sort_order');
      const merged = cats.map((category) => ({
        ...category,
        subcategories: (subs || []).filter((sub) => sub.category_id === category.id),
      }));
      setCategories(merged);
    }

    load();

    const channel = supabase
      .channel('categories_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (categories.length === 0) return null;

  return (
    <section id="categories" className="py-12 md:py-16">
      
      <div className="mx-auto max-w-[1580px] px-6">
        
        {/* ✅ Responsive Heading */}
        <h2 className="mb-8 text-xl font-semibold md:text-4xl">
          Explore companies by category
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const showAll = expanded[category.id];
            const visibleSubs = showAll
              ? category.subcategories
              : category.subcategories.slice(0, 5);

            return (
              <div
                key={category.id}
                className="overflow-hidden rounded-xl border border-border/50 bg-card"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/category/${category.id}`)}
                  className="block w-full border-b py-6 md:py-8 px-2 text-center transition-opacity hover:opacity-90"
                  style={{ backgroundColor: category.bg_color }}
                >
                  
                  {/* ✅ Responsive Logo */}
                  {category.icon_url && (
                    <img
                      src={category.icon_url}
                      alt={category.name}
                      className="mx-auto mb-2 h-10 w-10 md:h-14 md:w-14 object-contain"
                    />
                  )}

                  {/* ✅ Responsive Category Heading */}
                  <h3 className="text-lg md:text-2xl font-medium">
                    {category.name}
                  </h3>
                </button>

                <div className="p-4 pl-6 md:pl-8 text-center md:text-left">
                  {visibleSubs.map((sub) => (
                    <div
                      key={sub.id}
                      className="border-b border-border/30 py-2 last:border-b-0"
                    >
                      {sub.link ? (
                        <a
                          href={sub.link}
                          className="text-sm md:text-base text-primary hover:underline"
                        >
                          {sub.name}
                        </a>
                      ) : (
                        <span className="text-sm md:text-base text-foreground">
                          {sub.name}
                        </span>
                      )}
                    </div>
                  ))}

                  {category.subcategories.length > 5 && !showAll && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((prev) => ({
                          ...prev,
                          [category.id]: true,
                        }))
                      }
                      className="mt-3 text-sm md:text-base font-semibold text-primary hover:underline"
                    >
                      See all {'->'}
                    </button>
                  )}

                  {category.subcategories.length > 5 && showAll && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((prev) => ({
                          ...prev,
                          [category.id]: false,
                        }))
                      }
                      className="mt-3 text-sm md:text-base font-medium text-primary hover:underline"
                    >
                      Show less
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
