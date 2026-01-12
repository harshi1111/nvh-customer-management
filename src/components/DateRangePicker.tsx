import React from 'react';

interface DateRangePickerProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  onGenerate: () => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onGenerate,
}) => {
  return (
    <div className="flex items-center space-x-4 mb-6">
      <div>
        <label className="block text-sm font-medium">From Date</label>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => onFromDateChange(e.target.value)}
          className="border p-2 rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">To Date</label>
        <input
          type="date"
          value={toDate}
          onChange={(e) => onToDateChange(e.target.value)}
          className="border p-2 rounded"
        />
      </div>
      <button
        onClick={onGenerate}
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Generate Report
      </button>
    </div>
  );
};

export default DateRangePicker;