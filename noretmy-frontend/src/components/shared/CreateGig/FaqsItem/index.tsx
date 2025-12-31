import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqProps {
  items: FaqItem[];
  setItems: React.Dispatch<React.SetStateAction<FaqItem[]>>;
}

const Faq: React.FC<FaqProps> = ({ items, setItems }) => {
  const handleInputChange = (
    index: number,
    field: keyof FaqItem,
    value: string
  ) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addFaqItem = () => {
    setItems(prev => [...prev, { question: '', answer: '' }]);
  };

  const removeFaqItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 mb-8">
      <div className="flex items-center mb-6 border-b pb-3">
        {/* <FontAwesomeIcon icon={faQuestionCircle} className="text-blue-600 mr-2 text-xl" /> */}
        <h3 className="text-xl font-semibold text-gray-800">Frequently Asked Questions</h3>
      </div>

      <div className="space-y-5">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex flex-col space-y-4 p-5 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition-all duration-200 hover:shadow-md"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-gray-700">FAQ #{index + 1}</span>
              <button
                onClick={() => removeFaqItem(index)}
                className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors duration-200 text-sm"
              >
                <FontAwesomeIcon icon={faTrash} />
                <span>Remove</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Question</label>
              <input
                type="text"
                value={item.question}
                onChange={(e) => handleInputChange(index, 'question', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                placeholder="Enter question"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Answer</label>
              <textarea
                value={item.answer}
                onChange={(e) => handleInputChange(index, 'answer', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 min-h-24"
                placeholder="Enter answer"
                rows={4}
              />
            </div>
          </div>
        ))}
      </div>

      

      <button
        onClick={addFaqItem}
        className="mt-6 px-5 py-2.5 bg-gradient-to-br from-blue-50 to-blue-100 text-gray-800 rounded-md hover:bg-blue-700 transition duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        <FontAwesomeIcon icon={faPlus} />
        <span>Add New FAQ</span>
      </button>
    </div>
  );
};

export default Faq;