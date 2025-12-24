import { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const [step, setStep] = useState(1); // 1 = Check AMC, 2 = Create Account
  const [hasAMC, setHasAMC] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [amcPhone, setAmcPhone] = useState('');
  const [amcData, setAmcData] = useState(null); // Stores found AMC details
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    phone: ''
  });

  const navigate = useNavigate();
  const auth = getAuth();

  // 🔍 Step 1: Verify AMC Phone Number
  const verifyAMC = async () => {
    if (amcPhone.length < 10) return alert("Please enter a valid 10-digit number.");
    setLoading(true);

    try {
      // Query your Admin's 'customers' collection
      const q = query(collection(db, 'customers'), where('phone', '==', amcPhone));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // Found it!
        const data = snapshot.docs[0].data();
        setAmcData({ id: snapshot.docs[0].id, ...data });
        // Prefill form with Admin data
        setFormData(prev => ({ 
          ...prev, 
          name: data.name, 
          address: data.address, 
          phone: data.phone 
        }));
        alert(`🎉 AMC Found! Welcome, ${data.name}. Please set a password.`);
        setStep(2); // Move to next step
      } else {
        alert("❌ No AMC found with this number. Please register as a new user.");
        setHasAMC(false); // Force them to normal signup
        setStep(2);
      }
    } catch (error) {
      console.error(error);
      alert("Error checking database.");
    }
    setLoading(false);
  };

  // 📝 Step 2: Create Firebase Account
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Save User Details to Firestore 'users' collection
      // We use setDoc with user.uid so the ID matches the Auth ID
      await setDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        createdAt: new Date(),
        // Vital Link: If they have AMC, save the ID here
        amcId: amcData ? amcData.id : null, 
        role: 'customer'
      });

      alert("Account Created Successfully!");
      navigate('/'); // Go to Shop
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-blue-800 mb-6">Create Account</h2>

        {/* STEP 1: AMC Check */}
        {step === 1 && (
          <div className="space-y-6">
            <p className="text-center text-gray-600">Do you have an existing AMC with us?</p>
            
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => setHasAMC(true)} 
                className={`px-6 py-2 rounded-full font-bold border ${hasAMC ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
              >
                Yes
              </button>
              <button 
                onClick={() => { setHasAMC(false); setStep(2); }} 
                className={`px-6 py-2 rounded-full font-bold border ${!hasAMC ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
              >
                No
              </button>
            </div>

            {hasAMC && (
              <div className="animate-fade-in-up">
                <label className="block text-sm font-bold text-gray-700 mb-1">Registered Phone Number</label>
                <input 
                  type="tel" 
                  value={amcPhone}
                  onChange={(e) => setAmcPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button 
                  onClick={verifyAMC} 
                  disabled={loading}
                  className="w-full bg-yellow-400 text-blue-900 font-bold py-3 mt-4 rounded-lg hover:bg-yellow-500"
                >
                  {loading ? "Checking..." : "Verify AMC"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Final Details */}
        {step === 2 && (
          <form onSubmit={handleSignup} className="space-y-4 animate-fade-in-up">
            {amcData && (
              <div className="bg-green-100 text-green-800 p-3 rounded-lg text-sm text-center mb-4">
                ✅ Linked to AMC Plan: <strong>{amcData.amcItem || "Standard Plan"}</strong>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700">Full Name</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-2 rounded" />
            </div>

            {!amcData && (
              <div>
                <label className="block text-sm font-bold text-gray-700">Phone Number</label>
                <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border p-2 rounded" />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700">Email Address</label>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border p-2 rounded" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700">Password</label>
              <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border p-2 rounded" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700">Address</label>
              <textarea required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border p-2 rounded" rows="2"></textarea>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700">
              {loading ? "Creating Account..." : "Complete Signup"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          Already have an account? <Link to="/login" className="text-blue-600 font-bold hover:underline">Login here</Link>
        </div>
      </div>
    </div>
  );
}