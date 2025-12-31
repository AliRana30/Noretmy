# 🧠 Hiregenix — AI-Powered Talent Matching Platform

**Hiregenix** is an intelligent job-matching platform that connects job seekers and employers using AI automation, NLP-based resume parsing, and smart screening workflows.
It provides an end-to-end automated hiring solution — from resume parsing and skill extraction to AI-driven candidate ranking and interviewer simulation

🌐 **Live Demo:** [www.myhiregenix.com](https://www.myhiregenix.com)

---

## 🚀 Features

### 🧩 For Employers

* **AI Candidate Matching:** Automatically matches resumes to job descriptions based on skills, experience, and context using OpenAI embeddings.
* **Automated Screening:** Custom filters for experience, skills, and education.
* **Smart Recommendations:** Ranks top candidates per job posting with detailed fit scores.
* **AI Interviewer:** Auto-generates personalized interview questions per candidate.
* **Dashboard Analytics:** Job and candidate insights, hiring performance metrics.

### 👤 For Job Seekers

* **Resume Parser:** Extracts data (skills, experience, education) and builds professional AI-enhanced profiles.
* **AI Resume Enhancer:** Improves resume content based on job preferences.
* **Career Fit Score:** Provides a visual skill–job compatibility percentage.
* **Job Suggestions:** Curated opportunities aligned with interests and experience.

---

## ⚙️ Tech Stack

| Layer                     | Technology                                        |
| ------------------------- | ------------------------------------------------- |
| **Frontend**              | Next.js (React 18) + Tailwind CSS                 |
| **Backend**               | FastAPI / Node.js (Microservices architecture)    |
| **Database**              | MongoDB / PostgreSQL                              |
| **AI Services**           | OpenAI GPT API, LangChain                         |
| **Automation**            | Make (Integromat) / Zapier                        |
| **Job Feeds Integration** | LinkedIn, Indeed, USAJobs, ZipRecruiter APIs      |
| **Hosting**               | AWS + Vercel (Next.js frontend), Render (backend) |
| **Payments (optional)**   | Stripe Subscriptions                              |
| **CI/CD**                 | GitHub Actions + Docker                           |

---

## 🧠 System Architecture

```
User → Frontend (Next.js)
        ↓
     API Gateway
        ↓
 AI Matching Service → OpenAI / LangChain
        ↓
 Resume Parser → NLP + Custom Extraction
        ↓
 Database (MongoDB)
        ↓
 Notification / Email Service (SendGrid)
```

---

## 🪄 Core AI Modules

| Module                  | Description                                                                    |
| ----------------------- | ------------------------------------------------------------------------------ |
| **Resume Parser**       | Extracts structured data from PDFs using GPT-based parsing and regex cleaning. |
| **Job Matcher**         | Embedding-based similarity between resume vectors and job description vectors. |
| **Interview Generator** | Creates context-based questions based on skills and roles.                     |
| **Fit Scoring**         | Weighted algorithm combining experience, skills, and education.                |

---

## 🧾 Setup Guide

### 1. Clone the Repository

```bash
git clone https://github.com/<yourusername>/hiregenix.git
cd hiregenix
```

### 2. Install Dependencies

```bash
npm install   # For frontend
pip install -r requirements.txt  # For backend (if FastAPI)
```

### 3. Setup Environment Variables

Create a `.env` file in both `/frontend` and `/backend` directories:

```
OPENAI_API_KEY=your_openai_key
DATABASE_URL=your_mongo_or_postgres_url
STRIPE_SECRET=your_stripe_secret
```

### 4. Run the Development Servers

```bash
# Frontend
npm run dev

# Backend
uvicorn main:app --reload
```

### 5. Access

Visit `http://localhost:3000` for the frontend
and `http://localhost:8000/docs` for backend APIs.

---

## 📈 Future Improvements

* ✨ Multi-language job matching
* 🧩 Employer AI assistant for automated outreach
* 🕸️ Skill graph visualization for candidate comparison
* 🔄 ATS (Applicant Tracking System) integration

---

## 🤝 Contributing

Pull requests are welcome.
For major changes, please open an issue first to discuss what you’d like to change.
