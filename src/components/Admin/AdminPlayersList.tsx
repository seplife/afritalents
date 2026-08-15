import { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, Users, Video, Pencil } from 'lucide-react';
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

  const loadPlayers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('players').select('*').order('created_at', { ascending: false });
    if (error) onNotice(`Impossible de charger les joueurs : ${error.message}`);
    setPlayers((data as DbPlayer[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadPlayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (player: DbPlayer) => {
    if (!window.confirm(`Supprimer définitivement la fiche de ${player.first_name} ${player.last_name} ? Ses photos, vidéos, statistiques et rapports associés seront également supprimés.`)) return;
    const { error } = await supabase.from('players').delete().eq('id', player.id);
    if (error) onNotice(`Suppression impossible : ${error.message}`);
    else {
      onNotice(`${player.first_name} ${player.last_name} a été supprimé.`);
      loadPlayers();
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
    return <AdminPlayerVideos player={videosFor} onBack={() => setVideosFor(null)} onNotice={onNotice} />;
  }

  return (
    <div className="page workspace-page">
      <div className="page-intro">
        <div>
          <div className="eyebrow">Administration</div>
          <h1>Gestion des joueurs</h1>
          <p>Toutes les fiches enregistrées dans votre base Supabase.</p>
        </div>
        <button className="button button-primary" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Ajouter
        </button>
      </div>

      <div className="list-card">
        <div className="list-card-heading">
          <div>
            <strong>Joueurs enregistrés</strong>
            <span>{players.length} fiche{players.length > 1 ? 's' : ''}</span>
          </div>
        </div>

        {loading && (
          <div style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 8, color: '#8e958d' }}>
            <Loader2 size={16} className="spin" /> Chargement…
          </div>
        )}

        {!loading && players.length === 0 && (
          <div style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 8, color: '#8e958d' }}>
            <Users size={16} /> Aucun joueur enregistré pour le moment. Cliquez sur « Ajouter » pour créer la première fiche.
          </div>
        )}

        {!loading && players.map((player) => (
          <div className="talent-list-row" key={player.id}>
            <span
              className="list-player-image"
              style={{ backgroundImage: player.avatar_url ? `url(${player.avatar_url})` : undefined, backgroundColor: '#2b3228' }}
            />
            <div className="talent-list-name">
              <strong>{player.first_name} {player.last_name}</strong>
              <span>{player.primary_position} · {player.country}</span>
            </div>
            <span className="status-pill green">{player.status === 'active' ? 'Actif' : player.status}</span>
            <div className="row-action-group">
              <button className="row-action-labelled" onClick={() => setEditingPlayer(player)} title="Modifier la fiche">
                <Pencil size={14} /> <span>Modifier</span>
              </button>
              <button className="row-action" onClick={() => setVideosFor(player)} title="Gérer les vidéos">
                <Video size={15} />
              </button>
              <button className="row-action-labelled danger" onClick={() => handleDelete(player)} title="Supprimer">
                <Trash2 size={14} /> <span>Supprimer</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
