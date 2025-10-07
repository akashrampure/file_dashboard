import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Search, CheckSquare, Square, FilterX } from 'lucide-react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ColumnFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  columnName: string;
  uniqueValues: { value: string; count: number }[];
  selectedValues: Set<string>;
  onApplyFilter: (newSelectedValues: Set<string>) => void;
  onClearFilter: () => void;
}

export default function ColumnFilterDialog({
  isOpen,
  onClose,
  columnName,
  uniqueValues,
  selectedValues,
  onApplyFilter,
  onClearFilter,
}: ColumnFilterDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelectedValues, setLocalSelectedValues] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalSelectedValues(new Set(selectedValues));
      setHasChanges(false);
      setSearchTerm('');
    }
  }, [isOpen, selectedValues]);

  const filteredValues = useMemo(() => {
    return uniqueValues.filter(({ value }) =>
      value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [uniqueValues, searchTerm]);

  const allFilteredSelected = useMemo(() => {
    return filteredValues.length > 0 &&
      filteredValues.every(({ value }) => localSelectedValues.has(value));
  }, [filteredValues, localSelectedValues]);

  const someFilteredSelected = useMemo(() => {
    return !allFilteredSelected &&
      filteredValues.some(({ value }) => localSelectedValues.has(value));
  }, [filteredValues, localSelectedValues, allFilteredSelected]);

  const handleSelectAll = useCallback(() => {
    setLocalSelectedValues(prev => {
      const newSelected = new Set(prev);
      filteredValues.forEach(({ value }) => newSelected.add(value));
      return newSelected;
    });
    setHasChanges(true);
  }, [filteredValues]);

  const handleDeselectAll = useCallback(() => {
    setLocalSelectedValues(prev => {
      const newSelected = new Set(prev);
      filteredValues.forEach(({ value }) => newSelected.delete(value));
      return newSelected;
    });
    setHasChanges(true);
  }, [filteredValues]);

  const handleToggleAll = useCallback(() => {
    if (allFilteredSelected) {
      handleDeselectAll();
    } else {
      handleSelectAll();
    }
  }, [allFilteredSelected, handleDeselectAll, handleSelectAll]);

  const handleValueToggle = useCallback((value: string) => {
    setLocalSelectedValues(prev => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
    setHasChanges(true);
  }, []);

  const handleApply = useCallback(() => {
    if (!hasChanges) {
      onClose();
      return;
    }

    onApplyFilter(localSelectedValues);
    onClose();
  }, [localSelectedValues, hasChanges, onApplyFilter, onClose]);

  const handleClearFilter = useCallback(() => {
    setLocalSelectedValues(new Set());
    setHasChanges(true);
    onClearFilter();
    onClose();
  }, [onClearFilter, onClose]);

  const getChartData = useCallback((): ChartData<'pie'> => {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF9F40'
    ];

    return {
      labels: filteredValues.map(item => item.value),
      datasets: [{
        data: filteredValues.map(item => item.count),
        backgroundColor: colors.slice(0, filteredValues.length),
        borderWidth: 1
      }]
    };
  }, [filteredValues]);

  const isFiltered = selectedValues.size !== uniqueValues.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-lg"
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            Filter by {columnName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search values..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-between">
              <button
                onClick={handleToggleAll}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                {allFilteredSelected ? (
                  <CheckSquare className="w-4 h-4" />
                ) : someFilteredSelected ? (
                  <CheckSquare className="w-4 h-4 text-purple-300" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                <span>{allFilteredSelected ? 'Deselect All' : 'Select All'}</span>
              </button>
              {isFiltered && (
                <button
                  onClick={handleClearFilter}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <FilterX className="w-4 h-4" />
                  <span>Clear Filter</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="max-h-48 overflow-y-auto border-t border-gray-200 pt-2">
                {filteredValues.map(({ value, count }) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={localSelectedValues.has(value)}
                      onChange={() => handleValueToggle(value)}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-600 flex-1">{value}</span>
                    <span className="text-xs text-gray-400">({count})</span>
                  </label>
                ))}
                {filteredValues.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No matching values found
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-full h-48">
                <Pie
                  data={getChartData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!hasChanges}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      </motion.div>
    </div>
  );
}
