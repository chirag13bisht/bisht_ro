import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto';

export default function DashboardPage() {
  const [amcList, setAmcList] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [cashflow, setCashflow] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [amcSnap, compSnap, cashSnap] = await Promise.all([
      getDocs(collection(db, 'customers')),
      getDocs(collection(db, 'complaints')),
      getDocs(collection(db, 'cashflow'))
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const amcData = amcSnap.docs.map(doc => {
      const data = doc.data();
      let endDate;

      if (data.amcEnd?.toDate) {
        endDate = data.amcEnd.toDate();
      } else if (typeof data.amcEnd === 'string') {
        endDate = new Date(data.amcEnd);
      }

      if (endDate instanceof Date && !isNaN(endDate)) {
        endDate.setHours(0, 0, 0, 0);
      }

      return {
        ...data,
        amcActive: endDate && endDate >= today
      };
    });

    setAmcList(amcData);
    setComplaints(compSnap.docs.map(doc => doc.data()));
    setCashflow(cashSnap.docs.map(doc => doc.data()));
  };

  // Summary Metrics
  const totalAMCs = amcList.length;
  const activeAMCs = amcList.filter(c => c.amcActive).length;
  const pendingComplaints = complaints.filter(c => c.status?.toLowerCase() !== 'completed').length;
  const totalProfit = cashflow.reduce((acc, e) => e.type === 'credit' ? acc + e.amount : acc - e.amount, 0);

  const totalAmcRevenue = cashflow
    .filter(e => e.category === 'amc')
    .reduce((acc, e) => acc + e.amount, 0);

  const totalComplaintRevenue = cashflow
    .filter(e => e.category === 'complaint')
    .reduce((acc, e) => acc + e.amount, 0);

  // Monthly AMC Signups
  const monthlyAmcCounts = Array(12).fill(0);
  amcList.forEach(c => {
    if (c.amcStart) {
      const d = new Date(c.amcStart);
      monthlyAmcCounts[d.getMonth()]++;
    }
  });

  // Monthly Revenue
  const monthlyRevenue = Array(12).fill(0);
  cashflow.forEach(e => {
    const d = new Date(e.date?.toDate?.() || e.date);
    if (!isNaN(d)) {
      const month = d.getMonth();
      monthlyRevenue[month] += (e.type === 'credit' ? e.amount : -e.amount);
    }
  });

  // Complaint Status Pie
  const complaintStatus = {
    completed: complaints.filter(c => c.status?.toLowerCase() === 'completed').length,
    pending: complaints.filter(c => c.status?.toLowerCase() !== 'completed').length
  };

  // Top 5 Stock Items Used
  const itemFrequency = {};
  complaints.forEach(complaint => {
    const items = complaint.itemsUsed?.split(',') || [];
    items.forEach(item => {
      const trimmed = item.trim().toLowerCase();
      if (trimmed) {
        itemFrequency[trimmed] = (itemFrequency[trimmed] || 0) + 1;
      }
    });
  });

  const topStockItems = Object.entries(itemFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Top 5 Paying Customers
  const customerTotals = {};
  cashflow.forEach(entry => {
    if (entry.type === 'credit') {
      const match = entry.description?.match(/from\s(.+)$/i);
      const name = match?.[1]?.trim();
      if (name) {
        customerTotals[name] = (customerTotals[name] || 0) + entry.amount;
      }
    }
  });

  const topCustomers = Object.entries(customerTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Chart Data
  const barData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
      {
        label: 'AMC Signups',
        backgroundColor: '#60a5fa',
        data: monthlyAmcCounts
      },
      {
        label: 'Monthly Profit',
        backgroundColor: '#34d399',
        data: monthlyRevenue
      }
    ]
  };

  const pieData = {
    labels: ['Completed', 'Pending'],
    datasets: [
      {
        data: [complaintStatus.completed, complaintStatus.pending],
        backgroundColor: ['#34d399', '#f87171']
      }
    ]
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-blue-700 text-center mb-8">📊 Admin Dashboard</h2>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-blue-100 text-blue-800 p-4 rounded shadow font-semibold text-center">
          Total AMCs: {totalAMCs}
        </div>
        <div className="bg-green-100 text-green-800 p-4 rounded shadow font-semibold text-center">
          Active AMCs: {activeAMCs}
        </div>
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded shadow font-semibold text-center">
          Pending Complaints: {pendingComplaints}
        </div>
        <div className={`p-4 rounded shadow text-center font-semibold ${totalProfit >= 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-700'}`}>
          Profit: ₹{totalProfit}
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid sm:grid-cols-2 gap-6 mb-10">
        <div className="bg-purple-100 text-purple-800 p-4 rounded shadow font-semibold text-center">
          AMC Revenue: ₹{totalAmcRevenue}
        </div>
        <div className="bg-pink-100 text-pink-800 p-4 rounded shadow font-semibold text-center">
          Complaint Revenue: ₹{totalComplaintRevenue}
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white rounded shadow p-4">
          <h3 className="text-lg font-semibold mb-2 text-center">📈 AMC Signups & Revenue</h3>
          <Bar data={barData} />
        </div>
        <div className="bg-white rounded shadow p-4">
          <h3 className="text-lg font-semibold mb-2 text-center">🛠️ Complaint Status</h3>
          <Pie data={pieData} />
        </div>
      </div>

      {/* Top 5 Sections */}
      <div className="grid md:grid-cols-2 gap-6 mt-10">
        <div className="bg-white rounded shadow p-4">
          <h3 className="text-lg font-semibold mb-2 text-center">Top 5 Stock Items Used</h3>
          <ul className="space-y-2">
            {topStockItems.map(([item, count], index) => (
              <li key={index} className="flex justify-between text-sm">
                <span>{item}</span>
                <span className="font-semibold">{count} uses</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded shadow p-4">
          <h3 className="text-lg font-semibold mb-2 text-center">Top 5 Paying Customers</h3>
          <ul className="space-y-2">
            {topCustomers.map(([name, amount], index) => (
              <li key={index} className="flex justify-between text-sm">
                <span>{name}</span>
                <span className="font-semibold">₹{amount}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
