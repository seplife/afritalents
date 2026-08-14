import { useEffect, useState } from 'react';
import { Upload, Save, X, Video as VideoIcon, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import type { DbPlayer } from '../../lib/types';

type Props = {
  onNotice: (message: string) => void;
  onSaved: () => void;
  onCancel: () => void;
  existingPlayer?: DbPlayer | null;
};

const POSITIONS = [
  'Gardien', 'Défenseur central', 'Latéral droit', 'Latéral gauche',
  'Milieu défensif', 'Milieu central', 'Milieu offensif',
  'Ailier droit', 'Ailier gauche', 'Attaquant',
];

const EMPTY_FORM = {
  first_name: '', last_name: '', date_of_birth: '', nationality: '', country: '', city: '',
  height_cm: '', weight_kg: '', preferred_foot: 'right', primary_position: POSITIONS[0], bio: '',
  email: '', phone: '', guardian_name: '', guardian_phone: '', school: '', license_number: '',
  technical_score: '', tactical_score: '', physical_score: '', mental_score: '', potential_score: '',
  season: `${new Date().getFullYear()}/${String(new Date().getFullYear() + 1).slice(2)}`,
  matches: '', minutes: '', goals: '', assists: '', shots: '', passes: '', tackles: '', interceptions: '',
};

export function AdminPlayerForm({ onNotice, onSaved, onCancel, existingPlayer }: Props) {
  const { session } = useAuth();
  const isEditing = Boolean(existingPlayer);
  const [submitting, setSubmitting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(isEditing);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(existingPlayer?.avatar_url ?? null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    async function prefill() {
      if (!existingPlayer) return;
      const [{ data: profileRow }, { data: statsRow }] = await Promise.all([
        supabase.from('player_profiles').select('*').eq('player_id', existingPlayer.id).maybeSingle(),
        supabase.from('player_statistics').select('*').eq('player_id', existingPlayer.id).order('season', { ascending: false }).limit(1).maybeSingle(),
      ]);
      setForm({
        first_name: existingPlayer.first_name,
        last_name: existingPlayer.last_name,
        date_of_birth: existingPlayer.date_of_birth ?? '',
        nationality: existingPlayer.nationality ?? '',
        country: existingPlayer.country,
        city: existingPlayer.city ?? '',
        height_cm: existingPlayer.height_cm != null ? String(existingPlayer.height_cm) : '',
        weight_kg: existingPlayer.weight_kg != null ? String(existingPlayer.weight_kg) : '',
        preferred_foot: existingPlayer.preferred_foot ?? 'right',
        primary_position: existingPlayer.primary_position,
        bio: existingPlayer.bio ?? '',
        email: existingPlayer.email ?? '',
        phone: existingPlayer.phone ?? '',
        guardian_name: existingPlayer.guardian_name ?? '',
        guardian_phone: existingPlayer.guardian_phone ?? '',
        school: existingPlayer.school ?? '',
        license_number: existingPlayer.license_number ?? '',
        technical_score: profileRow?.technical_score != null ? String(profileRow.technical_score) : '',
        tactical_score: profileRow?.tactical_score != null ? String(profileRow.tactical_score) : '',
        physical_score: profileRow?.physical_score != null ? String(profileRow.physical_score) : '',
        mental_score: profileRow?.mental_score != null ? String(profileRow.mental_score) : '',
        potential_score: profileRow?.potential_score != null ? String(profileRow.potential_score) : '',
        season: statsRow?.season ?? EMPTY_FORM.season,
        matches: statsRow?.matches != null ? String(statsRow.matches) : '',
        minutes: statsRow?.minutes != null ? String(statsRow.minutes) : '',
        goals: statsRow?.goals != null ? String(statsRow.goals) : '',
        assists: statsRow?.assists != null ? String(statsRow.assists) : '',
        shots: statsRow?.shots != null ? String(statsRow.shots) : '',
        passes: statsRow?.passes != null ? String(statsRow.passes) : '',
        tackles: statsRow?.tackles != null ? String(statsRow.tackles) : '',
        interceptions: statsRow?.interceptions != null ? String(statsRow.interceptions) : '',
      });
      setLoadingExisting(false);
    }
    prefill();
  }, [existingPlayer]);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session) return onNotice('Vous devez être connecté pour enregistrer un joueur.');
    if (!form.first_name || !form.last_name || !form.country) return onNotice('Le prénom, le nom et le pays sont obligatoires.');
    setSubmitting(true);

    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        date_of_birth: form.date_of_birth || null,
        nationality: form.nationality || null,
        country: form.country,
        city: form.city || null,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        preferred_foot: form.preferred_foot || null,
        primary_position: form.primary_position,
        bio: form.bio || null,
        email: form.email || null,
        phone: form.phone || null,
        guardian_name: form.guardian_name || null,
        guardian_phone: form.guardian_phone || null,
        school: form.school || null,
        license_number: form.license_number || null,
      };

      let playerId: string;
      if (isEditing && existingPlayer) {
        const { error: updateError } = await supabase.from('players').update(payload).eq('id', existingPlayer.id);
        if (updateError) throw new Error(updateError.message);
        playerId = existingPlayer.id;
      } else {
        const { data: player, error: insertError } = await supabase
          .from('players')
          .insert({ ...payload, created_by: session.user.id, status: 'active', visibility: 'public' })
          .select()
          .single();
        if (insertError || !player) throw new Error(insertError?.message ?? 'Échec de la création du joueur.');
        playerId = player.id as string;
      }

      // Photo de profil (remplace la précédente si une nouvelle est choisie)
      if (photoFile) {
        const photoExtension = photoFile.name.split('.').pop() ?? 'jpg';
        const path = `${playerId}/avatar-${Date.now()}.${photoExtension}`;
        const { error: uploadError } = await supabase.storage.from('player-photos').upload(path, photoFile, { upsert: true });
        if (uploadError) throw new Error(`Photo : ${uploadError.message}`);
        const { data: publicUrl } = supabase.storage.from('player-photos').getPublicUrl(path);
        await supabase.from('players').update({ avatar_url: publicUrl.publicUrl }).eq('id', playerId);
      }

      // Vidéos supplémentaires
      for (const file of videoFiles) {
        const path = `${playerId}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const { error: uploadError } = await supabase.storage.from('player-videos').upload(path, file, { upsert: true });
        if (uploadError) throw new Error(`Vidéo « ${file.name} » : ${uploadError.message}`);
        const { data: publicUrl } = supabase.storage.from('player-videos').getPublicUrl(path);
        await supabase.from('player_videos').insert({ player_id: playerId, title: file.name.replace(/\.[^/.]+$/, ''), url: publicUrl.publicUrl, video_type: 'highlight', visibility: 'public' });
      }

      // Évaluation (performance indicative)
      const hasScores = ['technical_score', 'tactical_score', 'physical_score', 'mental_score', 'potential_score'].some((key) => form[key as keyof typeof form]);
      if (hasScores) {
        await supabase.from('player_profiles').upsert({
          player_id: playerId,
          technical_score: form.technical_score ? Number(form.technical_score) : null,
          tactical_score: form.tactical_score ? Number(form.tactical_score) : null,
          physical_score: form.physical_score ? Number(form.physical_score) : null,
          mental_score: form.mental_score ? Number(form.mental_score) : null,
          potential_score: form.potential_score ? Number(form.potential_score) : null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'player_id' });
      }

      // Statistiques de la saison
      const hasStats = ['matches', 'minutes', 'goals', 'assists', 'shots', 'passes', 'tackles', 'interceptions'].some((key) => form[key as keyof typeof form]);
      if (hasStats && form.season) {
        await supabase.from('player_statistics').upsert({
          player_id: playerId,
          season: form.season,
          matches: form.matches ? Number(form.matches) : 0,
          minutes: form.minutes ? Number(form.minutes) : 0,
          goals: form.goals ? Number(form.goals) : 0,
          assists: form.assists ? Number(form.assists) : 0,
          shots: form.shots ? Number(form.shots) : 0,
          passes: form.passes ? Number(form.passes) : 0,
          tackles: form.tackles ? Number(form.tackles) : 0,
          interceptions: form.interceptions ? Number(form.interceptions) : 0,
        }, { onConflict: 'player_id,season' });
      }

      onNotice(`${form.first_name} ${form.last_name} a été ${isEditing ? 'mis à jour' : 'enregistré'} avec succès.`);
      onSaved();
    } catch (err) {
      onNotice(err instanceof Error ? err.message : 'Une erreur est survenue lors de l’enregistrement.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingExisting) {
    return <div className="page workspace-page" style={{ color: '#8e958d', display: 'flex', alignItems: 'center', gap: 8 }}><Loader2 size={16} className="spin" /> Chargement de la fiche…</div>;
  }

  return (
    <form className="page workspace-page" onSubmit={handleSubmit}>
      <div className="page-intro">
        <div>
          <div className="eyebrow">Administration</div>
          <h1>{isEditing ? `Modifier ${existingPlayer?.first_name} ${existingPlayer?.last_name}` : 'Enregistrer un joueur'}</h1>
          <p>Toutes les informations sont stockées dans votre base Supabase.</p>
        </div>
        <button type="button" className="button button-ghost" onClick={onCancel}>
          <X size={15} /> Annuler
        </button>
      </div>

      <div className="academy-form-grid">
        <div className="content-card academy-form">
          <div className="eyebrow">Identité</div>
          <h2>Informations personnelles</h2>
          <div className="form-two">
            <label>Prénom *<input value={form.first_name} onChange={(e) => update('first_name', e.target.value)} required /></label>
            <label>Nom *<input value={form.last_name} onChange={(e) => update('last_name', e.target.value)} required /></label>
          </div>
          <div className="form-two">
            <label>Date de naissance<input type="date" value={form.date_of_birth} onChange={(e) => update('date_of_birth', e.target.value)} /></label>
            <label>Nationalité<input value={form.nationality} onChange={(e) => update('nationality', e.target.value)} placeholder="Ex. Ivoirienne" /></label>
          </div>
          <div className="form-two">
            <label>Pays *<input value={form.country} onChange={(e) => update('country', e.target.value)} required placeholder="Ex. Côte d’Ivoire" /></label>
            <label>Ville<input value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Ex. Abidjan" /></label>
          </div>

          <div className="eyebrow" style={{ marginTop: 18 }}>Profil sportif</div>
          <div className="form-two">
            <label>Poste principal
              <select value={form.primary_position} onChange={(e) => update('primary_position', e.target.value)}>
                {POSITIONS.map((position) => <option key={position} value={position}>{position}</option>)}
              </select>
            </label>
            <label>Pied fort
              <select value={form.preferred_foot} onChange={(e) => update('preferred_foot', e.target.value)}>
                <option value="right">Droit</option>
                <option value="left">Gauche</option>
                <option value="both">Ambidextre</option>
              </select>
            </label>
          </div>
          <div className="form-two">
            <label>Taille (cm)<input type="number" min={100} max={240} value={form.height_cm} onChange={(e) => update('height_cm', e.target.value)} /></label>
            <label>Poids (kg)<input type="number" min={25} max={160} value={form.weight_kg} onChange={(e) => update('weight_kg', e.target.value)} /></label>
          </div>
          <label>Biographie<textarea value={form.bio} onChange={(e) => update('bio', e.target.value)} placeholder="Parcours, points forts, style de jeu…" /></label>

          <div className="eyebrow" style={{ marginTop: 18 }}>Évaluation indicative (sur 100)</div>
          <div className="form-two">
            <label>Technique<input type="number" min={1} max={100} value={form.technical_score} onChange={(e) => update('technical_score', e.target.value)} /></label>
            <label>Tactique<input type="number" min={1} max={100} value={form.tactical_score} onChange={(e) => update('tactical_score', e.target.value)} /></label>
          </div>
          <div className="form-two">
            <label>Physique<input type="number" min={1} max={100} value={form.physical_score} onChange={(e) => update('physical_score', e.target.value)} /></label>
            <label>Mental<input type="number" min={1} max={100} value={form.mental_score} onChange={(e) => update('mental_score', e.target.value)} /></label>
          </div>
          <label>Potentiel<input type="number" min={1} max={100} value={form.potential_score} onChange={(e) => update('potential_score', e.target.value)} /></label>

          <div className="eyebrow" style={{ marginTop: 18 }}>Statistiques de la saison</div>
          <label>Saison<input value={form.season} onChange={(e) => update('season', e.target.value)} placeholder="Ex. 2025/26" /></label>
          <div className="form-two">
            <label>Matchs joués<input type="number" min={0} value={form.matches} onChange={(e) => update('matches', e.target.value)} /></label>
            <label>Minutes jouées<input type="number" min={0} value={form.minutes} onChange={(e) => update('minutes', e.target.value)} /></label>
          </div>
          <div className="form-two">
            <label>Buts<input type="number" min={0} value={form.goals} onChange={(e) => update('goals', e.target.value)} /></label>
            <label>Passes décisives<input type="number" min={0} value={form.assists} onChange={(e) => update('assists', e.target.value)} /></label>
          </div>
          <div className="form-two">
            <label>Tirs<input type="number" min={0} value={form.shots} onChange={(e) => update('shots', e.target.value)} /></label>
            <label>Passes réussies<input type="number" min={0} value={form.passes} onChange={(e) => update('passes', e.target.value)} /></label>
          </div>
          <div className="form-two">
            <label>Tacles<input type="number" min={0} value={form.tackles} onChange={(e) => update('tackles', e.target.value)} /></label>
            <label>Interceptions<input type="number" min={0} value={form.interceptions} onChange={(e) => update('interceptions', e.target.value)} /></label>
          </div>

          <div className="eyebrow" style={{ marginTop: 18 }}>Références et contacts</div>
          <div className="form-two">
            <label>Email<input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} /></label>
            <label>Téléphone<input value={form.phone} onChange={(e) => update('phone', e.target.value)} /></label>
          </div>
          <div className="form-two">
            <label>Nom du tuteur légal<input value={form.guardian_name} onChange={(e) => update('guardian_name', e.target.value)} /></label>
            <label>Téléphone du tuteur<input value={form.guardian_phone} onChange={(e) => update('guardian_phone', e.target.value)} /></label>
          </div>
          <div className="form-two">
            <label>École / Établissement<input value={form.school} onChange={(e) => update('school', e.target.value)} /></label>
            <label>N° de licence<input value={form.license_number} onChange={(e) => update('license_number', e.target.value)} /></label>
          </div>

          <button className="button button-primary" type="submit" disabled={submitting} style={{ marginTop: 16 }}>
            {submitting ? <><Loader2 size={15} className="spin" /> Enregistrement…</> : <><Save size={15} /> {isEditing ? 'Enregistrer les modifications' : 'Enregistrer le joueur'}</>}
          </button>
        </div>

        <div className="content-card upload-card">
          <div className="upload-icon"><Upload size={20} /></div>
          <h3>Photo de profil</h3>
          {existingPhotoUrl && !photoFile && (
            <div style={{ marginBottom: 10 }}>
              <img src={existingPhotoUrl} alt="Photo actuelle" style={{ width: '100%', maxWidth: 180, borderRadius: 10, display: 'block' }} />
              <small style={{ color: '#8e958d' }}>Photo actuelle — choisissez un fichier pour la remplacer.</small>
            </div>
          )}
          <p>Format JPG, PNG ou WEBP, 10 Mo maximum.</p>
          <label className="button button-ghost" style={{ display: 'inline-flex', cursor: 'pointer' }}>
            <Upload size={15} /> {photoFile ? photoFile.name : existingPhotoUrl ? 'Remplacer la photo' : 'Choisir une photo'}
            <input type="file" accept="image/*" hidden onChange={(e) => { setPhotoFile(e.target.files?.[0] ?? null); setExistingPhotoUrl(null); }} />
          </label>

          <h3 style={{ marginTop: 22 }}>Vidéos</h3>
          <p>MP4, MOV ou WEBM, 500 Mo maximum par fichier. {isEditing ? 'Les nouvelles vidéos s’ajoutent à celles déjà enregistrées.' : 'Plusieurs vidéos possibles.'}</p>
          <label className="button button-ghost" style={{ display: 'inline-flex', cursor: 'pointer' }}>
            <VideoIcon size={15} /> Ajouter des vidéos
            <input type="file" accept="video/*" multiple hidden onChange={(e) => setVideoFiles((current) => [...current, ...Array.from(e.target.files ?? [])])} />
          </label>
          {videoFiles.length > 0 && (
            <div className="verification-list" style={{ marginTop: 10 }}>
              {videoFiles.map((file, index) => (
                <span key={`${file.name}-${index}`}>
                  {file.name}
                  <button type="button" onClick={() => setVideoFiles((current) => current.filter((_, i) => i !== index))} style={{ marginLeft: 8, background: 'none', border: 0, color: '#fca5a5', cursor: 'pointer' }}>
                    <Trash2 size={12} style={{ verticalAlign: 'middle' }} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
