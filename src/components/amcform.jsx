import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Amcform() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    charge: '',
    amcStart: '',
    remarks: ''
  });

  const calculateAmcEnd = (startDate) => {
    const date = new Date(startDate);
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().split('T')[0];
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'amcStart') {
      const newEndDate = calculateAmcEnd(value);
      setFormData({ ...formData, amcStart: value, amcEnd: newEndDate });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'customers'), formData);
      alert('✅ Customer added!');
      setFormData({
        name: '',
        phone: '',
        address: '',
        charge: '',
        amcStart: '',
        amcEnd: '',
        remarks: ''
      });
    } catch (err) {
      console.error('Error adding customer:', err);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-2xl shadow-lg max-w-2xl mx-auto mt-10 space-y-5 border border-gray-100"
    >
      <h2 className="text-2xl font-bold text-center text-blue-700">📝 Add Customer AMC</h2>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-700 font-medium">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Customer Name"
            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        <div>
          <label className="text-sm text-gray-700 font-medium">Phone</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone Number"
            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        <div>
          <label className="text-sm text-gray-700 font-medium">Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Address"
            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="text-sm text-gray-700 font-medium">Charge (₹)</label>
          <input
            type="text"
            name="charge"
            value={formData.charge}
            onChange={handleChange}
            placeholder="AMC Charges"
            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="text-sm text-gray-700 font-medium">AMC Start Date</label>
          <input
            type="date"
            name="amcStart"
            value={formData.amcStart}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        <div>
          <label className="text-sm text-gray-700 font-medium">AMC End Date</label>
          <input
            type="text"
            name="amcEnd"
            value={formData.amcEnd || ''}
            disabled
            className="w-full border border-gray-200 bg-gray-50 p-2 rounded text-gray-700"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-gray-700 font-medium">Remarks</label>
          <input
            type="text"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            placeholder="Any notes or remarks"
            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition text-lg font-semibold"
      >
        ➕ Save Customer
      </button>
    </form>
  );
}
