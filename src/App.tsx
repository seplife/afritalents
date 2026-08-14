import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  Compass,
  FileText,
  Filter,
  Globe2,
  Heart,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Play,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
  X,
  Zap,
  Send,
  Upload,
  Plus,
  CheckCircle2,
  Share2,
  LogIn,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabaseClient';
import type { DbPlayer, DbPlayerProfile, DbPlayerStatistics, DbPlayerVideo } from './lib/types';
import { AuthPanel } from './components/AuthPanel';
import { AdminPlayersList } from './components/Admin/AdminPlayersList';
import { ShortlistsPanel } from './components/Workspace/ShortlistsPanel';
import { ReportsPanel } from './components/Workspace/ReportsPanel';
import { TransfersPanel } from './components/Workspace/TransfersPanel';
import { OpportunitiesPanel, OpportunityDetailPanel, type DbOpportunity } from './components/Workspace/OpportunitiesPanel';
import { MessagesPanel } from './components/Workspace/MessagesPanel';

type View = 'home' | 'talents' | 'dashboard' | 'profile' | 'shortlists' | 'reports' | 'transfers' | 'opportunities' | 'opportunity-detail' | 'stats' | 'videos' | 'academic' | 'messages' | 'academy' | 'login' | 'admin';
type Player = {
  id: string;
  dbId?: string;
  dateOfBirth?: string | null;
  weightKg?: number | null;
  name: string;
  initials: string;
  country: string;
  flag: string;
  position: string;
  age: number;
  academy: string;
  height: string;
  foot: string;
  sport: number;
  technicalScore?: number | null;
  tacticalScore?: number | null;
  physicalScore?: number | null;
  mentalScore?: number | null;
  academic: string;
  goals: number;
  assists: number;
  matches: number;
  image: string;
  accent: string;
};

const navItems = [
  { label: 'Vue d’ensemble', view: 'home' as View, icon: LayoutDashboard },
  { label: 'Découvrir les talents', view: 'talents' as View, icon: Compass },
  { label: 'Mon espace', view: 'dashboard' as View, icon: BarChart3 },
];

const COUNTRY_FLAGS: Record<string, string> = {
  "Côte d'Ivoire": 'CI', 'Côte d’Ivoire': 'CI', 'Sénégal': 'SN', 'Ghana': 'GH', 'Mali': 'ML',
  'Nigeria': 'NG', 'Cameroun': 'CM', 'Maroc': 'MA', 'Algérie': 'DZ', 'Tunisie': 'TN', 'Bénin': 'BJ',
  'Togo': 'TG', 'Burkina Faso': 'BF', 'Guinée': 'GN', 'RD Congo': 'CD', 'Congo': 'CG', 'Gabon': 'GA',
};

function mapDbPlayerToPlayer(
  dbPlayer: DbPlayer,
  profileRow: DbPlayerProfile | undefined,
  statsRow: DbPlayerStatistics | undefined,
  organizationName: string | undefined
): Player {
  const age = dbPlayer.date_of_birth
    ? Math.max(0, new Date().getFullYear() - new Date(dbPlayer.date_of_birth).getFullYear())
    : 17;
  const sportScore = profileRow
    ? Math.round(
        ([profileRow.technical_score, profileRow.tactical_score, profileRow.physical_score, profileRow.mental_score].filter(
          (v): v is number => v != null
        ).reduce((sum, v) => sum + v, 0) /
          Math.max(1, [profileRow.technical_score, profileRow.tactical_score, profileRow.physical_score, profileRow.mental_score].filter((v) => v != null).length)) || 0
      )
    : 75;
  return {
    id: dbPlayer.id,
    dbId: dbPlayer.id,
    dateOfBirth: dbPlayer.date_of_birth,
    weightKg: dbPlayer.weight_kg,
    name: `${dbPlayer.first_name} ${dbPlayer.last_name}`,
    initials: `${dbPlayer.first_name[0] ?? ''}${dbPlayer.last_name[0] ?? ''}`.toUpperCase(),
    country: dbPlayer.country,
    flag: COUNTRY_FLAGS[dbPlayer.country] ?? dbPlayer.country.slice(0, 2).toUpperCase(),
    position: dbPlayer.primary_position,
    age,
    academy: organizationName ?? 'Indépendant',
    height: dbPlayer.height_cm ? `${(dbPlayer.height_cm / 100).toFixed(2).replace('.', ',')} m` : '—',
    foot: dbPlayer.preferred_foot === 'left' ? 'Gauche' : dbPlayer.preferred_foot === 'both' ? 'Ambidextre' : 'Droit',
    sport: sportScore || 75,
    technicalScore: profileRow?.technical_score ?? null,
    tacticalScore: profileRow?.tactical_score ?? null,
    physicalScore: profileRow?.physical_score ?? null,
    mentalScore: profileRow?.mental_score ?? null,
    academic: dbPlayer.academic_score ?? '—',
    goals: statsRow?.goals ?? 0,
    assists: statsRow?.assists ?? 0,
    matches: statsRow?.matches ?? 0,
    image: dbPlayer.avatar_url || 'https://images.pexels.com/photos/8941656/pexels-photo-8941656.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    accent: '#d7f04a',
  };
}

function App() {
  const [view, setView] = useState<View>('home');
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState('Toutes les positions');
  const [country, setCountry] = useState('Tous les pays');
  const [sortBy, setSortBy] = useState<'potential' | 'name'>('potential');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState('');
  const [selectedOpportunity, setSelectedOpportunity] = useState<DbOpportunity | null>(null);
  const { session, profile, isAdminOrAcademy, signOut } = useAuth();

  useEffect(() => {
    let cancelled = false;
    async function loadRealPlayers() {
      const { data: playerRows } = await supabase.from('players').select('*, organizations(name)').eq('status', 'active').order('created_at', { ascending: false });
      if (cancelled) return;
      if (!playerRows || playerRows.length === 0) {
        setPlayers([]);
        setSelectedPlayer(null);
        setLoadingPlayers(false);
        return;
      }
      const ids = playerRows.map((p) => p.id as string);
      const [{ data: profileRows }, { data: statsRows }] = await Promise.all([
        supabase.from('player_profiles').select('*').in('player_id', ids),
        supabase.from('player_statistics').select('*').in('player_id', ids),
      ]);
      if (cancelled) return;
      const mapped = playerRows.map((row) => {
        const dbPlayer = row as unknown as DbPlayer;
        const org = (row as { organizations?: { name: string } | null }).organizations;
        const profileRow = (profileRows as DbPlayerProfile[] | null)?.find((p) => p.player_id === dbPlayer.id);
        const statsRow = (statsRows as DbPlayerStatistics[] | null)?.filter((s) => s.player_id === dbPlayer.id).sort((a, b) => b.season.localeCompare(a.season))[0];
        return mapDbPlayerToPlayer(dbPlayer, profileRow, statsRow, org?.name);
      });
      setPlayers(mapped);
      setSelectedPlayer((current) => mapped.find((p) => p.id === current?.id) ?? mapped[0] ?? null);
      setLoadingPlayers(false);
    }
    loadRealPlayers();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPlayers = useMemo(() => {
    const filtered = players.filter((player) => {
      const matchesQuery = `${player.name} ${player.country} ${player.academy} ${player.position}`.toLowerCase().includes(query.toLowerCase());
      const matchesPosition = position === 'Toutes les positions' || player.position === position;
      const matchesCountry = country === 'Tous les pays' || player.country === country;
      return matchesQuery && matchesPosition && matchesCountry;
    });
    return [...filtered].sort((a, b) => (sortBy === 'potential' ? b.sport - a.sport : a.name.localeCompare(b.name)));
  }, [players, position, query, country, sortBy]);

  const countryOptions = useMemo(() => ['Tous les pays', ...Array.from(new Set(players.map((p) => p.country)))], [players]);

  const goToProfile = (player: Player) => {
    setSelectedPlayer(player);
    setView('profile');
    setMobileMenu(false);
  };

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2800);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <div className="brand" onClick={() => setView('home')} role="button" tabIndex={0}>
          <div className="brand-mark"><img src="/Logo_academie.jpg" alt="Logo Galaxie" /></div>
          <div><strong>Galaxie</strong><span style={{color: '#d7f04a', fontSize: '12px'}}>Saint Koff</span></div>
        </div>
        <div className="workspace-label">ESPACE EXPLORATION</div>
        <nav className="side-nav">
          {navItems.map(({ label, view: itemView, icon: Icon }) => (
            <button key={label} className={view === itemView ? 'nav-item active' : 'nav-item'} onClick={() => { setView(itemView); setMobileMenu(false); }}>
              <Icon size={18} /><span>{label}</span>{itemView === 'talents' && players.length > 0 && <span className="nav-badge">{players.length}</span>}
            </button>
          ))}
          <button className={view === 'shortlists' ? 'nav-item active' : 'nav-item'} onClick={() => { setView('shortlists'); setMobileMenu(false); }}><Heart size={18} /><span>Mes shortlists</span></button>
          <button className={view === 'reports' ? 'nav-item active' : 'nav-item'} onClick={() => { setView('reports'); setMobileMenu(false); }}><ClipboardList size={18} /><span>Rapports scouting</span></button>
        </nav>
        <div className="workspace-label secondary">OUTILS</div>
        <nav className="side-nav">
          <button className={view === 'transfers' ? 'nav-item active' : 'nav-item'} onClick={() => { setView('transfers'); setMobileMenu(false); }}><ArrowRight size={18} /><span>Transfer Center</span></button>
          <button className={view === 'opportunities' ? 'nav-item active' : 'nav-item'} onClick={() => { setView('opportunities'); setMobileMenu(false); }}><Target size={18} /><span>Opportunités</span></button>
          <button className={view === 'messages' ? 'nav-item active' : 'nav-item'} onClick={() => { setView('messages'); setMobileMenu(false); }}><MessageSquare size={18} /><span>Messages</span></button>
        </nav>
        {isAdminOrAcademy && (
          <>
            <div className="workspace-label secondary">ADMINISTRATION</div>
            <nav className="side-nav">
              <button className={view === 'admin' ? 'nav-item active' : 'nav-item'} onClick={() => { setView('admin'); setMobileMenu(false); }}><ShieldCheck size={18} /><span>Gestion des joueurs</span></button>
            </nav>
          </>
        )}
        <div className="sidebar-bottom">
          <div className="verification-card"><ShieldCheck size={18} /><div><strong>Vos données sont protégées</strong><span>Conçu pour les talents mineurs</span></div></div>
          {session ? (
            <button className="user-mini user-mini-button" onClick={async () => { await signOut(); setMobileMenu(false); }}>
              <div className="avatar avatar-lime">{(profile?.full_name ?? session.user.email ?? 'U').slice(0, 2).toUpperCase()}</div>
              <div><strong>{profile?.full_name ?? session.user.email}</strong><span>{profile?.role === 'admin' ? 'Administrateur' : profile?.role === 'academy' ? 'Académie' : 'Scout'} · Déconnexion</span></div>
              <LogOut size={16} />
            </button>
          ) : (
            <button className="user-mini user-mini-button" onClick={() => { setView('login'); setMobileMenu(false); }}>
              <div className="avatar avatar-lime"><LogIn size={16} /></div>
              <div><strong>Se connecter</strong><span>Accéder à mon espace</span></div>
            </button>
          )}
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Ouvrir le menu"><Menu size={22} /></button>
          <div className="breadcrumbs"><span>Galaxie Sant Koff</span><span>/</span><strong>{view === 'home' ? 'Vue d’ensemble' : view === 'talents' ? 'Découvrir les talents' : view === 'profile' ? 'Profil joueur' : view === 'dashboard' ? 'Mon espace' : view === 'shortlists' ? 'Mes shortlists' : view === 'reports' ? 'Rapports scouting' : view === 'transfers' ? 'Transfer Center' : view === 'opportunities' ? 'Opportunités' : view === 'opportunity-detail' ? 'Détail de l’opportunité' : view === 'stats' ? 'Statistiques' : view === 'videos' ? 'Vidéothèque' : view === 'academic' ? 'Parcours académique' : view === 'messages' ? 'Messages' : view === 'admin' ? 'Administration' : view === 'login' ? 'Connexion' : 'Mon profil'}</strong></div>
          <div className="topbar-actions"><button className="icon-button" onClick={() => showNotice('Vous êtes à jour.')} aria-label="Notifications"><Bell size={18} /><span className="notification-dot" /></button><button className="help-button" onClick={() => showNotice('Notre équipe vous répondra prochainement.')}>Besoin d’aide ?</button><div className="avatar avatar-dark">GSK</div></div>
        </header>

        {view === 'home' && <Home players={players} loading={loadingPlayers} onExplore={() => setView('talents')} onProfile={() => players[0] && goToProfile(players[0])} onAcademy={() => setView('academy')} onNotice={showNotice} />}
        {view === 'talents' && <TalentExplorer query={query} setQuery={setQuery} position={position} setPosition={setPosition} country={country} setCountry={setCountry} countryOptions={countryOptions} sortBy={sortBy} setSortBy={setSortBy} players={filteredPlayers} totalCount={players.length} loading={loadingPlayers} onProfile={goToProfile} onNotice={showNotice} />}
        {view === 'profile' && selectedPlayer && <PlayerProfile player={selectedPlayer} onBack={() => setView('talents')} onNotice={showNotice} onTab={(tab) => setView(tab)} />}
        {view === 'stats' && selectedPlayer && <PlayerStats player={selectedPlayer} onBack={() => setView('profile')} />}
        {view === 'videos' && selectedPlayer && <VideoLibrary player={selectedPlayer} onBack={() => setView('profile')} onNotice={showNotice} />}
        {view === 'academic' && selectedPlayer && <AcademicPath player={selectedPlayer} onBack={() => setView('profile')} onNotice={showNotice} />}
        {(view === 'profile' || view === 'stats' || view === 'videos' || view === 'academic') && !selectedPlayer && (
          <div className="page workspace-page">
            <div className="disclaimer"><ShieldAlert size={17} /><span>Aucun joueur sélectionné. Choisissez un profil depuis « Découvrir les talents ».</span></div>
            <button className="button button-primary" style={{ marginTop: 14 }} onClick={() => setView('talents')}>Découvrir les talents <ArrowRight size={15} /></button>
          </div>
        )}
        {view === 'dashboard' && <Dashboard players={players} onExplore={() => setView('talents')} onNavigate={setView} />}
        {view === 'shortlists' && <ShortlistsPanel onNotice={showNotice} />}
        {view === 'reports' && <ReportsPanel onNotice={showNotice} />}
        {view === 'transfers' && <TransfersPanel onNotice={showNotice} />}
        {view === 'opportunities' && <OpportunitiesPanel onNotice={showNotice} onOpen={(opportunity) => { setSelectedOpportunity(opportunity); setView('opportunity-detail'); }} />}
        {view === 'opportunity-detail' && selectedOpportunity && <OpportunityDetailPanel opportunity={selectedOpportunity} onBack={() => setView('opportunities')} onNotice={showNotice} />}
        {view === 'messages' && <MessagesPanel onNotice={showNotice} />}
        {view === 'login' && <AuthPanel onNotice={showNotice} />}
        {view === 'admin' && (isAdminOrAcademy ? <AdminPlayersList onNotice={showNotice} /> : (
          <div className="page workspace-page">
            <div className="disclaimer"><ShieldAlert size={17} /><span>Cette section est réservée aux comptes administrateur ou académie. {session ? 'Votre compte n’a pas ce rôle.' : 'Connectez-vous avec un compte autorisé.'}</span></div>
          </div>
        ))}
        {view === 'academy' && <AcademyRegistration onNotice={showNotice} />}
      </main>
      {notice && <div className="toast"><Check size={17} />{notice}<button onClick={() => setNotice('')}><X size={14} /></button></div>}
    </div>
  );
}

function Home({ players, loading, onExplore, onProfile, onAcademy, onNotice }: { players: Player[]; loading: boolean; onExplore: () => void; onProfile: () => void; onAcademy: () => void; onNotice: (message: string) => void }) {
  const [opportunityCount, setOpportunityCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.from('opportunities').select('id', { count: 'exact', head: true }).eq('status', 'published').then(({ count }) => {
      if (!cancelled) setOpportunityCount(count ?? 0);
    });
    return () => { cancelled = true; };
  }, []);

  const countryCount = new Set(players.map((p) => p.country)).size;
  const academyCount = new Set(players.map((p) => p.academy)).size;
  const avgSport = players.length ? Math.round(players.reduce((sum, p) => sum + p.sport, 0) / players.length) : null;
  const academicValues = players.map((p) => parseFloat(p.academic.replace(',', '.'))).filter((v) => !Number.isNaN(v));
  const avgAcademic = academicValues.length ? (academicValues.reduce((s, v) => s + v, 0) / academicValues.length) : null;
  const topPlayer = players.length ? [...players].sort((a, b) => b.sport - a.sport)[0] : null;

  return <div className="page home-page">
    <section className="hero-grid">
      <div className="hero-copy"><div className="eyebrow"><span className="pulse" />Réseau africain de talents</div><h1>Les talents africains méritent <em>d’être vus.</em></h1><p>Découvrez, développez et connectez les jeunes footballeurs africains aux académies, scouts et clubs du monde entier.</p><div className="hero-actions"><button className="button button-primary" onClick={onExplore}>Explorer les talents <ArrowRight size={17} /></button><button className="button button-ghost" onClick={onAcademy}>Inscrire mon académie</button></div><div className="hero-proof"><div className="proof-avatars"><span className="avatar avatar-photo photo-one" /><span className="avatar avatar-photo photo-two" /><span className="avatar avatar-photo photo-three" /></div><div><strong>{loading ? '—' : `${players.length} profil${players.length > 1 ? 's' : ''} enregistré${players.length > 1 ? 's' : ''}`}</strong><span>{countryCount > 0 ? `dans ${countryCount} pays` : 'Base de données en cours de constitution'}</span></div></div></div>
      <div className="hero-visual"><div className="hero-photo" /><div className="hero-photo-overlay" />{!loading && players.length > 0 && <div className="hero-stat hero-stat-top"><div className="stat-icon stat-icon-lime"><TrendingUp size={17} /></div><div><span>Score sportif moyen</span><strong>{avgSport}/100</strong></div></div>}{topPlayer ? <div className="hero-card-float"><div className="float-label"><span className="live-dot" />Talent du moment</div><div className="float-player"><div className="mini-player-photo" style={{ backgroundImage: `url(${topPlayer.image})`, backgroundSize: 'cover' }} /><div><strong>{topPlayer.name}</strong><span>{topPlayer.position} · {topPlayer.age} ans</span><small><span className="flag-dot">{topPlayer.flag}</span> {topPlayer.country}</small></div><div className="score-ring">{topPlayer.sport}<small>SPORT</small></div></div><div className="float-divider" /><div className="float-footer"><span>Score sportif</span><strong>{topPlayer.sport} <small>/ 100</small></strong></div></div> : !loading && <div className="hero-card-float"><div className="float-label">Aucun joueur enregistré</div><p style={{ color: '#c5cbc0', fontSize: 13, marginTop: 8 }}>Ajoutez votre premier joueur depuis l’espace Administration.</p></div>}<div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /></div>
    </section>

    <section className="metrics-row"><Metric icon={Users} value={loading ? '—' : String(players.length)} label="Talents référencés" trend="Base de données" /><Metric icon={Globe2} value={loading ? '—' : String(countryCount)} label="Pays représentés" trend="Afrique & diaspora" /><Metric icon={Building2} value={loading ? '—' : String(academyCount)} label="Académies partenaires" trend="Enregistrées" /><Metric icon={Trophy} value={opportunityCount === null ? '—' : String(opportunityCount)} label="Opportunités actives" trend="Publiées" /></section>

    <section className="section-block featured-section"><div className="section-heading"><div><div className="eyebrow">Sélection</div><h2>Talents à la une</h2><p>Les profils les mieux évalués actuellement enregistrés dans la base.</p></div><button className="text-button" onClick={onExplore}>Voir tous les talents <ArrowRight size={16} /></button></div>{loading ? <p style={{ color: '#8e958d' }}>Chargement…</p> : players.length === 0 ? <div className="empty-state"><Users size={26} /><h3>Aucun joueur enregistré</h3><p>Les profils apparaîtront ici dès qu’un administrateur en aura ajouté depuis l’espace Administration.</p></div> : <div className="player-grid">{[...players].sort((a, b) => b.sport - a.sport).slice(0, 3).map((player) => <PlayerCard key={player.id} player={player} onProfile={onProfile} />)}</div>}</section>

    <section className="double-section"><div className="insight-card"><div className="card-topline"><div className="eyebrow">Le double projet</div><BookOpen size={19} /></div><h3>Former le joueur<br /><em>sans sacrifier l’élève.</em></h3><p>Un dossier unique pour suivre la progression sportive et académique de chaque jeune talent.</p><div className="progress-pair"><div><span>Score sportif moyen</span><strong>{avgSport ?? '—'}<span>/100</span></strong><div className="progress-track"><i style={{ width: `${avgSport ?? 0}%` }} /></div></div><div><span>Score académique moyen</span><strong>{avgAcademic != null ? avgAcademic.toFixed(1).replace('.', ',') : '—'}<span>/20</span></strong><div className="progress-track orange"><i style={{ width: `${avgAcademic != null ? (avgAcademic / 20) * 100 : 0}%` }} /></div></div></div><button className="button button-dark" onClick={onAcademy}>Découvrir le parcours <ArrowRight size={16} /></button></div><div className="story-card"><div className="story-image" /><div className="story-overlay" /><div className="story-content"><div className="eyebrow light">African talent stories</div><h3>Chaque parcours<br />commence quelque part.</h3><button className="circle-button" onClick={() => onNotice('Les histoires de talents arrivent prochainement.')}><Play size={17} fill="currentColor" /></button><span className="story-caption">Bientôt disponible<br /><small>Récits de parcours réels</small></span></div></div></section>

    <div className="disclaimer"><ShieldCheck size={17} /><span>Les scores et projections sont des outils d’aide à l’analyse. Ils ne garantissent ni recrutement, ni transfert, ni carrière professionnelle.</span></div>
  </div>;
}

function TalentExplorer({
  query, setQuery, position, setPosition, country, setCountry, countryOptions, sortBy, setSortBy, players, totalCount, loading, onProfile, onNotice,
}: {
  query: string; setQuery: (value: string) => void;
  position: string; setPosition: (value: string) => void;
  country: string; setCountry: (value: string) => void;
  countryOptions: string[];
  sortBy: 'potential' | 'name'; setSortBy: (value: 'potential' | 'name') => void;
  players: Player[]; totalCount: number; loading: boolean;
  onProfile: (player: Player) => void; onNotice: (message: string) => void;
}) {
  const { session } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [savingAlert, setSavingAlert] = useState(false);

  const activeFilters: { label: string; clear: () => void }[] = [];
  if (query.trim()) activeFilters.push({ label: `« ${query.trim()} »`, clear: () => setQuery('') });
  if (position !== 'Toutes les positions') activeFilters.push({ label: position, clear: () => setPosition('Toutes les positions') });
  if (country !== 'Tous les pays') activeFilters.push({ label: country, clear: () => setCountry('Tous les pays') });

  const resetAll = () => { setQuery(''); setPosition('Toutes les positions'); setCountry('Tous les pays'); };

  const handleSaveAlert = async () => {
    if (!session) return onNotice('Connectez-vous pour enregistrer une alerte de recherche.');
    setSavingAlert(true);
    const { error } = await supabase.from('talent_alerts').insert({
      user_id: session.user.id,
      query: query.trim() || null,
      position: position === 'Toutes les positions' ? null : position,
      country: country === 'Tous les pays' ? null : country,
    });
    setSavingAlert(false);
    onNotice(error ? `Erreur : ${error.message}` : 'Votre alerte de recherche a été enregistrée.');
  };

  return (
    <div className="page explorer-page">
      <div className="page-intro">
        <div><div className="eyebrow">Base de talents</div><h1>Découvrir les talents</h1><p>Explorez les profils qui façonnent le prochain chapitre du football africain.</p></div>
        <button className="button button-primary" onClick={handleSaveAlert} disabled={savingAlert}><SlidersHorizontal size={17} /> {savingAlert ? 'Enregistrement…' : 'Enregistrer une alerte'}</button>
      </div>
      <div className="explorer-toolbar">
        <div className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un nom, une académie, un pays..." /></div>
        <div className="select-field"><Filter size={16} /><select value={position} onChange={(event) => setPosition(event.target.value)}><option>Toutes les positions</option><option>Ailier droit</option><option>Ailier gauche</option><option>Milieu central</option><option>Milieu défensif</option><option>Défenseur central</option><option>Attaquant</option><option>Gardien</option></select><ChevronDown size={15} /></div>
        <button className="filter-button" onClick={() => setShowFilters((v) => !v)}><Filter size={17} /> Filtres avancés {activeFilters.length > 0 && <span>{activeFilters.length}</span>}</button>
      </div>
      {showFilters && (
        <div className="content-card" style={{ marginBottom: 14, padding: 16 }}>
          <label>Pays<select value={country} onChange={(e) => setCountry(e.target.value)}>{countryOptions.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
        </div>
      )}
      {activeFilters.length > 0 && (
        <div className="active-filters">
          {activeFilters.map((f) => <span key={f.label} onClick={f.clear} style={{ cursor: 'pointer' }}>{f.label} <X size={13} /></span>)}
          <button onClick={resetAll}>Réinitialiser</button>
        </div>
      )}
      <div className="result-heading">
        <strong>{players.length}<span> / {totalCount} talent{totalCount > 1 ? 's' : ''}</span></strong>
        <button className="sort-button" onClick={() => setSortBy(sortBy === 'potential' ? 'name' : 'potential')}>
          Trier par : <b>{sortBy === 'potential' ? 'Score de potentiel' : 'Nom (A → Z)'}</b><ChevronDown size={14} />
        </button>
      </div>
      <div className="player-grid explorer-grid">
        {loading ? (
          <p style={{ color: '#8e958d' }}>Chargement…</p>
        ) : players.length ? players.map((player) => <PlayerCard key={player.id} player={player} onProfile={onProfile} />) : (
          <div className="empty-state"><Search size={26} /><h3>{totalCount === 0 ? 'Aucun joueur enregistré' : 'Aucun talent trouvé'}</h3><p>{totalCount === 0 ? 'Les profils apparaîtront ici dès qu’un administrateur en aura ajouté depuis l’espace Administration.' : 'Essayez une autre recherche ou retirez un filtre.'}</p></div>
        )}
      </div>
    </div>
  );
}

function PlayerCard({ player, onProfile }: { player: Player; onProfile: (player: Player) => void }) {
  return <article className="player-card"><div className="player-card-image" style={{ backgroundImage: `url(${player.image})` }}><div className="card-image-shade" /><div className="verified-badge"><ShieldCheck size={13} /> Vérifié</div><button className="favorite-button" aria-label="Ajouter aux favoris" onClick={() => onProfile(player)}><Heart size={17} /></button><div className="card-location"><span className="flag-dot">{player.flag}</span>{player.country}</div></div><div className="player-card-body"><div className="player-name-row"><div><h3>{player.name}</h3><span>{player.position} · U{player.age < 16 ? '15' : player.age < 18 ? '17' : '19'}</span></div><div className="potential-score"><strong>{player.sport}</strong><span>SPORT</span></div></div><div className="academy-line"><Building2 size={14} />{player.academy}</div><div className="player-facts"><span>{player.height}</span><span>Pied {player.foot.toLowerCase()}</span></div><div className="card-stats"><div><strong>{player.goals}</strong><span>Buts</span></div><div><strong>{player.assists}</strong><span>Passes</span></div><div><strong>{player.matches}</strong><span>Matchs</span></div><div><strong>{player.academic}</strong><span>Académique</span></div></div><button className="profile-link" onClick={() => onProfile(player)}>Voir le profil <ArrowRight size={15} /></button></div></article>;
}

function PlayerProfile({ player, onBack, onNotice, onTab }: { player: Player; onBack: () => void; onNotice: (message: string) => void; onTab: (tab: 'stats' | 'videos' | 'academic') => void }) {
  const { session } = useAuth();
  const [videoCount, setVideoCount] = useState<number | null>(null);
  const [inShortlist, setInShortlist] = useState(false);
  const [sendingContact, setSendingContact] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!player.dbId) return;
      const { count } = await supabase.from('player_videos').select('id', { count: 'exact', head: true }).eq('player_id', player.dbId);
      if (!cancelled) setVideoCount(count ?? 0);
      if (session) {
        const { data: memberships } = await supabase.from('shortlist_players').select('shortlist_id, shortlists!inner(owner_id)').eq('player_id', player.dbId).eq('shortlists.owner_id', session.user.id);
        if (!cancelled) setInShortlist((memberships?.length ?? 0) > 0);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [player.dbId, session]);

  const handleContact = async () => {
    if (!session) return onNotice('Connectez-vous pour demander un contact.');
    if (!player.dbId) return onNotice('Ce profil de démonstration n’est pas relié à une fiche réelle.');
    setSendingContact(true);
    const { error } = await supabase.from('player_contact_requests').insert({ player_id: player.dbId, requester_id: session.user.id });
    setSendingContact(false);
    onNotice(error ? `Erreur : ${error.message}` : 'Votre demande de contact a été envoyée à l’académie.');
  };

  const handleShortlistToggle = async () => {
    if (!session) return onNotice('Connectez-vous pour ajouter ce talent à une shortlist.');
    if (!player.dbId) return onNotice('Ce profil de démonstration n’est pas relié à une fiche réelle.');
    if (inShortlist) {
      const { data: lists } = await supabase.from('shortlists').select('id').eq('owner_id', session.user.id);
      const listIds = (lists ?? []).map((l) => l.id);
      if (listIds.length) await supabase.from('shortlist_players').delete().eq('player_id', player.dbId).in('shortlist_id', listIds);
      setInShortlist(false);
      onNotice('Talent retiré de vos shortlists.');
      return;
    }
    let { data: defaultList } = await supabase.from('shortlists').select('id').eq('owner_id', session.user.id).order('created_at', { ascending: true }).limit(1).maybeSingle();
    if (!defaultList) {
      const { data: created } = await supabase.from('shortlists').insert({ owner_id: session.user.id, name: 'Ma shortlist' }).select().single();
      defaultList = created;
    }
    if (!defaultList) return onNotice('Impossible de créer votre shortlist.');
    const { error } = await supabase.from('shortlist_players').insert({ shortlist_id: defaultList.id, player_id: player.dbId });
    if (error) return onNotice(`Erreur : ${error.message}`);
    setInShortlist(true);
    onNotice('Talent ajouté à votre shortlist.');
  };

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}#player-${player.id}`;
    try {
      await navigator.clipboard.writeText(url);
      onNotice('Le lien du profil a été copié dans le presse-papiers.');
    } catch {
      onNotice(url);
    }
  };

  return <div className="page profile-page"><button className="back-link" onClick={onBack}>← Retour aux talents</button><section className="profile-hero"><div className="profile-image" style={{ backgroundImage: `url(${player.image})` }} /><div className="profile-summary"><div className="verified-line"><ShieldCheck size={15} /> Profil vérifié</div><h1>{player.name}</h1><p className="profile-position">{player.position} <span>·</span> U{player.age < 18 ? '17' : '19'} <span>·</span> {player.age} ans</p><p className="profile-academy"><Building2 size={16} /> {player.academy} <span className="flag-dot">{player.flag}</span> {player.country}</p><div className="profile-actions"><button className="button button-primary" onClick={handleContact} disabled={sendingContact}>{sendingContact ? 'Envoi…' : 'Demander le contact'} <ArrowRight size={16} /></button><button className="icon-button large" onClick={handleShortlistToggle} style={inShortlist ? { color: '#d7f04a', borderColor: '#d7f04a' } : undefined}><Heart size={18} fill={inShortlist ? 'currentColor' : 'none'} /></button><button className="icon-button large" onClick={handleShare}><Share2 size={17} /></button></div></div><div className="profile-score-card"><span>Score sportif</span><strong>{player.sport}<small>/100</small></strong><div className="score-bar"><i style={{ width: `${player.sport}%` }} /></div><em>Évaluation indicative</em></div></section><div className="profile-tabs"><button className="active">Vue d’ensemble</button><button onClick={() => onTab('stats')}>Statistiques</button><button onClick={() => onTab('videos')}>Vidéothèque {videoCount !== null && <span>{videoCount}</span>}</button><button onClick={() => onTab('academic')}>Parcours académique</button></div><section className="profile-content"><div className="profile-main-column"><div className="content-card"><div className="content-card-heading"><div><div className="eyebrow">Identité sportive</div><h2>Le profil en un regard</h2></div></div><div className="identity-grid"><DataPoint label="Nom complet" value={player.name} /><DataPoint label="Date de naissance" value={player.dateOfBirth ? new Date(player.dateOfBirth).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Non renseignée'} /><DataPoint label="Nationalité" value={player.country} /><DataPoint label="Taille / poids" value={`${player.height} · ${player.weightKg ? `${player.weightKg} kg` : 'poids non renseigné'}`} /><DataPoint label="Pied fort" value={`Pied ${player.foot.toLowerCase()}`} /><DataPoint label="Poste principal" value={player.position} /></div></div><div className="content-card"><div className="content-card-heading"><div><div className="eyebrow">Saison 2025/26</div><h2>Production sur le terrain</h2></div></div><div className="performance-grid"><Performance value={player.matches} label="Matchs" /><Performance value={player.goals} label="Buts" highlight /><Performance value={player.assists} label="Passes décisives" /></div><div className="chart-placeholder"><div className="chart-label"><span>Progression du niveau sportif</span><strong>+12,6% <TrendingUp size={14} /></strong></div><div className="chart-lines"><i /><i /><i /><i /><i /></div><svg viewBox="0 0 600 130" preserveAspectRatio="none" className="line-chart"><path d="M0,110 C35,103 45,89 80,96 C116,102 132,76 167,82 C202,88 212,61 248,67 C284,74 306,42 344,49 C385,57 391,74 427,54 C466,33 482,45 516,27 C548,11 568,24 600,7" fill="none" stroke="#b7d832" strokeWidth="3" /><path d="M0,110 C35,103 45,89 80,96 C116,102 132,76 167,82 C202,88 212,61 248,67 C284,74 306,42 344,49 C385,57 391,74 427,54 C466,33 482,45 516,27 C548,11 568,24 600,7 L600,130 L0,130 Z" fill="url(#chartFill)" opacity=".25" /><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#d7f04a" /><stop offset="1" stopColor="#d7f04a" stopOpacity="0" /></linearGradient></defs></svg><div className="chart-months"><span>Août</span><span>Sept.</span><span>Oct.</span><span>Nov.</span><span>Déc.</span><span>Janv.</span><span>Févr.</span></div></div></div></div><aside className="profile-side-column"><div className="content-card double-project-card"><div className="eyebrow">Double projet</div><h3>Sport & études</h3><p>Un talent complet se construit sur et en dehors du terrain.</p><div className="index-row"><div className="index-icon lime"><Zap size={17} /></div><div><span>Sport performance index</span><strong>{player.sport}<small>/100</small></strong></div></div><div className="index-row"><div className="index-icon orange"><BookOpen size={17} /></div><div><span>Academic performance index</span><strong>{player.academic}<small> moyenne</small></strong></div></div><button className="text-button" onClick={() => onTab('academic')}>Voir le dossier académique <ArrowRight size={15} /></button></div></aside></section></div>;
}

function Dashboard({ players, onExplore, onNavigate }: { players: Player[]; onExplore: () => void; onNavigate: (view: View) => void }) {
  const { session, profile } = useAuth();
  const [kpis, setKpis] = useState({ shortlisted: 0, reports: 0, upcoming: 0 });
  const [upcoming, setUpcoming] = useState<{ id: string; label: string; sub: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!session) {
        setLoading(false);
        return;
      }
      const [{ data: lists }, { count: reportsCount }, { data: operations }] = await Promise.all([
        supabase.from('shortlists').select('id').eq('owner_id', session.user.id),
        supabase.from('scouting_reports').select('id', { count: 'exact', head: true }).eq('scout_user_id', session.user.id),
        supabase.from('transfer_operations').select('id, counterparty, status, target_date, players(first_name, last_name)').order('target_date', { ascending: true }).limit(3),
      ]);
      if (cancelled) return;
      let shortlistedCount = 0;
      if (lists && lists.length > 0) {
        const { count } = await supabase.from('shortlist_players').select('player_id', { count: 'exact', head: true }).in('shortlist_id', lists.map((l) => l.id));
        shortlistedCount = count ?? 0;
      }
      setKpis({ shortlisted: shortlistedCount, reports: reportsCount ?? 0, upcoming: operations?.length ?? 0 });
      setUpcoming((operations ?? []).map((op) => {
        const opPlayers = op as unknown as { players: { first_name: string; last_name: string } | null; counterparty: string; status: string; target_date: string | null; id: string };
        return {
          id: opPlayers.id,
          label: opPlayers.players ? `${op.status === 'completed' ? 'Terminé' : 'Opération'} — ${opPlayers.players.first_name} ${opPlayers.players.last_name}` : 'Opération',
          sub: opPlayers.counterparty,
          status: opPlayers.status,
        };
      }));
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [session]);

  const firstName = profile?.full_name?.split(' ')[0] ?? 'bienvenue';

  return <div className="page dashboard-page"><div className="page-intro"><div><div className="eyebrow">Espace personnel</div><h1>Bonjour, {firstName} <span className="wave">.</span></h1><p>Voici ce qui se passe dans votre réseau aujourd’hui.</p></div><button className="button button-primary" onClick={onExplore}><Search size={17} /> Explorer les profils</button></div><div className="dashboard-kpis"><Kpi icon={Users} label="Talents dans la base" value={String(players.length)} trend="Profils publics" color="lime" /><Kpi icon={Heart} label="Ma shortlist" value={loading ? '—' : String(kpis.shortlisted)} trend="Joueurs suivis" color="orange" /><Kpi icon={FileText} label="Mes rapports" value={loading ? '—' : String(kpis.reports)} trend="Rédigés" color="blue" /><Kpi icon={CalendarDays} label="Opérations actives" value={loading ? '—' : String(kpis.upcoming)} trend="Transfer Center" color="pink" /></div><section className="dashboard-grid"><div className="content-card activity-card"><div className="content-card-heading"><div><div className="eyebrow">Votre activité</div><h2>Progression du réseau</h2></div></div><div className="big-chart"><div className="big-chart-number">{players.length} <span><TrendingUp size={15} /> profils dans la base actuellement</span></div><div className="chart-placeholder tall-chart"><div className="chart-lines"><i /><i /><i /><i /><i /></div><svg viewBox="0 0 700 190" preserveAspectRatio="none" className="line-chart"><path d="M0,154 C40,143 55,150 82,135 C112,118 126,130 155,116 C188,100 206,110 239,95 C274,77 290,96 325,76 C361,54 380,66 412,55 C446,44 461,65 495,39 C529,13 548,42 580,25 C617,5 655,21 700,4" fill="none" stroke="#b7d832" strokeWidth="3.5" /><path d="M0,154 C40,143 55,150 82,135 C112,118 126,130 155,116 C188,100 206,110 239,95 C274,77 290,96 325,76 C361,54 380,66 412,55 C446,44 461,65 495,39 C529,13 548,42 580,25 C617,5 655,21 700,4 L700,190 L0,190 Z" fill="url(#dashFill)" opacity=".2" /><defs><linearGradient id="dashFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#d7f04a" /><stop offset="1" stopColor="#d7f04a" stopOpacity="0" /></linearGradient></defs></svg></div></div></div><div className="content-card recommended-card"><div className="content-card-heading"><div><div className="eyebrow">Pour vous</div><h2>Talents de la base</h2></div></div><div className="mini-player-list">{players.slice(0, 3).map((player) => <button key={player.id} className="mini-player-row" onClick={onExplore}><span className="mini-row-image" style={{ backgroundImage: `url(${player.image})` }} /><span className="mini-row-copy"><strong>{player.name}</strong><small>{player.position} · {player.country}</small></span><span className="mini-row-score">{player.sport}<small>score</small></span><ArrowRight size={15} /></button>)}</div><button className="text-button" onClick={onExplore}>Voir les recommandations <ArrowRight size={15} /></button></div></section><section className="dashboard-bottom"><div className="content-card upcoming-card"><div className="content-card-heading"><div><div className="eyebrow">Agenda</div><h2>Opérations en cours</h2></div><button className="text-button" onClick={() => onNavigate('transfers')}>Voir le Transfer Center <ArrowRight size={14} /></button></div>{!session && <p style={{ color: '#8e958d', fontSize: 13 }}>Connectez-vous pour voir vos opérations en cours.</p>}{session && upcoming.length === 0 && !loading && <p style={{ color: '#8e958d', fontSize: 13 }}>Aucune opération pour le moment.</p>}{upcoming.map((item) => <div className="calendar-row" key={item.id}><div className="calendar-date"><strong>—</strong><span>{item.status.slice(0, 4).toUpperCase()}</span></div><div><strong>{item.label}</strong><span>{item.sub}</span></div><span className="status-pill green">{item.status === 'completed' ? 'Terminé' : 'En cours'}</span></div>)}</div><div className="quote-card"><Sparkles size={22} /><p>“Le potentiel est une promesse. Le travail est ce qui la rend visible.”</p><span>— AfriTalents</span></div></section></div>;
}

function Metric({ icon: Icon, value, label, trend }: { icon: typeof Users; value: string; label: string; trend: string }) { return <div className="metric"><div className="metric-icon"><Icon size={18} /></div><div><strong>{value}</strong><span>{label}</span><small>{trend}</small></div></div>; }
function Kpi({ icon: Icon, label, value, trend, color }: { icon: typeof Users; label: string; value: string; trend: string; color: string }) { return <div className="kpi"><div className={`kpi-icon ${color}`}><Icon size={18} /></div><div><span>{label}</span><strong>{value}</strong><small>{trend}</small></div><ChevronDown className="kpi-arrow" size={16} /> </div>; }
function DataPoint({ label, value }: { label: string; value: string }) { return <div className="data-point"><span>{label}</span><strong>{value}</strong></div>; }
function Performance({ value, label, highlight = false }: { value: string | number; label: string; highlight?: boolean }) { return <div className={highlight ? 'performance highlight' : 'performance'}><strong>{value}</strong><span>{label}</span></div>; }

function WorkspaceHeader({ eyebrow, title, description, action, onAction }: { eyebrow: string; title: string; description: string; action: string; onAction: () => void }) {
  return <div className="page-intro"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div><button className="button button-primary" onClick={onAction}><Plus size={16} /> {action}</button></div>;
}






function AcademyRegistration({ onNotice }: { onNotice: (message: string) => void }) {
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [country, setCountry] = useState('Côte d’Ivoire');
  const [city, setCity] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!session) return onNotice('Connectez-vous pour inscrire votre académie.');
    if (!name.trim()) return onNotice('Le nom de l’académie est obligatoire.');
    setSubmitting(true);
    const { data: org, error } = await supabase.from('organizations').insert({ name: name.trim(), type: 'academy', country, city: city || null, verified: false }).select().single();
    if (error || !org) {
      onNotice(`Erreur : ${error?.message ?? 'inconnue'}`);
      setSubmitting(false);
      return;
    }
    if (logoFile) {
      const path = `${org.id}/${Date.now()}-${logoFile.name.replace(/\s+/g, '-')}`;
      const { error: uploadError } = await supabase.storage.from('player-photos').upload(path, logoFile);
      if (!uploadError) {
        const { data: publicUrl } = supabase.storage.from('player-photos').getPublicUrl(path);
        await supabase.from('organizations').update({ logo_url: publicUrl.publicUrl }).eq('id', org.id);
      }
    }
    onNotice('Votre demande d’inscription a été envoyée pour vérification.');
    setSubmitting(false);
  };

  return <div className="page workspace-page"><WorkspaceHeader eyebrow="Rejoindre le réseau" title="Inscrire mon académie" description="Présentez votre structure et construisez un espace de gestion pour vos joueurs." action={submitting ? 'Envoi…' : 'Soumettre pour vérification'} onAction={handleSubmit} /><div className="academy-form-grid"><div className="content-card academy-form"><div className="eyebrow">Informations principales</div><h2>Parlez-nous de votre académie</h2><label>Nom de l’académie<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Galaxie Saint Koffi" /></label><div className="form-two"><label>Pays<select value={country} onChange={(e) => setCountry(e.target.value)}><option>Côte d’Ivoire</option><option>Sénégal</option><option>Ghana</option><option>Mali</option></select></label><label>Ville<input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex. Abidjan" /></label></div><button className="button button-primary" onClick={handleSubmit} disabled={submitting}><Send size={15} /> {submitting ? 'Envoi…' : 'Soumettre pour vérification'}</button></div><div className="content-card upload-card"><div className="upload-icon"><Upload size={20} /></div><h3>Ajoutez votre identité visuelle</h3><p>Logo, présentation et éléments de vérification renforcent la confiance de votre profil.</p><label className="button button-ghost" style={{ display: 'inline-flex', cursor: 'pointer' }}><Upload size={15} /> {logoFile ? logoFile.name : 'Ajouter un logo'}<input type="file" accept="image/*" hidden onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} /></label><div className="verification-list"><span><CheckCircle2 size={15} /> Profil public personnalisable</span><span><CheckCircle2 size={15} /> Gestion des joueurs</span><span><CheckCircle2 size={15} /> Accès aux opportunités</span></div></div></div></div>;
}


function PlayerStats({ player, onBack }: { player: Player; onBack: () => void }) {
  const stats: [string, number, boolean][] = [
    ['Technique', player.technicalScore ?? 0, player.technicalScore != null],
    ['Tactique', player.tacticalScore ?? 0, player.tacticalScore != null],
    ['Physique', player.physicalScore ?? 0, player.physicalScore != null],
    ['Mental', player.mentalScore ?? 0, player.mentalScore != null],
  ].filter((s) => s[2]) as [string, number, boolean][];
  return <div className="page workspace-page"><button className="back-link" onClick={onBack}><ArrowLeft size={14} /> Retour au profil</button><div className="page-intro"><div><div className="eyebrow">Performance individuelle</div><h1>Statistiques de {player.name}</h1><p>Une lecture claire des performances observées et du potentiel projeté.</p></div></div><div className="stats-overview"><div className="content-card stats-score"><span>Score sport global</span><strong>{player.sport}</strong><div className="score-bar"><i style={{ width: `${player.sport}%` }} /></div></div><div className="content-card"><div className="eyebrow">Saison en cours</div><h2>Statistiques de matchs</h2><div className="big-chart-number">{player.matches} <span>matchs joués</span></div><div className="stats-bars" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}><div><span style={{ height: `${Math.min(100, player.goals * 5)}%` }} /><small>{player.goals} buts</small></div><div><span style={{ height: `${Math.min(100, player.assists * 5)}%` }} /><small>{player.assists} passes D.</small></div><div><span style={{ height: `${Math.min(100, player.matches * 3)}%` }} /><small>{player.matches} matchs</small></div></div></div></div>{stats.length > 0 ? <div className="content-card stat-table"><div className="content-card-heading"><div><div className="eyebrow">Détail des indicateurs</div><h2>Les qualités qui font la différence</h2></div></div>{stats.map(([label, value]) => <div className="stat-line" key={label}><span>{label}</span><div className="stat-line-track"><i style={{ width: `${value}%` }} /></div><strong>{value}</strong></div>)}</div> : <div className="disclaimer"><ShieldCheck size={17} /><span>Aucune évaluation détaillée n’a encore été enregistrée pour ce joueur.</span></div>}</div>;
}

function VideoLibrary({ player, onBack, onNotice }: { player: Player; onBack: () => void; onNotice: (message: string) => void }) {
  const { isAdminOrAcademy } = useAuth();
  const [videos, setVideos] = useState<DbPlayerVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<DbPlayerVideo | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    if (!player.dbId) {
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('player_videos').select('*').eq('player_id', player.dbId).order('created_at', { ascending: false });
    setVideos((data as DbPlayerVideo[]) ?? []);
    setPlaying((data as DbPlayerVideo[] | null)?.[0] ?? null);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.dbId]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !player.dbId) return;
    if (!isAdminOrAcademy) return onNotice('Seuls les administrateurs et académies peuvent ajouter des vidéos.');
    setUploading(true);
    for (const file of Array.from(files)) {
      const path = `${player.dbId}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const { error: uploadError } = await supabase.storage.from('player-videos').upload(path, file);
      if (uploadError) {
        onNotice(`Erreur pour « ${file.name} » : ${uploadError.message}`);
        continue;
      }
      const { data: publicUrl } = supabase.storage.from('player-videos').getPublicUrl(path);
      await supabase.from('player_videos').insert({ player_id: player.dbId, title: file.name.replace(/\.[^/.]+$/, ''), url: publicUrl.publicUrl, video_type: 'highlight', visibility: 'public' });
    }
    onNotice('Vidéo(s) ajoutée(s).');
    setUploading(false);
    load();
  };

  return <div className="page workspace-page"><button className="back-link" onClick={onBack}><ArrowLeft size={14} /> Retour au profil</button><div className="page-intro"><div><div className="eyebrow">Observations vidéo</div><h1>Vidéothèque</h1><p>Les séquences qui donnent du contexte aux statistiques de {player.name}.</p></div>{isAdminOrAcademy && <label className="button button-primary" style={{ cursor: 'pointer' }}><Upload size={15} /> {uploading ? 'Envoi…' : 'Ajouter une vidéo'}<input type="file" accept="video/*" multiple hidden disabled={uploading} onChange={(e) => handleUpload(e.target.files)} /></label>}</div>
    {loading && <p style={{ color: '#8e958d' }}>Chargement…</p>}
    {!loading && playing && <div className="video-feature"><div className="video-feature-image" style={{ backgroundImage: `url(${player.image})` }}><video src={playing.url} controls style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} /></div><div className="video-feature-copy"><div className="eyebrow">Séquence sélectionnée</div><h2>{playing.title}</h2><p>{playing.description ?? 'Aucune description fournie.'}</p><div className="video-meta"><span><ShieldCheck size={14} /> {playing.visibility === 'public' ? 'Publique' : 'Restreinte'}</span></div></div></div>}
    {!loading && !playing && <div className="empty-state"><Play size={26} /><h3>Aucune vidéo pour ce joueur</h3><p>{isAdminOrAcademy ? 'Utilisez le bouton ci-dessus pour ajouter la première vidéo.' : 'Revenez bientôt pour découvrir ses séquences.'}</p></div>}
    <div className="video-grid">{videos.map((video) => <button className="video-card" key={video.id} onClick={() => setPlaying(video)}><div className="video-thumb" style={{ backgroundImage: `url(${player.image})` }}><span><Play size={14} fill="currentColor" /></span></div><strong>{video.title}</strong><p>{new Date(video.created_at).toLocaleDateString('fr-FR')} · Observation AfriTalents</p></button>)}</div>
  </div>;
}

function AcademicPath({ player, onBack, onNotice }: { player: Player; onBack: () => void; onNotice: (message: string) => void }) {
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${player.name} — ${player.position}, ${player.country}. Indice académique : ${player.academic}.`);
      onNotice('Le résumé du dossier a été copié dans le presse-papiers.');
    } catch {
      onNotice('Impossible de copier automatiquement. Sélectionnez et copiez le texte manuellement.');
    }
  };
  return <div className="page workspace-page"><button className="back-link" onClick={onBack}><ArrowLeft size={14} /> Retour au profil</button><div className="page-intro"><div><div className="eyebrow">Au-delà du terrain</div><h1>Parcours académique</h1><p>Le contexte scolaire et les prochaines étapes d’accompagnement de {player.name}.</p></div><button className="button button-ghost" onClick={handleShare}><Share2 size={15} /> Partager le dossier</button></div><div className="academic-grid"><div className="content-card academic-summary"><div className="student-head"><div className="avatar avatar-lime">{player.name.split(' ').map((part) => part[0]).join('')}</div><div><strong>{player.name}</strong><span>Élève-athlète</span></div></div><div className="academic-score"><span>Indice académique</span><strong>{player.academic}</strong></div><div className="academic-points"><div><BookOpen size={16} /><span>Poste<strong>{player.position}</strong></span></div><div><Globe2 size={16} /><span>Académie<strong>{player.academy}</strong></span></div></div></div><div className="content-card"><div className="eyebrow">À propos</div><h2>Le double projet AfriTalents</h2><p style={{ color: '#c5cbc0', lineHeight: 1.7 }}>Chaque profil enregistré par une académie ou un administrateur peut être complété avec un suivi scolaire détaillé (classe, langues, jalons) directement depuis l’espace d’administration, pour donner une vision complète du parcours du joueur.</p></div></div><div className="disclaimer"><ShieldCheck size={17} /><span>Les informations académiques sont partagées uniquement avec les personnes autorisées par le joueur ou sa structure.</span></div></div>;
}

export default App;
