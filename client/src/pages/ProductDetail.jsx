import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function ProductDetail() {
  const { id } = useParams(); // 1. Get the ID from the URL
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // 2. Ask Firebase for the document with this specific ID
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No such product!");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) return <div className="text-center py-20 text-xl text-blue-600">Loading details...</div>;
  
  if (!product) return <div className="text-center py-20 text-xl text-red-500">Product not found.</div>;

  // Calculate discount for display
  const hasDiscount = product.originalPrice && Number(product.originalPrice) > Number(product.price);
  const discountPercentage = hasDiscount 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;


    const handleBuy = () => {
  const phoneNumber = "919716152713"; // YOUR NUMBER
  const message = `Hi, I want to order:
  
📦 *${product.name}*
💰 Price: ₹${product.price}
  
Please confirm availability.`;

  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Link to="/" className="text-blue-600 hover:underline mb-6 inline-block font-medium">← Back to Shop</Link>
      
      <div className="grid md:grid-cols-2 gap-10 bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-gray-100">
        
        {/* Left: Image */}
        <div className="bg-gray-50 rounded-xl h-80 md:h-96 flex items-center justify-center overflow-hidden border border-gray-100">
          {product.image ? (
            <img 
              src={product.image} 
              alt={product.name} 
              className="h-full w-full object-contain mix-blend-multiply" 
              onError={(e) => e.target.src = 'https://via.placeholder.com/400?text=No+Image'}
            />
          ) : (
            <span className="text-6xl">💧</span>
          )}
        </div>

        {/* Right: Info */}
        <div className="flex flex-col justify-center">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded w-fit mb-3 uppercase tracking-wider">
            {product.category || 'Product'}
          </span>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
          
          <p className="text-gray-600 mb-8 text-lg leading-relaxed">
            {product.description || "No description available."}
          </p>
          
          <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100 inline-block">
            <span className="text-4xl font-bold text-blue-700">₹{product.price}</span>
            
            {hasDiscount && (
              <>
                <span className="text-gray-400 line-through text-lg ml-3">₹{product.originalPrice}</span>
                <span className="ml-3 text-green-700 text-sm font-bold bg-green-100 px-2 py-1 rounded">
                  {discountPercentage}% OFF
                </span>
              </>
            )}
          </div>

          <div className="flex gap-4 flex-col sm:flex-row">
            <button onClick={handleBuy} className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold py-4 px-6 rounded-xl shadow-md transition transform hover:-translate-y-1">
              Buy on WhatsApp
            </button>
            <Link 
              to="/complaint" 
              className="flex-1 border-2 border-blue-600 text-blue-600 font-bold py-4 px-6 rounded-xl text-center hover:bg-blue-50 transition"
            >
              Request Demo / Install
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}