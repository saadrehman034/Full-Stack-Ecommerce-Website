-- ─── STEP 1: CLEAR EXISTING PRODUCTS ────────────────────────────────────────
DELETE FROM public.products;

-- ─── STEP 2: ADD NEW CATEGORIES (keep existing ones, add missing) ─────────────
INSERT INTO public.categories (name, slug, description, sort_order, is_active) VALUES
  ('Spreads & Condiments', 'spreads-condiments', 'Premium peanut butters, honey, and spreads.', 7, true),
  ('Candy & Treats',       'candy-treats',       'Chocolates, mints, cookies and sweet snacks.', 8, true),
  ('Household',            'household',           'Household essentials and cleaning products.', 9, true),
  ('Pet Supplies',         'pet-supplies',        'Quality treats and nutrition for your pets.', 10, true),
  ('Electronics',          'electronics',         'Phone accessories and tech products.', 11, true)
ON CONFLICT (slug) DO NOTHING;

-- ─── STEP 3: INSERT ALL 25 PRODUCTS ─────────────────────────────────────────
WITH cats AS (
  SELECT id, slug FROM public.categories
)
INSERT INTO public.products
  (name, slug, description, price, sku, category_id, stock_quantity, low_stock_threshold, is_featured, images, is_active, unit)
VALUES

-- POOL SALT ──────────────────────────────────────────────────────────────────
(
  'Professional''s Choice Pool Salt – 40 lb Bag, 2 Pack',
  'pool-salt-professionals-2pack',
  'All-Natural, Fast-Dissolving Formula for Saltwater Pools. 40 lb Bag, 2 Pack.',
  39.99, 'HS-PS-001',
  (SELECT id FROM cats WHERE slug = 'household'),
  50, 10, false,
  ARRAY['https://m.media-amazon.com/images/P/B0H5FZ46WW.01._SX522_.jpg'],
  true, 'pack'
),
(
  'Pool Salt 40 lb Bag – High Purity All-Natural Salt',
  'pool-salt-1pack',
  'High Purity All-Natural Salt for Saltwater Chlorine Systems, Fast Dissolving Swimming Pool Maintenance Salt.',
  22.99, 'HS-PS-002',
  (SELECT id FROM cats WHERE slug = 'household'),
  75, 15, false,
  ARRAY['https://m.media-amazon.com/images/P/B0H5FMGYG3.01._SX522_.jpg'],
  true, 'pack'
),

-- CANDY ──────────────────────────────────────────────────────────────────────
(
  'Peanut Milk Chocolate Candy Bulk Container 62 oz – 2 Pack',
  'peanut-milk-choc-candy-2pack',
  'Peanut milk chocolate candy in a 62 oz bulk container. Pack of 2.',
  34.99, 'CN-PMC-001',
  (SELECT id FROM cats WHERE slug = 'candy-treats'),
  60, 10, true,
  ARRAY['https://m.media-amazon.com/images/P/B0H56VR6HD.01._SX522_.jpg'],
  true, 'pack'
),
(
  'Peanut Milk Chocolate Candy Bulk Container 62 oz – 1 Pack',
  'peanut-milk-choc-candy-1pack',
  'Peanut milk chocolate candy in a 62 oz bulk container. Single pack.',
  18.99, 'CN-PMC-002',
  (SELECT id FROM cats WHERE slug = 'candy-treats'),
  80, 15, true,
  ARRAY['https://m.media-amazon.com/images/P/B0H56M9L48.01._SX522_.jpg'],
  true, 'pack'
),

-- BEVERAGES ──────────────────────────────────────────────────────────────────
(
  'Mocha Cappuccino Mix – Instant, Gluten Free, 4 lb Can',
  'mocha-cappuccino-mix-4lb',
  'Instant Cappuccino Mix, Gluten Free, No Cholesterol & Trans Fat, 99% Caffeine Free. 4 lb can (64 oz).',
  28.99, 'BV-CAP-001',
  (SELECT id FROM cats WHERE slug = 'beverages'),
  100, 20, true,
  ARRAY['https://m.media-amazon.com/images/P/B0H44CWJ7C.01._SX522_.jpg'],
  true, 'can'
),

-- SPREADS ────────────────────────────────────────────────────────────────────
(
  'Extra Crunchy Peanut Butter 48 oz – Pack of 2',
  'extra-crunchy-peanut-butter-2pack',
  'Extra crunchy peanut butter in 48 oz jars. Pack of 2.',
  19.99, 'SP-PB-001',
  (SELECT id FROM cats WHERE slug = 'spreads-condiments'),
  90, 20, true,
  ARRAY['https://m.media-amazon.com/images/P/B0H446YF7P.01._SX522_.jpg'],
  true, 'pack'
),

-- BAKING ─────────────────────────────────────────────────────────────────────
(
  'Turbinado Raw Cane Sugar Packets – 500 + 500 Count',
  'turbinado-sugar-packets-1000ct',
  'Natural Cane Sugar Sweetener, Single Serve Bulk for Coffee, Tea, Office, Restaurant & Breakroom. 1000 packets total.',
  24.99, 'BK-SUG-001',
  (SELECT id FROM cats WHERE slug = 'baking-essentials'),
  70, 10, false,
  ARRAY['https://m.media-amazon.com/images/P/B0H44JKDNW.01._SX522_.jpg'],
  true, 'box'
),
(
  'Creamy Peanut Butter Spread 96 oz Total – 2 x 48 oz Jars',
  'creamy-peanut-butter-96oz',
  'Value Pack for Family Pantry and Bulk Use. 2 x 48 oz jars.',
  22.99, 'SP-PB-002',
  (SELECT id FROM cats WHERE slug = 'spreads-condiments'),
  85, 15, false,
  ARRAY['https://m.media-amazon.com/images/P/B0H2TBQQ65.01._SX522_.jpg'],
  true, 'pack'
),
(
  'Pure Wildflower Honey 48 oz – Pack of 2',
  'wildflower-honey-48oz-2pack',
  '100% Natural Premium Honey, Unfiltered Sweetener for Tea, Baking & Cooking. Bulk Value Pack.',
  32.99, 'BK-HON-001',
  (SELECT id FROM cats WHERE slug = 'baking-essentials'),
  60, 10, true,
  ARRAY['https://m.media-amazon.com/images/P/B0H1F7VBC9.01._SX522_.jpg'],
  true, 'pack'
),

-- HOUSEHOLD ──────────────────────────────────────────────────────────────────
(
  'Max Toothpaste 5 Pack – 36.5 oz Fresh Cool Mint with Squeezer Key',
  'max-toothpaste-5pack',
  'Whitening & Fluoride Tubes with Bonus Squeezer Key. 36.5 oz total, 5 pack.',
  29.99, 'HS-TP-001',
  (SELECT id FROM cats WHERE slug = 'household'),
  40, 10, false,
  ARRAY['https://m.media-amazon.com/images/P/B0GZ9328XD.01._SX522_.jpg'],
  true, 'pack'
),

-- SNACKS ─────────────────────────────────────────────────────────────────────
(
  'Noniis Cranberry Almond Crisps 15 pk – 11.1 oz with Storage Bag',
  'cranberry-almond-crisps-15pk',
  'Light and crunchy cranberry almond crisps. 15 packs with storage bag included.',
  18.99, 'SN-CAC-001',
  (SELECT id FROM cats WHERE slug = 'snacks-nuts'),
  70, 15, true,
  ARRAY['https://m.media-amazon.com/images/P/B0GYB2ML3S.01._SX522_.jpg'],
  true, 'pack'
),
(
  'Strawberry & Tropical Fruit Snacks Variety Pack 0.8 oz – 42 Count',
  'fruit-snacks-variety-42ct',
  'Strawberry & tropical fruit snacks variety pack. 42 individually wrapped pouches.',
  24.99, 'SN-FRS-001',
  (SELECT id FROM cats WHERE slug = 'snacks-nuts'),
  90, 20, false,
  ARRAY['https://m.media-amazon.com/images/P/B0GY3QC88W.01._SX522_.jpg'],
  true, 'pack'
),
(
  'Individually Wrapped Mint Candy – Cool Wintergreen 3.5 lb Bulk',
  'wintergreen-mint-candy-bulk',
  'Bulk hard mints, cool wintergreen flavor. Individually wrapped, 3.5 lb bag.',
  15.99, 'CN-MNT-001',
  (SELECT id FROM cats WHERE slug = 'candy-treats'),
  80, 15, false,
  ARRAY['https://m.media-amazon.com/images/P/B0GXKLDGJB.01._SX522_.jpg'],
  true, 'bag'
),

-- HOUSEHOLD / OFFICE ─────────────────────────────────────────────────────────
(
  'Boise X-9 Multi-Use Copy Paper Letter 8.5"×11" 20 Lb',
  'boise-paper-letter-size',
  'FSC® Certified, 92 Brightness, 20 Lb, White. Letter size (8.5" x 11").',
  49.99, 'OF-PAP-001',
  (SELECT id FROM cats WHERE slug = 'household'),
  50, 10, false,
  ARRAY['https://m.media-amazon.com/images/P/B003BWJ1PY.01._SX522_.jpg'],
  true, 'ream'
),

-- BAKING ─────────────────────────────────────────────────────────────────────
(
  'Semi Sweet Chocolate Baking Chips 72 oz – 1 Pack',
  'semi-sweet-choc-baking-chips-72oz',
  'Premium semi sweet chocolate baking chips. 72 oz value size.',
  19.99, 'BK-CHC-001',
  (SELECT id FROM cats WHERE slug = 'baking-essentials'),
  70, 15, true,
  ARRAY['https://m.media-amazon.com/images/P/B0GW492PPZ.01._SX522_.jpg'],
  true, 'pack'
),

-- CANDY ──────────────────────────────────────────────────────────────────────
(
  'Sweet Stripes Soft Peppermint Candy Puffs Individually Wrapped – 350 Count',
  'peppermint-candy-puffs-350ct',
  'Soft peppermint candy puffs, individually wrapped. 350 count box.',
  18.99, 'CN-PPM-001',
  (SELECT id FROM cats WHERE slug = 'candy-treats'),
  75, 15, false,
  ARRAY['https://m.media-amazon.com/images/P/B0GW4761WW.01._SX522_.jpg'],
  true, 'box'
),
(
  'Chocolate Chip Cookies Bite-Size 2 oz Individual Bags – 42 Count',
  'choc-chip-cookies-bite-size-42ct',
  'Bite-size chocolate chip cookies in individual 2 oz bags. 42 count bulk pack.',
  29.99, 'CN-CKI-001',
  (SELECT id FROM cats WHERE slug = 'candy-treats'),
  60, 10, true,
  ARRAY['https://m.media-amazon.com/images/P/B0GW47T1RQ.01._SX522_.jpg'],
  true, 'pack'
),

-- ELECTRONICS ────────────────────────────────────────────────────────────────
(
  'iPhone 17 Pro Max Clear Magnetic Case with Screen Protector – MagSafe',
  'iphone-17-pro-max-clear-case',
  'Clear Magnetic Phone Cases with Screen Protector Compatible with MagSafe for iPhone 17 Pro Max.',
  24.99, 'EL-IPH-001',
  (SELECT id FROM cats WHERE slug = 'electronics'),
  100, 20, false,
  ARRAY['https://m.media-amazon.com/images/P/B0GW1XV4T2.01._SX522_.jpg'],
  true, 'unit'
),

-- BEVERAGES ──────────────────────────────────────────────────────────────────
(
  'Land O Lakes Coffee Creamer Mini Moo''s Singles – 192 Count',
  'land-o-lakes-creamer-192ct',
  'Individual coffee creamer singles. 192 count box.',
  21.99, 'BV-CRM-001',
  (SELECT id FROM cats WHERE slug = 'beverages'),
  80, 15, true,
  ARRAY['https://m.media-amazon.com/images/P/B0GV93NNB5.01._SX522_.jpg'],
  true, 'box'
),

-- PET SUPPLIES ───────────────────────────────────────────────────────────────
(
  'American Vet-Dogs K-9 Corps Skin & Coat Chicken Dog Treats – 6 Pack',
  'vet-dogs-chicken-treats-6pack',
  'Veteran''s K-9 Corps Skin & Coat Formula, Soft & Moist Dog Treats, Chicken, 10 Oz. Pack of 6.',
  49.99, 'PT-DT-001',
  (SELECT id FROM cats WHERE slug = 'pet-supplies'),
  40, 8, false,
  ARRAY['https://m.media-amazon.com/images/P/B0GS7QZL6Q.01._SX522_.jpg'],
  true, 'pack'
),
(
  'Bil-Jac Vet-Dogs K-9 Corps Skin & Coat Chicken Dog Treats – 2 Pack',
  'vet-dogs-chicken-treats-2pack',
  'Veteran''s K-9 Corps Skin & Coat Formula, Soft & Moist Dog Treats, Chicken, 10 Oz. Pack of 2.',
  19.99, 'PT-DT-002',
  (SELECT id FROM cats WHERE slug = 'pet-supplies'),
  60, 10, false,
  ARRAY['https://m.media-amazon.com/images/P/B0GS7R25T3.01._SX522_.jpg'],
  true, 'pack'
),
(
  'American Vet-Dogs K-9 Corps Skin & Coat Chicken Dog Treats – 3 Pack',
  'vet-dogs-chicken-treats-3pack',
  'Veteran''s K-9 Corps Skin & Coat Formula, Soft & Moist Dog Treats, Chicken, 10 Oz. Pack of 3.',
  29.99, 'PT-DT-003',
  (SELECT id FROM cats WHERE slug = 'pet-supplies'),
  50, 10, false,
  ARRAY['https://m.media-amazon.com/images/P/B0GS7BTR5H.01._SX522_.jpg'],
  true, 'pack'
),

-- SNACKS ─────────────────────────────────────────────────────────────────────
(
  'KS Trail Mix Snack Packs 2 oz – 28 Count',
  'ks-trail-mix-snack-packs-28ct',
  'Individual trail mix snack packs. 2 oz each, 28 count bulk box.',
  24.99, 'SN-TRM-001',
  (SELECT id FROM cats WHERE slug = 'snacks-nuts'),
  80, 15, true,
  ARRAY['https://m.media-amazon.com/images/P/B0GRPQ48PJ.01._SX522_.jpg'],
  true, 'pack'
),

-- HOUSEHOLD / OFFICE ─────────────────────────────────────────────────────────
(
  'Boise X-9 Multi-Use Printer Paper Legal 8.5"×14" – 10 Reams, 5000 Sheets',
  'boise-paper-legal-10reams',
  '5000 Sheets Per Case, 20 Lb, White. Legal size (8.5" x 14"). 10 reams.',
  89.99, 'OF-PAP-002',
  (SELECT id FROM cats WHERE slug = 'household'),
  30, 5, false,
  ARRAY['https://m.media-amazon.com/images/P/B00L4EJIJA.01._SX522_.jpg'],
  true, 'case'
),

-- BEVERAGES ──────────────────────────────────────────────────────────────────
(
  'Milk Chocolate Hot Cocoa Mix Packets – Pack of 3',
  'hot-cocoa-mix-packets-3pack',
  'Rich milk chocolate hot cocoa mix packets. Pack of 3 boxes.',
  24.99, 'BV-COC-001',
  (SELECT id FROM cats WHERE slug = 'beverages'),
  90, 20, true,
  ARRAY['https://m.media-amazon.com/images/P/B0GP2QPWYS.01._SX522_.jpg'],
  true, 'pack'
);
