'use client';
import { createSelector } from '@reduxjs/toolkit';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';

// Define state type for better type safety
interface GigsState {
  data: any[]; // Update `any[]` to a more specific type if possible
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: GigsState = {
  data: [],
  loading: false,
  error: null,
};

// Async thunk to fetch gigs with optional filters
export const fetchGigs = createAsyncThunk(
  'gigs/fetchGigs',
  async (
    filters: {
      categories?: string[];
      minBudget?: number;
      maxBudget?: number;
      deliveryTime?: number;
      searchText?: string;
      language?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams();

      if (filters?.categories?.length) {
        // Don't double encode - just join with commas
        params.append('categories', filters.categories.join(','));
      }
      if (filters?.minBudget !== undefined) {
        params.append('min', filters.minBudget.toString());
      }
      if (filters?.maxBudget !== undefined) {
        params.append('max', filters.maxBudget.toString());
      }
      if (filters?.deliveryTime !== undefined) {
        params.append('deliveryTime', filters.deliveryTime.toString());
      }
      if (filters?.searchText) {
        params.append('search', filters.searchText);
      }
      if (filters?.language) {
        params.append('lang', filters.language);
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/job?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      return rejectWithValue(
        axiosError.response?.data?.message || 'Failed to fetch gigs'
      );
    }
  }
);


// Create the slice
const gigsSlice = createSlice({
  name: 'gigs',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGigs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGigs.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchGigs.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default gigsSlice.reducer;

export const selectGigs = (state: { gigs: GigsState }) => state.gigs;

export const selectGigById = createSelector(
  [(state: { gigs: GigsState }) => state.gigs.data, (_, gigId: string) => gigId],
  (gigs, gigId) => gigs.find((gig) => gig._id === gigId) || null
);
