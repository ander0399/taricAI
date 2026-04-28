import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchUsers = createAsyncThunk('team/fetchUsers', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/users');
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Error al cargar usuarios.');
  }
});

export const updateUserRole = createAsyncThunk('team/updateRole', async ({ userId, nuevoRol }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/users/${userId}/role`, { nuevoRol });
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Error al actualizar rol.');
  }
});

export const deactivateUser = createAsyncThunk('team/deactivate', async (userId, { rejectWithValue }) => {
  try {
    await api.delete(`/users/${userId}`);
    return userId;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Error al desactivar usuario.');
  }
});

export const sendInvitation = createAsyncThunk('team/sendInvitation', async ({ email, rolAsignado }, { rejectWithValue }) => {
  try {
    const res = await api.post('/invitations/send', { email, rolAsignado });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Error al enviar invitación.');
  }
});

const teamSlice = createSlice({
  name: 'team',
  initialState: { users: [], loading: false, error: null, actionError: null, actionSuccess: null },
  reducers: {
    clearTeamMessages(state) {
      state.actionError = null;
      state.actionSuccess = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending,  (state) => { state.loading = true; state.error = null; })
      .addCase(fetchUsers.fulfilled,(state, { payload }) => { state.loading = false; state.users = payload; })
      .addCase(fetchUsers.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })

      .addCase(updateUserRole.fulfilled, (state, { payload }) => {
        const idx = state.users.findIndex((u) => u.id === payload.id);
        if (idx !== -1) state.users[idx] = payload;
        state.actionSuccess = 'Rol actualizado correctamente.';
      })
      .addCase(updateUserRole.rejected, (state, { payload }) => { state.actionError = payload; })

      .addCase(deactivateUser.fulfilled, (state, { payload }) => {
        state.users = state.users.filter((u) => u.id !== payload);
        state.actionSuccess = 'Usuario desactivado.';
      })
      .addCase(deactivateUser.rejected, (state, { payload }) => { state.actionError = payload; })

      .addCase(sendInvitation.fulfilled, (state) => { state.actionSuccess = 'Invitación enviada correctamente.'; })
      .addCase(sendInvitation.rejected,  (state, { payload }) => { state.actionError = payload; });
  },
});

export const { clearTeamMessages } = teamSlice.actions;
export default teamSlice.reducer;
