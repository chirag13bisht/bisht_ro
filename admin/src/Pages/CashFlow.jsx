// Add this to top imports
import React,{ useMemo } from 'react';
import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where} from 'firebase/firestore';
import { db } from '../firebase/config';
import 'chart.js/auto';
import { exportToExcel } from '../utils/exportTOExcel';
import { Trash2} from 'lucide-react';
import toast from "react-hot-toast";

const ENTRIES_PER_PAGE = 6;

export default function CashflowPage() {
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('overall');
  const [category, setCategory] = useState('sale');
  const [customType, setCustomType] = useState('credit');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const [stockItems, setStockItems] = useState([]);
  const [page, setPage] = useState(1);
  const [date, setDate]= useState('');
  const [selectedItem, setSelectedItem] = useState(null);
const [formData, setFormData] = useState({ name: "", phone: "", address: "" });
const [itemInput, setItemInput] = useState("");
const [selectedItems, setSelectedItems] = useState([]);
const [suggestions, setSuggestions] = useState([]);


  useEffect(() => {
    fetchEntries();
    fetchStock();
  }, []);

  const fetchEntries = async () => {
    const snapshot = await getDocs(collection(db, 'cashflow'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setEntries(data.sort((a, b) => b.date.toDate() - a.date.toDate()));
  };

  const fetchStock = async () => {
    const snapshot = await getDocs(collection(db, 'stock'));
    setStockItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const calculateAmcEnd = (startDate) => {
  const d = new Date(startDate);
  d.setFullYear(d.getFullYear() + 1);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};

const handleAddEntry = async () => {
  if (!amount || !category || (category !== "other" && selectedItems.length === 0)) {
    return toast.error("⚠️ Fill all fields");
  }

  try {
    const type = category === "sale" ? "credit" : "debit";

    // Build lookup maps for fast/more reliable matching
    const stockById = new Map(stockItems.map(s => [s.id, s]));
    const stockByName = new Map(stockItems.map(s => [s.name.trim().toLowerCase(), s]));

    // --- Pre-check for sales: ensure every selected item is present and has enough qty
    if (category === "sale") {
      const problems = [];
      for (const item of selectedItems) {
        const qty = Number(item.quantity || 0);
        // If it's a stock item (not custom) prefer id lookup
        const stock = item.id && stockById.get(item.id) ? stockById.get(item.id) : stockByName.get((item.name || "").trim().toLowerCase());

        if (!stock) {
          problems.push(`"${item.name}" not found in stock`);
        } else if ((stock.quantity ?? 0) < qty) {
          problems.push(`"${item.name}" only ${stock.quantity} in stock`);
        }
      }
      if (problems.length) {
        return toast.error(`Can't proceed:\n• ${problems.join("\n• ")}`);
      }
    }

    // --- Apply stock updates and build items array for a single cashflow doc
    const itemsForCashflow = [];
    let anyAmc = false;

    for (const item of selectedItems) {
      const nameRaw = item.name.trim();
      const nameLower = nameRaw.toLowerCase();
      const qty = Number(item.quantity || 0);

      // find existing stock (prefer id)
      const stock = (item.id && stockById.get(item.id)) || stockByName.get(nameLower) || null;

      if (category === "sale") {
        if (stock) {
          await updateDoc(doc(db, "stock", stock.id), { quantity: (stock.quantity || 0) - qty });
          // keep local copy in sync
          stock.quantity = (stock.quantity || 0) - qty;
        } else {
          // Shouldn't happen due to pre-check, but guard:
          console.warn("Sale: stock missing for", nameRaw);
        }
      } else if (category === "purchase") {
        if (stock) {
          await updateDoc(doc(db, "stock", stock.id), { quantity: (stock.quantity || 0) + qty });
          stock.quantity = (stock.quantity || 0) + qty;
        } else {
          // create new stock document for purchased custom item
          const newStockRef = await addDoc(collection(db, "stock"), {
            name: nameRaw,
            quantity: qty,
            createdAt: new Date(date || Date.now()),
          });
          // add to local map for future iterations
          stockById.set(newStockRef.id, { id: newStockRef.id, name: nameRaw, nameLower, quantity: qty, type: item.type || "item" });
        }
      }

      itemsForCashflow.push({
        itemName: nameRaw,
        quantity: qty,
        type: item.type || "item",
      });

      if (item.type === "amc") anyAmc = true;
    }

    // --- Create single cashflow doc containing all items
    const cashflowDocRef = await addDoc(collection(db, "cashflow"), {
      type,
      category,
      amount: Number(amount),
      description,
      date: date ? new Date(date) : new Date(),
      recordedBy: "admin",
      items: itemsForCashflow, // array of items
      createdAt: new Date(),
    });

    // --- If any item is an AMC, create a customer and link the cashflowId
    if (anyAmc) {
      // If you want one customer per AMC item, loop selectedItems.filter(i => i.type === 'amc')
      // Here we create one customer using the first AMC item:
      const firstAmc = selectedItems.find(i => i.type === "amc");
      if (firstAmc) {
        const customerRef = await addDoc(collection(db, "customers"), {
          name: formData.name || "—",
          phone: formData.phone || "—",
          address: formData.address || "—",
          amcStart: date || new Date().toISOString().split("T")[0],
          amcEnd: calculateAmcEnd(date || new Date().toISOString().split("T")[0]),
          quantity: Number(firstAmc.quantity) || 1,
          amcItem: firstAmc.name,
          charge: Number(amount),
          cashflowId: cashflowDocRef.id,
          createdAt: new Date(),
        });

        // also update cashflow with a customerId if you want
        await updateDoc(doc(db, "cashflow", cashflowDocRef.id), { customerId: customerRef.id });
      }
    }

    // refresh UI lists and reset form state
    await fetchStock();
    await fetchEntries();

    setSelectedItems([]);
    setAmount("");
    setDescription("");
    setDate("");
    setItemInput("");
    setFormData({ name: "", phone: "", address: "" });

    toast.success("✅ Transaction added!");
  } catch (err) {
    console.error("handleAddEntry error:", err);
    toast.error("Something went wrong while saving.");
  }
};

   const hasAmcItem = selectedItems.some((item) => item.type === "amc");


  const handleItemInput = (e) => {
  const value = e.target.value;
  setItemInput(value);
  

  if (value.trim() === "") {
    setSuggestions([]);
    return;
  }

  const filtered = stockItems.filter((item) =>
    item.name.toLowerCase().includes(value.toLowerCase())
  );
  setSuggestions(filtered);
};

const addItem = (input) => {
  const match = stockItems.find(
    (i) => i.name.toLowerCase() === input.trim().toLowerCase()
  );

  if (match) {
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.id === match.id);
      if (existing) {
        return prev.map((i) =>
          i.id === match.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        return [...prev, { ...match, quantity: 1 }];
      }
    });
  } else {
    const customId = `custom-${input.trim()}`;
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.id === customId);
      if (existing) {
        return prev.map((i) =>
          i.id === customId ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        return [
          ...prev,
          { id: customId, name: input.trim(), custom: true, quantity: 1 },
        ];
      }
    });
  }

  setItemInput("");
  setSuggestions([]);
};

const removeOneItem = (id) => {
  setSelectedItems((prev) =>
    prev
      .map((item) =>
        item.id === id ? { ...item, quantity: item.quantity - 1 } : item
      )
      .filter((item) => item.quantity > 0)
  );
};


  const handleDeleteEntry = async (id) => {
  if (!window.confirm("⚠️ Are you sure you want to delete this transaction?")) return;

  try {
    await deleteDoc(doc(db, "cashflow", id));
    setEntries((prev) => prev.filter((entry) => entry.id !== id)); // update state
    toast.success("Transaction deleted successfully!");
  } catch (err) {
    console.error("Error deleting transaction:", err);
    toast.error("Failed to delete transaction.");
  }
};

  const handleItemChange = (value) => {
  setItemName(value);

  // find selected stock item
  const item = stockItems.find((i) => i.name === value);
  setSelectedItem(item || null);
};

  // Filtered and Searched
  const filteredEntries = useMemo(() => {
  const now = new Date();
  return entries.filter(entry => {
    const entryDate = entry.date.toDate();

    const matchesFilter =
      filter === 'day'
        ? entryDate.toDateString() === now.toDateString()
        : filter === 'month'
        ? entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear()
        : filter === 'year'
        ? entryDate.getFullYear() === now.getFullYear()
        : true;

   const allItemNames = entry.items
  ? entry.items.map(i => (i.itemName ? i.itemName.toLowerCase() : ""))
  : [entry.itemName ? entry.itemName.toLowerCase() : ""];

    const matchesSearch =
      entry.description?.toLowerCase().includes(search.toLowerCase()) ||
      allItemNames.some(n => n.includes(search.toLowerCase()));

    return matchesFilter && matchesSearch;
  });
}, [entries, filter, search]);


  const pageCount = Math.ceil(filteredEntries.length / ENTRIES_PER_PAGE);
  const paginatedEntries = filteredEntries.slice((page - 1) * ENTRIES_PER_PAGE, page * ENTRIES_PER_PAGE);

  const totals = filteredEntries.reduce(
    (acc, entry) => {
      entry.type === 'credit' ? (acc.credit += entry.amount) : (acc.debit += entry.amount);
      return acc;
    },
    { credit: 0, debit: 0 }
  );
  const profit = totals.credit - totals.debit;

  const chartData = {
    labels: ['Credit', 'Debit'],
    datasets: [
      {
        data: [totals.credit, totals.debit],
        backgroundColor: ['#4ade80', '#f87171'],
      },
    ],
  };

  const suggestedNames = stockItems
  .filter(item => item.name?.toLowerCase().includes(itemName?.toLowerCase() || ''))
  .map(item => item.name);


  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h2 className="text-3xl font-bold text-blue-800">💰 Cashflow Dashboard</h2>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={() => exportToExcel(filteredEntries, 'Cashflow_Logs')}
        >
          📥 Export Cashflow Logs
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {['day', 'month', 'year', 'overall'].map(f => (
          <button
            key={f}
            className={`px-4 py-2 rounded font-semibold ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6 text-center font-semibold">
        <div className="bg-green-100 text-green-700 p-4 rounded shadow">Credit: ₹{totals.credit}</div>
        <div className="bg-red-100 text-red-700 p-4 rounded shadow">Debit: ₹{totals.debit}</div>
        <div className={`p-4 rounded shadow ${profit >= 0 ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-800'}`}>
          {profit >= 0 ? 'Profit' : 'Loss'}: ₹{profit}
        </div>
      </div>


      {/* Add Transaction */}
<div className="bg-white border rounded shadow p-6 mb-8">
  <h3 className="text-xl font-bold mb-4">➕ Add Transaction</h3>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <select className="border p-2 rounded w-full" value={category} onChange={e => setCategory(e.target.value)}>
      <option value="sale">Sale</option>
      <option value="purchase">Purchase</option>
      <option value="other">Other</option>
    </select>

    {category === 'other' && (
      <select className="border p-2 rounded w-full" value={customType} onChange={e => setCustomType(e.target.value)}>
        <option value="credit">Credit</option>
        <option value="debit">Debit</option>
      </select>
    )}

    {category !== 'other' && (
      <div className="col-span-1 sm:col-span-2">
        <label className="block mb-1 font-medium">Items</label>
        <input
          type="text"
          className="w-full border border-gray-300 p-2 rounded"
          placeholder="Start typing or add custom item"
          value={itemInput}
          onChange={handleItemInput}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (itemInput.trim()) addItem(itemInput);
            }
          }}
        />
        {/* Suggestions */}
        {suggestions.length > 0 && (
          <ul className="border mt-1 rounded bg-white max-h-32 overflow-auto w-full max-w-full">
            {suggestions.map((item) => (
              <li
                key={item.id}
                className="px-3 py-1 hover:bg-blue-100 cursor-pointer"
                onClick={() => addItem(item.name)}
              >
                {item.name}
              </li>
            ))}
          </ul>
        )}
        {/* Selected Items */}
        <div className="flex flex-wrap mt-2 gap-2 w-full break-words">
          {selectedItems.map((item) => (
            <span
              key={item.id}
              className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                item.custom
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {item.name} x{item.quantity}
              <button
                type="button"
                className="ml-1 text-red-500 hover:text-red-700 font-bold"
                onClick={() => removeOneItem(item.id)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    )}

    <input type="number" className="border p-2 rounded w-full" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
    {selectedItem?.type !== "amc" && (
      <input type="text" className="border p-2 rounded w-full" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
    )}
    <input type="date" className="border p-2 rounded w-full" value={date} onChange={e => setDate(e.target.value)} />

    {hasAmcItem && (
      <>
        <input type="text" placeholder="Customer Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="border p-2 rounded w-full" />
        <input type="text" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="border p-2 rounded w-full" />
        <input type="text" placeholder="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="border p-2 rounded w-full" />
      </>
    )}
  </div>

  <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full sm:w-auto">
    ➕ Add Entry
  </button>
</div>


      {/* Search */}
      <input
        type="text"
        placeholder="🔍 Search transactions..."
        className="w-full border border-gray-300 p-2 rounded mb-4"
        value={search}
        onChange={e => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      {/* Transaction Logs */}
      <div className="space-y-4">
  {paginatedEntries.map(entry => (
    <div
      key={entry.id}
      className={`relative p-5 rounded-2xl shadow-md border transition transform hover:scale-[1.01] hover:shadow-lg ${
        entry.type === 'credit'
          ? 'border-green-400 bg-green-50'
          : 'border-red-400 bg-red-50'
      }`}
    >
      {/* Delete button in top-right corner */}
      <button
        onClick={() => handleDeleteEntry(entry.id)}
        className="absolute top-2 right-2 text-red-600 hover:text-red-800"
        title="Delete transaction"
      >
        <Trash2 size={18} />
      </button>

      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-500">
          {new Date(entry.date.toDate()).toLocaleString()}
        </span>
        <span
          className={`text-xs font-bold px-2 py-1 rounded ${
            entry.type === 'credit'
              ? 'bg-green-200 text-green-900'
              : 'bg-red-200 text-red-900'
          }`}
        >
          {entry.type.toUpperCase()}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <p className="text-lg font-semibold text-gray-800">
            ₹{entry.amount}
          </p>
         <p className="text-sm text-gray-600">
  {entry.category} —{" "}
  {entry.items
    ? entry.items.map(i => `${i.itemName} x${i.quantity}`).join(", ")
    : `${entry.itemName || "N/A"} x${entry.quantity || 1}`}
</p>
          {entry.description && (
            <p className="text-xs text-gray-500 mt-1">
              📝 {entry.description}
            </p>
          )}
        </div>
      </div>
    </div>
  ))}
</div>

      {/* Pagination */}
      {/* Pagination */}
{/* Pagination */}
{pageCount > 1 && (
  <div className="flex flex-wrap justify-center mt-6 gap-2">
    {/* Previous button */}
    <button
      onClick={() => setPage((p) => Math.max(p - 1, 1))}
      disabled={page === 1}
      className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded text-sm sm:text-base ${
        page === 1
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-gray-200 hover:bg-gray-300'
      }`}
    >
      Previous
    </button>

    {/* Page numbers (only a range around current page) */}
    {Array.from({ length: pageCount }, (_, idx) => idx + 1)
      .filter(
        (num) =>
          num === 1 || // always show first
          num === pageCount || // always show last
          (num >= page - 1 && num <= page + 1) // show current, one before, one after
      )
      .map((num, i, arr) => (
        <React.Fragment key={num}>
          {/* Ellipsis for skipped pages */}
          {i > 0 && arr[i] - arr[i - 1] > 1 && <span>...</span>}

          <button
            onClick={() => setPage(num)}
            className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded text-sm sm:text-base ${
              page === num
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {num}
          </button>
        </React.Fragment>
      ))}

    {/* Next button */}
    <button
      onClick={() => setPage((p) => Math.min(p + 1, pageCount))}
      disabled={page === pageCount}
      className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded text-sm sm:text-base ${
        page === pageCount
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-gray-200 hover:bg-gray-300'
      }`}
    >
      Next
    </button>
  </div>
)}


    </div>
  );
}