import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';

import Navbar from './components/Navbar';
import Amcform from './components/amcform';
import Amclist from './components/amclist';
import StockOverview from './Pages/StockOverview';
import AddStockItem from './components/AddStockItem';
import StockDetail from './Pages/StockDetail';
import UpdateStockQuantity from './components/UpdateStockQuantity';
import UpdateStockPrice from './components/UpdateStockPrice';
import ComplaintForm from './components/ComplaintForm';
import { ComplaintList } from './components/ComplaintList';
import UpdateComplaint from './Pages/UpdateComplaint';
import CashFlow from './Pages/CashFlow';

import LoginPage from './Pages/LoginPage';
import ResetPassword from './Pages/ResetPassword';
import DashboardPage from './Pages/Dashboard';
import CustomerDetails from './Pages/CustomerDetails';
import BillForm from './components/BillForm'
import PendingLedgerPage from './Pages/PendingLedgerPage';
import BookletPage from './Pages/BookletPage';
import { Toaster } from "react-hot-toast";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null); // null = loading

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe(); // cleanup
  }, []);

  const ProtectedRoute = ({ element }) => {
    return isLoggedIn ? element : <Navigate to="/login" />;
  };

  if (isLoggedIn === null) {
    return <div className="text-center py-20 text-xl">🔄 Checking login...</div>;
  }

  return (
    <Router>
      {isLoggedIn && <Navbar />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute element={<DashboardPage />} />} />
        <Route path="/ledger" element={<ProtectedRoute element={<PendingLedgerPage />} />} />
        <Route path="/billform" element={<ProtectedRoute element={<BillForm />} />} />
        <Route path="/add-customer" element={<ProtectedRoute element={<Amcform />} />} />
        <Route path="/customers" element={<ProtectedRoute element={<Amclist />} />} />
        <Route path="/customer/:id" element={<CustomerDetails />} />
        <Route path="/stock" element={<ProtectedRoute element={<StockOverview />} />} />
        <Route path="/stock/add" element={<ProtectedRoute element={<AddStockItem />} />} />
        <Route path="/stock/:itemId" element={<ProtectedRoute element={<StockDetail />} />} />
        <Route path="/stock/update/:itemId" element={<ProtectedRoute element={<UpdateStockQuantity />} />} />
        <Route path="/stock/update-price/:itemId" element={<ProtectedRoute element={<UpdateStockPrice />} />} />
        <Route path="/complaints" element={<ProtectedRoute element={<ComplaintList />} />} />
        <Route path="/complaints/new" element={<ProtectedRoute element={<ComplaintForm />} />} />
        <Route path="/complaints/update/:id" element={<ProtectedRoute element={<UpdateComplaint />} />} />
        <Route path="/CashFlow" element={<ProtectedRoute element={<CashFlow />} />} />
        <Route path="/Booklet" element={<ProtectedRoute element={<BookletPage />} />} />


        <Route path="*" element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} />} />
      </Routes>
      <Toaster position="top-center" reverseOrder={false} />
    </Router>
  );
}

export default App;
