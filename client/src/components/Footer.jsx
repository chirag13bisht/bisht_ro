import { Link } from 'react-router-dom';
import { Phone, MapPin, Mail, ArrowRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Column 1: Brand Info */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">💧 Bisht RO Services</h3>
            <p className="text-sm opacity-80 leading-relaxed">
              Providing trusted RO repair, maintenance, and installation services in Ghaziabad and Delhi. Pure water, pure health.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-blue-400 transition flex items-center gap-2">
                  <ArrowRight size={16} /> Shop Filters
                </Link>
              </li>
              <li>
                <Link to="/complaint" className="hover:text-blue-400 transition flex items-center gap-2">
                  <ArrowRight size={16} /> Book a Repair
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-blue-400 transition flex items-center gap-2">
                  <ArrowRight size={16} /> My Profile (AMC)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="text-blue-500 mt-1" size={20} />
                <span>
                  C-42/G-7, Shalimar Garden Extn-2,<br />
                  Ghaziabad, Uttar Pradesh
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-blue-500" size={20} />
                <a href="tel:+918920789470" className="hover:text-white transition">
                  +91 97161 52713
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-blue-500" size={20} />
                <a href="mailto:bishtroservices@gmail.com" className="hover:text-white transition">
                  drishtienterprises1005@gmail.com
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Bisht RO Services. All rights reserved.</p>
        </div>

      </div>
    </footer>
  );
}