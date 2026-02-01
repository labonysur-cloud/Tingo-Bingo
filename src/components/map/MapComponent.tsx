"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

// Fix for default marker icon in Leaflet + Next.js
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface MapProps {
    position: [number, number] | null;
}

export default function MapComponent({ position }: MapProps) {
    // Default to London if no position (or ask permission)
    const center = position || [51.505, -0.09];

    return (
        <MapContainer center={center} zoom={13} scrollWheelZoom={false} className="w-full h-full rounded-base border-2 border-black z-0">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {position && (
                <Marker position={position} icon={icon}>
                    <Popup>
                        You are here! <br /> Help is on the way.
                    </Popup>
                </Marker>
            )}

            {/* Mock Resources */}
            <Marker position={[center[0] + 0.01, center[1] + 0.01]} icon={icon}>
                <Popup>🐾 Happy Paws Vet Clinic</Popup>
            </Marker>
            <Marker position={[center[0] - 0.01, center[1] - 0.005]} icon={icon}>
                <Popup>🦴 Bone Appetit Pet Shop</Popup>
            </Marker>
        </MapContainer>
    );
}
