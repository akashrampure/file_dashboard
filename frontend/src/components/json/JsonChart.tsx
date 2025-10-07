import React from 'react';

interface JsonChartProps {
  data: any;
}

const JsonChart: React.FC<JsonChartProps> = ({ data }) => {
  const countNestedObjects = (obj: any): number => {
    if (typeof obj !== 'object' || obj === null) {
      return 0;
    }
    
    let count = 1; // Count current object
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        count += countNestedObjects(obj[key]);
      }
    }
    return count;
  };

  const countPrimitiveValues = (obj: any): number => {
    if (typeof obj !== 'object' || obj === null) {
      return 1;
    }
    
    let count = 0;
    for (const key in obj) {
      if (typeof obj[key] !== 'object' || obj[key] === null) {
        count++;
      } else {
        count += countPrimitiveValues(obj[key]);
      }
    }
    return count;
  };

  const objectCount = countNestedObjects(data);
  const valueCount = countPrimitiveValues(data);
  const totalCount = objectCount + valueCount;

  const objectPercentage = (objectCount / totalCount) * 100;
  const valuePercentage = (valueCount / totalCount) * 100;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">JSON Structure Overview</h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Objects</span>
            <span className="text-sm text-gray-500">{objectCount}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full"
              style={{ width: `${objectPercentage}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Values</span>
            <span className="text-sm text-gray-500">{valueCount}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-pink-500 h-2 rounded-full"
              style={{ width: `${valuePercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonChart;