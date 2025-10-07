import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FirmwareData } from '../../types';

interface RecordsState {
    package: FirmwareData | null;
    loading: boolean;
    error: string | null;
    searchTerm: string;
    selectedRecord: { id: string; name: string } | null;
    filteredRecords: string[];
    isLoading: boolean;
    allRecords: string[];
}

const initialState: RecordsState = {
    package: null,
    loading: false,
    error: null,
    searchTerm: '',
    selectedRecord: null,
    filteredRecords: [],
    isLoading: false,
    allRecords: []
};

const recordsSlice = createSlice({
    name: 'records',
    initialState,
    reducers: {
        setPackage: (state, action: PayloadAction<FirmwareData>) => {
            state.package = action.payload;
        },
        setSearchTerm: (state, action: PayloadAction<string>) => {
            state.searchTerm = action.payload;
        },
        setSelectedRecord: (state, action: PayloadAction<{ id: string; name: string } | null>) => {
            state.selectedRecord = action.payload;
        },
        setAllRecords: (state, action: PayloadAction<string[]>) => {
            state.allRecords = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        setFilteredRecords: (state, action: PayloadAction<string[]>) => {
            state.filteredRecords = action.payload;
        }
    },
});

export const { 
    setPackage, 
    setSearchTerm, 
    setSelectedRecord, 
    setAllRecords, 
    setLoading, 
    setError, 
    setFilteredRecords 
} = recordsSlice.actions;

export default recordsSlice.reducer;