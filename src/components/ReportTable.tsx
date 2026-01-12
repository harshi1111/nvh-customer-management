import React from 'react';

interface CustomerSummary {
  id: number;
  name: string;
  totalInvoices: number;
  totalAmount: number;
  paymentsReceived: number;
  pendingBalance: number;
}

interface ReportData {
  customers: CustomerSummary[];
  overallSummary: {
    totalCustomers: number;
    totalInvoices: number;
    totalAmount: number;
    totalPayments: number;
    totalPending: number;
  };
}

interface ReportTableProps {
  data: ReportData;
  tableId?: string; // Add this
}

const ReportTable: React.FC<ReportTableProps> = ({ data, tableId = "report-table" }) => {
  return (
    <div id={tableId}> {/* Add ID here */}
      <h2 className="text-xl font-semibold mb-4">Customer-wise Summary</h2>
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Customer Name</th>
            <th className="border p-2">Total Invoices</th>
            <th className="border p-2">Total Amount</th>
            <th className="border p-2">Payments Received</th>
            <th className="border p-2">Pending Balance</th>
          </tr>
        </thead>
        <tbody>
          {data.customers.map((customer) => (
            <tr key={customer.id}>
              <td className="border p-2">{customer.name}</td>
              <td className="border p-2">{customer.totalInvoices}</td>
              <td className="border p-2">₹{customer.totalAmount.toFixed(2)}</td>
              <td className="border p-2">₹{customer.paymentsReceived.toFixed(2)}</td>
              <td className="border p-2">₹{customer.pendingBalance.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-xl font-semibold mt-8 mb-4">Overall Summary</h2>
      <ul className="list-disc pl-5">
        <li>Total Customers: {data.overallSummary.totalCustomers}</li>
        <li>Total Invoices: {data.overallSummary.totalInvoices}</li>
        <li>Total Billed: ₹{data.overallSummary.totalAmount.toFixed(2)}</li>
        <li>Total Payments: ₹{data.overallSummary.totalPayments.toFixed(2)}</li>
        <li>Total Pending: ₹{data.overallSummary.totalPending.toFixed(2)}</li>
      </ul>
    </div>
  );
};

export default ReportTable;