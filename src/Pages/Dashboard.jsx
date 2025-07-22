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
    const amcSnap = await getDocs(collection(db, 'customers'));
    setAmcList(amcSnap.docs.map(doc => doc.data()));

    const compSnap = await getDocs(collection(db, 'complaints'));
    setComplaints(compSnap.docs.map(doc => doc.data()));

    const cashSnap = await getDocs(collection(db, 'cashflow'));
    setCashflow(cashSnap.docs.map(doc => doc.data()));
  };

  const totalAMCs = amcList.length;
  const activeAMCs = amcList.filter(c => c.status?.toLowerCase() === 'active').length;
  const pendingComplaints = complaints.filter(c => c.status?.toLowerCase() !== 'completed').length;
  const totalProfit = cashflow.reduce((acc, e) => e.type === 'credit' ? acc + e.amount : acc - e.amount, 0);

  const monthlyCounts = Array(12).fill(0);
  amcList.forEach(c => {
    const date = new Date(c.dateCreated?.toDate?.() || c.dateCreated);
    monthlyCounts[date.getMonth()]++;
  });

  const barData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
      {
        label: 'AMC Signups',
        backgroundColor: '#60a5fa',
        data: monthlyCounts
      }
    ]
  };

  const complaintStatus = {
    completed: complaints.filter(c => c.status === 'completed').length,
    pending: complaints.filter(c => c.status !== 'completed').length
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

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded shadow p-4">
          <h3 className="text-lg font-semibold mb-2 text-center">Monthly AMC Signups</h3>
          <Bar data={barData} />
        </div>
        <div className="bg-white rounded shadow p-4">
          <h3 className="text-lg font-semibold mb-2 text-center">Complaint Status</h3>
          <Pie data={pieData} />
        </div>
      </div>
    </div>
  );
}
