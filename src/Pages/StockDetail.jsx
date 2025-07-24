import { useEffect, useState } from 'react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useParams, Link } from 'react-router-dom';

const ITEMS_PER_PAGE = 5;

export default function StockDetail() {
  const { itemId } = useParams();
  const [item, setItem] = useState(null);
  const [relatedComplaints, setRelatedComplaints] = useState([]);
  const [relatedTransactions, setRelatedTransactions] = useState([]);

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

  if (!item) return <p className="p-4 text-center text-gray-500">Loading item details...</p>;

  // Pagination logic
  const paginatedComplaints = relatedComplaints.slice(
    (complaintPage - 1) * ITEMS_PER_PAGE,
    complaintPage * ITEMS_PER_PAGE
  );
  const paginatedTransactions = relatedTransactions.slice(
    (transactionPage - 1) * ITEMS_PER_PAGE,
    transactionPage * ITEMS_PER_PAGE
  );

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg space-y-8 sm:p-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-blue-700">{item.name}</h2>
        {item.lastUpdated && (
          <p className="text-sm text-gray-500">
            Last updated: {new Date(item.lastUpdated.seconds * 1000).toLocaleString()}
          </p>
        )}
      </div>

      {/* Quantity & Price */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-lg">
        <div className="bg-blue-50 p-4 rounded-lg shadow">
          <strong className="block text-gray-600 mb-1">Quantity</strong>
          <span className="text-blue-800 font-semibold">{item.quantity}</span>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <strong className="block text-gray-600 mb-1">Price per unit</strong>
          <span className="text-green-700 font-semibold">₹{item.price}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <Link to={`/stock/update/${item.id}`} className="w-full sm:w-auto">
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
            ➕ Update Quantity
          </button>
        </Link>
        <Link to={`/stock/update-price/${item.id}`} className="w-full sm:w-auto">
          <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition">
            💰 Update Price
          </button>
        </Link>
      </div>

      {/* Complaints Table */}
      <section className="border-t pt-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          🔍 Complaints using "{item.name}"
        </h3>
        {relatedComplaints.length === 0 ? (
          <p className="text-gray-500">No complaints found using this item.</p>
        ) : (
          <>
            <div className="overflow-auto rounded-lg border">
              <table className="min-w-full text-sm text-center">
                <thead className="bg-gray-200 text-gray-700">
                  <tr>
                    <th className="px-4 py-2 border">Customer</th>
                    <th className="px-4 py-2 border">Issue</th>
                    <th className="px-4 py-2 border">Used On</th>
                    <th className="px-4 py-2 border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedComplaints.map(c => (
                    <tr key={c.id} className="border-t bg-white hover:bg-gray-50">
                      <td className="px-4 py-2 border">{c.name}</td>
                      <td className="px-4 py-2 border">{c.issue}</td>
                      <td className="px-4 py-2 border">
                        {c.completedDate ? new Date(c.completedDate.seconds * 1000).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className={`px-4 py-2 border font-semibold ${c.status === 'completed' ? 'text-green-600' : 'text-red-500'}`}>
                        {c.status.toUpperCase()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex justify-center mt-4 gap-4">
              <button
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setComplaintPage(prev => Math.max(prev - 1, 1))}
                disabled={complaintPage === 1}
              >
                ⬅️ Prev
              </button>
              <span className="text-gray-700 mt-1">Page {complaintPage}</span>
              <button
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setComplaintPage(prev =>
                  prev * ITEMS_PER_PAGE < relatedComplaints.length ? prev + 1 : prev
                )}
                disabled={complaintPage * ITEMS_PER_PAGE >= relatedComplaints.length}
              >
                Next ➡️
              </button>
            </div>
          </>
        )}
      </section>

      {/* Transactions Table */}
      <section className="border-t pt-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          📦 Stock Transactions (Sales/Purchases)
        </h3>
        {relatedTransactions.length === 0 ? (
          <p className="text-gray-500">No transactions recorded for this item.</p>
        ) : (
          <>
            <div className="overflow-auto rounded-lg border">
              <table className="min-w-full text-sm text-center">
                <thead className="bg-gray-200 text-gray-700">
                  <tr>
                    <th className="px-4 py-2 border">Date</th>
                    <th className="px-4 py-2 border">Type</th>
                    <th className="px-4 py-2 border">Category</th>
                    <th className="px-4 py-2 border">Quantity</th>
                    <th className="px-4 py-2 border">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map(tx => (
                    <tr key={tx.id} className="border-t bg-white hover:bg-gray-50">
                      <td className="px-4 py-2 border">
                        {tx.date ? new Date(tx.date.seconds * 1000).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-2 border font-medium">{tx.type}</td>
                      <td className="px-4 py-2 border">{tx.category}</td>
                      <td className="px-4 py-2 border">{tx.quantity}</td>
                      <td className="px-4 py-2 border">₹{tx.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex justify-center mt-4 gap-4">
              <button
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setTransactionPage(prev => Math.max(prev - 1, 1))}
                disabled={transactionPage === 1}
              >
                ⬅️ Prev
              </button>
              <span className="text-gray-700 mt-1">Page {transactionPage}</span>
              <button
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setTransactionPage(prev =>
                  prev * ITEMS_PER_PAGE < relatedTransactions.length ? prev + 1 : prev
                )}
                disabled={transactionPage * ITEMS_PER_PAGE >= relatedTransactions.length}
              >
                Next ➡️
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
