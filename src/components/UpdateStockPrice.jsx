// src/components/UpdateStockPrice.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function UpdateStockPrice() {
  const { itemId } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const ref = doc(db, 'stock', itemId);
        const snapshot = await getDoc(ref);
        if (snapshot.exists()) {
          setItem(snapshot.data());
          
        } else {
          alert('Item not found');
          navigate('/stock/:itemId');
        }
      } catch (err) {
        console.error('Error fetching item:', err);
      }
    };
    
    fetchItem();
    

  }, [itemId, navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price.');
      return;
    }

    try {
      await updateDoc(doc(db, 'stock', itemId), {
        price,
        lastUpdated: serverTimestamp(),
      });
      alert('Price updated!');
      navigate('/stock');
    } catch (err) {
      console.error('Error updating price:', err);
    }
  };

  if (!item) return <p className="text-center mt-10">Loading item details…</p>;

  return (
    <form
      onSubmit={handleUpdate}
      className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow space-y-4"
    >
      <h2 className="text-xl font-bold text-center text-purple-700">Update Price</h2>

      <p className="text-center">
        <strong>{item.name}</strong><br />
        Current Price: ₹{item.price}
      </p>

      <input
        type="number"
        placeholder="New Price (₹)"
        value={newPrice}
        onChange={(e) => setNewPrice(e.target.value)}
        className="w-full border p-2 rounded"
        required
      />

      <button type="submit" className="bg-purple-600 text-white w-full py-2 rounded hover:bg-purple-700">
        Update Price
      </button>

      <button
        type="button"
        onClick={() => navigate('/stock')}
        className="w-full mt-2 py-2 rounded border text-gray-600 hover:bg-gray-100"
      >
        Cancel
      </button>
    </form>
  );
}
