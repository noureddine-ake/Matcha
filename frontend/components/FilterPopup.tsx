'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useDiscover } from '@/contexts/discover-context';


const FilterPopup = () => {
  const discover = useDiscover()

  const handleChange = (key: string, value: number[]) => {
    discover.setFilters({ ...discover.filters, [key]: value[0] });
  };

  const handleApply = () => {
    discover.setShowPopup(false);
    discover.fetchSuggestions();
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="icon"
        className="bg-white/10 border border-white/20 hover:bg-white/20 transition-all backdrop-blur-lg rounded-full"
        onClick={() => discover.setShowPopup(!discover.showPopup)}
      >
        <SlidersHorizontal className="w-5 h-5 text-white" />
      </Button>

      {/* Popup Modal */}
      <AnimatePresence>
        {discover.showPopup && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="absolute top-12 right-0 z-50 w-80"
          >
            <Card className="bg-gradient-to-b from-indigo-900/95 to-indigo-900/90 backdrop-blur-lg border border-white/20 rounded-3xl shadow-xl">
              <CardContent className="p-5 space-y-5 text-white">
                <h2 className="text-lg font-semibold text-center text-white">
                  Filter Profiles
                </h2>

                {/* Distance */}
                <div className="space-y-2">
                  <Label className="text-sm text-purple-200">Max Distance ({discover.filters.maxDistance} km)</Label>
                  <Slider
                    value={[discover.filters.maxDistance]}
                    max={200}
                    step={5}
                    onValueChange={(v: number[]) => handleChange('maxDistance', v)}
                  />
                </div>

                {/* Age */}
                <div className="space-y-2">
                  <Label className="text-sm text-purple-200">Age Range ({discover.filters.minAge}-{discover.filters.maxAge})</Label>
                  <Slider
                    value={[discover.filters.minAge]}
                    max={discover.filters.maxAge}
                    step={1}
                    onValueChange={(v: number[]) => handleChange('minAge', v)}
                  />
                  <Slider
                    value={[discover.filters.maxAge]}
                    min={discover.filters.minAge}
                    max={70}
                    step={1}
                    onValueChange={(v: number[]) => handleChange('maxAge', v)}
                  />
                </div>

                {/* Fame */}
                <div className="space-y-2">
                  <Label className="text-sm text-purple-200">Fame Rating ({discover.filters.minFame}-{discover.filters.maxFame})</Label>
                  <Slider
                    value={[discover.filters.minFame]}
                    max={discover.filters.maxFame}
                    step={1}
                    onValueChange={(v: number[]) => handleChange('minFame', v)}
                  />
                  <Slider
                    value={[discover.filters.maxFame]}
                    min={discover.filters.minFame}
                    max={5}
                    step={1}
                    onValueChange={(v: number[]) => handleChange('maxFame', v)}
                  />
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <Label className="text-sm text-purple-200">Sort By</Label>
                  <select
                    className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={discover.filters.sortBy}
                    onChange={(e) =>
                      discover.setFilters({ ...discover.filters, sortBy: e.target.value as 'distance' | 'age' | 'fame' })
                    }
                  >
                    <option value="distance">Distance</option>
                    <option value="age">Age</option>
                    <option value="fame">Fame</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => discover.setShowPopup(false)}
                    className="text-purple-200 hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApply}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/50 text-white"
                  >
                    Apply
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FilterPopup