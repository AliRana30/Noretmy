import { FiverrCategories } from '@/util/data';
import { useState } from 'react';



interface CategoryComponentProps {
  selectedCategory: string;
  selectedSubcategory: string;
  onCategoryChange: (category: string) => void;
  onSubcategoryChange: (subcategory: string) => void;
}

const CategoryComponent: React.FC<CategoryComponentProps> = ({
  selectedCategory,
  selectedSubcategory,
  onCategoryChange,
  onSubcategoryChange,
}) => {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-l">
        <label className="block text-gray-700 text-lg mb-4">
          Where do you want your ad displayed?
        </label>

        {/* Category Selection */}
        <div className="mb-6">
          <label htmlFor="category" className="block text-gray-600 mb-2">
            Category
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a category</option>
            {FiverrCategories.map((category, index) => (
              <option key={index} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory Selection */}
        {selectedCategory && (
          <div className="mb-6">
            <label htmlFor="subcategory" className="block text-gray-600 mb-2">
              Subcategory
            </label>
            <select
              id="subcategory"
              value={selectedSubcategory}
              onChange={(e) => onSubcategoryChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a subcategory</option>
              {FiverrCategories.find(
                (category) => category.name === selectedCategory,
              )?.subcategories.map((subcategory, index) => (
                <option key={index} value={subcategory}>
                  {subcategory}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Display Selection */}
        <div className="flex justify-between items-center">
          <input
            type="text"
            value={
              selectedSubcategory
                ? `${selectedCategory} - ${selectedSubcategory}`
                : selectedCategory
            }
            className="flex-1 p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            readOnly
          />
        </div>
      </div>
    </div>
  );
};

export default CategoryComponent;
