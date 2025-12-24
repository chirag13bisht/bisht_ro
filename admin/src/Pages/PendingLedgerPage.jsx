import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { Trash2, Pencil, CheckCircle } from "lucide-react";

export default function PendingLedgerPage() {
  const [entries, setEntries] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    type: "",
    subType: "",
    name: "",
    number: "",
    items: "",
    money: "",
    status: "pending",
    date: ""
  });

  // 🔹 Pagination states
  const [pendingPage, setPendingPage] = useState(1);
  const [clearedPage, setClearedPage] = useState(1);
  const pageSize = 5;

  // 🔹 Fetch Entries
  const fetchData = async () => {
    const querySnapshot = await getDocs(collection(db, "pendingLedger"));
    setEntries(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔹 Add / Update Entry
  const handleAdd = async () => {
    const entryWithDate = {
      ...formData,
      status: editId ? formData.status : "pending",
      date: new Date().toLocaleDateString(),
    };

    if (editId) {
      const entryRef = doc(db, "pendingLedger", editId);
      await updateDoc(entryRef, entryWithDate);
      setEditId(null);
    } else {
      await addDoc(collection(db, "pendingLedger"), entryWithDate);
    }

    setDialogOpen(false);
    setFormData({ type: "", subType: "", name: "", number: "", items: "", money: "", status: "pending", date: "" });
    fetchData();
  };

  // 🔹 Delete Entry
  const handleDelete = async (id) => {
    const entryRef = doc(db, "pendingLedger", id);
    await deleteDoc(entryRef);
    fetchData();
  };

  // 🔹 Open Update Dialog
  const handleUpdate = (entry) => {
    setFormData(entry);
    setEditId(entry.id);
    setDialogOpen(true);
  };

  // 🔹 Mark as Cleared
  const handleMarkCleared = async (id) => {
    const entryRef = doc(db, "pendingLedger", id);
    await updateDoc(entryRef, { status: "cleared", date: new Date().toLocaleDateString() });
    fetchData();
  };

  // 🔹 Paginated Data
  const pendingEntries = entries.filter(e => e.status === "pending");
  const clearedEntries = entries.filter(e => e.status === "cleared");

  const paginatedPending = pendingEntries.slice((pendingPage - 1) * pageSize, pendingPage * pageSize);
  const paginatedCleared = clearedEntries.slice((clearedPage - 1) * pageSize, clearedPage * pageSize);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📑 Settlement Sheet</h1>
        <button
          onClick={() => { setDialogOpen(true); setEditId(null); }}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition"
        >
          ➕ Add Entry
        </button>
      </div>

      {/* PENDING TABLE */}
      <h2 className="text-lg font-semibold mb-3 text-gray-700">⏳ Pending Settlements</h2>
      <div className="overflow-x-auto bg-white shadow-md rounded-lg mb-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-50 text-left text-gray-700">
              <th className="border p-3">Date</th>
              <th className="border p-3">Type</th>
              <th className="border p-3">Name</th>
              <th className="border p-3">Number</th>
              <th className="border p-3">Items / Money</th>
              <th className="border p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPending.length > 0 ? (
              paginatedPending.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition">
                  <td className="border p-3">{entry.date}</td>
                  <td className="border p-3">{entry.subType}</td>
                  <td className="border p-3 font-medium">{entry.name}</td>
                  <td className="border p-3">{entry.number}</td>
                  <td className="border p-3">{entry.items || entry.money}</td>
                  <td className="border p-3 text-center flex justify-center gap-2">
                    <button
                      onClick={() => handleUpdate(entry)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onClick={() => handleMarkCleared(entry.id)}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
                    >
                      <CheckCircle size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center p-6 text-gray-500">
                  No pending records 📌
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Pending Pagination */}
      {pendingEntries.length > pageSize && (
        <div className="flex justify-center gap-4 mb-10">
          <button
            onClick={() => setPendingPage(p => Math.max(p - 1, 1))}
            disabled={pendingPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            ◀ Prev
          </button>
          <span className="px-3 py-1">Page {pendingPage} of {Math.ceil(pendingEntries.length / pageSize)}</span>
          <button
            onClick={() => setPendingPage(p => p + 1)}
            disabled={pendingPage >= Math.ceil(pendingEntries.length / pageSize)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next ▶
          </button>
        </div>
      )}

      {/* CLEARED TABLE */}
      <h2 className="text-lg font-semibold mb-3 text-gray-700">✅ Cleared Settlements</h2>
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-green-50 text-left text-gray-700">
              <th className="border p-3">Date</th>
              <th className="border p-3">Type</th>
              <th className="border p-3">Name</th>
              <th className="border p-3">Number</th>
              <th className="border p-3">Items / Money</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCleared.length > 0 ? (
              paginatedCleared.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition">
                  <td className="border p-3">{entry.date}</td>
                  <td className="border p-3">{entry.subType}</td>
                  <td className="border p-3 font-medium">{entry.name}</td>
                  <td className="border p-3">{entry.number}</td>
                  <td className="border p-3">{entry.items || entry.money}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center p-6 text-gray-500">
                  No cleared records yet ✅
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Cleared Pagination */}
      {clearedEntries.length > pageSize && (
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={() => setClearedPage(p => Math.max(p - 1, 1))}
            disabled={clearedPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            ◀ Prev
          </button>
          <span className="px-3 py-1">Page {clearedPage} of {Math.ceil(clearedEntries.length / pageSize)}</span>
          <button
            onClick={() => setClearedPage(p => p + 1)}
            disabled={clearedPage >= Math.ceil(clearedEntries.length / pageSize)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next ▶
          </button>
        </div>
      )}

      {/* Your dialog stays same below */}
      {dialogOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md animate-fadeIn overflow-y-auto max-h-[90vh]">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        {editId ? "✏️ Update Entry" : "➕ Add New Entry"}
      </h2>

      {/* Type Selection */}
      <label className="block mb-2 font-medium">Type</label>
      <select
        className="w-full border p-2 rounded mb-4"
        value={formData.type}
        onChange={(e) =>
          setFormData({
            ...formData,
            type: e.target.value,
            subType: "",
            items: "",
            money: "",
          })
        }
      >
        <option value="">Select</option>
        <option value="Receivable Item/Payable Item">
          Receivable Item/Payable Item
        </option>
        <option value="Receivable Money/Payable Money">
          Receivable Money/Payable Money
        </option>
      </select>

      {/* Sub Type + Inputs */}
      {formData.type === "Receivable Item/Payable Item" && (
        <>
          <label className="block mb-2 font-medium">Sub Type</label>
          <select
            className="w-full border p-2 rounded mb-4"
            value={formData.subType}
            onChange={(e) =>
              setFormData({ ...formData, subType: e.target.value })
            }
          >
            <option value="">Select</option>
            <option value="Receivable Item">Receivable Item</option>
            <option value="Payable Item">Payable Item</option>
          </select>
          <input
            type="text"
            placeholder="Items"
            className="w-full border p-2 rounded mb-4"
            value={formData.items}
            onChange={(e) =>
              setFormData({ ...formData, items: e.target.value })
            }
          />
        </>
      )}

      {formData.type === "Receivable Money/Payable Money" && (
        <>
          <label className="block mb-2 font-medium">Sub Type</label>
          <select
            className="w-full border p-2 rounded mb-4"
            value={formData.subType}
            onChange={(e) =>
              setFormData({ ...formData, subType: e.target.value })
            }
          >
            <option value="">Select</option>
            <option value="Receivable Money">Receivable Money</option>
            <option value="Payable Money">Payable Money</option>
          </select>
          <input
            type="number"
            placeholder="Money"
            className="w-full border p-2 rounded mb-4"
            value={formData.money}
            onChange={(e) =>
              setFormData({ ...formData, money: e.target.value })
            }
          />
        </>
      )}

      {/* Common Inputs */}
      <input
        type="text"
        placeholder="Name"
        className="w-full border p-2 rounded mb-4"
        value={formData.name}
        onChange={(e) =>
          setFormData({ ...formData, name: e.target.value })
        }
      />
      <input
        type="text"
        placeholder="Number"
        className="w-full border p-2 rounded mb-4"
        value={formData.number}
        onChange={(e) =>
          setFormData({ ...formData, number: e.target.value })
        }
      />

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => setDialogOpen(false)}
          className="px-4 py-2 border rounded-lg hover:bg-gray-100"
        >
          ❌ Cancel
        </button>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {editId ? "💾 Update" : "➕ Add"}
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
