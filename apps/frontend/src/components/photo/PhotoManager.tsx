'use client'

import { Upload, X, Camera, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { useState, useRef } from "react";
import { motion, Reorder } from "framer-motion";

interface PhotoManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
}

export default function PhotoManager({ open, onOpenChange, photos = [], onPhotosChange }: PhotoManagerProps) {
  const [localPhotos, setLocalPhotos] = useState<string[]>(photos);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    
    // Simulate upload - in production, upload to storage service
    const newPhotos = await Promise.all(
      files.map(async (file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      })
    );

    setLocalPhotos([...localPhotos, ...newPhotos]);
    setUploading(false);
  };

  const removePhoto = (index: number) => {
    setLocalPhotos(localPhotos.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onPhotosChange(localPhotos);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-gradient-to-br from-purple-900/95 via-black/95 to-pink-900/95 backdrop-blur-xl border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="w-6 h-6" />
            Manage Photos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          <Card
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 p-8 cursor-pointer transition-all"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                <Upload className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="font-semibold mb-1">Upload Photos</p>
                <p className="text-sm text-gray-400">Click to browse or drag and drop</p>
                <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 10MB each</p>
              </div>
            </div>
          </Card>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Photo Grid */}
          {localPhotos.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Your Photos ({localPhotos.length}/9)</h3>
                <p className="text-sm text-gray-400">Drag to reorder</p>
              </div>

              <Reorder.Group
                axis="x"
                values={localPhotos}
                onReorder={setLocalPhotos}
                className="grid grid-cols-3 gap-4"
              >
                {localPhotos.map((photo, index) => (
                  <Reorder.Item key={photo} value={photo}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="relative aspect-square rounded-xl overflow-hidden group"
                    >
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {index === 0 && (
                        <div className="absolute top-2 left-2">
                          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                            Primary
                          </div>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removePhoto(index)}
                          className="rounded-full bg-red-500/80 hover:bg-red-600"
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>

                      <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full text-xs">
                        {index + 1}
                      </div>
                    </motion.div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          )}

          {/* Tips */}
          <Card className="bg-blue-500/10 border-blue-500/30 p-4">
            <h4 className="font-semibold mb-2 text-blue-300">Photo Tips</h4>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• Use clear, recent photos that show your face</li>
              <li>• First photo is your primary - make it count!</li>
              <li>• Variety is key - include different settings and angles</li>
              <li>• Verified photos get 3x more matches</li>
            </ul>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-white/20 hover:bg-white/10"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={uploading}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {uploading ? "Uploading..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
