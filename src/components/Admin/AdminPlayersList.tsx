// components/Admin/AdminPlayersList.tsx
import { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, Users, Video, Pencil,  } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import type { DbPlayer } from '../../lib/types';
import { AdminPlayerForm } from './AdminPlayerForm';
import { AdminPlayerVideos } from './AdminPlayerVideos';

export function AdminPlayersList({ onNotice }: { onNotice: (message: string) => void }) {
  const [players, setPlayers] = useState<DbPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<DbPlayer | null>(null);
  const [videosFor, setVideosFor] = useState<DbPlayer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadPlayers = async () => {
    setLoading(true);
    let query = supabase.from('players').select('*').order('created_at', { ascending: false });
    
    if (searchTerm.trim()) {
      query = query.or(
        `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%,primary_position.ilike.%${searchTerm}%`
      );
    }
    
    const { data, error } = await query;
    if (error) onNotice(`Impossible de charger les joueurs : ${error.message}`);
    setPlayers((data as DbPlayer[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadPlayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleDelete = async (player: DbPlayer) => {
    if (!window.confirm(
      `⚠️ Supprimer définitivement la fiche de ${player.first_name} ${player.last_name} ?\n\n` +
      `Cette action supprimera également :\n` +
      `- Toutes les vidéos associées\n` +
      `- La photo de profil\n` +
      `- Les statistiques et évaluations\n` +
      `- Les rapports de scouting\n\n` +
      `Cette action est irréversible.`
    )) return;

    try {
      // 1. Récupérer les vidéos pour les supprimer du storage
      const { data: videos } = await supabase
        .from('player_videos')
        .select('url')
        .eq('player_id', player.id);

      if (videos && videos.length > 0) {
        for (const video of videos) {
          const urlParts = video.url.split('/');
          const filePath = urlParts.slice(urlParts.indexOf('player-videos') + 1).join('/');
          if (filePath) {
            await supabase.storage.from('player-videos').remove([filePath]);
          }
        }
      }

      // 2. Supprimer la photo du storage
      if (player.avatar_url) {
        const urlParts = player.avatar_url.split('/');
        const filePath = urlParts.slice(urlParts.indexOf('player-photos') + 1).join('/');
        if (filePath) {
          await supabase.storage.from('player-photos').remove([filePath]);
        }
      }

      // 3. Supprimer le joueur (cascade supprime les enregistrements associés)
      const { error } = await supabase.from('players').delete().eq('id', player.id);
      if (error) throw error;

      onNotice(`✅ ${player.first_name} ${player.last_name} a été supprimé.`);
      loadPlayers();
    } catch (error) {
      onNotice(`❌ Suppression impossible : ${error instanceof Error ? error.message : 'erreur inconnue'}`);
    }
  };


  if (showForm || editingPlayer) {
    return (
      <AdminPlayerForm
        onNotice={onNotice}
        existingPlayer={editingPlayer}
        onCancel={() => { setShowForm(false); setEditingPlayer(null); }}
        onSaved={() => {
          setShowForm(false);
          setEditingPlayer(null);
          loadPlayers();
        }}
      />
    );
  }

  if (videosFor) {
    return (
      <AdminPlayerVideos 
        player={videosFor} 
        onBack={() => setVideosFor(null)} 
        onNotice={onNotice}
        onRefresh={loadPlayers}
      />
    );
  }

  return (
    <div className="page workspace-page">
      <div className="page-intro">
        <div>
          <div className="eyebrow">Administration</div>
          <h1>Gestion des joueurs</h1>
          <p>
            {players.length} fiche{players.length > 1 ? 's' : ''} enregistrée{players.length > 1 ? 's' : ''} dans votre base Supabase.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="search-field" style={{ minWidth: 200 }}>
            <input
              type="text"
              placeholder="Rechercher un joueur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #2a2f30', background: '#1a1e1f', color: '#fff' }}
            />
          </div>
          <button className="button button-primary" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Ajouter un joueur
          </button>
        </div>
      </div>

      <div className="list-card">
        <div className="list-card-heading">
          <div>
            <strong>Joueurs enregistrés</strong>
            <span>{players.length} fiche{players.length > 1 ? 's' : ''}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="button button-ghost" onClick={loadPlayers} style={{ padding: '4px 12px', fontSize: 12 }}>
              🔄 Actualiser
            </button>
          </div>
        </div>

        {loading && (
          <div style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 8, color: '#8e958d' }}>
            <Loader2 size={16} className="spin" /> Chargement des joueurs…
          </div>
        )}

        {!loading && players.length === 0 && (
          <div className="empty-state" style={{ padding: 40 }}>
            <Users size={32} />
            <h3>Aucun joueur enregistré</h3>
            <p>Commencez par ajouter votre premier joueur en cliquant sur le bouton ci-dessus.</p>
          </div>
        )}

        {!loading && players.map((player) => (
          <div className="talent-list-row" key={player.id}>
            <span
              className="list-player-image"
              style={{ 
                backgroundImage: player.avatar_url ? `url(${player.avatar_url})` : undefined, 
                backgroundColor: '#2b3228' 
              }}
            />
            <div className="talent-list-name">
              <strong>{player.first_name} {player.last_name}</strong>
              <span>{player.primary_position} · {player.country}</span>
              {player.date_of_birth && (
                <span style={{ fontSize: 11, color: '#6a7070', marginLeft: 8 }}>
                  {new Date().getFullYear() - new Date(player.date_of_birth).getFullYear()} ans
                </span>
              )}
            </div>
            <span className={`status-pill ${player.status === 'active' ? 'green' : 'gray'}`}>
              {player.status === 'active' ? '✅ Actif' : player.status === 'inactive' ? '⏸️ Inactif' : player.status}
            </span>
            <div className="list-actions">
              <button 
                className="row-action" 
                onClick={() => setEditingPlayer(player)} 
                title="Modifier la fiche"
              >
                <Pencil size={15} />
              </button>
              <button 
                className="row-action" 
                onClick={() => setVideosFor(player)} 
                title="Gérer les vidéos"
              >
                <Video size={15} />
              </button>
              <button 
                className="row-action danger" 
                onClick={() => handleDelete(player)} 
                title="Supprimer"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="disclaimer" style={{ marginTop: 16 }}>
        <span style={{ fontSize: 12, color: '#6a7070' }}>
          💡 Les joueurs supprimés sont définitivement effacés de la base de données ainsi que leurs médias associés.
        </span>
      </div>
    </div>
  );
}