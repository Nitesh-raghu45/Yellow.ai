import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectsAPI, promptsAPI, filesAPI } from '../api/client';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

  const [project, setProject] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit project
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});

  // Prompt modal
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptForm, setPromptForm] = useState({ title: '', content: '' });
  const [editingPromptId, setEditingPromptId] = useState(null);
  const [savingPrompt, setSavingPrompt] = useState(false);

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // File upload
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadAll();
  }, [id]);

  const loadAll = async () => {
    try {
      const [projRes, promptRes, fileRes] = await Promise.all([
        projectsAPI.get(id),
        promptsAPI.list(id),
        filesAPI.list(id),
      ]);
      setProject(projRes.data);
      setPrompts(promptRes.data);
      setFiles(fileRes.data);
      setEditData({
        name: projRes.data.name,
        description: projRes.data.description,
        system_prompt: projRes.data.system_prompt,
      });
    } catch {
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // ─── Project CRUD ───────────────────────────────────────────────
  const handleSaveProject = async () => {
    try {
      const res = await projectsAPI.update(id, editData);
      setProject(res.data);
      setEditing(false);
      showToast('Project updated!');
    } catch {
      showToast('Failed to update project', 'error');
    }
  };

  const handleDeleteProject = async () => {
    try {
      await projectsAPI.delete(id);
      navigate('/dashboard');
      showToast('Project deleted');
    } catch {
      showToast('Failed to delete project', 'error');
    }
  };

  // ─── Prompt CRUD ────────────────────────────────────────────────
  const openPromptModal = (prompt = null) => {
    if (prompt) {
      setEditingPromptId(prompt.id);
      setPromptForm({ title: prompt.title, content: prompt.content });
    } else {
      setEditingPromptId(null);
      setPromptForm({ title: '', content: '' });
    }
    setShowPromptModal(true);
  };

  const handleSavePrompt = async (e) => {
    e.preventDefault();
    setSavingPrompt(true);
    try {
      if (editingPromptId) {
        await promptsAPI.update(editingPromptId, promptForm);
        showToast('Prompt updated!');
      } else {
        await promptsAPI.create(id, promptForm);
        showToast('Prompt created!');
      }
      const res = await promptsAPI.list(id);
      setPrompts(res.data);
      setShowPromptModal(false);
    } catch {
      showToast('Failed to save prompt', 'error');
    } finally {
      setSavingPrompt(false);
    }
  };

  const handleDeletePrompt = async (promptId) => {
    try {
      await promptsAPI.delete(promptId);
      setPrompts(prompts.filter((p) => p.id !== promptId));
      showToast('Prompt deleted');
    } catch {
      showToast('Failed to delete prompt', 'error');
    }
  };

  // ─── File Upload ────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      await filesAPI.upload(id, file);
      const res = await filesAPI.list(id);
      setFiles(res.data);
      showToast('File uploaded!');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to upload file', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await filesAPI.delete(fileId);
      setFiles(files.filter((f) => f.id !== fileId));
      showToast('File deleted');
    } catch {
      showToast('Failed to delete file', 'error');
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
          <div className="spinner spinner-lg"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <ToastContainer />

      <div className="page animate-fadeIn">
        {/* Breadcrumb */}
        <div style={{ marginBottom: '0.5rem' }}>
          <Link to="/dashboard" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            ← Back to Dashboard
          </Link>
        </div>

        <div className="page-header">
          <div>
            {editing ? (
              <input
                className="input"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                style={{ fontSize: '1.5rem', fontWeight: 800, maxWidth: '400px' }}
              />
            ) : (
              <h1 className="page-title">{project.name}</h1>
            )}
            {!editing && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {project.description || 'No description'}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={() => navigate(`/projects/${id}/chat`)}>
              💬 Open Chat
            </button>
            {editing ? (
              <>
                <button className="btn btn-primary" onClick={handleSaveProject}>Save</button>
                <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              </>
            ) : (
              <>
                <button className="btn btn-secondary" onClick={() => setEditing(true)}>✏️ Edit</button>
                <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>🗑️</button>
              </>
            )}
          </div>
        </div>

        <div className="project-detail">
          {/* Main Content */}
          <div className="project-main">
            {/* System Prompt */}
            <div className="card section-card">
              <div className="section-header">
                <h3>🎯 System Prompt</h3>
              </div>
              {editing ? (
                <textarea
                  className="input"
                  value={editData.system_prompt}
                  onChange={(e) => setEditData({ ...editData, system_prompt: e.target.value })}
                  rows={6}
                />
              ) : (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {project.system_prompt}
                </p>
              )}
            </div>

            {/* Prompts */}
            <div className="card section-card">
              <div className="section-header">
                <h3>📝 Prompts</h3>
                <button className="btn btn-secondary" onClick={() => openPromptModal()}>
                  ＋ Add Prompt
                </button>
              </div>
              {prompts.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    No prompts yet. Add prompts to give your agent additional context.
                  </p>
                </div>
              ) : (
                prompts.map((prompt) => (
                  <div key={prompt.id} className="prompt-item">
                    <div className="prompt-item-header">
                      <h4>{prompt.title}</h4>
                      <div className="prompt-actions">
                        <button className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => openPromptModal(prompt)}>
                          ✏️
                        </button>
                        <button className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleDeletePrompt(prompt.id)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                    <p>{prompt.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="project-sidebar">
            {/* Info */}
            <div className="card section-card">
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 700 }}>📊 Project Info</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Messages</span>
                  <span style={{ fontWeight: 600 }}>{project.message_count || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Prompts</span>
                  <span style={{ fontWeight: 600 }}>{prompts.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Files</span>
                  <span style={{ fontWeight: 600 }}>{files.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Created</span>
                  <span style={{ fontWeight: 600 }}>{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Files */}
            <div className="card section-card">
              <div className="section-header">
                <h3 style={{ fontSize: '1rem' }}>📎 Files</h3>
                <button
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
                >
                  {uploading ? (
                    <><span className="spinner"></span> Uploading...</>
                  ) : (
                    '＋ Upload'
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </div>
              {files.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>
                  No files uploaded
                </p>
              ) : (
                files.map((file) => (
                  <div key={file.id} className="file-item">
                    <div className="file-info">
                      <span className="file-icon">📄</span>
                      <div>
                        <div className="file-name">{file.original_filename}</div>
                        <div className="file-size">{formatSize(file.file_size)}</div>
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>

            {editing && (
              <div className="card section-card">
                <div className="input-group">
                  <label>Description</label>
                  <textarea
                    className="input"
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={3}
                    placeholder="Project description"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prompt Modal */}
      <Modal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title={editingPromptId ? 'Edit Prompt' : 'Add Prompt'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowPromptModal(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleSavePrompt}
              disabled={savingPrompt || !promptForm.title.trim() || !promptForm.content.trim()}
            >
              {savingPrompt ? <><span className="spinner"></span> Saving...</> : 'Save Prompt'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSavePrompt}>
          <div className="input-group">
            <label>Title *</label>
            <input
              className="input"
              placeholder="e.g., Greeting Instructions"
              value={promptForm.title}
              onChange={(e) => setPromptForm({ ...promptForm, title: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div className="input-group" style={{ marginTop: '1rem' }}>
            <label>Content *</label>
            <textarea
              className="input"
              placeholder="Enter the prompt content..."
              value={promptForm.content}
              onChange={(e) => setPromptForm({ ...promptForm, content: e.target.value })}
              rows={5}
              required
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Project"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDeleteProject}>Delete Forever</button>
          </>
        }
      >
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Are you sure you want to delete <strong>{project.name}</strong>? This action cannot be undone and will permanently delete all associated prompts, messages, and files.
        </p>
      </Modal>
    </>
  );
}
