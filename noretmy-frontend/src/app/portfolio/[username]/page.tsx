"use client"
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Calendar, Briefcase, ExternalLink, Github, Award, Mail, ChevronRight, ArrowRight, Menu, X } from 'lucide-react';
import axios from 'axios';

// Types
interface Experience {
  title: string;
  company: string;
  period: string;
  description: string;
}

interface Project {
  title: string;
  image: string;
  description: string;
  skills: string[];
  github: string;
  demoLink: string;
  githubLink: string;
}

interface UserData {
  name: string;
  headline: string;
  picture: string;
  profilePicture: string;
  username: string;
  country: string;
  joinedDate: string;
  experience: Experience[];
  skills: string[];
  skillsArray: string[];
  projects: Project[];
  aboutMe : String;
}

// Component
const UserProfile: React.FC = ({ params }: { params: { username: string } }) => {

  console.log(params.username)
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('portfolio');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;


  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/users/profile/portfolio/${params.username}`);
        setUserData(response.data);
        setLoading(false);
      } catch (error) {
        console.log("Error fetching user data");
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-gray-700 font-light tracking-wider">LOADING</div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="text-gray-700 p-6 border border-gray-200 rounded-lg shadow-md bg-white">
          Unable to load profile data. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 antialiased">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 lg:hidden">
          <div className="p-4 flex justify-end">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex flex-col items-center mt-16 space-y-8 text-xl">
            <button
              onClick={() => {
                setActiveSection('portfolio');
                setMobileMenuOpen(false);
              }}
              className={`py-3 px-6 rounded-full transition-all ${activeSection === 'portfolio' ? 'text-indigo-600 bg-indigo-50 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Portfolio
            </button>
            <button
              onClick={() => {
                setActiveSection('experience');
                setMobileMenuOpen(false);
              }}
              className={`py-3 px-6 rounded-full transition-all ${activeSection === 'experience' ? 'text-indigo-600 bg-indigo-50 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Experience
            </button>
            <button
              onClick={() => {
                setActiveSection('skills');
                setMobileMenuOpen(false);
              }}
              className={`py-3 px-6 rounded-full transition-all ${activeSection === 'skills' ? 'text-indigo-600 bg-indigo-50 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Skills
            </button>

            <button
              onClick={() => {
                setActiveSection('about');
                setMobileMenuOpen(false);
              }}
              className={`py-3 px-6 rounded-full transition-all ${activeSection === 'skills' ? 'text-indigo-600 bg-indigo-50 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              About Me
            </button>
            <button className="mt-4 px-6 py-3 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition-colors shadow-md flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Contact Me
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="bg-white rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-gray-100">
          <div className="flex items-center space-x-4">
            {/* Profile Image */}
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden relative border-4 border-indigo-50 shadow-md ring-2 ring-indigo-600 ring-offset-2">
              <Image
                src={userData.profilePicture}
                alt={userData.username}
                layout="fill"
                objectFit="cover"
                className="hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* User Details */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">{userData.username}</h1>
              <p className="text-indigo-600 font-medium">{userData.headline}</p>

              {/* Location & Join Date - Now placed directly below the user details */}
              <div className="mt-2 flex flex-wrap items-center text-gray-500 text-sm">
                {userData.country && (
                  <div className="flex items-center mr-4 mb-1">
                    <MapPin className="h-4 w-4 mr-1 text-indigo-500" />
                    <span>{userData.country || "Unknown"}</span>
                  </div>
                )}
                {userData.joinedDate && (
                  <div className="flex items-center mb-1">
                    <Calendar className="h-4 w-4 mr-1 text-indigo-500" />
                    <span>Joined {userData.joinedDate}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="flex flex-col items-end space-y-3 w-full sm:w-auto">
            <nav className="hidden lg:flex items-center space-x-2 bg-gray-100 p-1 rounded-full">
              <button
                onClick={() => setActiveSection('portfolio')}
                className={`py-2 px-6 rounded-full transition-all ${activeSection === 'portfolio' ? 'bg-white text-indigo-600 font-medium shadow-sm' : 'text-gray-600 hover:text-indigo-600'}`}
              >
                Portfolio
              </button>
              <button
                onClick={() => setActiveSection('about')}
                className={`py-2 px-6 rounded-full transition-all ${activeSection === 'about' ? 'bg-white text-indigo-600 font-medium shadow-sm' : 'text-gray-600 hover:text-indigo-600'}`}
              >
                About Me
              </button>
              <button
                onClick={() => setActiveSection('experience')}
                className={`py-2 px-6 rounded-full transition-all ${activeSection === 'experience' ? 'bg-white text-indigo-600 font-medium shadow-sm' : 'text-gray-600 hover:text-indigo-600'}`}
              >
                Experience
              </button>
              <button
                onClick={() => setActiveSection('skills')}
                className={`py-2 px-6 rounded-full transition-all ${activeSection === 'skills' ? 'bg-white text-indigo-600 font-medium shadow-sm' : 'text-gray-600 hover:text-indigo-600'}`}
              >
                Skills
              </button>
              
            </nav>

            {/* Contact Button - Desktop */}
            <button className="hidden lg:flex px-6 py-2 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition-colors shadow-md">
              <Mail className="h-4 w-4 mr-2" />
              Contact Me
            </button>

            {/* Mobile Nav & Contact */}
            <div className="flex items-center space-x-2 lg:hidden w-full justify-between sm:w-auto">
              <button className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition-colors shadow-md flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                Contact
              </button>

              <button
                className="p-3 text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>


        {/* Mobile Tab Navigation */}
        <div className="mt-6 lg:hidden">
          <div className="bg-white rounded-full p-1 flex justify-between shadow-sm overflow-hidden">
            <button
              onClick={() => setActiveSection('portfolio')}
              className={`flex-1 py-2 text-center text-sm font-medium rounded-full transition-all ${activeSection === 'portfolio' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600'}`}
            >
              Portfolio
            </button>
            <button
              onClick={() => setActiveSection('experience')}
              className={`flex-1 py-2 text-center text-sm font-medium rounded-full transition-all ${activeSection === 'experience' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600'}`}
            >
              Experience
            </button>
            <button
              onClick={() => setActiveSection('skills')}
              className={`flex-1 py-2 text-center text-sm font-medium rounded-full transition-all ${activeSection === 'skills' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600'}`}
            >
              Skills
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="mt-8">
          {/* Portfolio Section */}
          {activeSection === 'portfolio' && (
            <section className="animate-fadeIn">
              <h2 className="text-2xl font-bold mb-8 flex items-center text-gray-800">
                <span className="bg-white py-2 px-6 rounded-full shadow-sm border border-gray-100">Portfolio</span>
                <div className="h-px bg-gray-200 flex-grow ml-4"></div>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userData.projects?.map((project, index) => (
                  <div
                    key={index}
                    className="group bg-white rounded-xl overflow-hidden transition-all duration-300 flex flex-col shadow-md hover:shadow-lg border border-gray-100 transform hover:-translate-y-1"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={project.image}
                        alt={project.title}
                        layout="fill"
                        objectFit="cover"
                        className="group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60"></div>
                    </div>
                    <div className="p-6 flex-grow flex flex-col">
                      <h3 className="text-xl font-bold mb-2 text-gray-800 group-hover:text-indigo-600 transition-colors">{project.title}</h3>
                      <p className="text-gray-600 text-sm mb-5 line-clamp-3">{project.description}</p>
                      <div className="mt-auto">
                        <div className="flex flex-wrap gap-2 mb-5">
                          {project.skills?.slice(0, 3).map((skill, skillIndex) => (
                            <span
                              key={skillIndex}
                              className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                          {project.skills?.length > 3 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{project.skills.length - 3}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          {project.githubLink && (
                            <Link
                              href={project.githubLink}
                              className="flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                            >
                              <Github className="h-4 w-4 mr-1" />
                              Source Code
                            </Link>
                          )}
                          {project.demoLink && (
                            <Link
                              href={project.demoLink}
                              className="flex items-center text-sm text-indigo-600 font-medium bg-indigo-50 px-4 py-2 rounded-full hover:bg-indigo-100 transition-colors"
                            >
                              View Project
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Experience Section */}
          {activeSection === 'experience' && (
            <section className="animate-fadeIn">
              <h2 className="text-2xl font-bold mb-8 flex items-center text-gray-800">
                <span className="bg-white py-2 px-6 rounded-full shadow-sm border border-gray-100">Experience</span>
                <div className="h-px bg-gray-200 flex-grow ml-4"></div>
              </h2>
              <div className="space-y-6">
                {userData.experience?.map((exp, index) => (
                  <div key={index} className="relative group bg-white rounded-xl p-6 shadow-md hover:shadow-lg border border-gray-100 transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="hidden md:block shrink-0">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                          <Briefcase className="h-6 w-6" />
                        </div>
                      </div>
                      <div className="flex-grow">
                        <div className="flex flex-wrap justify-between items-start mb-2">
                          <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{exp.title}</h3>
                          <span className="text-indigo-600 text-sm font-medium px-3 py-1 bg-indigo-50 rounded-full ml-auto mt-1 md:mt-0">{exp.period}</span>
                        </div>
                        <p className="text-lg text-gray-700 font-medium mb-3 flex items-center">
                          {exp.company}
                        </p>
                        <p className="text-gray-600 leading-relaxed">{exp.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills Section */}
          {activeSection === 'skills' && (
            <section className="animate-fadeIn">
              <h2 className="text-2xl font-bold mb-8 flex items-center text-gray-800">
                <span className="bg-white py-2 px-6 rounded-full shadow-sm border border-gray-100">Skills</span>
                <div className="h-px bg-gray-200 flex-grow ml-4"></div>
              </h2>
              <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {userData.skillsArray?.map((skill, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-4 text-center hover:from-indigo-100 hover:to-indigo-50 transition-colors duration-300 hover:shadow-md transform hover:-translate-y-1 border border-indigo-100 h-full flex items-center justify-center"
                    >
                      <span className="font-medium text-gray-700">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeSection === 'about' && (
            <section className="animate-fadeIn">
              <h2 className="text-2xl font-bold mb-8 flex items-center text-gray-800">
                <span className="bg-white py-2 px-6 rounded-full shadow-sm border border-gray-100">
                  About Me
                </span>
                <div className="h-px bg-gray-200 flex-grow ml-4"></div>
              </h2>
              <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100">
                <p className="text-gray-700 text-lg leading-relaxed">
                  {userData.aboutMe || 'No description provided yet.'}
                </p>
              </div>
            </section>
          )}
        </main>


      </div>
    </div>
  );
};

export default UserProfile;