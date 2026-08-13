import { useEffect, useState } from 'react';
import { Search, Send, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

type Message = { id: string; sender_id: string; content: string; created_at: string };
type ConversationSummary = { id: string; subject: string | null; lastMessage: string; lastDate: string };

export function MessagesPanel({ onNotice }: { onNotice: (message: string) => void }) {
  const { session } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');

  const loadConversations = async () => {
    if (!session) return;
    const { data: participantRows } = await supabase.from('conversation_participants').select('conversation_id').eq('user_id', session.user.id);
    const ids = (participantRows ?? []).map((r) => r.conversation_id as string);
    if (ids.length === 0) {
      setConversations([]);
      return;
    }
    const { data: convos } = await supabase.from('conversations').select('id, subject').in('id', ids);
    const summaries: ConversationSummary[] = [];
    for (const convo of convos ?? []) {
      const { data: lastMsg } = await supabase.from('messages').select('content, created_at').eq('conversation_id', convo.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      summaries.push({ id: convo.id, subject: convo.subject, lastMessage: lastMsg?.content ?? 'Aucun message', lastDate: lastMsg?.created_at ?? '' });
    }
    setConversations(summaries);
    if (!activeId && summaries[0]) setActiveId(summaries[0].id);
  };

  const loadMessages = async (conversationId: string) => {
    const { data } = await supabase.from('messages').select('id, sender_id, content, created_at').eq('conversation_id', conversationId).order('created_at', { ascending: true });
    setMessages((data as Message[]) ?? []);
  };

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);
  useEffect(() => { if (activeId) loadMessages(activeId); }, [activeId]);

  const handleSend = async () => {
    if (!session || !activeId || !draft.trim()) return;
    const { error } = await supabase.from('messages').insert({ conversation_id: activeId, sender_id: session.user.id, content: draft.trim() });
    if (error) return onNotice(`Erreur : ${error.message}`);
    setDraft('');
    loadMessages(activeId);
    loadConversations();
  };

  const handleNewConversation = async () => {
    if (!session) return onNotice('Connectez-vous pour démarrer une conversation.');
    if (!recipientEmail.trim()) return onNotice('Indiquez l’email du destinataire.');

    const { data: recipientProfile, error: lookupError } = await supabase.rpc('get_user_id_by_email', { lookup_email: recipientEmail.trim() });

    if (lookupError || !recipientProfile) {
      onNotice('Destinataire introuvable. Cette personne doit déjà avoir un compte AfriTalents.');
      return;
    }

    const { data: convo, error } = await supabase.from('conversations').insert({ subject: `Conversation avec ${recipientEmail}` }).select().single();
    if (error || !convo) return onNotice(`Erreur : ${error?.message}`);
    await supabase.from('conversation_participants').insert([
      { conversation_id: convo.id, user_id: session.user.id },
      { conversation_id: convo.id, user_id: recipientProfile },
    ]);
    onNotice('Conversation créée.');
    setShowNew(false);
    setRecipientEmail('');
    loadConversations();
    setActiveId(convo.id);
  };

  if (!session) {
    return <div className="page workspace-page"><div className="disclaimer"><ShieldCheck size={17} /><span>Connectez-vous pour accéder à votre messagerie.</span></div></div>;
  }

  return (
    <div className="page workspace-page">
      <div className="page-intro">
        <div><div className="eyebrow">Réseau professionnel</div><h1>Messages</h1><p>Gardez les échanges importants autour des talents au même endroit.</p></div>
        <button className="button button-primary" onClick={() => setShowNew((v) => !v)}>Nouveau message</button>
      </div>

      {showNew && (
        <div className="content-card academy-form" style={{ marginBottom: 16 }}>
          <div className="eyebrow">Nouvelle conversation</div>
          <p style={{ color: '#8e958d', fontSize: 12 }}>Le destinataire doit déjà posséder un compte AfriTalents.</p>
          <label>Email du destinataire<input value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="contact@exemple.com" /></label>
          <button className="button button-primary" onClick={handleNewConversation} style={{ marginTop: 10 }}><Send size={15} /> Démarrer</button>
        </div>
      )}

      <div className="messages-layout">
        <div className="message-list">
          <div className="message-search search-field"><Search size={16} /><input placeholder="Rechercher une conversation" /></div>
          {conversations.length === 0 && <p style={{ padding: 16, color: '#8e958d', fontSize: 12 }}>Aucune conversation pour le moment.</p>}
          {conversations.map((c) => (
            <button className={c.id === activeId ? 'conversation active' : 'conversation'} key={c.id} onClick={() => setActiveId(c.id)}>
              <div className="avatar avatar-orange">{(c.subject ?? 'C').slice(0, 2).toUpperCase()}</div>
              <div><strong>{c.subject ?? 'Conversation'}</strong><span>{c.lastMessage}</span></div>
            </button>
          ))}
        </div>
        <div className="conversation-panel">
          {activeId ? (
            <>
              <div className="conversation-header"><div><strong>Conversation</strong></div><ShieldCheck size={16} /></div>
              <div className="conversation-body">
                {messages.map((m) => (
                  <div className={m.sender_id === session.user.id ? 'message-bubble sent' : 'message-bubble received'} key={m.id}>
                    {m.content}<small>{new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</small>
                  </div>
                ))}
              </div>
              <div className="message-compose">
                <input placeholder="Écrire un message..." value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
                <button onClick={handleSend}><Send size={16} /></button>
              </div>
            </>
          ) : (
            <div style={{ padding: 24, color: '#8e958d' }}>Sélectionnez ou démarrez une conversation.</div>
          )}
        </div>
      </div>
    </div>
  );
}
