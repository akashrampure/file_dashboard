import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { Plus, Edit, Trash2, LogOut, X, RefreshCw, Search, Check, X as XMark, Home, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FirmwareData, GroupSuggestion, ModelSuggestion } from '../types';
import { authApi, firmwareApi } from '../api';
import type { User } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { useDispatch, useSelector } from 'react-redux';
import { resetUser } from '../store/slices/userSlice';
import AutocompleteInput from './AutocompleteInput';

interface FormCardProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const FormCard: React.FC<FormCardProps> = ({ title, children, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExpanded(!isExpanded);
  };

  const getGradient = (title: string) => {
    switch (title) {
      case 'Group Information':
        return 'from-blue-400 via-indigo-500 to-blue-600';
      case 'Package Information':
        return 'from-purple-400 via-fuchsia-500 to-pink-600';
      case 'Hardware and Firmware Information':
        return 'from-amber-400 via-orange-500 to-red-600';
      case 'Settings Information':
        return 'from-emerald-400 via-teal-500 to-green-600';
      default:
        return 'from-gray-400 via-slate-500 to-gray-600';
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={handleClick}
        className="w-full relative overflow-hidden"
      >
        <div className={`h-32 bg-gradient-to-r ${getGradient(title)} relative`}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-between px-6">
            <h3 className="text-xl font-medium text-white drop-shadow-sm">{title}</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/90">
                {isExpanded ? 'Click to collapse' : 'Click to expand'}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-white" />
              ) : (
                <ChevronDown className="h-5 w-5 text-white" />
              )}
            </div>
          </div>
        </div>
      </button>
      {isExpanded && (
        <div className="p-6 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

const columnHelper = createColumnHelper<FirmwareData>();

function Dashboard() {
  const [data, setData] = useState<FirmwareData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FirmwareData>(initialFormData);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isNewGroup, setIsNewGroup] = useState(false);
  const user = useSelector((state: { user: User }) => state.user);
  const dispatch = useDispatch();
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const [showLeftChevron, setShowLeftChevron] = useState(false);
  const [showRightChevron, setShowRightChevron] = useState(false);

  const navigate = useNavigate();

  let isAdmin = false;
  if (user.role.toLowerCase() === "admin") {
    isAdmin = true;
  }

  const checkScrollPosition = () => {
    if (tableWrapperRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tableWrapperRef.current;
      setShowLeftChevron(scrollLeft > 0);
      setShowRightChevron(scrollLeft < scrollWidth - clientWidth);
    }
  };

  useEffect(() => {
    const tableWrapper = tableWrapperRef.current;
    if (tableWrapper) {
      tableWrapper.addEventListener('scroll', checkScrollPosition);
      checkScrollPosition();
    }

    return () => {
      if (tableWrapper) {
        tableWrapper.removeEventListener('scroll', checkScrollPosition);
      }
    };
  }, [data]);

  const scrollTable = (direction: 'left' | 'right') => {
    if (tableWrapperRef.current) {
      const scrollAmount = tableWrapperRef.current.clientWidth * 0.3;
      const targetScroll = tableWrapperRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      
      tableWrapperRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  const highlightText = (text: string) => {
    if (!searchQuery || !text) return text;
    
    const parts = text.toString().split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchQuery.toLowerCase() ? 
        <span key={i} className="bg-yellow-100">{part}</span> : 
        part
    );
  };

  const columns = [
    columnHelper.accessor('filesolutioncode', {
      header: 'Solution Code',
      cell: info => highlightText(info.getValue() || '-'),
    }),
    columnHelper.accessor('groupname', {
      header: 'Group Name',
      cell: info => highlightText(info.getValue()),
    }),
    columnHelper.accessor('modelname', {
      header: 'Model Name',
      cell: info => highlightText(info.getValue()),
    }),
    columnHelper.accessor('groupid', {
      header: 'Group ID',
      cell: info => highlightText(info.getValue().toString()),
    }),
    columnHelper.accessor('modelid', {
      header: 'Model ID',
      cell: info => highlightText(info.getValue().toString()),
    }),
    columnHelper.accessor('assetmeta', {
      header: 'Asset Meta',
      cell: info => highlightText(info.getValue() || '-'),
    }),
    columnHelper.accessor('filepackagecode', {
      header: 'Package Code',
      cell: info => highlightText(info.getValue()),
    }),   
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => (
        <span className={`px-2 py-1 rounded-full text-sm ${
          info.getValue().toLowerCase() === 'production'
            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
            : info.getValue().toLowerCase() === 'eol'
            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
            : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
        }`}>
          {highlightText(info.getValue())}
        </span>
      ),
    }),
    columnHelper.accessor('firmwaretype', {
      header: 'Firmware Type',
      cell: info => highlightText(info.getValue()),
    }),
    columnHelper.accessor('networktype', {
      header: 'Network Type',
      cell: info => highlightText(info.getValue()),
    }),
    columnHelper.accessor('modemversion', {
      header: 'Modem Version',
      cell: info => highlightText(info.getValue()),
    }),
    columnHelper.accessor('hardwareversion', {
      header: 'Hardware Version',
      cell: info => highlightText(info.getValue()),
    }),
    columnHelper.accessor('addonhardwareversion', {
      header: 'Add-on Hardware Version',
      cell: info => highlightText(info.getValue()),
    }),
    columnHelper.accessor('networkprovider', {
      header: 'Network Provider',
      cell: info => highlightText(info.getValue()),
    }),
    columnHelper.accessor('mainfirmwarebootloader', {
      header: 'Main Firmware Bootloader',
      cell: info => highlightText(info.getValue() || '-'),
    }),
    columnHelper.accessor('mainfirmware', {
      header: 'Main Firmware',
      cell: info => highlightText(info.getValue()),
    }),
    columnHelper.accessor('mainsettingsname', {
      header: 'Main Settings Name',
      cell: info => highlightText(info.getValue() || '-'),
    }),
    columnHelper.accessor('mainsettingsid', {
      header: 'Main Settings ID',
      cell: info => highlightText(info.getValue() || '-'),
    }),
    columnHelper.accessor('coprocfirmware', {
      header: 'Coproc Firmware',
      cell: info => highlightText(info.getValue()),
    }),
    columnHelper.accessor('coprocsettingsname', {
      header: 'Coproc Settings Name',
      cell: info => {
        const value = info.getValue() || '-';
        const navigate = useNavigate();

        return value !== '-' ? (
          <div
            onClick={() => navigate('/jsonparser', { state: { value } })}
            className="flex items-center cursor-pointer text-gray-500 hover:text-blue-500"
          >
            {highlightText(value)}
            <FontAwesomeIcon icon={faExternalLinkAlt} className="w-4 h-4 ml-1" />
          </div>
        ) : (
          value
        );
      },
    }),
    columnHelper.accessor('plsign', {
      header: 'PL Sign',
      cell: info => highlightText(info.getValue() || '-'),
    }),
    columnHelper.accessor('isvalid', {
      header: 'Is Valid',
      cell: info => (
        <div className="flex items-center">
          {Boolean(info.getValue()) ? (
            <div className="bg-green-100 text-green-600 p-1 rounded-full">
              <Check className="w-4 h-4" />
            </div>
          ) : (
            <div className="bg-red-100 text-red-600 p-1 rounded-full">
              <XMark className="w-4 h-4" />
            </div>
          )}
        </div>
      ),
    }),
    columnHelper.accessor('updatedby', {
      header: 'Updated By',
      cell: info => highlightText(info.getValue() || '-'),
    }),
    columnHelper.accessor('updatedat', {
      header: 'Updated At',
      cell: info => highlightText(info.getValue() ? new Date(info.getValue()).toLocaleString() : '-'),
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
              onClick={() => setShowDeleteConfirm(props.row.original.filepackagecode)}
              className="p-1.5 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-lg hover:from-red-500 hover:to-red-600 transition-all duration-200"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      }),
    ] : []),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter: searchQuery,
    },
    onGlobalFilterChange: setSearchQuery,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const firmwareData = await firmwareApi.getFirmwareData();
      setData(firmwareData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('Data refreshed successfully');
  };

  const handleSignOut = async () => {
    await authApi.signOut();
    dispatch(resetUser())
    navigate('/');
  };

  const handleEdit = (data: FirmwareData) => {
    setFormData({
      ...data,
      isvalid: Boolean(data.isvalid),
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setFormData(initialFormData);
    setIsEditing(false);
    setShowForm(false);
    setIsNewGroup(false);
  };

  const handleDelete = async (filepackagecode: string) => {
    try {
      await firmwareApi.deleteFirmware(filepackagecode);
      await fetchData();
      toast.success('Record deleted successfully');
    } catch (error) {
      toast.error('Error deleting record');
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const updatedData = {
        ...formData,
        updatedat: Date.now(),
        updatedby: user?.email || '',
        isvalid: Boolean(formData.isvalid),
      };
      
      if (isEditing) {
        await firmwareApi.updateFirmware(updatedData);
        toast.success('Record updated successfully');
      } else {
        await firmwareApi.addFirmware(updatedData);
        toast.success('Record added successfully');
      }
      await fetchData();
      setShowForm(false);
      setFormData(initialFormData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving package:', error);
      toast.error('Failed to save package');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? e.target.checked : value,
    }));
  };

  const handleGroupSelect = (suggestion: GroupSuggestion) => {
    setIsNewGroup(!!suggestion.isNewGroup);
    setFormData(prev => ({
      ...prev,
      groupname: suggestion.groupname,
      groupid: suggestion.groupid,
      modelname: '',
      modelid: 0,
    }));
  };

  const handleModelSelect = (suggestion: ModelSuggestion) => {
    setFormData(prev => ({
      ...prev,
      modelname: suggestion.modelname,
      modelid: suggestion.modelid,
    }));
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <FormCard title="Group Information" defaultExpanded={true}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <AutocompleteInput
              value={formData.groupname}
              onChange={(value) => setFormData(prev => ({ ...prev, groupname: value }))}
              onSelect={(suggestion) => handleGroupSelect(suggestion as GroupSuggestion)}
              fetchSuggestions={firmwareApi.getGroupSuggestions}
              displayKey="groupname"
              placeholder="Enter group name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model Name
            </label>
            <AutocompleteInput
              value={formData.modelname}
              onChange={(value) => setFormData(prev => ({ ...prev, modelname: value }))}
              onSelect={(suggestion) => handleModelSelect(suggestion as ModelSuggestion)}
              fetchSuggestions={firmwareApi.getModelSuggestions}
              displayKey="modelname"
              placeholder="Enter model name"
              groupName={formData.groupname}
              isModelInput
              isNewGroup={isNewGroup}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group ID
            </label>
            <input
              type="text"
              value={formData.groupid}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model ID
            </label>
            <input
              type="text"
              value={formData.modelid}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-100 cursor-not-allowed"
            />
          </div>
        </div>
      </FormCard>

      <FormCard title="Package Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File Package Code
            </label>
            <input
              type="text"
              name="filepackagecode"
              value={formData.filepackagecode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asset Meta
            </label>
            <input
              type="text"
              name="assetmeta"
              value={formData.assetmeta}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File Solution Code
            </label>
            <input
              type="text"
              name="filesolutioncode"
              value={formData.filesolutioncode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <input
              type="text"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </FormCard>

      <FormCard title="Hardware and Firmware Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Firmware Type
            </label>
            <input
              type="text"
              name="firmwaretype"
              value={formData.firmwaretype}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Network Type
            </label>
            <input
              type="text"
              name="networktype"
              value={formData.networktype}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modem Version
            </label>
            <input
              type="text"
              name="modemversion"
              value={formData.modemversion}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hardware Version
            </label>
            <input
              type="text"
              name="hardwareversion"
              value={formData.hardwareversion}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add-on Hardware Version
            </label>
            <input
              type="text"
              name="addonhardwareversion"
              value={formData.addonhardwareversion}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Network Provider
            </label>
            <input
              type="text"
              name="networkprovider"
              value={formData.networkprovider}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Main Firmware Bootloader
            </label>
            <input
              type="text"
              name="mainfirmwarebootloader"
              value={formData.mainfirmwarebootloader}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Main Firmware
            </label>
            <input
              type="text"
              name="mainfirmware"
              value={formData.mainfirmware}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coproc Firmware
            </label>
            <input
              type="text"
              name="coprocfirmware"
              value={formData.coprocfirmware}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </FormCard>

      <FormCard title="Settings Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Main Settings Name
            </label>
            <input
              type="text"
              name="mainsettingsname"
              value={formData.mainsettingsname}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coproc Settings Name
            </label>
            <input
              type="text"
              name="coprocsettingsname"
              value={formData.coprocsettingsname}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Is Valid
            </label>
            <div className="flex items-center space-x-3">
              <div 
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  formData.isvalid ? 'bg-purple-600' : 'bg-gray-200'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, isvalid: !prev.isvalid }))}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.isvalid ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
              <span className="text-sm text-gray-500">
                {formData.isvalid ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </FormCard>

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
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
        >
          {isEditing ? 'Update Package' : 'Save Package'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="flex flex-col h-screen">
      <nav className="bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg">
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
              LAF File Packages
            </h1>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <img
                  src={user?.avatar}
                  alt="User"
                  className="w-8 h-8 rounded-full border-2 border-white"
                  onError={(e) => {
                    e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/5987/5987424.png?fit=facearea&facepad=2&w=256&h=256&q=80';
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
                  placeholder="Search packages..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
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
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(initialFormData);
                    setShowForm(true);
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add New Package
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="relative h-full">
          {showLeftChevron && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
              <button
                onClick={() => scrollTable('left')}
                className="p-2 bg-white/90 backdrop-blur-sm rounded-r-lg shadow-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          )}
          
          {showRightChevron && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
              <button
                onClick={() => scrollTable('right')}
                className="p-2 bg-white/90 backdrop-blur-sm rounded-r-lg shadow-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          )}

          <div 
            ref={tableWrapperRef}
            className="h-full overflow-auto" 
            style={{ scrollbarWidth: 'thin' }}
          >
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-full text-gray-500"
              >
                Loading...
              </motion.div>
            ) : (
              <div className="min-w-max bg-white h-full">
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
                    {table.getRowModel().rows.map(row => (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="hover:bg-gray-50"
                      >
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
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-[90vw] max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-xl">
                <h3 className="text-lg font-medium text-white">
                  {isEditing ? 'Edit Package' : 'Add New Package'}
                </h3>
                <button
                  onClick={handleCancelEdit}
                  className="text-white hover:text-gray-200 transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {renderForm()}
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
                Are you sure you want to delete this package? This action cannot be undone.
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

const initialFormData: FirmwareData = {
  filepackagecode: '',
  groupid: 0,
  groupname: '',
  modelid: 0,
  modelname: '',
  assetmeta: '',
  filesolutioncode: '',
  status: '',
  firmwaretype: '',
  networktype: '',
  modemversion: '',
  hardwareversion: '',
  addonhardwareversion: '',
  networkprovider: '',
  mainfirmwarebootloader: '',
  mainfirmware: '',
  mainsettingsname: '',
  mainsettingsid: '',
  coprocfirmware: '',
  coprocsettingsname: '',
  plsign: '',
  isvalid: false,
  updatedby: '',
  updatedat: 0,
};

export default Dashboard;