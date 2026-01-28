'use client'

import React, { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Helper to update map bounds
function MapUpdater({ locations }) {
    const map = useMap();
    useEffect(() => {
        if (locations && locations.length > 0) {
            const bounds = L.latLngBounds(locations.map(loc => [loc.latitude, loc.longitude]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [locations, map]);
    return null;
}

export default function SurveyMap({ center, mapMode, locations }) {
    return (
        <MapContainer center={center} zoom={7} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {locations.map((loc, idx) => (
                <CircleMarker
                    key={idx}
                    center={[loc.latitude, loc.longitude]}
                    // Heatmap Logic: larger radius, lower opacity, overlapping creates intensity
                    radius={mapMode === 'heatmap' ? 20 : 8}
                    fillOpacity={mapMode === 'heatmap' ? 0.2 : 0.6}
                    stroke={mapMode === 'markers'} // No stroke for heatmap mode
                    weight={2}
                    color="#ffffff"
                    fillColor={mapMode === 'heatmap' ? '#ef4444' : '#ef4444'}
                >
                    <Popup className="text-center">
                        <span className="font-semibold text-sm">Response #{idx + 1}</span>
                    </Popup>
                </CircleMarker>
            ))}
            <MapUpdater locations={locations} />
        </MapContainer>
    )
}
