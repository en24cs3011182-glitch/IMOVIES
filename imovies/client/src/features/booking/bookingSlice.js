import { createSlice } from '@reduxjs/toolkit';
const bookingSlice = createSlice({
  name: 'booking',
  initialState: { selectedSeats: [], hold: null },
  reducers: {
    setSelectedSeats(state, action) { state.selectedSeats = action.payload; },
    setHold(state, action) { state.hold = action.payload; },
    clearHold(state) { state.hold = null; state.selectedSeats = []; },
  },
});
export const { setSelectedSeats, setHold, clearHold } = bookingSlice.actions;
export default bookingSlice.reducer;
