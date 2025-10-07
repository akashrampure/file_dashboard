import { createSlice , PayloadAction } from '@reduxjs/toolkit';
import { FirmwareData } from '../../types';

interface PackageState {
    package: FirmwareData | null;
    loading: boolean;
    error: string | null;
}

const initialState: PackageState = {
    package: null,
    loading: false,
    error: null,
};

const packageSlice = createSlice({
    name: 'package',
    initialState,
    reducers: {
        setPackage: (state, action: PayloadAction<FirmwareData>) => {
            state.package = action.payload;
        },
    },
});

export const { setPackage } = packageSlice.actions;
export default packageSlice.reducer;