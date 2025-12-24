import { useState } from 'react';

export default function RenewAmcModal({ customer, onClose, onRenew }) {
    const calculateAmcEnd = (startDate) => {
  const date = new Date(startDate);
  date.setFullYear(date.getFullYear() + 1);
  date.setDate(date.getDate() - 1); // Subtract 1 day
  return date.toISOString().split('T')[0];
    };

    const today = new Date().toISOString().split("T")[0];

    const [formData, setFormData] = useState({
    startDate: today,// default today
    endDate: calculateAmcEnd(today),
    charge: customer.charge || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'startDate') {
      const newEndDate = calculateAmcEnd(value);
      setFormData({ ...formData, startDate: value, endDate: newEndDate });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = () => {
    onRenew(customer, formData);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-blue-700">🔄 Renew AMC</h2>

        <label className="block mb-2 font-medium">Start Date</label>
        <input
          type="date"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
          className="w-full border p-2 rounded mb-3"
        />

        <label className="block mb-2 font-medium">End Date</label>
        <input
          type="date"
          name="endDate"
          value={formData.endDate}
          onChange={handleChange}
          className="w-full border p-2 rounded mb-3"
        />

        <label className="block mb-2 font-medium">Charge</label>
        <input
          type="number"
          name="charge"
          value={formData.charge}
          onChange={handleChange}
          className="w-full border p-2 rounded mb-4"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
