import { divIcon, latLngBounds } from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";

import type { Complaint } from "../services/api";

const categoryColors: Record<Complaint["category"], string> = {
  garbage: "#16A34A",
  water: "#0284C7",
  electricity: "#F59E0B",
  road: "#DC2626",
  drainage: "#7C3AED",
};

const createMarkerIcon = (color: string) =>
  divIcon({
    className: "civic-marker",
    html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 8px 20px rgba(15,23,42,.25)"></span>`,
  });

interface MapViewProps {
  complaints?: Complaint[];
  center?: [number, number];
  selectedPosition?: [number, number] | null;
  selectable?: boolean;
  onLocationSelect?: (position: [number, number]) => void;
  heightClassName?: string;
}

const LocationPicker = ({ onLocationSelect }: { onLocationSelect?: (position: [number, number]) => void }) => {
  useMapEvents({
    click(event) {
      onLocationSelect?.([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
};

const SyncMapViewport = ({
  center,
  selectedPosition,
  complaints,
}: {
  center: [number, number];
  selectedPosition?: [number, number] | null;
  complaints: Complaint[];
}) => {
  const map = useMap();

  useEffect(() => {
    if (selectedPosition) {
      map.setView(selectedPosition, map.getZoom(), {
        animate: true,
      });
      return;
    }

    if (complaints.length === 1) {
      const onlyComplaint = complaints[0];
      map.setView(
        [onlyComplaint.location.coordinates[1], onlyComplaint.location.coordinates[0]],
        15,
        { animate: true },
      );
      return;
    }

    if (complaints.length > 1) {
      const bounds = latLngBounds(
        complaints.map((complaint) => [complaint.location.coordinates[1], complaint.location.coordinates[0]] as [number, number]),
      );

      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 15,
      });
      return;
    }

    map.setView(center, map.getZoom(), {
      animate: true,
    });
  }, [center, complaints, map, selectedPosition]);

  return null;
};

const MapView = ({
  complaints = [],
  center = [17.385, 78.4867],
  selectedPosition,
  selectable = false,
  onLocationSelect,
  heightClassName = "h-[26rem]",
}: MapViewProps) => {
  return (
    <div className={`overflow-hidden rounded-[2rem] border border-slate-200 shadow-soft dark:border-slate-800 ${heightClassName}`}>
      <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full">
        <SyncMapViewport center={center} selectedPosition={selectedPosition} complaints={complaints} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {selectable ? <LocationPicker onLocationSelect={onLocationSelect} /> : null}
        {selectedPosition ? (
          <Marker position={selectedPosition} icon={createMarkerIcon("#0EA5A4")}>
            <Popup>Selected complaint location</Popup>
          </Marker>
        ) : null}
        {complaints.map((complaint) => (
          <Marker
            key={complaint._id}
            position={[complaint.location.coordinates[1], complaint.location.coordinates[0]]}
            icon={createMarkerIcon(categoryColors[complaint.category])}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{complaint.title}</p>
                <p className="text-sm">{complaint.category} · {complaint.status}</p>
                <p className="text-sm">{complaint.address}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
