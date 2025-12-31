import React, { useState } from 'react';

interface CreateDisputeProps {
  onDisputeSubmit: (reason: string, action: string) => void;
  onClose: () => void;
}

const CreateDispute: React.FC<CreateDisputeProps> = ({
  onDisputeSubmit,
  onClose,
}) => {
  const [reason, setReason] = useState('');
  const [action, setAction] = useState('');

  const handleSubmit = () => {
    onDisputeSubmit(reason, action);
  };

  return (
    <div className="mt-6 p-6 border rounded-lg shadow-lg bg-white">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Create Dispute</h2>
      <p className="text-sm text-gray-600 mb-4">
        Please provide the reason for your dispute and the action you'd like us
        to take.
      </p>
      <textarea
        placeholder="Describe the reason for your dispute..."
        className="w-full p-3 border border-red-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
        rows={4}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <input
        type="text"
        placeholder="What action would you like to request?"
        className="w-full p-3 border border-red-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
        value={action}
        onChange={(e) => setAction(e.target.value)}
      />
      <div className="flex justify-end gap-4">
        <button
          onClick={onClose}
          className="bg-gray-200 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-300 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-700 transition-all"
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default CreateDispute;
