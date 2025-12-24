import { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';

export default function Complaint({ user }) {
  // Initialize form with User Data (if available)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    issue: '',
    issueDetails: '' // Extra box for more details
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Auto-fill form when user data loads
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || ''
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Determine Type (AMC vs Regular)
      const complaintType = user?.amcId ? 'amc' : 'regular';

      // 2. Format the Issue String
      const finalIssue = formData.issueDetails 
        ? `${formData.issue} - ${formData.issueDetails}` 
        : formData.issue;

      // 3. Get Current Date Formats
      const now = new Date();

      // 4. Construct the Database Object
      // We ONLY send what is needed for a pending complaint.
      // 'amount', 'itemsUsed', 'completedDate' will be added by Admin later.
      const newComplaint = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        issue: finalIssue,
        type: complaintType, // 'amc' or 'regular'
        status: 'pending',   // Always starts as pending
        
        dateReported: now,   // Timestamp
        
        customerId: user?.uid || null, 
        source: 'client_app'
      };

      // 5. Save to Firestore
      await addDoc(collection(db, 'complaints'), newComplaint);

      alert("✅ Service Request Booked Successfully!");
      navigate('/'); // Go back home
    } catch (error) {
      console.error("Error booking service:", error);
      alert("Failed to book service. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-3xl font-bold text-center text-blue-800 mb-2">Book a Service</h2>
        <p className="text-center text-gray-500 mb-8">
          Confirm your details below to schedule a visit.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Name Field */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
            <input 
              type="text" 
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Your Name"
            />
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
            <input 
              type="tel" 
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Contact Number"
            />
          </div>

          {/* Address Field */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Address</label>
            <textarea 
              name="address"
              required
              rows="3"
              value={formData.address}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Full Address (House No, Street, Landmark...)"
            ></textarea>
          </div>

          {/* Issue Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Service Type</label>
            <select 
              name="issue" 
              required
              value={formData.issue} 
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="" disabled>Select Service...</option>
              <option value="Regular Service">Regular Service (Filter Change)</option>
              <option value="Repair">Repair / Not Working</option>
              <option value="Installation">New Installation</option>
              <option value="Leakage">Water Leakage</option>
              <option value="Noise Issue">Noise Issue</option>
            </select>
          </div>

          {/* Extra Details (Optional) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Additional Details (Optional)</label>
            <input 
              type="text" 
              name="issueDetails"
              value={formData.issueDetails}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Please come after 5 PM"
            />
          </div>

          {/* AMC Badge */}
          {user?.amcId && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg text-sm flex items-center gap-2">
              <span className="text-lg">🛡️</span>
              <span>
                <strong>AMC Active:</strong> Service Type set to <b>AMC</b> automatically.
              </span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-md hover:bg-blue-700 transition transform active:scale-95"
          >
            {loading ? "Booking..." : "Confirm Booking"}
          </button>

        </form>
      </div>
    </div>
  );
}