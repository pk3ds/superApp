import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import {
  setCurrentLocation,
  addWaypoint,
  removeWaypoint,
} from '../../features/geomatics/geomaticsSlice';
import { Waypoint, Coordinate } from '../../features/geomatics/types';

export default function GPSToolsScreen() {
  const dispatch = useAppDispatch();
  const currentLocation = useAppSelector((state) => state.geomatics.currentLocation);
  const waypoints = useAppSelector((state) => state.geomatics.waypoints);

  const [heading, setHeading] = useState<number>(0);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const [headingSubscription, setHeadingSubscription] = useState<Location.LocationSubscription | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    requestPermissions();
    return () => {
      if (locationSubscription) locationSubscription.remove();
      if (headingSubscription) headingSubscription.remove();
    };
  }, []);

  const requestPermissions = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Location permission is required to use GPS tools.'
      );
    }
  };

  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required.');
      return;
    }

    setIsTracking(true);

    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 1,
        timeInterval: 1000,
      },
      (location) => {
        const coordinate: Coordinate = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude ?? undefined,
          accuracy: location.coords.accuracy ?? undefined,
          timestamp: location.timestamp,
        };
        dispatch(setCurrentLocation(coordinate));
      }
    );
    setLocationSubscription(sub);

    const headingSub = await Location.watchHeadingAsync((headingData) => {
      setHeading(headingData.trueHeading || headingData.magHeading || 0);
    });
    setHeadingSubscription(headingSub);
  };

  const stopTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    if (headingSubscription) {
      headingSubscription.remove();
      setHeadingSubscription(null);
    }
    setIsTracking(false);
  };

  const saveCurrentLocationAsWaypoint = () => {
    if (!currentLocation) {
      Alert.alert('No Location', 'Please start tracking to get your current location.');
      return;
    }

    const waypointName = `Waypoint ${waypoints.length + 1}`;
    const newWaypoint: Waypoint = {
      id: `wp-${Date.now()}`,
      name: waypointName,
      coordinate: currentLocation,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    dispatch(addWaypoint(newWaypoint));
    Alert.alert('Waypoint Saved', `${waypointName} has been saved successfully.`);
  };

  const handleDeleteWaypoint = (waypoint: Waypoint) => {
    Alert.alert(
      'Delete Waypoint',
      `Are you sure you want to delete "${waypoint.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(removeWaypoint(waypoint.id)),
        },
      ]
    );
  };

  const formatCoordinate = (coord: number, type: 'lat' | 'long') => {
    const degrees = Math.floor(coord);
    const minutesDecimal = (coord - degrees) * 60;
    const minutes = Math.floor(minutesDecimal);
    const seconds = ((minutesDecimal - minutes) * 60).toFixed(1);
    const direction = type === 'lat' ? (coord >= 0 ? 'N' : 'S') : coord >= 0 ? 'E' : 'W';
    return `${degrees}°${minutes}'${seconds}"${direction}`;
  };

  const getCardinalDirection = (degrees: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>GPS Tools</Text>

      {/* Tracking Control */}
      <TouchableOpacity
        style={[styles.trackingButton, isTracking && styles.trackingButtonActive]}
        onPress={isTracking ? stopTracking : startTracking}
      >
        <Ionicons
          name={isTracking ? 'stop-circle' : 'play-circle'}
          size={24}
          color="#fff"
        />
        <Text style={styles.trackingButtonText}>
          {isTracking ? 'Stop Tracking' : 'Start Tracking'}
        </Text>
      </TouchableOpacity>

      {/* Compass Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Compass</Text>
        <View style={styles.compassContainer}>
          <View style={styles.compassRing}>
            <View
              style={[
                styles.compassNeedle,
                { transform: [{ rotate: `${heading}deg` }] },
              ]}
            >
              <View style={styles.compassNeedleNorth} />
              <View style={styles.compassNeedleSouth} />
            </View>
            <View style={styles.compassCenter}>
              <Text style={styles.compassText}>{getCardinalDirection(heading)}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.compassDegrees}>
          {Math.round(heading)}° {getCardinalDirection(heading)}
        </Text>
      </View>

      {/* Location Information */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="location" size={20} color="#3333CC" />
          <Text style={styles.cardTitle}>Current Location</Text>
        </View>

        {currentLocation ? (
          <View style={styles.locationInfo}>
            <InfoRow
              label="Latitude"
              value={currentLocation.latitude.toFixed(6)}
              formatted={formatCoordinate(currentLocation.latitude, 'lat')}
            />
            <InfoRow
              label="Longitude"
              value={currentLocation.longitude.toFixed(6)}
              formatted={formatCoordinate(currentLocation.longitude, 'long')}
            />
            {currentLocation.altitude !== undefined && (
              <InfoRow
                label="Altitude"
                value={`${currentLocation.altitude.toFixed(1)} m`}
              />
            )}
            {currentLocation.accuracy !== undefined && (
              <InfoRow
                label="Accuracy"
                value={`±${currentLocation.accuracy.toFixed(1)} m`}
              />
            )}
            <InfoRow
              label="Timestamp"
              value={new Date(currentLocation.timestamp || Date.now()).toLocaleString()}
            />
          </View>
        ) : (
          <View style={styles.noLocationContainer}>
            <Ionicons name="location-outline" size={48} color="#ccc" />
            <Text style={styles.noLocationText}>
              {isTracking ? 'Acquiring location...' : 'Start tracking to see location'}
            </Text>
            {isTracking && <ActivityIndicator color="#3333CC" style={styles.loader} />}
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.saveButton,
            !currentLocation && styles.saveButtonDisabled,
          ]}
          onPress={saveCurrentLocationAsWaypoint}
          disabled={!currentLocation}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Save Current Location as Waypoint</Text>
        </TouchableOpacity>
      </View>

      {/* Waypoints List */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="map-marker" size={20} color="#E85A00" />
          <Text style={styles.cardTitle}>Waypoints</Text>
          <Text style={styles.waypointCount}>({waypoints.length})</Text>
        </View>

        {waypoints.length === 0 ? (
          <View style={styles.noWaypointsContainer}>
            <Ionicons name="map-marker-outline" size={48} color="#ccc" />
            <Text style={styles.noWaypointsText}>No waypoints saved yet</Text>
            <Text style={styles.noWaypointsSubtext}>
              Save your current location to create a waypoint
            </Text>
          </View>
        ) : (
          <View style={styles.waypointList}>
            {waypoints.map((waypoint) => (
              <TouchableOpacity
                key={waypoint.id}
                style={styles.waypointItem}
                onLongPress={() => handleDeleteWaypoint(waypoint)}
              >
                <View style={styles.waypointIcon}>
                  <Ionicons name="location" size={20} color="#E85A00" />
                </View>
                <View style={styles.waypointInfo}>
                  <Text style={styles.waypointName}>{waypoint.name}</Text>
                  <Text style={styles.waypointCoords}>
                    {waypoint.coordinate.latitude.toFixed(6)},{' '}
                    {waypoint.coordinate.longitude.toFixed(6)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteWaypoint(waypoint)}
                >
                  <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {waypoints.length > 0 && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={() => {
              Alert.alert(
                'Clear All Waypoints',
                'Are you sure you want to delete all waypoints?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: () => dispatch(removeWaypoint('CLEAR_ALL')),
                  },
                ]
              );
            }}
          >
            <Text style={styles.clearAllText}>Clear All Waypoints</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoNote}>
        <Ionicons name="information-circle" size={16} color="#888" />
        <Text style={styles.infoNoteText}>
          Long press waypoints or use the trash icon to delete them
        </Text>
      </View>
    </ScrollView>
  );
}

function InfoRow({
  label,
  value,
  formatted,
}: {
  label: string;
  value: string;
  formatted?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabelContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <View style={styles.infoValueContainer}>
        <Text style={styles.infoValue}>{value}</Text>
        {formatted && <Text style={styles.infoFormatted}>{formatted}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  trackingButton: {
    backgroundColor: '#3333CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  trackingButtonActive: {
    backgroundColor: '#e74c3c',
  },
  trackingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
  },
  waypointCount: {
    fontSize: 14,
    color: '#888',
    marginLeft: 4,
  },
  compassContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  compassRing: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#fafafa',
  },
  compassNeedle: {
    position: 'absolute',
    width: 4,
    height: 120,
    alignItems: 'center',
  },
  compassNeedleNorth: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 60,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#3333CC',
  },
  compassNeedleSouth: {
    position: 'absolute',
    bottom: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 60,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#333',
  },
  compassCenter: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  compassText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  compassDegrees: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  locationInfo: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabelContainer: {
    width: 100,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  infoValueContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  infoFormatted: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  noLocationContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noLocationText: {
    fontSize: 15,
    color: '#888',
    marginTop: 12,
    textAlign: 'center',
  },
  loader: {
    marginTop: 12,
  },
  saveButton: {
    backgroundColor: '#3333CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  noWaypointsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noWaypointsText: {
    fontSize: 16,
    color: '#888',
    marginTop: 12,
  },
  noWaypointsSubtext: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
  waypointList: {
    gap: 8,
  },
  waypointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 1,
  },
  waypointIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waypointInfo: {
    flex: 1,
  },
  waypointName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  waypointCoords: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  clearAllButton: {
    marginTop: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  clearAllText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '600',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  infoNoteText: {
    fontSize: 12,
    color: '#888',
  },
});
