import type { DonorLiveLocation } from '../types/database';

/**
 * Computes distance in kilometers between two GPS coordinates using the Haversine formula
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function getInitialDonorLocation(data: {
  donorId: string;
  requestId: string;
  matchId: string;
  donorName: string;
  hospitalName: string;
}): DonorLiveLocation {
  // Care Hospital coordinates (Visakhapatnam 530016)
  const hospitalLat = 17.7215;
  const hospitalLng = 83.3082;
  // Donor simulated starting coordinates (~2.8 km away)
  const currentLat = 17.7380;
  const currentLng = 83.3220;

  const distanceKm = calculateHaversineDistanceKm(currentLat, currentLng, hospitalLat, hospitalLng);
  const estimatedMinutes = Math.max(2, Math.round(distanceKm * 3.5)); // ~3.5 min per km

  return {
    donorId: data.donorId,
    requestId: data.requestId,
    matchId: data.matchId,
    donorName: data.donorName,
    hospitalName: data.hospitalName,
    currentLat,
    currentLng,
    hospitalLat,
    hospitalLng,
    distanceKm,
    estimatedMinutes,
    transportMode: 'bike',
    status: 'en_route',
    lastUpdated: new Date().toISOString()
  };
}
