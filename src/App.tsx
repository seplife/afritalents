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
  Star,
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
  academic: string;
  goals: number;
  assists: number;
  matches: number;
  image: string;
  accent: string;
};

const DEMO_PLAYERS: Player[] = [
  {
    id: '1',
    name: 'Koffi Jean',
    initials: 'KJ',
    country: "Côte d'Ivoire",
    flag: 'CI',
    position: 'Ailier droit',
    age: 17,
    academy: 'Africa Future Academy',
    height: '1,76 m',
    foot: 'Droit',
    sport: 84,
    academic: '14,7/20',
    goals: 14,
    assists: 9,
    matches: 28,
    image: 'https://images.pexels.com/photos/8941656/pexels-photo-8941656.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    accent: '#d7f04a',
  },
  {
    id: '2',
    name: 'Amara Diallo',
    initials: 'AD',
    country: 'Sénégal',
    flag: 'SN',
    position: 'Milieu central',
    age: 16,
    academy: 'Dakar Elite Project',
    height: '1,72 m',
    foot: 'Gauche',
    sport: 81,
    academic: '15,2/20',
    goals: 8,
    assists: 13,
    matches: 25,
    image: 'https://images.pexels.com/photos/30449603/pexels-photo-30449603.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    accent: '#ffb15a',
  },
  {
    id: '3',
    name: 'Kwame Mensah',
    initials: 'KM',
    country: 'Ghana',
    flag: 'GH',
    position: 'Défenseur central',
    age: 18,
    academy: 'Accra Football Lab',
    height: '1,84 m',
    foot: 'Droit',
    sport: 86,
    academic: '13,9/20',
    goals: 3,
    assists: 4,
    matches: 31,
    image: 'https://images.pexels.com/photos/33110007/pexels-photo-33110007.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    accent: '#93c5fd',
  },
  {
    id: '4',
    name: 'Moussa Traoré',
    initials: 'MT',
    country: 'Mali',
    flag: 'ML',
    position: 'Attaquant',
    age: 17,
    academy: 'Bamako Next Gen',
    height: '1,79 m',
    foot: 'Droit',
    sport: 88,
    academic: '12,8/20',
    goals: 19,
    assists: 6,
    matches: 26,
    image: 'https://images.pexels.com/photos/31642262/pexels-photo-31642262.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    accent: '#fca5a5',
  },
];

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
  const [players, setPlayers] = useState<Player[]>(DEMO_PLAYERS);
  const [selectedPlayer, setSelectedPlayer] = useState<Player>(DEMO_PLAYERS[0]);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState('Toutes les positions');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState('');
  const [selectedOpportunity, setSelectedOpportunity] = useState<DbOpportunity | null>(null);
  const { session, profile, isAdminOrAcademy, signOut } = useAuth();

  useEffect(() => {
    let cancelled = false;
    async function loadRealPlayers() {
      const { data: playerRows } = await supabase.from('players').select('*, organizations(name)').eq('status', 'active').order('created_at', { ascending: false });
      if (!playerRows || playerRows.length === 0 || cancelled) return;
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
      setSelectedPlayer((current) => mapped.find((p) => p.id === current.id) ?? mapped[0] ?? current);
    }
    loadRealPlayers();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const matchesQuery = `${player.name} ${player.country} ${player.academy} ${player.position}`.toLowerCase().includes(query.toLowerCase());
      const matchesPosition = position === 'Toutes les positions' || player.position === position;
      return matchesQuery && matchesPosition;
    });
  }, [players, position, query]);

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
              <Icon size={18} /><span>{label}</span>{itemView === 'talents' && <span className="nav-badge">24</span>}
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

        {view === 'home' && <Home players={players} onExplore={() => setView('talents')} onProfile={() => goToProfile(players[0])} onAcademy={() => setView('academy')} onNotice={showNotice} />}
        {view === 'talents' && <TalentExplorer query={query} setQuery={setQuery} position={position} setPosition={setPosition} players={filteredPlayers} onProfile={goToProfile} onNotice={showNotice} />}
        {view === 'profile' && <PlayerProfile player={selectedPlayer} onBack={() => setView('talents')} onNotice={showNotice} onTab={(tab) => setView(tab)} />}
        {view === 'stats' && <PlayerStats player={selectedPlayer} onBack={() => setView('profile')} onNotice={showNotice} />}
        {view === 'videos' && <VideoLibrary player={selectedPlayer} onBack={() => setView('profile')} onNotice={showNotice} />}
        {view === 'academic' && <AcademicPath player={selectedPlayer} onBack={() => setView('profile')} onNotice={showNotice} />}
        {view === 'dashboard' && <Dashboard players={players} onExplore={() => setView('talents')} onNotice={showNotice} />}
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

function Home({ players, onExplore, onProfile, onAcademy, onNotice }: { players: Player[]; onExplore: () => void; onProfile: () => void; onAcademy: () => void; onNotice: (message: string) => void }) {
  return <div className="page home-page">
    <section className="hero-grid">
      <div className="hero-copy"><div className="eyebrow"><span className="pulse" />Réseau africain de talents</div><h1>Les talents africains méritent <em>d’être vus.</em></h1><p>Découvrez, développez et connectez les jeunes footballeurs africains aux académies, scouts et clubs du monde entier.</p><div className="hero-actions"><button className="button button-primary" onClick={onExplore}>Explorer les talents <ArrowRight size={17} /></button><button className="button button-ghost" onClick={onAcademy}>Inscrire mon académie</button></div><div className="hero-proof"><div className="proof-avatars"><span className="avatar avatar-photo photo-one" /><span className="avatar avatar-photo photo-two" /><span className="avatar avatar-photo photo-three" /><span className="avatar avatar-more">+2k</span></div><div><strong>2 480+ profils actifs</strong><span>dans 17 pays africains</span></div></div></div>
      <div className="hero-visual"><div className="hero-photo" /><div className="hero-photo-overlay" /><div className="hero-stat hero-stat-top"><div className="stat-icon stat-icon-lime"><TrendingUp size={17} /></div><div><span>Profils en progression</span><strong>+28,4%</strong></div><span className="trend-up">↗</span></div><div className="hero-card-float"><div className="float-label"><span className="live-dot" />Talent du moment</div><div className="float-player"><div className="mini-player-photo" /><div><strong>Koffi Jean</strong><span>Ailier droit · U17</span><small><span className="flag-dot">CI</span> Côte d’Ivoire</small></div><div className="score-ring">84<small>SPORT</small></div></div><div className="float-divider" /><div className="float-footer"><span>Sport performance</span><strong>84 <small>/ 100</small></strong></div></div><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /></div>
    </section>

    <section className="metrics-row"><Metric icon={Users} value="2 480" label="Talents référencés" trend="+18% ce mois" /><Metric icon={Globe2} value="17" label="Pays représentés" trend="Afrique & diaspora" /><Metric icon={Building2} value="186" label="Académies partenaires" trend="Vérifiées" /><Metric icon={Trophy} value="42" label="Opportunités actives" trend="Cette semaine" /></section>

    <section className="section-block featured-section"><div className="section-heading"><div><div className="eyebrow">Sélection de la semaine</div><h2>Talents à la une</h2><p>Des profils prometteurs sélectionnés par notre réseau de scouts.</p></div><button className="text-button" onClick={onExplore}>Voir tous les talents <ArrowRight size={16} /></button></div><div className="player-grid">{players.slice(0, 3).map((player) => <PlayerCard key={player.id} player={player} onProfile={onProfile} />)}</div></section>

    <section className="double-section"><div className="insight-card"><div className="card-topline"><div className="eyebrow">Le double projet</div><BookOpen size={19} /></div><h3>Former le joueur<br /><em>sans sacrifier l’élève.</em></h3><p>Un dossier unique pour suivre la progression sportive et académique de chaque jeune talent.</p><div className="progress-pair"><div><span>Performance sportive</span><strong>84<span>/100</span></strong><div className="progress-track"><i style={{ width: '84%' }} /></div></div><div><span>Performance académique</span><strong>14,7<span>/20</span></strong><div className="progress-track orange"><i style={{ width: '74%' }} /></div></div></div><button className="button button-dark" onClick={onAcademy}>Découvrir le parcours <ArrowRight size={16} /></button></div><div className="story-card"><div className="story-image" /><div className="story-overlay" /><div className="story-content"><div className="eyebrow light">African talent stories</div><h3>Chaque parcours<br />commence quelque part.</h3><button className="circle-button" onClick={() => onNotice('Les histoires de talents arrivent prochainement.')}><Play size={17} fill="currentColor" /></button><span className="story-caption">Voir l’histoire de Youssouf<br /><small>De Bamako à Bruxelles</small></span></div></div></section>

    <div className="disclaimer"><ShieldCheck size={17} /><span>Les scores et projections sont des outils d’aide à l’analyse. Ils ne garantissent ni recrutement, ni transfert, ni carrière professionnelle.</span></div>
  </div>;
}

function TalentExplorer({ query, setQuery, position, setPosition, players, onProfile, onNotice }: { query: string; setQuery: (value: string) => void; position: string; setPosition: (value: string) => void; players: Player[]; onProfile: (player: Player) => void; onNotice: (message: string) => void }) {
  return <div className="page explorer-page"><div className="page-intro"><div><div className="eyebrow">Base de talents</div><h1>Découvrir les talents</h1><p>Explorez les profils qui façonnent le prochain chapitre du football africain.</p></div><button className="button button-primary" onClick={() => onNotice('Votre alerte de nouveaux talents est activée.')}><SlidersHorizontal size={17} /> Enregistrer une alerte</button></div><div className="explorer-toolbar"><div className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un nom, une académie, un pays..." /></div><div className="select-field"><Filter size={16} /><select value={position} onChange={(event) => setPosition(event.target.value)}><option>Toutes les positions</option><option>Ailier droit</option><option>Milieu central</option><option>Défenseur central</option><option>Attaquant</option></select><ChevronDown size={15} /></div><button className="filter-button" onClick={() => onNotice('Les filtres avancés sont ouverts.')}><Filter size={17} /> Filtres avancés <span>3</span></button></div><div className="active-filters"><span>Afrique <X size={13} /></span><span>U13 — U19 <X size={13} /></span><span>Profil vérifié <X size={13} /></span><button onClick={() => { setQuery(''); setPosition('Toutes les positions'); }}>Réinitialiser</button></div><div className="result-heading"><strong>{players.length} <span>talent{players.length > 1 ? 's' : ''} correspond{players.length > 1 ? 'ent' : ''}</span></strong><button className="sort-button" onClick={() => onProfile(players[0])}>Trier par : <b>Score de potentiel</b><ChevronDown size={14} /></button></div><div className="player-grid explorer-grid">{players.length ? players.map((player) => <PlayerCard key={player.id} player={player} onProfile={onProfile} />) : <div className="empty-state"><Search size={26} /><h3>Aucun talent trouvé</h3><p>Essayez une autre recherche ou retirez un filtre.</p></div>}</div></div>;
}

function PlayerCard({ player, onProfile }: { player: Player; onProfile: (player: Player) => void }) {
  return <article className="player-card"><div className="player-card-image" style={{ backgroundImage: `url(${player.image})` }}><div className="card-image-shade" /><div className="verified-badge"><ShieldCheck size={13} /> Vérifié</div><button className="favorite-button" aria-label="Ajouter aux favoris" onClick={() => onProfile(player)}><Heart size={17} /></button><div className="card-location"><span className="flag-dot">{player.flag}</span>{player.country}</div></div><div className="player-card-body"><div className="player-name-row"><div><h3>{player.name}</h3><span>{player.position} · U{player.age < 16 ? '15' : player.age < 18 ? '17' : '19'}</span></div><div className="potential-score"><strong>{player.sport}</strong><span>SPORT</span></div></div><div className="academy-line"><Building2 size={14} />{player.academy}</div><div className="player-facts"><span>{player.height}</span><span>Pied {player.foot.toLowerCase()}</span></div><div className="card-stats"><div><strong>{player.goals}</strong><span>Buts</span></div><div><strong>{player.assists}</strong><span>Passes</span></div><div><strong>{player.matches}</strong><span>Matchs</span></div><div><strong>{player.academic}</strong><span>Académique</span></div></div><button className="profile-link" onClick={() => onProfile(player)}>Voir le profil <ArrowRight size={15} /></button></div></article>;
}

function PlayerProfile({ player, onBack, onNotice, onTab }: { player: Player; onBack: () => void; onNotice: (message: string) => void; onTab: (tab: 'stats' | 'videos' | 'academic') => void }) {
  return <div className="page profile-page"><button className="back-link" onClick={onBack}>← Retour aux talents</button><section className="profile-hero"><div className="profile-image" style={{ backgroundImage: `url(${player.image})` }} /><div className="profile-summary"><div className="verified-line"><ShieldCheck size={15} /> Profil vérifié <span>Mis à jour il y a 2 jours</span></div><h1>{player.name}</h1><p className="profile-position">{player.position} <span>·</span> U{player.age < 18 ? '17' : '19'} <span>·</span> {player.age} ans</p><p className="profile-academy"><Building2 size={16} /> {player.academy} <span className="flag-dot">{player.flag}</span> {player.country}</p><div className="profile-actions"><button className="button button-primary" onClick={() => onNotice('Votre demande de contact a été enregistrée.')}>Demander le contact <ArrowRight size={16} /></button><button className="icon-button large" onClick={() => onNotice('Talent ajouté à votre shortlist.')}><Heart size={18} /></button></div></div><div className="profile-score-card"><span>Score sportif</span><strong>{player.sport}<small>/100</small></strong><div className="score-bar"><i style={{ width: `${player.sport}%` }} /></div><em>Évaluation indicative</em></div></section><div className="profile-tabs"><button className="active" onClick={() => onNotice('Vous êtes déjà sur la vue d’ensemble.')}>Vue d’ensemble</button><button onClick={() => onTab('stats')}>Statistiques</button><button onClick={() => onTab('videos')}>Vidéothèque <span>12</span></button><button onClick={() => onTab('academic')}>Parcours académique</button></div><section className="profile-content"><div className="profile-main-column"><div className="content-card"><div className="content-card-heading"><div><div className="eyebrow">Identité sportive</div><h2>Le profil en un regard</h2></div><button className="more-button" onClick={() => onNotice('Options supplémentaires ouvertes.')}>•••</button></div><div className="identity-grid"><DataPoint label="Nom complet" value={player.name} /><DataPoint label="Date de naissance" value={player.dateOfBirth ? new Date(player.dateOfBirth).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Non renseignée'} /><DataPoint label="Nationalité" value={player.country} /><DataPoint label="Taille / poids" value={`${player.height} · ${player.weightKg ? `${player.weightKg} kg` : 'poids non renseigné'}`} /><DataPoint label="Pied fort" value={`Pied ${player.foot.toLowerCase()}`} /><DataPoint label="Poste principal" value={player.position} /></div></div><div className="content-card"><div className="content-card-heading"><div><div className="eyebrow">Saison 2025/26</div><h2>Production sur le terrain</h2></div><button className="select-small" onClick={() => onNotice('Sélecteur de période ouvert.')} >Cette saison <ChevronDown size={14} /></button></div><div className="performance-grid"><Performance value={player.matches} label="Matchs" /><Performance value={player.goals} label="Buts" highlight /><Performance value={player.assists} label="Passes décisives" /><Performance value="1 964" label="Minutes" /></div><div className="chart-placeholder"><div className="chart-label"><span>Progression du niveau sportif</span><strong>+12,6% <TrendingUp size={14} /></strong></div><div className="chart-lines"><i /><i /><i /><i /><i /></div><svg viewBox="0 0 600 130" preserveAspectRatio="none" className="line-chart"><path d="M0,110 C35,103 45,89 80,96 C116,102 132,76 167,82 C202,88 212,61 248,67 C284,74 306,42 344,49 C385,57 391,74 427,54 C466,33 482,45 516,27 C548,11 568,24 600,7" fill="none" stroke="#b7d832" strokeWidth="3" /><path d="M0,110 C35,103 45,89 80,96 C116,102 132,76 167,82 C202,88 212,61 248,67 C284,74 306,42 344,49 C385,57 391,74 427,54 C466,33 482,45 516,27 C548,11 568,24 600,7 L600,130 L0,130 Z" fill="url(#chartFill)" opacity=".25" /><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#d7f04a" /><stop offset="1" stopColor="#d7f04a" stopOpacity="0" /></linearGradient></defs></svg><div className="chart-months"><span>Août</span><span>Sept.</span><span>Oct.</span><span>Nov.</span><span>Déc.</span><span>Janv.</span><span>Févr.</span></div></div></div></div><aside className="profile-side-column"><div className="content-card double-project-card"><div className="eyebrow">Double projet</div><h3>Sport & études</h3><p>Un talent complet se construit sur et en dehors du terrain.</p><div className="index-row"><div className="index-icon lime"><Zap size={17} /></div><div><span>Sport performance index</span><strong>{player.sport}<small>/100</small></strong></div></div><div className="index-row"><div className="index-icon orange"><BookOpen size={17} /></div><div><span>Academic performance index</span><strong>{player.academic}<small> moyenne</small></strong></div></div><button className="text-button" onClick={() => onTab('academic')}>Voir le dossier académique <ArrowRight size={15} /></button></div><div className="content-card scout-note"><div className="scout-note-top"><div className="avatar avatar-orange">ML</div><div><strong>Marie Laurent</strong><span>Scout vérifiée · France</span></div><Star size={17} fill="#f2b35f" color="#f2b35f" /></div><p>« Un profil explosif, très à l’aise dans les un-contre-un. Sa marge de progression est particulièrement intéressante. »</p><span className="note-date">Rapport publié le 18 févr. 2026</span></div></aside></section></div>;
}

function Dashboard({ players, onExplore, onNotice }: { players: Player[]; onExplore: () => void; onNotice: (message: string) => void }) {
  return <div className="page dashboard-page"><div className="page-intro"><div><div className="eyebrow">Espace personnel</div><h1>Bonjour, Alex <span className="wave">.</span></h1><p>Voici ce qui se passe dans votre réseau aujourd’hui.</p></div><button className="button button-primary" onClick={onExplore}><Search size={17} /> Explorer les profils</button></div><div className="dashboard-kpis"><Kpi icon={Users} label="Talents suivis" value="48" trend="+6 ce mois" color="lime" /><Kpi icon={Heart} label="Ma shortlist" value="12" trend="3 nouveaux" color="orange" /><Kpi icon={FileText} label="Rapports créés" value="26" trend="+18%" color="blue" /><Kpi icon={CalendarDays} label="Essais à venir" value="04" trend="2 cette semaine" color="pink" /></div><section className="dashboard-grid"><div className="content-card activity-card"><div className="content-card-heading"><div><div className="eyebrow">Votre activité</div><h2>Progression du réseau</h2></div><button className="select-small" onClick={() => onNotice('Période du graphique modifiée.')}>30 derniers jours <ChevronDown size={14} /></button></div><div className="big-chart"><div className="big-chart-number">+24,8% <span><TrendingUp size={15} /> vs période précédente</span></div><div className="chart-placeholder tall-chart"><div className="chart-lines"><i /><i /><i /><i /><i /></div><svg viewBox="0 0 700 190" preserveAspectRatio="none" className="line-chart"><path d="M0,154 C40,143 55,150 82,135 C112,118 126,130 155,116 C188,100 206,110 239,95 C274,77 290,96 325,76 C361,54 380,66 412,55 C446,44 461,65 495,39 C529,13 548,42 580,25 C617,5 655,21 700,4" fill="none" stroke="#b7d832" strokeWidth="3.5" /><path d="M0,154 C40,143 55,150 82,135 C112,118 126,130 155,116 C188,100 206,110 239,95 C274,77 290,96 325,76 C361,54 380,66 412,55 C446,44 461,65 495,39 C529,13 548,42 580,25 C617,5 655,21 700,4 L700,190 L0,190 Z" fill="url(#dashFill)" opacity=".2" /><defs><linearGradient id="dashFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#d7f04a" /><stop offset="1" stopColor="#d7f04a" stopOpacity="0" /></linearGradient></defs></svg><div className="chart-months"><span>01 Fév.</span><span>06 Fév.</span><span>11 Fév.</span><span>16 Fév.</span><span>21 Fév.</span><span>26 Fév.</span></div></div></div></div><div className="content-card recommended-card"><div className="content-card-heading"><div><div className="eyebrow">Pour vous</div><h2>Nouveaux talents</h2></div><button className="more-button" onClick={() => onNotice('Options supplémentaires ouvertes.')}>•••</button></div><div className="mini-player-list">{players.slice(0, 3).map((player) => <button key={player.id} className="mini-player-row" onClick={onExplore}><span className="mini-row-image" style={{ backgroundImage: `url(${player.image})` }} /><span className="mini-row-copy"><strong>{player.name}</strong><small>{player.position} · {player.country}</small></span><span className="mini-row-score">{player.sport}<small>score</small></span><ArrowRight size={15} /></button>)}</div><button className="text-button" onClick={onExplore}>Voir les recommandations <ArrowRight size={15} /></button></div></section><section className="dashboard-bottom"><div className="content-card upcoming-card"><div className="content-card-heading"><div><div className="eyebrow">Agenda</div><h2>Prochaines échéances</h2></div><button className="text-button" onClick={() => onNotice('Le calendrier complet arrive bientôt.')}>Voir le calendrier <ArrowRight size={14} /></button></div><div className="calendar-row"><div className="calendar-date"><strong>24</strong><span>FÉVR.</span></div><div><strong>Essai — Moussa Traoré</strong><span>En ligne · 14:00 GMT</span></div><span className="status-pill green">Confirmé</span></div><div className="calendar-row"><div className="calendar-date orange-date"><strong>28</strong><span>FÉVR.</span></div><div><strong>Rapport à finaliser</strong><span>Kwame Mensah · Accra Football Lab</span></div><span className="status-pill yellow">À faire</span></div></div><div className="quote-card"><Sparkles size={22} /><p>“Le potentiel est une promesse. Le travail est ce qui la rend visible.”</p><span>— AfriTalents</span></div></section></div>;
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


function PlayerStats({ player, onBack, onNotice }: { player: Player; onBack: () => void; onNotice: (message: string) => void }) {
  const stats = [['Vitesse', '88', '+6'], ['Technique', '84', '+4'], ['Vision', '91', '+9'], ['Mental', '86', '+5']];
  return <div className="page workspace-page"><button className="back-link" onClick={onBack}><ArrowLeft size={14} /> Retour au profil</button><div className="page-intro"><div><div className="eyebrow">Performance individuelle</div><h1>Statistiques de {player.name}</h1><p>Une lecture claire des performances observées et du potentiel projeté.</p></div><span className="status-pill green">Dernière mise à jour · aujourd’hui</span></div><div className="stats-overview"><div className="content-card stats-score"><span>Score sport global</span><strong>{player.sport}</strong><div className="score-bar"><i style={{ width: `${player.sport}%` }} /></div><small>Top 8% des profils de sa catégorie</small></div><div className="content-card"><div className="eyebrow">Progression</div><h2>Indice de développement</h2><div className="big-chart-number">+18.4% <span>sur les 6 derniers mois</span></div><div className="stats-bars">{[64, 70, 73, 78, 82, 88].map((value, index) => <div key={value}><span style={{ height: `${value}%` }} /><small>{['Sep', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév'][index]}</small></div>)}</div></div></div><div className="content-card stat-table"><div className="content-card-heading"><div><div className="eyebrow">Détail des indicateurs</div><h2>Les qualités qui font la différence</h2></div><button className="select-small" onClick={() => onNotice('Sélecteur de période ouvert.')} >Cette saison <ChevronDown size={14} /></button></div>{stats.map(([label, value, trend]) => <div className="stat-line" key={label}><span>{label}</span><div className="stat-line-track"><i style={{ width: `${value}%` }} /></div><strong>{value}</strong><small>{trend}%</small></div>)}</div></div>;
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
  return <div className="page workspace-page"><button className="back-link" onClick={onBack}><ArrowLeft size={14} /> Retour au profil</button><div className="page-intro"><div><div className="eyebrow">Au-delà du terrain</div><h1>Parcours académique</h1><p>Le contexte scolaire et les prochaines étapes d’accompagnement de {player.name}.</p></div><button className="button button-ghost" onClick={() => onNotice('Le dossier académique a été partagé avec votre équipe.')}><Share2 size={15} /> Partager le dossier</button></div><div className="academic-grid"><div className="content-card academic-summary"><div className="student-head"><div className="avatar avatar-lime">{player.name.split(' ').map((part) => part[0]).join('')}</div><div><strong>{player.name}</strong><span>Élève-athlète · U17</span></div><span className="status-pill green">Suivi actif</span></div><div className="academic-score"><span>Indice académique</span><strong>86<small>/100</small></strong><p>Régularité et engagement au-dessus de la moyenne.</p></div><div className="academic-points"><div><BookOpen size={16} /><span>Classe actuelle<strong>Seconde générale</strong></span></div><div><CalendarDays size={16} /><span>Prochaine étape<strong>Orientation 2026</strong></span></div><div><Globe2 size={16} /><span>Langues<strong>Français · Anglais</strong></span></div></div></div><div className="content-card academic-timeline"><div className="eyebrow">Chronologie</div><h2>Un parcours équilibré</h2><div className="academic-event"><span>2026</span><div><strong>Préparation à l’orientation</strong><p>Choix d’une filière compatible avec un projet sportif international.</p></div></div><div className="academic-event"><span>2025</span><div><strong>Certification d’anglais</strong><p>Progression confirmée lors du dernier trimestre.</p></div></div><div className="academic-event"><span>2024</span><div><strong>Entrée au programme sport-études</strong><p>Début du suivi individualisé et des bilans trimestriels.</p></div></div></div></div><div className="disclaimer"><ShieldCheck size={17} /><span>Les informations académiques sont partagées uniquement avec les personnes autorisées par le joueur ou sa structure.</span></div></div>;
}

export default App;
