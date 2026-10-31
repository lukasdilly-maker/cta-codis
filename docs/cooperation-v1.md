# CTA CODIS V2 — Coopération V1 (validation obligatoire)

**Statut : préparation technique, non activée.** Branche `develop`. Ne pas déployer le SQL sans vérifier le schéma Supabase existant et les identifiants réels des utilisateurs et des véhicules.

## Périmètre
- Chaque joueur conserve sa sauvegarde, son département, ses bâtiments et ses véhicules.
- Un demandeur choisit une intervention, un service et un type de véhicule, puis cible un autre joueur.
- Le propriétaire reçoit une demande en attente et choisit **Accepter avec véhicule** ou **Refuser**.
- Le demandeur ne peut ni accepter sa propre demande ni modifier les statuts radio du véhicule prêté.
- Un véhicule ne peut avoir qu'une seule mission extérieure active. Une mission ne doit jamais être copiée dans la sauvegarde du demandeur.
- Les deux joueurs consultent les mêmes événements persistés, diffusés par Supabase Realtime.

## Tables proposées
- `coop_requests`: demande, participants, intervention cible, type recherché, état et véhicule accepté.
- `coop_radio_events`: événements append-only, ordre par identifiant, auteur et horodatage.

États d'une demande: `pending -> accepted -> completed`, `pending -> refused`, `pending -> cancelled`.
Une demande acceptée reste active pendant le trajet, l'intervention et le retour. Ne passer à `completed` qu'une fois le moyen libéré dans la sauvegarde du propriétaire.

## Contrats applicatifs
1. **Créer** : insert `coop_requests` par l'utilisateur authentifié; `requester_id = auth.uid()`, `status = pending`.
2. **Lister** : requêtes reçues/envoyées visibles seulement par les deux participants, triées par `created_at`.
3. **Refuser** : RPC `coop_refuse_request(id)` par le propriétaire, uniquement si `pending`.
4. **Annuler** : RPC `coop_cancel_request(id)` par le demandeur, uniquement si `pending`.
5. **Accepter** : RPC atomique par le propriétaire, **désactivée par défaut** tant qu'une source serveur ne valide pas que le véhicule lui appartient, est disponible et satisfait le type demandé.
6. **Radio** : RPC dédiée à créer; valider propriétaire, mission active, transition autorisée et événement idempotent.
7. **Terminer** : RPC dédiée à créer; vérifier le retour/disponibilité canonique avant de libérer l'unicité.
8. **Realtime** : écouter les changements sur `coop_requests` et `coop_radio_events`, puis recharger les lignes depuis la base après reconnexion; ne jamais utiliser le seul événement réseau comme source de vérité.

## Sécurité / intégrité
- RLS activée; aucune modification directe autorisée sur les demandes ou les événements.
- Une contrainte unique partielle empêche deux missions extérieures `accepted` pour le même couple propriétaire/véhicule.
- **Limite** : cette contrainte ne détecte pas les engagements locaux dans `game_saves`; il faut une validation transactionnelle côté serveur et une source de disponibilité canonique.
- L'acceptation ne doit jamais être déclenchée directement par un client modifiant un JSON de sauvegarde.
- Les clients n'utilisent jamais la clé `service_role`.
- Les politiques d'accès ne constituent pas un annuaire de joueurs : prévoir invitations/partenariat et consentement à la visibilité.

## Intégration UI prévue
- Onglet **Coopération** : reçues, envoyées, missions actives.
- Depuis une intervention : bouton **Demander un renfort**, formulaire service/type/joueur/note.
- Chez le propriétaire : notification, sélection d'un moyen disponible, **Accepter** ou **Refuser**.
- Dans **Opérations** et **Synoptique** : moyens externes signalés avec le propriétaire, statuts radio identiques chez les deux participants.
- Main courante : demande, réponse, départ, arrivée, transport, retour et fin.

## Ordre de développement
1. Inspecter la configuration Supabase réellement déployée, l'authentification et le modèle `state.vehicles`/`state.incidents`.
2. Écrire les RPCs de validation de propriété/disponibilité et les tests de concurrence.
3. Tester les politiques RLS avec deux comptes différents.
4. Ajouter la console Coopération et les notifications.
5. Relier les véhicules externes aux synoptiques et aux interventions réelles.
6. Tester les reconnexions, doubles clics, deux acceptations simultanées, suppression d'une intervention et fin de mission.
7. Ajouter la synchronisation des trajets sur le réseau routier.

## Critères d'acceptation
- A demande un renfort à B; B seul peut accepter ou refuser.
- Refus visible immédiatement chez A; aucun véhicule engagé.
- Acceptation visible chez A et B, avec un seul véhicule propriétaire.
- Le même véhicule ne peut être engagé sur deux demandes, même en cas de requêtes simultanées.
- Un changement de statut radio est visible chez les deux joueurs et persiste après reconnexion.
- Une déconnexion ne libère pas automatiquement le moyen.
- Les parties et les crédits des deux joueurs restent indépendants.

Fichier SQL proposé : [cooperation-v1-schema.sql](cooperation-v1-schema.sql).
