// src/pages/StockOverview.jsx
import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertTriangle, Trash2 } from 'lucide-react'; // Trash icon

export default function StockOverview() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const querySnapshot = await getDocs(collection(db, 'stock'));
    const itemsData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setItems(itemsData);
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm('Are you sure you want to delete this item?');
    if (!confirm) return;

    await deleteDoc(doc(db, 'stock', id));
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h2 className="text-3xl font-bold text-center text-blue-700 mb-8">📦 Stock Overview</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {items.map(item => {
          const isLowStock = item.quantity < 5;

          return (
            <div
              key={item.id}
              className={`relative bg-white shadow-md rounded-lg p-4 text-center border border-gray-100 transition-all hover:shadow-lg
                ${isLowStock ? 'bg-red-50 border-red-300' : 'hover:bg-blue-50'}`}
            >
              {/* Delete icon */}
              <Trash2
                size={18}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id);
                }}
              />

              <div onClick={() => navigate(`/stock/${item.id}`)} className="cursor-pointer">
                <p className="text-lg font-semibold text-blue-800 flex justify-center items-center gap-1">
                  {item.name}
                  {isLowStock && <AlertTriangle className="text-red-500" size={18} title="Low Stock!" />}
                </p>
                <p className={`text-sm ${isLowStock ? 'text-red-600 font-semibold' : 'text-gray-500'} mt-1`}>
                  Qty: {item.quantity} {isLowStock && '⚠️'}
                </p>
                <p className="text-sm text-green-600">₹{item.price}</p>
                {isLowStock && (
                  <p className="text-xs text-red-500 mt-2 italic">Low stock! Please restock soon.</p>
                )}
              </div>
            </div>
          );
        })}

        {/* Add new item box */}
        <div
          onClick={() => navigate('/stock/add')}
          className="bg-white border-2 border-dashed border-green-400 p-6 flex flex-col items-center justify-center rounded-lg cursor-pointer hover:bg-green-50 hover:border-green-600 transition"
        >
          <Plus size={36} className="text-green-500 mb-2" />
          <p className="text-green-700 font-medium">Add Item</p>
        </div>
      </div>
    </div>
  );
}
