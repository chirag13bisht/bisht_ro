import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { ShoppingCart, Menu, X } from 'lucide-react'; // Import Icons
import { useState } from 'react';

export default function Navbar({ user }) {
  const auth = getAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false); // State for mobile menu

  const handleLogout = async () => {
    await signOut(auth);
    setIsOpen(false); // Close menu on logout
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* 1. Logo */}
          <Link to="/" className="text-2xl font-bold tracking-wide flex items-center gap-2">
            💧 Bisht RO
          </Link>

          {/* 2. Desktop Menu (Hidden on Mobile) */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/shop" className="hover:text-blue-200 font-medium transition">Shop</Link>
            <Link to="/complaint" className="hover:text-blue-200 font-medium transition">Book Service</Link>
            
            {user ? (
              <>
                <Link to="/profile" className="flex items-center gap-2 hover:bg-blue-700 px-3 py-1 rounded-lg transition">
                  👤 <span className="text-sm font-medium">{user.name?.split(' ')[0]}</span>
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="bg-white text-blue-600 px-5 py-2 rounded-lg font-bold hover:bg-gray-100 transition shadow-sm">
                Login
              </Link>
            )}
          </div>

          {/* 3. Mobile Menu Button (Visible only on Mobile) */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-white focus:outline-none">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Mobile Dropdown Menu */}
      {isOpen && (
        <div className="md:hidden bg-blue-700 border-t border-blue-500 animate-fade-in">
          <div className="px-4 pt-4 pb-6 space-y-3 flex flex-col">
            <Link 
              to="/shop" 
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md hover:bg-blue-600 text-lg"
            >
              Shop
            </Link>
            <Link 
              to="/complaint" 
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md hover:bg-blue-600 text-lg"
            >
              Book Service
            </Link>
            
            {user ? (
              <>
                <Link 
                  to="/profile" 
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md hover:bg-blue-600 text-lg font-bold"
                >
                  👤 My Profile
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left bg-red-500 px-3 py-3 rounded-lg font-bold shadow-md"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                onClick={() => setIsOpen(false)}
                className="block text-center bg-white text-blue-600 px-3 py-3 rounded-lg font-bold shadow-md"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}