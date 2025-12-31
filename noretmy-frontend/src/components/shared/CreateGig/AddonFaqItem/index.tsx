import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

interface AddonItem {
  title: string;
  price: string;
  description: string;
}

interface AddonFaqItemProps {
  items: AddonItem[];
  setItems: React.Dispatch<React.SetStateAction<AddonItem[]>>;
}

const AddonFaqItem: React.FC<AddonFaqItemProps> = ({ items, setItems }) => {
  const handleChange = (
    index: number,
    field: keyof AddonItem,
    value: string
  ) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addItem = () => {
    setItems(prev => [...prev, { title: '', price: '', description: '' }]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 mb-8">
      <h3 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">Add-ons</h3>

      <div className="space-y-5">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex flex-col space-y-4 p-5 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition-all duration-200 hover:shadow-md"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-gray-700">Item {index + 1}</span>
              <button
                onClick={() => removeItem(index)}
                className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors duration-200 text-sm"
              >
                <FontAwesomeIcon icon={faTrash} />
                <span>Remove</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => handleChange(index, 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="Enter title"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Price ($)</label>
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) => handleChange(index, 'price', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="Enter price"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={item.description}
                onChange={(e) =>
                  handleChange(index, 'description', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 min-h-24"
                placeholder="Enter description"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addItem}
        className="mt-6 px-5 py-2.5 bg-gradient-to-br from-blue-50 to-blue-100 text-gray-800 rounded-md hover:bg-orange-700 transition duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50"
      >
        <FontAwesomeIcon icon={faPlus} />
        <span>Add New Item</span>
      </button>
    </div>
  );
};

export default AddonFaqItem;