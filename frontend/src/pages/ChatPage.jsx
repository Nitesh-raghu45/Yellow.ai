import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsAPI, chatAPI } from '../api/client';
import ReactMarkdown from 'react-markdown';
import Navbar from '../components/Navbar';
import { useToast } from '../components/Toast';

export default function ChatPage() {
  const { id } = useParams();
  const { showToast, ToastContainer } = useToast();

  const [project, setProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadData = async () => {
    try {
      const [projRes, msgRes] = await Promise.all([
        projectsAPI.get(id),
        chatAPI.getMessages(id),
      ]);
      setProject(projRes.data);
      setMessages(msgRes.data);
    } catch (err) {
      console.error('Failed to load chat data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const msg = input.trim();
    if (!msg || sending) return;

    // Optimistically add user message
    const userMsg = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: msg,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const response = await chatAPI.sendMessage(id, msg);
      setMessages((prev) => [...prev, response.data]);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to send message', 'error');
      // Remove optimistic user message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      setInput(msg);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleClearChat = async () => {
    try {
      await chatAPI.clearMessages(id);
      setMessages([]);
      showToast('Chat history cleared');
    } catch {
      showToast('Failed to clear chat', 'error');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="chat-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="spinner spinner-lg"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <ToastContainer />

      <div className="chat-page">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <Link to={`/projects/${id}`} className="chat-header-icon" title="Back to project">
              🤖
            </Link>
            <div>
              <h2>{project?.name || 'Chat'}</h2>
              <p>Powered by LLaMA 3.3 • <Link to={`/projects/${id}`} style={{ color: 'var(--color-text-accent)', fontSize: 'inherit' }}>Project Settings</Link></p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {messages.length > 0 && (
              <button className="btn btn-ghost" onClick={handleClearChat} title="Clear chat history">
                🗑️ Clear
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        {messages.length === 0 && !sending ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <h3>Start a Conversation</h3>
            <p>
              Send a message to start chatting with your AI agent. The agent uses the system prompt and any associated prompts from your project configuration.
            </p>
          </div>
        ) : (
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message chat-message-${msg.role}`}>
                <div className="chat-message-avatar">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div>
                  <div className="chat-message-content">
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                  <div className="chat-message-time">
                    {formatTime(msg.created_at)}
                  </div>
                </div>
              </div>
            ))}

            {sending && (
              <div className="typing-indicator">
                <div className="chat-message-avatar" style={{ background: 'var(--color-accent-gradient)', borderRadius: 'var(--radius-md)', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  🤖
                </div>
                <div className="typing-dots">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Area */}
        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="Type your message... (Shift+Enter for new line)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={sending}
              autoFocus
            />
            <button
              className="chat-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || sending}
              title="Send message"
            >
              {sending ? <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></span> : '➤'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
