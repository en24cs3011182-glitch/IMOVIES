import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../api/http';

export const fetchMovies = createAsyncThunk('movies/fetch', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/movies', { params });
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Could not load movies');
  }
});

const moviesSlice = createSlice({
  name: 'movies',
  initialState: { items: [], pagination: { page: 1, limit: 12, total: 0, pages: 0 }, loading: false, error: null },
  reducers: { clearMovies(state) { state.items = []; state.error = null; } },
  extraReducers: (builder) => builder
    .addCase(fetchMovies.pending, (state) => { state.loading = true; state.error = null; })
    .addCase(fetchMovies.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload.items;
      state.pagination = action.payload.pagination;
    })
    .addCase(fetchMovies.rejected, (state, action) => { state.loading = false; state.error = action.payload; }),
});
export const { clearMovies } = moviesSlice.actions;
export default moviesSlice.reducer;
