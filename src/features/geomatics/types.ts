export interface Coordinate {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  timestamp?: number;
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
  mapSettings: MapSettings;
}
