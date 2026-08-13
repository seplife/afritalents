import { useEffect, useState } from 'react';
import { ShieldCheck, ArrowRight, X, Check } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import type { DbPlayer } from '../../lib/types';

const STATUS_LABELS: Record<string, string> = {
  contact_initial: 'Premier contact',
  authorization_required: 'Autorisation requise',
  negotiation: 'En négociation',
  document_check: 'Vérification documentaire',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

const STEPS = ['Premier contact', 'Autorisation', 'Négociation', 'Vérification', 'Finalisation'];

type Operation = {
  id: string;
  player_id: string;
  counterparty: string;
  status: string;
  target_date: string | null;
  players: { first_name: string; last_name: string } | null;
};

export function TransfersPanel({ onNotice }: { onNotice: (message: string) => void }) {
  const { session } = useAuth();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [players, setPlayers] = useState<DbPlayer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ player_id: '', counterparty: '', target_date: '', operation_type: 'trial' });

  const load = async () => {
    const [{ data: ops }, { data: playerRows }] = await Promise.all([
      supabase.from('transfer_operations').select('id, player_id, counterparty, status, target_date, players(first_name, last_name)').order('created_at', { ascending: false }),
      supabase.from('players').select('*').order('created_at', { ascending: false }),
    ]);
    setOperations((ops as unknown as Operation[]) ?? []);
    setPlayers((playerRows as DbPlayer[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const completedCount = operations.filter((o) => o.status === 'completed' || o.status === 'document_check' || o.status === 'negotiation').length;

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session) return onNotice('Connectez-vous pour créer une opération.');
    if (!form.player_id || !form.counterparty) return onNotice('Le joueur et la contrepartie sont obligatoires.');
    const { error } = await supabase.from('transfer_operations').insert({
      created_by: session.user.id,
      player_id: form.player_id,
      counterparty: form.counterparty,
      operation_type: form.operation_type,
      target_date: form.target_date || null,
    });
    if (error) return onNotice(`Erreur : ${error.message}`);
    onNotice('Nouvelle opération créée.');
    setShowForm(false);
    setForm({ player_id: '', counterparty: '', target_date: '', operation_type: 'trial' });
    load();
  };

  return (
    <div className="page workspace-page">
      <div className="page-intro">
        <div>
          <div className="eyebrow">Opérations sécurisées</div>
          <h1>Transfer Center</h1>
          <p>Suivez chaque étape d’une opportunité sans perdre le fil documentaire.</p>
        </div>
        <button className="button button-primary" onClick={() => setShowForm(true)}>Créer une opération</button>
      </div>

      {showForm && (
        <div className="content-card academy-form" style={{ marginBottom: 16 }}>
          <div className="eyebrow">Nouvelle opération</div>
          <form onSubmit={handleCreate}>
            <label>Joueur *
              <select value={form.player_id} onChange={(e) => setForm({ ...form, player_id: e.target.value })} required>
                <option value="">Sélectionner…</option>
                {players.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
              </select>
            </label>
            <label>Contrepartie (club, académie…) *<input value={form.counterparty} onChange={(e) => setForm({ ...form, counterparty: e.target.value })} required /></label>
            <div className="form-two">
              <label>Type
                <select value={form.operation_type} onChange={(e) => setForm({ ...form, operation_type: e.target.value })}>
                  <option value="trial">Essai</option>
                  <option value="transfer">Transfert</option>
                  <option value="loan">Prêt</option>
                  <option value="scholarship">Bourse</option>
                </select>
              </label>
              <label>Date cible<input type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} /></label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button className="button button-primary" type="submit">Créer</button>
              <button className="button button-ghost" type="button" onClick={() => setShowForm(false)}><X size={15} /> Annuler</button>
            </div>
          </form>
        </div>
      )}

      <div className="transfer-progress">
        <div className="transfer-progress-heading"><div><strong>Pipeline des opérations</strong><span>{operations.length} dossier(s) au total</span></div><span className="status-pill green">Vue sécurisée</span></div>
        <div className="steps">{STEPS.map((step, index) => <div className={index < Math.min(completedCount, STEPS.length) ? 'step done' : 'step'} key={step}><span>{index < completedCount ? <Check size={13} /> : index + 1}</span><small>{step}</small></div>)}</div>
      </div>

      <div className="list-card">
        <div className="list-card-heading"><div><strong>Dossiers actifs</strong><span>Opérations nécessitant votre attention</span></div></div>
        {operations.length === 0 && <div style={{ padding: 20, color: '#8e958d' }}>Aucune opération pour le moment.</div>}
        {operations.map((op) => (
          <div className="transfer-row" key={op.id}>
            <div className="transfer-icon"><ArrowRight size={16} /></div>
            <div className="talent-list-name"><strong>{op.players ? `${op.players.first_name} ${op.players.last_name}` : 'Joueur supprimé'}</strong><span>{op.counterparty}</span></div>
            <span className="status-pill yellow">{STATUS_LABELS[op.status] ?? op.status}</span>
            <span className="report-date">{op.target_date ? new Date(op.target_date).toLocaleDateString('fr-FR') : '—'}</span>
          </div>
        ))}
      </div>
      <div className="disclaimer"><ShieldCheck size={17} /><span>Aucune transaction financière ou contractuelle n’est simulée ici. Chaque étape nécessite les autorisations appropriées.</span></div>
    </div>
  );
}
