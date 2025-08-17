// src/pages/StockDetail.jsx
import { useEffect, useState } from 'react';
import { doc, getDoc, collection, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
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

  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [adjustQty, setAdjustQty] = useState('');

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

  const handleRename = async () => {
    if (!newName.trim() || newName === item.name) return;

    try {
      const stockRef = doc(db, 'stock', item.id);
      await updateDoc(stockRef, { name: newName });

      const complaintSnap = await getDocs(collection(db, 'complaints'));
      const updates = complaintSnap.docs.map(async docSnap => {
        const data = docSnap.data();
        if (data.itemsUsed?.toLowerCase().includes(item.name.toLowerCase())) {
          const updatedItemsUsed = data.itemsUsed.replace(
            new RegExp(item.name, 'gi'),
            newName
          );
          await updateDoc(doc(db, 'complaints', docSnap.id), {
            itemsUsed: updatedItemsUsed
          });
        }
      });

      const cashSnap = await getDocs(collection(db, 'cashflow'));
      const cashUpdates = cashSnap.docs.map(async docSnap => {
        const data = docSnap.data();
        if (data.itemName?.toLowerCase() === item.name.toLowerCase()) {
          await updateDoc(doc(db, 'cashflow', docSnap.id), {
            itemName: newName
          });
        }
      });

      await Promise.all([...updates, ...cashUpdates]);
      setItem(prev => ({ ...prev, name: newName }));
      setRenaming(false);
      alert('✅ Stock renamed successfully!');
    } catch (err) {
      console.error('Rename failed:', err);
      alert('❌ Error renaming stock.');
    }
  };

  const updateQuantity = async (change) => {
    const changeAmount = parseInt(adjustQty);
    if (isNaN(changeAmount) || changeAmount < 1) {
      alert('Enter a valid quantity.');
      return;
    }

    const newQty = item.quantity + change * changeAmount;
    if (newQty < 0) {
      alert('Cannot have negative stock!');
      return;
    }

    try {
      await updateDoc(doc(db, 'stock', itemId), {
        quantity: newQty,
        lastUpdated: serverTimestamp(),
      });
      setItem({ ...item, quantity: newQty });
      setAdjustQty('');
      alert('Quantity updated!');
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

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
    // Merge existing values with invoiceData to avoid overwriting with empty
    const mergedData = {
      name: invoiceData.name || selectedTransaction.name || '',
      address: invoiceData.address || selectedTransaction.address || '',
      phone: invoiceData.phone || selectedTransaction.phone || '',
      invoice_no: invoiceData.invoice_no || selectedTransaction.invoice_no || '',
      description: invoiceData.description || selectedTransaction.description || '',
      discount: invoiceData.discount !== undefined ? Number(invoiceData.discount) : Number(selectedTransaction.discount || 0),
    };

    // Update in cashflow
    const txRef = doc(db, 'cashflow', selectedTransaction.id);
    await updateDoc(txRef, mergedData);

    // Add to invoices collection only if not already exists
    const invoicesRef = collection(db, 'invoices');
    const q = query(invoicesRef, where('invoice_no', '==', mergedData.invoice_no));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      await addDoc(invoicesRef, {
        ...mergedData,
        referenceId: selectedTransaction.id,
        date: new Date(),
      });
    }

    setInvoiceDialogOpen(false);
    generateBill({ ...selectedTransaction, ...mergedData });
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

      {/* Rename + Quantity Update */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Rename */}
        <div className="bg-yellow-50 p-4 rounded shadow">
          <h3 className="font-semibold mb-2">✏️ Rename Stock</h3>
          {!renaming ? (
            <button onClick={() => { setNewName(item.name); setRenaming(true); }} className="bg-yellow-500 text-white px-4 py-2 rounded w-full">Rename</button>
          ) : (
            <>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="border p-2 w-full rounded mb-2" />
              <div className="flex gap-2">
                <button onClick={handleRename} className="bg-green-600 text-white px-4 py-2 rounded w-full">Save</button>
                <button onClick={() => setRenaming(false)} className="bg-gray-400 text-white px-4 py-2 rounded w-full">Cancel</button>
              </div>
            </>
          )}
        </div>

        {/* Update Qty */}
        <div className="bg-indigo-50 p-4 rounded shadow">
          <h3 className="font-semibold mb-2">📦 Update Quantity</h3>
          <input type="number" placeholder="Enter quantity" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} className="border p-2 w-full rounded mb-2" />
          <div className="flex gap-2">
            <button onClick={() => updateQuantity(1)} className="bg-green-600 text-white px-4 py-2 rounded w-full">➕ Add</button>
            <button onClick={() => updateQuantity(-1)} className="bg-red-600 text-white px-4 py-2 rounded w-full">➖ Remove</button>
          </div>
        </div>
      </div>

      {/* Complaints */}
      <section>
        <h3 className="text-xl font-semibold mb-2">🔧 Used in Complaints</h3>
        {paginatedComplaints.length === 0 ? <p>No related complaints.</p> : (
          <>
            <table className="w-full border text-sm text-center bg-white">
              <thead className="bg-gray-200"><tr><th>Customer</th><th>Issue</th><th>Date</th><th>Status</th></tr></thead>
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

      {/* Transactions */}
      <section>
        <h3 className="text-xl font-semibold mb-2">💰 Transactions</h3>
        {paginatedTransactions.length === 0 ? <p>No transactions found.</p> : (
          <>
            <table className="w-full border text-sm text-center bg-white">
              <thead className="bg-gray-200"><tr><th>Date</th><th>Type</th><th>Category</th><th>Qty</th><th>Amount</th><th>Action</th></tr></thead>
              <tbody>
                {paginatedTransactions.map(tx => (
                  <tr key={tx.id} className="border-t">
                    <td>{tx.date ? new Date(tx.date.seconds * 1000).toLocaleDateString() : '—'}</td>
                    <td>{tx.type}</td>
                    <td>{tx.category}</td>
                    <td>{tx.quantity}</td>
                    <td>₹{tx.amount}</td>
                    <td>{tx.type === 'credit' && <button onClick={() => handleGenerateBill(tx)} className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">Generate Bill</button>}</td>
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
