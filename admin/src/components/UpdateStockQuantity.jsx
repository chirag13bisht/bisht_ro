// src/components/UpdateStockQuantity.jsx
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useParams, useNavigate } from 'react-router-dom';
import toast from "react-hot-toast";

export default function UpdateStockQuantity() {
  const { itemId } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');

  useEffect(() => {
    const fetchItem = async () => {
      const ref = doc(db, 'stock', itemId);
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        setItem(snapshot.data());
      } else {
        toast.alert('Item not found');
        navigate('/stock');
      }
    };
    fetchItem();
  }, [itemId, navigate]);

  const updateQuantity = async (change) => {
    const changeAmount = parseInt(adjustQty);
    if (isNaN(changeAmount) || changeAmount < 1) {
      toast.alert('Enter a valid quantity.');
      return;
    }

    const newQty = item.quantity + change * changeAmount;
    if (newQty < 0) {
      toast.error('Cannot have negative stock!');
      return;
    }

    try {
      await updateDoc(doc(db, 'stock', itemId), {
        quantity: newQty,
        lastUpdated: serverTimestamp(),
      });
      setItem({ ...item, quantity: newQty });
      setAdjustQty('');
      toast.success('Quantity updated!');
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  if (!item) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded space-y-4">
      <h2 className="text-2xl font-bold text-center text-indigo-700">{item.name}</h2>
      <p className="text-center text-gray-600">Current Quantity: <strong>{item.quantity}</strong></p>

      <input
        type="number"
        placeholder="Enter quantity"
        value={adjustQty}
        onChange={(e) => setAdjustQty(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <div className="flex justify-between">
        <button
          onClick={() => updateQuantity(1)}
          className="bg-green-600 text-white w-[48%] py-2 rounded hover:bg-green-700"
        >
          ➕ Add
        </button>
        <button
          onClick={() => updateQuantity(-1)}
          className="bg-red-600 text-white w-[48%] py-2 rounded hover:bg-red-700"
        >
          ➖ Remove
        </button>
      </div>

      <button
        onClick={() => navigate('/stock')}
        className="mt-4 w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
      >
        Back to Stock
      </button>
    </div>
  );
}
