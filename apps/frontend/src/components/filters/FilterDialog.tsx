import { Dialog, DialogContent, DialogHeader, DialogTitle, Label, Button, Badge } from "@zenith/ui-components";
import { Slider } from "../ui/slider";
import { useState } from "react";
import { X } from "lucide-react";

interface FilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FilterDialog({ open, onOpenChange }: FilterDialogProps) {
  const [ageRange, setAgeRange] = useState([18, 50]);
  const [distance, setDistance] = useState([10]);
  const [selectedTribes, setSelectedTribes] = useState<string[]>([]);

  const tribes = [
    "Bear", "Otter", "Twink", "Jock", "Geek", "Leather", "Daddy", "Poz", "Clean-Cut", "Rugged"
  ];

  const toggleTribe = (tribe: string) => {
    setSelectedTribes(prev =>
      prev.includes(tribe) ? prev.filter(t => t !== tribe) : [...prev, tribe]
    );
  };

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
              min={18}
              max={80}
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
              min={1}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* Tribes */}
          <div className="space-y-3">
            <Label className="text-base">Tribes</Label>
            <div className="flex flex-wrap gap-2">
              {tribes.map((tribe) => (
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
              onClick={() => {
                setAgeRange([18, 50]);
                setDistance([10]);
                setSelectedTribes([]);
              }}
            >
              Reset
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              onClick={() => onOpenChange(false)}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
