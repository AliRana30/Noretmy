import React, { useState, useRef } from 'react';
import {
  PencilIcon,
  CheckIcon,
  CameraIcon,
  StarIcon,
  MapPinIcon,
  CalendarDaysIcon,
  PlusIcon,
  XMarkIcon,
  BriefcaseIcon,
  FolderIcon
} from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserRole } from '@/util/basic';
import { useTranslations } from '@/hooks/useTranslations';
import FallbackAvatar from '@/components/shared/FallbackAvatar';

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
  onSectionChange?: (section: string) => void;
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
  onSectionChange
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
                <FallbackAvatar
                  src={profilePicture}
                  alt={t('profile:profileCard.aria.profilePicture')}
                  name={name}
                  className="border border-white"
                  size="lg"
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

          {/* Rating - Only show for sellers/freelancers */}
          {isSeller && (
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
          )}

          {/* Location and Member Since */}
          <div className="mt-3 w-full">
            <div className="flex items-center space-x-1 text-xs text-gray-500 mb-1.5 bg-gray-50 p-1.5 rounded-md">
              <MapPinIcon className="h-3 w-3 text-black-400" />
              <span>{t('profile:profileCard.stats.from')} {from}</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-50 p-1.5 rounded-md">
              <CalendarDaysIcon className="h-3 w-3 text-black-400" />
              <span>{t('profile:sidebar.memberSince', 'Member since')} {memberSince}</span>
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

          {/* Portfolio & Gigs Quick Links - Fixed */}
          <div className="flex flex-wrap gap-3 mt-4">
            {isSeller && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.preventDefault();
                  onSectionChange?.('portfolio');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg hover:bg-orange-100 transition-all text-sm font-medium shadow-sm transition-colors"
              >
                <FolderIcon className="h-4 w-4" />
                {t('profile:profileCard.navigation.portfolio')}
              </motion.button>
            )}

            {isSeller && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.preventDefault();
                  onSectionChange?.('gigs');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg hover:bg-orange-100 transition-all text-sm font-medium shadow-sm transition-colors"
              >
                <BriefcaseIcon className="h-4 w-4" />
                {t('profile:profileCard.navigation.gigs')}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileCard;