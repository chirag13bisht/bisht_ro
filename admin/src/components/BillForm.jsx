// src/pages/GenerateBill.jsx
import { useState } from 'react';
import { generateBillPDF } from '../utils/generateBillPDF';


export default function BillForm() {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    invoice_no: '',
    date: '',
    discount: 0,
    bank: '',
    cheque_no: '',
    items: [{ description: '', qty: 1, rate: 0 }],
  });

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = field === 'qty' || field === 'rate' ? Number(value) : value;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({ ...formData, items: [...formData.items, { description: '', qty: 1, rate: 0 }] });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    generateBillPDF(formData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow mt-8">
      <h2 className="text-2xl font-bold text-center text-blue-700 mb-6">🧾 Generate Invoice</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* General Info */}
        <div className="grid md:grid-cols-2 gap-4">
          <input type="text" name="name" placeholder="Customer Name" value={formData.name} onChange={handleChange} className="p-2 border rounded" required />
          <input type="text" name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} className="p-2 border rounded" />
          <input type="text" name="address" placeholder="Address" value={formData.address} onChange={handleChange} className="p-2 border rounded" />
          <input type="text" name="invoice_no" placeholder="Invoice No" value={formData.invoice_no} onChange={handleChange} className="p-2 border rounded" />
          <input type="date" name="date" value={formData.date} onChange={handleChange} className="p-2 border rounded" required />
          <input type="number" name="discount" placeholder="Discount" value={formData.discount} onChange={handleChange} className="p-2 border rounded" />
          <input type="text" name="bank" placeholder="Bank Name" value={formData.bank} onChange={handleChange} className="p-2 border rounded" />
          <input type="text" name="cheque_no" placeholder="Cheque No" value={formData.cheque_no} onChange={handleChange} className="p-2 border rounded" />
        </div>

        {/* Items List */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">🔧 Items</h3>
          {formData.items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-6 gap-2 mb-2">
              <input type="text" placeholder="Description" value={item.description} onChange={(e) => handleItemChange(idx, 'description', e.target.value)} className="col-span-3 p-2 border rounded" required />
              <input type="number" placeholder="Qty" value={item.qty} onChange={(e) => handleItemChange(idx, 'qty', e.target.value)} className="col-span-1 p-2 border rounded" required />
              <input type="number" placeholder="Rate" value={item.rate} onChange={(e) => handleItemChange(idx, 'rate', e.target.value)} className="col-span-1 p-2 border rounded" required />
              <button type="button" onClick={() => removeItem(idx)} className="text-red-600 hover:underline">❌</button>
            </div>
          ))}
          <button type="button" onClick={addItem} className="text-green-600 font-medium hover:underline">➕ Add Item</button>
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          🖨️ Generate & Download Invoice
        </button>
      </form>
    </div>
  );
}
