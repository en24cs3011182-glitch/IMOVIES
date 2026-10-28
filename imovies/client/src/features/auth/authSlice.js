import { createSlice } from '@reduxjs/toolkit';

const readJSON = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
};

const authSlice = createSlice({
  name: 'auth',
  initialState: { token: localStorage.getItem('imovies_token'), user: readJSON('imovies_user') },
  reducers: {
    setCredentials(state, action) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem('imovies_token', state.token);
      localStorage.setItem('imovies_user', JSON.stringify(state.user));
    },
    logout(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem('imovies_token');
      localStorage.removeItem('imovies_user');
    },
    setUser(state, action) {
      state.user = action.payload;
      localStorage.setItem('imovies_user', JSON.stringify(state.user));
    },
  },
});
export const { setCredentials, logout, setUser } = authSlice.actions;
export default authSlice.reducer;
