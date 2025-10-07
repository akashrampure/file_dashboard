import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Table2, Trees as TreeStructure, List, Search, FileText, Plus, RefreshCw, Loader2, ArrowLeft, Home } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import JsonTable from './json/JsonTable';
import JsonTree from './json/JsonTree';
import JsonList from './json/JsonList';
import ValueMappingSettings, { ValueMapping } from './json/ValueMappingSettings';
import { jsonApis } from '../api/config';
import { setSearchTerm, setSelectedRecord, setAllRecords, setLoading, setError, setFilteredRecords } from '../store/slices/recordsSlice';
import type { RootState } from '../store/store';
import { useLocation, useNavigate } from 'react-router-dom';

type ViewMode = 'table' | 'tree' | 'list';

const MAPPINGS_STORAGE_KEY = 'jsonViewerMappings';

export default function JsonParser() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const searchTerm = useSelector((state: RootState) => state.records.searchTerm);
  const filteredRecords = useSelector((state: RootState) => state.records.filteredRecords);
  const selectedRecord = useSelector((state: RootState) => state.records.selectedRecord);
  const allRecords = useSelector((state: RootState) => state.records.allRecords);
  const isLoading = useSelector((state: RootState) => state.records.isLoading);
  const error = useSelector((state: RootState) => state.records.error);
  const location = useLocation();
  const valueFromLocation = location.state?.value;

  const [jsonData, setJsonData] = useState<any>(null);
  const [fileName, setFileName] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [contentSearchTerm, setContentSearchTerm] = useState('');
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [valueMappings, setValueMappings] = useState<ValueMapping[]>(() => {
    const stored = localStorage.getItem(MAPPINGS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const fetchRecords = async () => {
    setIsRefreshing(true);
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      const records = await jsonApis.getAllRecords();
      
      const sortedRecords = records.sort((a, b) => {
        return a.localeCompare(b, undefined, { sensitivity: 'base' });
      });

      dispatch(setAllRecords(sortedRecords));
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Failed to fetch records'));
    } finally {
      dispatch(setLoading(false));
      setTimeout(() => setIsRefreshing(false), 300);
    }
  };

  const fetchRecordDetails = async (id: string) => {
    setIsLoadingDetails(true);
    setNotFound(false);
    try {
      const details = await jsonApis.getRecordDetails(id);
      
      const orderedData: Record<string, any> = {};
      const orderedSections = ['globalconfig', 'cantx', 'canrx', 'settings', 'coprocdsl'];
      
      orderedSections.forEach(section => {
        if (details[section]) {
          orderedData[section] = details[section];
        }
      });
          
      Object.entries(details).forEach(([key, value]) => {
        if (!orderedSections.includes(key.toLowerCase())) {
          orderedData[key] = value;
        }
      });

      setJsonData(orderedData);
      setFileName(selectedRecord?.name || id);
    } catch (err) {
      console.error('Failed to fetch record details:', err);
      setNotFound(true);
    } finally {
      setIsLoadingDetails(false);
    }
  };
  
  useEffect(() => {
    if (valueFromLocation) {
      dispatch(setSelectedRecord({ id: valueFromLocation, name: valueFromLocation }));
    }
  }, [dispatch, valueFromLocation]);

  useEffect(() => {
    if (selectedRecord?.id) {
      fetchRecordDetails(selectedRecord.id);
    }
  }, [selectedRecord]);

  useEffect(() => {
    localStorage.setItem(MAPPINGS_STORAGE_KEY, JSON.stringify(valueMappings));
  }, [valueMappings]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = (e.target?.result as string).replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
        const json = JSON.parse(content);
        setJsonData(json);
      } catch (error) {
        alert('Invalid JSON file');
        console.error('JSON parse error:', error);
      }
    };
    reader.readAsText(file);
  }, []);

  const ViewComponents = {
    table: JsonTable,
    tree: JsonTree,
    list: JsonList,
  };

  const CurrentView = ViewComponents[viewMode];

  const handleSearch = (term: string) => {
    dispatch(setSearchTerm(term));

    const uniqueNames = new Set<string>();
    const filtered = allRecords.filter(record => {
      const isMatch = record.toLowerCase().includes(term.toLowerCase());
      if (isMatch) {
        if (!uniqueNames.has(record)) {
          uniqueNames.add(record);
          return true;
        }
      }
      return false;
    });

    dispatch(setFilteredRecords(filtered));
  };

  useEffect(() => {
    if (searchTerm) {
      handleSearch(searchTerm);
    } else {
      dispatch(setFilteredRecords(allRecords));
    }
  }, [searchTerm, allRecords, dispatch]);

  const handleSelectRecord = (name: string) => {
    dispatch(setSelectedRecord({ id: name, name }));
  };

  const handleBack = () => {
    setJsonData(null);
    setNotFound(false);
    dispatch(setSelectedRecord(null));
    const url = new URL(window.location.href);
    url.searchParams.delete('cansettings');
    window.history.replaceState({}, '', url);
  };

  const handleNavigateToHome = () => {
    dispatch(setSelectedRecord(null));
    setJsonData(null);
    setNotFound(false);
    setContentSearchTerm('');
    
    navigate('/home');
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">File Not Found</h1>
          <p className="text-gray-600 text-center mb-6">
            The requested CAN settings file could not be found.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />   
            Return to LAF File Packages
          </button>
          <button
            onClick={() => {handleBack()}}
            className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105"
          >
            Check Existing Files
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={handleNavigateToHome}
              className="flex items-center gap-2 p-2 text-gray-500 hover:text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Home className="w-5 h-5" />
              Homepage
            </button>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 text-center flex-grow">
              CAN Settings Visualizer
            </h1>
          </div>

          {!jsonData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* API Search Section */}
              <div className="flex flex-col p-12 border-2 border-gray-300 rounded-xl bg-gray-50/50 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search records..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={fetchRecords}
                    disabled={isRefreshing}
                    className="p-2 text-gray-500 hover:text-purple-600 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
                    title="Refresh records"
                  >
                    <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto max-h-64 rounded-lg border border-gray-200">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full p-8">
                      <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                    </div>
                  ) : error ? (
                    <div className="text-red-500 text-center p-8">
                      {error}
                    </div>
                  ) : filteredRecords.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {filteredRecords.map((name, index) => (
                        <button
                          key={`${name}-${index}`}
                          onClick={() => handleSelectRecord(name)}
                          className={`w-full px-4 py-3 text-left hover:bg-purple-50 transition-all ${
                            selectedRecord?.name === name ? 'bg-purple-50' : ''
                          }`}
                          style={{
                            animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`,
                          }}
                        >
                          <h3 className="font-medium text-gray-900">
                            {name}
                          </h3>
                        </button>
                      ))}
                    </div>
                  ) : searchTerm ? (
                    <p className="text-gray-500 text-center p-8">No matching records found</p>
                  ) : (
                    <p className="text-gray-500 text-center p-8">Click refresh to load records</p>
                  )}
                </div>
              </div>

              {/* File Upload Section */}
              <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 backdrop-blur-sm">
                <Upload className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4 text-center">
                  Upload your JSON file to visualize its structure
                </p>
                <label className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg cursor-pointer transition-all transform hover:scale-105">
                  Choose JSON File
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {jsonData && (
            <div className="animate-fadeIn">
              <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBack}
                    className="p-2 text-gray-500 hover:text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">{fileName}</span>
                  </div>
                  <label className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                    <Plus className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-600">Upload New File</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <div className="flex gap-2">
                    <ViewButton
                      active={viewMode === 'table'}
                      onClick={() => setViewMode('table')}
                      icon={<Table2 className="w-5 h-5" />}
                      label="Table"
                    />
                    <ViewButton
                      active={viewMode === 'tree'}
                      onClick={() => setViewMode('tree')}
                      icon={<TreeStructure className="w-5 h-5" />}
                      label="Tree"
                    />
                    <ViewButton
                      active={viewMode === 'list'}
                      onClick={() => setViewMode('list')}
                      icon={<List className="w-5 h-5" />}
                      label="List"
                    />
                  </div>
                  <ValueMappingSettings
                    mappings={valueMappings}
                    onMappingsChange={setValueMappings}
                    data={jsonData}
                  />
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search keys or values..."
                    value={contentSearchTerm}
                    onChange={(e) => setContentSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              {isLoadingDetails ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
              ) : (
                <CurrentView 
                  data={jsonData} 
                  searchTerm={contentSearchTerm} 
                  valueMappings={valueMappings}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ViewButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const ViewButton: React.FC<ViewButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all transform hover:scale-105 ${
      active
        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    {icon}
    {label}
  </button>
);