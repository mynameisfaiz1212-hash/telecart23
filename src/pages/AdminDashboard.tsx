import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import ImageUpload from '@/components/admin/ImageUpload';
import ImageCropper from '@/components/admin/ImageCropper';
import FileUpload from '@/components/admin/FileUpload';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Plus, Pencil, Trash2, LogOut, Home, X, Save,
  LayoutDashboard, Type, Layers, CreditCard, Tag, Star, Image, Megaphone
} from 'lucide-react';

interface PageSection { id: string; section_type: string; sort_order: number; is_visible: boolean; }
interface FeaturedCard { id: string; title: string; description: string; logo_url: string | null; sort_order: number; }
interface Category { id: string; name: string; icon_url: string | null; bg_color: string; sort_order: number; }
interface Subcategory { id: string; category_id: string; name: string; link: string | null; sort_order: number; }
interface CategoryDownload { id: string; category_id: string; file_name: string; file_url: string; file_type: string; }
interface Offer { id: string; image_url: string | null; heading: string; description: string | null; link: string | null; sort_order: number; }
interface Ad2 { id: string; image_url: string | null; link: string | null; sort_order: number; }
interface Ad3 { id: string; image_url: string | null; link: string | null; sort_order: number; }

type Tab = 'dashboard' | 'hero' | 'sections' | 'cards' | 'categories' | 'offers' | 'ads2';

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border mb-2">
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical className="w-5 h-5" />
      </button>
      <div className="flex-1">{children}</div>
    </div>
  );
}

const SIDEBAR_ITEMS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { key: 'hero', label: 'Hero Section', icon: <Type className="w-5 h-5" /> },
  { key: 'sections', label: 'Page Layout', icon: <Layers className="w-5 h-5" /> },
  { key: 'cards', label: 'Feature Cards', icon: <CreditCard className="w-5 h-5" /> },
  { key: 'categories', label: 'Categories', icon: <Tag className="w-5 h-5" /> },
  { key: 'offers', label: 'Offers', icon: <Star className="w-5 h-5" /> },
  { key: 'ads2', label: 'Advertisements', icon: <Image className="w-5 h-5" /> },
];

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [sections, setSections] = useState<PageSection[]>([]);
  const [heroText, setHeroText] = useState('');
  const [heroWords, setHeroWords] = useState('');
  const [cards, setCards] = useState<FeaturedCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categoryDownloads, setCategoryDownloads] = useState<CategoryDownload[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [ads2, setAds2] = useState<Ad2[]>([]);
  const [ads3, setAds3] = useState<Ad3[]>([]);

  const [editCard, setEditCard] = useState<Partial<FeaturedCard> | null>(null);
  const [editCategory, setEditCategory] = useState<Partial<Category> | null>(null);
  const [editSubs, setEditSubs] = useState<Subcategory[]>([]);
  const [editDownloads, setEditDownloads] = useState<Partial<CategoryDownload>[]>([]);
  const [editOffer, setEditOffer] = useState<Partial<Offer> | null>(null);
  const [editAd2, setEditAd2] = useState<Partial<Ad2> | null>(null);
  const [editAd3, setEditAd3] = useState<Partial<Ad3> | null>(null);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate('/admin/login');
  }, [loading, user, isAdmin]);

  useEffect(() => {
    loadAll();

    const channel = supabase
      .channel('admin_dashboard_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'page_sections' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hero_settings' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'featured_cards' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'category_downloads' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ads_2col' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ads_3col' }, loadAll)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadAll() {
    const [s, h, c, cat, sub, downloads, o, a2, a3] = await Promise.all([
      supabase.from('page_sections').select('*').order('sort_order'),
      supabase.from('hero_settings').select('*').limit(1).single(),
      supabase.from('featured_cards').select('*').order('sort_order'),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('subcategories').select('*').order('sort_order'),
      supabase.from('category_downloads').select('*'),
      supabase.from('offers').select('*').order('sort_order'),
      supabase.from('ads_2col').select('*').order('sort_order'),
      supabase.from('ads_3col').select('*').order('sort_order'),
    ]);
    if (s.data) setSections(s.data);
    if (h.data) { setHeroText(h.data.main_text); setHeroWords(h.data.animated_words.join(', ')); }
    if (c.data) setCards(c.data);
    if (cat.data) setCategories(cat.data);
    if (sub.data) setSubcategories(sub.data);
    if (downloads.data) setCategoryDownloads(downloads.data);
    if (o.data) setOffers(o.data);
    if (a2.data) setAds2(a2.data);
    if (a3.data) setAds3(a3.data);
  }

  async function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex(s => s.id === active.id);
    const newIndex = sections.findIndex(s => s.id === over.id);
    const newSections = arrayMove(sections, oldIndex, newIndex).map((s, i) => ({ ...s, sort_order: i }));
    setSections(newSections);
    for (const s of newSections) {
      await supabase.from('page_sections').update({ sort_order: s.sort_order }).eq('id', s.id);
    }
    toast.success('Section order saved!');
  }

  async function saveHero() {
    const words = heroWords.split(',').map(w => w.trim()).filter(Boolean);
    const { data } = await supabase.from('hero_settings').select('id').limit(1).single();
    if (data) {
      await supabase.from('hero_settings').update({ main_text: heroText, animated_words: words }).eq('id', data.id);
    }
    toast.success('Hero saved!');
  }

  async function saveCard() {
    if (!editCard) return;
    if (!editCard.title?.trim() || !editCard.description?.trim()) {
      toast.error('Title and description are required.');
      return;
    }
    try {
      if (editCard.id) {
        const { error } = await supabase.from('featured_cards').update({ title: editCard.title.trim(), description: editCard.description.trim(), logo_url: editCard.logo_url }).eq('id', editCard.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('featured_cards').insert({ title: editCard.title.trim(), description: editCard.description.trim(), logo_url: editCard.logo_url, sort_order: cards.length });
        if (error) throw error;
      }
      setEditCard(null);
      loadAll();
      toast.success('Card saved!');
    } catch (error) {
      console.error('Error saving card:', error);
      toast.error('Failed to save card. Check console for details.');
    }
  }

  async function deleteCard(id: string) {
    try {
      const { error } = await supabase.from('featured_cards').delete().eq('id', id);
      if (error) throw error;
      loadAll();
      toast.success('Deleted!');
    } catch (error) {
      console.error('Error deleting card:', error);
      toast.error('Failed to delete card.');
    }
  }

  async function saveCategory() {
    if (!editCategory) return;
    if (!editCategory.name?.trim()) {
      toast.error('Category name is required.');
      return;
    }
    try {
      const cleanedDownloads = editDownloads
        .filter((download) => download.file_name && download.file_url)
        .slice(0, 5);

      if (editCategory.id) {
        const { error: catError } = await supabase.from('categories').update({ name: editCategory.name.trim(), icon_url: editCategory.icon_url, bg_color: editCategory.bg_color! }).eq('id', editCategory.id);
        if (catError) throw catError;
        
        await supabase.from('subcategories').delete().eq('category_id', editCategory.id);
        for (let i = 0; i < editSubs.length; i++) {
          const { error: subError } = await supabase.from('subcategories').insert({ category_id: editCategory.id, name: editSubs[i].name, link: editSubs[i].link, sort_order: i });
          if (subError) throw subError;
        }
        
        await supabase.from('category_downloads').delete().eq('category_id', editCategory.id);
        for (const download of cleanedDownloads) {
          const { error: downloadError } = await supabase.from('category_downloads').insert({
            category_id: editCategory.id,
            file_name: download.file_name!,
            file_url: download.file_url!,
            file_type: download.file_type || 'file',
          });
          if (downloadError) throw downloadError;
        }
      } else {
        const { data, error: insertError } = await supabase.from('categories').insert({ name: editCategory.name.trim(), icon_url: editCategory.icon_url, bg_color: editCategory.bg_color || '#FFF9C4', sort_order: categories.length }).select().single();
        if (insertError) throw insertError;
        
        if (data) {
          for (let i = 0; i < editSubs.length; i++) {
            const { error: subError } = await supabase.from('subcategories').insert({ category_id: data.id, name: editSubs[i].name, link: editSubs[i].link, sort_order: i });
            if (subError) throw subError;
          }
          for (const download of cleanedDownloads) {
            const { error: downloadError } = await supabase.from('category_downloads').insert({
              category_id: data.id,
              file_name: download.file_name!,
              file_url: download.file_url!,
              file_type: download.file_type || 'file',
            });
            if (downloadError) throw downloadError;
          }
        }
      }
      setEditCategory(null); setEditSubs([]); setEditDownloads([]); loadAll(); toast.success('Category saved!');
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category.');
    }
  }

  async function deleteCategory(id: string) {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      loadAll();
      toast.success('Deleted!');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category.');
    }
  }

  async function saveOffer() {
    if (!editOffer) return;
    if (!editOffer.heading?.trim()) {
      toast.error('Heading is required.');
      return;
    }
    try {
      if (editOffer.id) {
        const { error } = await supabase.from('offers').update({ heading: editOffer.heading.trim(), description: editOffer.description, image_url: editOffer.image_url, link: editOffer.link }).eq('id', editOffer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('offers').insert({ heading: editOffer.heading.trim(), description: editOffer.description, image_url: editOffer.image_url, link: editOffer.link, sort_order: offers.length });
        if (error) throw error;
      }
      setEditOffer(null); loadAll(); toast.success('Offer saved!');
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error('Failed to save offer.');
    }
  }

  async function deleteOffer(id: string) {
    try {
      const { error } = await supabase.from('offers').delete().eq('id', id);
      if (error) throw error;
      loadAll();
      toast.success('Deleted!');
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('Failed to delete offer.');
    }
  }

  async function saveAd2() {
    if (!editAd2) return;
    try {
      if (editAd2.id) {
        const { error } = await supabase.from('ads_2col').update({ image_url: editAd2.image_url, link: editAd2.link }).eq('id', editAd2.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('ads_2col').insert({ image_url: editAd2.image_url, link: editAd2.link, sort_order: ads2.length });
        if (error) throw error;
      }
      setEditAd2(null); loadAll(); toast.success('Ad saved!');
    } catch (error) {
      console.error('Error saving ad:', error);
      toast.error('Failed to save ad.');
    }
  }

  async function deleteAd2(id: string) {
    try {
      const { error } = await supabase.from('ads_2col').delete().eq('id', id);
      if (error) throw error;
      loadAll();
      toast.success('Deleted!');
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast.error('Failed to delete ad.');
    }
  }

  async function saveAd3() {
    if (!editAd3) return;
    try {
      if (editAd3.id) {
        const { error } = await supabase.from('ads_3col').update({ image_url: editAd3.image_url, link: editAd3.link }).eq('id', editAd3.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('ads_3col').insert({ image_url: editAd3.image_url, link: editAd3.link, sort_order: ads3.length });
        if (error) throw error;
      }
      setEditAd3(null); loadAll(); toast.success('Ad saved!');
    } catch (error) {
      console.error('Error saving ad:', error);
      toast.error('Failed to save ad.');
    }
  }

  async function deleteAd3(id: string) {
    try {
      const { error } = await supabase.from('ads_3col').delete().eq('id', id);
      if (error) throw error;
      loadAll();
      toast.success('Deleted!');
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast.error('Failed to delete ad.');
    }
  }

  async function handleLogout() { await supabase.auth.signOut(); navigate('/admin/login'); }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const sectionLabels: Record<string, string> = {
    hero: '🏠 Hero Section', cards: '🃏 Featured Cards', categories: '📂 Categories',
    offers: '🎁 Offers & Discounts', ads_2col: '📰 2-Column Ads', ads_3col: '📰 3-Column Ads',
  };

  return (
    <div className="min-h-screen flex bg-muted">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0 md:w-64 overflow-hidden md:overflow-visible'} transition-all duration-300 bg-sidebar text-sidebar-foreground flex flex-col fixed md:relative inset-y-0 left-0 z-40 md:z-auto`}>
        <div className="p-3 md:p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
              <span className="text-sidebar-primary-foreground font-bold text-xs md:text-sm">SM</span>
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-xs md:text-sm">Admin Panel</h1>
              <p className="text-xs opacity-60">SoftMarket</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-2 md:p-3 space-y-0.5 md:space-y-1 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => { setTab(item.key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                tab === item.key
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-2 md:p-3 border-t border-sidebar-border space-y-0.5 md:space-y-1">
          <Link to="/" className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent">
            <Home className="w-5 h-5 flex-shrink-0" /> <span className="truncate">View Site</span>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-sm text-red-400 hover:bg-red-500/10">
            <LogOut className="w-5 h-5 flex-shrink-0" /> <span className="truncate">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={`flex-1 transition-all duration-300 w-full ${sidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <header className="bg-card border-b border-border sticky top-0 z-30 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-secondary md:hidden">
            <Layers className="w-5 h-5" />
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:flex p-2 rounded-lg hover:bg-secondary">
            <Layers className="w-5 h-5" />
          </button>
          <span className="text-xs md:text-sm text-muted-foreground truncate">{user?.email}</span>
        </header>

        <div className="p-4 md:p-6">
          {/* DASHBOARD */}
          {tab === 'dashboard' && (
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-1">Welcome to Admin Panel</h2>
              <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8">Manage all website content from here.</p>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-8">
                {[
                  { label: 'Feature Cards', count: cards.length, icon: <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-primary" /> },
                  { label: 'Categories', count: categories.length, icon: <Tag className="w-5 h-5 md:w-6 md:h-6 text-primary" /> },
                  { label: 'Offers', count: offers.length, icon: <Star className="w-5 h-5 md:w-6 md:h-6 text-primary" /> },
                  { label: 'Advertisements', count: ads2.length + ads3.length, icon: <Image className="w-5 h-5 md:w-6 md:h-6 text-primary" /> },
                ].map((stat) => (
                  <div key={stat.label} className="bg-card rounded-lg md:rounded-xl border border-border p-3 md:p-5">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                      <span className="text-xs md:text-sm text-muted-foreground">{stat.label}</span>
                      {stat.icon}
                    </div>
                    <p className="text-2xl md:text-3xl font-bold">{stat.count}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {[
                  { title: 'Edit Hero Section', desc: 'Update heading and animated words', action: () => setTab('hero'), icon: <Type className="w-6 h-6 md:w-8 md:h-8 text-primary" /> },
                  { title: 'Page Layout', desc: 'Drag & drop sections order', action: () => setTab('sections'), icon: <Layers className="w-6 h-6 md:w-8 md:h-8 text-primary" /> },
                  { title: 'Categories', desc: 'Manage category groups', action: () => setTab('categories'), icon: <Tag className="w-6 h-6 md:w-8 md:h-8 text-primary" /> },
                  { title: 'Offers', desc: 'Manage offers & discounts', action: () => setTab('offers'), icon: <Star className="w-6 h-6 md:w-8 md:h-8 text-primary" /> },
                ].map((item) => (
                  <button key={item.title} onClick={item.action} className="bg-card rounded-lg md:rounded-xl border border-border p-3 md:p-5 text-left hover:shadow-md transition-shadow">
                    <div className="mb-2 md:mb-3">{item.icon}</div>
                    <h3 className="font-semibold text-sm md:text-base mb-1">{item.title}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* HERO */}
          {tab === 'hero' && (
            <div className="max-w-lg space-y-4">
              <h2 className="text-xl font-bold mb-4">Edit Hero Section</h2>
              <div>
                <label className="block text-sm font-medium mb-1.5">Main Text</label>
                <input value={heroText} onChange={(e) => setHeroText(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Animated Words (comma-separated)</label>
                <input value={heroWords} onChange={(e) => setHeroWords(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
              </div>
              <button onClick={saveHero} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Hero
              </button>
            </div>
          )}

          {/* SECTIONS */}
          {tab === 'sections' && (
            <div className="max-w-lg">
              <h2 className="text-xl font-bold mb-4">Drag to reorder homepage sections</h2>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
                <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  {sections.map((s) => (
                    <SortableItem key={s.id} id={s.id}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{sectionLabels[s.section_type] || s.section_type}</span>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={s.is_visible} onChange={async (e) => {
                            const vis = e.target.checked;
                            await supabase.from('page_sections').update({ is_visible: vis }).eq('id', s.id);
                            setSections(prev => prev.map(x => x.id === s.id ? { ...x, is_visible: vis } : x));
                          }} className="rounded" />
                          Visible
                        </label>
                      </div>
                    </SortableItem>
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* CARDS */}
          {tab === 'cards' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Featured Cards</h2>
                <button onClick={() => setEditCard({ title: '', description: '', logo_url: null })} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Add Card
                </button>
              </div>
              <div className="grid gap-3">
                {cards.map((card) => (
                  <div key={card.id} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
                    {card.logo_url && <img src={card.logo_url} alt="" className="w-12 h-12 rounded-lg object-contain bg-muted p-1" />}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{card.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">{card.description}</p>
                    </div>
                    <button onClick={() => setEditCard(card)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteCard(card.id)} className="p-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              {editCard && (
                <Modal title={editCard.id ? 'Edit Card' : 'Add Card'} onClose={() => setEditCard(null)}>
                  <div className="space-y-4">
                    <ImageUpload label="Logo" value={editCard.logo_url || null} onChange={(url) => setEditCard({ ...editCard, logo_url: url })} folder="cards" />
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Title</label>
                      <input value={editCard.title || ''} onChange={(e) => setEditCard({ ...editCard, title: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Description</label>
                      <textarea value={editCard.description || ''} onChange={(e) => setEditCard({ ...editCard, description: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" rows={3} />
                    </div>
                    <button onClick={saveCard} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold">Save</button>
                  </div>
                </Modal>
              )}
            </div>
          )}

          {/* CATEGORIES */}
          {tab === 'categories' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Categories</h2>
                <button onClick={() => { setEditCategory({ name: '', bg_color: '#FFF9C4', icon_url: null }); setEditSubs([]); setEditDownloads([]); }} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Add Category
                </button>
              </div>
              <div className="grid gap-3">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.bg_color }}>
                      {cat.icon_url && <img src={cat.icon_url} alt="" className="w-6 h-6 object-contain" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {subcategories.filter(s => s.category_id === cat.id).length} subcategories, {categoryDownloads.filter((download) => download.category_id === cat.id).length} downloads
                      </p>
                    </div>
                    <button onClick={() => { setEditCategory(cat); setEditSubs(subcategories.filter(s => s.category_id === cat.id)); setEditDownloads(categoryDownloads.filter((download) => download.category_id === cat.id)); }} className="p-2 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteCategory(cat.id)} className="p-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              {editCategory && (
                <Modal title={editCategory.id ? 'Edit Category' : 'Add Category'} onClose={() => { setEditCategory(null); setEditSubs([]); setEditDownloads([]); }}>
                  <div className="space-y-4">
                    <ImageUpload label="Icon" value={editCategory.icon_url || null} onChange={(url) => setEditCategory({ ...editCategory, icon_url: url })} folder="categories" />
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Name</label>
                      <input value={editCategory.name || ''} onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Background Color</label>
                      <div className="flex items-center gap-3">
                        <input type="color" value={editCategory.bg_color || '#FFF9C4'} onChange={(e) => setEditCategory({ ...editCategory, bg_color: e.target.value })} className="w-12 h-10 rounded border border-input cursor-pointer" />
                        <input value={editCategory.bg_color || ''} onChange={(e) => setEditCategory({ ...editCategory, bg_color: e.target.value })} className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Subcategories</label>
                        <button onClick={() => setEditSubs([...editSubs, { id: crypto.randomUUID(), category_id: editCategory.id || '', name: '', link: null, sort_order: editSubs.length }])} className="text-sm text-primary font-semibold">+ Add</button>
                      </div>
                      {editSubs.map((sub, i) => (
                        <div key={sub.id} className="flex gap-2 mb-2">
                          <input placeholder="Name" value={sub.name} onChange={(e) => { const ns = [...editSubs]; ns[i] = { ...ns[i], name: e.target.value }; setEditSubs(ns); }} className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" />
                          <input placeholder="Link (optional)" value={sub.link || ''} onChange={(e) => { const ns = [...editSubs]; ns[i] = { ...ns[i], link: e.target.value || null }; setEditSubs(ns); }} className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" />
                          <button onClick={() => setEditSubs(editSubs.filter((_, j) => j !== i))} className="text-destructive p-1"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Overview Downloads</label>
                        <button
                          type="button"
                          onClick={() => {
                            if (editDownloads.length >= 5) return;
                            setEditDownloads([
                              ...editDownloads,
                              { id: crypto.randomUUID(), category_id: editCategory.id || '', file_name: '', file_url: '', file_type: 'file' },
                            ]);
                          }}
                          disabled={editDownloads.length >= 5}
                          className="text-sm text-primary font-semibold disabled:text-muted-foreground"
                        >
                          + Add
                        </button>
                      </div>
                      <p className="mb-3 text-xs text-muted-foreground">Max 5 PDF or DOCX files. Ye category overview me button ke roop me dikhenge.</p>
                      <div className="space-y-3">
                        {editDownloads.map((download, i) => (
                          <div key={download.id || i} className="rounded-xl border border-border p-3">
                            <div className="mb-3 flex items-center justify-between">
                              <span className="text-sm font-medium">Download {i + 1}</span>
                              <button type="button" onClick={() => setEditDownloads(editDownloads.filter((_, index) => index !== i))} className="p-1 text-destructive">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <FileUpload
                              label="Document"
                              value={download.file_url || null}
                              fileName={download.file_name}
                              folder="downloads"
                              onChange={(file) => {
                                const nextDownloads = [...editDownloads];
                                nextDownloads[i] = {
                                  ...nextDownloads[i],
                                  file_name: file.name,
                                  file_url: file.url,
                                  file_type: file.type,
                                };
                                setEditDownloads(nextDownloads);
                              }}
                              onRemove={() => {
                                const nextDownloads = [...editDownloads];
                                nextDownloads[i] = {
                                  ...nextDownloads[i],
                                  file_name: '',
                                  file_url: '',
                                  file_type: 'file',
                                };
                                setEditDownloads(nextDownloads);
                              }}
                            />
                            <input
                              placeholder="Button label"
                              value={download.file_name || ''}
                              onChange={(e) => {
                                const nextDownloads = [...editDownloads];
                                nextDownloads[i] = { ...nextDownloads[i], file_name: e.target.value };
                                setEditDownloads(nextDownloads);
                              }}
                              className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={saveCategory} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold">Save</button>
                  </div>
                </Modal>
              )}
            </div>
          )}

          {/* OFFERS */}
          {tab === 'offers' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Offers & Discounts</h2>
                <button onClick={() => setEditOffer({ heading: '', description: '', image_url: null, link: null })} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Add Offer
                </button>
              </div>
              <div className="grid gap-3">
                {offers.map((offer) => (
                  <div key={offer.id} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
                    {offer.image_url && <img src={offer.image_url} alt="" className="w-20 h-14 rounded-lg object-cover" />}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{offer.heading}</h3>
                      {offer.description && <p className="text-xs text-muted-foreground truncate">{offer.description}</p>}
                    </div>
                    <button onClick={() => setEditOffer(offer)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteOffer(offer.id)} className="p-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              {editOffer && (
                <Modal title={editOffer.id ? 'Edit Offer' : 'Add Offer'} onClose={() => setEditOffer(null)}>
                  <div className="space-y-4">
                    <ImageCropper label="Offer Image" value={editOffer.image_url || null} onChange={(url) => setEditOffer({ ...editOffer, image_url: url })} folder="offers" previewAspectRatio={16/9} previewLabel="Homepage Preview" />
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Heading</label>
                      <input value={editOffer.heading || ''} onChange={(e) => setEditOffer({ ...editOffer, heading: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Description</label>
                      <textarea value={editOffer.description || ''} onChange={(e) => setEditOffer({ ...editOffer, description: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" rows={3} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link (optional)</label>
                      <input value={editOffer.link || ''} onChange={(e) => setEditOffer({ ...editOffer, link: e.target.value || null })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <button onClick={saveOffer} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold">Save</button>
                  </div>
                </Modal>
              )}
            </div>
          )}

          {/* ADS 2COL */}
          {tab === 'ads2' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Advertisements</h2>
                <div className="flex gap-2">
                  <button onClick={() => setEditAd2({ image_url: null, link: null })} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> 2-Col Ad
                  </button>
                  <button onClick={() => setEditAd3({ image_url: null, link: null })} className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> 3-Col Ad
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-sm mb-3 text-muted-foreground">2-Column Ads</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {ads2.map((ad) => (
                  <div key={ad.id} className="relative rounded-xl overflow-hidden border border-border aspect-[2/1] bg-muted group">
                    {ad.image_url && <img src={ad.image_url} alt="" className="w-full h-full object-cover" />}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditAd2(ad)} className="w-8 h-8 rounded-full bg-card shadow flex items-center justify-center"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteAd2(ad.id)} className="w-8 h-8 rounded-full bg-destructive text-destructive-foreground shadow flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
              <h3 className="font-semibold text-sm mb-3 text-muted-foreground">3-Column Ads</h3>
              <div className="grid grid-cols-3 gap-3">
                {ads3.map((ad) => (
                  <div key={ad.id} className="relative rounded-xl overflow-hidden border border-border aspect-[16/9] bg-muted group">
                    {ad.image_url && <img src={ad.image_url} alt="" className="w-full h-full object-cover" />}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditAd3(ad)} className="w-8 h-8 rounded-full bg-card shadow flex items-center justify-center"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteAd3(ad.id)} className="w-8 h-8 rounded-full bg-destructive text-destructive-foreground shadow flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
              {editAd2 && (
                <Modal title={editAd2.id ? 'Edit 2-Col Ad' : 'Add 2-Col Ad'} onClose={() => setEditAd2(null)}>
                  <div className="space-y-4">
                    <ImageCropper label="Ad Image" value={editAd2.image_url || null} onChange={(url) => setEditAd2({ ...editAd2, image_url: url })} folder="ads" previewAspectRatio={2/1} previewLabel="Desktop Preview (2:1)" />
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link (optional)</label>
                      <input value={editAd2.link || ''} onChange={(e) => setEditAd2({ ...editAd2, link: e.target.value || null })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <button onClick={saveAd2} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold">Save</button>
                  </div>
                </Modal>
              )}
              {editAd3 && (
                <Modal title={editAd3.id ? 'Edit 3-Col Ad' : 'Add 3-Col Ad'} onClose={() => setEditAd3(null)}>
                  <div className="space-y-4">
                    <ImageCropper label="Ad Image" value={editAd3.image_url || null} onChange={(url) => setEditAd3({ ...editAd3, image_url: url })} folder="ads" previewAspectRatio={16/9} previewLabel="Desktop Preview (16:9)" />
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link (optional)</label>
                      <input value={editAd3.link || ''} onChange={(e) => setEditAd3({ ...editAd3, link: e.target.value || null })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <button onClick={saveAd3} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold">Save</button>
                  </div>
                </Modal>
              )}
            </div>
          )}


        </div>
      </main>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-3 md:p-4" onClick={onClose}>
      <div className="bg-card rounded-xl md:rounded-2xl shadow-2xl w-full max-w-sm md:max-w-lg max-h-[90vh] md:max-h-[85vh] overflow-y-auto p-4 md:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-bold truncate pr-2">{title}</h3>
          <button onClick={onClose} className="p-1 flex-shrink-0 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
