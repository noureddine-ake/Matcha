// app/layout.tsx
"use client";

import FilterPopup from "@/components/FilterPopup";
import NotificationPopup from "@/components/NotificationPopup";
import LocationModal from "@/components/LocationModal";
import { ChatProvider } from "@/contexts/ChatContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { DiscoverProvider } from "@/contexts/discover-context";
import { useGlobal } from "@/contexts/globalcontext";
import { NotificationsProvider } from "@/contexts/notifications-provider";
import LightPillar from "@/components/LightPillar";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { Flame, Heart, MessageCircle, User, LogOut, MapPin, Navigation } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "sonner";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import Logo from "@/components/Logo";

const ChatProviderFallback = () => (
  <div className="flex items-center justify-center h-full">
    <Loader2 className="w-8 h-8 text-white animate-spin" />
  </div>
);

interface LocationData {
  lat: number;
  lng: number;
  name?: string;
  accuracy?: number;
  timestamp?: number;
}

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("discover");
  const { user, fetchProfile } = useGlobal();
  const pathname = usePathname();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationStatus, setLocationStatus] = useState<'pending' | 'set' | 'denied' | 'updating'>('pending');
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);

  // Use ref to track if initial location check has been done
  const initialCheckDone = useRef(false);

  useEffect(() => {
    if (pathname) {
      setActiveTab(pathname.slice(1));
    }
  }, [pathname]);

  // Function to validate if coordinates are reasonable
  const isValidLocation = (lat: number, lng: number, accuracy?: number): boolean => {
    // Basic bounds check
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;

    // Check for zero coordinates (often a sign of error)
    if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return false;

    // If accuracy is provided and it's too low (> 1000 meters), location might be unreliable
    if (accuracy && accuracy > 1000) return false;

    return true;
  };

  // Function to get high-accuracy location
  const getHighAccuracyLocation = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      // Try high accuracy first
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0 // Don't use cache
      });
    });
  }, []);

  // Load saved location on mount
  useEffect(() => {
    if (initialCheckDone.current) return;

    const loadSavedLocation = async () => {
      const stored = localStorage.getItem("user_location");

      if (stored && stored !== "denied") {
        try {
          const locationData = JSON.parse(stored);

          // Check if stored location is still valid (not too old)
          const isExpired = locationData.timestamp &&
            (Date.now() - locationData.timestamp > 24 * 60 * 60 * 1000); // 24 hours

          if (!isExpired && locationData.latitude && locationData.longitude) {
            // Validate the coordinates
            if (isValidLocation(locationData.latitude, locationData.longitude, locationData.accuracy)) {
              setLocation({
                lat: locationData.latitude,
                lng: locationData.longitude,
                name: locationData.name,
                accuracy: locationData.accuracy,
                timestamp: locationData.timestamp
              });
              setLocationStatus('set');
              initialCheckDone.current = true;
              return;
            }
          }
        } catch {
          // Invalid stored location, proceed to get new one
        }
      }

      // No valid stored location, try to get fresh one
      checkInitialLocation();
    };

    loadSavedLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkInitialLocation = async () => {
    if (initialCheckDone.current) return;

    if (!("geolocation" in navigator)) {
      setLocationStatus('denied');
      initialCheckDone.current = true;
      return;
    }

    try {
      // Try to get high accuracy location
      const position = await getHighAccuracyLocation();

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      // Validate the coordinates
      if (!isValidLocation(latitude, longitude, accuracy)) {
        throw new Error('Invalid coordinates received');
      }

      // Get location name with better error handling
      let locationName = '';
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`,
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          locationName = data.display_name || '';
        }
      } catch {
        // Silently fail - we can still use coordinates
      }

      const locationData = {
        latitude: parseFloat(latitude.toFixed(6)),
        longitude: parseFloat(longitude.toFixed(6)),
        name: locationName || `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        accuracy,
        timestamp: Date.now()
      };

      localStorage.setItem("user_location", JSON.stringify(locationData));
      setLocation({
        lat: locationData.latitude,
        lng: locationData.longitude,
        name: locationData.name,
        accuracy: locationData.accuracy,
        timestamp: locationData.timestamp
      });
      setLocationStatus('set');

      // Send to backend
      await api.put("/profile/update-location", {
        latitude: locationData.latitude,
        longitude: locationData.longitude
      });

    } catch (error: unknown) {
      console.warn("Location error:", error);

      // Try fallback with lower accuracy if high accuracy failed
      const errorCode = typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: number }).code : undefined;
      if (errorCode !== 1) { // Not a permission error
        try {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const latitude = pos.coords.latitude;
              const longitude = pos.coords.longitude;

              if (isValidLocation(latitude, longitude, pos.coords.accuracy)) {
                const locationData = {
                  latitude: parseFloat(latitude.toFixed(6)),
                  longitude: parseFloat(longitude.toFixed(6)),
                  accuracy: pos.coords.accuracy,
                  timestamp: Date.now()
                };

                localStorage.setItem("user_location", JSON.stringify(locationData));
                setLocation({ lat: locationData.latitude, lng: locationData.longitude });
                setLocationStatus('set');

                await api.put("/profile/update-location", {
                  latitude: locationData.latitude,
                  longitude: locationData.longitude
                });
              }
            },
            (fallbackErr) => {
              console.warn("Fallback location error:", fallbackErr);
              localStorage.setItem("user_location", "denied");
              setLocationStatus('denied');
            },
            {
              enableHighAccuracy: false, // Lower accuracy fallback
              timeout: 5000,
              maximumAge: 0
            }
          );
        } catch {
          localStorage.setItem("user_location", "denied");
          setLocationStatus('denied');
        }
      } else {
        localStorage.setItem("user_location", "denied");
        setLocationStatus('denied');
      }
    } finally {
      initialCheckDone.current = true;
    }
  };

  const handleLocationSet = async (latitude: number, longitude: number, locationName?: string) => {
    setLocationStatus('updating');

    try {
      // Validate coordinates
      if (!isValidLocation(latitude, longitude)) {
        throw new Error('Invalid coordinates');
      }

      // Get location name if not provided
      let name = locationName;
      if (!name) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`,
            { signal: controller.signal }
          );

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            name = data.display_name;
          }
        } catch {
          name = `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        }
      }

      const locationData = {
        latitude: parseFloat(latitude.toFixed(6)),
        longitude: parseFloat(longitude.toFixed(6)),
        name: name || `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        timestamp: Date.now()
      };

      // Store in localStorage
      localStorage.setItem("user_location", JSON.stringify(locationData));

      // Update state
      setLocation({
        lat: locationData.latitude,
        lng: locationData.longitude,
        name: locationData.name,
        timestamp: locationData.timestamp
      });
      setLocationStatus('set');

      // Send to backend
      await api.put("/profile/update-location", {
        latitude: locationData.latitude,
        longitude: locationData.longitude
      });

      // Close menu if open
      setIsLocationMenuOpen(false);
    } catch (err) {
      console.error("Failed to update location:", err);
      setLocationStatus('set'); // Keep previous location
    }
  };

  const handleRefreshLocation = async () => {
    setIsLocationMenuOpen(false);

    if (!("geolocation" in navigator)) {
      return;
    }

    setLocationStatus('updating');

    try {
      // Try high accuracy first
      const position = await getHighAccuracyLocation();

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      if (!isValidLocation(latitude, longitude, position.coords.accuracy)) {
        throw new Error('Invalid coordinates');
      }

      await handleLocationSet(latitude, longitude);

    } catch (error) {
      console.error("Error refreshing location:", error);

      // Try fallback with lower accuracy
      try {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const latitude = pos.coords.latitude;
            const longitude = pos.coords.longitude;

            if (isValidLocation(latitude, longitude, pos.coords.accuracy)) {
              await handleLocationSet(latitude, longitude);
            } else {
              setLocationStatus('set');
            }
          },
          () => {
            setLocationStatus('set');
          },
          {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 0
          }
        );
      } catch {
        setLocationStatus('set');
      }
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      window.location.href = "/auth/login";
    } catch (err) {
      console.error("Logout error:", err);
      window.location.href = "/auth/login";
    }
  };

  return (
    <DiscoverProvider>
      <WebSocketProvider>
        <NotificationsProvider>
          <Toaster
            position="top-right"
            richColors
            closeButton
            expand={false}
            visibleToasts={3}
            theme="dark"
            className="z-9999"
            toastOptions={{
              classNames: {
                toast: "bg-gray-900 border border-gray-800 text-white",
                title: "text-white",
                description: "text-gray-300",
                actionButton: "bg-blue-600 text-white",
                cancelButton: "bg-gray-700 text-gray-300",
              },
            }}
          />

          {/* Location Modal */}
          <LocationModal
            isOpen={showLocationModal}
            onClose={() => setShowLocationModal(false)}
            onLocationSet={handleLocationSet}
            currentLocation={location}
          />

          <Suspense fallback={<ChatProviderFallback />}>
            <ChatProvider>
              <div className="h-screen bg-[#030014] pb-24 overflow-hidden flex items-center relative">
                <LightPillar />

                {/* Header */}
                <motion.div
                  className="fixed top-0 left-0 right-0 h-22.5 bg-linear-to-b from-black/60 to-transparent backdrop-blur-lg border-b border-white/10 px-6 py-4 z-30"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <Link
                      href="/discover"
                      className="flex items-center gap-2 z-10"
                    >
                      <div className="w-8 h-8  flex items-center justify-center">
                        <Logo width={32} height={32} color="white" />
                      </div>
                      <span className="text-xl font-bold text-white">Matcha</span>
                    </Link>

                    <div className="flex items-center gap-2">
                      {/* Location Button with Menu */}
                      <div className="relative">
                        <motion.button
                          onClick={() => setIsLocationMenuOpen(!isLocationMenuOpen)}
                          className={`p-2 rounded-xl transition-all flex items-center gap-2 ${locationStatus === 'denied'
                              ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400'
                              : locationStatus === 'updating'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
                            }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title={location?.name || "Location"}
                        >
                          {locationStatus === 'updating' ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <MapPin className="w-5 h-5" />
                          )}
                          {location && locationStatus === 'set' && (
                            <span className="hidden md:inline text-sm max-w-[150px] truncate">
                              {location.name?.split(',')[0] || 'Location set'}
                            </span>
                          )}
                          {locationStatus === 'denied' && (
                            <span className="hidden md:inline text-sm">Location off</span>
                          )}
                        </motion.button>

                        {/* Location Menu Dropdown */}
                        <AnimatePresence>
                          {isLocationMenuOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50"
                            >
                              <div className="p-3 border-b border-gray-800">
                                <p className="text-sm text-gray-400">Current location</p>
                                {location ? (
                                  <div>
                                    <p className="text-white text-sm font-medium line-clamp-2">
                                      {location.name || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
                                    </p>
                                    {location.accuracy && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        Accuracy: ±{Math.round(location.accuracy)}m
                                      </p>
                                    )}
                                    {location.timestamp && (
                                      <p className="text-xs text-gray-500">
                                        Updated: {new Date(location.timestamp).toLocaleTimeString()}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-gray-500 text-sm">No location set</p>
                                )}
                              </div>

                              <div className="p-2">
                                <button
                                  onClick={() => {
                                    setShowLocationModal(true);
                                    setIsLocationMenuOpen(false);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
                                >
                                  <MapPin className="w-4 h-4" />
                                  Update location
                                </button>

                                {location && (
                                  <button
                                    onClick={handleRefreshLocation}
                                    className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
                                  >
                                    <Navigation className="w-4 h-4" />
                                    Refresh location
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <FilterPopup />
                      <NotificationPopup />

                      <motion.button
                        onClick={handleLogout}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Logout"
                      >
                        <LogOut className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>

                {/* Content Area */}
                <div className="z-10 max-w-7xl mx-auto w-full px-6 h-full pt-[90px] overflow-hidden relative">
                  {children}
                </div>

                {/* Bottom Navigation */}
                <motion.div
                  className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-lg border-t border-white/10 z-50 h-[90px]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-around">
                      {[
                        { id: "discover", icon: Flame, label: "Discover" },
                        { id: "likes", icon: Heart, label: "Likes" },
                        { id: "chat", icon: MessageCircle, label: "Chat" },
                        { id: `profile/${user?.username}`, icon: User, label: "Profile" },
                      ].map((tab) => (
                        <motion.button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id);
                            router.push(`/${tab.id}`);
                          }}
                          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${activeTab === tab.id
                              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50"
                              : "text-white/60 hover:text-white hover:bg-white/10"
                            }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <tab.icon className="w-6 h-6" />
                          <span className="text-xs font-semibold">{tab.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </ChatProvider>
          </Suspense>
        </NotificationsProvider>
      </WebSocketProvider>
    </DiscoverProvider>
  );
}