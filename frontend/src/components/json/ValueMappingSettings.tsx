import React, { useState, useEffect, useRef } from 'react';
import { Settings, Plus, X, Check, ChevronRight, Pencil } from 'lucide-react';

export interface ValueMapping {
  key: string;
  value: string | number;
  displayValue: string;
}

interface ValueMappingSettingsProps {
  mappings: ValueMapping[];
  onMappingsChange: (mappings: ValueMapping[]) => void;
  data?: any;
}

const ValueMappingSettings: React.FC<ValueMappingSettingsProps> = ({
  mappings,
  onMappingsChange,
  data,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newMapping, setNewMapping] = useState<Partial<ValueMapping>>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const clearForm = () => {
    setNewMapping({});
    setSuggestions([]);
    setShowSuggestions(false);
    setEditingIndex(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSuggestions(false);
        clearForm();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setShowSuggestions(false);
        clearForm();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const getTableKeys = (obj: any): string[] => {
    const keys = new Set<string>();

    const processValue = (value: any, path: string) => {
      if (!value || typeof value !== 'object') {
        keys.add(path);
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item !== 'object') {
            keys.add(path);
          } else {
            Object.entries(item).forEach(([key, val]) => {
              if (typeof val !== 'object') {
                keys.add(`${path}.${key}`);
              }
            });
          }
        });
      } else {
        Object.entries(value).forEach(([key, val]) => {
          const newPath = path ? `${path}.${key}` : key;
          if (typeof val !== 'object') {
            keys.add(newPath);
          } else {
            processValue(val, newPath);
          }
        });
      }
    };

    processValue(obj, '');
    return Array.from(keys).filter(k => k !== '');
  };

  const formatKeyPath = (key: string): React.ReactNode => {
    const parts = key.split('.');
    return parts.map((part, index) => (
      <React.Fragment key={index}>
        {index > 0 && <ChevronRight className="w-4 h-4 inline text-gray-400 mx-1" />}
        <span className="text-gray-700">{part}</span>
      </React.Fragment>
    ));
  };

  const formatInputKeyPath = (key: string): string => {
    return key.replace(/\./g, ' > ');
  };

  const handleKeyChange = (value: string) => {
    const normalizedValue = value.replace(/\s*>\s*/g, '.');
    setNewMapping({ ...newMapping, key: normalizedValue });
    
    if (!data) return;

    const tableKeys = getTableKeys(data);
    const filtered = tableKeys.filter(key => 
      key.toLowerCase().includes(normalizedValue.toLowerCase())
    );
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  const handleSelectSuggestion = (key: string) => {
    setNewMapping({ ...newMapping, key });
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleAddMapping = () => {
    if (newMapping.key && newMapping.value !== undefined && newMapping.displayValue) {
      if (editingIndex !== null) {
        const updatedMappings = [...mappings];
        updatedMappings[editingIndex] = newMapping as ValueMapping;
        onMappingsChange(updatedMappings);
      } else {
        onMappingsChange([...mappings, newMapping as ValueMapping]);
      }
      clearForm();
    }
  };

  const handleRemoveMapping = (index: number) => {
    const newMappings = mappings.filter((_, i) => i !== index);
    onMappingsChange(newMappings);
  };

  const handleEditMapping = (index: number) => {
    setEditingIndex(index);
    setNewMapping(mappings[index]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && suggestions.length === 1) {
      handleSelectSuggestion(suggestions[0]);
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-colors ${
          isOpen ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'
        }`}
        title="Value Mapping Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => {
              setIsOpen(false);
              clearForm();
            }}
          />
          <div 
            ref={dialogRef}
            className="fixed left-1/2 top-24 -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 w-[480px] z-50"
          >
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Value Mapping Settings</h3>
                <p className="text-sm text-gray-600">
                  Define custom display values for specific key-value pairs
                </p>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  clearForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
              <div className="space-y-3">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Key"
                    value={newMapping.key ? formatInputKeyPath(newMapping.key) : ''}
                    onChange={(e) => handleKeyChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {showSuggestions && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="w-full px-4 py-2 text-left hover:bg-purple-50 flex items-center justify-between group"
                        >
                          <span className="flex items-center">{formatKeyPath(suggestion)}</span>
                          <Check className="w-4 h-4 text-purple-600 opacity-0 group-hover:opacity-100" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Value"
                  value={newMapping.value || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = Number(value);
                    setNewMapping({
                      ...newMapping,
                      value: Number.isNaN(numValue) ? value : numValue,
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Display As"
                    value={newMapping.displayValue || ''}
                    onChange={(e) =>
                      setNewMapping({ ...newMapping, displayValue: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAddMapping}
                    disabled={!newMapping.key || newMapping.value === undefined || !newMapping.displayValue}
                    className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingIndex !== null ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Mappings</h4>
                <div className="space-y-2">
                  {mappings.map((mapping, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded-lg"
                    >
                      <div className="flex gap-2 items-center">
                        <span className="font-medium flex items-center">
                          {formatKeyPath(mapping.key)}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="text-gray-600">{String(mapping.value)}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-purple-600">{mapping.displayValue}</span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditMapping(index)}
                          className="p-1 text-gray-400 hover:text-purple-600 rounded-full hover:bg-purple-50"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveMapping(index)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {mappings.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-2">
                      No mappings defined yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ValueMappingSettings;