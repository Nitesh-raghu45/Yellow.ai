import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../api/client';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', system_prompt: 'You are a helpful AI assistant.' });
  const [creating, setCreating] = useState(false);
  const { showToast, ToastContainer } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectsAPI.list();
      setProjects(response.data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const response = await projectsAPI.create(newProject);
      setProjects([response.data, ...projects]);
      setShowCreateModal(false);
      setNewProject({ name: '', description: '', system_prompt: 'You are a helpful AI assistant.' });
      showToast('Project created successfully!');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create project', 'error');
    } finally {
      setCreating(false);
    }
  };

  const totalMessages = projects.reduce((sum, p) => sum + (p.message_count || 0), 0);
  const totalPrompts = projects.reduce((sum, p) => sum + (p.prompt_count || 0), 0);

  return (
    <>
      <Navbar />
      <ToastContainer />
      <div className="page animate-fadeIn">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            ＋ New Project
          </button>
        </div>

        {/* Stats */}
        <div className="dashboard-stats">
          <div className="card stat-card">
            <div className="stat-icon stat-icon-purple">📁</div>
            <div className="stat-info">
              <h4>Projects</h4>
              <p>{projects.length}</p>
            </div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon stat-icon-teal">💬</div>
            <div className="stat-info">
              <h4>Messages</h4>
              <p>{totalMessages}</p>
            </div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon stat-icon-amber">📝</div>
            <div className="stat-info">
              <h4>Prompts</h4>
              <p>{totalPrompts}</p>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="empty-state">
            <div className="spinner spinner-lg"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚀</div>
            <h3>No projects yet</h3>
            <p>Create your first AI agent project to get started building intelligent chatbots.</p>
            <button
              className="btn btn-primary"
              style={{ marginTop: '1rem' }}
              onClick={() => setShowCreateModal(true)}
            >
              ＋ Create First Project
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <div
                key={project.id}
                className="card card-interactive project-card"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="project-card-header">
                  <div className="project-card-icon">🤖</div>
                </div>
                <h3>{project.name}</h3>
                <p>{project.description || 'No description'}</p>
                <div className="project-card-stats">
                  <div className="project-card-stat">
                    💬 <span>{project.message_count || 0}</span> messages
                  </div>
                  <div className="project-card-stat">
                    📝 <span>{project.prompt_count || 0}</span> prompts
                  </div>
                  <div className="project-card-stat">
                    📎 <span>{project.file_count || 0}</span> files
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreateProject}
              disabled={creating || !newProject.name.trim()}
            >
              {creating ? (
                <>
                  <span className="spinner"></span> Creating...
                </>
              ) : (
                'Create Project'
              )}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateProject}>
          <div className="input-group">
            <label htmlFor="project-name">Project Name *</label>
            <input
              id="project-name"
              type="text"
              className="input"
              placeholder="e.g., Customer Support Bot"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div className="input-group" style={{ marginTop: '1rem' }}>
            <label htmlFor="project-desc">Description</label>
            <input
              id="project-desc"
              type="text"
              className="input"
              placeholder="Brief description of your agent"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            />
          </div>
          <div className="input-group" style={{ marginTop: '1rem' }}>
            <label htmlFor="project-prompt">System Prompt</label>
            <textarea
              id="project-prompt"
              className="input"
              placeholder="Define your agent's personality and behavior..."
              value={newProject.system_prompt}
              onChange={(e) => setNewProject({ ...newProject, system_prompt: e.target.value })}
              rows={4}
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
