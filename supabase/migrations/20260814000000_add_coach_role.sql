/*
# Ajout du rôle "coach"

Les entraîneurs (coachs) doivent pouvoir ajouter, modifier et supprimer les
joueurs de leur structure, au même titre que les comptes administrateur et
académie. Cette migration élargit le rôle applicatif et les droits d'écriture
en conséquence, sans rien modifier pour les rôles existants.
*/

-- 1. Élargir la contrainte de rôle sur profiles ---------------------------------

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'academy', 'coach', 'scout'));

-- 2. La fonction is_admin_or_academy() autorise désormais aussi les coachs ------
-- (le nom de la fonction est conservé pour ne pas avoir à réécrire toutes les
-- politiques RLS qui l'utilisent déjà ; elle couvre maintenant les trois rôles
-- habilités à gérer les joueurs : admin, academy, coach)

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
