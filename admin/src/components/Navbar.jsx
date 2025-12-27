import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, Users, Wrench, Package, IndianRupee } from 'lucide-react';
import LogoutButton from './LogoutButton';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => setIsLoggedIn(!!user));
    return () => unsubscribe();
  }, []);

  // Close mobile menu completely when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  if (!isLoggedIn) return null;

  return (
    <nav className="bg-blue-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          
          {/* LOGO */}
          <Link to="/dashboard" className="flex items-center gap-2">
             <div className="bg-white text-blue-700 font-bold p-1 rounded">RO</div>
             <h1 className="text-xl font-bold tracking-wide">Bisht Admin</h1>
          </Link>

          {/* 🖥️ DESKTOP MENU (Hover Dropdowns) */}
          <div className="hidden md:flex items-center space-x-2">
            
            <NavDropdown title="Customers" icon={<Users size={18}/>}>
              <Link to="/add-customer" className="block px-4 py-2 hover:bg-gray-100 text-gray-800">Add Customer</Link>
              <Link to="/customers" className="block px-4 py-2 hover:bg-gray-100 text-gray-800">Customer List</Link>
            </NavDropdown>

            <NavDropdown title="Service" icon={<Wrench size={18}/>}>
              <Link to="/complaints/new" className="block px-4 py-2 hover:bg-gray-100 text-gray-800">New Complaint</Link>
              <Link to="/complaints" className="block px-4 py-2 hover:bg-gray-100 text-gray-800">Complaint History</Link>
            </NavDropdown>

            <NavDropdown title="Inventory" icon={<Package size={18}/>}>
              <Link to="/stock" className="block px-4 py-2 hover:bg-gray-100 text-gray-800">View Stock</Link>
              <Link to="/manageproducts" className="block px-4 py-2 hover:bg-gray-100 text-gray-800">Manage Products</Link>
            </NavDropdown>

            <NavDropdown title="Finance" icon={<IndianRupee size={18}/>}>
              <Link to="/CashFlow" className="block px-4 py-2 hover:bg-gray-100 text-gray-800">Daily CashFlow</Link>
              <Link to="/ledger" className="block px-4 py-2 hover:bg-gray-100 text-gray-800">Ledger</Link>
              <Link to="/billform" className="block px-4 py-2 hover:bg-gray-100 text-gray-800">Generate Bill</Link>
              <Link to="/Booklet" className="block px-4 py-2 hover:bg-gray-100 text-gray-800">Booklet</Link>
            </NavDropdown>

            <div className="border-l border-blue-500 pl-4 ml-2">
              <LogoutButton />
            </div>
          </div>

          {/* 📱 MOBILE MENU TOGGLE */}
          <button className="md:hidden p-2 focus:outline-none" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* 📱 MOBILE MENU CONTENT (Collapsible Accordions) */}
      {isOpen && (
        <div className="md:hidden bg-blue-800 border-t border-blue-600 max-h-[85vh] overflow-y-auto animate-fade-in">
          <div className="px-2 py-2 space-y-1">
            
            {/* 1. Customers Accordion */}
            <MobileGroup title="Customers" icon={<Users size={18}/>}>
              <Link to="/add-customer" className="mobile-link">Add Customer</Link>
              <Link to="/customers" className="mobile-link">Customer List</Link>
            </MobileGroup>

            {/* 2. Service Accordion */}
            <MobileGroup title="Service" icon={<Wrench size={18}/>}>
              <Link to="/complaints/new" className="mobile-link">New Complaint</Link>
              <Link to="/complaints" className="mobile-link">Complaint History</Link>
            </MobileGroup>

            {/* 3. Inventory Accordion */}
            <MobileGroup title="Inventory" icon={<Package size={18}/>}>
              <Link to="/stock" className="mobile-link">View Stock</Link>
              <Link to="/manageproducts" className="mobile-link">Manage Products</Link>
            </MobileGroup>

            {/* 4. Finance Accordion */}
            <MobileGroup title="Finance" icon={<IndianRupee size={18}/>}>
              <Link to="/CashFlow" className="mobile-link">Daily CashFlow</Link>
              <Link to="/ledger" className="mobile-link">Ledger</Link>
              <Link to="/billform" className="mobile-link">Generate Bill</Link>
              <Link to="/Booklet" className="mobile-link">Booklet</Link>
            </MobileGroup>

            <div className="pt-4 px-2">
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

// ------------------------------------------------
// 🧩 HELPER COMPONENTS
// ------------------------------------------------

// 1. Desktop Dropdown (Hover)
function NavDropdown({ title, icon, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="flex items-center gap-1 px-3 py-2 rounded hover:bg-blue-600 transition font-medium text-sm">
        {icon}
        <span>{title}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}/>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-0 w-48 bg-white rounded-md shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1">
          {children}
        </div>
      )}
    </div>
  );
}

// 2. Mobile Accordion Group (Click to Expand)
function MobileGroup({ title, icon, children }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-lg overflow-hidden">
      {/* Header Button */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-3 transition-colors ${isExpanded ? 'bg-blue-900 text-white' : 'text-blue-100 hover:bg-blue-700'}`}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-semibold">{title}</span>
        </div>
        <ChevronDown 
          size={18} 
          className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Collapsible Content */}
      <div 
        className={`bg-blue-900/50 overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-col pl-10 pr-4 py-2 space-y-2 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}