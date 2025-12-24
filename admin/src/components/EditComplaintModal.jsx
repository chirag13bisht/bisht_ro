import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function EditComplaintModal({ complaint, onClose, onSave }) {
  const isAmc = complaint.type?.toLowerCase() === 'amc';

  const [formData, setFormData] = useState({
    name: complaint.name || '',
    phone: complaint.phone || '',
    address: complaint.address || '',
    issue: complaint.issue || '',
    status: complaint.status || '',
    amount: complaint.amount || '',
    itemsUsed: complaint.itemsUsed || '',
    date: complaint.completedDate ? new Date(complaint.completedDate.seconds * 1000).toISOString().split('T')[0] : '',
  });

  const [itemInput, setItemInput] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
   const [stockItems, setStockItems] = useState([]);

  // Initialize selectedItems with quantity after stockItems is loaded
  useEffect(() => {
    if (!complaint.itemsUsed) return;

    const nameCount = {};
    complaint.itemsUsed.split(',').map(name => name.trim()).forEach(name => {
      nameCount[name] = (nameCount[name] || 0) + 1;
    });

    const items = Object.entries(nameCount).map(([name, qty]) => ({
      id: `${name}-${Date.now()}`,
      name,
      quantity: qty,
      custom: !stockItems.some(item => item.name === name),
    }));

    setSelectedItems(items);
  }, [complaint.itemsUsed, stockItems]);

  // Input change for regular fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
 

useEffect(() => {
  const fetchStock = async () => {
    const snap = await getDocs(collection(db, 'stock'));
    const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setStockItems(items);
  };
  fetchStock();
}, []);

  // Input change for item field
  const handleItemInput = (e) => {
    const value = e.target.value;
    setItemInput(value);

    if (value.trim()) {
      const filtered = stockItems.filter(item =>
        item.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };
  

  const addItem = (name) => {
    const existing = selectedItems.find(item => item.name === name);
    if (existing) {
      setSelectedItems(prev =>
        prev.map(item =>
          item.name === name ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      const newItem = {
        id: `${name}-${Date.now()}`,
        name,
        custom: !stockItems.some(item => item.name === name),
        quantity: 1
      };
      setSelectedItems(prev => [...prev, newItem]);
    }
    setItemInput('');
    setSuggestions([]);
  };

  const removeItem = (name) => {
    setSelectedItems(prev =>
      prev.flatMap(item => {
        if (item.name === name) {
          if (item.quantity > 1) {
            return { ...item, quantity: item.quantity - 1 };
          }
          return [];
        }
        return item;
      })
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const flatItems = selectedItems.flatMap(item => Array(item.quantity).fill(item.name));
    onSave(complaint.id, {
      ...formData,
      itemsUsed: flatItems.join(', ')
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-xl font-bold"
          onClick={onClose}
        >
          ×
        </button>
        <h3 className="text-xl font-semibold mb-4">Edit Complaint</h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" className="p-2 border rounded" required />
          <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" className="p-2 border rounded" required />
          <input name="address" value={formData.address} onChange={handleChange} placeholder="Address" className="p-2 border rounded" required />
          <input name="complaint" value={formData.issue} onChange={handleChange} placeholder="Complaint" className="p-2 border rounded" required />
          <input name="status" value={formData.status} onChange={handleChange} placeholder="Status" className="p-2 border rounded" required />
          {!isAmc && (
            <input
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Amount"
              className="p-2 border rounded"
              required
            />
          )}

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
                  if (itemInput.trim()) addItem(itemInput.trim());
                }
              }}
            />
            {suggestions.length > 0 && (
              <ul className="border mt-1 rounded bg-white max-h-32 overflow-auto z-10 relative">
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
            <div className="flex flex-wrap mt-2 gap-2">
              {selectedItems.map(item => (
                <span
                  key={item.id}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                    item.custom
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {item.name} x{item.quantity}
                  <button
                    type="button"
                    className="ml-1 text-red-500 hover:text-red-700 font-bold"
                    onClick={() => removeItem(item.name)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <input name="date" type="date" value={formData.date} onChange={handleChange} placeholder="Date" className="p-2 border rounded" required />

          <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            💾 Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
