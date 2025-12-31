'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Pen, Check, X, Plus } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';

interface UserDetailsCardProps {
  description: string;
  skills: string[];
  setDescription: (value: string) => void;
  setSkills: (value: string[]) => void;
}

const UserDetailsCard: React.FC<UserDetailsCardProps> = ({
  description,
  skills,
  setDescription,
  setSkills,
}) => {
  const [newSkill, setNewSkill] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(description);
  const { t } = useTranslations();

  const handleEditDescription = () => {
    if (isEditingDescription) {
      setDescription(editedDescription);
    } else {
      setEditedDescription(description);
    }
    setIsEditingDescription(!isEditingDescription);
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleDeleteSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSkill.trim()) {
      handleAddSkill();
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-6">
      <Card className="bg-white rounded-xl shadow-lg overflow-hidden">
        <CardContent className="p-0">
          {/* Description Section */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-gray-800">
                {t('profile:sellerDetails.description.title')}
              </h2>
              <Button
                variant="ghost"
                onClick={handleEditDescription}
                className="h-8 w-8 p-0 rounded-full bg-gray-50 hover:bg-gray-100"
                aria-label={t(
                  `profile:sellerDetails.description.aria.${isEditingDescription ? 'save' : 'edit'}`
                )}
              >
                {isEditingDescription ? (
                  <Check className="h-4 w-4 text-gray-800" />
                ) : (
                  <Pen className="h-4 w-4 text-gray-800" />
                )}
              </Button>
            </div>
            
            {isEditingDescription ? (
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="min-h-[120px] resize-none border-0 bg-gray-50 rounded-lg p-4 text-sm text-gray-700 focus-visible:ring-1 focus-visible:ring-gray-800"
                placeholder={t('profile:sellerDetails.description.placeholder')}
                aria-label={t('profile:sellerDetails.description.aria.textarea')}
              />
            ) : (
              <div className="text-sm text-gray-600 leading-relaxed">
                {description || t('profile:sellerDetails.description.emptyState')}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100" />

          {/* Skills Section */}
          <div className="p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              {t('profile:sellerDetails.skills.title')}
            </h2>
            
            {/* Skills List */}
            <div className="flex flex-wrap gap-2 mb-5">
              {skills.length > 0 ? (
                skills.map((skill, index) => (
                  <div
                    key={index}
                    className="px-3 py-1.5 bg-gray-50 text-gray-700 text-xs font-medium rounded-md flex items-center group"
                  >
                    {skill}
                    <button
                      onClick={() => handleDeleteSkill(index)}
                      className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={t('profile:sellerDetails.skills.input.aria.deleteButton', {
                        skill
                      })}
                    >
                      <X className="h-3 w-3 text-gray-500 hover:text-gray-800" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  {t('profile:sellerDetails.skills.emptyState')}
                </p>
              )}
            </div>

            {/* Add Skill Input */}
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('profile:sellerDetails.skills.input.placeholder')}
                className="flex-1 border-0 bg-gray-50 text-sm text-gray-700 focus-visible:ring-1 focus-visible:ring-gray-800"
                aria-label={t('profile:sellerDetails.skills.input.aria.input')}
              />
              <Button
                onClick={handleAddSkill}
                disabled={!newSkill.trim()}
                className="bg-gray-800 hover:bg-gray-700 text-white font-medium"
                aria-label={t('profile:sellerDetails.skills.input.aria.addButton')}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('profile:sellerDetails.skills.input.addButton')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDetailsCard;