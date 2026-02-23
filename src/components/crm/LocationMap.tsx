import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Crosshair, Search } from "lucide-react";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface LocationMapProps {
  lat?: number | null;
  lng?: number | null;
  onChange: (lat: number, lng: number) => void;
  isAr: boolean;
  readOnly?: boolean;
}

// Nominatim search cache
const searchCache: Record<string, any[]> = {};

const LocationMap: React.FC<LocationMapProps> = ({ lat, lng, onChange, isAr, readOnly = false }) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSearchRef = useRef(0);

  const defaultCenter: [number, number] = [24.7136, 46.6753]; // Riyadh

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: [number, number] = lat && lng ? [lat, lng] : defaultCenter;
    const map = L.map(containerRef.current, { attributionControl: true }).setView(center, lat && lng ? 14 : 6);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    if (lat && lng) {
      const marker = L.marker([lat, lng], { draggable: !readOnly }).addTo(map);
      if (!readOnly) {
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onChange(pos.lat, pos.lng);
        });
      }
      markerRef.current = marker;
    }

    if (!readOnly) {
      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
        } else {
          const marker = L.marker([newLat, newLng], { draggable: true }).addTo(map);
          marker.on("dragend", () => {
            const pos = marker.getLatLng();
            onChange(pos.lat, pos.lng);
          });
          markerRef.current = marker;
        }
        onChange(newLat, newLng);
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker when lat/lng changes externally
  useEffect(() => {
    if (!mapRef.current) return;
    if (lat && lng) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], { draggable: !readOnly }).addTo(mapRef.current);
        if (!readOnly) {
          marker.on("dragend", () => {
            const pos = marker.getLatLng();
            onChange(pos.lat, pos.lng);
          });
        }
        markerRef.current = marker;
      }
      mapRef.current.setView([lat, lng], 14);
    }
  }, [lat, lng]);

  const handleMyLocation = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onChange(latitude, longitude);
        mapRef.current?.setView([latitude, longitude], 15);
      },
      () => {},
      { enableHighAccuracy: true }
    );
  };

  const searchNominatim = useCallback(async (query: string) => {
    if (query.length < 3) { setSearchResults([]); return; }

    // Check cache
    const cacheKey = query.toLowerCase().trim();
    if (searchCache[cacheKey]) {
      setSearchResults(searchCache[cacheKey]);
      return;
    }

    // Rate limit: 1 request per second
    const now = Date.now();
    if (now - lastSearchRef.current < 1000) return;
    lastSearchRef.current = now;

    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=sa&limit=5`,
        { headers: { "Accept-Language": isAr ? "ar" : "en" } }
      );
      const data = await res.json();
      searchCache[cacheKey] = data;
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  }, [isAr]);

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchNominatim(value), 500);
  };

  const selectResult = (result: any) => {
    const rLat = parseFloat(result.lat);
    const rLng = parseFloat(result.lon);
    onChange(rLat, rLng);
    mapRef.current?.setView([rLat, rLng], 15);
    setSearchResults([]);
    setSearchQuery(result.display_name?.split(",")[0] || "");
  };

  return (
    <div className="space-y-2">
      {!readOnly && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder={isAr ? "ابحث عن موقع..." : "Search location..."}
              className="h-9 rounded-lg ps-9 text-sm"
              dir="ltr"
            />
            {searchResults.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover p-1 shadow-lg">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => selectResult(r)}
                    className="w-full rounded-md px-3 py-2 text-start text-xs hover:bg-accent"
                  >
                    {r.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleMyLocation} className="gap-1.5 shrink-0">
            <Crosshair className="h-3.5 w-3.5" />
            {isAr ? "موقعك" : "My Location"}
          </Button>
        </div>
      )}
      <div
        ref={containerRef}
        className="h-64 w-full rounded-xl border border-border/60 overflow-hidden"
        style={{ minHeight: readOnly ? "200px" : "256px" }}
      />
      {lat && lng && (
        <p className="text-xs font-light text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </p>
      )}
    </div>
  );
};

export default LocationMap;
