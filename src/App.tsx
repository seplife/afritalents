import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleUserRound,
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
} from 'lucide-react';

type View = 'home' | 'talents' | 'dashboard' | 'profile';
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
          <div className="brand-mark"><Sparkles size={18} strokeWidth={2.5} /></div>
          <div><strong>AfriTalents</strong><span>Football intelligence</span></div>
        </div>
        <div className="workspace-label">ESPACE EXPLORATION</div>
        <nav className="side-nav">
          {navItems.map(({ label, view: itemView, icon: Icon }) => (
            <button key={label} className={view === itemView ? 'nav-item active' : 'nav-item'} onClick={() => { setView(itemView); setMobileMenu(false); }}>
              <Icon size={18} /><span>{label}</span>{itemView === 'talents' && <span className="nav-badge">24</span>}
            </button>
          ))}
          <button className="nav-item" onClick={() => showNotice('Les shortlists arrivent dans la prochaine version.')}><Heart size={18} /><span>Mes shortlists</span></button>
          <button className="nav-item" onClick={() => showNotice('Les rapports de scouting arrivent dans la prochaine version.')}><ClipboardList size={18} /><span>Rapports scouting</span></button>
        </nav>
        <div className="workspace-label secondary">OUTILS</div>
        <nav className="side-nav">
          <button className="nav-item" onClick={() => showNotice('Le centre de transferts est en cours de développement.')}><ArrowRight size={18} /><span>Transfer Center</span><span className="soon">Bientôt</span></button>
          <button className="nav-item" onClick={() => showNotice('Les opportunités seront bientôt disponibles.')}><Target size={18} /><span>Opportunités</span></button>
          <button className="nav-item" onClick={() => showNotice('Les messages seront bientôt disponibles.')}><MessageSquare size={18} /><span>Messages</span><span className="dot" /></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="verification-card"><ShieldCheck size={18} /><div><strong>Vos données sont protégées</strong><span>Conçu pour les talents mineurs</span></div></div>
          <div className="user-mini"><div className="avatar avatar-lime">AF</div><div><strong>Alex Football</strong><span>Scout indépendant</span></div><ChevronDown size={16} /></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Ouvrir le menu"><Menu size={22} /></button>
          <div className="breadcrumbs"><span>AfriTalents</span><span>/</span><strong>{view === 'home' ? 'Vue d’ensemble' : view === 'talents' ? 'Découvrir les talents' : view === 'profile' ? 'Profil joueur' : 'Mon espace'}</strong></div>
          <div className="topbar-actions"><button className="icon-button" onClick={() => showNotice('Vous êtes à jour.')} aria-label="Notifications"><Bell size={18} /><span className="notification-dot" /></button><button className="help-button" onClick={() => showNotice('Notre équipe vous répondra prochainement.')}>Besoin d’aide ?</button><div className="avatar avatar-dark">AF</div></div>
        </header>

        {view === 'home' && <Home onExplore={() => setView('talents')} onProfile={() => goToProfile(players[0])} onNotice={showNotice} />}
        {view === 'talents' && <TalentExplorer query={query} setQuery={setQuery} position={position} setPosition={setPosition} players={filteredPlayers} onProfile={goToProfile} />}
        {view === 'profile' && <PlayerProfile player={selectedPlayer} onBack={() => setView('talents')} onNotice={showNotice} />}
        {view === 'dashboard' && <Dashboard onExplore={() => setView('talents')} onNotice={showNotice} />}
      </main>
      {notice && <div className="toast"><Check size={17} />{notice}<button onClick={() => setNotice('')}><X size={14} /></button></div>}
    </div>
  );
}

function Home({ onExplore, onProfile, onNotice }: { onExplore: () => void; onProfile: () => void; onNotice: (message: string) => void }) {
  return <div className="page home-page">
    <section className="hero-grid">
      <div className="hero-copy"><div className="eyebrow"><span className="pulse" />Réseau africain de talents</div><h1>Les talents africains méritent <em>d’être vus.</em></h1><p>Découvrez, développez et connectez les jeunes footballeurs africains aux académies, scouts et clubs du monde entier.</p><div className="hero-actions"><button className="button button-primary" onClick={onExplore}>Explorer les talents <ArrowRight size={17} /></button><button className="button button-ghost" onClick={() => onNotice('Le formulaire d’inscription académie sera bientôt disponible.')}>Inscrire mon académie</button></div><div className="hero-proof"><div className="proof-avatars"><span className="avatar avatar-photo photo-one" /><span className="avatar avatar-photo photo-two" /><span className="avatar avatar-photo photo-three" /><span className="avatar avatar-more">+2k</span></div><div><strong>2 480+ profils actifs</strong><span>dans 17 pays africains</span></div></div></div>
      <div className="hero-visual"><div className="hero-photo" /><div className="hero-photo-overlay" /><div className="hero-stat hero-stat-top"><div className="stat-icon stat-icon-lime"><TrendingUp size={17} /></div><div><span>Profils en progression</span><strong>+28,4%</strong></div><span className="trend-up">↗</span></div><div className="hero-card-float"><div className="float-label"><span className="live-dot" />Talent du moment</div><div className="float-player"><div className="mini-player-photo" /><div><strong>Koffi Jean</strong><span>Ailier droit · U17</span><small><span className="flag-dot">CI</span> Côte d’Ivoire</small></div><div className="score-ring">84<small>SPORT</small></div></div><div className="float-divider" /><div className="float-footer"><span>Sport performance</span><strong>84 <small>/ 100</small></strong></div></div><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /></div>
    </section>

    <section className="metrics-row"><Metric icon={Users} value="2 480" label="Talents référencés" trend="+18% ce mois" /><Metric icon={Globe2} value="17" label="Pays représentés" trend="Afrique & diaspora" /><Metric icon={Building2} value="186" label="Académies partenaires" trend="Vérifiées" /><Metric icon={Trophy} value="42" label="Opportunités actives" trend="Cette semaine" /></section>

    <section className="section-block featured-section"><div className="section-heading"><div><div className="eyebrow">Sélection de la semaine</div><h2>Talents à la une</h2><p>Des profils prometteurs sélectionnés par notre réseau de scouts.</p></div><button className="text-button" onClick={onExplore}>Voir tous les talents <ArrowRight size={16} /></button></div><div className="player-grid">{players.slice(0, 3).map((player) => <PlayerCard key={player.id} player={player} onProfile={onProfile} />)}</div></section>

    <section className="double-section"><div className="insight-card"><div className="card-topline"><div className="eyebrow">Le double projet</div><BookOpen size={19} /></div><h3>Former le joueur<br /><em>sans sacrifier l’élève.</em></h3><p>Un dossier unique pour suivre la progression sportive et académique de chaque jeune talent.</p><div className="progress-pair"><div><span>Performance sportive</span><strong>84<span>/100</span></strong><div className="progress-track"><i style={{ width: '84%' }} /></div></div><div><span>Performance académique</span><strong>14,7<span>/20</span></strong><div className="progress-track orange"><i style={{ width: '74%' }} /></div></div></div><button className="button button-dark" onClick={() => onNotice('Le parcours académique détaillé arrive dans la prochaine version.')}>Découvrir le parcours <ArrowRight size={16} /></button></div><div className="story-card"><div className="story-image" /><div className="story-overlay" /><div className="story-content"><div className="eyebrow light">African talent stories</div><h3>Chaque parcours<br />commence quelque part.</h3><button className="circle-button" onClick={() => onNotice('Les histoires de talents arrivent prochainement.')}><Play size={17} fill="currentColor" /></button><span className="story-caption">Voir l’histoire de Youssouf<br /><small>De Bamako à Bruxelles</small></span></div></div></section>

    <div className="disclaimer"><ShieldCheck size={17} /><span>Les scores et projections sont des outils d’aide à l’analyse. Ils ne garantissent ni recrutement, ni transfert, ni carrière professionnelle.</span></div>
  </div>;
}

function TalentExplorer({ query, setQuery, position, setPosition, players, onProfile }: { query: string; setQuery: (value: string) => void; position: string; setPosition: (value: string) => void; players: Player[]; onProfile: (player: Player) => void }) {
  return <div className="page explorer-page"><div className="page-intro"><div><div className="eyebrow">Base de talents</div><h1>Découvrir les talents</h1><p>Explorez les profils qui façonnent le prochain chapitre du football africain.</p></div><button className="button button-primary"><SlidersHorizontal size={17} /> Enregistrer une alerte</button></div><div className="explorer-toolbar"><div className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un nom, une académie, un pays..." /></div><div className="select-field"><Filter size={16} /><select value={position} onChange={(event) => setPosition(event.target.value)}><option>Toutes les positions</option><option>Ailier droit</option><option>Milieu central</option><option>Défenseur central</option><option>Attaquant</option></select><ChevronDown size={15} /></div><button className="filter-button"><Filter size={17} /> Filtres avancés <span>3</span></button></div><div className="active-filters"><span>Afrique <X size={13} /></span><span>U13 — U19 <X size={13} /></span><span>Profil vérifié <X size={13} /></span><button>Réinitialiser</button></div><div className="result-heading"><strong>{players.length * 186} <span>talents correspondent</span></strong><button className="sort-button">Trier par : <b>Score de potentiel</b><ChevronDown size={14} /></button></div><div className="player-grid explorer-grid">{players.length ? players.map((player) => <PlayerCard key={player.id} player={player} onProfile={onProfile} />) : <div className="empty-state"><Search size={26} /><h3>Aucun talent trouvé</h3><p>Essayez une autre recherche ou retirez un filtre.</p></div>}</div></div>;
}

function PlayerCard({ player, onProfile }: { player: Player; onProfile: (player: Player) => void }) {
  return <article className="player-card"><div className="player-card-image" style={{ backgroundImage: `url(${player.image})` }}><div className="card-image-shade" /><div className="verified-badge"><ShieldCheck size={13} /> Vérifié</div><button className="favorite-button" aria-label="Ajouter aux favoris"><Heart size={17} /></button><div className="card-location"><span className="flag-dot">{player.flag}</span>{player.country}</div></div><div className="player-card-body"><div className="player-name-row"><div><h3>{player.name}</h3><span>{player.position} · U{player.age < 16 ? '15' : player.age < 18 ? '17' : '19'}</span></div><div className="potential-score"><strong>{player.sport}</strong><span>SPORT</span></div></div><div className="academy-line"><Building2 size={14} />{player.academy}</div><div className="player-facts"><span>{player.height}</span><span>Pied {player.foot.toLowerCase()}</span></div><div className="card-stats"><div><strong>{player.goals}</strong><span>Buts</span></div><div><strong>{player.assists}</strong><span>Passes</span></div><div><strong>{player.matches}</strong><span>Matchs</span></div><div><strong>{player.academic}</strong><span>Académique</span></div></div><button className="profile-link" onClick={() => onProfile(player)}>Voir le profil <ArrowRight size={15} /></button></div></article>;
}

function PlayerProfile({ player, onBack, onNotice }: { player: Player; onBack: () => void; onNotice: (message: string) => void }) {
  return <div className="page profile-page"><button className="back-link" onClick={onBack}>← Retour aux talents</button><section className="profile-hero"><div className="profile-image" style={{ backgroundImage: `url(${player.image})` }} /><div className="profile-summary"><div className="verified-line"><ShieldCheck size={15} /> Profil vérifié <span>Mis à jour il y a 2 jours</span></div><h1>{player.name}</h1><p className="profile-position">{player.position} <span>·</span> U{player.age < 18 ? '17' : '19'} <span>·</span> {player.age} ans</p><p className="profile-academy"><Building2 size={16} /> {player.academy} <span className="flag-dot">{player.flag}</span> {player.country}</p><div className="profile-actions"><button className="button button-primary" onClick={() => onNotice('Votre demande de contact a été enregistrée.')}>Demander le contact <ArrowRight size={16} /></button><button className="icon-button large" onClick={() => onNotice('Talent ajouté à votre shortlist.')}><Heart size={18} /></button></div></div><div className="profile-score-card"><span>Score sportif</span><strong>{player.sport}<small>/100</small></strong><div className="score-bar"><i style={{ width: `${player.sport}%` }} /></div><em>Évaluation indicative</em></div></section><div className="profile-tabs"><button className="active">Vue d’ensemble</button><button onClick={() => onNotice('Les statistiques détaillées arrivent prochainement.')}>Statistiques</button><button onClick={() => onNotice('La vidéothèque arrive prochainement.')}>Vidéothèque <span>12</span></button><button onClick={() => onNotice('Le parcours académique arrive prochainement.')}>Parcours académique</button></div><section className="profile-content"><div className="profile-main-column"><div className="content-card"><div className="content-card-heading"><div><div className="eyebrow">Identité sportive</div><h2>Le profil en un regard</h2></div><button className="more-button">•••</button></div><div className="identity-grid"><DataPoint label="Nom complet" value={player.name} /><DataPoint label="Date de naissance" value="12 mars 2009" /><DataPoint label="Nationalité" value={player.country} /><DataPoint label="Taille / poids" value={`${player.height} · 66 kg`} /><DataPoint label="Pied fort" value={`Pied ${player.foot.toLowerCase()}`} /><DataPoint label="Poste principal" value={player.position} /></div></div><div className="content-card"><div className="content-card-heading"><div><div className="eyebrow">Saison 2025/26</div><h2>Production sur le terrain</h2></div><button className="select-small">Cette saison <ChevronDown size={14} /></button></div><div className="performance-grid"><Performance value={player.matches} label="Matchs" /><Performance value={player.goals} label="Buts" highlight /><Performance value={player.assists} label="Passes décisives" /><Performance value="1 964" label="Minutes" /></div><div className="chart-placeholder"><div className="chart-label"><span>Progression du niveau sportif</span><strong>+12,6% <TrendingUp size={14} /></strong></div><div className="chart-lines"><i /><i /><i /><i /><i /></div><svg viewBox="0 0 600 130" preserveAspectRatio="none" className="line-chart"><path d="M0,110 C35,103 45,89 80,96 C116,102 132,76 167,82 C202,88 212,61 248,67 C284,74 306,42 344,49 C385,57 391,74 427,54 C466,33 482,45 516,27 C548,11 568,24 600,7" fill="none" stroke="#b7d832" strokeWidth="3" /><path d="M0,110 C35,103 45,89 80,96 C116,102 132,76 167,82 C202,88 212,61 248,67 C284,74 306,42 344,49 C385,57 391,74 427,54 C466,33 482,45 516,27 C548,11 568,24 600,7 L600,130 L0,130 Z" fill="url(#chartFill)" opacity=".25" /><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#d7f04a" /><stop offset="1" stopColor="#d7f04a" stopOpacity="0" /></linearGradient></defs></svg><div className="chart-months"><span>Août</span><span>Sept.</span><span>Oct.</span><span>Nov.</span><span>Déc.</span><span>Janv.</span><span>Févr.</span></div></div></div></div><aside className="profile-side-column"><div className="content-card double-project-card"><div className="eyebrow">Double projet</div><h3>Sport & études</h3><p>Un talent complet se construit sur et en dehors du terrain.</p><div className="index-row"><div className="index-icon lime"><Zap size={17} /></div><div><span>Sport performance index</span><strong>{player.sport}<small>/100</small></strong></div></div><div className="index-row"><div className="index-icon orange"><BookOpen size={17} /></div><div><span>Academic performance index</span><strong>{player.academic}<small> moyenne</small></strong></div></div><button className="text-button" onClick={() => onNotice('Le dossier académique est accessible sur invitation du représentant légal.')}>Voir le dossier académique <ArrowRight size={15} /></button></div><div className="content-card scout-note"><div className="scout-note-top"><div className="avatar avatar-orange">ML</div><div><strong>Marie Laurent</strong><span>Scout vérifiée · France</span></div><Star size={17} fill="#f2b35f" color="#f2b35f" /></div><p>« Un profil explosif, très à l’aise dans les un-contre-un. Sa marge de progression est particulièrement intéressante. »</p><span className="note-date">Rapport publié le 18 févr. 2026</span></div></aside></section></div>;
}

function Dashboard({ onExplore, onNotice }: { onExplore: () => void; onNotice: (message: string) => void }) {
  return <div className="page dashboard-page"><div className="page-intro"><div><div className="eyebrow">Espace personnel</div><h1>Bonjour, Alex <span className="wave">.</span></h1><p>Voici ce qui se passe dans votre réseau aujourd’hui.</p></div><button className="button button-primary" onClick={onExplore}><Search size={17} /> Explorer les profils</button></div><div className="dashboard-kpis"><Kpi icon={Users} label="Talents suivis" value="48" trend="+6 ce mois" color="lime" /><Kpi icon={Heart} label="Ma shortlist" value="12" trend="3 nouveaux" color="orange" /><Kpi icon={FileText} label="Rapports créés" value="26" trend="+18%" color="blue" /><Kpi icon={CalendarDays} label="Essais à venir" value="04" trend="2 cette semaine" color="pink" /></div><section className="dashboard-grid"><div className="content-card activity-card"><div className="content-card-heading"><div><div className="eyebrow">Votre activité</div><h2>Progression du réseau</h2></div><button className="select-small">30 derniers jours <ChevronDown size={14} /></button></div><div className="big-chart"><div className="big-chart-number">+24,8% <span><TrendingUp size={15} /> vs période précédente</span></div><div className="chart-placeholder tall-chart"><div className="chart-lines"><i /><i /><i /><i /><i /></div><svg viewBox="0 0 700 190" preserveAspectRatio="none" className="line-chart"><path d="M0,154 C40,143 55,150 82,135 C112,118 126,130 155,116 C188,100 206,110 239,95 C274,77 290,96 325,76 C361,54 380,66 412,55 C446,44 461,65 495,39 C529,13 548,42 580,25 C617,5 655,21 700,4" fill="none" stroke="#b7d832" strokeWidth="3.5" /><path d="M0,154 C40,143 55,150 82,135 C112,118 126,130 155,116 C188,100 206,110 239,95 C274,77 290,96 325,76 C361,54 380,66 412,55 C446,44 461,65 495,39 C529,13 548,42 580,25 C617,5 655,21 700,4 L700,190 L0,190 Z" fill="url(#dashFill)" opacity=".2" /><defs><linearGradient id="dashFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#d7f04a" /><stop offset="1" stopColor="#d7f04a" stopOpacity="0" /></linearGradient></defs></svg><div className="chart-months"><span>01 Fév.</span><span>06 Fév.</span><span>11 Fév.</span><span>16 Fév.</span><span>21 Fév.</span><span>26 Fév.</span></div></div></div></div><div className="content-card recommended-card"><div className="content-card-heading"><div><div className="eyebrow">Pour vous</div><h2>Nouveaux talents</h2></div><button className="more-button">•••</button></div><div className="mini-player-list">{players.slice(0, 3).map((player) => <button key={player.id} className="mini-player-row" onClick={onExplore}><span className="mini-row-image" style={{ backgroundImage: `url(${player.image})` }} /><span className="mini-row-copy"><strong>{player.name}</strong><small>{player.position} · {player.country}</small></span><span className="mini-row-score">{player.sport}<small>score</small></span><ArrowRight size={15} /></button>)}</div><button className="text-button" onClick={onExplore}>Voir les recommandations <ArrowRight size={15} /></button></div></section><section className="dashboard-bottom"><div className="content-card upcoming-card"><div className="content-card-heading"><div><div className="eyebrow">Agenda</div><h2>Prochaines échéances</h2></div><button className="text-button" onClick={() => onNotice('Le calendrier complet arrive bientôt.')}>Voir le calendrier <ArrowRight size={14} /></button></div><div className="calendar-row"><div className="calendar-date"><strong>24</strong><span>FÉVR.</span></div><div><strong>Essai — Moussa Traoré</strong><span>En ligne · 14:00 GMT</span></div><span className="status-pill green">Confirmé</span></div><div className="calendar-row"><div className="calendar-date orange-date"><strong>28</strong><span>FÉVR.</span></div><div><strong>Rapport à finaliser</strong><span>Kwame Mensah · Accra Football Lab</span></div><span className="status-pill yellow">À faire</span></div></div><div className="quote-card"><Sparkles size={22} /><p>“Le potentiel est une promesse. Le travail est ce qui la rend visible.”</p><span>— AfriTalents</span></div></section></div>;
}

function Metric({ icon: Icon, value, label, trend }: { icon: typeof Users; value: string; label: string; trend: string }) { return <div className="metric"><div className="metric-icon"><Icon size={18} /></div><div><strong>{value}</strong><span>{label}</span><small>{trend}</small></div></div>; }
function Kpi({ icon: Icon, label, value, trend, color }: { icon: typeof Users; label: string; value: string; trend: string; color: string }) { return <div className="kpi"><div className={`kpi-icon ${color}`}><Icon size={18} /></div><div><span>{label}</span><strong>{value}</strong><small>{trend}</small></div><ChevronDown className="kpi-arrow" size={16} /> </div>; }
function DataPoint({ label, value }: { label: string; value: string }) { return <div className="data-point"><span>{label}</span><strong>{value}</strong></div>; }
function Performance({ value, label, highlight = false }: { value: string | number; label: string; highlight?: boolean }) { return <div className={highlight ? 'performance highlight' : 'performance'}><strong>{value}</strong><span>{label}</span></div>; }

export default App;
