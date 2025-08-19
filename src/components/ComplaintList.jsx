import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Link } from 'react-router-dom';
import { exportToExcel } from '../utils/exportTOExcel';
import { Trash2, Pencil } from 'lucide-react';
import EditComplaintModal from './EditComplaintModal'; // ✅ Import your modal

export function ComplaintList() {
  const [complaints, setComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all'); // amc/paid

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
  const snapshot = await getDocs(collection(db, 'complaints'));
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // 🔹 Sort by dateReported (newest first)
  const sorted = data.sort((a, b) => {
    const dateA = a.dateReported?.seconds || 0;
    const dateB = b.dateReported?.seconds || 0;
    return dateB - dateA;
  });

  setComplaints(sorted);
};

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this complaint?")) {
      await deleteDoc(doc(db, 'complaints', id));
      setComplaints(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleEditClick = (complaint) => {
    setEditingComplaint(complaint); // Pass full object to modal
  };

  const handleSaveEdit = async (id, updatedData) => {
    const docRef = doc(db, 'complaints', id);
    await updateDoc(docRef, updatedData);
    setComplaints(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updatedData } : c))
    );
    setEditingComplaint(null); // Close modal
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch =
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === 'all' ||
      (filter === 'pending' && c.status === 'pending') ||
      (filter === 'completed' && c.status === 'completed');

    const matchesType =
      typeFilter === 'all' || c.type === typeFilter; // 🔹 type: 'amc' or 'paid'

    return matchesSearch && matchesFilter && matchesType;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">🛠️ Complaint Dashboard</h2>

      {/* Search, Filter, Export */}
<div className="bg-white shadow-md rounded-lg p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

  {/* 🔍 Search */}
  <input
    type="text"
    placeholder="🔍 Search by name or address"
    className="w-full sm:w-60 p-2 border rounded-md text-sm"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />

  {/* Status Filter Buttons */}
  <div className="flex gap-2">
    {['all', 'pending', 'completed'].map(f => (
      <button
        key={f}
        onClick={() => setFilter(f)}
        className={`px-3 py-1 rounded-md border text-sm font-medium transition ${
          filter === f
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 hover:bg-gray-200'
        }`}
      >
        {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
      </button>
    ))}
  </div>

  {/* Type Dropdown */}
  <div className="flex items-center gap-2">
    <label className="text-sm font-medium text-gray-700">Type:</label>
    <select
      value={typeFilter}
      onChange={(e) => setTypeFilter(e.target.value)}
      className="border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      <option value="all">All</option>
      <option value="amc">AMC</option>
      <option value="regular">Regular</option>
    </select>
  </div>

  {/* Export Button (smaller) */}
  <button
    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm whitespace-nowrap"
    onClick={() => exportToExcel(filteredComplaints, 'Complaint_List')}
  >
    📥 Export
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
                className={`relative p-5 bg-white shadow-lg rounded-lg border hover:shadow-xl transition ${
                  isPending ? 'border-red-300' : 'border-green-300'
                }`}
              >
                {/* Edit icon */}
                <button
                  onClick={() => handleEditClick(c)}
                  className="absolute top-2 right-10 text-blue-500 hover:text-blue-700"
                  title="Edit Complaint"
                >
                  <Pencil size={18} />
                </button>

                {/* Delete icon */}
                <button
                  onClick={() => handleDelete(c.id)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  title="Delete Complaint"
                >
                  <Trash2 size={18} />
                </button>

                <p className="font-semibold text-blue-800 text-lg">{c.name}</p>
                <p className="text-sm text-gray-700"><strong>Address:</strong> {c.address}</p>
                <p className="text-sm text-gray-700"><strong>Issue:</strong> {c.issue}</p>
                <p className="text-sm text-gray-700">
                  <strong>Reported:</strong> {new Date(c.dateReported?.seconds * 1000).toLocaleDateString()}
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

      {/* Render modal only when editing */}
      {editingComplaint && (
        <EditComplaintModal
          complaint={editingComplaint}
          onClose={() => setEditingComplaint(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
