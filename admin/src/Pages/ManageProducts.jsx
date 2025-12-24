import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Edit Mode State
  const [editId, setEditId] = useState(null); 

  // Form State
  const [form, setForm] = useState({
    name: '',
    price: '',
    originalPrice: '',
    category: 'RO',
    description: '',
    imageUrl: '' // We just store the text link now!
  });

  // 1. Fetch Products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const snap = await getDocs(collection(db, 'products'));
    setProducts(snap.docs.map(d => ({ ...d.data(), id: d.id })));
  };

  // 2. Add or Update Product
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        name: form.name,
        price: Number(form.price),
        originalPrice: Number(form.originalPrice) || 0,
        category: form.category,
        description: form.description,
        image: form.imageUrl, // Save the URL directly
        updatedAt: new Date()
      };

      if (editId) {
        // UPDATE Existing
        await updateDoc(doc(db, 'products', editId), productData);
        alert("Product Updated Successfully!");
      } else {
        // ADD New
        await addDoc(collection(db, 'products'), { ...productData, createdAt: new Date() });
        alert("Product Added Successfully!");
      }

      // Reset Form
      setForm({ name: '', price: '', originalPrice: '', category: 'RO', description: '', imageUrl: '' });
      setEditId(null);
      fetchProducts(); // Refresh list

    } catch (error) {
      console.error("Error:", error);
      alert("Error saving product: " + error.message);
    }
    setLoading(false);
  };

  // 3. Load Product into Form for Editing
  const handleEdit = (product) => {
    setEditId(product.id);
    setForm({
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice || '',
      category: product.category,
      description: product.description,
      imageUrl: product.image // Load the existing URL
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 4. Delete
  const handleDelete = async (id) => {
    if(window.confirm("Are you sure?")) {
      await deleteDoc(doc(db, 'products', id));
      fetchProducts();
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">
        {editId ? '✏️ Update Product' : '📦 Add New Product'}
      </h2>

      <div className="grid lg:grid-cols-2 gap-10">
        
        {/* LEFT COLUMN: The Form */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Image URL Input (CHANGED) */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Product Image URL</label>
              <input 
                type="text" 
                required
                placeholder="https://example.com/image.jpg"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} 
                className="w-full border p-2 rounded text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
              />
              <p className="text-xs text-gray-400 mt-1">Tip: Right-click an image online - Copy Image Address</p>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700">Name</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border p-2 rounded" placeholder="e.g. Royal RO" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700">Category</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full border p-2 rounded">
                  <option>RO</option>
                  <option>Chimney</option>
                  <option>Spare Part</option>
                </select>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700">Sale Price (₹)</label>
                <input required type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full border p-2 rounded" placeholder="9000" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500">Original Price (₹)</label>
                <input type="number" value={form.originalPrice} onChange={e => setForm({...form, originalPrice: e.target.value})} className="w-full border p-2 rounded" placeholder="12000" />
                <p className="text-xs text-gray-400">Leave empty if no discount</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-gray-700">Description / Features</label>
              <textarea required rows="4" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded" placeholder="Describe the product..."></textarea>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <button disabled={loading} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition">
                {loading ? 'Saving...' : (editId ? 'Update Product' : 'Add Product')}
              </button>
              {editId && (
                <button type="button" onClick={() => {setEditId(null); setForm({name:'', price:'', category:'RO', description:'', imageUrl:''})}} className="bg-gray-500 text-white px-4 rounded hover:bg-gray-600">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: The Live Preview */}
        <div>
          <h3 className="text-xl font-bold text-gray-500 mb-4 uppercase tracking-wide">Preview</h3>
          
          <div className="bg-white rounded-xl shadow-md overflow-hidden max-w-sm mx-auto border border-gray-200 relative">
             {/* Image Preview */}
            <div className="h-64 w-full bg-gray-100 flex items-center justify-center relative overflow-hidden">
              {form.imageUrl ? (
                <img 
                  src={form.imageUrl} 
                  alt="Preview" 
                  className="h-full w-full object-cover" 
                  onError={(e) => e.target.src = 'https://via.placeholder.com/300?text=Invalid+Link'} 
                />
              ) : (
                <span className="text-gray-400">Paste URL to see preview</span>
              )}
              {/* Sale Badge */}
              {Number(form.originalPrice) > Number(form.price) && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                  SALE
                </span>
              )}
            </div>

            {/* Details */}
            <div className="p-5">
              <h3 className="text-lg font-bold text-gray-800">{form.name || "Product Name"}</h3>
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{form.description || "Product description..."}</p>
              
              <div className="flex justify-between items-center mt-4">
                <div className="flex flex-col">
                  {Number(form.originalPrice) > Number(form.price) && (
                     <span className="text-xs text-gray-400 line-through">₹{form.originalPrice}</span>
                  )}
                  <span className="text-2xl font-bold text-blue-700">₹{form.price || "0"}</span>
                </div>
                <button className="bg-yellow-400 text-blue-900 font-bold py-2 px-4 rounded shadow-sm">
                  Buy Now
                </button>
              </div>
            </div>
          </div>
          <p className="text-center text-gray-400 text-sm mt-4">
            If the image doesn't load here, it won't load on the website.
          </p>
        </div>
      </div>

      {/* BOTTOM SECTION: Inventory List */}
      <div className="mt-12">
        <h3 className="text-2xl font-bold mb-6 border-b pb-2">Current Inventory ({products.length})</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3 border">Image</th>
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Category</th>
                <th className="p-3 border">Price</th>
                <th className="p-3 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <img src={p.image} className="h-10 w-10 object-cover rounded" alt="Thumbnail" />
                  </td>
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-sm text-gray-600">{p.category}</td>
                  <td className="p-3 text-green-600 font-bold">₹{p.price}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => handleEdit(p)} className="text-blue-500 hover:text-blue-700 font-semibold text-sm">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 font-semibold text-sm">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}