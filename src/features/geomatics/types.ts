export interface Coordinate {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  timestamp?: number;
}

export interface Waypoint {
  id: string;
  name: string;
  coordinate: Coordinate;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export type FeatureType = 'point' | 'line' | 'polygon' | 'marker';

export interface Feature {
  id: string;
  type: FeatureType;
  name: string;
  coordinates: Coordinate[];
  properties?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface MapSettings {
  showUserLocation: boolean;
  followUserLocation: boolean;
  mapType: 'standard' | 'satellite' | 'hybrid';
  zoomLevel: number;
  showCompass: boolean;
  showScale: boolean;
  showTraffic: boolean;
}

export interface GeomaticsState {
  currentLocation: Coordinate | null;
  waypoints: Waypoint[];
  features: Feature[];
  mapSettings: MapSettings;
  isLoading: boolean;
  error: string | null;
}
