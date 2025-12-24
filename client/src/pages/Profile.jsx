import { useState, useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';

export default function Profile({ user }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'history', 'settings'
  const [amcDetails, setAmcDetails] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State for "Edit Profile"
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        console.log("🔄 Fetching Profile Data...");
        console.log("User UID:", user.uid);
        console.log("Linked AMC ID:", user.amcId);

        // ------------------------------------------
        // 1. FETCH AMC PLAN DETAILS (If user has one)
        // ------------------------------------------
        if (user.amcId) {
          try {
            const amcRef = doc(db, 'customers', user.amcId);
            const amcSnap = await getDoc(amcRef);
            if (amcSnap.exists()) {
              setAmcDetails(amcSnap.data());
            }
          } catch (err) {
            console.error("Error fetching AMC details:", err);
          }
        }

        // ------------------------------------------
        // 2. FETCH COMPLAINT HISTORY (The Dual Strategy)
        // ------------------------------------------
        const complaintsRef = collection(db, 'complaints');
        let combinedDocs = [];

        // QUERY A: Fetch Old Admin/AMC History (Using AMC ID)
        // This grabs the history from your Admin Panel
        if (user.amcId) {
          const qAmc = query(complaintsRef, where('customerId', '==', user.amcId));
          const snapAmc = await getDocs(qAmc);
          snapAmc.forEach(doc => {
            combinedDocs.push({ id: doc.id, ...doc.data(), _source: 'AMC Record' });
          });
        }

        // QUERY B: Fetch New App Bookings (Using Auth UID)
        // This grabs new bookings made directly from this App
        const qApp = query(complaintsRef, where('customerId', '==', user.uid));
        const snapApp = await getDocs(qApp);
        snapApp.forEach(doc => {
          combinedDocs.push({ id: doc.id, ...doc.data(), _source: 'App Booking' });
        });

        // ------------------------------------------
        // 3. MERGE & SORT
        // ------------------------------------------
        // Remove duplicates (in case a complaint matches both IDs somehow)
        const uniqueHistory = Array.from(new Map(combinedDocs.map(item => [item.id, item])).values());

        // Sort by Date (Newest First)
        uniqueHistory.sort((a, b) => {
           // Handle Firebase Timestamp vs String Date
           const timeA = a.dateReported?.seconds ? a.dateReported.seconds : new Date(a.dateReported || 0).getTime() / 1000;
           const timeB = b.dateReported?.seconds ? b.dateReported.seconds : new Date(b.dateReported || 0).getTime() / 1000;
           return timeB - timeA;
        });

        console.log("✅ Final History List:", uniqueHistory);
        setHistory(uniqueHistory);

      } catch (error) {
        console.error("❌ Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // --- Handlers ---
  const handleLogout = () => {
    signOut(auth);
    navigate('/');
    window.location.reload();
  };

  const handleSaveProfile = async () => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: formData.name,
        phone: formData.phone,
        address: formData.address
      });
      alert("✅ Profile Updated Successfully!");
      window.location.reload(); // Refresh to update the app state
    } catch (error) {
      alert("Error updating profile: " + error.message);
    }
  };

  // --- Render ---
  if (!user) return <div className="p-10 text-center text-red-500">Please Login first.</div>;
  if (loading) return <div className="p-10 text-center text-blue-600 font-bold">Loading Profile...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      
      {/* 🟢 HEADER SECTION */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 flex flex-col md:flex-row items-center gap-6 mb-8">
        <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center text-3xl shadow-inner">
          👤
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl font-bold text-gray-800">{user.name || "Valued Customer"}</h1>
          <p className="text-gray-500 font-medium">{user.email}</p>
          
          {/* AMC Badge */}
          {user.amcId ? (
             <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full mt-2 inline-block border border-green-200">
               🛡️ AMC Member
             </span>
          ) : (
             <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full mt-2 inline-block">
               Regular Customer
             </span>
          )}
        </div>
        <button 
          onClick={handleLogout} 
          className="text-red-500 font-bold border-2 border-red-100 px-5 py-2 rounded-xl hover:bg-red-50 transition"
        >
          Logout
        </button>
      </div>

      {/* 🟢 TABS */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {['overview', 'history', 'settings'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium capitalize whitespace-nowrap transition-colors ${
              activeTab === tab 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-400 hover:text-blue-500'
            }`}
          >
            {tab === 'overview' ? 'Overview' : tab === 'history' ? 'Service History' : 'Edit Profile'}
          </button>
        ))}
      </div>

      {/* 🟢 CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
          {/* Left: AMC Status */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <h3 className="font-bold opacity-80 mb-2 uppercase tracking-wider text-xs">Membership Plan</h3>
            {amcDetails ? (
              <>
                <p className="text-2xl font-bold mb-1">Active Plan</p>
                <div className="mt-4 space-y-1 text-sm opacity-90">
                  <p>Start: <span className="font-semibold">{amcDetails.amcStart || "N/A"}</span></p>
                  <p>End: <span className="font-semibold">{amcDetails.amcEnd || "N/A"}</span></p>
                </div>
              </>
            ) : (
              <>
                <p className="text-xl font-bold mb-2">No Active AMC</p>
                <p className="text-sm opacity-80 mb-4">Protect your RO with our annual plan.</p>
              </>
            )}
            {/* Decorative circle */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white opacity-10 rounded-full"></div>
          </div>

          {/* Right: Personal Info */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">My Details</h3>
                <button onClick={() => setActiveTab('settings')} className="text-blue-600 text-xs font-bold uppercase hover:underline">Edit</button>
             </div>
             <div className="space-y-3">
               <div>
                 <label className="text-xs text-gray-400 font-bold uppercase">Phone</label>
                 <p className="text-gray-700 font-medium">{user.phone || "Not set"}</p>
               </div>
               <div>
                 <label className="text-xs text-gray-400 font-bold uppercase">Address</label>
                 <p className="text-gray-700 font-medium">{user.address || "Not set"}</p>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* 🟢 CONTENT: HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-fade-in">
          {history.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">No service history found.</p>
            </div>
          ) : (
            history.map(item => (
              <div key={item.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row justify-between gap-4">
                
                {/* Issue & Date */}
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">{item.issue}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      📅 {item.dateReported?.seconds 
                          ? new Date(item.dateReported.seconds * 1000).toLocaleDateString() 
                          : (item.date || "N/A")}
                    </span>
                    {/* Source Badge to help you debug */}
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {item._source}
                    </span>
                  </div>
                </div>

                {/* Status & Amount */}
                <div className="flex flex-row sm:flex-col justify-between items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                    item.status === 'completed' 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                  }`}>
                    {item.status}
                  </span>
                  
                  {item.status === 'completed' && item.amountReceived && (
                    <span className="text-sm font-bold text-gray-700">
                      Paid: ₹{item.amountReceived}
                    </span>
                  )}
                </div>

              </div>
            ))
          )}
        </div>
      )}

      {/* 🟢 CONTENT: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm max-w-lg animate-fade-in">
            <h3 className="font-bold text-xl text-gray-800 mb-6">Edit Profile</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                <input 
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="tel"
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Default Address</label>
                <textarea 
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
                  rows="3" 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                />
              </div>

              <button 
                onClick={handleSaveProfile} 
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow-md"
              >
                Save Changes
              </button>
            </div>
        </div>
      )}

    </div>
  );
}