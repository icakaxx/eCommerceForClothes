export type HomepageHeroSlug = 'jackets' | 'formal';

export const HOMEPAGE_HERO_SLUGS: HomepageHeroSlug[] = ['jackets', 'formal'];

export const DEFAULT_JACKETS_HERO_PRODUCT_IDS = ['6c708e49-6f4b-4bf8-8f04-ed53977d99f6'];

export const HOMEPAGE_HERO_PATHS: Record<HomepageHeroSlug, string> = {
  jackets: '/hero/jackets',
  formal: '/hero/formal',
};

type HeroSettings = {
  hero_jackets_productid?: string | null;
  hero_formal_productid?: string | null;
  hero_jackets_productids?: string[] | null;
  hero_formal_productids?: string[] | null;
} | null;

function normalizeIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((id) => String(id).trim()).filter(Boolean);
}

/** IDs saved in admin (no storefront defaults). */
export function getConfiguredHeroProductIds(settings: HeroSettings, slug: HomepageHeroSlug): string[] {
  const idsFromArray =
    slug === 'jackets'
      ? normalizeIdList(settings?.hero_jackets_productids)
      : normalizeIdList(settings?.hero_formal_productids);

  if (idsFromArray.length > 0) {
    return idsFromArray;
  }

  const single =
    slug === 'jackets' ? settings?.hero_jackets_productid : settings?.hero_formal_productid;
  return single ? [String(single)] : [];
}

/** Product IDs shown when a visitor opens a homepage hero card. */
export function resolveHeroProductIds(settings: HeroSettings, slug: HomepageHeroSlug): string[] {
  const configured = getConfiguredHeroProductIds(settings, slug);
  if (configured.length > 0) {
    return configured;
  }

  if (slug === 'jackets') {
    return [...DEFAULT_JACKETS_HERO_PRODUCT_IDS];
  }

  return [];
}

export function isHomepageHeroSlug(value: string): value is HomepageHeroSlug {
  return (HOMEPAGE_HERO_SLUGS as string[]).includes(value);
}

export function getHeroCollectionCopy(slug: HomepageHeroSlug, language: 'bg' | 'en') {
  const isBg = language === 'bg';
  if (slug === 'jackets') {
    return {
      title: isBg ? 'Якета' : 'Jackets',
      subtitle: isBg
        ? 'Подбрани артикули от картата на началната страница'
        : 'Selected items from the homepage card',
      empty: isBg
        ? 'Все още няма избрани якета. Можете да добавите продукти от Админ → Настройки.'
        : 'No jackets selected yet. Add products in Admin → Settings.',
    };
  }
  return {
    title: isBg ? 'Ризи, панталони и официално облекло' : 'Shirts, trousers and formal wear',
    subtitle: isBg
      ? 'Подбрани артикули от картата на началната страница'
      : 'Selected items from the homepage card',
    empty: isBg
      ? 'Все още няма избрани продукти. Добавете ги от Админ → Настройки.'
      : 'No products selected yet. Add them in Admin → Settings.',
  };
}
