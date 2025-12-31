const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  skills: {
    type: [String],
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  githubLink: {
    type: String,
    required: true
  },
  liveDemoLink: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true
  }
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;
