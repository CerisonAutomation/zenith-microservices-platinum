import { Dialog, DialogContent, DialogHeader, DialogTitle, Label, Button, Badge } from "@zenith/ui-components";
import { Slider } from "../ui/slider";
import { useState, useCallback } from "react";
import { X } from "lucide-react";
import { DEFAULT_MIN_AGE, DEFAULT_MAX_AGE, MIN_AGE, MAX_AGE, DEFAULT_DISTANCE, MIN_DISTANCE, MAX_DISTANCE, TRIBES } from "@/constants/app";

interface FilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FilterDialog({ open, onOpenChange }: FilterDialogProps) {
  const [ageRange, setAgeRange] = useState([DEFAULT_MIN_AGE, DEFAULT_MAX_AGE]);
  const [distance, setDistance] = useState([DEFAULT_DISTANCE]);
  const [selectedTribes, setSelectedTribes] = useState<string[]>([]);

  const toggleTribe = useCallback((tribe: string) => {
    setSelectedTribes(prev =>
      prev.includes(tribe) ? prev.filter(t => t !== tribe) : [...prev, tribe]
    );
  }, []);

  const handleReset = useCallback(() => {
    setAgeRange([DEFAULT_MIN_AGE, DEFAULT_MAX_AGE]);
    setDistance([DEFAULT_DISTANCE]);
    setSelectedTribes([]);
  }, []);

  const handleApply = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-gradient-to-br from-purple-900/95 via-black/95 to-pink-900/95 backdrop-blur-xl border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Filters</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Age Range */}
          <div className="space-y-3">
            <Label className="text-base">Age Range</Label>
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>{ageRange[0]} years</span>
              <span>{ageRange[1]} years</span>
            </div>
            <Slider
              value={ageRange}
              onValueChange={setAgeRange}
              min={MIN_AGE}
              max={MAX_AGE}
              step={1}
              className="w-full"
            />
          </div>

          {/* Distance */}
          <div className="space-y-3">
            <Label className="text-base">Distance</Label>
            <div className="text-sm text-gray-400 mb-2">
              Within {distance[0]} km
            </div>
            <Slider
              value={distance}
              onValueChange={setDistance}
              min={MIN_DISTANCE}
              max={MAX_DISTANCE}
              step={1}
              className="w-full"
            />
          </div>

          {/* Tribes */}
          <div className="space-y-3">
            <Label className="text-base">Tribes</Label>
            <div className="flex flex-wrap gap-2">
              {TRIBES.map((tribe) => (
                <Badge
                  key={tribe}
                  variant={selectedTribes.includes(tribe) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    selectedTribes.includes(tribe)
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 border-0"
                      : "border-white/20 hover:bg-white/10"
                  }`}
                  onClick={() => toggleTribe(tribe)}
                >
                  {tribe}
                  {selectedTribes.includes(tribe) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1 border-white/20 hover:bg-white/10"
              onClick={handleReset}
            >
              Reset
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              onClick={handleApply}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
