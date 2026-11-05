import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { DonorLiveLocation } from '../types/database';

const MIN_WRITE_INTERVAL_MS = 15000;

export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

export function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location is not available on this device.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error('Could not get your location. Please allow location access or enter the hospital manually.')),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

/** Shares the donor's real position with the requester until the returned function is called. */
export function startSharingLocation(
  match: { matchId: string; donorId: string; requestId: string; hospitalLat?: number | null; hospitalLng?: number | null },
  onError: (message: string) => void
): () => void {
  let lastWrite = 0;
  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      if (Date.now() - lastWrite < MIN_WRITE_INTERVAL_MS) return;
      lastWrite = Date.now();

      const { latitude: currentLat, longitude: currentLng } = pos.coords;
      const hasHospital = match.hospitalLat != null && match.hospitalLng != null;
      const distanceKm = hasHospital
        ? calculateHaversineDistanceKm(currentLat, currentLng, match.hospitalLat!, match.hospitalLng!)
        : null;
      const update: DonorLiveLocation = {
        donorId: match.donorId,
        requestId: match.requestId,
        matchId: match.matchId,
        currentLat,
        currentLng,
        distanceKm,
        estimatedMinutes: distanceKm === null ? null : Math.max(1, Math.round(distanceKm * 3.5)),
        status: distanceKm === null ? 'en_route' : distanceKm < 0.15 ? 'arrived' : distanceKm < 0.8 ? 'nearby' : 'en_route',
        lastUpdated: new Date().toISOString()
      };
      setDoc(doc(db, 'locations', match.matchId), update).catch(() => onError('Could not share your location.'));
    },
    () => onError('Location access was denied, so your location is not being shared.'),
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
  );
  return () => navigator.geolocation.clearWatch(watchId);
}

export function subscribeToLocation(matchId: string, callback: (location: DonorLiveLocation | null) => void): () => void {
  return onSnapshot(doc(db, 'locations', matchId), (snap) => {
    callback(snap.exists() ? (snap.data() as DonorLiveLocation) : null);
  }, (err) => console.error('Location listener failed:', err));
}
