const Project = require("../models/Project");
const { uploadDocuments } = require("./uploadController");

const createProject = async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    console.log("Uploaded Files:", req.files);

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

module.exports = {
  createProject,
  getProjectsByUser,
};
