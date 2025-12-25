import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import ProductCard from '../components/ProductCard';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';

export default function Shop() {
  const [allProducts, setAllProducts] = useState([]);
  const [displayProducts, setDisplayProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('default');

  // ✅ UPDATED CATEGORIES: Focus on Machines
  const categories = ['All', 'RO Systems', 'Chimneys', 'Commercial RO', 'Spares'];

  // 1. Fetch Products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllProducts(data);
        setDisplayProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // 2. Apply Filters & Sort
  useEffect(() => {
    let result = [...allProducts];

    // Search
    if (searchQuery) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category
    if (selectedCategory !== 'All') {
      result = result.filter(p => 
        p.category === selectedCategory || p.name.includes(selectedCategory)
      );
    }

    // Sort
    if (sortOrder === 'low') {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortOrder === 'high') {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    }

    setDisplayProducts(result);
  }, [searchQuery, selectedCategory, sortOrder, allProducts]);

  return (
    <div className="bg-gray-50 min-h-screen">
      
      {/* 🔵 HEADER SECTION (Updated Text) */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white pt-10 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Premium ROs & Chimneys</h1>
          <p className="text-blue-200 text-lg">Best prices on top brands like Kent, Aquaguard, Faber & Elica.</p>
          
          {/* SEARCH BAR (Updated Placeholder) */}
          <div className="max-w-2xl mx-auto mt-8 relative">
            <input 
              type="text" 
              placeholder="Search for 'Kent Grand' or 'Kitchen Chimney'..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-4 pl-12 pr-4 rounded-full text-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-400 shadow-xl text-lg"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
          </div>
        </div>
      </div>

      {/* ⚪ MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 -mt-10 relative z-10">
        
        {/* 🎛️ FILTER BAR */}
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <SlidersHorizontal size={18} className="text-gray-400" />
            <select 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none"
            >
              <option value="default">Sort by: Recommended</option>
              <option value="low">Price: Low to High</option>
              <option value="high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* 📦 PRODUCT GRID */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500">Loading catalog...</p>
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
            <Filter size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-700">No products found</h3>
            <p className="text-gray-500">Try searching for something else or change the category.</p>
            <button 
              onClick={() => {setSearchQuery(''); setSelectedCategory('All');}}
              className="mt-4 text-blue-600 font-bold hover:underline"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 pb-20 max-w-5xl mx-auto">
  {displayProducts.map(product => (
    <ProductCard key={product.id} product={product} />
  ))}
</div>
        )}

      </div>
    </div>
  );
}