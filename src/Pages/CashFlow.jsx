// Add this to top imports
import React,{ useMemo } from 'react';
import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import { exportToExcel } from '../utils/exportTOExcel';

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

  const handleAddEntry = async () => {
    if (!amount || !category || (category !== 'other' && (!itemName || !quantity))) return alert('⚠️ Fill all fields');

    let type = category === 'sale' ? 'credit' : 'debit';
    let itemNameTrimmed = itemName.trim().toLowerCase();
    let qty = Number(quantity);

    if (category === 'other') {
      type = customType;
      itemNameTrimmed = '';
      qty = null;
    } else {
      const matchedItem = stockItems.find(i => i.name.toLowerCase() === itemNameTrimmed);

      if (category === 'sale') {
        if (!matchedItem) return alert(`❌ Item "${itemName}" not found in stock.`);
        if (matchedItem.quantity < qty) {
          return alert(`❌ Only ${matchedItem.quantity} available in stock for "${itemName}".`);
        }
        await updateDoc(doc(db, 'stock', matchedItem.id), {
          quantity: matchedItem.quantity - qty,
        });
      } else if (category === 'purchase') {
        if (matchedItem) {
          await updateDoc(doc(db, 'stock', matchedItem.id), {
            quantity: matchedItem.quantity + qty,
          });
        } else {
          await addDoc(collection(db, 'stock'), {
            name: itemNameTrimmed,
            quantity: qty,
            pricePerUnit: Number(amount) / qty,
            createdAt: new Date(),
          });
        }
      }
    }

    await addDoc(collection(db, 'cashflow'), {
      type,
      category,
      amount: Number(amount),
      itemName: itemNameTrimmed,
      quantity: qty,
      description,
      date: new Date(),
      recordedBy: 'admin',
    });

    setAmount('');
    setCategory('sale');
    setItemName('');
    setQuantity('');
    setDescription('');
    setCustomType('credit');
    fetchEntries();
    fetchStock();
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

      const matchesSearch =
        entry.description?.toLowerCase().includes(search.toLowerCase()) ||
        entry.itemName?.toLowerCase().includes(search.toLowerCase());

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
    .filter(item => item.name.toLowerCase().includes(itemName.toLowerCase()))
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

      {/* Chart */}
      <div className="flex justify-center mb-8">
        <div className="w-44 h-44 sm:w-52 sm:h-52">
          <Pie data={chartData} />
        </div>
      </div>

      {/* Add Transaction */}
      <div className="bg-white border rounded shadow p-6 mb-8">
        <h3 className="text-xl font-bold mb-4">➕ Add Transaction</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <select className="border p-2 rounded" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="sale">Sale</option>
            <option value="purchase">Purchase</option>
            <option value="other">Other</option>
          </select>

          {category === 'other' && (
            <select className="border p-2 rounded" value={customType} onChange={e => setCustomType(e.target.value)}>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
          )}

          {category !== 'other' && (
            <>
              <input
                type="text"
                className="border p-2 rounded"
                placeholder="Item Name"
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                list="item-suggestions"
              />
              <datalist id="item-suggestions">
                {suggestedNames.map((name, idx) => (
                  <option key={idx} value={name} />
                ))}
              </datalist>
              <input
                type="number"
                className="border p-2 rounded"
                placeholder="Quantity"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />
            </>
          )}

          <input type="number" className="border p-2 rounded" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
          <input type="text" className="border p-2 rounded" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" onClick={handleAddEntry}>
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
      <div className="space-y-3">
        {paginatedEntries.map(entry => (
          <div
            key={entry.id}
            className={`p-4 border-l-4 rounded shadow ${
              entry.type === 'credit' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
            }`}
          >
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{new Date(entry.date.toDate()).toLocaleString()}</span>
              <span className="font-bold">{entry.type.toUpperCase()}</span>
            </div>
            <p className="font-medium text-gray-800">
              ₹{entry.amount} — {entry.category} ({entry.itemName || 'N/A'} x {entry.quantity || 1})
            </p>
            {entry.description && <p className="text-gray-500 text-sm">📝 {entry.description}</p>}
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