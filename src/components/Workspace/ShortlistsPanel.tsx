import { useEffect, useState } from 'react';
import { ShieldCheck, Search, X, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import type { DbPlayer } from '../../lib/types';

type Shortlist = { id: string; name: string };

export function ShortlistsPanel({ onNotice }: { onNotice: (message: string) => void }) {
  const { session } = useAuth();
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [allPlayers, setAllPlayers] = useState<DbPlayer[]>([]);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: lists }, { data: players }] = await Promise.all([
      supabase.from('shortlists').select('id, name').eq('owner_id', session.user.id).order('created_at', { ascending: false }),
      supabase.from('players').select('*').order('created_at', { ascending: false }),
    ]);
    setShortlists((lists as Shortlist[]) ?? []);
    setAllPlayers((players as DbPlayer[]) ?? []);
    const current = activeId ?? lists?.[0]?.id ?? null;
    setActiveId(current);
    if (current) {
      const { data: members } = await supabase.from('shortlist_players').select('player_id').eq('shortlist_id', current);
      setMemberIds((members ?? []).map((m) => m.player_id as string));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const handleNewShortlist = async () => {
    if (!session) return onNotice('Connectez-vous pour créer une shortlist.');
    const name = window.prompt('Nom de la nouvelle shortlist', 'Talents à suivre') || 'Nouvelle shortlist';
    const { data, error } = await supabase.from('shortlists').insert({ owner_id: session.user.id, name }).select().single();
    if (error) return onNotice(`Erreur : ${error.message}`);
    onNotice(`La shortlist « ${name} » a été créée.`);
    setShortlists((current) => [{ id: data.id, name: data.name }, ...current]);
    setActiveId(data.id);
    setMemberIds([]);
  };

  const switchList = async (id: string) => {
    setActiveId(id);
    const { data: members } = await supabase.from('shortlist_players').select('player_id').eq('shortlist_id', id);
    setMemberIds((members ?? []).map((m) => m.player_id as string));
  };

  const toggleMember = async (playerId: string) => {
    if (!activeId) return onNotice('Créez d’abord une shortlist.');
    if (memberIds.includes(playerId)) {
      await supabase.from('shortlist_players').delete().eq('shortlist_id', activeId).eq('player_id', playerId);
      setMemberIds((current) => current.filter((id) => id !== playerId));
      onNotice('Joueur retiré de la shortlist.');
    } else {
      await supabase.from('shortlist_players').insert({ shortlist_id: activeId, player_id: playerId });
      setMemberIds((current) => [...current, playerId]);
      onNotice('Joueur ajouté à la shortlist.');
    }
  };

  if (!session) {
    return (
      <div className="page workspace-page">
        <div className="disclaimer"><ShieldCheck size={17} /><span>Connectez-vous pour créer et gérer vos shortlists.</span></div>
      </div>
    );
  }

  const shortlistedPlayers = allPlayers.filter((p) => memberIds.includes(p.id));
  const availablePlayers = allPlayers.filter((p) => !memberIds.includes(p.id));

  return (
    <div className="page workspace-page">
      <div className="page-intro">
        <div>
          <div className="eyebrow">Suivi des talents</div>
          <h1>Mes shortlists</h1>
          <p>Organisez les profils qui méritent votre prochaine observation.</p>
        </div>
        <button className="button button-primary" onClick={handleNewShortlist}><Plus size={15} /> Nouvelle shortlist</button>
      </div>

      {shortlists.length > 1 && (
        <select className="select-small" value={activeId ?? ''} onChange={(e) => switchList(e.target.value)} style={{ marginBottom: 14 }}>
          {shortlists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}
        </select>
      )}

      {loading && <p style={{ color: '#8e958d' }}>Chargement…</p>}

      {!loading && !activeId && <p style={{ color: '#8e958d' }}>Créez votre première shortlist pour commencer.</p>}

      {!loading && activeId && (
        <>
          <div className="list-card">
            <div className="list-card-heading"><div><strong>Talents dans cette shortlist</strong><span>{shortlistedPlayers.length} joueur(s)</span></div></div>
            {shortlistedPlayers.length === 0 && <div style={{ padding: 20, color: '#8e958d' }}>Aucun joueur pour l’instant.</div>}
            {shortlistedPlayers.map((player) => (
              <div className="talent-list-row" key={player.id}>
                <span className="list-player-image" style={{ backgroundImage: player.avatar_url ? `url(${player.avatar_url})` : undefined, backgroundColor: '#2b3228' }} />
                <div className="talent-list-name"><strong>{player.first_name} {player.last_name}</strong><span>{player.primary_position} · {player.country}</span></div>
                <button className="row-action danger" onClick={() => toggleMember(player.id)}><X size={15} /></button>
              </div>
            ))}
          </div>

          <div className="list-card" style={{ marginTop: 16 }}>
            <div className="list-card-heading"><div><strong>Ajouter un joueur</strong><span>Tous les profils enregistrés</span></div></div>
            {availablePlayers.length === 0 && <div style={{ padding: 20, color: '#8e958d' }}>Tous les joueurs sont déjà dans cette shortlist, ou aucun joueur n’est encore enregistré.</div>}
            {availablePlayers.map((player) => (
              <div className="talent-list-row" key={player.id}>
                <span className="list-player-image" style={{ backgroundImage: player.avatar_url ? `url(${player.avatar_url})` : undefined, backgroundColor: '#2b3228' }} />
                <div className="talent-list-name"><strong>{player.first_name} {player.last_name}</strong><span>{player.primary_position} · {player.country}</span></div>
                <button className="row-action" onClick={() => toggleMember(player.id)}><Search size={15} /></button>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="disclaimer" style={{ marginTop: 16 }}>
        <ShieldCheck size={17} />
        <span>Les shortlists servent à organiser votre analyse. Elles ne constituent pas une recommandation définitive.</span>
      </div>
    </div>
  );
}
