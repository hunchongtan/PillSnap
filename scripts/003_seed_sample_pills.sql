-- Insert sample pill data for testing
INSERT INTO public.pills (
  name, brand_name, manufacturer, imprint, shape, color, size_mm, scoring
) VALUES 
  ('Acetaminophen 325mg', 'Tylenol', 'Johnson & Johnson', 'TYLENOL 325', 'Round', 'White', 11.0, 'none'),
  ('Ibuprofen 200mg', 'Advil', 'Pfizer', 'ADVIL', 'Oval', 'Brown', 12.5, '1 score'),
  ('Aspirin 81mg', 'Bayer', 'Bayer', 'BAYER 81', 'Round', 'White', 6.4, 'none'),
  ('Lisinopril 10mg', 'Prinivil', 'Lupin Pharmaceuticals', '10 LUPIN', 'Round', 'Pink', 8.0, 'none'),
  ('Metformin 500mg', 'Glucophage', 'Bristol Myers Squibb', '500', 'Oval', 'White', 15.2, '2 scores'),
  ('Atorvastatin 20mg', 'Lipitor', 'Pfizer', 'PD 156 20', 'Oval', 'White', 12.9, 'none'),
  ('Omeprazole 20mg', 'Prilosec', 'AstraZeneca', 'PRILOSEC 20', 'Capsule', 'Purple/Pink', 19.4, 'none'),
  ('Hydrochlorothiazide 25mg', 'Microzide', 'Mylan', 'M H25', 'Round', 'Orange', 7.1, 'none'),
  ('Amlodipine 5mg', 'Norvasc', 'Pfizer', 'NORVASC 5', 'Round', 'White', 6.9, 'none'),
  ('Sertraline 50mg', 'Zoloft', 'Pfizer', 'ZOLOFT 50', 'Oval', 'Blue', 11.2, '1 score');
