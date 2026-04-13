import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function HeroSection() {
  const [mainText, setMainText] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    supabase
      .from('hero_settings')
      .select('*')
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          setMainText(data.main_text);
          setWords(data.animated_words);
        }
      });
  }, []);

  useEffect(() => {
    if (words.length === 0) return;

    const word = words[currentWord];

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setDisplayed(word.substring(0, displayed.length + 1));
        if (displayed.length + 1 === word.length) {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        setDisplayed(word.substring(0, displayed.length - 1));
        if (displayed.length === 0) {
          setIsDeleting(false);
          setCurrentWord((prev) => (prev + 1) % words.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, currentWord, words]);

  return (
    <section id="hero" className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 text-center relative z-10">
        
        {/* MAIN HEADING */}
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-semibold mb-4 text-foreground leading-tight">
          {mainText}
        </h1>

        {/* ANIMATED SECOND LINE */}
        <div className="text-2xl md:text-4xl lg:text-5xl font-bold h-16 flex items-center justify-center">
          <span className="text-[#61646b]">
            {displayed}
            <span className="inline-block w-[8px] h-[1em] bg-[#61646b] ml-1 animate-pulse" />
          </span>
        </div>

      </div>
    </section>
  );
}
