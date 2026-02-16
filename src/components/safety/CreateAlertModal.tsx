"use client";

import { useState } from "react";
import { X, Search, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AlertType } from "@/types/emergency";
import { getAlertIcon, getAlertColor, getAlertLabel } from "@/lib/emergency";

interface CreateAlertModalProps {
    userLocation: [number, number];
    onClose: () => void;
    onSuccess: () => void;
}

const ALERT_TYPES: { type: AlertType; label: string; description: string }[] = [
    {
        type: "lost_pet",
        label: "Lost Pet",
        description: "My pet is missing and I need help finding them",
    },
    {
        type: "emergency_help",
        label: "Emergency Help",
        description: "I need immediate help with my pet",
    },
    {
        type: "found_pet",
        label: "Found Pet",
        description: "I found a lost pet and want to help find the owner",
    },
    {
        type: "other",
        label: "Other",
        description: "Other pet-related emergency",
    },
];

export default function CreateAlertModal({
    userLocation,
    onClose,
    onSuccess,
}: CreateAlertModalProps) {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [alertType, setAlertType] = useState<AlertType | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [petName, setPetName] = useState("");
    const [petBreed, setPetBreed] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [contactMethod, setContactMethod] = useState<"chat" | "phone" | "both">("chat");

    const handleSubmit = async () => {
        if (!alertType || !title || !description) {
            setError("Please fill in all required fields");
            return;
        }

        if (!user) {
            setError("You must be logged in to create an alert");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/emergency/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    alert_type: alertType,
                    title,
                    description,
                    user_id: user.id, // Corrected: AuthContext provides user.id, not uid
                    latitude: userLocation[0],
                    longitude: userLocation[1],
                    pet_name: petName || null,
                    pet_breed: petBreed || null,
                    contact_phone: contactPhone || null,
                    contact_method: contactMethod,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create alert");
            }

            // Success!
            onSuccess();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 max-w-lg w-full my-8 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Create Emergency Alert</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`h-2 flex-1 rounded-full transition-all ${s <= step ? "bg-red-600" : "bg-gray-200"
                                }`}
                        />
                    ))}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                        {error}
                    </div>
                )}

                {/* Step 1: Select Alert Type */}
                {step === 1 && (
                    <div className="space-y-4">
                        <p className="text-gray-600 mb-4">What kind of help do you need?</p>
                        {ALERT_TYPES.map((type) => {
                            const Icon = getAlertIcon(type.type);
                            const colorClass = getAlertColor(type.type);
                            const isSelected = alertType === type.type;

                            return (
                                <button
                                    key={type.type}
                                    onClick={() => setAlertType(type.type)}
                                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${isSelected
                                        ? `${colorClass} border-current`
                                        : "bg-white border-gray-200 hover:border-gray-300"
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <Icon className={`w-6 h-6 mt-0.5 ${isSelected ? "" : "text-gray-400"}`} />
                                        <div>
                                            <p className={`font-bold ${isSelected ? "" : "text-gray-900"}`}>
                                                {type.label}
                                            </p>
                                            <p className={`text-sm ${isSelected ? "opacity-80" : "text-gray-600"}`}>
                                                {type.description}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}

                        <button
                            onClick={() => setStep(2)}
                            disabled={!alertType}
                            className="w-full mt-6 px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Continue
                        </button>
                    </div>
                )}

                {/* Step 2: Alert Details */}
                {step === 2 && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Title <span className="text-red-600">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Lost Cat - Fluffy"
                                maxLength={100}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description <span className="text-red-600">*</span>
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Provide details about the situation..."
                                maxLength={500}
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">{description.length}/500</p>
                        </div>

                        {(alertType === "lost_pet" || alertType === "found_pet") && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Pet Name
                                    </label>
                                    <input
                                        type="text"
                                        value={petName}
                                        onChange={(e) => setPetName(e.target.value)}
                                        placeholder="e.g., Fluffy"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Pet Breed
                                    </label>
                                    <input
                                        type="text"
                                        value={petBreed}
                                        onChange={(e) => setPetBreed(e.target.value)}
                                        placeholder="e.g., Persian Cat"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={!title || !description}
                                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Contact Method */}
                {step === 3 && (
                    <div className="space-y-4">
                        <p className="text-gray-600 mb-4">How should people contact you?</p>

                        <div className="space-y-3">
                            {[
                                { value: "chat" as const, label: "Chat Only", description: "Via TingoBingo chat" },
                                { value: "phone" as const, label: "Phone Only", description: "Direct phone call" },
                                { value: "both" as const, label: "Both", description: "Chat or phone call" },
                            ].map((method) => (
                                <button
                                    key={method.value}
                                    onClick={() => setContactMethod(method.value)}
                                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${contactMethod === method.value
                                        ? "bg-red-50 border-red-600 text-red-600"
                                        : "bg-white border-gray-200 hover:border-gray-300"
                                        }`}
                                >
                                    <p className="font-bold">{method.label}</p>
                                    <p className={`text-sm ${contactMethod === method.value ? "opacity-80" : "text-gray-600"}`}>
                                        {method.description}
                                    </p>
                                </button>
                            ))}
                        </div>

                        {(contactMethod === "phone" || contactMethod === "both") && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="tel"
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
                                    placeholder="+880-1712-345678"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                />
                            </div>
                        )}

                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-6">
                            <p className="text-sm text-yellow-800">
                                <strong>Note:</strong> Your exact location will be shared with nearby users to help them assist you.
                            </p>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setStep(2)}
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || ((contactMethod === "phone" || contactMethod === "both") && !contactPhone)}
                                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Creating..." : "Create Alert"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
