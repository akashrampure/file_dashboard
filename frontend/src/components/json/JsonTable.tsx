import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  ChevronDownCircle, 
  ChevronUpCircle,
  Settings,
  Radio,
  Antenna,
  Gauge,
  Filter,
  ListFilter,
  Database,
  Component,
  Cpu,
  Binary,
  Code,
  AlertCircle
} from 'lucide-react';
import { ValueMapping } from './ValueMappingSettings';

interface JsonTableProps {
  data: any;
  level?: number;
  searchTerm?: string;
  parentKey?: string;
  valueMappings?: ValueMapping[];
}

interface FilterMaskGroup {
  filtermask: string;
  groups: Array<{
    filterref: number;
    filterid: string;
    rxparams: Array<{
      paramID: number;
      arbIDMask: string;
      arbIDFilter: string;
      snapshotInterval: number;
    }>;
  }>;
}

const JsonTable: React.FC<JsonTableProps> = ({ 
  data, 
  level = 0, 
  searchTerm = '', 
  parentKey = '',
  valueMappings = []
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [expandedArrayItems, setExpandedArrayItems] = useState<{ [key: string]: Set<number> }>({});

  const toggleArrayItem = (arrayKey: string, index: number) => {
    const newExpandedItems = { ...expandedArrayItems };
    if (!newExpandedItems[arrayKey]) {
      newExpandedItems[arrayKey] = new Set();
    }
    
    if (newExpandedItems[arrayKey].has(index)) {
      newExpandedItems[arrayKey].delete(index);
    } else {
      newExpandedItems[arrayKey].add(index);
    }
    
    setExpandedArrayItems(newExpandedItems);
  };

  const toggleSection = (sectionKey: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (collapsedSections.has(sectionKey)) {
      newCollapsed.delete(sectionKey);
    } else {
      newCollapsed.add(sectionKey);
    }
    setCollapsedSections(newCollapsed);
  };

  const getSectionIcon = (key: string) => {
    const normalizedKey = key.toLowerCase();
    switch (normalizedKey) {
      case 'globalconfig':
        return <Settings className="w-5 h-5" />;
      case 'cantx':
        return <Radio className="w-5 h-5" />;
      case 'canrx':
        return <Antenna className="w-5 h-5" />;
      case 'settings':
        return <Gauge className="w-5 h-5" />;
      case 'filtermask groups':
        return <Filter className="w-5 h-5" />;
      case 'filtermasks':
        return <ListFilter className="w-5 h-5" />;
      case 'filterids':
        return <Component className="w-5 h-5" />;
      case 'rxparams':
        return <Binary className="w-5 h-5" />;
      case 'coprocdsl':
        return <Cpu className="w-5 h-5" />;
      case 'instructions':
        return <Code className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const normalizeKey = (key: string): string => {
    const cleanKey = key.replace(/\[\d+\]/g, '');
    const parts = cleanKey.split('.');
    const lastPart = parts[parts.length - 1];
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1).toLowerCase();
  };

  const isObject = (value: any): boolean =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

  const matchesSearch = (key: string, value: any): boolean => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const fullKey = parentKey ? `${parentKey}.${key}` : key;
    return (
      fullKey.toLowerCase().includes(searchLower) ||
      JSON.stringify(value).toLowerCase().includes(searchLower)
    );
  };

  const shouldDisplayAsTable = (value: any): boolean => {
    if (!isObject(value) && !Array.isArray(value)) return false;
    return true;
  };

  const getExpandableText = (value: any, key: string): string => {
    const mainKey = normalizeKey(key);
    if (Array.isArray(value)) {
      return `${mainKey} (${value.length} items)`;
    }
    if (isObject(value)) {
      return `${mainKey}`;
    }
    return 'Click to expand';
  };

  const getDisplayValue = (key: string, value: any): any => {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;
    const mapping = valueMappings.find(m => 
      m.key === fullKey && String(m.value) === String(value)
    );
    return mapping ? mapping.displayValue : value;
  };

  const renderValue = (value: any, key: string = ''): React.ReactNode => {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'string') {
      const displayValue = getDisplayValue(key, value);
      return displayValue.trim() === '' ? '-' : displayValue;
    }
    
    if (typeof value === 'number') {
      return getDisplayValue(key, value);
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) return '-';
      if (shouldDisplayAsTable(value)) {
        return (
          <div className="text-purple-600 cursor-pointer hover:text-purple-800">
            {getExpandableText(value, key)}
          </div>
        );
      }
      return value.map(item => 
        typeof item === 'object' ? JSON.stringify(item) : getDisplayValue(key, item)
      ).join(', ');
    }
    
    if (isObject(value)) {
      if (shouldDisplayAsTable(value)) {
        return (
          <div className="text-purple-600 cursor-pointer hover:text-purple-800">
            {getExpandableText(value, key)}
          </div>
        );
      }
      return Object.entries(value).map(([k, v]) => `${k}: ${
        typeof v === 'object' ? JSON.stringify(v) : getDisplayValue(k, v)
      }`).join(', ');
    }
    
    return getDisplayValue(key, String(value));
  };

  const processData = (obj: any) => {
    const tables: { [key: string]: any } = {};
    const simpleValues: { [key: string]: any } = {};

    Object.entries(obj).forEach(([key, value]) => {
      if (!matchesSearch(key, value)) return;

      // Special handling for canrx section
      if (key.toLowerCase() === 'canrx' && isObject(value)) {
        const canRxData = value as Record<string, any>;
        if (Array.isArray(canRxData.filtermasks) && Array.isArray(canRxData.filterids) && Array.isArray(canRxData.rxparams)) {
          // Create FilterMask Groups
          const filterMaskGroups: FilterMaskGroup[] = [];
          const groupSize = 4;
          
          for (let i = 0; i < canRxData.filtermasks.length; i++) {
            const filtermask = canRxData.filtermasks[i];
            const startIdx = i * groupSize;
            const endIdx = startIdx + groupSize;
            const groupFilterIds = canRxData.filterids.slice(startIdx, endIdx);
            
            if (groupFilterIds.length > 0) {
              const groups = groupFilterIds.map(filterId => {
                // Find all matching rxparams based on filterIDRef
                const matchingRxParams = canRxData.rxparams.filter(
                  (                  param: { filterIDRef: any; }) => param.filterIDRef === filterId.filterref
                ).map((param: { paramID: any; arbIDMask: any; arbIDFilter: any; snapshotInterval: any; }) => ({
                  paramID: param.paramID,
                  arbIDMask: param.arbIDMask,
                  arbIDFilter: param.arbIDFilter,
                  snapshotInterval: param.snapshotInterval
                }));

                return {
                  filterref: filterId.filterref,
                  filterid: filterId.filterid,
                  rxparams: matchingRxParams.length > 0 ? matchingRxParams : [{
                    paramID: '-',
                    arbIDMask: '-',
                    arbIDFilter: '-',
                    snapshotInterval: '-'
                  }]
                };
              });

              filterMaskGroups.push({
                filtermask,
                groups
              });
            }
          }

          // Create a new object with the desired order
          const processedData = {
            ...Object.fromEntries(
              Object.entries(canRxData).filter(([k]) => 
                !['filtermasks', 'filterids', 'rxparams'].includes(k)
              )
            ),
            'FilterMask Groups': filterMaskGroups
          };

          // Add rxparams at the end
          if (canRxData.rxparams) {
            (processedData as any).rxparams = canRxData.rxparams;
          }
          
          tables[key] = processedData;
          return;
        }
      }

      if (shouldDisplayAsTable(value)) {
        tables[key] = value;
      } else {
        simpleValues[key] = renderValue(value, key);
      }
    });

    return { tables, simpleValues };
  };

  const getSectionTitle = (key: string): string => {
    if (level === 0) return 'Properties';
    return normalizeKey(key);
  };

  const renderTableHeader = (title: string, sectionKey: string, hasToggle = true, subLevel = 0) => (
    <div className={`bg-gradient-to-r from-purple-${600 - (level + subLevel) * 100} to-pink-${600 - (level + subLevel) * 100} px-6 py-4 flex items-center`}>
      <div className="flex items-center gap-2">
        {hasToggle && (
          <button
            onClick={() => toggleSection(sectionKey)}
            className="text-white hover:bg-white/10 rounded p-1 transition-colors"
          >
            {collapsedSections.has(sectionKey) ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        )}
        {getSectionIcon(title) && (
          <span className="text-white">{getSectionIcon(title)}</span>
        )}
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
    </div>
  );

  const renderSimpleTable = (data: { [key: string]: any }) => {
    if (Object.keys(data).length === 0) return null;

    const title = getSectionTitle(parentKey);
    const sectionKey = level === 0 ? 'root' : parentKey;

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        {renderTableHeader(title, sectionKey)}
        {!collapsedSections.has(sectionKey) && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(data).map(([key, value]) => (
                  <tr key={key} className={`hover:bg-purple-50 transition-colors ${
                    searchTerm && matchesSearch(key, value) ? 'bg-yellow-50' : ''
                  }`}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {normalizeKey(key)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderFilterMaskGroups = (groups: FilterMaskGroup[]) => {
    return groups.map((maskGroup, index) => {
      const maskId = `mask-${maskGroup.filtermask}-${index}`;
      const isExpanded = expandedArrayItems[maskId]?.has(0);

      return (
        <div key={maskId} className="mb-4 last:mb-0">
          <div className={`bg-gradient-to-r from-purple-${500 - level * 100} to-pink-${500 - level * 100} px-6 py-4 flex items-center rounded-t-lg`}>
            <div className="flex items-center gap-2 flex-1">
              <button
                onClick={() => toggleArrayItem(maskId, 0)}
                className="text-white hover:bg-white/10 rounded p-1 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
              <span className="text-white font-medium">Filter Mask: {maskGroup.filtermask}</span>
              <span className="text-white/80 text-sm">({maskGroup.groups.length} items)</span>
            </div>
          </div>
          
          {isExpanded && (
            <div className="border-x border-b border-gray-200 rounded-b-lg">
              <div className="p-4">
                {maskGroup.groups.map((group, groupIndex) => {
                  const groupId = `${maskId}-group-${groupIndex}`;
                  const isGroupExpanded = expandedArrayItems[groupId]?.has(0);

                  return (
                    <div key={groupId} className="mb-4 last:mb-0">
                      <div className={`bg-gradient-to-r from-purple-${400 - level * 100} to-pink-${400 - level * 100} px-6 py-3 flex items-center rounded-t-lg`}>
                        <div className="flex items-center gap-2 flex-1">
                          <button
                            onClick={() => toggleArrayItem(groupId, 0)}
                            className="text-white hover:bg-white/10 rounded p-1 transition-colors"
                          >
                            {isGroupExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                          <span className="text-white font-medium">
                            Filter Ref: {group.filterref} - Filter ID: {group.filterid}
                          </span>
                          <span className="text-white/80 text-sm">
                            ({group.rxparams.length} RxParams)
                          </span>
                        </div>
                      </div>

                      {isGroupExpanded && (
                        <div className="border-x border-b border-gray-200 rounded-b-lg">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Param ID
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ArbID Mask
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ArbID Filter
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Snapshot Interval
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {group.rxparams.map((param, paramIndex) => (
                                  <tr 
                                    key={paramIndex}
                                    className="hover:bg-purple-50 transition-colors"
                                  >
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                      {param.paramID}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                      {param.arbIDMask}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                      {param.arbIDFilter}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                      {param.snapshotInterval}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  const renderArrayTable = (key: string, array: any[]) => {
    const title = normalizeKey(key);
    const hasObjectItems = array.some(isObject);

    if (!hasObjectItems) {
      return (
        <div key={key} className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          {renderTableHeader(title, key)}
          {!collapsedSections.has(key) && (
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {array.map((value, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-500 font-mono">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    const getObjectKeys = (items: any[]): string[] => {
      const keys = new Set<string>();
      items.forEach(item => {
        if (isObject(item)) {
          Object.keys(item).forEach(key => keys.add(key));
        }
      });
      return Array.from(keys);
    };

    const columns = getObjectKeys(array);

    return (
      <div key={key} className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        {renderTableHeader(title, key)}
        {!collapsedSections.has(key) && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-10 px-6 py-3"></th>
                  {columns.map((column) => (
                    <th
                      key={column}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {normalizeKey(column)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {array.map((item, index) => {
                  const isExpanded = expandedArrayItems[key]?.has(index);
                  const hasExpandableContent = isObject(item) && columns.some(column => 
                    shouldDisplayAsTable(item[column])
                  );

                  return (
                    <React.Fragment key={index}>
                      <tr className={`hover:bg-purple-50 transition-colors ${
                        isExpanded ? 'bg-purple-50' : ''
                      }`}>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {hasExpandableContent && (
                            <button
                              onClick={() => toggleArrayItem(key, index)}
                              className="p-1 hover:bg-purple-100 rounded-full transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUpCircle className="w-5 h-5 text-purple-600" />
                              ) : (
                                <ChevronDownCircle className="w-5 h-5 text-purple-600" />
                              )}
                            </button>
                          )}
                        </td>
                        {columns.map((column) => {
                          const cellValue = isObject(item) ? item[column] : item;
                          const shouldExpand = isObject(cellValue) && shouldDisplayAsTable(cellValue);

                          return (
                            <td
                              key={column}
                              className="px-6 py-4 text-sm font-mono text-gray-500"
                              onClick={() => {
                                if (shouldExpand) {
                                  toggleArrayItem(key, index);
                                }
                              }}
                            >
                              {shouldExpand ? (
                                <div className="text-purple-600 cursor-pointer hover:text-purple-800">
                                  {getExpandableText(cellValue, column)}
                                </div>
                              ) : (
                                renderValue(cellValue, column)
                              )}
                            </td>
                          );
                        })}
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={columns.length + 1} className="px-6 py-4 bg-purple-50">
                            <div className="pl-4 border-l-2 border-purple-200">
                              <JsonTable
                                data={item}
                                level={level + 1}
                                searchTerm={searchTerm}
                                parentKey={key}
                                valueMappings={valueMappings}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const { tables, simpleValues } = processData(data);

  return (
    <div className="space-y-6">
      {renderSimpleTable(simpleValues)}
      {Object.entries(tables).map(([key, value]) => (
        <div key={key}>
          {Array.isArray(value) ? (
            key === 'FilterMask Groups' ? (
              <div className="space-y-4">
                {renderFilterMaskGroups(value)}
              </div>
            ) : (
              renderArrayTable(key, value)
            )
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
              {renderTableHeader(normalizeKey(key), key)}
              {!collapsedSections.has(key) && (
                <div className="p-4">
                  <JsonTable 
                    data={value} 
                    level={level + 1} 
                    searchTerm={searchTerm}
                    parentKey={key}
                    valueMappings={valueMappings}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default JsonTable;