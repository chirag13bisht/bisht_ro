import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { exportToExcel } from '../utils/exportTOExcel';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react'; // Optional: You can use any icon here

export default function Amclist() {
  const [customers, setCustomers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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
      await deleteDoc(doc(db, 'customers', id));
      setCustomers(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting AMC:', err);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && c.isAmcActive) ||
      (filter === 'expired' && !c.isAmcActive);

    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">📋 Customer List</h2>

      {/* Search, Filters, and Export */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="🔍 Search by name or address"
          className="w-full sm:w-1/3 p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="flex gap-2">
          {['all', 'active', 'expired'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1 rounded border font-semibold transition ${filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
                }`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 whitespace-nowrap"
          onClick={() => exportToExcel(customers, 'Customer_List')}
        >
          📥 Export Customers
        </button>
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
                className={`relative p-5 bg-white shadow-lg rounded-lg border hover:shadow-xl transition ${amcStatus ? 'border-green-300' : 'border-red-300'
                  }`}
              >
                {/* Delete icon */}
                <button
                  onClick={() => handleDelete(customer.id)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  title="Delete AMC"
                >
                  <Trash2 size={18} />
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
                    <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded ${amcStatus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
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
    </div>
  );
}
