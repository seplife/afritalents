/*
# Ajout du rôle Coach

1. Objectif
Les entraîneurs (coachs) doivent pouvoir ajouter, modifier et supprimer les
fiches joueurs (données, photo, vidéos, statistiques) au même titre que les
administrateurs et les académies.

2. Changements
- Le rôle `coach` est ajouté à la contrainte de la colonne `profiles.role`.
- La fonction `is_admin_or_academy()` est étendue pour inclure le rôle
  `coach` : elle continue d'être utilisée par toutes les politiques RLS
  existantes (players, player_profiles, player_videos, player_statistics,
  opportunities, organizations, storage), donc les coachs héritent
  automatiquement des mêmes droits que les administrateurs et académies,
  sans avoir à dupliquer les politiques.
*/

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'academy', 'coach', 'scout'));

CREATE OR REPLACE FUNCTION is_admin_or_academy()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'academy', 'coach')
  );
$$;
