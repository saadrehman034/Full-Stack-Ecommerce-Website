-- Create admin user instruction note: 
-- You must sign up via the frontend Auth UI first, then update your user role manually in SQL:
-- UPDATE auth.users SET raw_user_meta_data = '{"role": "admin"}' WHERE email = 'your@email.com';
-- UPDATE public.users SET role = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');

-- Seed Categories
INSERT INTO public.categories (name, slug, description, display_order) VALUES
  ('Spices & Herbs', 'spices-herbs', 'Premium spices and fresh herbs sourced globally.', 1),
  ('Grains & Pulses', 'grains-pulses', 'Organic grains, lentils, and ancient seeds.', 2),
  ('Oils & Vinegars', 'oils-vinegars', 'Cold-pressed oils and aged vinegars.', 3),
  ('Snacks & Nuts', 'snacks-nuts', 'Healthy nuts, dried fruits, and artisanal snacks.', 4),
  ('Beverages', 'beverages', 'Craft coffees, teas, and natural beverages.', 5),
  ('Baking Essentials', 'baking-essentials', 'High-quality flours, sugars, and extracts.', 6);

-- Define products via CTEs to get category UUIDs
WITH cats AS (
  SELECT id, slug FROM public.categories
)
INSERT INTO public.products (name, slug, description, price, sku, barcode, category_id, stock_quantity, low_stock_threshold, is_featured, weight_grams, unit) VALUES
  ('Himalayan Pink Salt', 'himalayan-pink-salt', 'Coarse premium pink salt from the Himalayas.', 8.50, 'SP-HPS-001', '8901234567890', (SELECT id FROM cats WHERE slug = 'spices-herbs'), 150, 20, true, 250, 'g'),
  ('Organic Tellicherry Black Pepper', 'organic-black-pepper', 'Bold, complex black pepper from Kerala.', 12.00, 'SP-BP-002', '8901234567891', (SELECT id FROM cats WHERE slug = 'spices-herbs'), 80, 15, true, 100, 'g'),
  ('Smoked Spanish Paprika', 'smoked-paprika', 'Rich, woody paprika imported from Spain.', 7.00, 'SP-PAP-003', '8901234567892', (SELECT id FROM cats WHERE slug = 'spices-herbs'), 200, 30, false, 50, 'g'),
  ('Saffron Threads', 'saffron-threads', 'Premium Afghan saffron, pure red threads.', 45.00, 'SP-SAF-004', '8901234567893', (SELECT id FROM cats WHERE slug = 'spices-herbs'), 40, 10, true, 2, 'g'),
  ('Ground Ceylon Cinnamon', 'ceylon-cinnamon', 'True cinnamon with a delicate, sweet flavor.', 9.50, 'SP-CIN-005', '8901234567894', (SELECT id FROM cats WHERE slug = 'spices-herbs'), 120, 20, false, 150, 'g'),
  
  ('Organic Quinoa', 'organic-quinoa', 'High-protein white and red quinoa blend.', 6.50, 'GR-QUI-001', '8901234567895', (SELECT id FROM cats WHERE slug = 'grains-pulses'), 300, 50, true, 500, 'g'),
  ('French Green Lentils', 'french-green-lentils', 'Puy-style lentils that hold their shape.', 5.00, 'GR-LEN-002', '8901234567896', (SELECT id FROM cats WHERE slug = 'grains-pulses'), 400, 50, false, 500, 'g'),
  ('Carnaroli Risotto Rice', 'carnaroli-rice', 'The king of Italian risotto rice.', 8.00, 'GR-RIC-003', '8901234567897', (SELECT id FROM cats WHERE slug = 'grains-pulses'), 150, 25, false, 1, 'kg'),
  ('Organic Chia Seeds', 'organic-chia-seeds', 'Nutrient-dense raw black chia seeds.', 7.50, 'GR-CHI-004', '8901234567898', (SELECT id FROM cats WHERE slug = 'grains-pulses'), 200, 30, false, 250, 'g'),
  ('Rolled Oats', 'rolled-oats', 'Thick-cut organic rolled oats.', 4.00, 'GR-OAT-005', '8901234567899', (SELECT id FROM cats WHERE slug = 'grains-pulses'), 500, 100, false, 1, 'kg'),

  ('Extra Virgin Olive Oil', 'evoo-premium', 'First cold-pressed Tuscan olive oil.', 24.00, 'OL-EVOO-001', '8901234567900', (SELECT id FROM cats WHERE slug = 'oils-vinegars'), 100, 15, true, 500, 'ml'),
  ('Balsamic Vinegar of Modena', 'balsamic-modena', 'Aged 12 years in wooden casks.', 32.00, 'OL-BAL-002', '8901234567901', (SELECT id FROM cats WHERE slug = 'oils-vinegars'), 60, 10, true, 250, 'ml'),
  ('Toasted Sesame Oil', 'toasted-sesame-oil', 'Deeply roasted, aromatic sesame oil.', 14.00, 'OL-SES-003', '8901234567902', (SELECT id FROM cats WHERE slug = 'oils-vinegars'), 150, 20, false, 250, 'ml'),
  ('Avocado Oil', 'avocado-oil', 'High smoke point oil for cooking and roasting.', 18.00, 'OL-AVO-004', '8901234567903', (SELECT id FROM cats WHERE slug = 'oils-vinegars'), 120, 20, false, 500, 'ml'),
  ('Apple Cider Vinegar', 'apple-cider-vinegar', 'Raw, unfiltered with the mother.', 9.00, 'OL-ACV-005', '8901234567904', (SELECT id FROM cats WHERE slug = 'oils-vinegars'), 250, 40, false, 500, 'ml'),

  ('Roasted Macadamia Nuts', 'macadamia-nuts', 'Lightly salted, buttery macadamia nuts.', 16.50, 'SN-MAC-001', '8901234567905', (SELECT id FROM cats WHERE slug = 'snacks-nuts'), 90, 15, true, 200, 'g'),
  ('Medjool Dates', 'medjool-dates', 'Large, soft, caramel-like dates.', 11.00, 'SN-DAT-002', '8901234567906', (SELECT id FROM cats WHERE slug = 'snacks-nuts'), 180, 30, false, 500, 'g'),
  ('Organic Raw Almonds', 'raw-almonds', 'Unpasteurized Spanish almonds.', 14.00, 'SN-ALM-003', '8901234567907', (SELECT id FROM cats WHERE slug = 'snacks-nuts'), 300, 50, false, 500, 'g'),
  ('Dried Tart Cherries', 'tart-cherries', 'Unsweetened dried Montmorency cherries.', 12.50, 'SN-CHE-004', '8901234567908', (SELECT id FROM cats WHERE slug = 'snacks-nuts'), 120, 20, false, 250, 'g'),
  ('Pistachio Kernels', 'pistachio-kernels', 'Shelled, roasted, and lightly salted.', 15.00, 'SN-PIS-005', '8901234567909', (SELECT id FROM cats WHERE slug = 'snacks-nuts'), 100, 15, true, 200, 'g'),

  ('Single Origin Espresso Beans', 'espresso-beans', 'Dark roast arabica from Colombia.', 19.00, 'BV-ESP-001', '8901234567910', (SELECT id FROM cats WHERE slug = 'beverages'), 150, 25, true, 500, 'g'),
  ('Matcha Green Tea Powder', 'matcha-powder', 'Ceremonial grade Japanese matcha.', 28.00, 'BV-MAT-002', '8901234567911', (SELECT id FROM cats WHERE slug = 'beverages'), 80, 10, true, 30, 'g'),
  ('Earl Grey Loose Leaf', 'earl-grey-tea', 'Black tea with natural bergamot oil.', 14.00, 'BV-EAR-003', '8901234567912', (SELECT id FROM cats WHERE slug = 'beverages'), 120, 20, false, 100, 'g'),
  ('Oat Milk (Barista Edition)', 'oat-milk-barista', 'Creamy, froths perfectly.', 4.50, 'BV-OAT-004', '8901234567913', (SELECT id FROM cats WHERE slug = 'beverages'), 400, 50, false, 1, 'litre'),
  ('Sparkling Mineral Water', 'sparkling-water', 'Naturally carbonated from spring.', 2.50, 'BV-H2O-005', '8901234567914', (SELECT id FROM cats WHERE slug = 'beverages'), 600, 100, false, 750, 'ml'),

  ('Madagascar Bourbon Vanilla', 'vanilla-extract', 'Pure vanilla extract.', 22.00, 'BK-VAN-001', '8901234567915', (SELECT id FROM cats WHERE slug = 'baking-essentials'), 100, 15, true, 118, 'ml'),
  ('Almond Flour', 'almond-flour', 'Blanched, finely sifted almond flour.', 15.00, 'BK-ALM-002', '8901234567916', (SELECT id FROM cats WHERE slug = 'baking-essentials'), 150, 25, false, 500, 'g'),
  ('Dark Chocolate Callets', 'dark-chocolate-callets', '70% cocoa baking chocolate chips.', 18.00, 'BK-CHO-003', '8901234567917', (SELECT id FROM cats WHERE slug = 'baking-essentials'), 120, 20, true, 500, 'g'),
  ('Organic Cane Sugar', 'cane-sugar', 'Unrefined raw cane sugar.', 5.50, 'BK-SUG-004', '8901234567918', (SELECT id FROM cats WHERE slug = 'baking-essentials'), 300, 50, false, 1, 'kg'),
  ('Active Dry Yeast', 'dry-yeast', 'Premium baking yeast.', 3.00, 'BK-YST-005', '8901234567919', (SELECT id FROM cats WHERE slug = 'baking-essentials'), 200, 40, false, 100, 'g');

-- Coupons
INSERT INTO public.coupons (code, type, value, min_order_amount, is_active) VALUES
  ('WELCOME10', 'percentage', 10.00, 0.00, true),
  ('SAVE5', 'fixed', 5.00, 30.00, true);
