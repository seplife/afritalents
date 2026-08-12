import { useMemo, useState } from 'react';
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
  Clock3,
  Eye,
  Share2,
  UserCheck,
} from 'lucide-react';

type View = 'home' | 'talents' | 'dashboard' | 'profile' | 'shortlists' | 'reports' | 'transfers' | 'opportunities' | 'opportunity-detail' | 'stats' | 'videos' | 'academic' | 'messages' | 'academy';
type Opportunity = { id: number; title: string; organisation: string; location: string; age: string; places: string; type: string; date: string; description: string; }; 

const opportunities: Opportunity[] = [
  { id: 1, title: 'Essai U19 — Belgique', organisation: 'Club Bruges Academy', location: 'Bruges, Belgique', age: 'U17 — U19', places: '12 places', type: 'ESSAI', date: '12 — 16 mars 2026', description: 'Une semaine d’observation et d’entraînement avec le groupe U19 de l’académie.' },
  { id: 2, title: 'Camp de détection Ouest-Africain', organisation: 'Africa Future Academy', location: 'Abidjan, Côte d’Ivoire', age: 'U15 — U17', places: '40 places', type: 'DÉTECTION', date: '28 — 30 mars 2026', description: 'Un camp régional pour identifier les profils à fort potentiel sportif et académique.' },
  { id: 3, title: 'Bourse sport-études 2026', organisation: 'Dakar Elite Project', location: 'Dakar, Sénégal', age: 'U16 — U20', places: 'Ouvert', type: 'BOURSE', date: 'Rentrée 2026', description: 'Un parcours d’accompagnement combinant entraînement intensif, scolarité et suivi individuel.' },
];
type Player = {
  id: number;
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

const players: Player[] = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
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
    id: 4,
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

function App() {
  const [view, setView] = useState<View>('home');
  const [selectedPlayer, setSelectedPlayer] = useState<Player>(players[0]);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState('Toutes les positions');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState('');
  const [shortlistedPlayers, setShortlistedPlayers] = useState<number[]>([1, 3]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity>(opportunities[0]);

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const matchesQuery = `${player.name} ${player.country} ${player.academy} ${player.position}`.toLowerCase().includes(query.toLowerCase());
      const matchesPosition = position === 'Toutes les positions' || player.position === position;
      return matchesQuery && matchesPosition;
    });
  }, [position, query]);

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
          <div><strong>Galaxie</strong></div>
          <span className="brand-subtitle">Saint Koff</span>
        </div>
        <div className="workspace-label">ESPACE EXPLORATION</div>
        <nav className="side-nav">
          {navItems.map(({ label, view: itemView, icon: Icon }) => (
            <button key={label} className={view === itemView ? 'nav-item active' : 'nav-item'} onClick={() => { setView(itemView); setMobileMenu(false); }}>
              <Icon size={18} /><span>{label}</span>{itemView === 'talents' && <span className="nav-badge">24</span>}
            </button>
          ))}
          <button className={view === 'shortlists' ? 'nav-item active' : 'nav-item'} onClick={() => { setView('shortlists'); setMobileMenu(false); }}><Heart size={18} /><span>Mes shortlists</span><span className="nav-badge">{shortlistedPlayers.length}</span></button>
          <button className={view === 'reports' ? 'nav-item active' : 'nav-item'} onClick={() => { setView('reports'); setMobileMenu(false); }}><ClipboardList size={18} /><span>Rapports scouting</span></button>
        </nav>
        <div className="workspace-label secondary">OUTILS</div>
        <nav className="side-nav">
          <button className={view === 'transfers' ? 'nav-item active' : 'nav-item'} onClick={() => { setView('transfers'); setMobileMenu(false); }}><ArrowRight size={18} /><span>Transfer Center</span></button>
          <button className={view === 'opportunities' ? 'nav-item active' : 'nav-item'} onClick={() => { setView('opportunities'); setMobileMenu(false); }}><Target size={18} /><span>Opportunités</span></button>
          <button className={view === 'messages' ? 'nav-item active' : 'nav-item'} onClick={() => { setView('messages'); setMobileMenu(false); }}><MessageSquare size={18} /><span>Messages</span><span className="dot" /></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="verification-card"><ShieldCheck size={18} /><div><strong>Vos données sont protégées</strong><span>Conçu pour les talents mineurs</span></div></div>
          <button className="user-mini user-mini-button" onClick={() => { setView('academy'); setMobileMenu(false); }}><div className="avatar avatar-lime">AF</div><div><strong>Alex Football</strong><span>Scout indépendant</span></div><ChevronDown size={16} /></button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Ouvrir le menu"><Menu size={22} /></button>
          <div className="breadcrumbs"><span>Galaxie Sant Koff</span><span>/</span><strong>{view === 'home' ? 'Vue d’ensemble' : view === 'talents' ? 'Découvrir les talents' : view === 'profile' ? 'Profil joueur' : view === 'dashboard' ? 'Mon espace' : view === 'shortlists' ? 'Mes shortlists' : view === 'reports' ? 'Rapports scouting' : view === 'transfers' ? 'Transfer Center' : view === 'opportunities' ? 'Opportunités' : view === 'opportunity-detail' ? 'Détail de l’opportunité' : view === 'stats' ? 'Statistiques' : view === 'videos' ? 'Vidéothèque' : view === 'academic' ? 'Parcours académique' : view === 'messages' ? 'Messages' : 'Mon profil'}</strong></div>
          <div className="topbar-actions"><button className="icon-button" onClick={() => showNotice('Vous êtes à jour.')} aria-label="Notifications"><Bell size={18} /><span className="notification-dot" /></button><button className="help-button" onClick={() => showNotice('Notre équipe vous répondra prochainement.')}>Besoin d’aide ?</button><div className="avatar avatar-dark">AF</div></div>
        </header>

        {view === 'home' && <Home onExplore={() => setView('talents')} onProfile={() => goToProfile(players[0])} onAcademy={() => setView('academy')} onNotice={showNotice} />}
        {view === 'talents' && <TalentExplorer query={query} setQuery={setQuery} position={position} setPosition={setPosition} players={filteredPlayers} onProfile={goToProfile} onNotice={showNotice} />}
        {view === 'profile' && <PlayerProfile player={selectedPlayer} onBack={() => setView('talents')} onNotice={showNotice} onTab={(tab) => setView(tab)} />}
        {view === 'stats' && <PlayerStats player={selectedPlayer} onBack={() => setView('profile')} onNotice={showNotice} />}
        {view === 'videos' && <VideoLibrary player={selectedPlayer} onBack={() => setView('profile')} onNotice={showNotice} />}
        {view === 'academic' && <AcademicPath player={selectedPlayer} onBack={() => setView('profile')} onNotice={showNotice} />}
        {view === 'dashboard' && <Dashboard onExplore={() => setView('talents')} onNotice={showNotice} />}
        {view === 'shortlists' && <Shortlists players={players.filter((player) => shortlistedPlayers.includes(player.id))} onProfile={goToProfile} onRemove={(id) => setShortlistedPlayers((current) => current.filter((playerId) => playerId !== id))} onNotice={showNotice} />}
        {view === 'reports' && <Reports onNotice={showNotice} />}
        {view === 'transfers' && <Transfers onNotice={showNotice} />}
        {view === 'opportunities' && <Opportunities onNotice={showNotice} onOpen={(opportunity) => { setSelectedOpportunity(opportunity); setView('opportunity-detail'); }} />}
        {view === 'opportunity-detail' && <OpportunityDetail opportunity={selectedOpportunity} onBack={() => setView('opportunities')} onNotice={showNotice} />}
        {view === 'messages' && <Messages onNotice={showNotice} />}
        {view === 'academy' && <AcademyRegistration onNotice={showNotice} />}
      </main>
      {notice && <div className="toast"><Check size={17} />{notice}<button onClick={() => setNotice('')}><X size={14} /></button></div>}
    </div>
  );
}

function Home({ onExplore, onProfile, onAcademy, onNotice }: { onExplore: () => void; onProfile: () => void; onAcademy: () => void; onNotice: (message: string) => void }) {
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
  return <div className="page explorer-page"><div className="page-intro"><div><div className="eyebrow">Base de talents</div><h1>Découvrir les talents</h1><p>Explorez les profils qui façonnent le prochain chapitre du football africain.</p></div><button className="button button-primary" onClick={() => onNotice('Votre alerte de nouveaux talents est activée.')}><SlidersHorizontal size={17} /> Enregistrer une alerte</button></div><div className="explorer-toolbar"><div className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un nom, une académie, un pays..." /></div><div className="select-field"><Filter size={16} /><select value={position} onChange={(event) => setPosition(event.target.value)}><option>Toutes les positions</option><option>Ailier droit</option><option>Milieu central</option><option>Défenseur central</option><option>Attaquant</option></select><ChevronDown size={15} /></div><button className="filter-button" onClick={() => onNotice('Les filtres avancés sont ouverts.')}><Filter size={17} /> Filtres avancés <span>3</span></button></div><div className="active-filters"><span>Afrique <X size={13} /></span><span>U13 — U19 <X size={13} /></span><span>Profil vérifié <X size={13} /></span><button onClick={() => { setQuery(''); setPosition('Toutes les positions'); }}>Réinitialiser</button></div><div className="result-heading"><strong>{players.length * 186} <span>talents correspondent</span></strong><button className="sort-button" onClick={() => onProfile(players[0])}>Trier par : <b>Score de potentiel</b><ChevronDown size={14} /></button></div><div className="player-grid explorer-grid">{players.length ? players.map((player) => <PlayerCard key={player.id} player={player} onProfile={onProfile} />) : <div className="empty-state"><Search size={26} /><h3>Aucun talent trouvé</h3><p>Essayez une autre recherche ou retirez un filtre.</p></div>}</div></div>;
}

function PlayerCard({ player, onProfile }: { player: Player; onProfile: (player: Player) => void }) {
  return <article className="player-card"><div className="player-card-image" style={{ backgroundImage: `url(${player.image})` }}><div className="card-image-shade" /><div className="verified-badge"><ShieldCheck size={13} /> Vérifié</div><button className="favorite-button" aria-label="Ajouter aux favoris" onClick={() => onProfile(player)}><Heart size={17} /></button><div className="card-location"><span className="flag-dot">{player.flag}</span>{player.country}</div></div><div className="player-card-body"><div className="player-name-row"><div><h3>{player.name}</h3><span>{player.position} · U{player.age < 16 ? '15' : player.age < 18 ? '17' : '19'}</span></div><div className="potential-score"><strong>{player.sport}</strong><span>SPORT</span></div></div><div className="academy-line"><Building2 size={14} />{player.academy}</div><div className="player-facts"><span>{player.height}</span><span>Pied {player.foot.toLowerCase()}</span></div><div className="card-stats"><div><strong>{player.goals}</strong><span>Buts</span></div><div><strong>{player.assists}</strong><span>Passes</span></div><div><strong>{player.matches}</strong><span>Matchs</span></div><div><strong>{player.academic}</strong><span>Académique</span></div></div><button className="profile-link" onClick={() => onProfile(player)}>Voir le profil <ArrowRight size={15} /></button></div></article>;
}

function PlayerProfile({ player, onBack, onNotice, onTab }: { player: Player; onBack: () => void; onNotice: (message: string) => void; onTab: (tab: 'stats' | 'videos' | 'academic') => void }) {
  return <div className="page profile-page"><button className="back-link" onClick={onBack}>← Retour aux talents</button><section className="profile-hero"><div className="profile-image" style={{ backgroundImage: `url(${player.image})` }} /><div className="profile-summary"><div className="verified-line"><ShieldCheck size={15} /> Profil vérifié <span>Mis à jour il y a 2 jours</span></div><h1>{player.name}</h1><p className="profile-position">{player.position} <span>·</span> U{player.age < 18 ? '17' : '19'} <span>·</span> {player.age} ans</p><p className="profile-academy"><Building2 size={16} /> {player.academy} <span className="flag-dot">{player.flag}</span> {player.country}</p><div className="profile-actions"><button className="button button-primary" onClick={() => onNotice('Votre demande de contact a été enregistrée.')}>Demander le contact <ArrowRight size={16} /></button><button className="icon-button large" onClick={() => onNotice('Talent ajouté à votre shortlist.')}><Heart size={18} /></button></div></div><div className="profile-score-card"><span>Score sportif</span><strong>{player.sport}<small>/100</small></strong><div className="score-bar"><i style={{ width: `${player.sport}%` }} /></div><em>Évaluation indicative</em></div></section><div className="profile-tabs"><button className="active" onClick={() => onNotice('Vous êtes déjà sur la vue d’ensemble.')}>Vue d’ensemble</button><button onClick={() => onTab('stats')}>Statistiques</button><button onClick={() => onTab('videos')}>Vidéothèque <span>12</span></button><button onClick={() => onTab('academic')}>Parcours académique</button></div><section className="profile-content"><div className="profile-main-column"><div className="content-card"><div className="content-card-heading"><div><div className="eyebrow">Identité sportive</div><h2>Le profil en un regard</h2></div><button className="more-button" onClick={() => onNotice('Options supplémentaires ouvertes.')}>•••</button></div><div className="identity-grid"><DataPoint label="Nom complet" value={player.name} /><DataPoint label="Date de naissance" value="12 mars 2009" /><DataPoint label="Nationalité" value={player.country} /><DataPoint label="Taille / poids" value={`${player.height} · 66 kg`} /><DataPoint label="Pied fort" value={`Pied ${player.foot.toLowerCase()}`} /><DataPoint label="Poste principal" value={player.position} /></div></div><div className="content-card"><div className="content-card-heading"><div><div className="eyebrow">Saison 2025/26</div><h2>Production sur le terrain</h2></div><button className="select-small" onClick={() => onNotice('Sélecteur de période ouvert.')} >Cette saison <ChevronDown size={14} /></button></div><div className="performance-grid"><Performance value={player.matches} label="Matchs" /><Performance value={player.goals} label="Buts" highlight /><Performance value={player.assists} label="Passes décisives" /><Performance value="1 964" label="Minutes" /></div><div className="chart-placeholder"><div className="chart-label"><span>Progression du niveau sportif</span><strong>+12,6% <TrendingUp size={14} /></strong></div><div className="chart-lines"><i /><i /><i /><i /><i /></div><svg viewBox="0 0 600 130" preserveAspectRatio="none" className="line-chart"><path d="M0,110 C35,103 45,89 80,96 C116,102 132,76 167,82 C202,88 212,61 248,67 C284,74 306,42 344,49 C385,57 391,74 427,54 C466,33 482,45 516,27 C548,11 568,24 600,7" fill="none" stroke="#b7d832" strokeWidth="3" /><path d="M0,110 C35,103 45,89 80,96 C116,102 132,76 167,82 C202,88 212,61 248,67 C284,74 306,42 344,49 C385,57 391,74 427,54 C466,33 482,45 516,27 C548,11 568,24 600,7 L600,130 L0,130 Z" fill="url(#chartFill)" opacity=".25" /><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#d7f04a" /><stop offset="1" stopColor="#d7f04a" stopOpacity="0" /></linearGradient></defs></svg><div className="chart-months"><span>Août</span><span>Sept.</span><span>Oct.</span><span>Nov.</span><span>Déc.</span><span>Janv.</span><span>Févr.</span></div></div></div></div><aside className="profile-side-column"><div className="content-card double-project-card"><div className="eyebrow">Double projet</div><h3>Sport & études</h3><p>Un talent complet se construit sur et en dehors du terrain.</p><div className="index-row"><div className="index-icon lime"><Zap size={17} /></div><div><span>Sport performance index</span><strong>{player.sport}<small>/100</small></strong></div></div><div className="index-row"><div className="index-icon orange"><BookOpen size={17} /></div><div><span>Academic performance index</span><strong>{player.academic}<small> moyenne</small></strong></div></div><button className="text-button" onClick={() => onTab('academic')}>Voir le dossier académique <ArrowRight size={15} /></button></div><div className="content-card scout-note"><div className="scout-note-top"><div className="avatar avatar-orange">ML</div><div><strong>Marie Laurent</strong><span>Scout vérifiée · France</span></div><Star size={17} fill="#f2b35f" color="#f2b35f" /></div><p>« Un profil explosif, très à l’aise dans les un-contre-un. Sa marge de progression est particulièrement intéressante. »</p><span className="note-date">Rapport publié le 18 févr. 2026</span></div></aside></section></div>;
}

function Dashboard({ onExplore, onNotice }: { onExplore: () => void; onNotice: (message: string) => void }) {
  return <div className="page dashboard-page"><div className="page-intro"><div><div className="eyebrow">Espace personnel</div><h1>Bonjour, Alex <span className="wave">.</span></h1><p>Voici ce qui se passe dans votre réseau aujourd’hui.</p></div><button className="button button-primary" onClick={onExplore}><Search size={17} /> Explorer les profils</button></div><div className="dashboard-kpis"><Kpi icon={Users} label="Talents suivis" value="48" trend="+6 ce mois" color="lime" /><Kpi icon={Heart} label="Ma shortlist" value="12" trend="3 nouveaux" color="orange" /><Kpi icon={FileText} label="Rapports créés" value="26" trend="+18%" color="blue" /><Kpi icon={CalendarDays} label="Essais à venir" value="04" trend="2 cette semaine" color="pink" /></div><section className="dashboard-grid"><div className="content-card activity-card"><div className="content-card-heading"><div><div className="eyebrow">Votre activité</div><h2>Progression du réseau</h2></div><button className="select-small" onClick={() => onNotice('Période du graphique modifiée.')}>30 derniers jours <ChevronDown size={14} /></button></div><div className="big-chart"><div className="big-chart-number">+24,8% <span><TrendingUp size={15} /> vs période précédente</span></div><div className="chart-placeholder tall-chart"><div className="chart-lines"><i /><i /><i /><i /><i /></div><svg viewBox="0 0 700 190" preserveAspectRatio="none" className="line-chart"><path d="M0,154 C40,143 55,150 82,135 C112,118 126,130 155,116 C188,100 206,110 239,95 C274,77 290,96 325,76 C361,54 380,66 412,55 C446,44 461,65 495,39 C529,13 548,42 580,25 C617,5 655,21 700,4" fill="none" stroke="#b7d832" strokeWidth="3.5" /><path d="M0,154 C40,143 55,150 82,135 C112,118 126,130 155,116 C188,100 206,110 239,95 C274,77 290,96 325,76 C361,54 380,66 412,55 C446,44 461,65 495,39 C529,13 548,42 580,25 C617,5 655,21 700,4 L700,190 L0,190 Z" fill="url(#dashFill)" opacity=".2" /><defs><linearGradient id="dashFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#d7f04a" /><stop offset="1" stopColor="#d7f04a" stopOpacity="0" /></linearGradient></defs></svg><div className="chart-months"><span>01 Fév.</span><span>06 Fév.</span><span>11 Fév.</span><span>16 Fév.</span><span>21 Fév.</span><span>26 Fév.</span></div></div></div></div><div className="content-card recommended-card"><div className="content-card-heading"><div><div className="eyebrow">Pour vous</div><h2>Nouveaux talents</h2></div><button className="more-button" onClick={() => onNotice('Options supplémentaires ouvertes.')}>•••</button></div><div className="mini-player-list">{players.slice(0, 3).map((player) => <button key={player.id} className="mini-player-row" onClick={onExplore}><span className="mini-row-image" style={{ backgroundImage: `url(${player.image})` }} /><span className="mini-row-copy"><strong>{player.name}</strong><small>{player.position} · {player.country}</small></span><span className="mini-row-score">{player.sport}<small>score</small></span><ArrowRight size={15} /></button>)}</div><button className="text-button" onClick={onExplore}>Voir les recommandations <ArrowRight size={15} /></button></div></section><section className="dashboard-bottom"><div className="content-card upcoming-card"><div className="content-card-heading"><div><div className="eyebrow">Agenda</div><h2>Prochaines échéances</h2></div><button className="text-button" onClick={() => onNotice('Le calendrier complet arrive bientôt.')}>Voir le calendrier <ArrowRight size={14} /></button></div><div className="calendar-row"><div className="calendar-date"><strong>24</strong><span>FÉVR.</span></div><div><strong>Essai — Moussa Traoré</strong><span>En ligne · 14:00 GMT</span></div><span className="status-pill green">Confirmé</span></div><div className="calendar-row"><div className="calendar-date orange-date"><strong>28</strong><span>FÉVR.</span></div><div><strong>Rapport à finaliser</strong><span>Kwame Mensah · Accra Football Lab</span></div><span className="status-pill yellow">À faire</span></div></div><div className="quote-card"><Sparkles size={22} /><p>“Le potentiel est une promesse. Le travail est ce qui la rend visible.”</p><span>— AfriTalents</span></div></section></div>;
}

function Metric({ icon: Icon, value, label, trend }: { icon: typeof Users; value: string; label: string; trend: string }) { return <div className="metric"><div className="metric-icon"><Icon size={18} /></div><div><strong>{value}</strong><span>{label}</span><small>{trend}</small></div></div>; }
function Kpi({ icon: Icon, label, value, trend, color }: { icon: typeof Users; label: string; value: string; trend: string; color: string }) { return <div className="kpi"><div className={`kpi-icon ${color}`}><Icon size={18} /></div><div><span>{label}</span><strong>{value}</strong><small>{trend}</small></div><ChevronDown className="kpi-arrow" size={16} /> </div>; }
function DataPoint({ label, value }: { label: string; value: string }) { return <div className="data-point"><span>{label}</span><strong>{value}</strong></div>; }
function Performance({ value, label, highlight = false }: { value: string | number; label: string; highlight?: boolean }) { return <div className={highlight ? 'performance highlight' : 'performance'}><strong>{value}</strong><span>{label}</span></div>; }

function WorkspaceHeader({ eyebrow, title, description, action, onAction }: { eyebrow: string; title: string; description: string; action: string; onAction: () => void }) {
  return <div className="page-intro"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div><button className="button button-primary" onClick={onAction}><Plus size={16} /> {action}</button></div>;
}

function Shortlists({ players, onProfile, onRemove, onNotice }: { players: Player[]; onProfile: (player: Player) => void; onRemove: (id: number) => void; onNotice: (message: string) => void }) {
  return <div className="page workspace-page"><WorkspaceHeader eyebrow="Suivi des talents" title="Mes shortlists" description="Organisez les profils qui méritent votre prochaine observation." action="Nouvelle shortlist" onAction={() => onNotice('Votre nouvelle shortlist est prête à être nommée.')} /><div className="workspace-tabs"><button className="active" onClick={() => onNotice('Tous les talents affichés.')}>Tous les talents <span>{players.length}</span></button><button onClick={() => onNotice('Filtre U17 Afrique de l’Ouest activé.')}>U17 Afrique de l’Ouest <span>8</span></button><button onClick={() => onNotice('Filtre À contacter activé.')}>À contacter <span>3</span></button></div><div className="list-card"><div className="list-card-heading"><div><strong>Talents prioritaires</strong><span>Mis à jour aujourd’hui</span></div><button className="select-small" onClick={() => onNotice('Tri par score décroissant sélectionné.')} >Score décroissant <ChevronDown size={14} /></button></div>{players.map((player) => <div className="talent-list-row" key={player.id}><span className="list-player-image" style={{ backgroundImage: `url(${player.image})` }} /><div className="talent-list-name"><strong>{player.name}</strong><span>{player.position} · {player.country}</span></div><div className="list-metric"><span>Score sport</span><strong className="lime-text">{player.sport}/100</strong></div><div className="list-metric"><span>Forme</span><strong>+12%</strong></div><span className="status-pill green">À suivre</span><button className="row-action" onClick={() => onProfile(player)}><Search size={15} /></button><button className="row-action danger" onClick={() => onRemove(player.id)}><X size={15} /></button></div>)}</div><div className="disclaimer"><ShieldCheck size={17} /><span>Les shortlists servent à organiser votre analyse. Elles ne constituent pas une recommandation définitive.</span></div></div>;
}

function Reports({ onNotice }: { onNotice: (message: string) => void }) {
  return <div className="page workspace-page"><WorkspaceHeader eyebrow="Analyse professionnelle" title="Rapports scouting" description="Centralisez vos observations et partagez des analyses structurées." action="Nouveau rapport" onAction={() => onNotice('Le formulaire de rapport est prêt à être connecté à un joueur.')} /><div className="report-stats"><Kpi icon={ClipboardList} label="Rapports rédigés" value="26" trend="+4 ce mois" color="lime" /><Kpi icon={CheckCircle2} label="Profils recommandés" value="09" trend="Cette saison" color="blue" /><Kpi icon={Target} label="À finaliser" value="04" trend="Priorité haute" color="orange" /></div><div className="report-grid"><div className="list-card"><div className="list-card-heading"><div><strong>Derniers rapports</strong><span>Vos observations récentes</span></div><button className="more-button" onClick={() => onNotice('Options supplémentaires ouvertes.')}>•••</button></div>{[['Koffi Jean','Africa Future Academy','84','Recommandé','18 févr. 2026'],['Kwame Mensah','Accra Football Lab','86','À approfondir','16 févr. 2026'],['Amara Diallo','Dakar Elite Project','81','Recommandé','12 févr. 2026']].map(([name, academy, score, status, date]) => <div className="report-row" key={name}><div className="report-avatar">{name.split(' ').map((part) => part[0]).join('')}</div><div className="talent-list-name"><strong>{name}</strong><span>{academy}</span></div><strong className="lime-text">{score}</strong><span className={status === 'Recommandé' ? 'status-pill green' : 'status-pill yellow'}>{status}</span><span className="report-date">{date}</span><button className="row-action" onClick={() => onNotice(`Ouverture du rapport de ${name}.`)}><ArrowRight size={15} /></button></div>)}</div><div className="content-card report-tip"><Sparkles size={20} /><h3>Un bon rapport rend le potentiel lisible.</h3><p>Décrivez les faits observés, séparez le niveau actuel du potentiel et gardez vos recommandations traçables.</p><button className="button button-dark" onClick={() => onNotice('Le guide de scouting sera bientôt disponible.')}>Voir le guide <ArrowRight size={15} /></button></div></div></div>;
}

function Transfers({ onNotice }: { onNotice: (message: string) => void }) {
  const steps = ['Joueur identifié', 'Demande de contact', 'Essai', 'Offre', 'Vérification', 'Finalisation'];
  return <div className="page workspace-page"><WorkspaceHeader eyebrow="Opérations sécurisées" title="Transfer Center" description="Suivez chaque étape d’une opportunité sans perdre le fil documentaire." action="Créer une opération" onAction={() => onNotice('Une nouvelle opération de transfert peut être créée après autorisation.')} /><div className="transfer-progress"><div className="transfer-progress-heading"><div><strong>Pipeline des opérations</strong><span>3 dossiers actifs</span></div><span className="status-pill green">Vue sécurisée</span></div><div className="steps">{steps.map((step, index) => <div className={index < 3 ? 'step done' : 'step'} key={step}><span>{index < 3 ? <Check size={13} /> : index + 1}</span><small>{step}</small></div>)}</div></div><div className="list-card"><div className="list-card-heading"><div><strong>Dossiers actifs</strong><span>Opérations nécessitant votre attention</span></div><button className="filter-button" onClick={() => onNotice('Filtres de transfert ouverts.')}><Filter size={15} /> Filtrer</button></div>{[['Moussa Traoré','Essai international','Club Bruges','En négociation','28 févr.'],['Koffi Jean','Premier contact','Standard Liège','Autorisation requise','02 mars'],['Kwame Mensah','Vérification documentaire','FC Nantes','En cours','06 mars']].map(([player, type, club, status, date]) => <div className="transfer-row" key={player}><div className="transfer-icon"><ArrowRight size={16} /></div><div className="talent-list-name"><strong>{player}</strong><span>{type} · {club}</span></div><span className="status-pill yellow">{status}</span><span className="report-date">{date}</span><button className="row-action" onClick={() => onNotice(`Dossier de ${player} ouvert.`)}><ArrowRight size={15} /></button></div>)}</div><div className="disclaimer"><ShieldCheck size={17} /><span>Aucune transaction financière ou contractuelle n’est simulée ici. Chaque étape nécessite les autorisations appropriées.</span></div></div>;
}

function Opportunities({ onNotice, onOpen }: { onNotice: (message: string) => void; onOpen: (opportunity: Opportunity) => void }) {
  return <div className="page workspace-page"><WorkspaceHeader eyebrow="Le prochain rendez-vous" title="Opportunités" description="Trouvez des essais, camps et détections adaptés aux profils suivis." action="Publier une opportunité" onAction={() => onNotice('La publication est réservée aux organisations vérifiées.')} /><div className="opportunity-filter"><div className="search-field"><Search size={17} /><input placeholder="Rechercher une opportunité..." /></div><button className="select-small" onClick={() => onNotice('Filtre des pays ouvert.')}>Tous les pays <ChevronDown size={14} /></button><button className="select-small" onClick={() => onNotice('Filtre des types ouvert.')}>Tous les types <ChevronDown size={14} /></button></div><div className="opportunity-grid">{opportunities.map((opportunity) => <article className="opportunity-card" key={opportunity.id}><div className="opportunity-card-top"><span className="opportunity-type">{opportunity.type}</span><button className="favorite-button" onClick={() => onNotice('Opportunité ajoutée à vos favoris.')}><Heart size={16} /></button></div><h3>{opportunity.title}</h3><p>{opportunity.organisation}</p><div className="opportunity-meta"><span><Globe2 size={13} />{opportunity.location}</span><span><Users size={13} />{opportunity.age}</span><span><CalendarDays size={13} />{opportunity.places}</span></div><button className="profile-link" onClick={() => onOpen(opportunity)}>Voir les détails <ArrowRight size={15} /></button></article>)}</div></div>;
}

function Messages({ onNotice }: { onNotice: (message: string) => void }) {
  return <div className="page workspace-page"><WorkspaceHeader eyebrow="Réseau professionnel" title="Messages" description="Gardez les échanges importants autour des talents au même endroit." action="Nouveau message" onAction={() => onNotice('Choisissez d’abord un contact autorisé.')} /><div className="messages-layout"><div className="message-list"><div className="message-search search-field"><Search size={16} /><input placeholder="Rechercher une conversation" /></div>{[['Marie Laurent','Koffi Jean · Rapport scouting','Il y a 2 h','ML'],['Africa Future Academy','Invitation à un essai','Hier','AF'],['Club Bruges Academy','Demande d’informations','18 févr.','CB']].map(([name, preview, time, initials], index) => <button className={index === 0 ? 'conversation active' : 'conversation'} key={name} onClick={() => onNotice(`Conversation avec ${name} ouverte.`)}><div className="avatar avatar-orange">{initials}</div><div><strong>{name}</strong><span>{preview}</span></div><small>{time}</small></button>)}</div><div className="conversation-panel"><div className="conversation-header"><div className="avatar avatar-orange">ML</div><div><strong>Marie Laurent</strong><span>Scout vérifiée · France</span></div><ShieldCheck size={16} /></div><div className="conversation-body"><div className="message-bubble received">Bonjour Alex, j’ai finalisé mon rapport sur Koffi Jean. Son profil mérite une observation complémentaire.<small>14:22</small></div><div className="message-bubble sent">Merci Marie. Je l’ajoute à la shortlist prioritaire et je vérifie les disponibilités pour un essai.<small>14:35</small></div></div><div className="message-compose"><input placeholder="Écrire un message..." /><button onClick={() => onNotice('Le message a été préparé.')}><Send size={16} /></button></div></div></div></div>;
}

function AcademyRegistration({ onNotice }: { onNotice: (message: string) => void }) {
  return <div className="page workspace-page"><WorkspaceHeader eyebrow="Rejoindre le réseau" title="Inscrire mon académie" description="Présentez votre structure et construisez un espace de gestion pour vos joueurs." action="Enregistrer le brouillon" onAction={() => onNotice('Le brouillon de votre académie a été enregistré.')} /><div className="academy-form-grid"><div className="content-card academy-form"><div className="eyebrow">Informations principales</div><h2>Parlez-nous de votre académie</h2><label>Nom de l’académie<input defaultValue="Galaxie Saint Koffi" /></label><div className="form-two"><label>Pays<select defaultValue="Côte d’Ivoire"><option>Côte d’Ivoire</option><option>Sénégal</option><option>Ghana</option><option>Mali</option></select></label><label>Ville<input defaultValue="Abidjan" /></label></div><label>Description<textarea defaultValue="Une académie dédiée au développement sportif et scolaire des jeunes talents." /></label><button className="button button-primary" onClick={() => onNotice('Votre demande d’inscription a été envoyée pour vérification.')}><Send size={15} /> Soumettre pour vérification</button></div><div className="content-card upload-card"><div className="upload-icon"><Upload size={20} /></div><h3>Ajoutez votre identité visuelle</h3><p>Logo, présentation et éléments de vérification renforcent la confiance de votre profil.</p><button className="button button-ghost" onClick={() => onNotice('Sélection du logo ouverte.')}><Upload size={15} /> Ajouter un logo</button><div className="verification-list"><span><CheckCircle2 size={15} /> Profil public personnalisable</span><span><CheckCircle2 size={15} /> Gestion des joueurs</span><span><CheckCircle2 size={15} /> Accès aux opportunités</span></div></div></div></div>;
}

function OpportunityDetail({ opportunity, onBack, onNotice }: { opportunity: Opportunity; onBack: () => void; onNotice: (message: string) => void }) {
  return <div className="page workspace-page"><button className="back-link" onClick={onBack}><ArrowLeft size={14} /> Retour aux opportunités</button><div className="detail-hero"><div><span className="opportunity-type">{opportunity.type}</span><h1>{opportunity.title}</h1><p className="detail-lead">{opportunity.description}</p><div className="detail-organisation"><div className="organisation-logo">AF</div><div><strong>{opportunity.organisation}</strong><span>Organisation vérifiée par AfriTalents</span></div><ShieldCheck size={16} /></div></div><div className="detail-hero-art"><Target size={48} /><span>OPPORTUNITY<br />BRIEF</span></div></div><div className="detail-layout"><main><div className="content-card"><div className="content-card-heading"><div><div className="eyebrow">À propos</div><h2>Une opportunité pensée pour révéler le potentiel</h2></div><span className="status-pill green">Ouverte</span></div><p className="detail-copy">Cette opportunité permet aux jeunes joueurs de se faire observer dans un cadre structuré, avec un retour clair sur leur niveau actuel et leurs prochaines étapes.</p><div className="detail-facts"><div><CalendarDays size={16} /><span>Date<strong>{opportunity.date}</strong></span></div><div><Globe2 size={16} /><span>Lieu<strong>{opportunity.location}</strong></span></div><div><Users size={16} /><span>Éligibilité<strong>{opportunity.age}</strong></span></div><div><UserCheck size={16} /><span>Disponibilité<strong>{opportunity.places}</strong></span></div></div></div><div className="content-card"><div className="eyebrow">Déroulé</div><h2>Ce que vous pouvez attendre</h2><div className="detail-timeline"><div><span>01</span><p><strong>Analyse du profil</strong><small>Votre dossier est étudié avant la confirmation.</small></p></div><div><span>02</span><p><strong>Invitation officielle</strong><small>Les informations pratiques sont partagées dans votre espace.</small></p></div><div><span>03</span><p><strong>Observation terrain</strong><small>Les performances sont évaluées par des recruteurs vérifiés.</small></p></div></div></div></main><aside className="detail-aside"><div className="content-card apply-card"><div className="eyebrow">Prochaine étape</div><h3>Votre profil correspond-il ?</h3><p>Ajoutez cette opportunité à votre suivi et préparez votre dossier.</p><button className="button button-primary" onClick={() => onNotice('Opportunité ajoutée à votre liste de suivi.')}><Heart size={15} /> Ajouter au suivi</button><button className="button button-ghost" onClick={() => onNotice('Votre demande de contact a été préparée.')}><Send size={15} /> Demander un contact</button></div><div className="content-card"><div className="side-line"><ShieldCheck size={17} /><span><strong>Cadre vérifié</strong>Les organisations passent par un processus de vérification.</span></div><div className="side-line"><Clock3 size={17} /><span><strong>Réponse rapide</strong>Recevez les prochaines informations dans votre messagerie.</span></div></div></aside></div></div>;
}

function PlayerStats({ player, onBack, onNotice }: { player: Player; onBack: () => void; onNotice: (message: string) => void }) {
  const stats = [['Vitesse', '88', '+6'], ['Technique', '84', '+4'], ['Vision', '91', '+9'], ['Mental', '86', '+5']];
  return <div className="page workspace-page"><button className="back-link" onClick={onBack}><ArrowLeft size={14} /> Retour au profil</button><div className="page-intro"><div><div className="eyebrow">Performance individuelle</div><h1>Statistiques de {player.name}</h1><p>Une lecture claire des performances observées et du potentiel projeté.</p></div><span className="status-pill green">Dernière mise à jour · aujourd’hui</span></div><div className="stats-overview"><div className="content-card stats-score"><span>Score sport global</span><strong>{player.sport}</strong><div className="score-bar"><i style={{ width: `${player.sport}%` }} /></div><small>Top 8% des profils de sa catégorie</small></div><div className="content-card"><div className="eyebrow">Progression</div><h2>Indice de développement</h2><div className="big-chart-number">+18.4% <span>sur les 6 derniers mois</span></div><div className="stats-bars">{[64, 70, 73, 78, 82, 88].map((value, index) => <div key={value}><span style={{ height: `${value}%` }} /><small>{['Sep', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév'][index]}</small></div>)}</div></div></div><div className="content-card stat-table"><div className="content-card-heading"><div><div className="eyebrow">Détail des indicateurs</div><h2>Les qualités qui font la différence</h2></div><button className="select-small" onClick={() => onNotice('Sélecteur de période ouvert.')} >Cette saison <ChevronDown size={14} /></button></div>{stats.map(([label, value, trend]) => <div className="stat-line" key={label}><span>{label}</span><div className="stat-line-track"><i style={{ width: `${value}%` }} /></div><strong>{value}</strong><small>{trend}%</small></div>)}</div></div>;
}

function VideoLibrary({ player, onBack, onNotice }: { player: Player; onBack: () => void; onNotice: (message: string) => void }) {
  const videos = [['Analyse offensive — match U17', '02:48', 'Hier'], ['Séquence technique — conduite de balle', '01:32', '12 févr.'], ['Résumé tournoi régional', '04:16', '08 févr.'], ['Séance individuelle — finition', '03:05', '01 févr.']];
  return <div className="page workspace-page"><button className="back-link" onClick={onBack}><ArrowLeft size={14} /> Retour au profil</button><div className="page-intro"><div><div className="eyebrow">Observations vidéo</div><h1>Vidéothèque</h1><p>Les séquences qui donnent du contexte aux statistiques de {player.name}.</p></div><button className="button button-primary" onClick={() => onNotice('Ajout d’une vidéo ouvert.')}><Upload size={15} /> Ajouter une vidéo</button></div><div className="video-feature"><div className="video-feature-image" style={{ backgroundImage: `url(${player.image})` }}><button className="play-large" onClick={() => onNotice('Lecture de la vidéo lancée.')}><Play size={24} fill="currentColor" /></button><span>LECTURE RECOMMANDÉE</span></div><div className="video-feature-copy"><div className="eyebrow">Séquence sélectionnée</div><h2>Analyse offensive — match U17</h2><p>Une séquence courte pour observer les appels, la prise d’information et la qualité de décision dans le dernier tiers.</p><div className="video-meta"><span><Clock3 size={14} /> 02:48</span><span><Eye size={14} /> 182 vues</span><span><ShieldCheck size={14} /> Vérifiée</span></div></div></div><div className="video-grid">{videos.map(([title, duration, date]) => <button className="video-card" key={title} onClick={() => onNotice(`Lecture de « ${title} » lancée.`)}><div className="video-thumb" style={{ backgroundImage: `url(${player.image})` }}><span><Play size={14} fill="currentColor" /></span><small>{duration}</small></div><strong>{title}</strong><p>{date} · Observation AfriTalents</p></button>)}</div></div>;
}

function AcademicPath({ player, onBack, onNotice }: { player: Player; onBack: () => void; onNotice: (message: string) => void }) {
  return <div className="page workspace-page"><button className="back-link" onClick={onBack}><ArrowLeft size={14} /> Retour au profil</button><div className="page-intro"><div><div className="eyebrow">Au-delà du terrain</div><h1>Parcours académique</h1><p>Le contexte scolaire et les prochaines étapes d’accompagnement de {player.name}.</p></div><button className="button button-ghost" onClick={() => onNotice('Le dossier académique a été partagé avec votre équipe.')}><Share2 size={15} /> Partager le dossier</button></div><div className="academic-grid"><div className="content-card academic-summary"><div className="student-head"><div className="avatar avatar-lime">{player.name.split(' ').map((part) => part[0]).join('')}</div><div><strong>{player.name}</strong><span>Élève-athlète · U17</span></div><span className="status-pill green">Suivi actif</span></div><div className="academic-score"><span>Indice académique</span><strong>86<small>/100</small></strong><p>Régularité et engagement au-dessus de la moyenne.</p></div><div className="academic-points"><div><BookOpen size={16} /><span>Classe actuelle<strong>Seconde générale</strong></span></div><div><CalendarDays size={16} /><span>Prochaine étape<strong>Orientation 2026</strong></span></div><div><Globe2 size={16} /><span>Langues<strong>Français · Anglais</strong></span></div></div></div><div className="content-card academic-timeline"><div className="eyebrow">Chronologie</div><h2>Un parcours équilibré</h2><div className="academic-event"><span>2026</span><div><strong>Préparation à l’orientation</strong><p>Choix d’une filière compatible avec un projet sportif international.</p></div></div><div className="academic-event"><span>2025</span><div><strong>Certification d’anglais</strong><p>Progression confirmée lors du dernier trimestre.</p></div></div><div className="academic-event"><span>2024</span><div><strong>Entrée au programme sport-études</strong><p>Début du suivi individualisé et des bilans trimestriels.</p></div></div></div></div><div className="disclaimer"><ShieldCheck size={17} /><span>Les informations académiques sont partagées uniquement avec les personnes autorisées par le joueur ou sa structure.</span></div></div>;
}

export default App;
