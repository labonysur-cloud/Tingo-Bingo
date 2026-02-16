"use client";

import { useState, useEffect } from "react";
import { X, MessageCircle, Phone, Navigation, Clock, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { EmergencyAlert, AlertResponse } from "@/types/emergency";
import {
    getAlertIcon,
    getAlertColor,
    getAlertLabel,
    formatDistance,
    formatTimeAgo,
    callPhone,
    getDirectionsUrl,
    getUserLocation,
} from "@/lib/emergency";

interface AlertDetailModalProps {
    alert: EmergencyAlert;
    userLocation: [number, number] | null;
    onClose: () => void;
    onRespond: () => void;
}

export default function AlertDetailModal({
    alert,
    userLocation,
    onClose,
    onRespond,
}: AlertDetailModalProps) {
    const { user } = useAuth();
    const [responses, setResponses] = useState<AlertResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [responding, setResponding] = useState(false);
    const [responseMessage, setResponseMessage] = useState("");
    const [error, setError] = useState<string | null>(null);

    const Icon = getAlertIcon(alert.alert_type);
    const colorClass = getAlertColor(alert.alert_type);

    useEffect(() => {
        fetchResponses();
    }, [alert.id]);

    const fetchResponses = async () => {
        // TODO: Implement fetch responses API
        // For now, just placeholder
    };

    const handleRespond = async () => {
        if (!user || !userLocation) {
            setError("You must be logged in and share your location to respond");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/emergency/respond", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    alert_id: alert.id,
                    message: responseMessage || "I can help!",
                    responder_latitude: userLocation[0],
                    responder_longitude: userLocation[1],
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to send response");
            }

            // Success!
            setResponding(false);
            setResponseMessage("");
            onRespond();
            fetchResponses();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 max-w-2xl w-full my-8 shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 rounded-xl ${colorClass}`}>
                            <Icon className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">{alert.title}</h2>
                            <p className="text-sm text-gray-500">{getAlertLabel(alert.alert_type)}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Alert Info */}
                <div className="space-y-4 mb-6">
                    {/* Description */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                        <p className="text-gray-700">{alert.description}</p>
                    </div>

                    {/* Pet Info */}
                    {alert.pet_name && (
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Pet Information</h3>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-gray-700">
                                    <span className="font-medium">Name:</span> {alert.pet_name}
                                </p>
                                {alert.pet_breed && (
                                    <p className="text-gray-700">
                                        <span className="font-medium">Breed:</span> {alert.pet_breed}
                                    </p>
                                )}
                                {alert.pet_description && (
                                    <p className="text-gray-700 mt-2">{alert.pet_description}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* User Info */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <img
                            src={alert.user_avatar || "/default-avatar.png"}
                            alt={alert.user_name}
                            className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1">
                            <p className="font-semibold text-gray-900">{alert.user_name}</p>
                            <p className="text-sm text-gray-500">Posted {formatTimeAgo(alert.created_at)}</p>
                        </div>
                        {alert.distance_km && (
                            <span className="text-sm font-medium text-gray-600">
                                {formatDistance(alert.distance_km)}
                            </span>
                        )}
                    </div>

                    {/* Contact Info */}
                    {alert.contact_phone && (
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Contact</h3>
                            <p className="text-gray-700">
                                <span className="font-medium">Phone:</span> {alert.contact_phone}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Preferred contact: {alert.contact_method === "both" ? "Chat or Phone" : alert.contact_method === "phone" ? "Phone" : "Chat"}
                            </p>
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                        {error}
                    </div>
                )}

                {/* Response Form */}
                {!responding && alert.user_id !== user?.id && (
                    <button
                        onClick={() => setResponding(true)}
                        className="w-full px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors mb-4"
                    >
                        I Can Help
                    </button>
                )}

                {responding && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                        <h3 className="font-semibold text-gray-900 mb-3">Send Response</h3>
                        <textarea
                            value={responseMessage}
                            onChange={(e) => setResponseMessage(e.target.value)}
                            placeholder="Let them know you can help... (optional)"
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none mb-3"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setResponding(false);
                                    setResponseMessage("");
                                    setError(null);
                                }}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRespond}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? "Sending..." : "Send Response"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    {alert.contact_method !== "chat" && alert.contact_phone && (
                        <button
                            onClick={() => callPhone(alert.contact_phone!)}
                            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Phone className="w-4 h-4" />
                            Call
                        </button>
                    )}
                    {userLocation && (
                        <button
                            onClick={() =>
                                window.open(
                                    getDirectionsUrl(
                                        userLocation[0],
                                        userLocation[1],
                                        alert.latitude,
                                        alert.longitude
                                    ),
                                    "_blank"
                                )
                            }
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Navigation className="w-4 h-4" />
                            Directions
                        </button>
                    )}
                </div>

                {/* Responses Section */}
                {alert.response_count > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-4">
                            Responses ({alert.response_count})
                        </h3>
                        <div className="space-y-3">
                            {responses.length > 0 ? (
                                responses.map((response) => (
                                    <div key={response.id} className="p-4 bg-gray-50 rounded-xl">
                                        <div className="flex items-start gap-3">
                                            <img
                                                src={response.responder_avatar || "/default-avatar.png"}
                                                alt={response.responder_name}
                                                className="w-10 h-10 rounded-full"
                                            />
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">
                                                    {response.responder_name}
                                                </p>
                                                {response.message && (
                                                    <p className="text-gray-700 text-sm mt-1">{response.message}</p>
                                                )}
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {formatTimeAgo(response.created_at)}
                                                    {response.distance_km && ` • ${formatDistance(response.distance_km)}`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-400 py-4">
                                    {alert.response_count} {alert.response_count === 1 ? "person has" : "people have"} responded
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
