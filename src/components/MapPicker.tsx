import * as React from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Custom pin (avoids bundling Leaflet's image markers). */
const pinIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;transform:translate(-50%,-100%)">
    <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 0C7.6 0 0 7.6 0 17c0 12.7 17 27 17 27s17-14.3 17-27C34 7.6 26.4 0 17 0Z" fill="#16a34a"/>
      <circle cx="17" cy="16" r="6.5" fill="white"/>
    </svg>
  </div>`,
  iconSize: [34, 44],
  iconAnchor: [0, 0],
});

const NAGPUR: [number, number] = [21.1458, 79.0882];

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Keeps the map centred when the pin is set programmatically. */
function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 14), { animate: true });
  }, [lat, lng, map]);
  return null;
}

export function MapPicker({
  value,
  onChange,
  height = 240,
  className,
}: {
  value: { lat: number; lng: number } | null;
  onChange: (lat: number, lng: number) => void;
  height?: number;
  className?: string;
}) {
  const [locating, setLocating] = React.useState(false);
  const center: [number, number] = value ? [value.lat, value.lng] : NAGPUR;

  const locate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-border', className)}>
      <div className="relative">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height, width: '100%' }}
          scrollWheelZoom={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onPick={onChange} />
          {value && <Marker position={[value.lat, value.lng]} icon={pinIcon} />}
          {value && <Recenter lat={value.lat} lng={value.lng} />}
        </MapContainer>
        <Button
          type="button"
          size="sm"
          variant="white"
          onClick={locate}
          className="absolute bottom-3 right-3 z-10 shadow-lift"
          loading={locating}
        >
          {!locating && <LocateFixed className="h-4 w-4" />} Use my location
        </Button>
      </div>
      <div className="flex items-center justify-between gap-2 bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">
        <span>{value ? `Pin set at ${value.lat.toFixed(4)}, ${value.lng.toFixed(4)}` : 'Tap on the map to drop your pickup pin'}</span>
        <span className="hidden sm:inline">OpenStreetMap</span>
      </div>
    </div>
  );
}

/** Read-only map used on listing/order detail pages. */
export function MapView({
  lat,
  lng,
  height = 200,
  className,
  label,
}: {
  lat: number;
  lng: number;
  height?: number;
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-border', className)}>
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        style={{ height, width: '100%' }}
        scrollWheelZoom={false}
        dragging={false}
        attributionControl={false}
        zoomControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[lat, lng]} icon={pinIcon} />
      </MapContainer>
      {label && <p className="bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">{label}</p>}
    </div>
  );
}

export { Loader2 };
