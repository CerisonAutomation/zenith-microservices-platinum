'use client'

import { Shield, AlertTriangle, Phone, MapPin, Eye, Lock, UserX, FileText } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { useState } from "react";

export default function SafetyCenter() {
  const [incognitoMode, setIncognitoMode] = useState(false);
  const [readReceipts, setReadReceipts] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white pb-20">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Safety Center</h1>
            <p className="text-gray-400">Your security is our priority</p>
          </div>
        </div>

        {/* Emergency Contact */}
        <Card className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/30 p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-2">Emergency Contact</h3>
              <p className="text-sm text-gray-300 mb-4">
                Set up an emergency contact who will be notified if you activate the panic button during a meet.
              </p>
              <Button variant="outline" className="border-red-500/50 hover:bg-red-500/10">
                <Phone className="w-4 h-4 mr-2" />
                Add Emergency Contact
              </Button>
            </div>
          </div>
        </Card>

        {/* Privacy Settings */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-400" />
            Privacy Settings
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Incognito Mode</Label>
                <p className="text-sm text-gray-400">Browse profiles anonymously</p>
              </div>
              <Switch checked={incognitoMode} onCheckedChange={setIncognitoMode} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Read Receipts</Label>
                <p className="text-sm text-gray-400">Let others know when you've read their messages</p>
              </div>
              <Switch checked={readReceipts} onCheckedChange={setReadReceipts} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Location Sharing</Label>
                <p className="text-sm text-gray-400">Share your approximate location</p>
              </div>
              <Switch checked={locationSharing} onCheckedChange={setLocationSharing} />
            </div>
          </div>
        </Card>

        {/* Safety Features */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6">
          <h3 className="text-xl font-semibold mb-4">Safety Features</h3>
          
          <div className="grid gap-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <MapPin className="w-6 h-6 text-green-400 shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Share Your Location</h4>
                <p className="text-sm text-gray-400">Share your real-time location with trusted contacts during meets</p>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <Eye className="w-6 h-6 text-blue-400 shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Profile Verification</h4>
                <p className="text-sm text-gray-400">Verify your identity to build trust with the community</p>
              </div>
              <Button size="sm" variant="outline" className="border-white/20">
                Verify
              </Button>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <UserX className="w-6 h-6 text-red-400 shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Block & Report</h4>
                <p className="text-sm text-gray-400">Block users and report inappropriate behavior</p>
              </div>
              <Button size="sm" variant="outline" className="border-white/20">
                Manage
              </Button>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <FileText className="w-6 h-6 text-purple-400 shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Safety Tips</h4>
                <p className="text-sm text-gray-400">Learn best practices for safe online dating</p>
              </div>
              <Button size="sm" variant="outline" className="border-white/20">
                Read
              </Button>
            </div>
          </div>
        </Card>

        {/* Blocked Users */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6">
          <h3 className="text-xl font-semibold mb-4">Blocked Users</h3>
          <p className="text-sm text-gray-400 mb-4">You have blocked 3 users</p>
          <Button variant="outline" className="border-white/20 hover:bg-white/10">
            Manage Blocked Users
          </Button>
        </Card>

        {/* Help & Support */}
        <Card className="bg-blue-500/10 border-blue-500/30 p-6">
          <h3 className="text-xl font-semibold mb-2">Need Help?</h3>
          <p className="text-sm text-gray-300 mb-4">
            Our support team is available 24/7 to assist you with any safety concerns.
          </p>
          <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
            Contact Support
          </Button>
        </Card>
      </div>
    </div>
  );
}
