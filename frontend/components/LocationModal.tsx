// components/LocationModal.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Crosshair, X, AlertCircle, Check, Loader2, Search, Navigation } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSet: (lat: number, lng: number, locationName?: string) => void;
  currentLocation?: { lat: number; lng: number; name?: string } | null;
}

declare global {
  interface Window {
    L: typeof import('leaflet');
  }
}

interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
  [key: string]: unknown;
}

export default function LocationModal({ 
  isOpen, 
  onClose, 
  onLocationSet,
  currentLocation 
}: LocationModalProps) {
  const [step, setStep] = useState<'initial' | 'detecting' | 'manual' | 'success'>('initial');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; name: string } | null>(
    currentLocation ? {
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      name: currentLocation.name || 'Current location'
    } : null
  );
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMap = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  const scriptLoaded = useRef(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initializeMap = useCallback((lat: number, lng: number) => {
    if (!mapRef.current || !window.L || leafletMap.current) return;

    leafletMap.current = window.L.map(mapRef.current).setView([lat, lng], 13);
    
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(leafletMap.current);

    // Custom icon for better visibility
    const customIcon = window.L.divIcon({
      className: 'custom-marker',
      html: `<div class="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    markerRef.current = window.L.marker([lat, lng], {
      draggable: true,
      icon: customIcon
    }).addTo(leafletMap.current);

    markerRef.current.on('dragstart', () => {
      setIsDragging(true);
    });

    markerRef.current.on('dragend', () => {
      setIsDragging(false);
      const position = markerRef.current.getLatLng();
      updateLocationFromCoords(position.lat, position.lng);
    });

    leafletMap.current.on('click', (e: { latlng: { lat: number; lng: number } }) => {
      const { lat, lng } = e.latlng;
      markerRef.current.setLatLng([lat, lng]);
      updateLocationFromCoords(lat, lng);
    });
  }, []);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('initial');
        setSelectedLocation(currentLocation ? {
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          name: currentLocation.name || 'Current location'
        } : null);
        setError(null);
        setSearchQuery('');
        setSearchResults([]);
        
        if (leafletMap.current) {
          leafletMap.current.remove();
          leafletMap.current = null;
          markerRef.current = null;
        }
      }, 300);
    }
  }, [isOpen, currentLocation]);

  // Load Leaflet scripts only when entering manual mode
  useEffect(() => {
    if (!isOpen || step !== 'manual' || scriptLoaded.current) return;

    const loadLeaflet = async () => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      
      await new Promise((resolve) => {
        script.onload = resolve;
        document.head.appendChild(script);
      });

      scriptLoaded.current = true;
      
      initializeMap(
        selectedLocation?.lat || 51.505, 
        selectedLocation?.lng || -0.09
      );
    };

    loadLeaflet();
  }, [isOpen, step, selectedLocation, initializeMap]);

  const updateLocationFromCoords = async (lat: number, lng: number) => {
    setSelectedLocation({
      lat,
      lng,
      name: 'Loading location name...'
    });

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      setSelectedLocation({
        lat,
        lng,
        name: data.display_name || 'Selected location'
      });
    } catch {
      setSelectedLocation({
        lat,
        lng,
        name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      });
    }
  };

  // Pure geolocation detection - no map involvement
  const detectLocation = () => {
    setStep('detecting');
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setStep('initial');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        const lat = parseFloat(latitude.toFixed(6));
        const lng = parseFloat(longitude.toFixed(6));
        
        // Validate coordinates are within valid ranges
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          setError('Invalid coordinates received. Please choose location manually.');
          setStep('initial');
          return;
        }
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          
          setSelectedLocation({
            lat,
            lng,
            name: data.display_name || 'Your location'
          });
        } catch {
          // If reverse geocoding fails, still use the coordinates
          setSelectedLocation({
            lat,
            lng,
            name: 'Your location'
          });
        }
        
        setStep('success');
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unable to detect your location.';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable permissions in your browser or choose manually.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please choose manually.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again or choose manually.';
            break;
        }
        
        setError(errorMessage);
        setStep('initial');
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0  // Don't use cached positions
      }
    );
  };

  const searchLocation = async (query: string) => {
    if (!query.trim() || query.length < 3) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (_err) {
      console.error('Search error:', _err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    if (value.length >= 3) {
      searchTimeout.current = setTimeout(() => {
        searchLocation(value);
      }, 500);
    } else {
      setSearchResults([]);
    }
  };

  const selectSearchResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    setSelectedLocation({
      lat,
      lng,
      name: result.display_name
    });
    
    setSearchResults([]);
    setSearchQuery('');
    
    if (leafletMap.current) {
      leafletMap.current.setView([lat, lng], 15);
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      }
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSet(selectedLocation.lat, selectedLocation.lng, selectedLocation.name);
      onClose();
    }
  };

  const retryDetection = () => {
    setError(null);
    detectLocation();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-2xl bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {currentLocation ? 'Update Your Location' : 'Set Your Location'}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {currentLocation ? 'Choose a new position or keep current' : 'Help us find people near you'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Current Location Info (if exists) */}
            {currentLocation && step === 'initial' && (
              <div className="mx-6 mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Navigation className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400">Current location</p>
                    <p className="text-white font-medium line-clamp-2">{currentLocation.name || 'Unknown location'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && step === 'initial' && (
              <div className="mx-6 mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-400 text-sm">{error}</p>
                    <button
                      onClick={retryDetection}
                      className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              {step === 'initial' && (
                <div className="space-y-4">
                  {/* Auto-detect option - pure geolocation */}
                  <button
                    onClick={detectLocation}
                    className="w-full p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 rounded-xl flex items-center gap-4 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Crosshair className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-white font-medium">Auto-detect my location</h3>
                      <p className="text-sm text-gray-400">Use your device&apos;s GPS (most accurate)</p>
                    </div>
                  </button>

                  {/* Manual map selection */}
                  <button
                    onClick={() => setStep('manual')}
                    className="w-full p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-xl flex items-center gap-4 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MapPin className="w-6 h-6 text-gray-300" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-white font-medium">Choose on map</h3>
                      <p className="text-sm text-gray-400">Search or place pin for exact location</p>
                    </div>
                  </button>
                </div>
              )}

              {step === 'detecting' && (
                <div className="py-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                  </div>
                  <h3 className="text-white text-lg font-medium mb-2">Detecting your location...</h3>
                  <p className="text-gray-400">Please allow location access when prompted</p>
                </div>
              )}

              {step === 'manual' && (
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Search for a city, address, or place..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                      />
                      {isSearching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 animate-spin" />
                      )}
                    </div>

                    {/* Search results */}
                    <AnimatePresence>
                      {searchResults.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden z-10 max-h-60 overflow-y-auto"
                        >
                          {searchResults.map((result, index) => (
                            <button
                              key={index}
                              onClick={() => selectSearchResult(result)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-700 text-white text-sm border-b border-gray-700 last:border-0 transition-colors"
                            >
                              <span className="line-clamp-2">{result.display_name}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Map */}
                  <div className="relative">
                    <div ref={mapRef} className="w-full h-[350px] rounded-xl overflow-hidden" />
                    
                    {/* Map controls */}
                    <div className="absolute top-2 right-2 flex flex-col gap-2">
                      <button
                        onClick={() => {
                          if (leafletMap.current && selectedLocation) {
                            leafletMap.current.setView([selectedLocation.lat, selectedLocation.lng], 15);
                          }
                        }}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                        title="Center on selected location"
                      >
                        <Navigation className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Drag indicator */}
                    {isDragging && (
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-3 py-1 rounded-full text-sm shadow-lg">
                        Release to set location
                      </div>
                    )}
                  </div>

                  {/* Selected location info */}
                  {selectedLocation && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-gray-800/50 rounded-xl border border-gray-700"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-400">Selected location</p>
                          <p className="text-white font-medium line-clamp-2">{selectedLocation.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {step === 'success' && selectedLocation && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-8 text-center"
                >
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-white text-lg font-medium mb-2">Location Found!</h3>
                  <p className="text-gray-400 mb-4 line-clamp-2 px-4">{selectedLocation.name}</p>
                  <p className="text-sm text-gray-500">Ready to confirm your location</p>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            {step === 'manual' && (
              <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-800">
                <button
                  onClick={() => setStep('initial')}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Back
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={!selectedLocation}
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    {currentLocation ? 'Update Location' : 'Confirm Location'}
                  </button>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="flex justify-end gap-3 p-6 border-t border-gray-800">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium transition-all flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  {currentLocation ? 'Update Location' : 'Confirm Location'}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}