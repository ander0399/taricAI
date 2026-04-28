import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const TOKEN_KEY = 'taricai_token';
const USER_KEY  = 'taricai_user';

// Carga la sesión guardada en LocalStorage al iniciar la app
const savedUser  = JSON.parse(localStorage.getItem(USER_KEY)  || 'null');
const savedToken = localStorage.getItem(TOKEN_KEY) || null;

export const registerOwner = createAsyncThunk('auth/registerOwner', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/register-owner', data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Error al registrar.');
  }
});

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', credentials);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Credenciales inválidas.');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:    savedUser,
    company: savedUser ? JSON.parse(localStorage.getItem('taricai_company') || 'null') : null,
    token:   savedToken,
    loading: false,
    error:   null,
  },
  reducers: {
    logout(state) {
      state.user    = null;
      state.company = null;
      state.token   = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem('taricai_company');
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const pending  = (state)        => { state.loading = true;  state.error = null; };
    const rejected = (state, action) => { state.loading = false; state.error = action.payload; };
    const fulfilled = (state, action) => {
      state.loading = false;
      state.token   = action.payload.token;
      state.user    = action.payload.user;
      state.company = action.payload.company;
      localStorage.setItem(TOKEN_KEY, action.payload.token);
      localStorage.setItem(USER_KEY,  JSON.stringify(action.payload.user));
      localStorage.setItem('taricai_company', JSON.stringify(action.payload.company));
    };

    builder
      .addCase(registerOwner.pending,  pending)
      .addCase(registerOwner.rejected, rejected)
      .addCase(registerOwner.fulfilled, fulfilled)
      .addCase(login.pending,  pending)
      .addCase(login.rejected, rejected)
      .addCase(login.fulfilled, fulfilled);
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
