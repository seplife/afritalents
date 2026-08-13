import { useState } from 'react';
import { ShieldCheck, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function AuthPanel({ onNotice }: { onNotice: (message: string) => void }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'academy' | 'scout'>('scout');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    if (mode === 'login') {
      const { error: signInError } = await signIn(email, password);
      if (signInError) setError(signInError);
      else onNotice('Connexion réussie.');
    } else {
      const { error: signUpError } = await signUp(email, password, fullName, role);
      if (signUpError) setError(signUpError);
      else onNotice('Compte créé. Vous pouvez désormais vous connecter.');
    }
    setSubmitting(false);
  };

  return (
    <div className="page workspace-page">
      <div className="academy-form-grid">
        <div className="content-card academy-form">
          <div className="eyebrow">Espace professionnel</div>
          <h2>{mode === 'login' ? 'Connexion' : 'Créer un compte'}</h2>
          <div className="workspace-tabs" style={{ marginBottom: 8 }}>
            <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')} type="button">
              <LogIn size={14} /> Se connecter
            </button>
            <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')} type="button">
              <UserPlus size={14} /> S’inscrire
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <label>
                Nom complet
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Ex. Alex Football" />
              </label>
            )}
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="vous@exemple.com" />
            </label>
            <label>
              Mot de passe
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="6 caractères minimum" />
            </label>
            {mode === 'signup' && (
              <label>
                Vous êtes
                <select value={role} onChange={(e) => setRole(e.target.value as 'academy' | 'scout')}>
                  <option value="scout">Scout / recruteur indépendant</option>
                  <option value="academy">Académie ou club</option>
                </select>
              </label>
            )}
            {error && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>{error}</p>}
            <button className="button button-primary" type="submit" disabled={submitting} style={{ marginTop: 12 }}>
              {submitting ? 'Veuillez patienter…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>
        </div>
        <div className="content-card upload-card">
          <div className="upload-icon">
            <ShieldCheck size={20} />
          </div>
          <h3>Accès sécurisé par rôle</h3>
          <p>
            Les comptes <strong>administrateur</strong> sont créés manuellement depuis Supabase pour des raisons de
            sécurité. Les comptes <strong>académie</strong> et <strong>scout</strong> peuvent s’inscrire librement
            ci-contre ; l’accès administrateur complet doit être accordé par un administrateur existant.
          </p>
          <div className="verification-list">
            <span>Administrateur — gère tous les joueurs et publications</span>
            <span>Académie — gère les joueurs de sa structure</span>
            <span>Scout — consulte, shortlist et rédige des rapports</span>
          </div>
        </div>
      </div>
    </div>
  );
}
