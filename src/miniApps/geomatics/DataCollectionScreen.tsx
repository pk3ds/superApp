import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  Platform,
  Dimensions,
  NativeSyntheticEvent,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useAppSelector, useAppDispatch } from "../../app/hooks";
import {
  addFeature,
  removeFeature,
  Feature,
  FeatureType,
  Coordinate,
} from "../../features/geomatics";
import * as turf from "@turf/turf";

const SCREEN_WIDTH = Dimensions.get("window").width;

const DRAWING_MODES: {
  type: FeatureType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { type: "point", label: "Point", icon: "pin" },
  { type: "line", label: "Line", icon: "swap-horizontal" },
  { type: "polygon", label: "Polygon", icon: "shapes-outline" },
];

interface TempFeature {
  type: FeatureType;
  coordinates: Coordinate[];
  name: string;
  description?: string;
}

// HTML template for Leaflet map
const LEAFLET_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; overflow: hidden; }
    #map { position: absolute; top: 0; left: 0; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    let map;
    let featuresLayer;
    let tempLayer;
    let currentLocationMarker;
    let drawingMode = null;
    let tempCoordinates = [];

    const FEATURE_COLORS = {
      point: '#E85A00',
      line: '#3333CC',
      polygon: '#27AE60'
    };

    function initMap() {
      map = L.map('map', {
        zoomControl: false,
        attributionControl: false
      }).setView([3.139, 101.6869], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(map);

      featuresLayer = L.layerGroup().addTo(map);
      tempLayer = L.layerGroup().addTo(map);

      map.on('click', handleMapClick);

      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'mapReady'
      }));
    }

    function handleMapClick(e) {
      if (!drawingMode) return;

      const coord = {
        latitude: e.latlng.lat,
        longitude: e.latlng.lng
      };

      if (drawingMode === 'point') {
        tempCoordinates = [coord];
        renderTempFeature();
      } else {
        tempCoordinates.push(coord);
        renderTempFeature();
      }

      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'pointAdded',
        coordinate: coord,
        drawingMode: drawingMode,
        coordinates: tempCoordinates
      }));
    }

    function renderTempFeature() {
      tempLayer.clearLayers();

      if (tempCoordinates.length === 0) return;

      const color = '#E85A00';

      if (drawingMode === 'point' && tempCoordinates.length > 0) {
        const coord = tempCoordinates[0];
        L.circleMarker([coord.latitude, coord.longitude], {
          radius: 8,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 1
        }).addTo(tempLayer);
      } else if (drawingMode === 'line' && tempCoordinates.length > 0) {
        const latlngs = tempCoordinates.map(c => [c.latitude, c.longitude]);
        L.polyline(latlngs, {
          color: color,
          weight: 3,
          dashArray: '10, 5',
          opacity: 1
        }).addTo(tempLayer);

        // Add markers at each point
        tempCoordinates.forEach(coord => {
          L.circleMarker([coord.latitude, coord.longitude], {
            radius: 5,
            fillColor: color,
            color: '#fff',
            weight: 1,
            opacity: 1,
            fillOpacity: 1
          }).addTo(tempLayer);
        });
      } else if (drawingMode === 'polygon' && tempCoordinates.length > 0) {
        const latlngs = tempCoordinates.map(c => [c.latitude, c.longitude]);
        L.polygon(latlngs, {
          color: color,
          fillColor: color,
          fillOpacity: 0.25,
          weight: 2,
          dashArray: '10, 5',
          opacity: 1
        }).addTo(tempLayer);

        // Add markers at each point
        tempCoordinates.forEach(coord => {
          L.circleMarker([coord.latitude, coord.longitude], {
            radius: 5,
            fillColor: color,
            color: '#fff',
            weight: 1,
            opacity: 1,
            fillOpacity: 1
          }).addTo(tempLayer);
        });
      }
    }

    function setDrawingMode(mode) {
      drawingMode = mode;
      tempCoordinates = [];
      tempLayer.clearLayers();
    }

    function clearDrawing() {
      drawingMode = null;
      tempCoordinates = [];
      tempLayer.clearLayers();
    }

    function renderFeatures(features) {
      featuresLayer.clearLayers();

      features.forEach(feature => {
        const color = FEATURE_COLORS[feature.type] || '#666';
        const coords = feature.coordinates.map(c => [c.latitude, c.longitude]);

        if (feature.type === 'point') {
          L.circleMarker(coords[0], {
            radius: 8,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 1
          }).bindPopup(feature.name).addTo(featuresLayer);
        } else if (feature.type === 'line') {
          L.polyline(coords, {
            color: color,
            weight: 3,
            opacity: 1
          }).bindPopup(feature.name).addTo(featuresLayer);
        } else if (feature.type === 'polygon') {
          L.polygon(coords, {
            color: color,
            fillColor: color,
            fillOpacity: 0.25,
            weight: 2,
            opacity: 1
          }).bindPopup(feature.name).addTo(featuresLayer);
        }
      });
    }

    function setView(lat, lng, zoom) {
      map.setView([lat, lng], zoom);
    }

    function fitBounds(coordinates) {
      if (coordinates.length === 0) return;
      if (coordinates.length === 1) {
        map.setView([coordinates[0].latitude, coordinates[0].longitude], 16);
      } else {
        const bounds = L.latLngBounds(coordinates.map(c => [c.latitude, c.longitude]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    }

    function setCurrentLocation(lat, lng) {
      if (currentLocationMarker) {
        map.removeLayer(currentLocationMarker);
      }

      const icon = L.divIcon({
        className: 'current-location-icon',
        html: '<div style="width: 20px; height: 20px; background: #4A90E2; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      currentLocationMarker = L.marker([lat, lng], { icon: icon }).addTo(map);
    }

    document.addEventListener('DOMContentLoaded', initMap);

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initMap);
    } else {
      initMap();
    }
  </script>
</body>
</html>
`;

interface WebViewMessage {
  type: string;
  coordinate?: Coordinate;
  drawingMode?: FeatureType;
  coordinates?: Coordinate[];
}

export default function DataCollectionScreen() {
  const dispatch = useAppDispatch();
  const webViewRef = useRef<WebView>(null);
  const currentLocation = useAppSelector(
    (state) => state.geomatics.currentLocation,
  );
  const existingFeatures = useAppSelector((state) => state.geomatics.features);

  const [drawingMode, setDrawingMode] = useState<FeatureType | null>(null);
  const [tempFeature, setTempFeature] = useState<TempFeature | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [featureName, setFeatureName] = useState("");
  const [featureDescription, setFeatureDescription] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const handleWebViewMessage = (
    event: NativeSyntheticEvent<{ data: string }>,
  ) => {
    try {
      const message: WebViewMessage = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case "mapReady":
          setMapReady(true);
          if (existingFeatures.length > 0) {
            sendFeaturesToMap();
          }
          if (currentLocation) {
            sendCurrentLocationToMap();
            setMapView(currentLocation.latitude, currentLocation.longitude, 15);
          }
          break;

        case "pointAdded":
          if (message.coordinate && message.drawingMode) {
            handlePointAdded(
              message.coordinate,
              message.drawingMode,
              message.coordinates || [],
            );
          }
          break;
      }
    } catch (error) {
      console.error("Error parsing WebView message:", error);
    }
  };

  const handlePointAdded = (
    coordinate: Coordinate,
    mode: FeatureType,
    allCoords: Coordinate[],
  ) => {
    setTempFeature((prev) => {
      if (!prev) {
        return {
          type: mode,
          coordinates: [coordinate],
          name: "",
        };
      }

      if (mode === "point") {
        return {
          ...prev,
          coordinates: [coordinate],
        };
      }

      return {
        ...prev,
        coordinates: allCoords,
      };
    });

    setIsDrawing(true);
  };

  const startDrawing = (mode: FeatureType) => {
    setDrawingMode(mode);
    setTempFeature(null);
    setIsDrawing(false);
    injectJavaScript(`setDrawingMode('${mode}');`);
  };

  const cancelDrawing = () => {
    setDrawingMode(null);
    setTempFeature(null);
    setIsDrawing(false);
    injectJavaScript(`clearDrawing();`);
  };

  const finishDrawing = () => {
    if (!tempFeature || tempFeature.coordinates.length === 0) {
      Alert.alert(
        "Error",
        "No coordinates collected. Please add points to the map.",
      );
      return;
    }

    if (drawingMode === "polygon" && tempFeature.coordinates.length < 3) {
      Alert.alert("Error", "A polygon requires at least 3 points.");
      return;
    }

    if (drawingMode === "line" && tempFeature.coordinates.length < 2) {
      Alert.alert("Error", "A line requires at least 2 points.");
      return;
    }

    setShowSaveModal(true);
  };

  const saveFeature = () => {
    if (!tempFeature) return;

    const name = featureName.trim();
    if (!name) {
      Alert.alert("Error", "Please enter a name for this feature.");
      return;
    }

    const newFeature: Feature = {
      id: `feature-${Date.now()}`,
      type: tempFeature.type,
      name,
      coordinates: tempFeature.coordinates,
      properties: {
        description: featureDescription.trim(),
        area: calculateArea(tempFeature.coordinates, tempFeature.type),
        length: calculateLength(tempFeature.coordinates, tempFeature.type),
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    dispatch(addFeature(newFeature));

    cancelDrawing();
    sendFeaturesToMap();

    setShowSaveModal(false);
    setFeatureName("");
    setFeatureDescription("");

    Alert.alert("Success", "Feature saved successfully.");
  };

  const deleteFeature = (featureId: string) => {
    Alert.alert(
      "Delete Feature",
      "Are you sure you want to delete this feature?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            dispatch(removeFeature(featureId));
            setTimeout(() => sendFeaturesToMap(), 100);
          },
        },
      ],
    );
  };

  const focusOnFeature = (feature: Feature) => {
    const coordinates = feature.coordinates;
    injectJavaScript(`fitBounds(${JSON.stringify(coordinates)});`);
  };

  const injectJavaScript = (code: string) => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(code);
    }
  };

  const sendFeaturesToMap = () => {
    injectJavaScript(`renderFeatures(${JSON.stringify(existingFeatures)});`);
  };

  const sendCurrentLocationToMap = () => {
    if (currentLocation) {
      injectJavaScript(
        `setCurrentLocation(${currentLocation.latitude}, ${currentLocation.longitude});`,
      );
    }
  };

  const setMapView = (lat: number, lng: number, zoom: number) => {
    injectJavaScript(`setView(${lat}, ${lng}, ${zoom});`);
  };

  // Update map when location changes
  useEffect(() => {
    if (mapReady && currentLocation) {
      sendCurrentLocationToMap();
    }
  }, [currentLocation, mapReady]);

  // Update map when features change
  useEffect(() => {
    if (mapReady) {
      sendFeaturesToMap();
    }
  }, [existingFeatures, mapReady]);

  const calculateArea = (
    coordinates: Coordinate[],
    type: FeatureType,
  ): string => {
    if (type !== "polygon" || coordinates.length < 3) return "N/A";

    try {
      const coords = coordinates.map((c) => [c.longitude, c.latitude]);
      const polygon = turf.polygon([coords]);
      const area = turf.area(polygon);

      if (area > 10000) {
        return `${(area / 10000).toFixed(2)} ha`;
      }
      return `${area.toFixed(2)} m²`;
    } catch (error) {
      return "N/A";
    }
  };

  const calculateLength = (
    coordinates: Coordinate[],
    type: FeatureType,
  ): string => {
    if (type === "point" || coordinates.length < 2) return "N/A";

    try {
      const coords = coordinates.map((c) => [c.longitude, c.latitude]);
      let line: ReturnType<typeof turf.lineString>;

      if (type === "polygon") {
        line = turf.lineString([...coords, coords[0]]);
      } else {
        line = turf.lineString(coords);
      }

      const length = turf.length(line, { units: "kilometers" });

      if (length < 1) {
        return `${(length * 1000).toFixed(2)} m`;
      }
      return `${length.toFixed(2)} km`;
    } catch (error) {
      return "N/A";
    }
  };

  const getFeatureColor = (type: FeatureType): string => {
    switch (type) {
      case "point":
        return "#E85A00";
      case "line":
        return "#3333CC";
      case "polygon":
        return "#27AE60";
      default:
        return "#666";
    }
  };

  const getFeatureIcon = (
    type: FeatureType,
  ): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case "point":
        return "pin";
      case "line":
        return "swap-horizontal";
      case "polygon":
        return "shapes-outline";
      default:
        return "ellipse";
    }
  };

  return (
    <View style={styles.container}>
      {/* WebView with Leaflet */}
      <WebView
        ref={webViewRef}
        source={{ html: LEAFLET_HTML }}
        style={styles.map}
        onMessage={handleWebViewMessage}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        scalesPageToFit={false}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        onLoad={() => setMapReady(true)}
      />

      {/* Drawing Mode Selector */}
      <View style={styles.modeSelector}>
        <Text style={styles.modeSelectorTitle}>Drawing Mode</Text>
        <View style={styles.modeButtons}>
          {DRAWING_MODES.map((mode) => (
            <TouchableOpacity
              key={mode.type}
              style={[
                styles.modeButton,
                drawingMode === mode.type && styles.modeButtonActive,
              ]}
              onPress={() => startDrawing(mode.type)}
            >
              <Ionicons
                name={mode.icon}
                size={20}
                color={drawingMode === mode.type ? "#fff" : "#666"}
              />
              <Text
                style={[
                  styles.modeButtonText,
                  drawingMode === mode.type && styles.modeButtonTextActive,
                ]}
              >
                {mode.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Drawing Actions */}
      {isDrawing && (
        <View style={styles.drawingActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={cancelDrawing}>
            <Ionicons name="close-circle" size={20} color="#fff" />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.finishButton} onPress={finishDrawing}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.finishButtonText}>Finish</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Current Feature Info */}
      {isDrawing && tempFeature && (
        <View style={styles.featureInfo}>
          <Text style={styles.featureInfoText}>
            Points: {tempFeature.coordinates.length}
            {drawingMode === "line" &&
              ` | Length: ${calculateLength(tempFeature.coordinates, "line")}`}
            {drawingMode === "polygon" &&
              ` | Area: ${calculateArea(tempFeature.coordinates, "polygon")}`}
          </Text>
        </View>
      )}

      {/* Feature List */}
      <View style={styles.featureListContainer}>
        <View style={styles.featureListHeader}>
          <Text style={styles.featureListTitle}>
            Collected Features ({existingFeatures.length})
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.featureList}
          contentContainerStyle={styles.featureListContent}
        >
          {existingFeatures.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="map-outline" size={40} color="#ccc" />
              <Text style={styles.emptyStateText}>
                No features collected yet
              </Text>
              <Text style={styles.emptyStateSub}>
                Select a drawing mode to start
              </Text>
            </View>
          ) : (
            existingFeatures.map((feature) => (
              <TouchableOpacity
                key={feature.id}
                style={styles.featureCard}
                onPress={() => focusOnFeature(feature)}
                onLongPress={() => deleteFeature(feature.id)}
              >
                <View
                  style={[
                    styles.featureIcon,
                    { backgroundColor: getFeatureColor(feature.type) + "20" },
                  ]}
                >
                  <Ionicons
                    name={getFeatureIcon(feature.type)}
                    size={24}
                    color={getFeatureColor(feature.type)}
                  />
                </View>
                <Text style={styles.featureName} numberOfLines={1}>
                  {feature.name}
                </Text>
                <Text style={styles.featureType}>
                  {feature.type.toUpperCase()}
                  {feature.properties?.length &&
                    ` • ${feature.properties.length}`}
                  {feature.properties?.area && ` • ${feature.properties.area}`}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      {/* Save Modal */}
      <Modal
        visible={showSaveModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Save Feature</Text>
              <TouchableOpacity onPress={() => setShowSaveModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {tempFeature && (
              <View style={styles.modalBody}>
                <View
                  style={[
                    styles.modalFeatureIcon,
                    {
                      backgroundColor: getFeatureColor(tempFeature.type) + "20",
                    },
                  ]}
                >
                  <Ionicons
                    name={getFeatureIcon(tempFeature.type)}
                    size={32}
                    color={getFeatureColor(tempFeature.type)}
                  />
                </View>
                <Text style={styles.modalFeatureType}>
                  {tempFeature.type.toUpperCase()} •{" "}
                  {tempFeature.coordinates.length} points
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={featureName}
                    onChangeText={setFeatureName}
                    placeholder="Enter feature name"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={featureDescription}
                    onChangeText={setFeatureDescription}
                    placeholder="Enter description (optional)"
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                {tempFeature.type !== "point" && (
                  <View style={styles.modalStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="list-outline" size={18} color="#666" />
                      <Text style={styles.statText}>
                        Points: {tempFeature.coordinates.length}
                      </Text>
                    </View>
                    {tempFeature.type === "line" && (
                      <View style={styles.statItem}>
                        <Ionicons
                          name="resize-outline"
                          size={18}
                          color="#666"
                        />
                        <Text style={styles.statText}>
                          Length:{" "}
                          {calculateLength(tempFeature.coordinates, "line")}
                        </Text>
                      </View>
                    )}
                    {tempFeature.type === "polygon" && (
                      <View style={styles.statItem}>
                        <Ionicons
                          name="square-outline"
                          size={18}
                          color="#666"
                        />
                        <Text style={styles.statText}>
                          Area:{" "}
                          {calculateArea(tempFeature.coordinates, "polygon")}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveFeature}
                >
                  <Text style={styles.saveButtonText}>Save Feature</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  map: {
    flex: 1,
    backgroundColor: "#e5e3df",
  },
  modeSelector: {
    position: "absolute",
    top: Platform.OS === "ios" ? 100 : 60,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  modeSelectorTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modeButtons: {
    flexDirection: "row",
    gap: 8,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: "#3333CC",
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  modeButtonTextActive: {
    color: "#fff",
  },
  drawingActions: {
    position: "absolute",
    top: Platform.OS === "ios" ? 210 : 170,
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e74c3c",
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  finishButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#27AE60",
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  finishButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  featureInfo: {
    position: "absolute",
    top: Platform.OS === "ios" ? 260 : 220,
    left: 16,
    right: 16,
    backgroundColor: "#3333CC",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  featureInfoText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
  featureListContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 5,
    maxHeight: 200,
  },
  featureListHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  featureListTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  featureList: {
    maxHeight: 140,
  },
  featureListContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  emptyState: {
    width: SCREEN_WIDTH - 32,
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#888",
    marginTop: 12,
  },
  emptyStateSub: {
    fontSize: 13,
    color: "#888",
    marginTop: 4,
  },
  featureCard: {
    width: 140,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: "#f5f5f5",
  },
  featureName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  featureType: {
    fontSize: 11,
    color: "#888",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  modalBody: {
    padding: 20,
  },
  modalFeatureIcon: {
    width: 64,
    height: 64,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 12,
    backgroundColor: "#f5f5f5",
  },
  modalFeatureType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#333",
    borderWidth: 1,
    borderColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 1,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  modalStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 1,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: "#666",
  },
  saveButton: {
    backgroundColor: "#3333CC",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
