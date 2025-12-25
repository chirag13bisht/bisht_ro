import { Link } from 'react-router-dom';
import { ShieldCheck, Clock, PenTool, Star, Wrench, Droplets, Phone } from 'lucide-react';

export default function Home() {
  return (
    <div className="bg-white">
      
      {/* 1. HERO SECTION */}
      <div className="bg-blue-700 text-white pt-20 pb-24 px-4 relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <span className="bg-blue-600 text-blue-100 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider mb-4 inline-block border border-blue-500">
            #1 RO Service in Ghaziabad
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            Pure Water.<br/> Peace of Mind.
          </h1>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto font-light">
            Expert RO repair, genuine spare parts, and annual maintenance plans (AMC) at your doorstep.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/complaint" 
              className="bg-white text-blue-700 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-xl transform hover:-translate-y-1"
            >
              Book Repair Now
            </Link>
            <Link 
              to="/shop" 
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-blue-700 transition"
            >
              View Spare Parts
            </Link>
          </div>
        </div>
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 opacity-20 rounded-full -translate-x-1/2 translate-y-1/2 blur-2xl"></div>
      </div>

      {/* 2. SERVICES SECTION */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">Our Services</h2>
          <p className="text-gray-500 mt-2">Everything your water purifier needs.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-50 p-8 rounded-2xl hover:shadow-lg transition cursor-pointer group">
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <Wrench size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">Repair & Service</h3>
            <p className="text-gray-500">Filters clogged? Motor noise? Water leakage? Our experts fix it all within 2 hours.</p>
          </div>
          <div className="bg-gray-50 p-8 rounded-2xl hover:shadow-lg transition cursor-pointer group">
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">Annual Maintenance (AMC)</h3>
            <p className="text-gray-500">Get unlimited free visits and filter changes for a whole year. Plans start at ₹2500.</p>
          </div>
          <div className="bg-gray-50 p-8 rounded-2xl hover:shadow-lg transition cursor-pointer group">
            <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <Droplets size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">Genuine Spares</h3>
            <p className="text-gray-500">We sell 100% original membranes, pumps, and filters compatible with all brands.</p>
          </div>
        </div>
      </div>

      {/* 3. WHY CHOOSE US (Banner) */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Why Trusts Us?</h2>
            <p className="text-gray-400">Over 500+ happy customers in Ghaziabad & Delhi.</p>
          </div>
          <div className="flex gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-500 mb-1">2k+</div>
              <div className="text-sm text-gray-400">Services Done</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-500 mb-1">4.8</div>
              <div className="text-sm text-gray-400">Star Rating</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-500 mb-1">60m</div>
              <div className="text-sm text-gray-400">Response Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. CTA SECTION */}
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to fix your RO?</h2>
        <p className="text-gray-500 mb-8">Don't drink unsafe water. Book a technician visit today.</p>
        <div className="flex justify-center gap-4">
           <Link to="/complaint" className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg">
             <PenTool size={20} /> Book Online
           </Link>
           <a href="tel:+919716152713" className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
             <Phone size={20} /> Call Now
           </a>
        </div>
      </div>

    </div>
  );
}