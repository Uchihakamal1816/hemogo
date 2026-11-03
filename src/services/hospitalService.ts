import { calculateHaversineDistanceKm } from './locationService';

export interface NearbyHospital {
  name: string;
  lat: number;
  lng: number;
  pinCode: string;
  distanceKm: number;
  hasBloodBank: boolean;
}

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];
const SEARCH_RADIUS_M = 15000;

/** Looks up hospitals around a point using OpenStreetMap. Coverage varies, so callers must keep manual entry. */
export async function findNearbyHospitals(lat: number, lng: number): Promise<NearbyHospital[]> {
  const around = `(around:${SEARCH_RADIUS_M},${lat},${lng})`;
  const body = `data=${encodeURIComponent(
    `[out:json][timeout:12];(nwr["amenity"="hospital"]${around};nwr["healthcare"="blood_bank"]${around};nwr["healthcare"="blood_donation"]${around};);out center 40;`
  )}`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: AbortSignal.timeout(13000)
      });
      if (!res.ok) continue;
      const json = await res.json();

      return (json.elements as any[])
        .map((el) => {
          const pointLat = el.lat ?? el.center?.lat;
          const pointLng = el.lon ?? el.center?.lon;
          const tags = el.tags || {};
          if (!tags.name || pointLat == null || pointLng == null) return null;
          return {
            name: tags.name as string,
            lat: pointLat as number,
            lng: pointLng as number,
            pinCode: /^[1-9]\d{5}$/.test(tags['addr:postcode'] || '') ? tags['addr:postcode'] : '',
            distanceKm: calculateHaversineDistanceKm(lat, lng, pointLat, pointLng),
            hasBloodBank: tags.healthcare === 'blood_bank' || tags.healthcare === 'blood_donation' || tags['healthcare:speciality'] === 'blood_bank'
          };
        })
        .filter((h): h is NearbyHospital => h !== null)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 8);
    } catch (err) {
      console.warn('Hospital lookup failed on', endpoint, err);
    }
  }
  throw new Error('Could not look up nearby hospitals. Please enter the hospital manually.');
}
