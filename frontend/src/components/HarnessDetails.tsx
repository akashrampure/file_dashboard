import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { Home, LogOut, Edit, Trash2, Plus, RefreshCw, Search, X, Check, Upload, Download, Eye, Loader2, Filter, FilterX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { resetUser } from '../store/slices/userSlice';
import { authApi, harnessApi } from '../api';
import type { User, HarnessData } from '../types';
import FileViewer from './FileViewer';
import HarnessFilters from './HarnessFilters';
import ColumnFilterDialog from './ColumnFilterDialog';

const initialFormData: HarnessData = {
  slno: 0,
  phcode: '',
  ahcode: '',
  currentstock: 0,
  vehicletype: '',
  vehicleoem: '',
  vehiclemodel: '',
  vehiclevariant: '',
  yearofmfg: '',
  fueltype: '',
  transmissiontype: '',
  ignitiontype: '',
  devicetype: '',
  specification: '',
  immotype: '',
  immorelayvoltage: '',
  can: '',
  panic: '',
  devversion: '',
  harnessimage: '',
  diagram: '',
  rev: 0,
  description: '',
  updatedby: '',
  updatedat: 0,
};

const columnHelper = createColumnHelper<HarnessData>();

function HarnessDetails() {
  const [data, setData] = useState<HarnessData[]>([]);
  const [filteredData, setFilteredData] = useState<HarnessData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<HarnessData>(initialFormData);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<HarnessData | null>(null);
  const [diagramFile, setDiagramFile] = useState<File | null>(null);
  const [harnessImageFile, setHarnessImageFile] = useState<File | null>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [viewerFolder, setViewerFolder] = useState('');
  const [viewerFileName, setViewerFileName] = useState('');
  const [downloadingFiles, setDownloadingFiles] = useState<{ [key: string]: boolean }>({});
  const [downloadSuccess, setDownloadSuccess] = useState<{ [key: string]: boolean }>({});
  const [activeFilter, setActiveFilter] = useState<{
    column: string;
    values: Set<string>;
  } | null>(null);
  const [activeFilters, setActiveFilters] = useState<Map<string, Set<string>>>(new Map());
  const [originalData, setOriginalData] = useState<HarnessData | null>(null);

  const user = useSelector((state: { user: User }) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  let isAdmin = user.role.toLowerCase() === "admin";

  const normalizeValue = useCallback((val: any): string => {
    const str = val == null ? '' : String(val).trim();
    return str === '' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined'
      ? 'NA'
      : str;
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const vehicles = await harnessApi.getAllVehicles();
      setData(vehicles);
      setFilteredData(vehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  fetchData();
}, []);

const filterDataByFilters = useCallback(
  (filters: Map<string, Set<string>>, source: HarnessData[]) => {
    if (filters.size === 0) return source;
    return source.filter(item =>
      Array.from(filters.entries()).every(([col, values]) =>
        values.has(normalizeValue(item[col as keyof HarnessData]))
      )
    );
  },
  [normalizeValue]
);

useEffect(() => {
  const filtered = filterDataByFilters(activeFilters, data);
  setFilteredData(filtered);
}, [activeFilters, data, filterDataByFilters]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('Data refreshed successfully');
  };

  const handleSignOut = async () => {
    await authApi.signOut();
    dispatch(resetUser());
    navigate('/');
  };

  const getFileNameFromUrl = (url: string) => {
    try {
      return decodeURIComponent(url.split('/').pop() || '');
    } catch {
      return url.split('/').pop() || '';
    }
  };

  const handleViewFile = (folder: string, filename: string) => {
    setViewerFolder(folder);
    setViewerFileName(filename);
    setShowFileViewer(true);
  };

  const handleDownload = async (folder: string, filename: string) => {
    const key = `${folder}-${filename}`;
    setDownloadingFiles(prev => ({ ...prev, [key]: true }));
    try {
      await harnessApi.downloadFile(folder, filename);
      setDownloadSuccess(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setDownloadSuccess(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (error) {
      toast.error('Failed to download file');
    } finally {
      setDownloadingFiles(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleClearAllFilters = () => {
    setActiveFilters(new Map());
  };

  const handleClearFilter = (columnId: string) => {
    const newFilters = new Map(activeFilters);
    newFilters.delete(columnId);
    setActiveFilters(newFilters);
  };

  const handleFilterValueToggle = (value: string) => {
    if (!activeFilter) return;

    const newValues = new Set(activeFilter.values);
    if (newValues.has(value)) {
      newValues.delete(value);
    } else {
      newValues.add(value);
    }

    const newFilters = new Map(activeFilters);
    if (newValues.size > 0) {
      newFilters.set(activeFilter.column, newValues);
    } else {
      newFilters.delete(activeFilter.column);
    }
    setActiveFilters(newFilters);
    setActiveFilter({ ...activeFilter, values: newValues });
  };

  const handleDelete = async (vehicleDetails: HarnessData) => {
    try {
      const params = `${vehicleDetails.phcode},${vehicleDetails.vehicleoem},${vehicleDetails.vehiclemodel},${vehicleDetails.vehiclevariant},${vehicleDetails.yearofmfg}`;
      
      await harnessApi.deleteVehicle(params);
      
      await fetchData();
      toast.success('Vehicle deleted successfully');
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error('Failed to delete vehicle');
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const handleApplyFilter = (selectedValues: Set<string>) => {
    if (!activeFilter) return;

    const newFilters = new Map(activeFilters);
    if (selectedValues.size > 0) {
      newFilters.set(activeFilter.column, selectedValues);
    } else {
      newFilters.delete(activeFilter.column);
    }
    setActiveFilters(newFilters);
    setActiveFilter(null);
  };

  const renderColumnHeader = (column: any) => (
    <div className="flex items-center gap-2">
      <span>{column.id.charAt(0).toUpperCase() + column.id.slice(1)}</span>
      <div className="flex items-center">
        <button
          onClick={() => openFilterDialog(column)}
          className={`p-1 rounded transition-colors ${
            activeFilters.has(column.id)
              ? 'text-purple-600 bg-purple-100 hover:bg-purple-200'
              : 'text-gray-400 hover:bg-gray-100'
          }`}
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const openFilterDialog = (column: any) => {
    const colId = column.id;

    // Prepare a copy of activeFilters without the current column
    const filtersExcludingCurrent = new Map(activeFilters);
    filtersExcludingCurrent.delete(colId);

    // Filter data using all filters except the current column
    const filtered = Array.from(filtersExcludingCurrent.entries()).reduce(
      (acc, [filterCol, values]) =>
        acc.filter(item => values.has(normalizeValue(item[filterCol as keyof HarnessData]))),
      data
    );

    // If a filter is already active for this column, use its values
    const existing = activeFilters.get(colId);
    if (existing) {
      setActiveFilter({ column: colId, values: new Set(existing) });
      return;
    }

    // Compute unique values from the filtered data
    const allValues = new Set(
      filtered.map(item => normalizeValue(item[colId as keyof HarnessData]))
    );
    setActiveFilter({ column: colId, values: allValues });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
        const updatedFormData = {
            phcode: formData.phcode,
            ahcode: formData.ahcode,
            currentstock: formData.currentstock,
            vehicletype: formData.vehicletype,
            vehicleoem: formData.vehicleoem,
            vehiclemodel: formData.vehiclemodel,
            vehiclevariant: formData.vehiclevariant,
            yearofmfg: formData.yearofmfg,
            fueltype: formData.fueltype,
            transmissiontype: formData.transmissiontype,
            ignitiontype: formData.ignitiontype,
            devicetype: formData.devicetype,
            specification: formData.specification,
            immotype: formData.immotype,
            immorelayvoltage: formData.immorelayvoltage,
            can: formData.can,
            panic: formData.panic,
            devversion: formData.devversion,
            rev: formData.rev,
            description: formData.description,
            diagram: diagramFile ? diagramFile.name : formData.diagram,
            harnessimage: harnessImageFile ? harnessImageFile.name : formData.harnessimage,
            updatedat: Date.now(),
            updatedby: user?.email || '',
        };

        if (diagramFile) {
          await harnessApi.uploadFile(diagramFile, 'diagram');
        }
  
        if (harnessImageFile) {
          await harnessApi.uploadFile(harnessImageFile, 'harnessimage');
        }  

        if (isEditing && originalData) {
            const params = `${originalData.phcode},${originalData.vehicleoem},${originalData.vehiclemodel},${originalData.vehiclevariant},${originalData.yearofmfg}`;
            await harnessApi.updateVehicle(params, updatedFormData);
            toast.success('Vehicle updated successfully');
        } else {
            await harnessApi.createVehicle(updatedFormData);
            toast.success('Vehicle added successfully');
        }

        await fetchData();
        setShowForm(false);
        setFormData(initialFormData);
        setIsEditing(false);
        setDiagramFile(null);
        setHarnessImageFile(null);
        setOriginalData(null);
    } catch (error) {
        console.error('Error saving vehicle:', error);
        if (error instanceof Error && 'response' in error && (error as any).response?.data) {
            // If the error is from the server
            console.error('Server responded with:', (error as any).response.data);
            toast.error(`Failed to save vehicle: ${(error as any).response.data.message || 'Duplicate entry detected, Please use unique values'}`);
        } else {
            // If the error is a network error
            toast.error('Network error: Please check your connection or server status.');
        }
    }
  };

  const handleEdit = (data: HarnessData) => {
    setOriginalData(data);
    setFormData(data);
    setIsEditing(true);
    setShowForm(true);
    setDiagramFile(null);
    setHarnessImageFile(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'diagram' | 'harnessimage') => {
    const file = event.target.files?.[0];
    
    if (file && file.size > 0) {
      const allowedTypes = type === 'diagram' 
        ? ['.pdf', '.jpg', '.jpeg', '.png'] 
        : ['.jpg', '.jpeg', '.png'];
      
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedTypes.includes(fileExt)) {
        toast.error(`Please select a valid ${allowedTypes.join(', ')} file`);
        event.target.value = '';
        return;
      }

      if (type === 'diagram') {
        setDiagramFile(file);
        setFormData(prev => ({ ...prev, diagram: file.name }));
      } else {
        setHarnessImageFile(file);
        setFormData(prev => ({ ...prev, harnessimage: file.name }));
      }
    } else {
      toast.error('Please select a valid file');
      event.target.value = '';
    }
  };

  const columns = [
    columnHelper.accessor('slno', {
      header: ({ column }) => renderColumnHeader(column),
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('phcode', {
      header: ({ column }) => renderColumnHeader(column),
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('ahcode', {
      header: ({ column }) => renderColumnHeader(column),
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('currentstock', {
      header: ({ column }) => renderColumnHeader(column),
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('vehicletype', {
      header: ({ column }) => renderColumnHeader(column),
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('vehicleoem', {
      header: ({ column }) => renderColumnHeader(column),
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('vehiclemodel', {
      header: ({ column }) => renderColumnHeader(column),
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('vehiclevariant', {
      header: ({ column }) => renderColumnHeader(column),
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('yearofmfg', {
      header: ({ column }) => renderColumnHeader(column),
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('fueltype', {
      header: ({ column }) => renderColumnHeader(column),
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('transmissiontype', {
      header: ({ column }) => renderColumnHeader(column),
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('ignitiontype', {
      header: ({ column }) => renderColumnHeader(column),
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('devicetype', {
      header: ({ column }) => renderColumnHeader(column),
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('specification', {
      header: ({ column }) => renderColumnHeader(column),
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('immotype', {
      header: ({ column }) => renderColumnHeader(column),
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('immorelayvoltage', {
      header: ({ column }) => renderColumnHeader(column),
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('can', {
      header: ({ column }) => renderColumnHeader(column),
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('panic', {
      header: ({ column }) => renderColumnHeader(column),
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('devversion', {
      header: ({ column }) => renderColumnHeader(column),
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('diagram', {
      header: ({ column }) => renderColumnHeader(column),
      cell: info => {
        const url = info.getValue();
        const filename = getFileNameFromUrl(url);
        const key = `diagram-${filename}`;
        const isDownloading = downloadingFiles[key];
        const showSuccess = downloadSuccess[key];
        
        return url ? (
          <div className="flex items-center gap-2">
            <span className="text-gray-600">{filename}</span>
            <div className="flex gap-1">
              <button
                onClick={() => handleViewFile('diagram', filename)}
                className="p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
                title="View"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDownload('diagram', filename)}
                disabled={isDownloading}
                className="p-1 text-green-600 hover:text-green-800 rounded-full hover:bg-green-50"
                title="Download"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : showSuccess ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        ) : '-';
      },
    }),
    columnHelper.accessor('harnessimage', {
      header: ({ column }) => renderColumnHeader(column),
      cell: info => {
        const url = info.getValue();
        const filename = getFileNameFromUrl(url);
        const key = `harnessimage-${filename}`;
        const isDownloading = downloadingFiles[key];
        const showSuccess = downloadSuccess[key];
        
        return url ? (
          <div className="flex items-center gap-2">
            <span className="text-gray-600">{filename}</span>
            <div className="flex gap-1">
              <button
                onClick={() => handleViewFile('harnessimage', filename)}
                className="p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
                title="View"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDownload('harnessimage', filename)}
                disabled={isDownloading}
                className="p-1 text-green-600 hover:text-green-800 rounded-full hover:bg-green-50"
                title="Download"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : showSuccess ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        ) : '-';
      },
    }),
    columnHelper.accessor('rev', {
      header: ({ column }) => renderColumnHeader(column),
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('description', {
      header: ({ column }) => renderColumnHeader(column),
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('updatedby', {
      header: ({ column }) => renderColumnHeader(column),
      cell: info => info.getValue() || '-',
    }),
    columnHelper.accessor('updatedat', {
      header: ({ column }) => renderColumnHeader(column),
      cell: info => info.getValue() ? new Date(info.getValue()).toLocaleString() : '-',
    }),
    ...(isAdmin ? [
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: props => (
          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(props.row.original)}
              className="p-1.5 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-200"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(props.row.original)}
              className="p-1.5 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-lg hover:from-red-500 hover:to-red-600 transition-all duration-200"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      }),
    ] : []),
  ];

  const handleCancelEdit = () => {
    setFormData(initialFormData);
    setIsEditing(false);
    setShowForm(false);
    setDiagramFile(null);
    setHarnessImageFile(null);
  };
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter: searchQuery,
    },
    onGlobalFilterChange: setSearchQuery,
  });

  return (
    <div className="flex flex-col h-screen">
      <nav className="bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors duration-200 bg-white/10 rounded-lg px-3 py-2"
            >
              <Home className="w-5 h-5" />
              Homepage
            </button>
            <h1 className="text-xl font-semibold text-white absolute left-1/2 transform -translate-x-1/2">
              Vehicle Harness Details
            </h1>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <img
                  src={user?.avatar}
                  alt="User"
                  className="w-8 h-8 rounded-full border-2 border-white"
                  onError={(e) => {
                    e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/5987/5987424.png';
                  }}
                />
                <div className="text-white">
                  <p className="text-sm font-medium">{user?.email || ''}</p>
                  <p className="text-xs opacity-75 capitalize">{user.role}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 w-full sm:w-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search harness details..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              {activeFilters.size > 0 && (
                <button
                  onClick={handleClearAllFilters}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <FilterX className="w-4 h-4" />
                  Clear All Filters
                </button>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 ${
                  refreshing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              {isAdmin && (
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(initialFormData);
                    setShowForm(true);
                  }}
                  aria-label="Add New Harness"
                >
                  <Plus className="w-4 h-4" />
                  Add New Harness
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="h-full overflow-auto">
          <div className="min-w-max bg-white rounded-lg shadow-md">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-200"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                        <span className="ml-2">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map(cell => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showFileViewer && (
          <FileViewer
            folder={viewerFolder}
            filename={viewerFileName}
            onClose={() => setShowFileViewer(false)}
          />
        )}
        {activeFilter && (
          (() => {
            // Filter data by all active filters except the current column
            const filtersExcludingCurrent = new Map(activeFilters);
            filtersExcludingCurrent.delete(activeFilter.column);
            const filtered = Array.from(filtersExcludingCurrent.entries()).reduce(
              (acc, [filterCol, values]) =>
                acc.filter(item => values.has(normalizeValue(item[filterCol as keyof HarnessData]))),
              data
            );
            const uniqueValues = Array.from(
              new Set(
                filtered.map(item =>
                  normalizeValue(item[activeFilter.column as keyof HarnessData])
                )
              )
            )
              .sort()
              .map(value => ({
                value,
                count: filtered.filter(
                  item =>
                    normalizeValue(item[activeFilter.column as keyof HarnessData]) ===
                    value
                ).length
              }));
            return (
              <ColumnFilterDialog
                isOpen={true}
                onClose={() => setActiveFilter(null)}
                columnName={activeFilter.column}
                uniqueValues={uniqueValues}
                selectedValues={activeFilter.values}
                onApplyFilter={handleApplyFilter}
                onClearFilter={() => handleClearFilter(activeFilter.column)}
              />
            );
          })()
        )}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-emerald-600 to-teal-600 rounded-t-xl">
                <h3 className="text-lg font-medium text-white">
                  {isEditing ? 'Edit Harness Details' : 'Add New Harness'}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-white hover:text-gray-200 transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PH Code
                    </label>
                    <input
                      type="text"
                      name="phcode"
                      value={formData.phcode}
                      onChange={(e) => setFormData({ ...formData, phcode: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      AH Code
                    </label>
                    <input
                      type="text"
                      name="ahcode"
                      value={formData.ahcode}
                      onChange={(e) => setFormData({ ...formData, ahcode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Stock
                    </label>
                    <input
                      type="number"
                      name="currentstock"
                      value={formData.currentstock}
                      onChange={(e) => setFormData({ ...formData, currentstock: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Type
                    </label>
                    <input
                      type="text"
                      name="vehicletype"
                      value={formData.vehicletype}
                      onChange={(e) => setFormData({ ...formData, vehicletype: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle OEM
                    </label>
                    <input
                      type="text"
                      name="vehicleoem"
                      value={formData.vehicleoem}
                      onChange={(e) => setFormData({ ...formData, vehicleoem: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Model
                    </label>
                    <input
                      type="text"
                      name="vehiclemodel"
                      value={formData.vehiclemodel}
                      onChange={(e) => setFormData({ ...formData, vehiclemodel: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Variant
                    </label>
                    <input
                      type="text"
                      name="vehiclevariant"
                      value={formData.vehiclevariant}
                      onChange={(e) => setFormData({ ...formData, vehiclevariant: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year of Manufacture
                    </label>
                    <input
                      type="text"
                      name="yearofmfg"
                      value={formData.yearofmfg}
                      onChange={(e) => setFormData({ ...formData, yearofmfg: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fuel Type
                    </label>
                    <input
                      type="text"
                      name="fueltype"
                      value={formData.fueltype}
                      onChange={(e) => setFormData({ ...formData, fueltype: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transmission Type
                    </label>
                    <input
                      type="text"
                      name="transmissiontype"
                      value={formData.transmissiontype}
                      onChange={(e) => setFormData({ ...formData, transmissiontype: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ignition Type
                    </label>
                    <input
                      type="text"
                      name="ignitiontype"
                      value={formData.ignitiontype}
                      onChange={(e) => setFormData({ ...formData, ignitiontype: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Device Type
                    </label>
                    <input
                      type="text"
                      name="devicetype"
                      value={formData.devicetype}
                      onChange={(e) => setFormData({ ...formData, devicetype: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specification
                    </label>
                    <input
                      type="text"
                      name="specification"
                      value={formData.specification}
                      onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IMMO Type
                    </label>
                    <input
                      type="text"
                      name="immotype"
                      value={formData.immotype}
                      onChange={(e) => setFormData({ ...formData, immotype: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IMMO Relay Voltage
                    </label>
                    <input
                      type="text"
                      name="immorelayvoltage"
                      value={formData.immorelayvoltage}
                      onChange={(e) => setFormData({ ...formData, immorelayvoltage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CAN
                    </label>
                    <input
                      type="text"
                      name="can"
                      value={formData.can}
                      onChange={(e) => setFormData({ ...formData, can: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Panic
                    </label>
                    <input
                      type="text"
                      name="panic"
                      value={formData.panic}
                      onChange={(e) => setFormData({ ...formData, panic: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Device Version
                    </label>
                    <input
                      type="text"
                      name="devversion"
                      value={formData.devversion}
                      onChange={(e) => setFormData({ ...formData, devversion: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rev
                    </label>
                    <input
                      type="number"
                      name="rev"
                      value={formData.rev}
                      onChange={(e) => setFormData({ ...formData, rev: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Harness Image (.jpg, .jpeg, .png)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        onChange={(e) => handleFileUpload(e, 'harnessimage')}
                        accept=".jpg,.jpeg,.png"
                        className="hidden"
                        id="harness-image-upload"
                      />
                      <label
                        htmlFor="harness-image-upload"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Image
                      </label>
                      {harnessImageFile ? (
                        <span className="text-sm text-gray-600">{harnessImageFile.name}</span>
                      ) : formData.harnessimage && (
                        <span className="text-sm text-gray-600">{getFileNameFromUrl(formData.harnessimage)}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Diagram (.pdf, .jpg, .jpeg, .png)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        onChange={(e) => handleFileUpload(e, 'diagram')}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        id="diagram-upload"
                      />
                      <label
                        htmlFor="diagram-upload"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Diagram
                      </label>
                      {diagramFile ? (
                        <span className="text-sm text-gray-600">{diagramFile.name}</span>
                      ) : formData.diagram && (
                        <span className="text-sm text-gray-600">{getFileNameFromUrl(formData.diagram)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200"
                  >
                    {isEditing ? 'Update Harness' : 'Save Harness'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

{showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to delete this harness? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default HarnessDetails;