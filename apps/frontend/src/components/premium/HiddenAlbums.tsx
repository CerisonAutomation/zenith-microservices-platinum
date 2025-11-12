/**
 * Hidden Albums Feature
 * Premium-only private photo albums with granular access control
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Plus,
  X,
  Upload,
  Trash2,
  Share2,
  Shield,
  Star,
  Image as ImageIcon,
  Crown,
} from 'lucide-react';
import type { HiddenAlbum, DatingProfile } from '@/types/dating.types';

interface HiddenAlbumsProps {
  userId: string;
  isPremium: boolean;
  albums: HiddenAlbum[];
  onCreateAlbum: (album: Partial<HiddenAlbum>) => Promise<void>;
  onDeleteAlbum: (albumId: string) => Promise<void>;
  onShareAlbum: (albumId: string, userIds: string[]) => Promise<void>;
  onRevokeAccess: (albumId: string, userId: string) => Promise<void>;
}

export function HiddenAlbums({
  userId,
  isPremium,
  albums,
  onCreateAlbum,
  onDeleteAlbum,
  onShareAlbum,
  onRevokeAccess,
}: HiddenAlbumsProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);

  if (!isPremium) {
    return <PremiumRequired />;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Lock className="w-6 h-6 text-purple-400" />
            Hidden Albums
          </h2>
          <p className="text-gray-400 mt-1">
            Create private albums and choose who can view them
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Album
        </Button>
      </div>

      {/* Albums Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {albums.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            onClick={() => setSelectedAlbum(album.id)}
            onDelete={() => onDeleteAlbum(album.id)}
          />
        ))}
      </div>

      {/* Empty State */}
      {albums.length === 0 && !isCreating && (
        <EmptyState onCreate={() => setIsCreating(true)} />
      )}

      {/* Create Album Modal */}
      <AnimatePresence>
        {isCreating && (
          <CreateAlbumModal
            onClose={() => setIsCreating(false)}
            onCreate={async (album) => {
              await onCreateAlbum(album);
              setIsCreating(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Album Detail Modal */}
      <AnimatePresence>
        {selectedAlbum && (
          <AlbumDetailModal
            album={albums.find((a) => a.id === selectedAlbum)!}
            onClose={() => setSelectedAlbum(null)}
            onShare={onShareAlbum}
            onRevokeAccess={onRevokeAccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Album Card
function AlbumCard({
  album,
  onClick,
  onDelete,
}: {
  album: HiddenAlbum;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group relative"
    >
      <Card className="bg-black/40 backdrop-blur-xl border-2 border-purple-500/20 hover:border-purple-500/50 transition-all cursor-pointer overflow-hidden">
        <div className="relative aspect-square">
          {/* Album Cover */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-pink-900/50">
            {album.photos[0] ? (
              <img
                src={album.photos[0].url}
                alt={album.name}
                className="w-full h-full object-cover blur-md opacity-50"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-16 h-16 text-purple-400/50" />
              </div>
            )}
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex flex-col justify-end p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-200">{album.photos.length} photos</span>
            </div>
            <h3 className="text-lg font-bold text-white">{album.name}</h3>
            {album.sharedWith.length > 0 && (
              <p className="text-sm text-gray-400 mt-1">
                Shared with {album.sharedWith.length} {album.sharedWith.length === 1 ? 'person' : 'people'}
              </p>
            )}
          </div>

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-600/80 hover:bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>
        </div>
      </Card>
    </motion.div>
  );
}

// Create Album Modal
function CreateAlbumModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (album: Partial<HiddenAlbum>) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos((prev) => [...prev, ...files].slice(0, 20)); // Max 20 photos
  };

  const handleCreate = async () => {
    if (!name || photos.length === 0) return;

    setIsUploading(true);
    try {
      // In real app, upload photos to S3/Supabase Storage first
      const photoUrls = photos.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        url: URL.createObjectURL(file),
        isPublic: false,
        order: index,
        uploadedAt: new Date(),
      }));

      await onCreate({
        name,
        photos: photoUrls as any,
        sharedWith: [],
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-gradient-to-br from-purple-900/50 via-black to-pink-900/50 rounded-2xl border-2 border-purple-500/30 overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Create Hidden Album</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Album Name */}
            <div>
              <Label htmlFor="album-name" className="text-white mb-2 block">
                Album Name
              </Label>
              <Input
                id="album-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Private Photos"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            {/* Photo Upload */}
            <div>
              <Label className="text-white mb-2 block">Photos (Max 20)</Label>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-purple-500/50 transition-all">
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <p className="text-white font-semibold mb-1">Click to upload photos</p>
                  <p className="text-sm text-gray-400">
                    PNG, JPG, WebP up to 10MB ({photos.length}/20 selected)
                  </p>
                </label>
              </div>

              {/* Selected Photos Preview */}
              {photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {photos.map((file, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 flex items-center justify-center"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!name || photos.length === 0 || isUploading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              >
                {isUploading ? 'Creating...' : 'Create Album'}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Album Detail Modal
function AlbumDetailModal({
  album,
  onClose,
  onShare,
  onRevokeAccess,
}: {
  album: HiddenAlbum;
  onClose: () => void;
  onShare: (albumId: string, userIds: string[]) => Promise<void>;
  onRevokeAccess: (albumId: string, userId: string) => Promise<void>;
}) {
  const [showShareModal, setShowShareModal] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-gradient-to-br from-purple-900/50 via-black to-pink-900/50 rounded-2xl border-2 border-purple-500/30 overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Lock className="w-6 h-6 text-purple-400" />
                {album.name}
              </h2>
              <p className="text-gray-400 mt-1">{album.photos.length} photos</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowShareModal(true)}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Photos Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {album.photos.map((photo) => (
              <div key={photo.id} className="relative aspect-square group">
                <img
                  src={photo.url}
                  alt="Album photo"
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white" />
                </div>
              </div>
            ))}
          </div>

          {/* Shared With */}
          {album.sharedWith.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-3">Shared With</h3>
              <div className="space-y-2">
                {album.sharedWith.map((userId) => (
                  <div
                    key={userId}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <span className="text-white">User {userId}</span>
                    <Button
                      onClick={() => onRevokeAccess(album.id, userId)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      Revoke Access
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Empty State
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="text-center py-20">
      <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-6">
        <Lock className="w-12 h-12 text-purple-400" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">No Hidden Albums Yet</h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">
        Create private photo albums and choose who can view them. Perfect for sharing personal
        content with select connections.
      </p>
      <Button
        onClick={onCreate}
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create Your First Album
      </Button>
    </div>
  );
}

// Premium Required
function PremiumRequired() {
  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <Card className="w-full max-w-md bg-black/40 backdrop-blur-xl border-2 border-purple-500/30">
        <CardHeader>
          <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-purple-400" />
          </div>
          <CardTitle className="text-2xl text-white text-center">Premium Feature</CardTitle>
          <CardDescription className="text-gray-300 text-center">
            Hidden Albums are exclusive to Premium members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500">
            Upgrade to Premium
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
