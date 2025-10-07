import React, { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';
import { HarnessData } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface FilterOption {
  value: string;
  checked: boolean;
}

interface FilterState {
  [key: string]: FilterOption[];
}

interface HarnessFiltersProps {
  data: HarnessData[];
  onFilterChange: (filteredData: HarnessData[]) => void;
}

const EXCLUDED_COLUMNS = ['diagram', 'harnessimage', 'description', 'updatedby', 'updatedat'];

export default function HarnessFilters({ data, onFilterChange }: HarnessFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});
  const [selectedColumn, setSelectedColumn] = useState<string>('vehicletype');

  useEffect(() => {
    if (data && data.length > 0) {
      const initialFilters: FilterState = {};
      Object.keys(data[0] || {}).forEach(key => {
        if (!EXCLUDED_COLUMNS.includes(key)) {
          const uniqueValues = Array.from(new Set(data.map(item => String(item[key as keyof HarnessData]))))
            .sort((a, b) => a.localeCompare(b));
          initialFilters[key] = uniqueValues.map(value => ({
            value,
            checked: false
          }));
        }
      });
      setFilters(initialFilters);
    }
  }, [data]);

  useEffect(() => {
    if (data && data.length > 0) {
      const filteredData = data.filter(item => {
        return Object.entries(filters).every(([key, options]) => {
          const selectedValues = options.filter(opt => opt.checked).map(opt => opt.value);
          return selectedValues.length === 0 || selectedValues.includes(String(item[key as keyof HarnessData]));
        });
      });
      onFilterChange(filteredData);
    }
  }, [filters, data, onFilterChange]);

  const handleCheckboxChange = (column: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: prev[column].map(option => 
        option.value === value ? { ...option, checked: !option.checked } : option
      )
    }));
  };

  const clearFilters = (column: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: prev[column].map(option => ({ ...option, checked: false }))
    }));
  };

  const getChartData = (): ChartData<'pie'> => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderWidth: 1
        }]
      };
    }

    const columnData = data.reduce((acc, item) => {
      const value = String(item[selectedColumn as keyof HarnessData]);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF9F40'
    ];

    return {
      labels: Object.keys(columnData),
      datasets: [{
        data: Object.values(columnData),
        backgroundColor: colors.slice(0, Object.keys(columnData).length),
        borderWidth: 1
      }]
    };
  };

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
        {showFilters && (
          <select
            value={selectedColumn}
            onChange={(e) => setSelectedColumn(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {Object.keys(filters).map(column => (
              <option key={column} value={column}>
                {column.charAt(0).toUpperCase() + column.slice(1)}
              </option>
            ))}
          </select>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {Object.entries(filters).map(([column, options]) => (
              <div key={column} className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-700">
                    {column.charAt(0).toUpperCase() + column.slice(1)}
                  </h3>
                  <button
                    onClick={() => clearFilters(column)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {options.map(option => (
                    <label key={option.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={option.checked}
                        onChange={() => handleCheckboxChange(column, option.value)}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-600">{option.value}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-medium text-gray-700 mb-4">
              {selectedColumn.charAt(0).toUpperCase() + selectedColumn.slice(1)} Distribution
            </h3>
            <div className="w-full h-64">
              <Pie
                data={getChartData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        boxWidth: 12,
                        padding: 15
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}