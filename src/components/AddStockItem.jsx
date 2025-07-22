// src/components/AddStockItem.jsx
import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';

export default function AddStockItem() {
  const [item, setItem] = useState({
    name: '',
    quantity: '',
    price: ''
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setItem({ ...item, [name]: value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const quantity = parseInt(item.quantity);
  const price = parseFloat(item.price);
  const name = item.name.trim();

  if (!name || isNaN(quantity) || isNaN(price)) {
    alert('Please enter valid values for all fields.');
    return;
  }

  try {
    await addDoc(collection(db, 'stock'), {
      name,
      quantity,
      price,
      lastUpdated: serverTimestamp()
    });
    alert('Stock item added!');
    navigate('/stock');
  } catch (err) {
    console.error('🔥 Error adding stock item:', err.message || err);
  }
};


  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto mt-10 space-y-4">
      <h2 className="text-xl font-bold text-center text-green-700">Add Stock Item</h2>

      <input
        type="text"
        name="name"
        placeholder="Item Name"
        value={item.name}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />
      <input
        type="number"
        name="quantity"
        placeholder="Quantity"
        value={item.quantity}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />
      <input
        type="number"
        name="price"
        placeholder="Price (₹)"
        value={item.price}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />

      <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
        Add Item
      </button>
    </form>
  );
}
