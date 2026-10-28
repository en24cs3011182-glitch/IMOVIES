import { configureStore } from '@reduxjs/toolkit';
import auth from '../features/auth/authSlice';
import movies from '../features/movies/moviesSlice';
import booking from '../features/booking/bookingSlice';
export const store = configureStore({ reducer: { auth, movies, booking } });
