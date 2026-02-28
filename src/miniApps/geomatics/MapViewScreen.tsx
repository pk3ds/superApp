import React, { useState, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Platform,
  Dimensions,
  Animated,
  PanResponder,
  ScrollView,
  Linking,
} from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useAppSelector, useAppDispatch } from "../../app/hooks";
import {
  updateMapSettings,
  setCurrentLocation,
} from "../../features/geomatics/geomaticsSlice";
import { Coordinate } from "../../features/geomatics/types";
import { WorkLocation, WORK_LOCATIONS_DATA } from "./workLocations";

const { width, height } = Dimensions.get("window");

const SHEET_FULL_HEIGHT = height * 0.6;
const PEEK_HEIGHT = 90;
const COLLAPSED_Y = SHEET_FULL_HEIGHT - PEEK_HEIGHT;

const WORK_LOCATIONS: WorkLocation[] = WORK_LOCATIONS_DATA.map((loc) => ({
  ...loc,
  id: `location-${loc.name.toLowerCase().replace(/\s+/g, "-")}`,
  distance: 0,
}));

const MAP_TYPE_CONFIG = {
  standard: "standard" as const,
  satellite: "satellite" as const,
  hybrid: "hybrid" as const,
};

type MapTypeKey = keyof typeof MAP_TYPE_CONFIG;

const LEAFLET_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; overflow: hidden; }

    /* Custom Popup Styling */
    .leaflet-popup-content-wrapper {
      border-radius: 12px !important;
      box-shadow: 0 4px 16px rgba(51, 51, 204, 0.2) !important;
      overflow: hidden !important;
    }
    .leaflet-popup-content {
      margin: 0 !important;
      padding: 0 !important;
    }
    .custom-popup {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .custom-popup-header {
      background: #ffffff;
      color: #333;
      padding: 12px 16px;
      font-weight: 600;
      font-size: 15px;
    }
    .custom-popup-body {
      padding: 12px 16px;
      color: #333;
      font-size: 14px;
    }

    /* Zoom Controls - App Theme */
    .leaflet-control-zoom {
      border: none !important;
      box-shadow: 0 2px 12px rgba(51, 51, 204, 0.15) !important;
      border-radius: 12px !important;
      overflow: hidden !important;
    }
    .leaflet-control-zoom a {
      background-color: #fff !important;
      color: #3333CC !important;
      border: none !important;
      width: 40px !important;
      height: 40px !important;
      line-height: 40px !important;
      font-size: 20px !important;
      font-weight: 600 !important;
      transition: all 0.2s ease !important;
    }
    .leaflet-control-zoom a:hover,
    .leaflet-control-zoom a:focus {
      background-color: #3333CC !important;
      color: #fff !important;
    }
    .leaflet-control-zoom a:first-child {
      border-bottom: 1px solid #f0f0f0 !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    let map;
    let locationMarkerLayer;
    let userLocationMarker;

    const locationIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const userIcon = L.divIcon({
      className: '',
      html: '<div style="background:#3333CC;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    function initMap() {
      map = L.map('map', {
        center: [3.139, 101.6869],
        zoom: 13,
        zoomControl: false,
        attributionControl: false
      });

      locationMarkerLayer = L.layerGroup().addTo(map);
      updateTileLayer('standard');

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
      }
    }

    function updateTileLayer(mapType) {
      map.eachLayer(function(layer) {
        if (layer instanceof L.TileLayer) map.removeLayer(layer);
      });

      if (mapType === 'satellite' || mapType === 'hybrid') {
        L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          { attribution: 'Tiles &copy; Esri', maxZoom: 19 }
        ).addTo(map);
      } else {
        L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }
        ).addTo(map);
      }

      if (mapType === 'hybrid') {
        L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
          { maxZoom: 19 }
        ).addTo(map);
      }
    }

    function showLocations(locations) {
      locationMarkerLayer.clearLayers();
      locations.forEach(function(location) {
        var popupContent = '<div class="custom-popup">' +
          '<div class="custom-popup-header">' + location.name + '</div>' +
          '</div>';
        var m = L.marker([location.latitude, location.longitude], { icon: locationIcon })
          .addTo(locationMarkerLayer);
        m.bindPopup(popupContent, {
          className: 'custom-popup-container',
          closeButton: true,
          closeOnClick: true
        });
        m.on('click', function() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'locationClick',
              locationId: location.id
            }));
          }
        });
      });
    }

    function setCenter(lat, lng, zoom) { map.setView([lat, lng], zoom); }
    function zoomIn() { map.zoomIn(); }
    function zoomOut() { map.zoomOut(); }

    function updateUserLocation(lat, lng) {
      if (userLocationMarker) {
        userLocationMarker.setLatLng([lat, lng]);
      } else {
        userLocationMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
      }
    }

    document.addEventListener('DOMContentLoaded', initMap);
  </script>
</body>
</html>
`;

interface WebViewMessage {
  type: "mapReady" | "locationClick";
  locationId?: string;
}

async function navigateToLocation(latitude: number, longitude: number) {
  try {
    const available: { name: string; url: string }[] = [];

    const primaryUrl =
      Platform.OS === "ios"
        ? `maps://app?daddr=${latitude},${longitude}`
        : `google.navigation:q=${latitude},${longitude}`;
    const primaryName = Platform.OS === "ios" ? "Apple Maps" : "Google Maps";
    if (await Linking.canOpenURL(primaryUrl)) {
      available.push({ name: primaryName, url: primaryUrl });
    }

    const wazeUrl = `waze://?ll=${latitude},${longitude}&navigate=yes`;
    if (await Linking.canOpenURL(wazeUrl)) {
      available.push({ name: "Waze", url: wazeUrl });
    }

    if (available.length === 0) {
      await Linking.openURL(`geo:0,0?q=${latitude},${longitude}`);
      return;
    }

    if (available.length === 1) {
      await Linking.openURL(available[0].url);
      return;
    }

    Alert.alert(
      "Open with",
      undefined,
      [
        ...available.map((app) => ({
          text: app.name,
          onPress: () => Linking.openURL(app.url),
        })),
        { text: "Cancel", style: "cancel" as const },
      ]
    );
  } catch {
    Alert.alert("Navigation Error", "Could not open maps app.");
  }
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export default function MapViewScreen() {
  const dispatch = useAppDispatch();
  const webViewRef = useRef<WebView>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [workLocations, setWorkLocations] = useState<WorkLocation[]>([]);
  const [isLocationsLoading, setIsLocationsLoading] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null,
  );
  const locationListRef = useRef<ScrollView>(null);
  const sheetAutoShownRef = useRef(false);

  const { currentLocation, mapSettings } = useAppSelector(
    (state) => state.geomatics,
  );
  const { mapType } = mapSettings;

  // Bottom sheet animation
  const translateY = useRef(new Animated.Value(SHEET_FULL_HEIGHT)).current;
  const lastTranslateY = useRef(SHEET_FULL_HEIGHT);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const snapSheet = useCallback(
    (expand: boolean) => {
      const toValue = expand ? 0 : COLLAPSED_Y;
      lastTranslateY.current = toValue;
      setSheetExpanded(expand);
      Animated.spring(translateY, {
        toValue,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    },
    [translateY],
  );

  const showSheet = useCallback(() => {
    lastTranslateY.current = COLLAPSED_Y;
    Animated.spring(translateY, {
      toValue: COLLAPSED_Y,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
      onPanResponderGrant: () => {
        translateY.stopAnimation();
      },
      onPanResponderMove: (_, gs) => {
        const newY = lastTranslateY.current + gs.dy;
        translateY.setValue(Math.max(0, Math.min(COLLAPSED_Y, newY)));
      },
      onPanResponderRelease: (_, gs) => {
        const currentY = lastTranslateY.current + gs.dy;
        if (gs.vy < -0.5 || currentY < COLLAPSED_Y * 0.5) {
          lastTranslateY.current = 0;
          setSheetExpanded(true);
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        } else {
          lastTranslateY.current = COLLAPSED_Y;
          setSheetExpanded(false);
          Animated.spring(translateY, {
            toValue: COLLAPSED_Y,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        }
      },
    }),
  ).current;

  const executeJS = (code: string) => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        (function() { try { ${code} } catch(e) { console.error('JS error:', e); } })();
        true;
      `);
    }
  };

  React.useEffect(() => {
    requestLocationPermission();
  }, []);

  // If location is already in Redux (e.g. returning to screen), load immediately
  React.useEffect(() => {
    if (currentLocation && workLocations.length === 0) {
      loadNearbyLocations(currentLocation);
    }
  }, []);

  React.useEffect(() => {
    if (isMapReady) executeJS(`updateTileLayer('${mapType}')`);
  }, [mapType, isMapReady]);

  React.useEffect(() => {
    if (isMapReady && currentLocation) {
      executeJS(
        `updateUserLocation(${currentLocation.latitude}, ${currentLocation.longitude})`,
      );
    }
  }, [currentLocation, isMapReady]);

  React.useEffect(() => {
    if (isMapReady && workLocations.length > 0) {
      executeJS(`showLocations(${JSON.stringify(workLocations)})`);
      if (!sheetAutoShownRef.current) {
        sheetAutoShownRef.current = true;
        showSheet();
      }
    }
  }, [workLocations, isMapReady]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        getCurrentLocation();
      } else {
        Alert.alert("Permission Denied", "Location permission is required.");
      }
    } catch (error) {
      console.error("Error requesting location permission:", error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) {
        const cached: Coordinate = {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
          altitude: lastKnown.coords.altitude ?? undefined,
          accuracy: lastKnown.coords.accuracy ?? undefined,
          timestamp: lastKnown.timestamp,
        };
        dispatch(setCurrentLocation(cached));
        if (isMapReady)
          executeJS(`setCenter(${cached.latitude}, ${cached.longitude}, 15)`);
        loadNearbyLocations(cached);
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coordinate: Coordinate = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude ?? undefined,
        accuracy: location.coords.accuracy ?? undefined,
        timestamp: location.timestamp,
      };
      dispatch(setCurrentLocation(coordinate));
      if (isMapReady)
        executeJS(
          `setCenter(${coordinate.latitude}, ${coordinate.longitude}, 15)`,
        );
      loadNearbyLocations(coordinate);
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  const loadNearbyLocations = (location: Coordinate) => {
    setIsLocationsLoading(true);
    try {
      // Calculate distances for work locations
      const locationsWithDistance = WORK_LOCATIONS.map((workLocation) => {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          workLocation.latitude,
          workLocation.longitude,
        );
        return { ...workLocation, distance };
      });
      setWorkLocations(
        locationsWithDistance.sort((a, b) => a.distance - b.distance),
      );
    } catch (err) {
      console.error("Error loading locations:", err);
    } finally {
      setIsLocationsLoading(false);
    }
  };

  function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const message: WebViewMessage = JSON.parse(event.nativeEvent.data);
      switch (message.type) {
        case "mapReady":
          setIsMapReady(true);
          if (currentLocation) {
            executeJS(
              `setCenter(${currentLocation.latitude}, ${currentLocation.longitude}, 15)`,
            );
            executeJS(
              `updateUserLocation(${currentLocation.latitude}, ${currentLocation.longitude})`,
            );
          }
          break;
        case "locationClick":
          if (message.locationId) {
            setSelectedLocationId(message.locationId);
            snapSheet(true);
          }
          break;
      }
    } catch (error) {
      console.error("Error parsing WebView message:", error);
    }
  };

  const MapTypeButton = ({
    type,
    label,
  }: {
    type: MapTypeKey;
    label: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.mapTypeButton,
        mapType === type && styles.mapTypeButtonActive,
      ]}
      onPress={() => dispatch(updateMapSettings({ mapType: type }))}
    >
      <Text
        style={[
          styles.mapTypeButtonText,
          mapType === type && styles.mapTypeButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: LEAFLET_HTML }}
        style={styles.map}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={false}
        scrollEnabled={false}
        onLoad={() => console.log("WebView loaded")}
        onError={(error) => console.error("WebView error:", error)}
      />

      {/* Map Controls */}
      <View style={[styles.controlsContainer, { top: 16 }]}>
        <View style={styles.zoomControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => executeJS("zoomIn()")}
          >
            <Ionicons name="add" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.controlDivider} />
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => executeJS("zoomOut()")}
          >
            <Ionicons name="remove" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.centerButton}
          onPress={() => {
            if (currentLocation) {
              executeJS(
                `setCenter(${currentLocation.latitude}, ${currentLocation.longitude}, 15)`,
              );
            } else {
              getCurrentLocation();
            }
          }}
        >
          <Ionicons name="navigate" size={24} color="#3333CC" />
        </TouchableOpacity>
      </View>

      {/* Map Type Selector */}
      <View style={[styles.mapTypeContainer, { top: 16 }]}>
        <MapTypeButton type="standard" label="Standard" />
        <MapTypeButton type="satellite" label="Satellite" />
        <MapTypeButton type="hybrid" label="Hybrid" />
      </View>

      {/* Location Bottom Sheet */}
      <Animated.View
        style={[styles.bottomSheet, { transform: [{ translateY }] }]}
      >
        <View {...panResponder.panHandlers} style={styles.sheetHandle}>
          <View style={styles.handleBar} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Nearby TM Locations</Text>
              <Text style={styles.sheetSubtitle}>
                {isLocationsLoading
                  ? "Loading..."
                  : workLocations.length > 0
                    ? `${workLocations.length} TM locations found`
                    : "Pull up to see results"}
              </Text>
            </View>
            <View style={styles.sheetHeaderActions}>
              <View style={styles.legendRow}>
                <View style={styles.legendDot} />
                <Text style={styles.legendText}>TM Location</Text>
              </View>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={() =>
                  currentLocation && loadNearbyLocations(currentLocation)
                }
                disabled={isLocationsLoading}
              >
                <Ionicons
                  name={isLocationsLoading ? "sync" : "refresh"}
                  size={18}
                  color="#3333CC"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView
          ref={locationListRef}
          style={styles.locationList}
          contentContainerStyle={styles.locationListContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={sheetExpanded}
        >
          {workLocations.length === 0 && !isLocationsLoading && (
            <Text style={styles.emptyText}>No TM locations found.</Text>
          )}
          {workLocations.map((location) => (
            <TouchableOpacity
              key={location.id}
              style={[
                styles.locationCard,
                selectedLocationId === location.id &&
                  styles.locationCardSelected,
              ]}
              onPress={() => {
                setSelectedLocationId(location.id);
                executeJS(
                  `setCenter(${location.latitude}, ${location.longitude}, 17)`,
                );
                snapSheet(false);
              }}
              activeOpacity={0.75}
            >
              <View style={styles.locationCardContent}>
                <Ionicons name="location" size={22} color="#16a34a" />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName} numberOfLines={1}>
                    {location.name}
                  </Text>
                  <Text style={styles.locationDistance}>
                    {formatDistance(location.distance)} away
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() =>
                    navigateToLocation(location.latitude, location.longitude)
                  }
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="navigate" size={18} color="#3333CC" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  map: { width, height },
  controlsContainer: {
    position: "absolute",
    right: 16,
    gap: 12,
  },
  zoomControls: {
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  controlButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  controlDivider: { height: 1, backgroundColor: "#e0e0e0" },
  centerButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 3,
  },
  mapTypeContainer: {
    position: "absolute",
    left: 16,
    right: 76,
    flexDirection: "row",
    gap: 8,
  },
  mapTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 3,
  },
  mapTypeButtonActive: { backgroundColor: "#3333CC" },
  mapTypeButtonText: { fontSize: 12, fontWeight: "600", color: "#333" },
  mapTypeButtonTextActive: { color: "#fff" },
  // Bottom sheet
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_FULL_HEIGHT,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 10,
  },
  sheetHandle: { paddingBottom: 4 },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sheetTitle: { fontSize: 17, fontWeight: "700", color: "#333" },
  sheetSubtitle: { fontSize: 12, color: "#888", marginTop: 2 },
  sheetHeaderActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#16a34a",
  },
  legendText: { fontSize: 12, color: "#666" },
  refreshButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f0f4ff",
    justifyContent: "center",
    alignItems: "center",
  },
  locationList: { flex: 1 },
  locationListContent: { padding: 12, gap: 8 },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
    fontSize: 14,
  },
  locationCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },
  locationCardSelected: { borderColor: "#16a34a", backgroundColor: "#f0fdf4" },
  locationCardContent: { flexDirection: "row", alignItems: "center", gap: 10 },
  locationInfo: { flex: 1 },
  locationName: { fontSize: 15, fontWeight: "600", color: "#333" },
  locationDistance: { fontSize: 13, color: "#16a34a", marginTop: 2 },
  navButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f0f4ff",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
});
