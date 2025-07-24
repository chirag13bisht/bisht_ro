import { useEffect, useState } from 'react';
import Select from 'react-select';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function ComplaintForm() {
  const [type, setType] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [issue, setIssue] = useState('');

  // For regular complaint
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Date reported
  const [dateReported, setDateReported] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return today;
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      const snapshot = await getDocs(collection(db, 'customers'));
      const customerList = snapshot.docs.map(doc => ({
        value: doc.id,
        label: `${doc.data().name} (${doc.data().phone})`,
        ...doc.data()
      }));
      setCustomers(customerList);
    };
    fetchCustomers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (type === 'amc' && !selectedCustomer) {
      alert('Please select a valid customer for AMC complaint.');
      return;
    }

    if (type === 'regular' && (!name || !phone || !address)) {
      alert('Please fill in all customer details for a regular complaint.');
      return;
    }

    const newComplaint = {
      type,
      issue,
      status: 'pending',
      dateReported: new Date(dateReported),
      ...(type === 'amc' && selectedCustomer ? {
        customerId: selectedCustomer.value,
        name: selectedCustomer.name,
        phone: selectedCustomer.phone,
        address: selectedCustomer.address
      } : {}),
      ...(type === 'regular' ? {
        name: name,
        phone: phone,
        address: address
      } : {})
    };

    await addDoc(collection(db, 'complaints'), newComplaint);
    alert('Complaint filed successfully!');

    // Reset form
    setType('');
    setSelectedCustomer(null);
    setIssue('');
    setName('');
    setPhone('');
    setAddress('');
    setDateReported(new Date().toISOString().split('T')[0]);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-gradient-to-br from-white to-gray-50 p-6 shadow-xl rounded-xl mt-6">
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">Log a Complaint</h2>

      {/* Complaint Type */}
      <div className="mb-4">
        <label className="block mb-2 font-medium text-gray-700">Complaint Type</label>
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select type</option>
          <option value="amc">AMC</option>
          <option value="regular">Regular</option>
        </select>
      </div>

      {/* AMC Customer Autocomplete */}
      {type === 'amc' && (
        <div className="mb-4">
          <label className="block mb-2 font-medium text-gray-700">Select AMC Customer</label>
          <Select
            options={customers}
            value={selectedCustomer}
            onChange={setSelectedCustomer}
            placeholder="Search by name or phone"
            isClearable
            className="text-sm"
          />
        </div>
      )}

      {/* Regular Customer Manual Entry */}
      {type === 'regular' && (
        <>
          <div className="mb-4">
            <label className="block mb-2 font-medium text-gray-700">Customer Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2 font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2 font-medium text-gray-700">Address</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>
        </>
      )}

      {/* Issue Description */}
      <div className="mb-4">
        <label className="block mb-2 font-medium text-gray-700">Issue Description</label>
        <textarea
          value={issue}
          onChange={e => setIssue(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe the issue..."
          required
        />
      </div>

      {/* Date Reported Input */}
      <div className="mb-4">
        <label className="block mb-2 font-medium text-gray-700">Date Reported</label>
        <input
          type="date"
          value={dateReported}
          onChange={e => setDateReported(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2"
          required
        />
      </div>

      {/* Submit Button */}
      <div className="text-center">
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md shadow-md transition-all duration-200"
        >
          Submit Complaint
        </button>
      </div>
    </form>
  );
}
