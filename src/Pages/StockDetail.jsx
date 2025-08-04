import { useEffect, useState } from 'react';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useParams } from 'react-router-dom';
import { generateBillPDF } from '../utils/generateBillPDF';

const ITEMS_PER_PAGE = 5;

export default function StockDetail() {
  const { itemId } = useParams();
  const [item, setItem] = useState(null);
  const [relatedComplaints, setRelatedComplaints] = useState([]);
  const [relatedTransactions, setRelatedTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    name: '',
    address: '',
    phone: '',
    invoice_no: '',
    description: '',
    discount: 0,
  });

  const [complaintPage, setComplaintPage] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);

  useEffect(() => {
    const fetchItemAndDetails = async () => {
      const itemRef = doc(db, 'stock', itemId);
      const itemSnap = await getDoc(itemRef);

      if (itemSnap.exists()) {
        const itemData = { id: itemSnap.id, ...itemSnap.data() };
        setItem(itemData);

        const complaintsSnap = await getDocs(collection(db, 'complaints'));
        const complaints = complaintsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const usedIn = complaints.filter(c =>
          c.itemsUsed?.toLowerCase().includes(itemData.name.toLowerCase())
        );
        setRelatedComplaints(usedIn);

        const cashflowSnap = await getDocs(collection(db, 'cashflow'));
        const cashflows = cashflowSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const matchingTransactions = cashflows.filter(tx =>
          tx.itemName?.toLowerCase() === itemData.name.toLowerCase()
        );
        setRelatedTransactions(matchingTransactions);
      }
    };

    fetchItemAndDetails();
  }, [itemId]);

  const handleGenerateBill = (tx) => {
    if (!tx.name || !tx.address || !tx.phone || !tx.invoice_no || !tx.description || tx.discount === undefined) {
      setSelectedTransaction(tx);
      setInvoiceData({
        name: tx.name || '',
        address: tx.address || '',
        phone: tx.phone || '',
        invoice_no: tx.invoice_no || '',
        description: tx.description || '',
        discount: tx.discount || 0,
      });
      setInvoiceDialogOpen(true);
    } else {
      generateBill(tx);
    }
  };

  const generateBill = async (tx) => {
    await generateBillPDF({
      name: tx.name,
      address: tx.address,
      phone: tx.phone,
      invoice_no: tx.invoice_no,
      date: tx.date?.seconds ? new Date(tx.date.seconds * 1000).toLocaleDateString() : '',
      discount: Number(tx.discount),
      items: [{
        description: tx.description,
        qty: tx.quantity,
        rate: tx.amount,
      }],
    });
  };

  const saveInvoiceFieldsAndGenerate = async () => {
    try {
      const txRef = doc(db, 'cashflow', selectedTransaction.id);
      await updateDoc(txRef, {
        name: invoiceData.name,
        address: invoiceData.address,
        phone: invoiceData.phone,
        invoice_no: invoiceData.invoice_no,
        description: invoiceData.description,
        discount: Number(invoiceData.discount),
      });

      setInvoiceDialogOpen(false);
      generateBill({ ...selectedTransaction, ...invoiceData });
    } catch (error) {
      console.error('Error saving invoice fields:', error);
    }
  };

  if (!item) return <p className="p-4 text-center text-gray-500">Loading item details...</p>;

  const paginatedComplaints = relatedComplaints.slice((complaintPage - 1) * ITEMS_PER_PAGE, complaintPage * ITEMS_PER_PAGE);
  const paginatedTransactions = relatedTransactions.slice((transactionPage - 1) * ITEMS_PER_PAGE, transactionPage * ITEMS_PER_PAGE);

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg space-y-8 sm:p-10">
      <h2 className="text-3xl font-bold text-blue-700 text-center">{item.name}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-blue-50 p-4 rounded shadow">
          <strong>Quantity</strong>: {item.quantity}
        </div>
        <div className="bg-green-50 p-4 rounded shadow">
          <strong>Price/unit</strong>: ₹{item.price}
        </div>
      </div>

      {/* Complaints Table */}
      <section>
        <h3 className="text-xl font-semibold mb-2">🔧 Used in Complaints</h3>
        {paginatedComplaints.length === 0 ? <p>No related complaints.</p> : (
          <>
            <table className="w-full border text-sm text-center bg-white">
              <thead className="bg-gray-200">
                <tr>
                  <th>Customer</th><th>Issue</th><th>Date</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedComplaints.map(c => (
                  <tr key={c.id} className="border-t">
                    <td>{c.name}</td>
                    <td>{c.issue}</td>
                    <td>{c.completedDate ? new Date(c.completedDate.seconds * 1000).toLocaleDateString() : '—'}</td>
                    <td className={c.status === 'completed' ? 'text-green-600' : 'text-red-500'}>{c.status.toUpperCase()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 text-center">
              <button onClick={() => setComplaintPage(p => Math.max(1, p - 1))}>⬅️</button>
              <span className="mx-2">Page {complaintPage}</span>
              <button onClick={() => setComplaintPage(p => p * ITEMS_PER_PAGE < relatedComplaints.length ? p + 1 : p)}>➡️</button>
            </div>
          </>
        )}
      </section>

      {/* Transactions Table */}
      <section>
        <h3 className="text-xl font-semibold mb-2">📦 Transactions</h3>
        {paginatedTransactions.length === 0 ? <p>No transactions found.</p> : (
          <>
            <table className="w-full border text-sm text-center bg-white">
              <thead className="bg-gray-200">
                <tr>
                  <th>Date</th><th>Type</th><th>Category</th><th>Qty</th><th>Amount</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map(tx => (
                  <tr key={tx.id} className="border-t">
                    <td>{tx.date ? new Date(tx.date.seconds * 1000).toLocaleDateString() : '—'}</td>
                    <td>{tx.type}</td>
                    <td>{tx.category}</td>
                    <td>{tx.quantity}</td>
                    <td>₹{tx.amount}</td>
                    <td>
                      {tx.type === 'credit' && (
                        <button
                          onClick={() => handleGenerateBill(tx)}
                          className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                        >
                          Generate Bill
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 text-center">
              <button onClick={() => setTransactionPage(p => Math.max(1, p - 1))}>⬅️</button>
              <span className="mx-2">Page {transactionPage}</span>
              <button onClick={() => setTransactionPage(p => p * ITEMS_PER_PAGE < relatedTransactions.length ? p + 1 : p)}>➡️</button>
            </div>
          </>
        )}
      </section>

      {/* Invoice Dialog */}
      {invoiceDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Enter Invoice Details</h2>
            {['name', 'address', 'phone', 'invoice_no', 'description', 'discount'].map(field => (
              <input
                key={field}
                type={field === 'discount' ? 'number' : 'text'}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={invoiceData[field]}
                onChange={e => setInvoiceData({ ...invoiceData, [field]: e.target.value })}
                className="border p-2 w-full mb-2"
              />
            ))}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setInvoiceDialogOpen(false)} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
              <button onClick={saveInvoiceFieldsAndGenerate} className="bg-blue-600 text-white px-4 py-2 rounded">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
