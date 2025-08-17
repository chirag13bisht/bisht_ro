import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

export default function BookletPage() {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const snapshot = await getDocs(collection(db, "invoices"));
        let allInvoices = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.invoice_no) {
            allInvoices.push({
              ...data,
              id: docSnap.id,
            });
          }
        });

        // Sort invoices by invoice_no descending
        allInvoices.sort((a, b) => b.invoice_no - a.invoice_no);
        setInvoices(allInvoices);
      } catch (error) {
        console.error("Error fetching invoices:", error);
      }
    };

    fetchInvoices();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Invoice Booklet</h2>

      {invoices.length === 0 ? (
        <p className="text-gray-500">No invoices found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white shadow-md border border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:shadow-lg hover:scale-105 transition-transform duration-200"
              onClick={() => setSelectedInvoice(invoice)}
            >
              <span className="text-lg font-semibold text-blue-600">
                #{invoice.invoice_no}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Modal for details */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg relative">
            <button
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-800"
              onClick={() => setSelectedInvoice(null)}
            >
              ✕
            </button>
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              Invoice #{selectedInvoice.invoice_no}
            </h3>
            <div className="space-y-2 text-gray-700">
              {selectedInvoice.name && (
                <p>
                  <strong>Name:</strong> {selectedInvoice.name}
                </p>
              )}
              {selectedInvoice.address && (
                <p>
                  <strong>Address:</strong> {selectedInvoice.address}
                </p>
              )}
              {selectedInvoice.phone && (
                <p>
                  <strong>Phone:</strong> {selectedInvoice.phone}
                </p>
              )}
              {selectedInvoice.type && (
                <p>
                  <strong>Type:</strong> {selectedInvoice.type}
                </p>
              )}
              {selectedInvoice.amount && (
                <p>
                  <strong>Amount:</strong> ₹{selectedInvoice.amount}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
