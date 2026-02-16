// Emergency SOS Utility Functions

import { AlertType } from '@/types/emergency';
import {
    Search,
    AlertTriangle,
    CheckCircle,
    HelpCircle,
    MapPin,
    Phone,
    type LucideIcon
} from 'lucide-react';

/**
 * Get user's current location using browser geolocation API
 */
export async function getUserLocation(): Promise<[number, number]> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve([position.coords.latitude, position.coords.longitude]);
            },
            (error) => {
                let errorMessage = 'Unable to retrieve your location';

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied. Please enable location access.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out.';
                        break;
                }

                reject(new Error(errorMessage));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

/**
 * Calculate distance between two points using Haversine formula
 * @param point1 [latitude, longitude]
 * @param point2 [latitude, longitude]
 * @returns distance in kilometers
 */
export function calculateDistance(
    point1: [number, number],
    point2: [number, number]
): number {
    const [lat1, lon1] = point1;
    const [lat2, lon2] = point2;

    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
    if (km < 1) {
        return `${Math.round(km * 1000)}m away`;
    }
    return `${km.toFixed(1)}km away`;
}

/**
 * Get icon for alert type
 */
export function getAlertIcon(type: AlertType): LucideIcon {
    switch (type) {
        case 'lost_pet':
            return Search;
        case 'emergency_help':
            return AlertTriangle;
        case 'found_pet':
            return CheckCircle;
        default:
            return HelpCircle;
    }
}

/**
 * Get color classes for alert type
 */
export function getAlertColor(type: AlertType): string {
    switch (type) {
        case 'lost_pet':
            return 'text-orange-600 bg-orange-50 border-orange-600';
        case 'emergency_help':
            return 'text-red-600 bg-red-50 border-red-600';
        case 'found_pet':
            return 'text-green-600 bg-green-50 border-green-600';
        default:
            return 'text-blue-600 bg-blue-50 border-blue-600';
    }
}

/**
 * Get label for alert type
 */
export function getAlertLabel(type: AlertType): string {
    switch (type) {
        case 'lost_pet':
            return 'Lost Pet';
        case 'emergency_help':
            return 'Emergency Help';
        case 'found_pet':
            return 'Found Pet';
        default:
            return 'Other';
    }
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Format Bangladesh numbers
    if (cleaned.startsWith('880')) {
        return `+${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    return phone;
}

/**
 * Generate Google Maps directions URL
 */
export function getDirectionsUrl(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
): string {
    return `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&travelmode=driving`;
}

/**
 * Trigger phone call
 */
export function callPhone(phoneNumber: string): void {
    window.location.href = `tel:${phoneNumber}`;
}

/**
 * Check if location permission is granted
 */
export async function checkLocationPermission(): Promise<boolean> {
    if (!navigator.permissions) {
        return false;
    }

    try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state === 'granted';
    } catch {
        return false;
    }
}

/**
 * Format time ago (e.g., "2 hours ago")
 */
export function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
    }

    return 'just now';
}
