/**
 * Calculates the distance between two points on Earth using the Haversine formula.
 * @param {number} lat1 Latitude of point 1
 * @param {number} lon1 Longitude of point 1
 * @param {number} lat2 Latitude of point 2
 * @param {number} lon2 Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Verifies if a user's location is valid for a given survey based on its administrative restrictions.
 * @param {object} survey The survey object including admin IDs
 * @param {number} userLat User's latitude
 * @param {number} userLon User's longitude
 * @param {object} db The database models object
 * @returns {Promise<{isValid: boolean, message?: string}>}
 */
export async function verifyGeoLocation(survey, userLat, userLon, db) {
    // Hierarchical check: Start from most specific (Union) to broadest (Division)

    // 1. Union Check (~5km radius)
    if (survey.union_id) {
        const union = await db.Union.findByPk(survey.union_id);
        if (union && union.lat && union.lon) {
            const dist = calculateDistance(userLat, userLon, union.lat, union.lon);
            if (dist > 5) {
                return { isValid: false, message: `You are ${dist.toFixed(1)}km away from the survey area (${union.name} Union). required within 5km` };
            }
            return { isValid: true };
        }
    }

    // 2. Upazila Check (~15km radius)
    if (survey.upazila_id) {
        const upazila = await db.Upazilla.findByPk(survey.upazila_id);
        if (upazila && upazila.lat && upazila.lon) {
            const dist = calculateDistance(userLat, userLon, upazila.lat, upazila.lon);
            if (dist > 20) {
                return { isValid: false, message: `You are ${dist.toFixed(1)}km away from the survey area (${upazila.name} Upazila). required within 20km` };
            }
            return { isValid: true };
        }
    }

    // 3. District Check (~50km radius)
    if (survey.district_id) {
        const district = await db.District.findByPk(survey.district_id);
        if (district && district.lat && district.lon) {
            const dist = calculateDistance(userLat, userLon, district.lat, district.lon);
            if (dist > 50) {
                return { isValid: false, message: `You are ${dist.toFixed(1)}km away from the survey area (${district.name} District). required within 50km` };
            }
            return { isValid: true };
        }
    }

    // 4. Division Check (~100km radius - roughly)
    if (survey.division_id) {
        const division = await db.Division.findByPk(survey.division_id);
        if (division && division.lat && division.lon) {
            const dist = calculateDistance(userLat, userLon, division.lat, division.lon);
            if (dist > 100) {
                return { isValid: false, message: `You are ${dist.toFixed(1)}km away from the survey area (${division.name} Division). required within 100km` };
            }
            return { isValid: true };
        }
    }

    // If no specific location restriction found (or models missing coords), assume valid or open
    return { isValid: true };
}
