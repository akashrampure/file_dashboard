import React from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface JsonTreeProps {
  data: any;
  searchTerm?: string;
}

const JsonTree: React.FC<JsonTreeProps> = ({ data, searchTerm = '' }) => {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  const toggleNode = (path: string) => {
    const newExpanded = new Set(expanded);
    if (expanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpanded(newExpanded);
  };

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
    if (typeof value === 'object') return '';
    if (typeof value === 'string') return value.trim() === '' ? '-' : `"${value}"`;
    return String(value);
  };

  const renderTreeNode = (value: any, key: string = '', path: string = '', level: number = 0) => {
    const isObject = typeof value === 'object' && value !== null;
    const isExpanded = expanded.has(path);
    const hasChildren = isObject && Object.keys(value).length > 0;
    const matches = matchesSearch(key, value, path);

    if (!matches && searchTerm) return null;

    return (
      <div key={path} className={searchTerm && matches ? 'bg-yellow-50' : ''}>
        <div
          className="flex items-center py-1 px-4 hover:bg-purple-50 cursor-pointer"
          style={{ marginLeft: `${level * 20}px` }}
          onClick={() => hasChildren && toggleNode(path)}
        >
          {hasChildren && (
            <span className="mr-1">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </span>
          )}
          {!hasChildren && <span className="w-5" />}
          <span className="font-medium text-gray-700">{key}</span>
          {!isObject && (
            <>
              <span className="mx-2 text-gray-400">:</span>
              <span className="text-purple-600">{renderValue(value)}</span>
            </>
          )}
        </div>
        
        {isObject && isExpanded && (
          <div>
            {Array.isArray(value) ? (
              value.map((item, index) => {
                const newPath = path ? `${path}[${index}]` : `[${index}]`;
                return renderTreeNode(item, `[${index}]`, newPath, level + 1);
              })
            ) : (
              Object.entries(value).map(([childKey, childValue]) => {
                const newPath = path ? `${path}.${childKey}` : childKey;
                return renderTreeNode(childValue, childKey, newPath, level + 1);
              })
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {Object.entries(data).map(([key, value]) => 
        renderTreeNode(value, key, key, 0)
      )}
    </div>
  );
};

export default JsonTree;