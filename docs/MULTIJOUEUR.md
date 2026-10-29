# CTA CODIS V2 — test multijoueur
Cette branche contient une **interface de test** dans `playtest.html`. Elle charge le jeu existant `index.html` sans le modifier, afin de préserver les sauvegardes locales.

## Configuration obligatoire
1. Dans Supabase > SQL Editor, exécuter `supabase/multiplayer_migration.sql` après le script d'initialisation déjà exécuté.
2. Dans Supabase > Authentication > URL Configuration, ajouter l'URL exacte de votre site de test aux Redirect URLs.
3. Dans GitHub > Settings > Pages, configurer le déploiement de la branche `develop` (root) pour tester, **uniquement si vous souhaitez exposer cette branche au public**. Autrement, déployer sur un hébergement de préproduction.
4. Ouvrir `https://lukasdilly-maker.github.io/cta-codis/playtest.html` si GitHub Pages publie `develop`.
5. Chaque testeur s'inscrit avec une adresse e-mail et un mot de passe. Si la confirmation e-mail est activée, confirmer l'adresse avant connexion.

## Fonctions disponibles
- Connexion / inscription Supabase Auth
- Liste de pseudonymes sans e-mails
- Demandes de renfort manuelles et acceptation/refus
- Consultation de comptes et suspension/réactivation par le Super Administrateur

## Limitations
- Les demandes ne déplacent pas encore les véhicules dans les parties.
- Le jeu reste dans une iframe avec ses sauvegardes locales, sans synchronisation cloud.
- Le pseudo d'un nouvel inscrit est généré automatiquement (player_...), sans modification autonome.
- Aucun statut de présence en ligne fiable ni demande automatique.
- Ne pas utiliser en production sans tests de sécurité, politiques RLS vérifiées, et validation des mécanismes de sauvegarde.
