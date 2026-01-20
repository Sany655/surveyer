/**
 * Location API Utility
 * Centralized functions for fetching Bangladesh administrative divisions data
 */

// Fixed divisions data (static)
export const divisions = [
    { id: 1, name: 'Chattagram', bn_name: 'চট্টগ্রাম', pcode: 'BD10' },
    { id: 2, name: 'Rajshahi', bn_name: 'রাজশাহী', pcode: 'BD15' },
    { id: 3, name: 'Khulna', bn_name: 'খুলনা', pcode: 'BD20' },
    { id: 4, name: 'Barisal', bn_name: 'বরিশাল', pcode: 'BD25' },
    { id: 5, name: 'Sylhet', bn_name: 'সিলেট', pcode: 'BD30' },
    { id: 6, name: 'Dhaka', bn_name: 'ঢাকা', pcode: 'BD35' },
    { id: 7, name: 'Rangpur', bn_name: 'রংপুর', pcode: 'BD40' },
    { id: 8, name: 'Mymensingh', bn_name: 'ময়মনসিংহ', pcode: 'BD45' }
]

const BASE_API_URL = '/api/geo'

import { getAuthToken } from "./helpers";

export const fetchDivisions = async () => {
    try {
        let token;
        if (typeof window === "undefined") {
            const { cookies } = await import("next/headers");
            token = cookies().get("auth_token")?.value;
        } else {
            token = getAuthToken();
        }

        const response = await fetch(`${BASE_API_URL}/divisions`, {
            cache: 'no-store',
            headers: {
                Authorization: `Bearer ${token}`,
            }
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        return Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : [])
    } catch (error) {
        console.error('Error fetching divisions:', error)
        return []
    }
}


/**
 * Fetch districts by division ID
 * @param {string|number} divisionId - The division ID
 * @returns {Promise<Array>} Array of district objects
 */
export const fetchDistricts = async (divisionId) => {
    if (!divisionId) {
        return []
    }

    try {
        let token;
        if (typeof window === "undefined") {
            const { cookies } = await import("next/headers");
            token = cookies().get("auth_token")?.value;
        } else {
            token = getAuthToken();
        }

        const response = await fetch(`${BASE_API_URL}/districts/${divisionId}`, {
            cache: 'no-store',
            headers: {
                Authorization: `Bearer ${token}`,
            }
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        return Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : [])
    } catch (error) {
        console.error('Error fetching districts:', error)
        return []
    }
}

/**
 * Fetch upazillas by district ID
 * @param {string|number} districtId - The district ID
 * @returns {Promise<Array>} Array of upazilla objects
 */
export const fetchUpazillas = async (districtId) => {
    if (!districtId) {
        return []
    }

    try {
        let token;
        if (typeof window === "undefined") {
            const { cookies } = await import("next/headers");
            token = cookies().get("auth_token")?.value;
        } else {
            token = getAuthToken();
        }

        const response = await fetch(`${BASE_API_URL}/upazillas/${districtId}`, {
            cache: 'no-store',
            headers: {
                Authorization: `Bearer ${token}`,
            }
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        return Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : [])
    } catch (error) {
        console.error('Error fetching upazillas:', error)
        return []
    }
}

/**
 * Fetch unions by upazilla ID
 * @param {string|number} upazillaId - The upazilla ID
 * @returns {Promise<Array>} Array of union objects
 */
export const fetchUnions = async (upazillaId) => {
    if (!upazillaId) {
        return []
    }

    try {
        let token;
        if (typeof window === "undefined") {
            const { cookies } = await import("next/headers");
            token = cookies().get("auth_token")?.value;
        } else {
            token = getAuthToken();
        }

        const response = await fetch(`${BASE_API_URL}/unions/${upazillaId}`, {
            cache: 'no-store',
            headers: {
                Authorization: `Bearer ${token}`,
            }
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        return Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : [])
    } catch (error) {
        console.error('Error fetching unions:', error)
        return []
    }
}

/**
 * Get division name by ID
 * @param {string|number} divisionId - The division ID
 * @returns {string} Division name or empty string
 */
export const getDivisionName = (divisionId) => {
    const division = divisions.find(d => d.id === Number(divisionId))
    return division ? division.name : ''
}

/**
 * Get division by ID
 * @param {string|number} divisionId - The division ID
 * @returns {Object|null} Division object or null
 */
export const getDivisionById = (divisionId) => {
    return divisions.find(d => d.id === Number(divisionId)) || null
}