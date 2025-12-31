const Project = require("../models/Project");
const { uploadDocuments } = require("./uploadController");

const createProject = async (req, res) => {
  try {
    const { userId } = req;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No userId found" });
    }

    const { title, skills, description, githubLink, liveDemoLink } = req.body;

    if (!title || !description || !githubLink || !liveDemoLink || !skills) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Parse skills if it's a JSON string
    let parsedSkills;
    try {
      parsedSkills = typeof skills === "string" ? JSON.parse(skills) : skills;
    } catch (e) {
      parsedSkills = typeof skills === "string" ? skills.split(",").map(s => s.trim()) : skills;
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Project image is required" });
    }

    // Handle file upload using Cloudinary
    let imageUrl = "";
    try {
      const urls = await uploadDocuments(req);
      if (urls && urls.length > 0) {
        imageUrl = urls[0];
      } else {
        return res.status(500).json({ message: "Image upload failed" });
      }
    } catch (uploadError) {
      console.error("Image upload failed:", uploadError);
      return res.status(500).json({ message: "Error uploading image" });
    }

    const newProject = new Project({
      title,
      skills: parsedSkills,
      description,
      githubLink,
      liveDemoLink,
      image: imageUrl,
      userId,
    });

    try {
      await newProject.save();
    } catch (dbError) {
      console.error("Database save error:", dbError);
      return res.status(500).json({ message: "Error saving project" });
    }

    res
      .status(201)
      .json({ message: "Project created successfully", project: newProject });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getProjectsByUser = async (req, res) => {
  try {
    const { userId } = req;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    // Fetch projects where userId matches, but exclude `userId` from response
    const projects = await Project.find({ userId }).select("-userId");

    res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateProject = async (req, res) => {
  try {
    const { userId } = req;
    const { id } = req.params;
    const { title, skills, description, githubLink, liveDemoLink } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized to update this project" });
    }

    let parsedSkills = skills;
    if (typeof skills === "string") {
      try {
        parsedSkills = JSON.parse(skills);
      } catch (e) {
        parsedSkills = skills.split(",").map(s => s.trim());
      }
    }

    const updateData = {
      title,
      skills: parsedSkills,
      description,
      githubLink,
      liveDemoLink,
    };

    if (req.files && req.files.length > 0) {
      const urls = await uploadDocuments(req);
      if (urls && urls.length > 0) {
        updateData.image = urls[0];
      }
    }

    const updatedProject = await Project.findByIdAndUpdate(id, updateData, { new: true });
    res.status(200).json({ message: "Project updated successfully", project: updatedProject });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { userId } = req;
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized to delete this project" });
    }

    await Project.findByIdAndDelete(id);
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createProject,
  getProjectsByUser,
  updateProject,
  deleteProject,
};
