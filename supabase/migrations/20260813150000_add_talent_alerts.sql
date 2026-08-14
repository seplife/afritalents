/*
# Alertes de recherche de talents

Permet à un utilisateur connecté d'enregistrer une recherche (mots-clés, poste,
pays) et d'être averti plus tard de l'arrivée de nouveaux profils correspondants.
Cette migration est indépendante et peut être appliquée après les deux
précédentes, dans n'importe quel projet Supabase déjà configuré pour AfriTalents.
*/

CREATE TABLE IF NOT EXISTS talent_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query text,
  position text,
  country text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE talent_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own talent alerts" ON talent_alerts;
CREATE POLICY "Users manage their own talent alerts" ON talent_alerts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS talent_alerts_user_idx ON talent_alerts(user_id);
