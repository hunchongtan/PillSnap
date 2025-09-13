-- Insert sample pill data for testing
INSERT INTO public.pills (
  name, generic_name, brand_name, shape, color, front_imprint, back_imprint, 
  drug_class, manufacturer, size_mm
) VALUES 
  ('Acetaminophen 325mg', 'Acetaminophen', 'Tylenol', 'Round', 'White', 'TYLENOL', '325', 'Analgesic', 'Johnson & Johnson', 11.0),
  ('Ibuprofen 200mg', 'Ibuprofen', 'Advil', 'Oval', 'Brown', 'ADVIL', '', 'NSAID', 'Pfizer', 12.5),
  ('Aspirin 81mg', 'Aspirin', 'Bayer', 'Round', 'White', 'BAYER', '81', 'Antiplatelet', 'Bayer', 6.4),
  ('Lisinopril 10mg', 'Lisinopril', 'Prinivil', 'Round', 'Pink', '10', 'LUPIN', 'ACE Inhibitor', 'Lupin Pharmaceuticals', 8.0),
  ('Metformin 500mg', 'Metformin', 'Glucophage', 'Oval', 'White', '500', '', 'Antidiabetic', 'Bristol Myers Squibb', 15.2),
  ('Atorvastatin 20mg', 'Atorvastatin', 'Lipitor', 'Oval', 'White', 'PD 156', '20', 'Statin', 'Pfizer', 12.9),
  ('Omeprazole 20mg', 'Omeprazole', 'Prilosec', 'Capsule', 'Purple/Pink', 'PRILOSEC', '20', 'PPI', 'AstraZeneca', 19.4),
  ('Hydrochlorothiazide 25mg', 'Hydrochlorothiazide', 'Microzide', 'Round', 'Orange', 'M', 'H25', 'Diuretic', 'Mylan', 7.1),
  ('Amlodipine 5mg', 'Amlodipine', 'Norvasc', 'Round', 'White', 'NORVASC', '5', 'Calcium Channel Blocker', 'Pfizer', 6.9),
  ('Sertraline 50mg', 'Sertraline', 'Zoloft', 'Oval', 'Blue', 'ZOLOFT', '50', 'SSRI', 'Pfizer', 11.2);
