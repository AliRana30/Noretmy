import React, { useState, useRef } from 'react';
import {
  PencilIcon,
  CheckIcon,
  CameraIcon,
  StarIcon,
  MapPinIcon,
  CalendarDaysIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserRole } from '@/util/basic';
import { useTranslations } from '@/hooks/useTranslations';

interface ProfileCardProps {
  isOnline?: boolean;
  profilePicture: string;
  name: string;
  tagline: string;
  username: string;
  rating: number;
  reviews: number;
  from: string;
  memberSince: string;
  skills?: string[];
  onUpdateTagline: (newTagline: string) => void;
  onUpdateProfilePicture: (newProfilePicture: File) => void;
  onAddSkill?: (skill: string) => void;
  onRemoveSkill?: (skill: string) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  isOnline = false,
  profilePicture,
  name,
  tagline,
  username,
  rating,
  reviews,
  from,
  memberSince,
  skills = [],
  onUpdateTagline,
  onUpdateProfilePicture,
  onAddSkill,
  onRemoveSkill,
}) => {
  const [isEditingTagline, setIsEditingTagline] = useState(false);
  const [editedTagline, setEditedTagline] = useState(tagline);
  const [isUploading, setIsUploading] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslations();

  const isSeller = useUserRole();

  const handleTaglineEdit = () => {
    if (isEditingTagline && editedTagline !== tagline) {
      onUpdateTagline(editedTagline);
    }
    setIsEditingTagline(!isEditingTagline);
  };

  const handleProfilePictureChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setIsUploading(true);
      await onUpdateProfilePicture(file);
      setIsUploading(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && onAddSkill) {
      onAddSkill(newSkill.trim());
      setNewSkill('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto bg-white rounded-lg overflow-hidden border border-gray-200"
    >
      <div className="md:flex">
        {/* Left Section: Profile Info */}
        <div className="md:w-1/3 bg-gradient-to-b from-gray-50 to-white p-5 flex flex-col items-center justify-center border-r border-gray-100">
          {/* Profile Picture */}
          <div className="relative mb-3">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleProfilePictureChange}
              disabled={isUploading}
              aria-label={t('profile:profileCard.aria.uploadButton')}
            />
            <motion.div
              className="relative group"
            >
              <div className="rounded-full p-1 bg-gradient-to-r from-black-400 to-black-500 shadow-sm">
                <img
                  src={profilePicture}
                  alt={t('profile:profileCard.aria.profilePicture')}
                  className="w-20 h-20 rounded-full object-cover border border-white"
                />
              </div>
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">{t('profile:profileCard.uploadingPhoto')}</span>
                </div>
              )}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-white text-black-500 p-1 rounded-full shadow-sm hover:bg-black-50 transition-colors border border-gray-100"
                aria-label={t('profile:profileCard.aria.uploadButton')}
              >
                <CameraIcon className="h-3 w-3" />
              </motion.button>
              {isOnline && (
                <div className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-orange-500 border border-white" />
              )}
            </motion.div>
          </div>

          {/* Name and Username */}
          <h2 className="text-lg font-semibold text-gray-800">{name}</h2>
          <p className="text-black-500 text-xs mb-3">@{username}</p>

          {/* Rating */}
          <div className="flex items-center text-yellow-400 mb-1">
            {[...Array(5)].map((_, index) => (
              <StarIcon
                key={index}
                className={`h-3 w-3 ${index < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
              />
            ))}
            <span className="text-xs text-gray-500 ml-1">
              {rating.toFixed(1)} ({reviews} {t('profile:profileCard.stats.reviews')})
            </span>
          </div>

          {/* Location and Member Since */}
          <div className="mt-3 w-full">
            <div className="flex items-center space-x-1 text-xs text-gray-500 mb-1.5 bg-gray-50 p-1.5 rounded-md">
              <MapPinIcon className="h-3 w-3 text-black-400" />
              <span>{t('profile:profileCard.stats.from')} {from}</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-50 p-1.5 rounded-md">
              <CalendarDaysIcon className="h-3 w-3 text-black-400" />
              <span>{t('profile:profileCard.stats.memberSince')} {memberSince}</span>
            </div>
          </div>
        </div>

        {/* Right Section: Content */}
        <div className="md:w-2/3 p-5">
          {/* Tagline */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-medium">
              {t('profile:profileCard.about')}
            </h3>
            <motion.button
              onClick={handleTaglineEdit}
              className="text-gray-400 hover:text-black-500 focus:outline-none transition-colors"
              aria-label={t(`profile:profileCard.aria.${isEditingTagline ? 'saveTagline' : 'editTagline'}`)}
            >
              {isEditingTagline ? (
                <CheckIcon className="h-3.5 w-3.5" />
              ) : (
                <PencilIcon className="h-3.5 w-3.5" />
              )}
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            {isEditingTagline ? (
              <motion.input
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                type="text"
                value={editedTagline}
                onChange={(e) => setEditedTagline(e.target.value)}
                className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-black-400 focus:outline-none mb-5 bg-gray-50"
                maxLength={100}
                autoFocus
                aria-label={t('profile:profileCard.aria.taglineInput')}
              />
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gray-600 mb-5 leading-relaxed"
              >
                {tagline || t('profile:profileCard.addTagline')}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Skills Section */}
          {/* <div className="mb-5">
            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-2.5">Expertise</h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {skills.map((skill) => (
                <motion.div
                  key={skill}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-gray-50 border border-gray-100 rounded-full px-2.5 py-0.5 flex items-center gap-1 text-xs text-gray-600 group hover:bg-black-50 hover:border-black-100 transition-colors"
                >
                  {skill}
                  {onRemoveSkill && (
                    <button
                      onClick={() => onRemoveSkill(skill)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XMarkIcon className="h-2.5 w-2.5 text-gray-400 hover:text-red-500" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add expertise"
                className="flex-1 p-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-black-400 focus:outline-none bg-gray-50"
                onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
              />
              <motion.button
                onClick={handleAddSkill}
                className="bg-gray-800 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-gray-600 transition-colors flex items-center gap-1 shadow-sm"
              >
                <PlusIcon className="h-2.5 w-2.5" />
                Add
              </motion.button>
            </div>
          </div> */}

          {/* Quick Links */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-2.5">
              {t('profile:profileCard.quickAccess')}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {isSeller && (
                <motion.a
                  onClick={(e) => {
                    e.preventDefault();
                    const section = document.getElementById("portfolio");
                    section?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  href="#"
                  className="flex items-center gap-2 p-2 bg-white border border-gray-100 hover:border-blue-200 hover:bg-blue-50 rounded transition-all text-xs text-gray-700 shadow-sm"
                >
                  <div className="p-1 bg-gray-1-0 rounded text-blac-500">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.851 1.22v6.986a1 1 0 002 0V9.867l5.395-2.312a1 1 0 000-1.84l-7-3zM10 15.821a1 1 0 00.788-.375l5.5-6.5a1 1 0 00-.788-1.625h-11a1 1 0 00-.788 1.625l5.5 6.5a1 1 0 00.788.375z" />
                    </svg>
                  </div>
                  {t('profile:profileCard.navigation.portfolio')}
                </motion.a>
              )}

              <motion.a
                href="orders"
                className="flex items-center gap-2 p-2 bg-white border border-gray-100 hover:border-gray-200 hover:bg-blue-50 rounded transition-all text-xs text-gray-700 shadow-sm"
              >
                <div className="p-1 bg-black-100 rounded text-black-500">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                    <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                  </svg>
                </div>
                {t('profile:profileCard.navigation.orders')}
              </motion.a>

              <motion.a
                href="chat"
                className="flex items-center gap-2 p-2 bg-white border border-gray-100 hover:border-black-200 hover:bg-black-50 rounded transition-all text-xs text-gray-700 shadow-sm"
              >
                <div className="p-1 bg-black-100 rounded text-gray-500">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                  </svg>
                </div>
                {t('profile:profileCard.navigation.messages')}
              </motion.a>

              {isSeller && (
                <motion.a
                  onClick={(e) => {
                    e.preventDefault();
                    const section = document.getElementById("gigs");
                    section?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  href="#"
                  className="flex items-center gap-2 p-2 bg-white border border-gray-100 hover:border-black-200 hover:bg-black-50 rounded transition-all text-xs text-gray-700 shadow-sm"
                >
                  <div className="p-1 bg-black-100 rounded text-black-500">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  {t('profile:profileCard.navigation.gigs')}
                </motion.a>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileCard;