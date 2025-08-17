import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  doc, getDoc, collection, query,
  where, getDocs, deleteDoc, updateDoc, addDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { exportToExcel } from '../utils/exportTOExcel'; // make sure this exists
import { generateAmcBill } from '../utils/generateAmcBill';
import EditComplaintModal from '../components/EditComplaintModal';


export default function CustomerDetails() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);

  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState('dateReported');
  const [sortOrder, setSortOrder] = useState('desc');
  const [editingComplaint, setEditingComplaint] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const complaintsPerPage = 5;
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    description: '',
    discount: '',
    invoice_no: '',
  });


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
 
  const generateInvoice = () => {
  if ( customer.description === undefined || customer.description === null || customer.description === '' ||
    customer.discount === undefined || customer.discount === null || customer.discount === '' ||
    customer.invoice_no === undefined || customer.invoice_no === null || customer.invoice_no === '') {
    setInvoiceDialogOpen(true);
  } else {
    saveInvoiceFieldsAndGenerate();
  }
};


const saveInvoiceFieldsAndGenerate = async () => {
  try {
    const customerRef = doc(db, 'customers', customer.id);

    // Prepare the updated fields only if they have values
    const updatedFields = {
      invoice_no: invoiceData.invoice_no || customer.invoice_no,
      description: invoiceData.description || customer.description,
      discount:
        invoiceData.discount !== undefined && invoiceData.discount !== ''
          ? Number(invoiceData.discount)
          : Number(customer.discount) || 0,
    };

    // Update Firestore only if modal data was provided or it’s a new entry
    await updateDoc(customerRef, updatedFields);

    // Store invoice entry in invoices collection
   const invoicesRef = collection(db, "invoices");
const q = query(invoicesRef, where("invoice_no", "==", customer.invoice_no));
const snapshot = await getDocs(q);

if (snapshot.empty) {
  // Only add if not exists
  await addDoc(invoicesRef, {
    invoice_no: customer.invoice_no,
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    date: new Date(),
    amount: customer.charge || 0,
  });
}

    setInvoiceDialogOpen(false);

    // Generate the bill using the merged data
    await generateAmcBill({
      name: customer.name,
      address: customer.address,
      phone: customer.phone,
      invoice_no: updatedFields.invoice_no,
      date: customer.amcStart,
      discount: updatedFields.discount,
      items: [
        {
          description: updatedFields.description,
          qty: customer.quantity > 0 ? customer.quantity : 1,
          rate: customer.charge,
        },
      ],
    });
  } catch (error) {
    console.error('Error saving invoice fields:', error);
  }
};


const handleComplaintSave = async (complaintId, updatedData) => {
  const complaintRef = doc(db, 'complaints', complaintId);
  await updateDoc(complaintRef, updatedData);
  setEditingComplaint(null);
  // Refresh complaints list
  const q = query(collection(db, 'complaints'), where('customerId', '==', id));
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  setComplaints(list);
};



  if (!customer) return <div className="p-6 text-center">Loading customer data...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className=" flex justify-between items-center mb-4">
  <h2 className="text-xl sm:text-3xl font-bold text-blue-800 truncate">
    👤 {customer.name}'s Profile
  </h2>
  <button
    onClick={generateInvoice}
    className="bg-green-600 text-white text-sm sm:text-base px-3 py-1 sm:px-4 sm:py-2 rounded hover:bg-green-700"
  >
    Generate Bill
  </button>
</div>

      <div className="bg-white rounded shadow p-4 mb-8 border">
        <p><strong>Phone:</strong> {customer.phone}</p>
        <p><strong>Address:</strong> {customer.address}</p>
        <p><strong>AMC:</strong> {customer.amcStart || '—'} → {customer.amcEnd || '—'}</p>
        <p><strong>Status:</strong> <span className={`font-bold ${new Date(customer.amcEnd) > new Date() ? 'text-green-600' : 'text-red-600'}`}>
          {new Date(customer.amcEnd) > new Date() ? 'Active' : 'Expired'}
        </span></p>
        <p><strong>Charge:</strong> ₹{customer.quantity ? customer.charge * customer.quantity : customer.charge}</p>
        <p><strong>Remarks:</strong> {customer.remarks || '—'}</p>
        <div className="flex justify-between items-center mb-4">
      </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl sm:text-2xl font-semibold">📝 Complaints Log</h3>
        <button onClick={handleExport} className="bg-green-600 text-white text-sm sm:text-base px-3 py-1 sm:px-4 sm:py-2 rounded hover:bg-green-700">
          Export to Excel
        </button>
      </div>

      {/* Filters */}
      {/* Filters */}
<div className="flex flex-nowrap gap-2 mb-4 overflow-x-auto">
  <select
    value={statusFilter}
    onChange={e => setStatusFilter(e.target.value)}
    className="border p-1 sm:p-2 rounded text-xs sm:text-sm min-w-0"
  >
    <option value="">All Status</option>
    <option value="pending">Pending</option>
    <option value="completed">Completed</option>
  </select>

  <input
    type="date"
    onChange={e => setDateFilter(e.target.value)}
    className="border p-1 sm:p-2 rounded text-xs sm:text-sm min-w-0"
  />

  <select
    value={sortBy}
    onChange={e => setSortBy(e.target.value)}
    className="border p-1 sm:p-2 rounded text-xs sm:text-sm min-w-0"
  >
    <option value="dateReported">Sort by Date</option>
    <option value="status">Sort by Status</option>
  </select>

  <select
    value={sortOrder}
    onChange={e => setSortOrder(e.target.value)}
    className="border p-1 sm:p-2 rounded text-xs sm:text-sm min-w-0"
  >
    <option value="desc">Descending</option>
    <option value="asc">Ascending</option>
  </select>
</div>


      {/* Complaints Table */}
      <div className="overflow-x-auto">
  <table className="min-w-full border-collapse border text-sm sm:text-base bg-white shadow">
    <thead className="bg-gray-200">
      <tr>
        <th className="px-4 py-2 border">Issue</th>
        <th className="px-4 py-2 border">Date Reported</th>
        <th className="px-4 py-2 border">Status</th>
        <th className="px-4 py-2 border">Completed On</th>
        <th className="px-4 py-2 border">Items Used</th>
        <th className="px-4 py-2 border">Amount</th>
        <th className="px-4 py-2 border">Actions</th>
      </tr>
    </thead>
    <tbody>
      {currentComplaints.length === 0 ? (
        <tr>
          <td colSpan="7" className="text-center p-4 text-gray-500">No complaints found.</td>
        </tr>
      ) : currentComplaints.map(c => (
        <tr key={c.id} className="border-t">
          <td className="px-4 py-2 border">{c.issue}</td>
          <td className="px-4 py-2 border">{new Date(c.dateReported.seconds * 1000).toLocaleDateString()}</td>
          <td className={`px-4 py-2 border ${c.status === 'completed' ? 'text-green-600' : 'text-red-600'}`}>{c.status}</td>
          <td className="px-4 py-2 border">{c.completedDate ? new Date(c.completedDate.seconds * 1000).toLocaleDateString() : '—'}</td>
          <td className="px-4 py-2 border">{c.itemsUsed || '—'}</td>
          <td className="px-4 py-2 border">{c.amountReceived || '—'}</td>
          <td className="px-4 py-2 border">
  <div className="flex gap-2 justify-center">
    <button
      onClick={() => setEditingComplaint(c)}
      className="bg-yellow-400 hover:bg-yellow-500 text-black text-sm px-3 py-1 rounded shadow"
    >
      Edit
    </button>
    <button
      onClick={() => handleDelete(c.id)}
      className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded shadow"
    >
      Delete
    </button>
  </div>
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
      {invoiceDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Complete Invoice Details</h2>
            <input
              type="text"
              placeholder="Description"
              className="border p-2 w-full mb-2"
              value={invoiceData.description || 'Ro AMC One Year Without Ro Body & 3-4 Service Within Years'}
              onChange={(e) => setInvoiceData({ ...invoiceData, description: e.target.value })}
            />
            <input
              type="number"
              placeholder="Discount"
              className="border p-2 w-full mb-2"
              value={invoiceData.discount}
              onChange={(e) => setInvoiceData({ ...invoiceData, discount: e.target.value })}
            />
            <input
              type="text"
              placeholder="Invoice Number"
              className="border p-2 w-full mb-4"
              value={invoiceData.invoice_no}
              onChange={(e) => setInvoiceData({ ...invoiceData, invoice_no: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setInvoiceDialogOpen(false)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
              <button onClick={saveInvoiceFieldsAndGenerate} className="px-4 py-2 bg-blue-600 text-white rounded">Sumbit</button>
            </div>
          </div>
        </div>
      )}
      {editingComplaint && (
  <EditComplaintModal
    complaint={editingComplaint}
    onClose={() => setEditingComplaint(null)}
    onSave={handleComplaintSave}
  />
)}
    </div>
  );
}
