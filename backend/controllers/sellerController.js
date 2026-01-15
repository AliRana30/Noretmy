const { getSellerStatistics } = require("../services/sellerService");
const Project = require("../models/Project");
const { uploadDocuments } = require("./uploadController");

const getSellerStats = async (req, res) => {
  const { userId } = req;

  try {
    const stats = await getSellerStatistics(userId);

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching seller stats:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching seller statistics.",
    });
  }
};

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

    let parsedSkills;
    try {
      parsedSkills = typeof skills === "string" ? JSON.parse(skills) : skills;
    } catch (e) {
      parsedSkills = typeof skills === "string" ? skills.split(",").map(s => s.trim()) : skills;
    }

    let imageUrl = "";
    if (req.files && req.files.length > 0) {
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
    } else {
      return res.status(400).json({ message: "Project image is required" });
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

const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await Project.findOne({ _id: projectId, userId });

    if (!project) {
      return res
        .status(404)
        .json({ message: "Project not found or unauthorized" });
    }

    await project.deleteOne();
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const editProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const { title, skills, description, githubLink, liveDemoLink } = req.body;

    let updatedFields = {
      title,
      skills: skills.split(","),
      description,
      githubLink,
      liveDemoLink,
    };

    if (req.file) {
      const imageUrl = await uploadFiles(req.file);
      updatedFields.image = imageUrl;
    }

    const updatedProject = await Project.findOneAndUpdate(
      { _id: projectId, userId },
      { $set: updatedFields },
      { new: true } // Return updated document
    );

    if (!updatedProject) {
      return res
        .status(404)
        .json({ message: "Project not found or unauthorized" });
    }

    res
      .status(200)
      .json({
        message: "Project updated successfully",
        project: updatedProject,
      });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getSellerStats,
  createProject,
  deleteProject,
  editProject,
};
