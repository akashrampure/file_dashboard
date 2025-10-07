import { createSlice , PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';

interface UserState {
    email:string,
    role:string,
    avatar:string,
    isAuthenticated: boolean
}

const initialState: UserState = {
    email: '',
    role:'',
    avatar:'',
    isAuthenticated: false
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
      setUser: (state, action: PayloadAction<User>) => {
        state.email = action.payload.email || '';
        state.role = action.payload.role || '';
        state.avatar = action.payload.avatar || '';
        state.isAuthenticated = action.payload.isAuthenticated !== undefined ? action.payload.isAuthenticated : false;
      },
      resetUser: () => {
        return initialState; 
      },
    },
  });
  
  export const { setUser, resetUser } = userSlice.actions;
  export default userSlice.reducer;