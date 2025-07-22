import { useEffect, useState } from 'react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useParams, Link } from 'react-router-dom';

export default function StockDetail() {
  const { itemId } = useParams();
  const [item, setItem] = useState(null);
  const [relatedComplaints, setRelatedComplaints] = useState([]);

  useEffect(() => {
    const fetchItemAndComplaints = async () => {
      // Fetch item
      const itemRef = doc(db, 'stock', itemId);
      const itemSnap = await getDoc(itemRef);

      if (itemSnap.exists()) {
        const itemData = { id: itemSnap.id, ...itemSnap.data() };
        setItem(itemData);

        // Fetch complaints
        const complaintsSnap = await getDocs(collection(db, 'complaints'));
        const complaints = complaintsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filter complaints that used this item
        const usedIn = complaints.filter(c =>
          c.itemsUsed?.toLowerCase().includes(itemData.name.toLowerCase())
        );

        setRelatedComplaints(usedIn);
      }
    };

    fetchItemAndComplaints();
  }, [itemId]);

  if (!item) return <p className="p-4 text-center text-gray-500">Loading item details...</p>;

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg space-y-6 sm:p-8">
      {/* Item Details */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-blue-700">{item.name}</h2>
        {item.lastUpdated && (
          <p className="text-sm text-gray-500">
            Last updated: {new Date(item.lastUpdated.seconds * 1000).toLocaleString()}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-lg">
        <div className="bg-gray-100 p-4 rounded shadow-inner">
          <strong className="block text-gray-600 mb-1">Quantity</strong>
          <span className="text-blue-800 font-semibold">{item.quantity}</span>
        </div>
        <div className="bg-gray-100 p-4 rounded shadow-inner">
          <strong className="block text-gray-600 mb-1">Price per unit</strong>
          <span className="text-green-700 font-semibold">₹{item.price}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 pt-4">
        <Link to={`/stock/update/${item.id}`} className="w-full sm:w-auto">
          <button className="w-full bg-blue-600 text-white py-2 px-2 rounded hover:bg-blue-700 transition">
            ➕ Update Quantity
          </button>
        </Link>
        <Link to={`/stock/update-price/${item.id}`} className="w-full sm:w-auto">
          <button className="w-full bg-purple-600 text-white py-2 px-2 rounded hover:bg-purple-700 transition">
            💰 Update Price
          </button>
        </Link>
      </div>

      {/* Complaint Section */}
      <div className="pt-6 border-t mt-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">🔍 Complaints using "{item.name}"</h3>
        {relatedComplaints.length === 0 ? (
          <p className="text-gray-500">No complaints found using this item.</p>
        ) : (
          <div className="space-y-4">
            {relatedComplaints.map(c => (
              <div key={c.id} className="p-4 bg-gray-50 rounded border">
                <p><strong>Customer:</strong> {c.name}</p>
                <p><strong>Issue:</strong> {c.issue}</p>
                <p><strong>Used On:</strong> {c.completedDate ? new Date(c.completedDate.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Status:</strong> <span className={`font-semibold ${c.status === 'completed' ? 'text-green-600' : 'text-red-500'}`}>{c.status.toUpperCase()}</span></p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
