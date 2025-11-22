/**
 * Utility function to calculate distance using Google Maps Distance Matrix API
 * @param {string} originAddress - Full address string of origin (store address)
 * @param {string} destinationAddress - Full address string of destination (customer address)
 * @param {string} apiKey - Google Maps API key
 * @returns {Promise<{distance: number, distanceText: string}>} - Distance in kilometers and formatted text
 */
export const calculateDistance = async (originAddress, destinationAddress, apiKey) => {
  if (!apiKey) {
    throw new Error('Google Maps API key is required');
  }

  if (!originAddress || !destinationAddress) {
    throw new Error('Origin and destination addresses are required');
  }

  try {
    // Format addresses for Google Maps API (add "Philippines" if not present)
    const formattedOrigin = originAddress.includes('Philippines') 
      ? originAddress 
      : `${originAddress}, Philippines`;
    
    const formattedDestination = destinationAddress.includes('Philippines')
      ? destinationAddress
      : `${destinationAddress}, Philippines`;

    // Google Maps Distance Matrix API endpoint
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(formattedOrigin)}&destinations=${encodeURIComponent(formattedDestination)}&units=metric&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.rows && data.rows.length > 0) {
      const element = data.rows[0].elements[0];
      
      if (element.status === 'OK') {
        // Distance is in meters, convert to kilometers
        const distanceInMeters = element.distance.value;
        const distanceInKm = distanceInMeters / 1000;
        const distanceText = element.distance.text;

        return {
          distance: distanceInKm,
          distanceText: distanceText,
          duration: element.duration?.text || '',
          status: 'OK'
        };
      } else {
        throw new Error(`Distance calculation failed: ${element.status}`);
      }
    } else {
      throw new Error(`API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error calculating distance:', error);
    throw error;
  }
};

/**
 * Build full address string from region, province, municipality, barangay
 * @param {Object} address - Address object with region, province, municipality, barangay
 * @param {Array} regionsList - List of regions from phil-reg-prov-mun-brgy
 * @returns {string} - Formatted address string
 */
export const buildAddressString = (address, regionsList = []) => {
  const parts = [];
  
  if (address.barangay) {
    parts.push(address.barangay);
  }
  if (address.municipality) {
    parts.push(address.municipality);
  }
  if (address.province) {
    parts.push(address.province);
  }
  if (address.region) {
    // Try to get region name if it's a code
    const region = regionsList.find(r => r.reg_code === address.region || r.name === address.region);
    parts.push(region?.name || address.region);
  }

  return parts.join(', ');
};

