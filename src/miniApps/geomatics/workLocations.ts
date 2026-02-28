/**
 * Shared work location data for TM workplace sites.
 */

export interface WorkLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance: number;
}

export const WORK_LOCATIONS_DATA: Omit<WorkLocation, "id" | "distance">[] = [
  {
    name: "TM Digital Academy",
    latitude: 2.9284250859660825,
    longitude: 101.63967945967332,
  },
  {
    name: "TM Annexe 1",
    latitude: 3.1162421116030274,
    longitude: 101.6638610831325,
  },
  {
    name: "TM Annexe 2",
    latitude: 3.115891821261173,
    longitude: 101.66369422489188,
  },
  {
    name: "Menara TM",
    latitude: 3.1161749459564594,
    longitude: 101.66587260585952,
  },
];
