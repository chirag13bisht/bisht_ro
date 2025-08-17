import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { exportToExcel } from '../utils/exportTOExcel';
import { Link } from 'react-router-dom';
import { Trash2, Pencil } from 'lucide-react';
import EditCustomerModal from '../components/EditCustomerModal'; // Make sure it's implemented

export default function Amclist() {
  const [customers, setCustomers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'customers'));
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const data = snapshot.docs.map(doc => {
          const customer = { id: doc.id, ...doc.data() };
          const endDate = customer.amcEnd ? new Date(customer.amcEnd) : null;
          customer.isAmcActive = endDate ? endDate >= today : false;
          return customer;
        });

        data.sort((a, b) => a.isAmcActive === b.isAmcActive ? 0 : a.isAmcActive ? -1 : 1);
        setCustomers(data);
      } catch (err) {
        console.error('Error fetching customers:', err);
      }
    };

    fetchCustomers();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this AMC?");
    if (!confirmDelete) return;

    try {
      const customer = customers.find(c => c.id === id);
      if (!customer) return;

      await deleteDoc(doc(db, 'customers', id));

      if (customer.cashflowId) {
        await deleteDoc(doc(db, 'cashflow', customer.cashflowId));
      }

      setCustomers(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting AMC and related cashflow:', err);
    }
  };

  const handleSave = async (id, updatedData) => {
  try {
    const customerRef = doc(db, 'customers', id);

    // Convert charge and quantity to numbers
    const updatedCharge = Number(updatedData.charge);
    const updatedQuantity = Number(updatedData.quantity || 1);

    const finalData = {
      ...updatedData,
      charge: updatedCharge,
      quantity: updatedQuantity,
    };

    // 1. Update customer document
    await updateDoc(customerRef, finalData);
    console.log('✅ Customer updated');

    // 2. Update local state
    setCustomers(prev =>
      prev.map(c => (c.id === id ? { ...c, ...finalData } : c))
    );

    // 3. Update corresponding cashflow document (if any)
    const customer = customers.find(c => c.id === id);
    if (customer?.cashflowId) {
      const cashflowRef = doc(db, 'cashflow', customer.cashflowId);
      const amount = updatedCharge * updatedQuantity;

      await updateDoc(cashflowRef, {
        amount,
        remarks: finalData.remarks || '',
        updatedAt: new Date(),
      });

      console.log('✅ Cashflow updated');
    } else {
      console.warn('⚠️ No cashflowId found for customer');
    }

    // 4. Close modal
    setEditingCustomer(null);
  } catch (err) {
    console.error('❌ Error updating customer or cashflow:', err);
    alert('Failed to update. See console for error.');
  }
};




  const filteredCustomers = customers
  .filter(c => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && c.isAmcActive) ||
      (filter === 'expired' && !c.isAmcActive);

    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  })
  .sort((a, b) => {
  if (sortBy === 'name') {
    return a.name.localeCompare(b.name); // alphabetical
  }
  if (sortBy === 'endDateLatest') {
    const dateA = a.amcEnd ? new Date(a.amcEnd) : new Date(0);
    const dateB = b.amcEnd ? new Date(b.amcEnd) : new Date(0);
    return dateB - dateA; // latest AMC end date first
  }
  if (sortBy === 'endDateOldest') {
    const dateA = a.amcEnd ? new Date(a.amcEnd) : new Date(0);
    const dateB = b.amcEnd ? new Date(b.amcEnd) : new Date(0);
    return dateA - dateB; // oldest AMC end date first
  }
  if (sortBy === 'startDateLatest') {
    const dateA = a.amcStart ? new Date(a.amcStart) : new Date(0);
    const dateB = b.amcStart ? new Date(b.amcStart) : new Date(0);
    return dateB - dateA; // latest AMC start date first
  }
  if (sortBy === 'startDateOldest') {
    const dateA = a.amcStart ? new Date(a.amcStart) : new Date(0);
    const dateB = b.amcStart ? new Date(b.amcStart) : new Date(0);
    return dateA - dateB; // oldest AMC start date first
  }
  return 0;
});

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">📋 Customer List</h2>

      {/* Filters & Export */}
      {/* Filters & Export */}
<div className="bg-white shadow-md rounded-lg p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
  {/* 🔍 Search */}
  <div className="flex-1">
    <input
      type="text"
      placeholder="🔍 Search by name or address"
      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>

  {/* 📊 Filter Buttons */}
  <div className="flex gap-2 justify-center">
    {['all', 'active', 'expired'].map(f => (
      <button
        key={f}
        onClick={() => setFilter(f)}
        className={`px-4 py-1 rounded-lg font-medium transition text-sm ${
          filter === f
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }`}
      >
        {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
      </button>
    ))}
  </div>

  {/* 📅 Sort Dropdown */}
  <div className="flex justify-center items-center gap-2">
    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort by:</label>
    <select
      className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
      value={sortBy}
      onChange={(e) => setSortBy(e.target.value)}
    >
      <option value="name">Name (A–Z)</option>
      <option value="endDateLatest">AMC End Date (Latest First)</option>
      <option value="endDateOldest">AMC End Date (Oldest First)</option>
      <option value="startDateLatest">AMC Start Date (Latest First)</option>
      <option value="startDateOldest">AMC Start Date (Oldest First)</option>
    </select>
  </div>

  {/* 📥 Export Button */}
  <div className="flex justify-center">
    <button
      className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition text-sm"
      onClick={() => exportToExcel(customers, 'Customer_List')}
    >
      📥 Export
    </button>
  </div>
</div>


      {/* Customer Cards */}
      {filteredCustomers.length === 0 ? (
        <p className="text-center text-gray-500">No matching customers found.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map(customer => {
            const amcStatus = customer.isAmcActive;
            return (
              <div
                key={customer.id}
                className={`relative p-5 bg-white shadow-lg rounded-lg border hover:shadow-xl transition ${amcStatus ? 'border-green-300' : 'border-red-300'}`}
              >
                <button
                  onClick={() => handleDelete(customer.id)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  title="Delete AMC"
                >
                  <Trash2 size={18} />
                </button>

                <button
                  onClick={() => setEditingCustomer(customer)}
                  className="absolute top-2 left-2 text-blue-500 hover:text-blue-700"
                  title="Edit Customer"
                >
                  <Pencil size={18} />
                </button>

                <Link to={`/customer/${customer.id}`}>
                  <p className="font-semibold text-blue-800 text-lg">{customer.name}</p>
                  <p className="text-sm text-gray-700"><strong>Phone:</strong> {customer.phone}</p>
                  <p className="text-sm text-gray-700"><strong>Address:</strong> {customer.address}</p>
                  <p className="text-sm text-gray-700">
                    <strong>Charge:</strong> ₹
                    {customer.quantity ? customer.charge * customer.quantity : customer.charge}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>AMC:</strong> {customer.amcStart || '—'} → {customer.amcEnd || '—'}
                    <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded ${amcStatus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {amcStatus ? 'Active' : 'AMC Over'}
                    </span>
                  </p>
                  <p className="text-sm text-gray-700"><strong>Remarks:</strong> {customer.remarks || '—'}</p>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* 🔁 Modal — Renders just once */}
      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
