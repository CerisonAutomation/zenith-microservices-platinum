/**
 * Platinum Upgrade Dialog
 * Premium upgrade flow for senior/executive level members
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import {
  Crown,
  Shield,
  Sparkles,
  Calendar,
  Phone,
  Globe,
  Award,
  Briefcase,
  CheckCircle2,
  Star,
  TrendingUp,
  DollarSign,
  Lock,
} from "lucide-react";
import { DATING_APP_CONFIG } from "@/config/dating-app.config";
import { motion, AnimatePresence } from "framer-motion";

interface PlatinumUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PlatinumUpgradeDialog({
  open,
  onOpenChange,
}: PlatinumUpgradeDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "quarterly" | "yearly">(
    "yearly"
  );
  const [showAgeGate, setShowAgeGate] = useState(true);
  const [age, setAge] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  const platinumPricing = DATING_APP_CONFIG.pricing.platinum;
  const minimumAge = DATING_APP_CONFIG.ageVerification.minimumPlatinumAge;

  const handleAgeConfirm = () => {
    const userAge = parseInt(age);
    if (userAge >= minimumAge) {
      setAgeConfirmed(true);
      setShowAgeGate(false);
    }
  };

  const platinumFeatures = [
    {
      icon: Shield,
      title: "Professional Verification",
      description: "Income, employment, and background screening",
    },
    {
      icon: Crown,
      title: "Exclusive 30+ Community",
      description: "Connect with verified professionals only",
    },
    {
      icon: Phone,
      title: "24/7 Concierge Service",
      description: "Personal assistant for date planning and travel",
    },
    {
      icon: Calendar,
      title: "Executive Events",
      description: "Access to yacht parties, galas, and networking events",
    },
    {
      icon: Sparkles,
      title: "AI-Powered Matching",
      description: "Advanced algorithm for compatible professionals",
    },
    {
      icon: Award,
      title: "Platinum Badge",
      description: "Stand out with exclusive verification status",
    },
    {
      icon: TrendingUp,
      title: "Priority in Search",
      description: "Always appear at the top of search results",
    },
    {
      icon: Globe,
      title: "Travel Concierge",
      description: "International dating assistance and planning",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border-amber-500/30">
        <AnimatePresence mode="wait">
          {showAgeGate && !ageConfirmed ? (
            <motion.div
              key="age-gate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12"
            >
              <div className="inline-block p-4 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full mb-6">
                <Lock className="w-16 h-16 text-white" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-3xl text-white mb-4">
                  Platinum Membership Age Requirement
                </DialogTitle>
                <DialogDescription className="text-gray-300 text-lg mb-6">
                  Platinum membership is exclusively for professionals aged {minimumAge}+
                </DialogDescription>
              </DialogHeader>

              <div className="max-w-md mx-auto">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Your Age
                </label>
                <input
                  type="number"
                  min={minimumAge}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder={`Enter your age (${minimumAge}+)`}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
                />
                <Button
                  onClick={handleAgeConfirm}
                  disabled={!age || parseInt(age) < minimumAge}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold py-3"
                >
                  Continue to Platinum
                </Button>
                {age && parseInt(age) < minimumAge && (
                  <p className="text-red-400 text-sm mt-2">
                    You must be at least {minimumAge} years old for Platinum membership
                  </p>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="upgrade-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-2xl">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-3xl text-white">
                      Upgrade to Platinum
                    </DialogTitle>
                    <DialogDescription className="text-gray-300">
                      Join the elite community of verified professionals
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="mt-6 space-y-6">
                {/* Pricing Plans */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Choose Your Plan</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Monthly */}
                    <Card
                      onClick={() => setSelectedPlan("monthly")}
                      className={`cursor-pointer transition-all ${
                        selectedPlan === "monthly"
                          ? "bg-amber-500/20 border-amber-500"
                          : "bg-white/10 border-white/20 hover:border-amber-500/50"
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="text-center">
                          <p className="text-gray-400 text-sm mb-2">Monthly</p>
                          <p className="text-4xl font-bold text-white mb-1">
                            ${platinumPricing.monthly.price}
                          </p>
                          <p className="text-gray-400 text-sm">per month</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quarterly */}
                    <Card
                      onClick={() => setSelectedPlan("quarterly")}
                      className={`cursor-pointer transition-all ${
                        selectedPlan === "quarterly"
                          ? "bg-amber-500/20 border-amber-500"
                          : "bg-white/10 border-white/20 hover:border-amber-500/50"
                      }`}
                    >
                      <CardContent className="p-6">
                        <Badge className="bg-green-500 mb-2">
                          Save {platinumPricing.quarterly.savings}
                        </Badge>
                        <div className="text-center">
                          <p className="text-gray-400 text-sm mb-2">Quarterly</p>
                          <p className="text-4xl font-bold text-white mb-1">
                            ${platinumPricing.quarterly.price}
                          </p>
                          <p className="text-gray-400 text-sm">every 3 months</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Yearly - Best Value */}
                    <Card
                      onClick={() => setSelectedPlan("yearly")}
                      className={`cursor-pointer transition-all relative ${
                        selectedPlan === "yearly"
                          ? "bg-amber-500/20 border-amber-500"
                          : "bg-white/10 border-white/20 hover:border-amber-500/50"
                      }`}
                    >
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                          BEST VALUE
                        </Badge>
                      </div>
                      <CardContent className="p-6">
                        <Badge className="bg-green-500 mb-2">
                          Save {platinumPricing.yearly.savings}
                        </Badge>
                        <div className="text-center">
                          <p className="text-gray-400 text-sm mb-2">Yearly</p>
                          <p className="text-4xl font-bold text-white mb-1">
                            ${platinumPricing.yearly.price}
                          </p>
                          <p className="text-gray-400 text-sm">per year</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Features Grid */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    Platinum Features
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {platinumFeatures.map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className="bg-white/5 border-white/10">
                            <CardContent className="p-4">
                              <div className="flex gap-3">
                                <div className="p-2 bg-amber-500/20 rounded-lg h-fit">
                                  <Icon className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-white mb-1">
                                    {feature.title}
                                  </h4>
                                  <p className="text-sm text-gray-400">
                                    {feature.description}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Verification Requirements */}
                <Card className="bg-blue-500/10 border-blue-500/30">
                  <CardContent className="p-6">
                    <div className="flex gap-3">
                      <Shield className="w-6 h-6 text-blue-400 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-white mb-2">
                          Professional Verification Required
                        </h4>
                        <p className="text-sm text-gray-300 mb-3">
                          Upon upgrading, you'll complete our professional verification
                          process including:
                        </p>
                        <ul className="space-y-2 text-sm text-gray-300">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            Income verification (tax returns or pay stubs)
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            Employment verification (LinkedIn, business card, or license)
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            Background screening (criminal & employment history)
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            Video verification call
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* CTA */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1 border-white/20 hover:bg-white/10"
                  >
                    Maybe Later
                  </Button>
                  <Button className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold py-6 text-lg">
                    <Crown className="w-5 h-5 mr-2" />
                    Upgrade to Platinum - $
                    {selectedPlan === "monthly"
                      ? platinumPricing.monthly.price
                      : selectedPlan === "quarterly"
                      ? platinumPricing.quarterly.price
                      : platinumPricing.yearly.price}
                  </Button>
                </div>

                {/* Money Back Guarantee */}
                <div className="text-center">
                  <p className="text-sm text-gray-400">
                    <Star className="w-4 h-4 inline text-amber-400" /> 30-day money-back
                    guarantee • Cancel anytime
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
