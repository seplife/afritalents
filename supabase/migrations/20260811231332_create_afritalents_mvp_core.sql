/*
# AfriTalents — noyau MVP des profils et du scouting

1. Objectif
Cette migration crée le socle de données du MVP AfriTalents pour référencer les organisations, les joueurs, leurs scores sportifs, leurs vidéos, leurs statistiques et les rapports de scouting.

2. Nouvelles tables
- `organizations`: académies, clubs ou structures partenaires, avec pays, ville et statut de vérification.
- `players`: identité sportive publique d'un joueur, rattachement à une organisation et réglages de visibilité.
- `player_profiles`: scores indicatifs technique, tactique, physique, mental et potentiel.
- `player_videos`: vidéos de présentation ou de match, avec visibilité configurable.
- `player_statistics`: statistiques saisonnières de base.
- `scouting_reports`: rapports rédigés par des scouts, avec scores, forces, axes de progression et recommandation.
- `opportunities`: opportunités publiées par des organisations, comme essais, camps ou détections.

3. Colonnes principales
- Toutes les tables disposent d'un identifiant UUID et d'un horodatage `created_at`.
- `players.date_of_birth`, `height_cm`, `weight_kg`, `primary_position`, `preferred_foot` décrivent le profil sportif.
- `players.visibility` permet de distinguer les profils publics des profils privés.
- `player_profiles` conserve des évaluations indicatives sur 100, jamais présentées comme une garantie de carrière.
- `opportunities.min_age`, `max_age` et `deadline` permettent un premier filtrage des opportunités.

4. Sécurité
- RLS est activé sur toutes les nouvelles tables.
- Les données du MVP sont volontairement limitées à des profils de démonstration publics afin de permettre l'exploration sans compte.
- Les politiques séparent les opérations SELECT, INSERT, UPDATE et DELETE pour les rôles `anon` et `authenticated`.
- Les documents sensibles, données scolaires privées, contrats et transferts ne sont pas exposés par cette première migration et seront ajoutés avec des règles d'accès par propriétaire et représentant légal.

5. Index et intégrité
- Les recherches fréquentes par pays, position, visibilité et organisation sont indexées.
- Les relations utilisent des clés étrangères avec suppression en cascade uniquement pour les sous-éléments dépendants d'un joueur ou d'une organisation.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('academy', 'club', 'school', 'partner')),
  country text NOT NULL,
  city text,
  logo_url text,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date,
  nationality text,
  country text NOT NULL,
  city text,
  height_cm integer CHECK (height_cm IS NULL OR height_cm BETWEEN 100 AND 240),
  weight_kg integer CHECK (weight_kg IS NULL OR weight_kg BETWEEN 25 AND 160),
  preferred_foot text CHECK (preferred_foot IS NULL OR preferred_foot IN ('left', 'right', 'both')),
  primary_position text NOT NULL,
  secondary_positions text[] NOT NULL DEFAULT '{}',
  bio text,
  avatar_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'network', 'private')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS player_profiles (
  player_id uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  technical_score integer CHECK (technical_score IS NULL OR technical_score BETWEEN 1 AND 100),
  tactical_score integer CHECK (tactical_score IS NULL OR tactical_score BETWEEN 1 AND 100),
  physical_score integer CHECK (physical_score IS NULL OR physical_score BETWEEN 1 AND 100),
  mental_score integer CHECK (mental_score IS NULL OR mental_score BETWEEN 1 AND 100),
  potential_score integer CHECK (potential_score IS NULL OR potential_score BETWEEN 1 AND 100),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS player_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  url text NOT NULL,
  video_type text NOT NULL DEFAULT 'highlight' CHECK (video_type IN ('highlight', 'full_match', 'goal', 'training', 'test')),
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'network', 'private')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS player_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season text NOT NULL,
  matches integer NOT NULL DEFAULT 0 CHECK (matches >= 0),
  minutes integer NOT NULL DEFAULT 0 CHECK (minutes >= 0),
  goals integer NOT NULL DEFAULT 0 CHECK (goals >= 0),
  assists integer NOT NULL DEFAULT 0 CHECK (assists >= 0),
  shots integer NOT NULL DEFAULT 0 CHECK (shots >= 0),
  passes integer NOT NULL DEFAULT 0 CHECK (passes >= 0),
  tackles integer NOT NULL DEFAULT 0 CHECK (tackles >= 0),
  interceptions integer NOT NULL DEFAULT 0 CHECK (interceptions >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, season)
);

CREATE TABLE IF NOT EXISTS scouting_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scout_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  technical_score integer CHECK (technical_score IS NULL OR technical_score BETWEEN 1 AND 100),
  tactical_score integer CHECK (tactical_score IS NULL OR tactical_score BETWEEN 1 AND 100),
  physical_score integer CHECK (physical_score IS NULL OR physical_score BETWEEN 1 AND 100),
  mental_score integer CHECK (mental_score IS NULL OR mental_score BETWEEN 1 AND 100),
  potential_score integer CHECK (potential_score IS NULL OR potential_score BETWEEN 1 AND 100),
  strengths text,
  weaknesses text,
  recommendation text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('trial', 'camp', 'detection', 'recruitment', 'scholarship', 'event')),
  title text NOT NULL,
  description text,
  country text NOT NULL,
  city text,
  min_age integer CHECK (min_age IS NULL OR min_age BETWEEN 8 AND 40),
  max_age integer CHECK (max_age IS NULL OR max_age BETWEEN 8 AND 40),
  deadline date,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS players_country_idx ON players(country);
CREATE INDEX IF NOT EXISTS players_position_idx ON players(primary_position);
CREATE INDEX IF NOT EXISTS players_visibility_idx ON players(visibility);
CREATE INDEX IF NOT EXISTS players_organization_idx ON players(organization_id);
CREATE INDEX IF NOT EXISTS player_videos_player_idx ON player_videos(player_id);
CREATE INDEX IF NOT EXISTS player_statistics_player_idx ON player_statistics(player_id);
CREATE INDEX IF NOT EXISTS opportunities_country_idx ON opportunities(country);
CREATE INDEX IF NOT EXISTS opportunities_status_idx ON opportunities(status);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE scouting_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view verified organizations" ON organizations;
CREATE POLICY "Public can view verified organizations" ON organizations FOR SELECT TO anon, authenticated USING (verified = true);
DROP POLICY IF EXISTS "Public can view public players" ON players;
CREATE POLICY "Public can view public players" ON players FOR SELECT TO anon, authenticated USING (visibility = 'public' AND status = 'active');
DROP POLICY IF EXISTS "Public can view public player profiles" ON player_profiles;
CREATE POLICY "Public can view public player profiles" ON player_profiles FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM players WHERE players.id = player_profiles.player_id AND players.visibility = 'public' AND players.status = 'active'));
DROP POLICY IF EXISTS "Public can view public videos" ON player_videos;
CREATE POLICY "Public can view public videos" ON player_videos FOR SELECT TO anon, authenticated USING (visibility = 'public' AND EXISTS (SELECT 1 FROM players WHERE players.id = player_videos.player_id AND players.visibility = 'public' AND players.status = 'active'));
DROP POLICY IF EXISTS "Public can view public statistics" ON player_statistics;
CREATE POLICY "Public can view public statistics" ON player_statistics FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM players WHERE players.id = player_statistics.player_id AND players.visibility = 'public' AND players.status = 'active'));
DROP POLICY IF EXISTS "Public can view reports for public players" ON scouting_reports;
CREATE POLICY "Public can view reports for public players" ON scouting_reports FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM players WHERE players.id = scouting_reports.player_id AND players.visibility = 'public' AND players.status = 'active'));
DROP POLICY IF EXISTS "Public can view published opportunities" ON opportunities;
CREATE POLICY "Public can view published opportunities" ON opportunities FOR SELECT TO anon, authenticated USING (status = 'published');

DROP POLICY IF EXISTS "Authenticated can create organizations" ON organizations;
CREATE POLICY "Authenticated can create organizations" ON organizations FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated can create players" ON players;
CREATE POLICY "Authenticated can create players" ON players FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Authenticated can update own players" ON players;
CREATE POLICY "Authenticated can update own players" ON players FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Authenticated can create videos" ON player_videos;
CREATE POLICY "Authenticated can create videos" ON player_videos FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM players WHERE players.id = player_videos.player_id AND players.user_id = auth.uid()));
DROP POLICY IF EXISTS "Authenticated can create opportunities" ON opportunities;
CREATE POLICY "Authenticated can create opportunities" ON opportunities FOR INSERT TO authenticated WITH CHECK (true);
