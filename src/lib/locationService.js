/**
 * Location Service with High Precision GPS & Automatic Reverse Geocoding
 * Designed for MANDALO Delivery & Mandaditos
 */

export async function getCurrentCoordinates() {
  if (!('geolocation' in navigator)) {
    throw new Error('Tu navegador o dispositivo no soporta geolocalización GPS.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy || 0),
          altitude: position.coords.altitude,
          timestamp: position.timestamp
        });
      },
      (error) => {
        let msg = 'No se pudo obtener la ubicación GPS.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Permiso de ubicación denegado. Por favor activa el acceso al GPS en tu navegador o celular.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'La señal del GPS no está disponible en este momento. Intenta al aire libre o con Wi-Fi.';
            break;
          case error.TIMEOUT:
            msg = 'Tiempo de espera agotado buscando señal GPS. Inténtalo de nuevo.';
            break;
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true, // Force GPS hardware instead of coarse IP
        timeout: 15000,
        maximumAge: 0 // Do not use cached position
      }
    );
  });
}

/**
 * Reverse geocode coordinates to a clean human-readable street address
 */
export async function reverseGeocodeCoordinates(lat, lng) {
  // Strategy 1: OpenStreetMap Nominatim (High detail, free, CORS enabled)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'es'
        },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      const road = addr.road || addr.pedestrian || addr.suburb || addr.street || addr.path || '';
      const number = addr.house_number ? ` #${addr.house_number}` : '';
      const neighborhood = addr.neighbourhood || addr.quarter || addr.suburb || addr.residential || '';
      const city = addr.city || addr.town || addr.village || addr.municipality || '';

      const parts = [];
      if (road) parts.push(`${road}${number}`);
      if (neighborhood && neighborhood !== road) parts.push(neighborhood);
      if (city && city !== neighborhood && city !== road) parts.push(city);

      let cleanAddress = parts.join(', ');
      if (!cleanAddress && data.display_name) {
        cleanAddress = data.display_name.split(',').slice(0, 3).join(',').trim();
      }

      if (cleanAddress) {
        return {
          address: cleanAddress,
          displayName: data.display_name || cleanAddress,
          city,
          road,
          neighborhood,
          source: 'OpenStreetMap'
        };
      }
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode error or timeout, trying fallback...', err);
  }

  // Strategy 2: BigDataCloud fallback
  try {
    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=es`
    );
    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      const parts = [
        bdcData.locality,
        bdcData.city,
        bdcData.principalSubdivision
      ].filter(Boolean);

      if (parts.length > 0) {
        return {
          address: parts.join(', '),
          displayName: parts.join(', '),
          city: bdcData.city || '',
          source: 'BigDataCloud'
        };
      }
    }
  } catch (err) {
    console.warn('BigDataCloud reverse geocode fallback failed:', err);
  }

  // Strategy 3: Coordinates fallback
  return {
    address: `Punto GPS (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
    displayName: `Coordenadas: Lat ${lat.toFixed(5)}, Lon ${lng.toFixed(5)}`,
    city: '',
    source: 'Coordenadas'
  };
}

/**
 * Single-call helper: Gets high accuracy GPS and auto-resolves the real address
 */
export async function detectLocationWithAddress() {
  const coords = await getCurrentCoordinates();
  const geoResult = await reverseGeocodeCoordinates(coords.lat, coords.lng);

  return {
    coords,
    address: geoResult.address,
    displayName: geoResult.displayName,
    accuracy: coords.accuracy,
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`
  };
}
