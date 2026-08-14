/*
# AfriTalents — rôles, administration, fonctionnalités de suivi et stockage médias

1. Objectif
Cette migration ajoute tout ce qui manquait au noyau MVP pour rendre l'application
réellement fonctionnelle : un système de rôles (admin, académie, scout), la gestion
complète d'un joueur par l'administrateur (références, performances, photos, vidéos),
les shortlists, le pipeline d'opérations (Transfer Center), les opportunités avec
suivi et demande de contact, et la messagerie.

2. Nouvelles tables
- `profiles`: profil applicatif lié à `auth.users`, porte le rôle (`admin`, `academy`, `scout`)
  et le rattachement optionnel à une organisation.
- `shortlists` / `shortlist_players`: listes de joueurs suivis par un utilisateur.
- `transfer_operations`: dossiers du "Transfer Center" avec statut et étape courante.
- `opportunity_follows`: suivi d'une opportunité par un utilisateur ("Ajouter au suivi").
- `contact_requests`: demandes de mise en contact liées à une opportunité.
- `conversations` / `conversation_participants` / `messages`: messagerie interne.

3. Colonnes ajoutées aux tables existantes
- `players.created_by`: administrateur ou académie ayant enregistré la fiche joueur.
- `players.email`, `players.phone`, `players.guardian_name`, `players.guardian_phone`,
  `players.school`, `players.license_number`: références complémentaires demandées
  par l'administrateur.
- `opportunities.created_by`: utilisateur ayant publié l'opportunité.

4. Sécurité
- RLS activé sur toutes les nouvelles tables.
- Une fonction `is_admin_or_academy()` centralise la vérification de rôle pour les
  écritures administratives (créer/modifier un joueur, publier une opportunité,
  créer une opération de transfert).
- Chaque utilisateur authentifié ne peut lire/écrire que ses propres shortlists,
  suivis, demandes de contact et messages (filtrage par `auth.uid()`).
- Deux buckets de stockage privés-publics en lecture sont créés : `player-photos`
  et `player-videos`. Seuls les administrateurs et académies peuvent y déposer des
  fichiers ; la lecture est publique pour permettre l'affichage sur les profils publics.

5. Rôle par défaut
- Un déclencheur crée automatiquement une ligne `profiles` (rôle `scout` par défaut)
  à chaque inscription, afin que l'application ait toujours un profil applicatif
  associé à un compte `auth.users`.
*/

-- 1. Rôles applicatifs -------------------------------------------------------

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text NOT NULL DEFAULT 'scout' CHECK (role IN ('admin', 'academy', 'scout')),
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can view profiles of same organization" ON profiles;
CREATE POLICY "Users can view profiles of same organization" ON profiles FOR SELECT TO authenticated USING (
  organization_id IS NOT NULL AND organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Fonction utilitaire : l'utilisateur courant est-il admin ou académie ?
CREATE OR REPLACE FUNCTION is_admin_or_academy()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'academy')
  );
$$;

-- Création automatique du profil applicatif à l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', new.email), COALESCE(new.raw_user_meta_data->>'role', 'scout'))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Références complémentaires sur les joueurs ------------------------------

ALTER TABLE players ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE players ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE players ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE players ADD COLUMN IF NOT EXISTS guardian_name text;
ALTER TABLE players ADD COLUMN IF NOT EXISTS guardian_phone text;
ALTER TABLE players ADD COLUMN IF NOT EXISTS school text;
ALTER TABLE players ADD COLUMN IF NOT EXISTS license_number text;

ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Shortlists ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS shortlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Nouvelle shortlist',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shortlist_players (
  shortlist_id uuid NOT NULL REFERENCES shortlists(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (shortlist_id, player_id)
);

ALTER TABLE shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortlist_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage their shortlists" ON shortlists;
CREATE POLICY "Owners manage their shortlists" ON shortlists FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners manage their shortlist players" ON shortlist_players;
CREATE POLICY "Owners manage their shortlist players" ON shortlist_players FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM shortlists WHERE shortlists.id = shortlist_players.shortlist_id AND shortlists.owner_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM shortlists WHERE shortlists.id = shortlist_players.shortlist_id AND shortlists.owner_id = auth.uid())
);

-- 4. Transfer Center ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS transfer_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  operation_type text NOT NULL DEFAULT 'trial' CHECK (operation_type IN ('trial', 'transfer', 'loan', 'scholarship')),
  counterparty text NOT NULL,
  status text NOT NULL DEFAULT 'contact_initial' CHECK (status IN ('contact_initial', 'authorization_required', 'negotiation', 'document_check', 'completed', 'cancelled')),
  target_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE transfer_operations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin and academy manage transfer operations" ON transfer_operations;
CREATE POLICY "Admin and academy manage transfer operations" ON transfer_operations FOR ALL TO authenticated USING (is_admin_or_academy()) WITH CHECK (is_admin_or_academy());
DROP POLICY IF EXISTS "Authenticated can view transfer operations" ON transfer_operations;
CREATE POLICY "Authenticated can view transfer operations" ON transfer_operations FOR SELECT TO authenticated USING (true);

-- 5. Suivi des opportunités et demandes de contact -------------------------------

CREATE TABLE IF NOT EXISTS opportunity_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (opportunity_id, user_id)
);

CREATE TABLE IF NOT EXISTS contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE opportunity_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their opportunity follows" ON opportunity_follows;
CREATE POLICY "Users manage their opportunity follows" ON opportunity_follows FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage their contact requests" ON contact_requests;
CREATE POLICY "Users manage their contact requests" ON contact_requests FOR ALL TO authenticated USING (auth.uid() = requester_id) WITH CHECK (auth.uid() = requester_id);

-- 6. Messagerie -------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view their conversations" ON conversations;
CREATE POLICY "Participants can view their conversations" ON conversations FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Authenticated can create conversations" ON conversations;
CREATE POLICY "Authenticated can create conversations" ON conversations FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Participants can view participants list" ON conversation_participants;
CREATE POLICY "Participants can view participants list" ON conversation_participants FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Authenticated can add participants" ON conversation_participants;
CREATE POLICY "Authenticated can add participants" ON conversation_participants FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Participants can view messages" ON messages;
CREATE POLICY "Participants can view messages" ON messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Participants can send messages" ON messages;
CREATE POLICY "Participants can send messages" ON messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid())
);

-- 6bis. Demandes de contact directes sur un joueur et alertes de recherche -------

CREATE TABLE IF NOT EXISTS player_contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS search_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query text,
  position text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE player_contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their player contact requests" ON player_contact_requests;
CREATE POLICY "Users manage their player contact requests" ON player_contact_requests FOR ALL TO authenticated USING (auth.uid() = requester_id OR is_admin_or_academy()) WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users manage their search alerts" ON search_alerts;
CREATE POLICY "Users manage their search alerts" ON search_alerts FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- 7. Mise à jour des permissions d'écriture sur les tables joueurs pour les admins/académies --

DROP POLICY IF EXISTS "Authenticated can create players" ON players;
CREATE POLICY "Authenticated can create players" ON players FOR INSERT TO authenticated WITH CHECK (is_admin_or_academy() OR auth.uid() = user_id);
DROP POLICY IF EXISTS "Authenticated can update own players" ON players;
CREATE POLICY "Authenticated can update own players" ON players FOR UPDATE TO authenticated USING (is_admin_or_academy() OR auth.uid() = user_id) WITH CHECK (is_admin_or_academy() OR auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can delete players" ON players;
CREATE POLICY "Admins can delete players" ON players FOR DELETE TO authenticated USING (is_admin_or_academy());
DROP POLICY IF EXISTS "Admin and academy can view all players" ON players;
CREATE POLICY "Admin and academy can view all players" ON players FOR SELECT TO authenticated USING (is_admin_or_academy());

DROP POLICY IF EXISTS "Admin and academy manage player profiles" ON player_profiles;
CREATE POLICY "Admin and academy manage player profiles" ON player_profiles FOR ALL TO authenticated USING (is_admin_or_academy()) WITH CHECK (is_admin_or_academy());

DROP POLICY IF EXISTS "Authenticated can create videos" ON player_videos;
CREATE POLICY "Authenticated can create videos" ON player_videos FOR INSERT TO authenticated WITH CHECK (
  is_admin_or_academy() OR EXISTS (SELECT 1 FROM players WHERE players.id = player_videos.player_id AND players.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Admin and academy can view all videos" ON player_videos;
CREATE POLICY "Admin and academy can view all videos" ON player_videos FOR SELECT TO authenticated USING (is_admin_or_academy());
DROP POLICY IF EXISTS "Admin and academy can delete videos" ON player_videos;
CREATE POLICY "Admin and academy can delete videos" ON player_videos FOR DELETE TO authenticated USING (is_admin_or_academy());

DROP POLICY IF EXISTS "Admin and academy manage statistics" ON player_statistics;
CREATE POLICY "Admin and academy manage statistics" ON player_statistics FOR ALL TO authenticated USING (is_admin_or_academy()) WITH CHECK (is_admin_or_academy());

DROP POLICY IF EXISTS "Authenticated can create scouting reports" ON scouting_reports;
CREATE POLICY "Authenticated can create scouting reports" ON scouting_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = scout_user_id);
DROP POLICY IF EXISTS "Authenticated can view all scouting reports" ON scouting_reports;
CREATE POLICY "Authenticated can view all scouting reports" ON scouting_reports FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can update own opportunities" ON opportunities;
CREATE POLICY "Authenticated can update own opportunities" ON opportunities FOR UPDATE TO authenticated USING (is_admin_or_academy()) WITH CHECK (is_admin_or_academy());
DROP POLICY IF EXISTS "Authenticated can create opportunities" ON opportunities;
CREATE POLICY "Authenticated can create opportunities" ON opportunities FOR INSERT TO authenticated WITH CHECK (is_admin_or_academy());

DROP POLICY IF EXISTS "Admin and academy manage organizations" ON organizations;
CREATE POLICY "Admin and academy manage organizations" ON organizations FOR UPDATE TO authenticated USING (is_admin_or_academy()) WITH CHECK (is_admin_or_academy());

-- 7bis. Recherche d'un utilisateur par email pour démarrer une conversation ------
-- Ne renvoie que l'identifiant (aucune autre donnée personnelle) et exige d'être authentifié.

CREATE OR REPLACE FUNCTION get_user_id_by_email(lookup_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM auth.users WHERE lower(email) = lower(lookup_email) LIMIT 1;
$$;

REVOKE ALL ON FUNCTION get_user_id_by_email(text) FROM public;
GRANT EXECUTE ON FUNCTION get_user_id_by_email(text) TO authenticated;

-- 8. Index complémentaires -----------------------------------------------------

CREATE INDEX IF NOT EXISTS shortlist_players_shortlist_idx ON shortlist_players(shortlist_id);
CREATE INDEX IF NOT EXISTS transfer_operations_player_idx ON transfer_operations(player_id);
CREATE INDEX IF NOT EXISTS opportunity_follows_user_idx ON opportunity_follows(user_id);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS scouting_reports_player_idx ON scouting_reports(player_id);

-- 9. Stockage : photos et vidéos des joueurs -------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('player-photos', 'player-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('player-videos', 'player-videos', true, 524288000, ARRAY['video/mp4', 'video/quicktime', 'video/webm'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view player photos" ON storage.objects;
CREATE POLICY "Public can view player photos" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'player-photos');
DROP POLICY IF EXISTS "Admin and academy can upload player photos" ON storage.objects;
CREATE POLICY "Admin and academy can upload player photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'player-photos' AND is_admin_or_academy());
DROP POLICY IF EXISTS "Admin and academy can update player photos" ON storage.objects;
CREATE POLICY "Admin and academy can update player photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'player-photos' AND is_admin_or_academy());
DROP POLICY IF EXISTS "Admin and academy can delete player photos" ON storage.objects;
CREATE POLICY "Admin and academy can delete player photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'player-photos' AND is_admin_or_academy());

DROP POLICY IF EXISTS "Public can view player videos" ON storage.objects;
CREATE POLICY "Public can view player videos" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'player-videos');
DROP POLICY IF EXISTS "Admin and academy can upload player videos" ON storage.objects;
CREATE POLICY "Admin and academy can upload player videos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'player-videos' AND is_admin_or_academy());
DROP POLICY IF EXISTS "Admin and academy can update player videos" ON storage.objects;
CREATE POLICY "Admin and academy can update player videos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'player-videos' AND is_admin_or_academy());
DROP POLICY IF EXISTS "Admin and academy can delete player videos" ON storage.objects;
CREATE POLICY "Admin and academy can delete player videos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'player-videos' AND is_admin_or_academy());

ALTER TABLE players ADD COLUMN IF NOT EXISTS academic_score text;

-- 10. Données de démonstration (les 4 profils déjà visibles côté interface) -----

DO $$
DECLARE
  org_afa uuid;
  org_dep uuid;
  org_afl uuid;
  org_bng uuid;
  p_id uuid;
BEGIN
  INSERT INTO organizations (name, type, country, city, verified)
  VALUES ('Africa Future Academy', 'academy', 'Côte d''Ivoire', 'Abidjan', true)
  ON CONFLICT DO NOTHING RETURNING id INTO org_afa;
  IF org_afa IS NULL THEN SELECT id INTO org_afa FROM organizations WHERE name = 'Africa Future Academy' LIMIT 1; END IF;

  INSERT INTO organizations (name, type, country, city, verified)
  VALUES ('Dakar Elite Project', 'academy', 'Sénégal', 'Dakar', true)
  ON CONFLICT DO NOTHING RETURNING id INTO org_dep;
  IF org_dep IS NULL THEN SELECT id INTO org_dep FROM organizations WHERE name = 'Dakar Elite Project' LIMIT 1; END IF;

  INSERT INTO organizations (name, type, country, city, verified)
  VALUES ('Accra Football Lab', 'academy', 'Ghana', 'Accra', true)
  ON CONFLICT DO NOTHING RETURNING id INTO org_afl;
  IF org_afl IS NULL THEN SELECT id INTO org_afl FROM organizations WHERE name = 'Accra Football Lab' LIMIT 1; END IF;

  INSERT INTO organizations (name, type, country, city, verified)
  VALUES ('Bamako Next Gen', 'academy', 'Mali', 'Bamako', true)
  ON CONFLICT DO NOTHING RETURNING id INTO org_bng;
  IF org_bng IS NULL THEN SELECT id INTO org_bng FROM organizations WHERE name = 'Bamako Next Gen' LIMIT 1; END IF;

  IF NOT EXISTS (SELECT 1 FROM players WHERE first_name = 'Koffi' AND last_name = 'Jean') THEN
    INSERT INTO players (first_name, last_name, country, primary_position, avatar_url, organization_id, height_cm, preferred_foot, status, visibility, academic_score, nationality)
    VALUES ('Koffi', 'Jean', 'Côte d''Ivoire', 'Ailier droit', 'https://images.pexels.com/photos/8941656/pexels-photo-8941656.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', org_afa, 176, 'right', 'active', 'public', '14,7/20', 'Ivoirienne')
    RETURNING id INTO p_id;
    INSERT INTO player_profiles (player_id, technical_score, physical_score, potential_score) VALUES (p_id, 84, 80, 88);
    INSERT INTO player_statistics (player_id, season, matches, goals, assists) VALUES (p_id, '2025/26', 28, 14, 9);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM players WHERE first_name = 'Amara' AND last_name = 'Diallo') THEN
    INSERT INTO players (first_name, last_name, country, primary_position, avatar_url, organization_id, height_cm, preferred_foot, status, visibility, academic_score, nationality)
    VALUES ('Amara', 'Diallo', 'Sénégal', 'Milieu central', 'https://images.pexels.com/photos/30449603/pexels-photo-30449603.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', org_dep, 172, 'left', 'active', 'public', '15,2/20', 'Sénégalaise')
    RETURNING id INTO p_id;
    INSERT INTO player_profiles (player_id, technical_score, physical_score, potential_score) VALUES (p_id, 81, 76, 85);
    INSERT INTO player_statistics (player_id, season, matches, goals, assists) VALUES (p_id, '2025/26', 25, 8, 13);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM players WHERE first_name = 'Kwame' AND last_name = 'Mensah') THEN
    INSERT INTO players (first_name, last_name, country, primary_position, avatar_url, organization_id, height_cm, preferred_foot, status, visibility, academic_score, nationality)
    VALUES ('Kwame', 'Mensah', 'Ghana', 'Défenseur central', 'https://images.pexels.com/photos/33110007/pexels-photo-33110007.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', org_afl, 184, 'right', 'active', 'public', '13,9/20', 'Ghanéenne')
    RETURNING id INTO p_id;
    INSERT INTO player_profiles (player_id, technical_score, physical_score, potential_score) VALUES (p_id, 86, 88, 84);
    INSERT INTO player_statistics (player_id, season, matches, goals, assists) VALUES (p_id, '2025/26', 31, 3, 4);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM players WHERE first_name = 'Moussa' AND last_name = 'Traoré') THEN
    INSERT INTO players (first_name, last_name, country, primary_position, avatar_url, organization_id, height_cm, preferred_foot, status, visibility, academic_score, nationality)
    VALUES ('Moussa', 'Traoré', 'Mali', 'Attaquant', 'https://images.pexels.com/photos/31642262/pexels-photo-31642262.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', org_bng, 179, 'right', 'active', 'public', '12,8/20', 'Malienne')
    RETURNING id INTO p_id;
    INSERT INTO player_profiles (player_id, technical_score, physical_score, potential_score) VALUES (p_id, 88, 85, 90);
    INSERT INTO player_statistics (player_id, season, matches, goals, assists) VALUES (p_id, '2025/26', 26, 19, 6);
  END IF;
END $$;
