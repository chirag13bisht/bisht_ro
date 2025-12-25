import { Star, Truck } from 'lucide-react';

export default function ProductCard({ product }) {
  
  // 1. Use Real Data
  const offerPrice = Number(product.price || 0);
  const mrp = Number(product.mrp || offerPrice * 1.2); 
  
  // 2. Calculate Discount
  const discount = mrp > offerPrice 
    ? Math.round(((mrp - offerPrice) / mrp) * 100) 
    : 0;

  const handleBuy = () => {
    const phoneNumber = "919716152713";
    const message = `Hi Bisht RO, I want to buy:
    
📦 *${product.name}*
💰 Offer Price: ₹${offerPrice}
    
Please check availability.`;

    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-row gap-3 sm:gap-4 bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors shadow-sm w-full">
      
      {/* 1. IMAGE SECTION (Always Left) */}
      <div className="w-32 sm:w-64 flex-shrink-0 bg-gray-100 rounded-md flex items-center justify-center p-2 relative overflow-hidden h-32 sm:h-56">
         {discount > 0 && (
           <span className="absolute top-0 left-0 bg-red-600 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-br-md z-10">
             {discount}% OFF
           </span>
         )}
         <img 
           src={product.image || "https://placehold.co/200"} 
           alt={product.name} 
           className="h-full w-full object-contain mix-blend-multiply" 
         />
      </div>

      {/* 2. DETAILS SECTION (Right Side) */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        
        <div>
          {/* Title */}
          <h3 className="text-sm sm:text-xl font-medium text-gray-900 hover:text-orange-600 cursor-pointer line-clamp-2 mb-1 leading-tight">
            {product.name}
          </h3>

          {/* Ratings (Desktop only) */}
          <div className="hidden sm:flex items-center gap-1 mb-2">
            <div className="flex text-orange-400">
               <Star size={16} fill="currentColor" />
               <Star size={16} fill="currentColor" />
               <Star size={16} fill="currentColor" />
               <Star size={16} fill="currentColor" />
               <Star size={16} fill="currentColor" className="text-gray-300" />
            </div>
            <span className="text-blue-600 text-xs sm:text-sm hover:underline cursor-pointer">
              (128)
            </span>
          </div>

          {/* Price Block */}
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 mb-1">
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-2xl font-bold text-gray-900">₹{offerPrice.toLocaleString()}</span>
              <span className="text-xs sm:text-sm text-gray-500 font-medium">({discount}% off)</span>
            </div>
            <span className="text-xs sm:text-sm text-gray-500 line-through">M.R.P: ₹{mrp.toLocaleString()}</span>
          </div>

          {/* ✅ DESCRIPTION (Added Here) */}
          {product.description && (
            <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Delivery Info */}
          <div className="text-xs sm:text-sm text-gray-700 mb-3 leading-tight">
             <span className="font-bold">FREE delivery</span> <span className="hidden sm:inline">by</span> <span className="font-bold block sm:inline">Tomorrow, 27 Dec</span>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button 
            onClick={handleBuy}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-xs sm:text-sm font-semibold py-1.5 sm:py-2 px-4 sm:px-6 rounded-full shadow-sm border border-yellow-500 transition-colors w-auto"
          >
            Buy Product
          </button>
        </div>

      </div>
    </div>
  );
}