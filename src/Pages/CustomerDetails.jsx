import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  doc, getDoc, collection, query,
  where, getDocs, deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { exportToExcel } from '../utils/exportTOExcel'; // make sure this exists

export default function CustomerDetails() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);

  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState('dateReported');
  const [sortOrder, setSortOrder] = useState('desc');

  const [currentPage, setCurrentPage] = useState(1);
  const complaintsPerPage = 5;

  useEffect(() => {
    const fetchCustomer = async () => {
      const docRef = doc(db, 'customers', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCustomer({ id: docSnap.id, ...docSnap.data() });
      }
    };

    const fetchComplaints = async () => {
      const q = query(collection(db, 'complaints'), where('customerId', '==', id));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComplaints(list);
    };

    fetchCustomer();
    fetchComplaints();
  }, [id]);

  useEffect(() => {
    let filtered = [...complaints];

    // Filter by status
    if (statusFilter) {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Filter by date
    if (dateFilter) {
      filtered = filtered.filter(c =>
        new Date(c.dateReported.seconds * 1000).toLocaleDateString() === dateFilter
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      const aValue = a[sortBy]?.seconds || '';
      const bValue = b[sortBy]?.seconds || '';
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    setFilteredComplaints(filtered);
    setCurrentPage(1);
  }, [complaints, statusFilter, dateFilter, sortBy, sortOrder]);

  const indexOfLast = currentPage * complaintsPerPage;
  const indexOfFirst = indexOfLast - complaintsPerPage;
  const currentComplaints = filteredComplaints.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredComplaints.length / complaintsPerPage);

  const handleDelete = async (complaintId) => {
    if (window.confirm("Are you sure you want to delete this complaint?")) {
      await deleteDoc(doc(db, 'complaints', complaintId));
      setComplaints(prev => prev.filter(c => c.id !== complaintId));
    }
  };

  const handleExport = () => {
    const exportData = filteredComplaints.map(c => ({
      Issue: c.issue,
      Date: new Date(c.dateReported.seconds * 1000).toLocaleDateString(),
      Status: c.status,
      CompletedOn: c.completedDate
        ? new Date(c.completedDate.seconds * 1000).toLocaleDateString()
        : '',
      ItemsUsed: c.itemsUsed || '',
      Amount: c.amountReceived || '',
    }));
    exportToExcel(exportData, `${customer?.name}_complaints`);
  };

  if (!customer) return <div className="p-6 text-center">Loading customer data...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-blue-800 mb-4">👤 {customer.name}'s Profile</h2>

      <div className="bg-white rounded shadow p-4 mb-8 border">
        <p><strong>Phone:</strong> {customer.phone}</p>
        <p><strong>Address:</strong> {customer.address}</p>
        <p><strong>AMC:</strong> {customer.amcStart || '—'} → {customer.amcEnd || '—'}</p>
        <p><strong>Status:</strong> <span className={`font-bold ${new Date(customer.amcEnd) > new Date() ? 'text-green-600' : 'text-red-600'}`}>
          {new Date(customer.amcEnd) > new Date() ? 'Active' : 'Expired'}
        </span></p>
        <p><strong>Charge:</strong> ₹{customer.charge}</p>
        <p><strong>Remarks:</strong> {customer.remarks || '—'}</p>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-semibold">📝 Complaints Log</h3>
        <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Export to Excel
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border p-2 rounded">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
        <input type="date" onChange={e => setDateFilter(e.target.value)} className="border p-2 rounded" />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="border p-2 rounded">
          <option value="dateReported">Sort by Date</option>
          <option value="status">Sort by Status</option>
        </select>
        <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="border p-2 rounded">
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      {/* Complaints Table */}
      <div className="overflow-auto">
        <table className="w-full table-auto border text-sm bg-white shadow">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2">Issue</th>
              <th className="px-4 py-2">Date Reported</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Completed On</th>
              <th className="px-4 py-2">Items Used</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentComplaints.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-4 text-gray-500">No complaints found.</td>
              </tr>
            ) : currentComplaints.map(c => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-2">{c.issue}</td>
                <td className="px-4 py-2">{new Date(c.dateReported.seconds * 1000).toLocaleDateString()}</td>
                <td className={`px-4 py-2 ${c.status === 'completed' ? 'text-green-600' : 'text-red-600'}`}>{c.status}</td>
                <td className="px-4 py-2">{c.completedDate ? new Date(c.completedDate.seconds * 1000).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-2">{c.itemsUsed || '—'}</td>
                <td className="px-4 py-2">{c.amountReceived || '—'}</td>
                <td className="px-4 py-2 space-x-2">
                  <button onClick={() => alert('Edit logic not yet implemented')} className="bg-yellow-400 px-2 py-1 rounded">Edit</button>
                  <button onClick={() => handleDelete(c.id)} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 border rounded ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
