import React from 'react';

interface JsonListProps {
  data: any;
  searchTerm?: string;
}

const JsonList: React.FC<JsonListProps> = ({ data, searchTerm = '' }) => {
  const matchesSearch = (key: string, value: any, path: string): boolean => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      path.toLowerCase().includes(searchLower) ||
      JSON.stringify(value).toLowerCase().includes(searchLower)
    );
  };

  const renderValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (typeof value === 'string') return value.trim() === '' ? '-' : `"${value}"`;
    return String(value);
  };

  const renderListItems = (obj: any, parentKey = '') => {
    return Object.entries(obj).map(([key, value]) => {
      const fullKey = parentKey ? `${parentKey}.${key}` : key;
      const matches = matchesSearch(key, value, fullKey);

      if (!matches && searchTerm) return null;
      
      if (typeof value === 'object' && value !== null) {
        return (
          <div key={fullKey} className={`mb-4 ${searchTerm && matches ? 'bg-yellow-50 p-2 rounded' : ''}`}>
            <h3 className="text-lg font-medium text-purple-700 mb-2">{key}</h3>
            <div className="pl-4 border-l-2 border-purple-200">
              {renderListItems(value, fullKey)}
            </div>
          </div>
        );
      }

      return (
        <div 
          key={fullKey} 
          className={`flex items-center py-2 hover:bg-purple-50 rounded px-2 ${
            searchTerm && matches ? 'bg-yellow-50' : ''
          }`}
        >
          <span className="font-medium text-gray-700 min-w-[200px]">{key}:</span>
          <span className="text-gray-600">{renderValue(value)}</span>
        </div>
      );
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {renderListItems(data)}
    </div>
  );
};

export default JsonList;