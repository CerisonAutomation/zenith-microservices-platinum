import { Camera, Edit, Settings, MapPin, Cake, Ruler, Heart, Crown, Shield, Image as ImageIcon, CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { useState } from "react";
import PhotoManager from "../photo/PhotoManager";
import SubscriptionDialog from "../subscription/SubscriptionDialog";

export default function ProfileTab() {
  const [photoManagerOpen, setPhotoManagerOpen] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [photos, setPhotos] = useState<string[]>([
    "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
  ]);

  const membershipTier = "free"; // or "premium" or "elite"

  return (
    <div className="min-h-screen pb-6">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-purple-900/95 via-purple-800/95 to-amber-900/95 backdrop-blur-xl border-b border-amber-500/20">
        <div className="px-4 py-2 flex items-center justify-between">
          <h1 className="text-lg font-light tracking-wide bg-gradient-to-r from-amber-300 via-amber-200 to-amber-100 bg-clip-text text-transparent">
            Profile
          </h1>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/30 transition-all duration-300 shadow-lg hover:shadow-amber-500/25 w-8 h-8"
          >
            <Settings className="w-4 h-4 text-amber-200" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Membership Upgrade Banner */}
        {membershipTier === "free" && (
          <Card className="bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 border-yellow-500/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8 text-yellow-400" />
                <div>
                  <h3 className="font-semibold text-white">Upgrade to Premium</h3>
                  <p className="text-sm text-gray-300">Unlock unlimited features</p>
                </div>
              </div>
              <Button
                onClick={() => setSubscriptionOpen(true)}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold"
              >
                Upgrade
              </Button>
            </div>
          </Card>
        )}

        {/* Profile Header */}
        <div className="relative">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <Avatar className="w-full h-full border-4 border-white/10">
              <AvatarImage src={photos[0]} />
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              onClick={() => setPhotoManagerOpen(true)}
              className="absolute bottom-0 right-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Camera className="w-4 h-4" />
            </Button>
            {membershipTier !== "free" && (
              <div className="absolute -top-2 -right-2">
                <Crown className="w-8 h-8 text-yellow-400 fill-yellow-400" />
              </div>
            )}
          </div>

          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-white">Your Name</h2>
              <CheckCircle className="w-5 h-5 text-blue-400 fill-blue-400" />
              <Shield className="w-5 h-5 text-green-400 fill-green-400" />
            </div>
            <p className="text-gray-400">@username</p>
            {membershipTier !== "free" && (
              <Badge className="mt-2 bg-gradient-to-r from-yellow-500 to-orange-500 border-0">
                {membershipTier === "premium" ? "Premium Member" : "Elite Member"}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
            <Button
              onClick={() => setPhotoManagerOpen(true)}
              variant="outline"
              className="border-white/20 hover:bg-white/10"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Manage Photos
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">247</div>
            <div className="text-xs text-gray-400">Views</div>
          </Card>
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">89</div>
            <div className="text-xs text-gray-400">Favorites</div>
          </Card>
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">34</div>
            <div className="text-xs text-gray-400">Matches</div>
          </Card>
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">95%</div>
            <div className="text-xs text-gray-400">Response</div>
          </Card>
        </div>

        {/* Verification Status */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Verification Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 fill-green-400" />
                <span className="text-gray-300">Email Verified</span>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Verified
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 fill-green-400" />
                <span className="text-gray-300">Phone Verified</span>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Verified
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-400 fill-green-400" />
                <span className="text-gray-300">Video Verified</span>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Verified
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">Identity Verified</span>
              </div>
              <Button size="sm" variant="outline" className="border-white/20 hover:bg-white/10">
                Verify Now
              </Button>
            </div>
          </div>
        </Card>

        {/* About */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">About Me</h3>
          <p className="text-gray-300 mb-4">
            Adventure seeker and coffee enthusiast. Love exploring new places and meeting interesting people. 
            Always up for a good conversation! 🌟
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-300">
              <MapPin className="w-5 h-5 text-purple-400" />
              <span>San Francisco, CA</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Cake className="w-5 h-5 text-purple-400" />
              <span>28 years old</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Ruler className="w-5 h-5 text-purple-400" />
              <span>5'10" (178 cm)</span>
            </div>
          </div>
        </Card>

        {/* Interests */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Interests</h3>
          <div className="flex flex-wrap gap-2">
            {["Travel", "Fitness", "Music", "Photography", "Cooking", "Gaming"].map((interest) => (
              <Badge
                key={interest}
                className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-white/20 text-white"
              >
                {interest}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Tribes */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Tribes</h3>
          <div className="flex flex-wrap gap-2">
            {["Otter", "Geek", "Clean-Cut"].map((tribe) => (
              <Badge
                key={tribe}
                className="bg-gradient-to-r from-purple-500 to-pink-500 border-0 text-white"
              >
                {tribe}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Looking For */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-400" />
            Looking For
          </h3>
          <div className="flex flex-wrap gap-2">
            {["Friends", "Dates", "Relationship", "Networking"].map((item) => (
              <Badge
                key={item}
                variant="outline"
                className="border-white/20 text-white"
              >
                {item}
              </Badge>
            ))}
          </div>
        </Card>
      </div>

      <PhotoManager
        open={photoManagerOpen}
        onOpenChange={setPhotoManagerOpen}
        photos={photos}
        onPhotosChange={setPhotos}
      />

      <SubscriptionDialog
        open={subscriptionOpen}
        onOpenChange={setSubscriptionOpen}
      />
    </div>
  );
}