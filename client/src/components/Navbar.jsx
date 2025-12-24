import { Link } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';

export default function Navbar({ user }) {
  const handleLogout = () => {
    signOut(getAuth());
    window.location.reload();
  };

  return (
    <nav className="bg-blue-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">

          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl tracking-wide">💧 Bisht RO Services</span>
          </Link>

          <div className="hidden md:flex space-x-8 font-medium">
            <Link to="/" className="hover:text-blue-200 transition">Shop Products</Link>
            <Link to="/complaint" className="hover:text-blue-200 transition">Book Service</Link>
          </div>

          <div>
            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/profile" className="flex items-center gap-2 hover:bg-blue-800 px-3 py-1 rounded-lg transition">
                  <span className="text-sm hidden sm:block font-medium">👤 {user.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-2 rounded-lg font-bold transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="bg-white text-blue-700 px-5 py-2 rounded-full font-bold hover:bg-gray-100 transition shadow-sm">
                Login
              </Link>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}