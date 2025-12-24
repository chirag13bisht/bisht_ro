import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  // Calculate if there is a discount
  const hasDiscount = product.originalPrice && Number(product.originalPrice) > Number(product.price);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col h-full">
      
      {/* Product Image */}
      <div className="h-56 w-full bg-gray-100 flex items-center justify-center relative overflow-hidden group">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
            onError={(e) => e.target.src = 'https://via.placeholder.com/300?text=No+Image'}
          />
        ) : (
          <span className="text-4xl">💧</span> 
        )}
        
        {/* Sale Badge */}
        {hasDiscount && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
            SALE
          </span>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{product.name}</h3>
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description}</p>
        </div>
        
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
          <div className="flex flex-col">
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
            )}
            <span className="text-xl font-bold text-blue-700">₹{product.price}</span>
          </div>
          
          <Link 
            to={`/product/${product.id}`} 
            className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold py-2 px-4 rounded-lg shadow-sm transition transform active:scale-95"
          >
            Buy Now
          </Link>
        </div>
      </div>
    </div>
  );
}