"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, MapPin, User, Star, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDiscover } from "@/contexts/discover-context";
import { useRef, useEffect } from "react";

const FilterPopup = () => {
  const discover = useDiscover();
  const popupRef = useRef<HTMLDivElement>(null);

  const handleChange = (key: string, value: number[]) => {
    discover.setFilters({ ...discover.filters, [key]: value[0] });
  };

  const handleApply = () => {
    discover.setShowPopup(false);
    discover.fetchSuggestions();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        discover.setShowPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [discover]);

  return (
    <div className="relative" ref={popupRef}>
      <Button
        variant="outline"
        size="icon"
        className="bg-white/10 border border-white/20 hover:bg-white/20 transition-all backdrop-blur-lg rounded-full w-10 h-10"
        onClick={() => discover.setShowPopup(!discover.showPopup)}
      >
        <SlidersHorizontal className="w-5 h-5 text-white" />
      </Button>

      <AnimatePresence>
        {discover.showPopup && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-12 right-0 z-50 w-80"
          >
            <div className="bg-black/80 backdrop-blur-3xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">Filter Profiles</h2>
              </div>

              <div className="p-5 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    <Label className="text-sm text-white">Max Distance</Label>
                    <span className="text-sm text-purple-300 ml-auto">{discover.filters.maxDistance} km</span>
                  </div>
                  <Slider
                    value={[discover.filters.maxDistance]}
                    max={100}
                    step={5}
                    onValueChange={(v: number[]) => handleChange("maxDistance", v)}
                    className="py-2"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-pink-400" />
                    <Label className="text-sm text-white">Age Range</Label>
                    <span className="text-sm text-pink-300 ml-auto">{discover.filters.minAge} - {discover.filters.maxAge}</span>
                  </div>
                  <div className="space-y-3">
                    <Slider
                      value={[discover.filters.minAge]}
                      min={18}
                      max={discover.filters.maxAge}
                      step={1}
                      onValueChange={(v: number[]) => handleChange("minAge", v)}
                    />
                    <Slider
                      value={[discover.filters.maxAge]}
                      min={discover.filters.minAge}
                      max={70}
                      step={1}
                      onValueChange={(v: number[]) => handleChange("maxAge", v)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <Label className="text-sm text-white">Fame Rating</Label>
                    <span className="text-sm text-yellow-300 ml-auto">{discover.filters.minFame} - {discover.filters.maxFame}</span>
                  </div>
                  <div className="space-y-3">
                    <Slider
                      value={[discover.filters.minFame]}
                      min={0}
                      max={discover.filters.maxFame}
                      step={1}
                      onValueChange={(v: number[]) => handleChange("minFame", v)}
                    />
                    <Slider
                      value={[discover.filters.maxFame]}
                      min={discover.filters.minFame}
                      max={5}
                      step={1}
                      onValueChange={(v: number[]) => handleChange("maxFame", v)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-blue-400" />
                    <Label className="text-sm text-white">Sort By</Label>
                  </div>
                  <Select
                    value={discover.filters.sortBy}
                    onValueChange={(value: "distance" | "age" | "fame") =>
                      discover.setFilters({ ...discover.filters, sortBy: value })
                    }
                  >
                    <SelectTrigger className="w-full bg-white/10 border-white/20 text-white rounded-xl h-12">
                      <SelectValue placeholder="Select sort option" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      <SelectItem value="distance" className="text-white focus:bg-white/10 focus:text-white">
                        Distance
                      </SelectItem>
                      <SelectItem value="age" className="text-white focus:bg-white/10 focus:text-white">
                        Age
                      </SelectItem>
                      <SelectItem value="fame" className="text-white focus:bg-white/10 focus:text-white">
                        Fame
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 border-t border-white/10 flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => discover.setShowPopup(false)}
                  className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl px-4"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApply}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl px-6 shadow-lg shadow-purple-500/25"
                >
                  Apply
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterPopup;
