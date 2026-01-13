'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaGithub, FaExternalLinkAlt, FaEdit, FaTrash, FaPlus, FaTimes, FaSave } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface Project {
  _id: string;
  title: string;
  image: string;
  skills: string[];
  description: string;
  githubLink: string;
  liveDemoLink: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectFormData {
  title: string;
  file: string | File;
  skills: string[];
  description: string;
  githubLink: string;
  liveDemoLink: string;
}

const Projects: React.FC = () => {
  // State variables
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    file: '',
    skills: [],
    description: '',
    githubLink: '',
    liveDemoLink: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  // Fetch all projects
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/project`, {
        withCredentials: true,
      });
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      // toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Reset form data
  const resetForm = () => {
    setFormData({
      title: '',
      file: '',
      skills: [],
      description: '',
      githubLink: '',
      liveDemoLink: '',
    });
    setImagePreview(null);
    setNewSkill('');
    setEditingId(null);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({
        ...formData,
        file: file,
      });

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add new skill
  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  // Remove a skill
  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  // Open create form
  const handleCreateNew = () => {
    resetForm();
    setShowForm(true);
  };

  // Open edit form
  const handleEdit = (project: Project) => {
    setFormData({
      title: project.title,
      file: project.image,
      skills: project.skills,
      description: project.description,
      githubLink: project.githubLink,
      liveDemoLink: project.liveDemoLink,
    });
    setImagePreview(project.image);
    setEditingId(project._id);
    setShowForm(true);
  };

  // Submit form (create or edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (formData.skills.length === 0) {
      toast.error("At least one skill is required");
      return;
    }
    if (!formData.githubLink.trim()) {
      toast.error("GitHub link is required");
      return;
    }
    if (!formData.liveDemoLink.trim()) {
      toast.error("Live demo link is required");
      return;
    }
    if (!formData.file && !editingId) {
      toast.error("Project file is required");
      return;
    }

    try {
      setSubmitting(true);

      // ✅ Use FormData since we are uploading a file
      const projectData = new FormData();
      projectData.append("title", formData.title);
      projectData.append("description", formData.description);
      projectData.append("skills", JSON.stringify(formData.skills)); // Convert skills array to JSON string
      projectData.append("githubLink", formData.githubLink);
      projectData.append("liveDemoLink", formData.liveDemoLink);

      if (Array.isArray(formData.file)) {
        // If multiple files, append each one
        formData.file.forEach((file) => {
          projectData.append("images", file);
        });
      } else if (formData.file instanceof File) {
        // If it's a single file, still send it as an array
        projectData.append("images", formData.file);
      }

      let response;
      if (editingId) {
        // Update existing project
        response = await axios.put(`${BASE_URL}/project/${editingId}`, projectData, {
          withCredentials: true,
          // headers: { "Content-Type": "multipart/form-data" }, // Important!
        });
        toast.success("Project updated successfully");
      } else {
        // Create new project
        response = await axios.post(`${BASE_URL}/project`, projectData, {
          withCredentials: true,
          // headers: { "Content-Type": "api/json" }, // Important!
        });
        toast.success("Project created successfully");
      }

      // Update projects list
      await fetchProjects();
      setShowForm(false);
      resetForm();
    } catch (error: any) {
      console.error("Error submitting project:", error);
      toast.error(error?.response?.data?.message || (editingId ? "Failed to update project" : "Failed to create project"));
    } finally {
      setSubmitting(false);
    }
  };

  // Delete a project
  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this project?');
    if (!confirmed) return;

    try {
      setDeleting(id);
      await axios.delete(`${BASE_URL}/project/${id}`, {
        withCredentials: true,
      });
      setProjects(projects.filter(project => project._id !== id));

      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      // toast.error('Failed to delete project');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6" id='portfolio'>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-black">
          My <span className="text-orange-600">Projects</span>
        </h1>

        <button
          onClick={handleCreateNew}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 shadow-md"
        >
          <FaPlus size={16} />
          <span className="font-medium">Add Project</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <>
          {showForm && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingId ? 'Edit Project' : 'Create New Project'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Project Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      placeholder="Enter project title"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                      Project Image *
                    </label>
                    <div className="flex items-center space-x-4">
                      {imagePreview && (
                        <div className="relative w-16 h-16 rounded-md overflow-hidden">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <label className="flex-1 cursor-pointer px-4 py-2 border border-gray-300 rounded-lg text-center hover:bg-gray-50">
                        <span className="text-orange-600">{imagePreview ? 'Change Image' : 'Upload Image'}</span>
                        <input
                          type="file"
                          id="image"
                          name="image"
                          onChange={handleImageChange}
                          className="hidden"
                          accept="image/*"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Skills/Technologies *
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.skills.map((skill) => (
                        <span
                          key={skill}
                          className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="text-orange-600 hover:text-orange-800"
                          >
                            <FaTimes size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        placeholder="Add a skill"
                      />
                      <button
                        type="button"
                        onClick={handleAddSkill}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      placeholder="Describe your project"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="githubLink" className="block text-sm font-medium text-gray-700 mb-1">
                      GitHub Link *
                    </label>
                    <input
                      type="url"
                      id="githubLink"
                      name="githubLink"
                      value={formData.githubLink}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      placeholder="https://github.com/username/repo"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="liveDemoLink" className="block text-sm font-medium text-gray-700 mb-1">
                      Live Demo Link *
                    </label>
                    <input
                      type="url"
                      id="liveDemoLink"
                      name="liveDemoLink"
                      value={formData.liveDemoLink}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      placeholder="https://example.com"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-lg transition-colors mr-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`${submitting ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'
                      } text-white px-5 py-2 rounded-lg transition-colors flex items-center gap-2`}
                  >
                    {submitting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      <FaSave size={16} />
                    )}
                    <span>{submitting ? 'Saving...' : 'Save Project'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {projects.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <div className="text-orange-500 text-5xl mb-4">
                <FaPlus className="mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-6">Showcase your work by adding your first project</p>
              <button
                onClick={handleCreateNew}
                className="bg-orange-600 hover:bg-orange-700 text-white py-3 px-6 rounded-lg transition-all duration-300 shadow-md font-medium"
              >
                Add Your First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project._id}
                  className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col transition-all duration-300 hover:shadow-lg"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover transition-all duration-500"

                    />
                    <div className="absolute top-0 right-0 p-2 space-x-2">
                      <button
                        onClick={() => handleEdit(project)}
                        className="bg-white text-orange-600 p-2 rounded-full shadow-md hover:bg-orange-50 transition-colors"
                        title="Edit Project"
                      >
                        <FaEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(project._id)}
                        disabled={deleting === project._id}
                        className={`bg-white ${deleting === project._id ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:bg-red-50'
                          } p-2 rounded-full shadow-md transition-colors`}
                        title="Delete Project"
                      >
                        {deleting === project._id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-500"></div>
                        ) : (
                          <FaTrash size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-5 flex-grow flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {project.title}
                    </h3>

                    <div className="mb-4 flex-wrap gap-2 flex">
                      {project.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-orange-100 text-orange-800 px-2 py-1 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {project.description}
                    </p>

                    <div className="mt-auto flex gap-3">
                      <a
                        href={project.githubLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                      >
                        <FaGithub size={16} />
                        <span>GitHub</span>
                      </a>
                      <a
                        href={project.liveDemoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                      >
                        <FaExternalLinkAlt size={14} />
                        <span>Demo</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Projects;
