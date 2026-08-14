// components/Admin/AdminPlayerForm.tsx
import { useEffect, useState } from 'react';
import { Upload, Save, X, Video as VideoIcon, Loader2, Trash2, } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import type { DbPlayer, DbPlayerVideo } from '../../lib/types';

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
  const [existingVideos, setExistingVideos] = useState<(DbPlayerVideo & { toDelete?: boolean })[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);

  // Charger les vidéos existantes
  useEffect(() => {
    async function loadExistingVideos() {
      if (!existingPlayer) return;
      const { data } = await supabase
        .from('player_videos')
        .select('*')
        .eq('player_id', existingPlayer.id)
        .order('created_at', { ascending: false });
      setExistingVideos((data as DbPlayerVideo[]) ?? []);
    }
    loadExistingVideos();
  }, [existingPlayer]);

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

  const toggleVideoDeletion = (videoId: string) => {
    setExistingVideos(prev => 
      prev.map(v => 
        v.id === videoId ? { ...v, toDelete: !v.toDelete } : v
      )
    );
  };

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

      // --- Gestion de la photo de profil ---
      if (photoFile) {
        // Supprimer l'ancienne photo si elle existe
        if (existingPhotoUrl) {
          const oldUrlParts = existingPhotoUrl.split('/');
          const oldPath = oldUrlParts.slice(oldUrlParts.indexOf('player-photos') + 1).join('/');
          if (oldPath) {
            await supabase.storage.from('player-photos').remove([oldPath]);
          }
        }
        
        const photoExtension = photoFile.name.split('.').pop() ?? 'jpg';
        const path = `${playerId}/avatar-${Date.now()}.${photoExtension}`;
        const { error: uploadError } = await supabase.storage.from('player-photos').upload(path, photoFile);
        if (uploadError) throw new Error(`Photo : ${uploadError.message}`);
        const { data: publicUrl } = supabase.storage.from('player-photos').getPublicUrl(path);
        await supabase.from('players').update({ avatar_url: publicUrl.publicUrl }).eq('id', playerId);
      }

      // --- Gestion des vidéos existantes à supprimer ---
      const videosToDelete = existingVideos.filter(v => v.toDelete);
      for (const video of videosToDelete) {
        // Supprimer du storage
        const urlParts = video.url.split('/');
        const filePath = urlParts.slice(urlParts.indexOf('player-videos') + 1).join('/');
        if (filePath) {
          await supabase.storage.from('player-videos').remove([filePath]);
        }
        // Supprimer de la base
        await supabase.from('player_videos').delete().eq('id', video.id);
      }

      // --- Gestion des nouvelles vidéos ---
      for (const file of videoFiles) {
        // Vérifier la taille
        if (file.size > 500 * 1024 * 1024) {
          onNotice(`⚠️ ${file.name} dépasse 500 Mo, ignoré.`);
          continue;
        }
        
        const path = `${playerId}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const { error: uploadError } = await supabase.storage.from('player-videos').upload(path, file);
        if (uploadError) {
          onNotice(`⚠️ Erreur pour « ${file.name} » : ${uploadError.message}`);
          continue;
        }
        const { data: publicUrl } = supabase.storage.from('player-videos').getPublicUrl(path);
        await supabase.from('player_videos').insert({
          player_id: playerId,
          title: file.name.replace(/\.[^/.]+$/, ''),
          description: '',
          url: publicUrl.publicUrl,
          video_type: 'highlight',
          visibility: 'public',
        });
      }

      // --- Évaluation (performance indicative) ---
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

      // --- Statistiques de la saison ---
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

      const deletedCount = videosToDelete.length;
      const addedCount = videoFiles.length;
      let message = `${form.first_name} ${form.last_name} a été ${isEditing ? 'mis à jour' : 'enregistré'} avec succès.`;
      if (deletedCount > 0) message += ` ${deletedCount} vidéo(s) supprimée(s).`;
      if (addedCount > 0) message += ` ${addedCount} nouvelle(s) vidéo(s) ajoutée(s).`;
      
      onNotice(`✅ ${message}`);
      onSaved();
    } catch (err) {
      onNotice(`❌ ${err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'enregistrement.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingExisting) {
    return (
      <div className="page workspace-page" style={{ color: '#8e958d', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Loader2 size={16} className="spin" /> Chargement de la fiche…
      </div>
    );
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
        {/* Colonne principale du formulaire */}
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
            <label>Taille (cm)<input type="number" min={100} max={240} value={form.height_cm} onChange={(e) => update('height_cm', e.target.value)} placeholder="Ex: 176" /></label>
            <label>Poids (kg)<input type="number" min={25} max={160} value={form.weight_kg} onChange={(e) => update('weight_kg', e.target.value)} placeholder="Ex: 72" /></label>
          </div>
          <label>Biographie<textarea value={form.bio} onChange={(e) => update('bio', e.target.value)} placeholder="Parcours, points forts, style de jeu…" rows={4} /></label>

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
            <label>Email<input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="joueur@email.com" /></label>
            <label>Téléphone<input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+225 01 23 45 67" /></label>
          </div>
          <div className="form-two">
            <label>Nom du tuteur légal<input value={form.guardian_name} onChange={(e) => update('guardian_name', e.target.value)} /></label>
            <label>Téléphone du tuteur<input value={form.guardian_phone} onChange={(e) => update('guardian_phone', e.target.value)} /></label>
          </div>
          <div className="form-two">
            <label>École / Établissement<input value={form.school} onChange={(e) => update('school', e.target.value)} /></label>
            <label>N° de licence<input value={form.license_number} onChange={(e) => update('license_number', e.target.value)} /></label>
          </div>

          <button className="button button-primary" type="submit" disabled={submitting} style={{ marginTop: 16, width: '100%' }}>
            {submitting ? (
              <><Loader2 size={15} className="spin" /> Enregistrement…</>
            ) : (
              <><Save size={15} /> {isEditing ? 'Enregistrer les modifications' : 'Enregistrer le joueur'}</>
            )}
          </button>
        </div>

        {/* Colonne des médias */}
        <div className="content-card upload-card">
          <div className="upload-icon"><Upload size={20} /></div>
          <h3>Photo de profil</h3>
          {existingPhotoUrl && !photoFile && (
            <div style={{ marginBottom: 10 }}>
              <img 
                src={existingPhotoUrl} 
                alt="Photo actuelle" 
                style={{ width: '100%', maxWidth: 180, borderRadius: 10, display: 'block', marginBottom: 8 }} 
              />
              <small style={{ color: '#8e958d' }}>📸 Photo actuelle — choisissez un fichier pour la remplacer.</small>
            </div>
          )}
          <p>Format JPG, PNG ou WEBP, 10 Mo maximum.</p>
          <label className="button button-ghost" style={{ display: 'inline-flex', cursor: 'pointer' }}>
            <Upload size={15} /> {photoFile ? photoFile.name : existingPhotoUrl ? '🔄 Remplacer la photo' : 'Choisir une photo'}
            <input type="file" accept="image/*" hidden onChange={(e) => { 
              const file = e.target.files?.[0] ?? null;
              setPhotoFile(file);
              if (file) setExistingPhotoUrl(null);
            }} />
          </label>
          {photoFile && (
            <button 
              type="button" 
              onClick={() => { setPhotoFile(null); setExistingPhotoUrl(existingPlayer?.avatar_url ?? null); }}
              style={{ marginLeft: 8, background: 'none', border: 0, color: '#fca5a5', cursor: 'pointer', fontSize: 12 }}
            >
              Annuler
            </button>
          )}

          <hr style={{ borderColor: '#2a2f30', margin: '16px 0' }} />

          <h3 style={{ marginTop: 8 }}>🎬 Vidéos</h3>
          <p>MP4, MOV ou WEBM, 500 Mo maximum par fichier.</p>
          
          {/* Vidéos existantes */}
          {isEditing && existingVideos.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <label style={{ color: '#c5cbc0', fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 8 }}>
                Vidéos existantes ({existingVideos.filter(v => !v.toDelete).length})
              </label>
              <div className="verification-list">
                {existingVideos.map(video => {
                  const isMarked = video.toDelete;
                  return (
                    <span 
                      key={video.id} 
                      style={{ 
                        background: isMarked ? 'rgba(255,68,68,0.15)' : 'rgba(215,240,74,0.05)',
                        textDecoration: isMarked ? 'line-through' : 'none',
                        color: isMarked ? '#ff4444' : '#c5cbc0',
                        padding: '4px 10px',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 13,
                        border: isMarked ? '1px solid rgba(255,68,68,0.3)' : '1px solid rgba(215,240,74,0.1)',
                      }}
                    >
                      <span style={{ opacity: isMarked ? 0.5 : 1 }}>{video.title}</span>
                      <button 
                        type="button" 
                        onClick={() => toggleVideoDeletion(video.id)}
                        style={{ 
                          border: 0, 
                          color: isMarked ? '#d7f04a' : '#ff4444',
                          cursor: 'pointer',
                          fontSize: 12,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: isMarked ? 'rgba(215,240,74,0.1)' : 'rgba(255,68,68,0.1)'
                        }}
                      >
                        {isMarked ? '↩️ Annuler' : '🗑️ Supprimer'}
                      </button>
                    </span>
                  );
                })}
              </div>
              {existingVideos.some(v => v.toDelete) && (
                <p style={{ fontSize: 12, color: '#ff4444', marginTop: 6 }}>
                  ⚠️ Les vidéos marquées seront définitivement supprimées lors de l'enregistrement.
                </p>
              )}
            </div>
          )}

          {/* Upload de nouvelles vidéos */}
          <label className="button button-ghost" style={{ display: 'inline-flex', cursor: 'pointer', marginTop: 12 }}>
            <VideoIcon size={15} /> Ajouter des vidéos
            <input 
              type="file" 
              accept="video/*" 
              multiple 
              hidden 
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                // Filtrer les fichiers trop gros
                const validFiles = files.filter(f => f.size <= 500 * 1024 * 1024);
                const oversized = files.filter(f => f.size > 500 * 1024 * 1024);
                if (oversized.length > 0) {
                  onNotice(`⚠️ ${oversized.length} fichier(s) dépassent 500 Mo et ont été ignorés.`);
                }
                setVideoFiles((current) => [...current, ...validFiles]);
                e.target.value = '';
              }} 
            />
          </label>

          {/* Liste des nouvelles vidéos à ajouter */}
          {videoFiles.length > 0 && (
            <div className="verification-list" style={{ marginTop: 10 }}>
              <label style={{ color: '#d7f04a', fontSize: 12, display: 'block', marginBottom: 6 }}>
                Nouvelles vidéos à ajouter ({videoFiles.length})
              </label>
              {videoFiles.map((file, index) => (
                <span key={`${file.name}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 8px' }}>
                  <span style={{ fontSize: 12, color: '#c5cbc0' }}>📹 {file.name}</span>
                  <span style={{ fontSize: 11, color: '#6a7070' }}>{(file.size / (1024 * 1024)).toFixed(1)} Mo</span>
                  <button 
                    type="button" 
                    onClick={() => setVideoFiles((current) => current.filter((_, i) => i !== index))}
                    style={{ marginLeft: 4, background: 'none', border: 0, color: '#fca5a5', cursor: 'pointer' }}
                  >
                    <Trash2 size={13} style={{ verticalAlign: 'middle' }} />
                  </button>
                </span>
              ))}
              <button 
                type="button"
                onClick={() => setVideoFiles([])}
                style={{ fontSize: 11, color: '#ff4444', background: 'none', border: 0, cursor: 'pointer', marginTop: 4 }}
              >
                Tout supprimer
              </button>
            </div>
          )}

          <div style={{ marginTop: 16, padding: 12, background: '#2a2f30', borderRadius: 8 }}>
            <p style={{ fontSize: 12, color: '#6a7070', margin: 0 }}>
              💡 Les vidéos sont visibles dans la section "Vidéothèque" du joueur.
              {isEditing && existingVideos.length > 0 && ` ${existingVideos.filter(v => !v.toDelete).length} vidéo(s) actuellement associée(s).`}
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}