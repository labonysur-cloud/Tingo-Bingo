"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
    AlertTriangle,
    Search,
    CheckCircle,
    HelpCircle,
    X,
    Phone,
    MessageCircle,
    MapPin,
    Navigation
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
    EmergencyAlert,
    CreateAlertRequest,
    AlertType,
    PetService
} from "@/types/emergency";
import {
    getUserLocation,
    getAlertIcon,
    getAlertColor,
    getAlertLabel,
    formatDistance,
    callPhone,
    getDirectionsUrl
} from "@/lib/emergency";
import CreateAlertModal from "./CreateAlertModal";
import AlertDetailModal from "./AlertDetailModal";
import { createClient } from "@supabase/supabase-js";

// Dynamically import Map to avoid SSR issues
const MapComponent = dynamic(() => import("@/components/map/MapComponent"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-gray-100 animate-pulse rounded-3xl flex items-center justify-center text-gray-400 font-medium">
            Loading Map...
        </div>
    ),
});

export default function SOSView() {
    const { user } = useAuth();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState<EmergencyAlert | null>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [nearbyAlerts, setNearbyAlerts] = useState<EmergencyAlert[]>([]);
    const [nearbyServices, setNearbyServices] = useState<PetService[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showServices, setShowServices] = useState(false);
    const [serviceFilter, setServiceFilter] = useState<string | null>(null);

    // Get user location on mount
    useEffect(() => {
        requestLocation();
    }, []);

    // Fetch nearby alerts when location changes
    useEffect(() => {
        if (userLocation) {
            fetchNearbyAlerts();
            fetchNearbyServices();
            updateUserLocation();
        }
    }, [userLocation]);

    // Real-time subscription for new alerts
    useEffect(() => {
        if (!userLocation) return;

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const channel = supabase
            .channel('emergency-alerts')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'emergency_alerts',
                filter: `status=eq.active`
            }, (payload: any) => {
                // Refresh alerts when new one is created
                fetchNearbyAlerts();
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'emergency_alerts'
            }, (payload: any) => {
                // Refresh alerts when status changes
                fetchNearbyAlerts();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userLocation]);

    const requestLocation = async () => {
        try {
            const location = await getUserLocation();
            setUserLocation(location);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const fetchNearbyAlerts = async () => {
        if (!userLocation) return;

        try {
            const response = await fetch(
                `/api/emergency/nearby?lat=${userLocation[0]}&lng=${userLocation[1]}&radius=10`
            );
            const data = await response.json();

            if (data.alerts) {
                setNearbyAlerts(data.alerts);
            }
        } catch (err) {
            console.error("Error fetching nearby alerts:", err);
        }
    };

    const fetchNearbyServices = async () => {
        if (!userLocation) return;

        try {
            const url = serviceFilter
                ? `/api/services/nearby?lat=${userLocation[0]}&lng=${userLocation[1]}&radius=50&type=${serviceFilter}`
                : `/api/services/nearby?lat=${userLocation[0]}&lng=${userLocation[1]}&radius=50`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.services) {
                setNearbyServices(data.services);
            }
        } catch (err) {
            console.error("Error fetching nearby services:", err);
        }
    };

    const updateUserLocation = async () => {
        if (!userLocation || !user) return;

        try {
            await fetch("/api/user/location", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    latitude: userLocation[0],
                    longitude: userLocation[1],
                }),
            });
        } catch (err) {
            console.error("Error updating location:", err);
        }
    };

    const handleSOSClick = () => {
        if (!userLocation) {
            requestLocation();
            return;
        }
        setShowCreateModal(true);
    };

    return (
        <div className="pb-24 p-6 flex flex-col min-h-screen bg-gradient-to-b from-red-50/30 to-white">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Emergency SOS</h1>
                <p className="text-gray-600 max-w-md mx-auto">
                    Alert nearby users when you need help or find lost pets
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    <p className="font-medium">Location Error</p>
                    <p>{error}</p>
                    <button
                        onClick={requestLocation}
                        className="mt-2 text-red-700 underline font-medium"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* SOS Button */}
            <div className="flex justify-center mb-8">
                <button
                    onClick={handleSOSClick}
                    disabled={!user}
                    className="relative w-56 h-56 rounded-full flex flex-col items-center justify-center transition-all duration-300 bg-gradient-to-br from-red-500 to-red-600 shadow-2xl shadow-red-500/40 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <AlertTriangle className="w-20 h-20 text-white mb-2" />
                    <span className="text-white font-bold text-xl tracking-widest">
                        HELP ME
                    </span>
                </button>
            </div>

            {/* Toggle View */}
            <div className="flex gap-2 mb-6 justify-center">
                <button
                    onClick={() => setShowServices(false)}
                    className={`px-6 py-2 rounded-full font-medium transition-all ${!showServices
                        ? "bg-red-600 text-white shadow-lg"
                        : "bg-white text-gray-600 border border-gray-200"
                        }`}
                >
                    Active Alerts ({nearbyAlerts.length})
                </button>
                <button
                    onClick={() => setShowServices(true)}
                    className={`px-6 py-2 rounded-full font-medium transition-all ${showServices
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-white text-gray-600 border border-gray-200"
                        }`}
                >
                    Pet Services ({nearbyServices.length})
                </button>
            </div>

            {/* Service Filter (when showing services) */}
            {showServices && (
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {[
                        { value: null, label: "All" },
                        { value: "veterinary", label: "Veterinary" },
                        { value: "emergency_vet", label: "Emergency" },
                        { value: "pet_shop", label: "Pet Shop" },
                        { value: "pet_groomer", label: "Groomer" },
                    ].map((filter) => (
                        <button
                            key={filter.value || "all"}
                            onClick={() => {
                                setServiceFilter(filter.value);
                                fetchNearbyServices();
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${serviceFilter === filter.value
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-600 border border-gray-200"
                                }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Map */}
            {userLocation && (
                <div className="w-full h-96 rounded-3xl overflow-hidden shadow-lg border border-gray-200 bg-white p-2 mb-6">
                    <div className="w-full h-full rounded-2xl overflow-hidden">
                        <MapComponent
                            userPosition={userLocation}
                            alerts={!showServices ? nearbyAlerts : []}
                            services={showServices ? nearbyServices : []}
                        />
                    </div>
                </div>
            )}

            {/* Alerts/Services List */}
            <div className="space-y-4">
                {!showServices ? (
                    // Emergency Alerts
                    nearbyAlerts.length > 0 ? (
                        nearbyAlerts.map((alert) => (
                            <AlertCard
                                key={alert.id}
                                alert={alert}
                                userLocation={userLocation}
                                onClick={() => setSelectedAlert(alert)}
                            />
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No active alerts nearby</p>
                        </div>
                    )
                ) : (
                    // Pet Services
                    nearbyServices.length > 0 ? (
                        nearbyServices.map((service) => (
                            <ServiceCard
                                key={service.id}
                                service={service}
                                userLocation={userLocation}
                            />
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No services found nearby</p>
                        </div>
                    )
                )}
            </div>

            {/* Create Alert Modal */}
            {showCreateModal && userLocation && (
                <CreateAlertModal
                    userLocation={userLocation}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        fetchNearbyAlerts();
                    }}
                />
            )}

            {/* Alert Detail Modal */}
            {selectedAlert && (
                <AlertDetailModal
                    alert={selectedAlert}
                    userLocation={userLocation}
                    onClose={() => setSelectedAlert(null)}
                    onRespond={() => {
                        fetchNearbyAlerts();
                    }}
                />
            )}
        </div>
    );
}

// Alert Card Component
function AlertCard({
    alert,
    userLocation,
    onClick,
}: {
    alert: EmergencyAlert;
    userLocation: [number, number] | null;
    onClick?: () => void;
}) {
    const Icon = getAlertIcon(alert.alert_type);
    const colorClass = getAlertColor(alert.alert_type);

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 cursor-pointer hover:shadow-lg transition-shadow"
        >
            <div className="flex items-start gap-4">
                {/* Alert Icon */}
                <div className={`p-3 rounded-xl ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <h3 className="font-bold text-gray-900">{alert.title}</h3>
                            <p className="text-sm text-gray-500">{getAlertLabel(alert.alert_type)}</p>
                        </div>
                        {alert.distance_km && (
                            <span className="text-sm font-medium text-gray-600">
                                {formatDistance(alert.distance_km)}
                            </span>
                        )}
                    </div>

                    <p className="text-gray-700 text-sm mb-3 line-clamp-2">{alert.description}</p>

                    {/* User Info */}
                    <div className="flex items-center gap-2">
                        <img
                            src={alert.user_avatar || "/default-avatar.png"}
                            alt={alert.user_name}
                            className="w-6 h-6 rounded-full"
                        />
                        <span className="text-sm text-gray-600">{alert.user_name}</span>
                        {alert.response_count > 0 && (
                            <span className="ml-auto text-xs text-gray-500">
                                {alert.response_count} {alert.response_count === 1 ? "response" : "responses"}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Service Card Component
function ServiceCard({
    service,
    userLocation,
}: {
    service: PetService;
    userLocation: [number, number] | null;
}) {
    return (
        <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="font-bold text-gray-900">{service.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">
                        {service.service_type.replace("_", " ")}
                    </p>
                </div>
                {service.distance_km && (
                    <span className="text-sm font-medium text-blue-600">
                        {formatDistance(service.distance_km)}
                    </span>
                )}
            </div>

            {service.description && (
                <p className="text-gray-700 text-sm mb-3">{service.description}</p>
            )}

            <div className="space-y-2 mb-4 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {service.address}
                </p>
                {service.hours && (
                    <p className="flex items-center gap-2">
                        <span className="font-medium">Hours:</span>
                        {service.hours}
                    </p>
                )}
                {service.is_24_7 && (
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        24/7 Available
                    </span>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={() => callPhone(service.phone)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                    <Phone className="w-4 h-4" />
                    Call Now
                </button>
                {userLocation && (
                    <button
                        onClick={() =>
                            window.open(
                                getDirectionsUrl(
                                    userLocation[0],
                                    userLocation[1],
                                    service.latitude,
                                    service.longitude
                                ),
                                "_blank"
                            )
                        }
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        <Navigation className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
