import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, MapPin, Navigation, Loader2, Check } from "lucide-react";
import { Button, Input } from "./ui";

// Custom SVG Pin for Leaflet map to guarantee crisp styling without broken image assets
const createPinIcon = () =>
  L.divIcon({
    className: "renthub-map-pin",
    html: `
      <div style="
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translate(-18px, -36px);
      ">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="#FF385C" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.35));">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
          <circle cx="12" cy="10" r="3" fill="#FFFFFF"></circle>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });

export default function MapPicker({
  location = "",
  coordinates = null,
  onChange,
  className = "",
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Default coordinate: Kochi / Bangalore / Delhi fallback
  const defaultCoords = { lat: 9.9312, lng: 76.2673 }; // Kochi, Kerala
  const currentLat = coordinates?.lat || defaultCoords.lat;
  const currentLng = coordinates?.lng || defaultCoords.lng;

  const [coords, setCoords] = useState({ lat: currentLat, lng: currentLng });
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState("");

  // Reverse geocode to get human-friendly address string
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      if (res.ok) {
        const data = await res.json();
        const address = data.address || {};
        const area =
          address.suburb ||
          address.neighbourhood ||
          address.residential ||
          address.city_district ||
          address.village ||
          address.town ||
          address.city ||
          "";
        const city = address.city || address.town || address.county || address.state || "";
        const state = address.state || "";

        let formatted = [area, city, state].filter(Boolean).join(", ");
        if (!formatted && data.display_name) {
          formatted = data.display_name.split(",").slice(0, 3).join(",").trim();
        }

        if (formatted) {
          onChange?.({
            location: formatted,
            coordinates: { lat, lng },
          });
        } else {
          onChange?.({
            location: location || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            coordinates: { lat, lng },
          });
        }
      }
    } catch (err) {
      console.warn("Reverse geocode failed:", err);
      onChange?.({
        location: location || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        coordinates: { lat, lng },
      });
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
      zoom: coordinates?.lat ? 14 : 11,
      scrollWheelZoom: "center",
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([currentLat, currentLng], {
      icon: createPinIcon(),
      draggable: true,
    }).addTo(map);

    marker.on("dragend", async (e) => {
      const position = e.target.getLatLng();
      const updatedLat = Number(position.lat.toFixed(5));
      const updatedLng = Number(position.lng.toFixed(5));
      setCoords({ lat: updatedLat, lng: updatedLng });
      reverseGeocode(updatedLat, updatedLng);
    });

    map.on("click", async (e) => {
      const { lat, lng } = e.latlng;
      const updatedLat = Number(lat.toFixed(5));
      const updatedLng = Number(lng.toFixed(5));
      marker.setLatLng([updatedLat, updatedLng]);
      setCoords({ lat: updatedLat, lng: updatedLng });
      reverseGeocode(updatedLat, updatedLng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update map if external coordinates change
  useEffect(() => {
    if (coordinates?.lat && coordinates?.lng && markerRef.current && mapInstanceRef.current) {
      if (
        Math.abs(coords.lat - coordinates.lat) > 0.0001 ||
        Math.abs(coords.lng - coordinates.lng) > 0.0001
      ) {
        setCoords({ lat: coordinates.lat, lng: coordinates.lng });
        markerRef.current.setLatLng([coordinates.lat, coordinates.lng]);
        mapInstanceRef.current.setView([coordinates.lat, coordinates.lng], 14);
      }
    }
  }, [coordinates]);

  // Forward search using Nominatim
  const handleSearch = async (e) => {
    e?.preventDefault();
    const query = searchQuery.trim();
    if (!query || query.length < 2) return;

    setSearching(true);
    setSearchError("");
    setSearchResults([]);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setSearchResults(data);
        } else {
          setSearchError("No locations found. Try a broader city or landmark name.");
        }
      }
    } catch (err) {
      console.error("Geocoding search failed:", err);
      setSearchError("Search service unavailable. Please click directly on the map.");
    } finally {
      setSearching(false);
    }
  };

  // Select search result
  const handleSelectResult = (item) => {
    const newLat = Number(parseFloat(item.lat).toFixed(5));
    const newLng = Number(parseFloat(item.lon).toFixed(5));
    setCoords({ lat: newLat, lng: newLng });

    const addr = item.address || {};
    const area =
      addr.suburb ||
      addr.neighbourhood ||
      addr.residential ||
      addr.city_district ||
      addr.town ||
      addr.city ||
      "";
    const city = addr.city || addr.town || addr.county || addr.state || "";
    const state = addr.state || "";
    let formatted = [area, city, state].filter(Boolean).join(", ");
    if (!formatted) {
      formatted = item.display_name.split(",").slice(0, 3).join(",").trim();
    }

    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([newLat, newLng]);
      mapInstanceRef.current.flyTo([newLat, newLng], 15, { duration: 1.2 });
    }

    onChange?.({
      location: formatted || item.display_name,
      coordinates: { lat: newLat, lng: newLng },
    });

    setSearchResults([]);
    setSearchQuery("");
  };

  // Locate user with HTML5 geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = Number(pos.coords.latitude.toFixed(5));
        const userLng = Number(pos.coords.longitude.toFixed(5));
        setCoords({ lat: userLat, lng: userLng });

        if (mapInstanceRef.current && markerRef.current) {
          markerRef.current.setLatLng([userLat, userLng]);
          mapInstanceRef.current.flyTo([userLat, userLng], 15, { duration: 1.2 });
        }

        reverseGeocode(userLat, userLng);
        setGeolocating(false);
      },
      (err) => {
        console.warn("Geolocation denied or error:", err.message);
        setGeolocating(false);
        alert("Unable to retrieve location. Please allow location access or pick manually on the map.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search & Geolocation Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearch} className="flex-1 relative flex gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted-grey)] pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search city, area, or landmark on map..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs sm:text-sm text-[var(--color-espresso)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 focus:border-[var(--color-brand-primary)]"
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={searching}
            icon={searching ? Loader2 : Search}
            className="shrink-0"
          >
            {searching ? "Searching..." : "Search"}
          </Button>
        </form>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseMyLocation}
          disabled={geolocating}
          icon={geolocating ? Loader2 : Navigation}
          className="shrink-0 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10"
        >
          {geolocating ? "Locating..." : "Use Current Location"}
        </Button>
      </div>

      {/* Search Results Dropdown List */}
      {searchResults.length > 0 && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl overflow-hidden divide-y divide-[var(--color-border-subtle)] text-xs z-20">
          {searchResults.map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleSelectResult(item)}
              className="p-3 hover:bg-[var(--color-surface-hover)] cursor-pointer flex items-center justify-between gap-2 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <MapPin size={15} className="text-rose-500 shrink-0" />
                <span className="truncate text-[var(--color-espresso)] font-medium">
                  {item.display_name}
                </span>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                Select & Pin &rarr;
              </span>
            </div>
          ))}
        </div>
      )}

      {searchError && (
        <p className="text-xs text-rose-500 font-medium px-1">{searchError}</p>
      )}

      {/* Interactive Map Canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-xs bg-slate-100 dark:bg-slate-900 h-64 sm:h-80 w-full z-0">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Live Coordinates Pill in corner */}
        <div className="absolute bottom-3 left-3 z-[400] bg-[var(--color-surface)]/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[var(--color-border)] shadow-md flex items-center gap-2 text-[11px]">
          <MapPin size={13} className="text-[var(--color-brand-primary)]" />
          <span className="font-mono font-bold text-[var(--color-espresso)]">
            {coords.lat.toFixed(4)}°, {coords.lng.toFixed(4)}°
          </span>
          <span className="text-[10px] text-[var(--color-muted-grey)] hidden sm:inline">
            (Click or drag pin to adjust)
          </span>
        </div>
      </div>
    </div>
  );
}
