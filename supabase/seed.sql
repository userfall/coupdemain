insert into public.categories (slug, name, description)
values
  ('entraide-pratique', 'Entraide pratique', 'Montage, déplacement, petits coups de main.'),
  ('courses-transport', 'Courses et transport', 'Trajets courts, courses, colis.'),
  ('numerique-administratif', 'Numérique et administratif', 'Démarches, formulaires, accompagnement numérique.'),
  ('education-soutien', 'Éducation et soutien scolaire', 'Aide aux devoirs, soutien, conversation.'),
  ('bien-etre-presence', 'Bien-être et présence', 'Présence, lecture, écoute, promenade.'),
  ('objets-solidaires', 'Dons et objets solidaires', 'Prêts, dons, partage de matériel.')
on conflict (slug) do nothing;
