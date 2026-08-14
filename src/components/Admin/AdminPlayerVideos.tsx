// components/Admin/AdminPlayerVideos.tsx
import { useEffect, useState } from 'react';
import { ArrowLeft, Play, Upload, X, Clock3, Pencil, Trash2, Loader2, Save } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import type { DbPlayer, DbPlayerVideo } from '../../lib/types';

type Props = {
  player: DbPlayer;
  onBack: () => void;
  onNotice: (message: string) => void;
  onRefresh?: () => void;
};

export function AdminPlayerVideos({ player, onBack, onNotice, onRefresh }: Props) {
  const { isAdminOrAcademy } = useAuth();
  const [videos, setVideos] = useState<DbPlayerVideo[]>([]);
  const [playing, setPlaying] = useState<DbPlayerVideo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingVideo, setEditingVideo] = useState<DbPlayerVideo | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVisibility, setEditVisibility] = useState<'public' | 'private' | 'unlisted' | 'network'>('public');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('player_videos')
      .select('*')
      .eq('player_id', player.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      onNotice(`❌ Erreur de chargement : ${error.message}`);
    }
    setVideos((data as DbPlayerVideo[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.id]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!isAdminOrAcademy) return onNotice('Seuls les administrateurs et académies peuvent ajouter des vidéos.');
    
    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const file of Array.from(files)) {
      // Vérifier la taille du fichier (500 Mo max)
      if (file.size > 500 * 1024 * 1024) {
        onNotice(`⚠️ ${file.name} dépasse 500 Mo.`);
        errorCount++;
        continue;
      }

      const path = `${player.id}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const { error: uploadError } = await supabase.storage.from('player-videos').upload(path, file);
      
      if (uploadError) {
        onNotice(`❌ Erreur pour « ${file.name} » : ${uploadError.message}`);
        errorCount++;
        continue;
      }
      
      const { data: publicUrl } = supabase.storage.from('player-videos').getPublicUrl(path);
      const { error: insertError } = await supabase.from('player_videos').insert({
        player_id: player.id,
        title: file.name.replace(/\.[^/.]+$/, ''),
        description: '',
        url: publicUrl.publicUrl,
        video_type: 'highlight',
        visibility: 'public',
      });

      if (insertError) {
        onNotice(`❌ Erreur d'enregistrement pour « ${file.name} »`);
        errorCount++;
      } else {
        successCount++;
      }
    }

    onNotice(`✅ ${successCount} vidéo(s) ajoutée(s)${errorCount > 0 ? `, ${errorCount} erreur(s)` : ''}`);
    setUploading(false);
    load();
    if (onRefresh) onRefresh();
  };

  const handleDeleteVideo = async (video: DbPlayerVideo) => {
    if (!isAdminOrAcademy) return onNotice('Action non autorisée.');
    if (!window.confirm(`⚠️ Supprimer définitivement la vidéo "${video.title}" ?\nCette action est irréversible.`)) return;

    try {
      // Extraire le chemin du fichier depuis l'URL
      const urlParts = video.url.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('player-videos') + 1).join('/');
      
      // Supprimer du storage
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('player-videos')
          .remove([filePath]);
        if (storageError) console.error('Storage delete error:', storageError);
      }

      // Supprimer de la base de données
      const { error: dbError } = await supabase
        .from('player_videos')
        .delete()
        .eq('id', video.id);

      if (dbError) throw dbError;

      onNotice(`✅ Vidéo "${video.title}" supprimée.`);
      if (playing?.id === video.id) setPlaying(null);
      load();
      if (onRefresh) onRefresh();
    } catch (error) {
      onNotice(`❌ Erreur lors de la suppression : ${error instanceof Error ? error.message : 'inconnue'}`);
    }
  };

  const handleEditVideo = (video: DbPlayerVideo) => {
    setEditingVideo(video);
    setEditTitle(video.title || '');
    setEditDescription(video.description || '');
    setEditVisibility(video.visibility || 'public');
  };

  const handleSaveEdit = async () => {
    if (!editingVideo || !isAdminOrAcademy) return;

    if (!editTitle.trim()) {
      onNotice('⚠️ Le titre ne peut pas être vide.');
      return;
    }

    try {
      const { error } = await supabase
        .from('player_videos')
        .update({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          visibility: editVisibility,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingVideo.id);

      if (error) throw error;

      onNotice(`✅ Vidéo "${editTitle}" mise à jour.`);
      setEditingVideo(null);
      load();
    } catch (error) {
      onNotice(`❌ Erreur de mise à jour : ${error instanceof Error ? error.message : 'inconnue'}`);
    }
  };

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'public': return '🌍 Public';
      case 'network': return '👥 Réseau';
      case 'private': return '🔒 Privé';
      case 'unlisted': return '🔗 Non répertorié';
      default: return visibility;
    }
  };

  const VideoEditForm = () => (
    <div className="video-edit-modal" onClick={() => setEditingVideo(null)}>
      <div className="video-edit-content" onClick={e => e.stopPropagation()}>
        <div className="video-edit-header">
          <h3>✏️ Modifier la vidéo</h3>
          <button className="close-btn" onClick={() => setEditingVideo(null)}>✕</button>
        </div>
        <div className="video-edit-body">
          <div className="form-group">
            <label>Titre *</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Titre de la vidéo"
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description de la vidéo..."
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>Visibilité</label>
            <select
              value={editVisibility}
              onChange={(e) => setEditVisibility(e.target.value as 'public' | 'private' | 'unlisted')}
            >
              <option value="public">🌍 Public (visible par tous)</option>
              <option value="private">🔒 Privé (visible par vous uniquement)</option>
              <option value="unlisted">🔗 Non répertorié (visible via lien direct)</option>
            </select>
          </div>
        </div>
        <div className="video-edit-footer">
          <button type="button" className="button button-ghost" onClick={() => setEditingVideo(null)}>
            Annuler
          </button>
          <button type="button" className="button button-primary" onClick={handleSaveEdit}>
            <Save size={15} /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page workspace-page">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={14} /> Retour aux joueurs
      </button>
      
      <div className="page-intro">
        <div>
          <div className="eyebrow">🎬 Observations vidéo</div>
          <h1>Vidéothèque — {player.first_name} {player.last_name}</h1>
          <p>
            {videos.length} vidéo{videos.length > 1 ? 's' : ''} enregistrée{videos.length > 1 ? 's' : ''} pour ce joueur.
          </p>
        </div>
        <label className="button button-primary" style={{ cursor: 'pointer' }}>
          <Upload size={15} /> {uploading ? 'Envoi…' : 'Ajouter une vidéo'}
          <input 
            type="file" 
            accept="video/*" 
            multiple 
            hidden 
            disabled={uploading} 
            onChange={(e) => handleUpload(e.target.files)} 
          />
        </label>
      </div>

      {/* Lecteur vidéo */}
      {playing && (
        <div className="content-card" style={{ marginBottom: 16, padding: 12 }}>
          <div className="content-card-heading">
            <div>
              <strong>{playing.title}</strong>
              <span style={{ fontSize: 12, color: '#8e958d', marginLeft: 12 }}>
                {getVisibilityLabel(playing.visibility)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="row-action" onClick={() => handleEditVideo(playing)} title="Modifier">
                <Pencil size={15} />
              </button>
              <button className="row-action danger" onClick={() => handleDeleteVideo(playing)} title="Supprimer">
                <Trash2 size={15} />
              </button>
              <button className="row-action" onClick={() => setPlaying(null)}>
                <X size={15} />
              </button>
            </div>
          </div>
          {playing.description && (
            <p style={{ color: '#c5cbc0', fontSize: 14, marginBottom: 10 }}>{playing.description}</p>
          )}
          <video 
            src={playing.url} 
            controls 
            autoPlay 
            style={{ width: '100%', borderRadius: 12, maxHeight: 480, background: '#000' }} 
          />
        </div>
      )}

      {/* Formulaire d'édition modale */}
      {editingVideo && <VideoEditForm />}

      {/* Liste des vidéos */}
      {loading ? (
        <div style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 8, color: '#8e958d' }}>
          <Loader2 size={16} className="spin" /> Chargement…
        </div>
      ) : videos.length === 0 ? (
        <div className="empty-state">
          <Play size={32} />
          <h3>Aucune vidéo pour ce joueur</h3>
          <p>Utilisez le bouton "Ajouter une vidéo" pour commencer.</p>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((video) => (
            <div className="video-card-wrapper" key={video.id}>
              <button className="video-card" onClick={() => setPlaying(video)}>
                <div className="video-thumb" style={{ 
                  backgroundImage: player.avatar_url ? `url(${player.avatar_url})` : undefined, 
                  backgroundColor: '#2b3228' 
                }}>
                  <span><Play size={14} fill="currentColor" /></span>
                  <div className="video-visibility-badge">
                    {video.visibility === 'public' ? '🌍' : video.visibility === 'private' ? '🔒' : '🔗'}
                  </div>
                </div>
                <div className="video-card-info">
                  <strong>{video.title}</strong>
                  <p>
                    <Clock3 size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {new Date(video.created_at).toLocaleDateString('fr-FR')}
                  </p>
                  {video.description && (
                    <p style={{ fontSize: 11, color: '#6a7070', marginTop: 2 }}>
                      {video.description.length > 60 ? video.description.slice(0, 60) + '…' : video.description}
                    </p>
                  )}
                </div>
              </button>
              <div className="video-card-actions">
                <button 
                  className="action-btn edit"
                  onClick={(e) => { e.stopPropagation(); handleEditVideo(video); }}
                  title="Modifier"
                >
                  <Pencil size={14} />
                </button>
                <button 
                  className="action-btn delete"
                  onClick={(e) => { e.stopPropagation(); handleDeleteVideo(video); }}
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}