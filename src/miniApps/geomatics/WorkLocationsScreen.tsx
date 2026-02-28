import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Linking, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppSelector } from "../../app/hooks";
import { Coordinate } from "../../features/geomatics/types";
import { WorkLocation, WORK_LOCATIONS_DATA } from "./workLocations";

/**
 * Calculate Haversine distance between two coordinates in meters
 */
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

/**
 * Calculate distances for all work locations based on user's current location
 */
function calculateDistances(
  locations: Omit<WorkLocation, "id" | "distance">[],
  userLocation: Coordinate | null,
): WorkLocation[] {
  if (!userLocation) {
    return locations.map((location, index) => ({
      ...location,
      id: `location-${index}`,
      distance: 0,
    }));
  }

  return locations
    .map((location) => ({
      ...location,
      id: `location-${location.name.toLowerCase().replace(/\s+/g, "-")}`,
      distance: calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        location.latitude,
        location.longitude,
      ),
    }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Handle navigation to location in external maps app
 */
async function handleNavigateToLocation(latitude: number, longitude: number) {
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
  } catch (error) {
    console.error("Error opening maps:", error);
    Alert.alert(
      "Navigation Error",
      "Could not open maps app. Please check if a maps app is installed.",
    );
  }
}

export default function WorkLocationsScreen() {
  const [locations, setLocations] = React.useState<WorkLocation[]>([]);

  // Get current location from Redux state
  const currentLocation = useAppSelector(
    (state) => state.geomatics.currentLocation,
  );

  /**
   * Update locations when current location changes
   */
  useEffect(() => {
    const updatedLocations = calculateDistances(
      WORK_LOCATIONS_DATA,
      currentLocation,
    );
    setLocations(updatedLocations);
  }, [currentLocation]);

  /**
   * Format distance for display
   */
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>Company Locations</Text>
        <Text style={styles.subtitle}>Nearby TM workplace locations</Text>
      </View>

      {/* Results List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsCount}>
            {locations.length} workplace location
            {locations.length !== 1 ? "s" : ""} available
          </Text>

          {locations.map((location) => (
            <View key={location.id} style={styles.locationCard}>
              <View style={styles.locationContent}>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{location.name}</Text>
                  <View style={styles.locationDetails}>
                    {currentLocation ? (
                      <Text style={styles.distanceText}>
                        {formatDistance(location.distance)} away
                      </Text>
                    ) : (
                      <Text style={styles.distanceText}>
                        Enable location to see distance
                      </Text>
                    )}
                    <Text style={styles.coordinateText}>
                      {location.latitude.toFixed(6)},{" "}
                      {location.longitude.toFixed(6)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.navigationButton}
                  onPress={() =>
                    handleNavigateToLocation(
                      location.latitude,
                      location.longitude,
                    )
                  }
                >
                  <Ionicons name="navigate" size={24} color="#3333CC" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* No Location State */}
      {!currentLocation && (
        <View style={styles.noLocationContainer}>
          <Text style={styles.noLocationText}>
            Enable location services to see distances to TM workplace locations.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  resultsContainer: {
    gap: 12,
  },
  resultsCount: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
    marginBottom: 8,
  },
  locationCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  locationContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  locationDetails: {
    gap: 4,
  },
  navigationButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  distanceText: {
    fontSize: 14,
    color: "#3333CC",
    fontWeight: "500",
  },
  coordinateText: {
    fontSize: 12,
    color: "#888",
  },
  noLocationContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff8e1",
    borderTopWidth: 1,
    borderTopColor: "#ffe0b2",
    padding: 16,
  },
  noLocationText: {
    fontSize: 14,
    color: "#f57c00",
    textAlign: "center",
  },
});
