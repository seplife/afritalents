import { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle2, Target, Sparkles, ArrowRight, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import type { DbPlayer } from '../../lib/types';

type Report = {
  id: string;
  player_id: string;
  technical_score: number | null;
  strengths: string | null;
  weaknesses: string | null;
  recommendation: string | null;
  created_at: string;
  players: { first_name: string; last_name: string } | null;
};

function Kpi({ icon: Icon, label, value, trend, color }: { icon: typeof ClipboardList; label: string; value: string; trend: string; color: string }) {
  return <div className="kpi"><div className={`kpi-icon ${color}`}><Icon size={18} /></div><div><span>{label}</span><strong>{value}</strong><small>{trend}</small></div></div>;
}

export function ReportsPanel({ onNotice }: { onNotice: (message: string) => void }) {
  const { session } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [players, setPlayers] = useState<DbPlayer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [form, setForm] = useState({ player_id: '', technical_score: '', strengths: '', weaknesses: '', recommendation: '' });

  const load = async () => {
    const [{ data: reportRows }, { data: playerRows }] = await Promise.all([
      supabase.from('scouting_reports').select('id, player_id, technical_score, strengths, weaknesses, recommendation, created_at, players(first_name, last_name)').order('created_at', { ascending: false }).limit(10),
      supabase.from('players').select('*').order('created_at', { ascending: false }),
    ]);
    setReports((reportRows as unknown as Report[]) ?? []);
    setPlayers((playerRows as DbPlayer[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session) return onNotice('Connectez-vous pour rédiger un rapport.');
    if (!form.player_id) return onNotice('Sélectionnez un joueur.');
    const { error } = await supabase.from('scouting_reports').insert({
      scout_user_id: session.user.id,
      player_id: form.player_id,
      technical_score: form.technical_score ? Number(form.technical_score) : null,
      strengths: form.strengths || null,
      weaknesses: form.weaknesses || null,
      recommendation: form.recommendation || null,
    });
    if (error) return onNotice(`Erreur : ${error.message}`);
    onNotice('Le rapport a été enregistré.');
    setShowForm(false);
    setForm({ player_id: '', technical_score: '', strengths: '', weaknesses: '', recommendation: '' });
    load();
  };

  return (
    <div className="page workspace-page">
      <div className="page-intro">
        <div>
          <div className="eyebrow">Analyse professionnelle</div>
          <h1>Rapports scouting</h1>
          <p>Centralisez vos observations et partagez des analyses structurées.</p>
        </div>
        <button className="button button-primary" onClick={() => setShowForm(true)}>Nouveau rapport</button>
      </div>

      <div className="report-stats">
        <Kpi icon={ClipboardList} label="Rapports rédigés" value={String(reports.length)} trend="Total enregistré" color="lime" />
        <Kpi icon={CheckCircle2} label="Avec recommandation" value={String(reports.filter((r) => r.recommendation).length)} trend="Cette liste" color="blue" />
        <Kpi icon={Target} label="Joueurs suivis" value={String(players.length)} trend="Base de données" color="orange" />
      </div>

      {showForm && (
        <div className="content-card academy-form" style={{ marginBottom: 16 }}>
          <div className="eyebrow">Nouveau rapport</div>
          <form onSubmit={handleCreate}>
            <label>Joueur *
              <select value={form.player_id} onChange={(e) => setForm({ ...form, player_id: e.target.value })} required>
                <option value="">Sélectionner…</option>
                {players.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
              </select>
            </label>
            <label>Score technique (sur 100)<input type="number" min={1} max={100} value={form.technical_score} onChange={(e) => setForm({ ...form, technical_score: e.target.value })} /></label>
            <label>Points forts<textarea value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} /></label>
            <label>Axes de progression<textarea value={form.weaknesses} onChange={(e) => setForm({ ...form, weaknesses: e.target.value })} /></label>
            <label>Recommandation<textarea value={form.recommendation} onChange={(e) => setForm({ ...form, recommendation: e.target.value })} /></label>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button className="button button-primary" type="submit">Enregistrer</button>
              <button className="button button-ghost" type="button" onClick={() => setShowForm(false)}><X size={15} /> Annuler</button>
            </div>
          </form>
        </div>
      )}

      <div className="report-grid">
        <div className="list-card">
          <div className="list-card-heading"><div><strong>Derniers rapports</strong><span>Vos observations récentes</span></div></div>
          {reports.length === 0 && <div style={{ padding: 20, color: '#8e958d' }}>Aucun rapport pour le moment.</div>}
          {reports.map((report) => (
            <div className="report-row" key={report.id}>
              <div className="report-avatar">{report.players ? `${report.players.first_name[0]}${report.players.last_name[0]}` : '?'}</div>
              <div className="talent-list-name"><strong>{report.players ? `${report.players.first_name} ${report.players.last_name}` : 'Joueur supprimé'}</strong><span>{report.recommendation ?? 'Sans recommandation'}</span></div>
              <strong className="lime-text">{report.technical_score ?? '—'}</strong>
              <span className="report-date">{new Date(report.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          ))}
        </div>
        <div className="content-card report-tip">
          <Sparkles size={20} />
          <h3>Un bon rapport rend le potentiel lisible.</h3>
          <p>Décrivez les faits observés, séparez le niveau actuel du potentiel et gardez vos recommandations traçables.</p>
          <button className="button button-dark" onClick={() => setShowGuide(true)}>Voir le guide <ArrowRight size={15} /></button>
        </div>
      </div>

      {showGuide && (
        <div className="content-card" style={{ marginTop: 16 }}>
          <div className="content-card-heading"><div><div className="eyebrow">Guide</div><h2>Rédiger un bon rapport de scouting</h2></div>
            <button className="row-action" onClick={() => setShowGuide(false)}><X size={15} /></button>
          </div>
          <ul style={{ color: '#c5cbc0', lineHeight: 1.8, paddingLeft: 18 }}>
            <li>Décrivez des faits observés, pas des impressions générales.</li>
            <li>Séparez clairement le niveau actuel du potentiel estimé.</li>
            <li>Citez au moins un match ou une séquence concrète par point mentionné.</li>
            <li>Évitez les comparaisons avec des joueurs professionnels nommés.</li>
            <li>Terminez toujours par une recommandation claire et actionnable.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
