import React, { useState, useEffect, useRef } from 'react';
import debounce from 'lodash.debounce';
import { Search, ChevronDown, Plus } from 'lucide-react';

interface Suggestion {
  [key: string]: any;
}

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: Suggestion) => void;
  fetchSuggestions: (query: string, groupName?: string) => Promise<Suggestion[]>;
  displayKey: string;
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
  groupName?: string;
  isModelInput?: boolean;
  isNewGroup?: boolean;
}

export default function AutocompleteInput({
  value,
  onChange,
  onSelect,
  fetchSuggestions,
  displayKey,
  placeholder,
  disabled = false,
  required = false,
  groupName,
  isModelInput = false,
  isNewGroup = false,
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedFetch = React.useCallback(
    debounce(async (query: string) => {
      if (!query || query.trim().length === 0) {
        setSuggestions([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const results = await fetchSuggestions(query);
        setSuggestions(results || []);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [fetchSuggestions]
  );

  const fetchModelSuggestions = async (groupName: string) => {
    if (!groupName) return;
    
    setLoading(true);
    try {
      const results = await fetchSuggestions(groupName);
      setSuggestions(results || []);
    } catch (error) {
      console.error('Error fetching model suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isModelInput && groupName && !isNewGroup) {
      fetchModelSuggestions(groupName);
    }
  }, [groupName, isModelInput, isNewGroup]);

  useEffect(() => {
    return () => {
      debouncedFetch.cancel();
    };
  }, [debouncedFetch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (!isModelInput) {
      if (newValue.trim()) {
        debouncedFetch(newValue);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (suggestion.isNewGroup) {
      onChange(suggestion.groupname);
      onSelect({
        groupname: suggestion.groupname,
        groupid: 0,
        isNewGroup: true
      });
    } else {
      onChange(suggestion[displayKey]);
      onSelect(suggestion);
    }
    setShowSuggestions(false);
  };

  const filteredSuggestions = isModelInput && value && !isNewGroup
    ? suggestions.filter(s => 
        s[displayKey].toLowerCase().includes(value.toLowerCase())
      )
    : suggestions;

  const allSuggestions = !isModelInput && value && filteredSuggestions.length === 0
    ? [{ groupname: value, groupid: 0, isNewGroup: true }]
    : filteredSuggestions;

  if (isModelInput) {
    const isDisabled = disabled || (!groupName && !isNewGroup);
    
    if (isNewGroup) {
      return (
        <div ref={wrapperRef} className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            placeholder="Enter new model name"
            disabled={isDisabled}
            required={required}
            className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
      );
    }
    
    return (
      <div ref={wrapperRef} className="relative">
        <div 
          className={`relative flex items-center ${
            isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
          onClick={() => {
            if (!isDisabled) {
              setShowSuggestions(!showSuggestions);
            }
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={value}
            readOnly
            placeholder={!groupName ? "Select a group first" : "Select a model"}
            disabled={isDisabled}
            required={required}
            className={`w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm 
              ${isDisabled ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'} 
              ${!isDisabled && 'cursor-pointer'}`}
          />
          <ChevronDown 
            className={`absolute right-3 w-5 h-5 text-gray-400 transition-transform ${
              showSuggestions ? 'transform rotate-180' : ''
            }`}
          />
        </div>

        {showSuggestions && !isDisabled && (
          <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-2 text-sm text-gray-500">Loading models...</div>
            ) : filteredSuggestions.length > 0 ? (
              filteredSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-2 text-left hover:bg-purple-50 text-sm"
                >
                  {suggestion[displayKey]}
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500">No models available</div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
      </div>

      {showSuggestions && (allSuggestions.length > 0 || loading) && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
          ) : (
            allSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full px-4 py-2 text-left hover:bg-purple-50 text-sm flex items-center ${
                  suggestion.isNewGroup ? 'text-purple-600' : ''
                }`}
              >
                {suggestion.isNewGroup && <Plus className="w-4 h-4 mr-2" />}
                {suggestion.isNewGroup ? `Add "${suggestion.groupname}" as a new group` : suggestion[displayKey]}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}