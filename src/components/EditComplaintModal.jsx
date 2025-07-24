import { useState } from 'react';

export default function EditComplaintModal({ complaint, onClose, onSave }) {
  const [formData, setFormData] = useState({ ...complaint });

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSave(complaint.id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-xl font-bold"
          onClick={onClose}
        >
          ×
        </button>
        <h3 className="text-xl font-semibold mb-4">Edit Complaint</h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {['name', 'phone', 'address', 'complaint', 'status', 'amount', 'itemsUsed', 'date'].map(field => (
            <input
              key={field}
              name={field}
              value={formData[field] || ''}
              onChange={handleChange}
              placeholder={field}
              className="p-2 border rounded"
              required={field !== 'itemsUsed'} // optional
            />
          ))}

          <button
            type="submit"
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            💾 Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
