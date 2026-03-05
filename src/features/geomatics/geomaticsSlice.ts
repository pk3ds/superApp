import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GeomaticsState, Coordinate, MapSettings } from './types';

const initialMapSettings: MapSettings = {
  showUserLocation: true,
  followUserLocation: false,
  mapType: 'standard',
  zoomLevel: 15,
  showCompass: true,
  showScale: true,
  showTraffic: false,
};

const initialState: GeomaticsState = {
  currentLocation: null,
  mapSettings: initialMapSettings,
};

const geomaticsSlice = createSlice({
  name: 'geomatics',
  initialState,
  reducers: {
    setCurrentLocation(state, action: PayloadAction<Coordinate>) {
      state.currentLocation = action.payload;
    },
    updateMapSettings(state, action: PayloadAction<Partial<MapSettings>>) {
      state.mapSettings = {
        ...state.mapSettings,
        ...action.payload,
      };
    },
  },
});

export const { setCurrentLocation, updateMapSettings } = geomaticsSlice.actions;

export default geomaticsSlice.reducer;
