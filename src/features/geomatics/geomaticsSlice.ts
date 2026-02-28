import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GeomaticsState, Coordinate, Waypoint, Feature, MapSettings } from './types';

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
  waypoints: [],
  features: [],
  mapSettings: initialMapSettings,
  isLoading: false,
  error: null,
};

const geomaticsSlice = createSlice({
  name: 'geomatics',
  initialState,
  reducers: {
    setCurrentLocation(state, action: PayloadAction<Coordinate>) {
      state.currentLocation = action.payload;
    },
    addWaypoint(state, action: PayloadAction<Waypoint>) {
      state.waypoints.push(action.payload);
    },
    updateWaypoint(state, action: PayloadAction<{ id: string; updates: Partial<Waypoint> }>) {
      const index = state.waypoints.findIndex((w) => w.id === action.payload.id);
      if (index !== -1) {
        state.waypoints[index] = {
          ...state.waypoints[index],
          ...action.payload.updates,
          updatedAt: Date.now(),
        };
      }
    },
    removeWaypoint(state, action: PayloadAction<string>) {
      state.waypoints = state.waypoints.filter((w) => w.id !== action.payload);
    },
    addFeature(state, action: PayloadAction<Feature>) {
      state.features.push(action.payload);
    },
    updateFeature(state, action: PayloadAction<{ id: string; updates: Partial<Feature> }>) {
      const index = state.features.findIndex((f) => f.id === action.payload.id);
      if (index !== -1) {
        state.features[index] = {
          ...state.features[index],
          ...action.payload.updates,
          updatedAt: Date.now(),
        };
      }
    },
    removeFeature(state, action: PayloadAction<string>) {
      state.features = state.features.filter((f) => f.id !== action.payload);
    },
    updateMapSettings(state, action: PayloadAction<Partial<MapSettings>>) {
      state.mapSettings = {
        ...state.mapSettings,
        ...action.payload,
      };
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    clearFeatures(state) {
      state.features = [];
    },
    clearWaypoints(state) {
      state.waypoints = [];
    },
  },
});

export const {
  setCurrentLocation,
  addWaypoint,
  updateWaypoint,
  removeWaypoint,
  addFeature,
  updateFeature,
  removeFeature,
  updateMapSettings,
  setLoading,
  setError,
  clearFeatures,
  clearWaypoints,
} = geomaticsSlice.actions;

export default geomaticsSlice.reducer;
