-- Deactivate old categories that have no products
UPDATE public.categories SET is_active = false
WHERE slug IN ('spices-herbs', 'grains-pulses', 'oils-vinegars');

-- Candy & Treats — chocolate candy, cookies, sweets
UPDATE public.categories SET
  image_url = 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?q=80&w=800&auto=format&fit=crop',
  sort_order = 1
WHERE slug = 'candy-treats';

-- Snacks & Nuts — trail mix, almonds, cranberry crisps
UPDATE public.categories SET
  image_url = 'https://images.unsplash.com/photo-1545987796-200677ee1011?q=80&w=800&auto=format&fit=crop',
  sort_order = 2
WHERE slug = 'snacks-nuts';

-- Beverages — cappuccino, hot cocoa, coffee creamer
UPDATE public.categories SET
  image_url = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop',
  sort_order = 3
WHERE slug = 'beverages';

-- Spreads & Condiments — peanut butter jars
UPDATE public.categories SET
  image_url = 'https://images.unsplash.com/photo-1542990253-a781e5c01565?q=80&w=800&auto=format&fit=crop',
  sort_order = 4
WHERE slug = 'spreads-condiments';

-- Baking Essentials — honey, chocolate chips, sugar
UPDATE public.categories SET
  image_url = 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?q=80&w=800&auto=format&fit=crop',
  sort_order = 5
WHERE slug = 'baking-essentials';

-- Household — cleaning, pool, toothpaste, paper
UPDATE public.categories SET
  image_url = 'https://images.unsplash.com/photo-1563453392212-326f5e854473?q=80&w=800&auto=format&fit=crop',
  sort_order = 6
WHERE slug = 'household';

-- Pet Supplies — dog treats
UPDATE public.categories SET
  image_url = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=800&auto=format&fit=crop',
  sort_order = 7
WHERE slug = 'pet-supplies';

-- Electronics — phone accessories
UPDATE public.categories SET
  image_url = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop',
  sort_order = 8
WHERE slug = 'electronics';
