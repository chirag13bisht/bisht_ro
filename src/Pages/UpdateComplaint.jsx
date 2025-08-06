import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, getDocs, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function UpdateComplaint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [stockItems, setStockItems] = useState([]);
  const [itemInput, setItemInput] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [amountReceived, setAmountReceived] = useState('');
  const [dateCompleted, setDateCompleted] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return today;
  });

  useEffect(() => {
    const fetchData = async () => {
      const complaintRef = doc(db, 'complaints', id);
      const stockRef = collection(db, 'stock');

      const [complaintSnap, stockSnap] = await Promise.all([
        getDoc(complaintRef),
        getDocs(stockRef)
      ]);

      if (complaintSnap.exists()) {
        setComplaint({ id: complaintSnap.id, ...complaintSnap.data() });
      }

      const stockList = stockSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStockItems(stockList);
    };

    fetchData();
  }, [id]);

  const handleItemInput = (e) => {
    const value = e.target.value;
    setItemInput(value);

    if (value.trim() === '') {
      setSuggestions([]);
      return;
    }

    const filtered = stockItems.filter(item =>
      item.name.toLowerCase().includes(value.toLowerCase())
    );
    setSuggestions(filtered);
  };

  const addItem = (input) => {
    const match = stockItems.find(i => i.name.toLowerCase() === input.trim().toLowerCase());

    if (match) {
      setSelectedItems(prev => {
        const existing = prev.find(i => i.id === match.id);
        if (existing) {
          return prev.map(i => i.id === match.id ? { ...i, quantity: i.quantity + 1 } : i);
        } else {
          return [...prev, { ...match, quantity: 1 }];
        }
      });
    } else {
      const customId = `custom-${input.trim()}`;
      setSelectedItems(prev => {
        const existing = prev.find(i => i.id === customId);
        if (existing) {
          return prev.map(i => i.id === customId ? { ...i, quantity: i.quantity + 1 } : i);
        } else {
          return [...prev, { id: customId, name: input.trim(), custom: true, quantity: 1 }];
        }
      });
    }

    setItemInput('');
    setSuggestions([]);
  };

  const removeOneItem = (id) => {
    setSelectedItems(prev => prev.map(item =>
      item.id === id ? { ...item, quantity: item.quantity - 1 } : item
    ).filter(item => item.quantity > 0));
  };


  const addCashflowEntry = async ({ type, category, amount, description }) => {
    await addDoc(collection(db, 'cashflow'), {
      type,
      category,
      amount: Number(amount),
      description,
      date: new Date()
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Reduce stock for matched items
      for (const item of selectedItems) {
        if (!item.custom) {
          const ref = doc(db, 'stock', item.id);
          const newQty = Math.max(item.quantity - 1, 0);
          await updateDoc(ref, { quantity: newQty });
        }
      }
      const receivedAmount = complaint.type?.toLowerCase() === 'amc' ? 'AMC' : amountReceived;

      await updateDoc(doc(db, 'complaints', id), {
        status: 'completed',
        itemsUsed: selectedItems.map(i => i.name).join(', '),
        amountReceived: receivedAmount,
        completedDate: new Date(dateCompleted)
      });

      if (complaint.type?.toLowerCase() !== 'amc') {
        await addCashflowEntry({
          type: 'credit',
          category: 'complaint',
          amount: receivedAmount,
          description: `Complaint from ${complaint.name}`
        });
      }

      alert('✅ Complaint marked as completed!');
      navigate('/complaints');
    } catch (err) {
      console.error('Error updating complaint:', err);
    }
  };

  if (!complaint) return <p className="p-4 text-center">Loading complaint...</p>;

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow-lg space-y-4">
      <h2 className="text-2xl font-bold text-center text-green-700 mb-4">Update Complaint</h2>

      <div className="bg-gray-100 p-4 rounded space-y-2">
        <p><strong>Name:</strong> {complaint.name}</p>
        <p><strong>Phone:</strong> {complaint.phone}</p>
        <p><strong>Address:</strong> {complaint.address}</p>
        <p><strong>Type:</strong> {complaint.type}</p>
        <p><strong>Issue:</strong> {complaint.issue}</p>
        <p className="text-sm text-gray-500">
          <strong>Reported on:</strong>{' '}
          {new Date(complaint.dateReported.seconds * 1000).toLocaleDateString()}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Items Used Autocomplete */}
        <div>
          <label className="block mb-1 font-medium">Items Used</label>
          <input
            type="text"
            className="w-full border border-gray-300 p-2 rounded"
            placeholder="Start typing or add custom item"
            value={itemInput}
            onChange={handleItemInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (itemInput.trim()) addItem(itemInput);
              }
            }}
          />
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <ul className="border mt-1 rounded bg-white max-h-32 overflow-auto">
              {suggestions.map(item => (
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
          <div className="flex flex-wrap mt-2 gap-2">
            {selectedItems.map(item => (
              <span
                key={item.id}
                className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                  item.custom ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-700'
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

        {/* Amount Received if not AMC */}
        {complaint.type?.toLowerCase() !== 'amc' && (
          <div>
            <label className="block mb-1 font-medium">Amount Received</label>
            <input
              type="number"
              className="w-full border border-gray-300 p-2 rounded"
              placeholder="Enter amount"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              required
            />
          </div>
        )}

        {/* Date Completed Input */}
        <div>
          <label className="block mb-1 font-medium">Date Completed</label>
          <input
            type="date"
            className="w-full border border-gray-300 p-2 rounded"
            value={dateCompleted}
            onChange={(e) => setDateCompleted(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 font-semibold transition"
        >
          Mark as Completed
        </button>
      </form>
    </div>
  );
}
