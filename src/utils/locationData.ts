// src/utils/locationData.ts

interface DistrictCoord {
  district: string;
  state: string;
  lat: number;
  lon: number;
}

/**
 * YOU MUST POPULATE THIS LIST
 * This is your static database of all available mandis or districts
 * and their corresponding latitude/longitude. Add as many as possible.
 */
export const DISTRICT_COORDINATES: DistrictCoord[] = [
  { district: "Amritsar", state: "Punjab", lat: 31.6339, lon: 74.8722 },
  { district: "Ludhiana", state: "Punjab", lat: 30.9010, lon: 75.8573 },
  { district: "Karnal", state: "Haryana", lat: 29.6857, lon: 76.9905 },
  // ... Add many more entries here
];

// (Keep the getHaversineDistance and findClosestDistrict functions from the previous answer)
function getHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export function findClosestDistrict(userLat: number, userLon: number): DistrictCoord | null {
  if (!DISTRICT_COORDINATES || DISTRICT_COORDINATES.length === 0) {
    console.warn("DISTRICT_COORDINATES list is empty or not defined.");
    return null;
  }

  let closestDistrict: DistrictCoord | null = null;
  let minDistance = Infinity;

  for (const district of DISTRICT_COORDINATES) {
    const distance = getHaversineDistance(
      userLat,
      userLon,
      district.lat,
      district.lon,
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestDistrict = district;
    }
  }
  console.log("Closest district found:", closestDistrict, "Distance:", minDistance.toFixed(2), "km");
  return closestDistrict;
}