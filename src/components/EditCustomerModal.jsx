// components/EditCustomerModal.jsx
import { useState } from 'react';

export default function EditCustomerModal({ customer, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: customer.name || '',
    phone: customer.phone || '',
    address: customer.address || '',
    charge: customer.charge || '',
    remarks: customer.remarks || '',
    amcStart: customer.amcStart || '',
    amcEnd: customer.amcEnd || '',
    quantity: customer.quantity || 1,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(customer.id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-xl font-bold">×</button>
        <h2 className="text-xl font-bold mb-4">Edit Customer</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {['name', 'phone', 'address'].map(field => (
            <input
              key={field}
              name={field}
              value={formData[field]}
              onChange={handleChange}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              className="w-full p-2 border rounded"
              required
            />
          ))}

          <input
            name="charge"
            type="number"
            value={formData.charge}
            onChange={handleChange}
            placeholder="Charge"
            className="w-full p-2 border rounded"
            required
          />

          <input
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="Quantity"
            className="w-full p-2 border rounded"
            required
          />

          <input
            name="amcStart"
            type="date"
            value={formData.amcStart}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />

          <input
            name="amcEnd"
            type="date"
            value={formData.amcEnd}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />

          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            placeholder="Remarks"
            className="w-full p-2 border rounded"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            💾 Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
