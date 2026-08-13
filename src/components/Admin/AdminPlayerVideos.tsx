import { useEffect, useState } from 'react';
import { ArrowLeft, Play, Upload, X, Clock3 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import type { DbPlayer, DbPlayerVideo } from '../../lib/types';

export function AdminPlayerVideos({ player, onBack, onNotice }: { player: DbPlayer; onBack: () => void; onNotice: (message: string) => void }) {
  const { isAdminOrAcademy } = useAuth();
  const [videos, setVideos] = useState<DbPlayerVideo[]>([]);
  const [playing, setPlaying] = useState<DbPlayerVideo | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('player_videos').select('*').eq('player_id', player.id).order('created_at', { ascending: false });
    setVideos((data as DbPlayerVideo[]) ?? []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.id]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!isAdminOrAcademy) return onNotice('Seuls les administrateurs et académies peuvent ajouter des vidéos.');
    setUploading(true);
    for (const file of Array.from(files)) {
      const path = `${player.id}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const { error: uploadError } = await supabase.storage.from('player-videos').upload(path, file);
      if (uploadError) {
        onNotice(`Erreur pour « ${file.name} » : ${uploadError.message}`);
        continue;
      }
      const { data: publicUrl } = supabase.storage.from('player-videos').getPublicUrl(path);
      await supabase.from('player_videos').insert({
        player_id: player.id,
        title: file.name.replace(/\.[^/.]+$/, ''),
        url: publicUrl.publicUrl,
        video_type: 'highlight',
        visibility: 'public',
      });
    }
    onNotice('Vidéo(s) ajoutée(s).');
    setUploading(false);
    load();
  };

  return (
    <div className="page workspace-page">
      <button className="back-link" onClick={onBack}><ArrowLeft size={14} /> Retour aux joueurs</button>
      <div className="page-intro">
        <div>
          <div className="eyebrow">Observations vidéo</div>
          <h1>Vidéothèque — {player.first_name} {player.last_name}</h1>
          <p>Toutes les séquences enregistrées pour ce joueur.</p>
        </div>
        <label className="button button-primary" style={{ cursor: 'pointer' }}>
          <Upload size={15} /> {uploading ? 'Envoi…' : 'Ajouter une vidéo'}
          <input type="file" accept="video/*" multiple hidden disabled={uploading} onChange={(e) => handleUpload(e.target.files)} />
        </label>
      </div>

      {playing && (
        <div className="content-card" style={{ marginBottom: 16, padding: 12 }}>
          <div className="content-card-heading">
            <div><strong>{playing.title}</strong></div>
            <button className="row-action" onClick={() => setPlaying(null)}><X size={15} /></button>
          </div>
          <video src={playing.url} controls autoPlay style={{ width: '100%', borderRadius: 12, maxHeight: 480, background: '#000' }} />
        </div>
      )}

      <div className="video-grid">
        {videos.length === 0 && <p style={{ color: '#8e958d' }}>Aucune vidéo pour ce joueur pour le moment.</p>}
        {videos.map((video) => (
          <button className="video-card" key={video.id} onClick={() => setPlaying(video)}>
            <div className="video-thumb" style={{ backgroundImage: player.avatar_url ? `url(${player.avatar_url})` : undefined, backgroundColor: '#2b3228' }}>
              <span><Play size={14} fill="currentColor" /></span>
            </div>
            <strong>{video.title}</strong>
            <p><Clock3 size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{new Date(video.created_at).toLocaleDateString('fr-FR')} · {video.video_type}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
