import { useEffect, useState } from 'react';
import { Search, ChevronDown, Globe2, Users, CalendarDays, ArrowRight, ArrowLeft, Heart, Send, ShieldCheck, Target, Clock3, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

export type DbOpportunity = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  country: string;
  city: string | null;
  min_age: number | null;
  max_age: number | null;
  deadline: string | null;
  organizations: { name: string } | null;
};

export function OpportunitiesPanel({ onNotice, onOpen }: { onNotice: (message: string) => void; onOpen: (opportunity: DbOpportunity) => void }) {
  const { isAdminOrAcademy } = useAuth();
  const [opportunities, setOpportunities] = useState<DbOpportunity[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'trial', country: '', city: '', description: '', min_age: '', max_age: '', deadline: '' });

  const load = async () => {
    const { data } = await supabase.from('opportunities').select('id, type, title, description, country, city, min_age, max_age, deadline, organizations(name)').eq('status', 'published').order('created_at', { ascending: false });
    setOpportunities((data as unknown as DbOpportunity[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isAdminOrAcademy) return onNotice('La publication est réservée aux administrateurs, académies et coachs vérifiés.');
    if (!form.title || !form.country) return onNotice('Le titre et le pays sont obligatoires.');
    const { error } = await supabase.from('opportunities').insert({
      title: form.title,
      type: form.type,
      country: form.country,
      city: form.city || null,
      description: form.description || null,
      min_age: form.min_age ? Number(form.min_age) : null,
      max_age: form.max_age ? Number(form.max_age) : null,
      deadline: form.deadline || null,
      status: 'published',
    });
    if (error) return onNotice(`Erreur : ${error.message}`);
    onNotice('Votre opportunité a été publiée.');
    setShowForm(false);
    setForm({ title: '', type: 'trial', country: '', city: '', description: '', min_age: '', max_age: '', deadline: '' });
    load();
  };

  return (
    <div className="page workspace-page">
      <div className="page-intro">
        <div>
          <div className="eyebrow">Le prochain rendez-vous</div>
          <h1>Opportunités</h1>
          <p>Trouvez des essais, camps et détections adaptés aux profils suivis.</p>
        </div>
        <button className="button button-primary" onClick={() => isAdminOrAcademy ? setShowForm(true) : onNotice('La publication est réservée aux organisations vérifiées.')}>Publier une opportunité</button>
      </div>

      {showForm && (
        <div className="content-card academy-form" style={{ marginBottom: 16 }}>
          <div className="eyebrow">Nouvelle opportunité</div>
          <form onSubmit={handleCreate}>
            <label>Titre *<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
            <div className="form-two">
              <label>Type
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="trial">Essai</option>
                  <option value="camp">Camp</option>
                  <option value="detection">Détection</option>
                  <option value="recruitment">Recrutement</option>
                  <option value="scholarship">Bourse</option>
                  <option value="event">Événement</option>
                </select>
              </label>
              <label>Date limite<input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></label>
            </div>
            <div className="form-two">
              <label>Pays *<input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required /></label>
              <label>Ville<input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
            </div>
            <div className="form-two">
              <label>Âge minimum<input type="number" value={form.min_age} onChange={(e) => setForm({ ...form, min_age: e.target.value })} /></label>
              <label>Âge maximum<input type="number" value={form.max_age} onChange={(e) => setForm({ ...form, max_age: e.target.value })} /></label>
            </div>
            <label>Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button className="button button-primary" type="submit">Publier</button>
              <button className="button button-ghost" type="button" onClick={() => setShowForm(false)}><X size={15} /> Annuler</button>
            </div>
          </form>
        </div>
      )}

      <div className="opportunity-filter">
        <div className="search-field"><Search size={17} /><input placeholder="Rechercher une opportunité..." /></div>
        <button className="select-small" onClick={() => onNotice('Filtre des pays ouvert.')}>Tous les pays <ChevronDown size={14} /></button>
        <button className="select-small" onClick={() => onNotice('Filtre des types ouvert.')}>Tous les types <ChevronDown size={14} /></button>
      </div>
      <div className="opportunity-grid">
        {opportunities.length === 0 && <p style={{ color: '#8e958d' }}>Aucune opportunité publiée pour le moment.</p>}
        {opportunities.map((opportunity) => (
          <article className="opportunity-card" key={opportunity.id}>
            <div className="opportunity-card-top"><span className="opportunity-type">{opportunity.type.toUpperCase()}</span></div>
            <h3>{opportunity.title}</h3>
            <p>{opportunity.organizations?.name ?? 'AfriTalents'}</p>
            <div className="opportunity-meta">
              <span><Globe2 size={13} />{opportunity.city ? `${opportunity.city}, ` : ''}{opportunity.country}</span>
              <span><Users size={13} />{opportunity.min_age && opportunity.max_age ? `U${opportunity.min_age}—U${opportunity.max_age}` : 'Tous âges'}</span>
              {opportunity.deadline && <span><CalendarDays size={13} />{new Date(opportunity.deadline).toLocaleDateString('fr-FR')}</span>}
            </div>
            <button className="profile-link" onClick={() => onOpen(opportunity)}>Voir les détails <ArrowRight size={15} /></button>
          </article>
        ))}
      </div>
    </div>
  );
}

export function OpportunityDetailPanel({ opportunity, onBack, onNotice }: { opportunity: DbOpportunity; onBack: () => void; onNotice: (message: string) => void }) {
  const { session } = useAuth();

  const handleFollow = async () => {
    if (!session) return onNotice('Connectez-vous pour suivre cette opportunité.');
    const { error } = await supabase.from('opportunity_follows').upsert({ opportunity_id: opportunity.id, user_id: session.user.id });
    onNotice(error ? `Erreur : ${error.message}` : 'Opportunité ajoutée à votre liste de suivi.');
  };

  const handleContact = async () => {
    if (!session) return onNotice('Connectez-vous pour demander un contact.');
    const { error } = await supabase.from('contact_requests').insert({ opportunity_id: opportunity.id, requester_id: session.user.id });
    onNotice(error ? `Erreur : ${error.message}` : 'Votre demande de contact a été envoyée.');
  };

  return (
    <div className="page workspace-page">
      <button className="back-link" onClick={onBack}><ArrowLeft size={14} /> Retour aux opportunités</button>
      <div className="detail-hero">
        <div>
          <span className="opportunity-type">{opportunity.type.toUpperCase()}</span>
          <h1>{opportunity.title}</h1>
          <p className="detail-lead">{opportunity.description ?? 'Aucune description fournie.'}</p>
          <div className="detail-organisation">
            <div className="organisation-logo">{(opportunity.organizations?.name ?? 'AT').slice(0, 2).toUpperCase()}</div>
            <div><strong>{opportunity.organizations?.name ?? 'AfriTalents'}</strong><span>Organisation vérifiée par AfriTalents</span></div>
            <ShieldCheck size={16} />
          </div>
        </div>
        <div className="detail-hero-art"><Target size={48} /><span>OPPORTUNITY<br />BRIEF</span></div>
      </div>
      <div className="detail-layout">
        <main>
          <div className="content-card">
            <div className="detail-facts">
              <div><CalendarDays size={16} /><span>Date limite<strong>{opportunity.deadline ? new Date(opportunity.deadline).toLocaleDateString('fr-FR') : 'Non précisée'}</strong></span></div>
              <div><Globe2 size={16} /><span>Lieu<strong>{opportunity.city ? `${opportunity.city}, ` : ''}{opportunity.country}</strong></span></div>
              <div><Users size={16} /><span>Éligibilité<strong>{opportunity.min_age && opportunity.max_age ? `U${opportunity.min_age}—U${opportunity.max_age}` : 'Tous âges'}</strong></span></div>
            </div>
          </div>
        </main>
        <aside className="detail-aside">
          <div className="content-card apply-card">
            <div className="eyebrow">Prochaine étape</div>
            <h3>Votre profil correspond-il ?</h3>
            <p>Ajoutez cette opportunité à votre suivi et préparez votre dossier.</p>
            <button className="button button-primary" onClick={handleFollow}><Heart size={15} /> Ajouter au suivi</button>
            <button className="button button-ghost" onClick={handleContact}><Send size={15} /> Demander un contact</button>
          </div>
          <div className="content-card">
            <div className="side-line"><ShieldCheck size={17} /><span><strong>Cadre vérifié</strong>Les organisations passent par un processus de vérification.</span></div>
            <div className="side-line"><Clock3 size={17} /><span><strong>Réponse rapide</strong>Recevez les prochaines informations dans votre messagerie.</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
