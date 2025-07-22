import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Link } from 'react-router-dom';
import { exportToExcel } from '../utils/exportTOExcel';

export function ComplaintList() {
  const [complaints, setComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all | pending | completed

  useEffect(() => {
    const fetchComplaints = async () => {
      const snapshot = await getDocs(collection(db, 'complaints'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComplaints(data);
    };
    fetchComplaints();
  }, []);

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch =
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === 'all' ||
      (filter === 'pending' && c.status === 'pending') ||
      (filter === 'completed' && c.status === 'completed');

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">🛠️ Complaint Dashboard</h2>

      {/* Search, Filters, Export */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="🔍 Search by name or address"
          className="w-full sm:w-1/3 p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="flex gap-2">
          {['all', 'pending', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1 rounded border font-semibold transition ${
                filter === f
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
          onClick={() => exportToExcel(filteredComplaints, 'Complaint_List')}
        >
          📥 Export Complaints
        </button>
      </div>

      {/* Complaint Cards */}
      {filteredComplaints.length === 0 ? (
        <p className="text-center text-gray-500">No matching complaints found.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredComplaints.map(c => {
            const isPending = c.status === 'pending';
            return (
              <div
                key={c.id}
                className={`p-5 bg-white shadow-lg rounded-lg border hover:shadow-xl transition ${
                  isPending ? 'border-red-300' : 'border-green-300'
                }`}
              >
                <p className="font-semibold text-blue-800 text-lg">{c.name}</p>
                <p className="text-sm text-gray-700"><strong>Address:</strong> {c.address}</p>
                <p className="text-sm text-gray-700"><strong>Issue:</strong> {c.issue}</p>
                <p className="text-sm text-gray-700">
                  <strong>Reported:</strong> {new Date(c.dateReported.seconds * 1000).toLocaleDateString()}
                </p>
                {c.status === 'completed' && (
                  <>
                    <p className="text-sm text-gray-700">
                      <strong>Completed:</strong> {c.completedDate ? new Date(c.completedDate.seconds * 1000).toLocaleDateString() : '—'}
                    </p>
                    <p className="text-sm text-gray-700"><strong>Items Used:</strong> {c.itemsUsed || '-'}</p>
                    <p className="text-sm text-gray-700"><strong>Amount:</strong> ₹{c.amountReceived}</p>
                  </>
                )}
                <p className="text-sm mt-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    isPending ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {isPending ? 'Pending' : 'Completed'}
                  </span>
                </p>

                {isPending && (
                  <Link to={`/complaints/update/${c.id}`}>
                    <button className="mt-3 w-full bg-blue-500 text-white py-1.5 rounded hover:bg-blue-600">
                      Mark as Done
                    </button>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
