import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from './firebase/config';
import { doc, getDoc } from 'firebase/firestore';

import Navbar from './components/Navbar';
import Shop from './pages/Shop';
import Complaint from './pages/Complaint';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import WhatsAppButton from './components/WhatsAppButton';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // New Loading State
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Fetch extended profile (Name, Address) from Firestore
        const docRef = doc(db, "users", currentUser.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            // Merge Auth data (email) with Firestore data (name, address)
            setUser({ uid: currentUser.uid, email: currentUser.email, ...docSnap.data() });
          } else {
            // Fallback if firestore doc is missing
            setUser(currentUser);
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false); // Stop loading once we know the status
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-blue-600">Loading...</div>;
  }

  return (
    <BrowserRouter>
      {/* Navbar gets the FULL user object now */}
      <Navbar user={user} />
      
      <div className="bg-gray-50 min-h-screen">
        <Routes>
          {/* ✅ PUBLIC ROUTES (Accessible to everyone) */}
          <Route path="/" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* 🔒 PROTECTED ROUTE (Only for logged in users) */}
          <Route path="/complaint" element={user ? <Complaint user={user} /> : <Login />} />
          <Route path="/profile" element={user ? <Profile user={user} /> : <Login />} />
        </Routes>
        <WhatsAppButton/>
      </div>
    </BrowserRouter>
  );
}