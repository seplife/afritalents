# AfriTalents — Guide de mise en service

Ce document explique comment activer les fonctionnalités ajoutées : rôles
administrateur/académie/scout, enregistrement des joueurs avec photos et
vidéos, shortlists, rapports, opérations, opportunités et messagerie — toutes
connectées à Supabase.

## 1. Créer le projet Supabase

1. Allez sur [supabase.com](https://supabase.com) et créez un projet (ou utilisez celui déjà lié à votre déploiement Vercel).
2. Dans **Settings > API**, notez :
   - `Project URL`
   - `anon public key`

## 2. Configurer les variables d'environnement

À la racine du projet :

```bash
cp .env.example .env
```

Puis éditez `.env` :

```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon-publique
```

**Sur Vercel** : ajoutez ces deux variables dans *Project Settings > Environment
Variables*, puis redéployez.

## 3. Appliquer les migrations

Deux fichiers SQL se trouvent dans `supabase/migrations/` :

1. `20260811231332_create_afritalents_mvp_core.sql` (déjà présent — socle des tables)
2. `20260813120000_add_roles_admin_features_and_storage.sql` (nouveau — rôles, shortlists, opérations, messagerie, stockage)

**Option A — via le Dashboard Supabase (le plus simple) :**
Ouvrez *SQL Editor*, collez le contenu de chaque fichier dans l'ordre, et exécutez.

**Option B — via la CLI Supabase :**
```bash
npx supabase login
npx supabase link --project-ref votre-ref-de-projet
npx supabase db push
```

## 4. Créer votre premier compte administrateur

1. Lancez l'application (`npm run dev`) et inscrivez-vous normalement depuis
   l'écran **Connexion** (le rôle par défaut à l'inscription est `scout`).
2. Dans le Dashboard Supabase, allez dans **Table Editor > profiles**, trouvez
   la ligne correspondant à votre compte, et changez la colonne `role` en
   `admin`.
3. Rechargez l'application : le menu **Administration** apparaît dans la
   barre latérale.

> Les comptes `academy` peuvent être créés directement depuis l'écran
> d'inscription (choix "Académie ou club"). Seul le rôle `admin` doit être
> accordé manuellement, pour des raisons de sécurité.

## 5. Ce qui est maintenant fonctionnel

| Bouton / fonctionnalité | Statut | Table(s) Supabase |
|---|---|---|
| Ajouter un joueur (admin) | ✅ Formulaire complet + photo + vidéos | `players`, `player_profiles`, `player_videos`, Storage |
| Lecture des vidéos | ✅ Lecteur `<video>` réel | `player_videos`, Storage |
| Ajouter une vidéo | ✅ Upload direct | `player_videos`, Storage |
| Nouvelle shortlist | ✅ | `shortlists`, `shortlist_players` |
| Nouveau rapport | ✅ Formulaire complet | `scouting_reports` |
| Voir le guide | ✅ Contenu fonctionnel | — (statique) |
| Créer une opération | ✅ | `transfer_operations` |
| Publier une opportunité | ✅ (admin/académie) | `opportunities` |
| Ajouter un suivi | ✅ | `opportunity_follows` |
| Demander un contact | ✅ | `contact_requests` |
| Nouveau message | ✅ | `conversations`, `messages` |
| Inscription académie | ✅ + upload logo | `organizations`, Storage |

## 6. Pages publiques désormais connectées à Supabase

Les pages **« Découvrir les talents »**, **profil joueur** et **vidéothèque**
chargent maintenant les joueurs réellement enregistrés dans Supabase (au lieu
des données fictives). Au premier lancement, si vous exécutez la migration
SQL, 4 joueurs de démonstration identiques à l'ancienne version sont
automatiquement créés dans votre base — l'apparence ne change donc pas tant
que vous n'ajoutez ou ne modifiez rien depuis **Administration > Gestion des
joueurs**. Toute fiche ajoutée par un administrateur ou une académie apparaît
désormais directement sur le site public.

La vidéothèque du profil public lit et affiche les vraies vidéos Supabase ;
le bouton **« Ajouter une vidéo »** y est visible uniquement pour les comptes
administrateur et académie.

## 7. Fonctionnalités d'exploration et de tableau de bord activées

- **Recherche de talents** : filtres par nom/académie/pays, par poste et par
  pays (« Filtres avancés »), tri fonctionnel (score de potentiel / nom),
  chips de filtres actifs cliquables pour les retirer individuellement,
  bouton « Réinitialiser ».
- **« Enregistrer une alerte »** : sauvegarde réellement les critères de
  recherche courants dans une nouvelle table `talent_alerts` (nécessite la
  migration `20260813150000_add_talent_alerts.sql`, voir étape 3bis
  ci-dessous).
- **Tableau de bord** : les indicateurs (talents dans la base, ma shortlist,
  mes rapports, opérations actives) et la liste « Opérations en cours »
  affichent désormais de vraies données issues de Supabase, propres à
  l'utilisateur connecté. Le bouton « Voir le Transfer Center » navigue vers
  la page correspondante.
- **Statistiques joueur** : affiche les vrais scores technique / tactique /
  physique / mental enregistrés par l'administrateur, ainsi que les
  statistiques de matchs réelles (buts, passes décisives, matchs joués). Si
  aucune évaluation n'a encore été saisie, un message honnête l'indique au
  lieu d'afficher des chiffres inventés.
- **Parcours académique** : le bouton « Partager le dossier » copie
  réellement un résumé dans le presse-papiers.

## 8. Étape 3bis — Appliquer la migration des alertes de recherche

Un troisième fichier de migration a été ajouté :
`supabase/migrations/20260813150000_add_talent_alerts.sql`. Appliquez-le de
la même manière que les deux précédents (SQL Editor ou `supabase db push`)
pour activer le bouton « Enregistrer une alerte ».

## 9. Limitation connue

Les graphiques de progression et la frise « Parcours académique » restent en
grande partie informatifs plutôt que basés sur un historique enregistré :
leur activation complète nécessiterait de nouvelles tables (historique de
progression, jalons académiques datés) qui n'ont pas été demandées
explicitement. Ils peuvent être ajoutés dans une prochaine itération selon
les besoins.

## 10. Gestion complète des joueurs (création, édition, statistiques, suppression)

Depuis **Administration > Gestion des joueurs**, l'administrateur (ou un
compte académie) peut désormais :

- **Ajouter** un joueur avec toutes ses informations : identité, profil
  sportif, évaluation indicative (technique/tactique/physique/mental/
  potentiel), **statistiques de saison complètes** (matchs, minutes, buts,
  passes décisives, tirs, passes réussies, tacles, interceptions), photo de
  profil et vidéos.
- **Modifier** (bouton crayon ✏️) n'importe quelle fiche existante : le
  formulaire se pré-remplit avec toutes les données déjà enregistrées
  (y compris l'évaluation et les statistiques de la dernière saison
  renseignée), et l'enregistrement met à jour la fiche au lieu d'en créer
  une nouvelle. La photo peut être remplacée ; de nouvelles vidéos peuvent
  être ajoutées à celles déjà présentes.
- **Gérer les vidéos** (bouton 🎥) : lecture, ajout de nouvelles vidéos.
- **Supprimer** (bouton 🗑️) une fiche : la suppression est définitive et
  entraîne automatiquement celle de ses photos/vidéos, statistiques,
  évaluations et rapports de scouting associés (suppression en cascade
  gérée par la base de données).

Toutes ces actions écrivent directement dans les tables `players`,
`player_profiles` et `player_statistics` de votre projet Supabase.

## 11. Démarrage local

```bash
npm install
npm run dev
```

## 12. Build de production

```bash
npm run build
```
