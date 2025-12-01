// FrontEnd/reducers/user.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  connected: false,
  username: '',
  bestScore: 0,
  accessToken: null,
  refreshToken: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    connect: (state, action) => {
      const { username, bestScore = 0, accessToken, refreshToken } = action.payload;
      state.connected = true;
      state.username = username;
      state.bestScore = bestScore;
      state.accessToken = accessToken || null;
      state.refreshToken = refreshToken || null;
    },
    setAccessToken: (state, action) => {
      state.accessToken = action.payload || null;
    },
    logout: (state) => {
      state.connected = false;
      state.username = '';
      state.bestScore = 0;
      state.accessToken = null;
      state.refreshToken = null;
    },
    setBestScore: (state, action) => {
      state.bestScore = action.payload ?? 0;
    },
  },
});

export const { connect, logout, setAccessToken, setBestScore } = userSlice.actions;
export default userSlice.reducer;