import { useState } from 'react';
import { Upload, Save, X, Video as VideoIcon, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

type Props = {
  onNotice: (message: string) => void;
  onSaved: () => void;
  onCancel: () => void;
};

const POSITIONS = [
  'Gardien', 'Défenseur central', 'Latéral droit', 'Latéral gauche',
  'Milieu défensif', 'Milieu central', 'Milieu offensif',
  'Ailier droit', 'Ailier gauche', 'Attaquant',
];

export function AdminPlayerForm({ onNotice, onSaved, onCancel }: Props) {
  const { session } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    nationality: '',
    country: '',
    city: '',
    height_cm: '',
    weight_kg: '',
    preferred_foot: 'right',
    primary_position: POSITIONS[0],
    bio: '',
    email: '',
    phone: '',
    guardian_name: '',
    guardian_phone: '',
    school: '',
    license_number: '',
    technical_score: '',
    tactical_score: '',
    physical_score: '',
    mental_score: '',
    potential_score: '',
  });

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session) {
      onNotice('Vous devez être connecté pour enregistrer un joueur.');
      return;
    }
    if (!form.first_name || !form.last_name || !form.country) {
      onNotice('Le prénom, le nom et le pays sont obligatoires.');
      return;
    }
    setSubmitting(true);

    try {
      const { data: player, error: insertError } = await supabase
        .from('players')
        .insert({
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
          created_by: session.user.id,
          status: 'active',
          visibility: 'public',
        })
        .select()
        .single();

      if (insertError || !player) throw new Error(insertError?.message ?? 'Échec de la création du joueur.');

      const playerId = player.id as string;

      // Photo de profil
      if (photoFile) {
        const photoExtension = photoFile.name.split('.').pop() ?? 'jpg';
        const path = `${playerId}/avatar-${Date.now()}.${photoExtension}`;
        const { error: uploadError } = await supabase.storage.from('player-photos').upload(path, photoFile, { upsert: true });
        if (uploadError) throw new Error(`Photo : ${uploadError.message}`);
        const { data: publicUrl } = supabase.storage.from('player-photos').getPublicUrl(path);
        await supabase.from('players').update({ avatar_url: publicUrl.publicUrl }).eq('id', playerId);
      }

      // Vidéos
      for (const file of videoFiles) {
        const path = `${playerId}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const { error: uploadError } = await supabase.storage.from('player-videos').upload(path, file, { upsert: true });
        if (uploadError) throw new Error(`Vidéo « ${file.name} » : ${uploadError.message}`);
        const { data: publicUrl } = supabase.storage.from('player-videos').getPublicUrl(path);
        await supabase.from('player_videos').insert({
          player_id: playerId,
          title: file.name.replace(/\.[^/.]+$/, ''),
          url: publicUrl.publicUrl,
          video_type: 'highlight',
          visibility: 'public',
        });
      }

      // Scores / performances indicatives
      const hasScores = ['technical_score', 'tactical_score', 'physical_score', 'mental_score', 'potential_score'].some(
        (key) => form[key as keyof typeof form]
      );
      if (hasScores) {
        await supabase.from('player_profiles').insert({
          player_id: playerId,
          technical_score: form.technical_score ? Number(form.technical_score) : null,
          tactical_score: form.tactical_score ? Number(form.tactical_score) : null,
          physical_score: form.physical_score ? Number(form.physical_score) : null,
          mental_score: form.mental_score ? Number(form.mental_score) : null,
          potential_score: form.potential_score ? Number(form.potential_score) : null,
        });
      }

      onNotice(`${form.first_name} ${form.last_name} a été enregistré avec succès.`);
      onSaved();
    } catch (err) {
      onNotice(err instanceof Error ? err.message : 'Une erreur est survenue lors de l’enregistrement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="page workspace-page" onSubmit={handleSubmit}>
      <div className="page-intro">
        <div>
          <div className="eyebrow">Administration</div>
          <h1>Enregistrer un joueur</h1>
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
            {submitting ? <><Loader2 size={15} className="spin" /> Enregistrement…</> : <><Save size={15} /> Enregistrer le joueur</>}
          </button>
        </div>

        <div className="content-card upload-card">
          <div className="upload-icon"><Upload size={20} /></div>
          <h3>Photo de profil</h3>
          <p>Format JPG, PNG ou WEBP, 10 Mo maximum.</p>
          <label className="button button-ghost" style={{ display: 'inline-flex', cursor: 'pointer' }}>
            <Upload size={15} /> {photoFile ? photoFile.name : 'Choisir une photo'}
            <input type="file" accept="image/*" hidden onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
          </label>

          <h3 style={{ marginTop: 22 }}>Vidéos</h3>
          <p>MP4, MOV ou WEBM, 500 Mo maximum par fichier. Plusieurs vidéos possibles.</p>
          <label className="button button-ghost" style={{ display: 'inline-flex', cursor: 'pointer' }}>
            <VideoIcon size={15} /> Ajouter des vidéos
            <input
              type="file"
              accept="video/*"
              multiple
              hidden
              onChange={(e) => setVideoFiles((current) => [...current, ...Array.from(e.target.files ?? [])])}
            />
          </label>
          {videoFiles.length > 0 && (
            <div className="verification-list" style={{ marginTop: 10 }}>
              {videoFiles.map((file, index) => (
                <span key={`${file.name}-${index}`}>
                  {file.name}
                  <button
                    type="button"
                    onClick={() => setVideoFiles((current) => current.filter((_, i) => i !== index))}
                    style={{ marginLeft: 8, background: 'none', border: 0, color: '#fca5a5', cursor: 'pointer' }}
                  >
                    retirer
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
