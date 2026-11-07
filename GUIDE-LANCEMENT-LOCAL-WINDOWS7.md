# Lancement local — Windows 7

1. Décompressez entièrement le dossier du jeu sur le PC.
2. Double-cliquez sur `LANCER-CTA-CODIS-WINDOWS7.bat`.
3. Le jeu s'ouvre dans le navigateur défini par défaut.

Le jeu principal est `index.html`. Il enregistre actuellement les profils dans le stockage local du navigateur (`localStorage`). Utilisez **Finances / Profils → Exporter tous les profils** pour conserver une copie de vos parties.

## Limites hors connexion constatées dans le code actuel

- Le fond cartographique IGN est chargé depuis Internet. Sans connexion, les contours et éléments du jeu restent calculés localement, mais le fond IGN ne s'affiche pas.
- Le calcul d'itinéraire tente d'utiliser OSRM en ligne puis dispose d'un trajet de repli simplifié.
- Le panneau de coopération et les fonctions de compte/cloud ne sont pas nécessaires au jeu solo.

Ce lanceur ouvre directement le jeu principal, sans passer par le wrapper de test qui ajoute une console de connexion externe. Il ne transforme pas encore les fonds IGN en données cartographiques embarquées.
