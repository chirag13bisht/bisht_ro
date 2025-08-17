import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function PendingLedgerPage() {
  const [pendingList, setPendingList] = useState([]);
  const [payments, setPayments] = useState({}); // store entered payment amounts

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    const snapshot = await getDocs(collection(db, 'pendingLedger'));
    setPendingList(snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));
  };

  const handleUpdate = async (id, payment, current) => {
    if (!payment || payment <= 0) return alert("Enter a valid amount");

    const updatedPending = current.pendingAmount - payment;
    const updatedPaid = (current.paidAmount || 0) + payment;

    // 1️⃣ Update pendingLedger
    const ref = doc(db, 'pendingLedger', id);
    await updateDoc(ref, {
      paidAmount: updatedPaid,
      pendingAmount: updatedPending
    });

    // 2️⃣ Add a cashflow entry for this payment
    await addDoc(collection(db, 'cashflow'), {
      type: 'credit',
      category: current.type || "pending",
      amount: payment,
      description: `Pending payment from ${current.name}`,
      date: new Date()
    });

    // Optional: set pending to 0 if cleared
    if (updatedPending <= 0) {
      await updateDoc(ref, { pendingAmount: 0 });
    }

    setPayments(prev => ({ ...prev, [id]: "" }));
    fetchPending();
  };

  const totalPending = pendingList.reduce((sum, entry) => sum + (entry.pendingAmount || 0), 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-blue-700">📜 Pending Payments Ledger</h2>

      <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
        <table className="min-w-full border-collapse bg-white">
          <thead>
            <tr className="bg-blue-600 text-white text-left">
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Paid (₹)</th>
              <th className="py-3 px-4">Pending (₹)</th>
              <th className="py-3 px-4">Update Payment</th>
              <th className="py-3 px-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingList.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No pending payments 🎉
                </td>
              </tr>
            ) : (
              pendingList.map(entry => (
                <tr key={entry.id} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4 font-semibold">{entry.name}</td>
                  <td className="py-3 px-4">{entry.type || "-"}</td>
                  <td className="py-3 px-4 text-green-700">{entry.paidAmount || 0}</td>
                  <td className="py-3 px-4 text-red-600 font-bold">{entry.pendingAmount}</td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      className="border border-gray-300 rounded px-2 py-1 w-24"
                      value={payments[entry.id] || ""}
                      onChange={(e) =>
                        setPayments(prev => ({ ...prev, [entry.id]: e.target.value }))
                      }
                    />
                  </td>
                  <td className="py-3 px-4">
                    <button
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                      onClick={() => handleUpdate(entry.id, Number(payments[entry.id]), entry)}
                    >
                      Mark Paid
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {pendingList.length > 0 && (
            <tfoot>
              <tr className="bg-gray-100 font-bold">
                <td colSpan="3" className="py-3 px-4 text-right">Total Pending:</td>
                <td colSpan="3" className="py-3 px-4 text-red-700 text-lg">
                  ₹{totalPending}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
