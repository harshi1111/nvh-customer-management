import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportPDFButtonProps {
  tableId: string;
  fileName?: string;
}

const ExportPDFButton: React.FC<ExportPDFButtonProps> = ({ 
  tableId, 
  fileName = 'financial-report.pdf' 
}) => {
  const exportToPDF = async () => {
    const input = document.getElementById(tableId);
    if (!input) {
      alert('Report table not found!');
      return;
    }

    try {
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF');
    }
  };

  return (
    <button
      onClick={exportToPDF}
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-4"
    >
      📄 Export PDF
    </button>
  );
};

export default ExportPDFButton;