export type AppRole = 'admin' | 'academy' | 'coach' | 'scout';

export type Profile = {
  id: string;
  full_name: string | null;
  role: AppRole;
  organization_id: string | null;
  avatar_url: string | null;
};

export type DbPlayer = {
  id: string;
  organization_id: string | null;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  nationality: string | null;
  country: string;
  city: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  preferred_foot: 'left' | 'right' | 'both' | null;
  primary_position: string;
  secondary_positions: string[];
  bio: string | null;
  avatar_url: string | null;
  status: 'active' | 'inactive' | 'archived';
  visibility: 'public' | 'network' | 'private';
  email: string | null;
  phone: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  school: string | null;
  license_number: string | null;
  academic_score: string | null;
  created_at: string;
};

export type DbPlayerProfile = {
  player_id: string;
  technical_score: number | null;
  tactical_score: number | null;
  physical_score: number | null;
  mental_score: number | null;
  potential_score: number | null;
};

export type DbPlayerVideo = {
  id: string;
  player_id: string;
  title: string;
  description: string | null;
  url: string;
  video_type: 'highlight' | 'full_match' | 'goal' | 'training' | 'test';
  visibility: 'public' | 'network' | 'private';
  created_at: string;
};

export type DbPlayerStatistics = {
  id: string;
  player_id: string;
  season: string;
  matches: number;
  minutes: number;
  goals: number;
  assists: number;
  shots: number;
  passes: number;
  tackles: number;
  interceptions: number;
};
