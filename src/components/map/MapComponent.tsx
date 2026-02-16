"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { EmergencyAlert, PetService } from "@/types/emergency";
import { formatDistance, getAlertLabel } from "@/lib/emergency";

// Fix for default marker icon in Leaflet + Next.js
const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

// Custom marker icons
const userIcon = L.divIcon({
    className: "custom-user-marker",
    html: `<div style="background: #dc2626; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); animation: pulse 2s infinite;"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
});

const alertIcon = L.divIcon({
    className: "custom-alert-marker",
    html: `<div style="background: #f97316; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
});

const serviceIcon = L.divIcon({
    className: "custom-service-marker",
    html: `<div style="background: #2563eb; width: 26px; height: 26px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
});

interface MapProps {
    userPosition: [number, number] | null;
    alerts?: EmergencyAlert[];
    services?: PetService[];
}

// Component to auto-fit bounds
function AutoFitBounds({
    userPosition,
    alerts,
    services
}: {
    userPosition: [number, number] | null;
    alerts?: EmergencyAlert[];
    services?: PetService[];
}) {
    const map = useMap();

    useEffect(() => {
        const bounds: L.LatLngBoundsExpression = [];

        if (userPosition) {
            bounds.push(userPosition);
        }

        if (alerts && alerts.length > 0) {
            alerts.forEach(alert => {
                bounds.push([alert.latitude, alert.longitude]);
            });
        }

        if (services && services.length > 0) {
            services.forEach(service => {
                bounds.push([service.latitude, service.longitude]);
            });
        }

        if (bounds.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
    }, [map, userPosition, alerts, services]);

    return null;
}

export default function MapComponent({ userPosition, alerts = [], services = [] }: MapProps) {
    // Default to Dhaka, Bangladesh if no position
    const center = userPosition || [23.8103, 90.4125];

    return (
        <>
            <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>

            <MapContainer
                center={center}
                zoom={13}
                scrollWheelZoom={true}
                className="w-full h-full rounded-base z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <AutoFitBounds
                    userPosition={userPosition}
                    alerts={alerts}
                    services={services}
                />

                {/* User Position Marker */}
                {userPosition && (
                    <Marker position={userPosition} icon={userIcon}>
                        <Popup>
                            <div className="text-center">
                                <p className="font-bold text-red-600">📍 You are here</p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Emergency Alert Markers */}
                {alerts.map((alert) => (
                    <Marker
                        key={alert.id}
                        position={[alert.latitude, alert.longitude]}
                        icon={alertIcon}
                    >
                        <Popup>
                            <div className="min-w-[200px]">
                                <p className="font-bold text-orange-600 mb-1">
                                    {getAlertLabel(alert.alert_type)}
                                </p>
                                <p className="font-semibold text-gray-900 mb-1">{alert.title}</p>
                                <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                                <div className="flex items-center gap-2 mb-2">
                                    <img
                                        src={alert.user_avatar || "/default-avatar.png"}
                                        alt={alert.user_name}
                                        className="w-5 h-5 rounded-full"
                                    />
                                    <span className="text-xs text-gray-600">{alert.user_name}</span>
                                </div>
                                {alert.distance_km && (
                                    <p className="text-xs text-gray-500">
                                        {formatDistance(alert.distance_km)}
                                    </p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Pet Service Markers */}
                {services.map((service) => (
                    <Marker
                        key={service.id}
                        position={[service.latitude, service.longitude]}
                        icon={serviceIcon}
                    >
                        <Popup>
                            <div className="min-w-[200px]">
                                <p className="font-bold text-blue-600 mb-1">{service.name}</p>
                                <p className="text-sm text-gray-600 capitalize mb-2">
                                    {service.service_type.replace("_", " ")}
                                </p>
                                {service.description && (
                                    <p className="text-xs text-gray-600 mb-2">{service.description}</p>
                                )}
                                <p className="text-xs text-gray-500 mb-1">📍 {service.address}</p>
                                {service.phone && (
                                    <p className="text-xs text-gray-500 mb-1">📞 {service.phone}</p>
                                )}
                                {service.hours && (
                                    <p className="text-xs text-gray-500 mb-1">🕐 {service.hours}</p>
                                )}
                                {service.is_24_7 && (
                                    <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                        24/7
                                    </span>
                                )}
                                {service.distance_km && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        {formatDistance(service.distance_km)}
                                    </p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </>
    );
}
