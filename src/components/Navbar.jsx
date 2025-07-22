// src/components/Navbar.jsx
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import LogoutButton from './LogoutButton';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  if (!isLoggedIn) return null; // ⛔ Don't show navbar if not logged in

  return (
    <nav className="bg-blue-600 text-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/dashboard"><h1 className="text-2xl font-bold tracking-wide">Bisht RO</h1></Link> 

        {/* Desktop Links */}
        <div className="hidden md:flex space-x-6 text-sm font-medium">
          <Link to="/add-customer" className="hover:text-yellow-300 transition">Add Customer</Link>
          <Link to="/customers" className="hover:text-yellow-300 transition">Customer List</Link>
          <Link to="/stock" className="hover:text-yellow-300 transition">Stock</Link>
          <Link to="/complaints" className="hover:text-yellow-300 transition">Complaints</Link>
          <Link to="/complaints/new" className="hover:text-yellow-300 transition">Add Complaint</Link>
          <Link to="/CashFlow" className="hover:text-yellow-300 transition">CashFlow</Link>
          <LogoutButton />
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Menu"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden px-4 pb-4 space-y-2 text-sm font-medium">
          <Link to="/add-customer" className="block hover:text-yellow-300" onClick={() => setIsOpen(false)}>Add Customer</Link>
          <Link to="/customers" className="block hover:text-yellow-300" onClick={() => setIsOpen(false)}>Customer List</Link>
          <Link to="/stock" className="block hover:text-yellow-300" onClick={() => setIsOpen(false)}>Stock</Link>
          <Link to="/complaints" className="block hover:text-yellow-300" onClick={() => setIsOpen(false)}>Complaints</Link>
          <Link to="/complaints/new" className="block hover:text-yellow-300" onClick={() => setIsOpen(false)}>Add Complaint</Link>
          <Link to="/CashFlow" className="block hover:text-yellow-300" onClick={() => setIsOpen(false)}>CashFlow</Link>
          <LogoutButton />
        </div>
      )}
    </nav>
  );
}
