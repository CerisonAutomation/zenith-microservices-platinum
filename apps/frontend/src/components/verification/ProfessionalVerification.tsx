/**
 * Professional Verification Component
 * Multi-step verification process for Platinum members
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Briefcase,
  DollarSign,
  Shield,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  FileText,
  Video,
  LinkedinIcon,
  GraduationCap,
} from "lucide-react";
import { DATING_APP_CONFIG } from "@/config/dating-app.config";
import type { ProfessionalProfile } from "@/types/dating.types";

interface ProfessionalVerificationProps {
  onComplete?: (profile: Partial<ProfessionalProfile>) => void;
  onCancel?: () => void;
}

export default function ProfessionalVerification({
  onComplete,
  onCancel,
}: ProfessionalVerificationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [verificationData, setVerificationData] = useState<
    Partial<ProfessionalProfile>
  >({
    category: undefined,
    jobTitle: "",
    company: "",
    industry: "",
    yearsOfExperience: 0,
    education: [],
    incomeTier: undefined,
    linkedInProfile: "",
    portfolioUrl: "",
  });

  const steps = [
    {
      id: "category",
      title: "Professional Category",
      description: "Select your professional category",
      icon: Briefcase,
    },
    {
      id: "details",
      title: "Professional Details",
      description: "Tell us about your career",
      icon: GraduationCap,
    },
    {
      id: "income",
      title: "Income Verification",
      description: "Verify your income tier",
      icon: DollarSign,
    },
    {
      id: "documents",
      title: "Document Upload",
      description: "Upload verification documents",
      icon: Upload,
    },
    {
      id: "video",
      title: "Video Verification",
      description: "Complete video verification call",
      icon: Video,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.(verificationData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateVerificationData = (data: Partial<ProfessionalProfile>) => {
    setVerificationData({ ...verificationData, ...data });
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full mb-4">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Professional Verification
          </h1>
          <p className="text-gray-400">
            Complete verification to unlock all Platinum features
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isActive
                          ? "bg-gradient-to-br from-amber-400 to-yellow-600"
                          : isCompleted
                          ? "bg-green-500"
                          : "bg-white/10"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      ) : (
                        <Icon
                          className={`w-6 h-6 ${
                            isActive ? "text-white" : "text-gray-400"
                          }`}
                        />
                      )}
                    </div>
                    <p
                      className={`text-xs mt-2 hidden md:block ${
                        isActive ? "text-amber-400 font-medium" : "text-gray-400"
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        isCompleted ? "bg-green-500" : "bg-white/10"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-white/10 border-white/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  {React.createElement(currentStepData.icon, {
                    className: "w-6 h-6 text-amber-400",
                  })}
                  {currentStepData.title}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {currentStepData.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Step 0: Professional Category */}
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <p className="text-gray-300 mb-4">
                      Select the category that best describes your professional
                      background:
                    </p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {DATING_APP_CONFIG.professionalVerification.categories.map(
                        (cat) => (
                          <Button
                            key={cat.id}
                            variant="outline"
                            onClick={() =>
                              updateVerificationData({
                                category: cat.id as ProfessionalProfile["category"],
                              })
                            }
                            className={`h-auto p-4 flex flex-col items-start text-left ${
                              verificationData.category === cat.id
                                ? "bg-amber-500/20 border-amber-500"
                                : "border-white/20 hover:bg-white/10"
                            }`}
                          >
                            <span className="font-semibold text-white mb-1">
                              {cat.label}
                            </span>
                            <span className="text-xs text-gray-400">
                              Required: {cat.requiredDocs.join(", ")}
                            </span>
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Step 1: Professional Details */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={verificationData.jobTitle}
                        onChange={(e) =>
                          updateVerificationData({ jobTitle: e.target.value })
                        }
                        placeholder="e.g., Senior Vice President"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        value={verificationData.company}
                        onChange={(e) =>
                          updateVerificationData({ company: e.target.value })
                        }
                        placeholder="e.g., Fortune 500 Corporation"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Industry
                      </label>
                      <input
                        type="text"
                        value={verificationData.industry}
                        onChange={(e) =>
                          updateVerificationData({ industry: e.target.value })
                        }
                        placeholder="e.g., Technology, Finance, Healthcare"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={verificationData.yearsOfExperience}
                        onChange={(e) =>
                          updateVerificationData({
                            yearsOfExperience: parseInt(e.target.value),
                          })
                        }
                        placeholder="15"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        LinkedIn Profile (Optional)
                      </label>
                      <div className="relative">
                        <LinkedinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                        <input
                          type="url"
                          value={verificationData.linkedInProfile}
                          onChange={(e) =>
                            updateVerificationData({
                              linkedInProfile: e.target.value,
                            })
                          }
                          placeholder="https://linkedin.com/in/yourprofile"
                          className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Income Verification */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <p className="text-gray-300 mb-4">
                      Select your verified income tier. You'll need to provide
                      documentation in the next step.
                    </p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {DATING_APP_CONFIG.professionalVerification.incomeVerification.tiers.map(
                        (tier) => (
                          <Button
                            key={tier.id}
                            variant="outline"
                            onClick={() =>
                              updateVerificationData({
                                incomeTier: tier.id as ProfessionalProfile["incomeTier"],
                              })
                            }
                            className={`h-auto p-4 flex items-center gap-3 ${
                              verificationData.incomeTier === tier.id
                                ? "bg-green-500/20 border-green-500"
                                : "border-white/20 hover:bg-white/10"
                            }`}
                          >
                            <DollarSign className="w-6 h-6 text-green-400" />
                            <div className="text-left">
                              <div className="font-semibold text-white">
                                {tier.label}
                              </div>
                              <div className="text-xs text-gray-400">Annual Income</div>
                            </div>
                          </Button>
                        )
                      )}
                    </div>

                    <Card className="bg-blue-500/10 border-blue-500/30">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-gray-300">
                            <p className="font-semibold mb-1">
                              Verification Methods Accepted:
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                              <li>Recent tax returns (1040)</li>
                              <li>Last 3 months of pay stubs</li>
                              <li>Bank statements showing income</li>
                              <li>CPA/Accountant verification letter</li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Step 3: Document Upload */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <p className="text-gray-300 mb-4">
                      Upload the required documents to verify your professional status
                      and income.
                    </p>

                    <div className="space-y-4">
                      {/* ID Document */}
                      <Card className="bg-white/5 border-white/10">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-amber-400" />
                              <span className="font-medium text-white">
                                Government ID
                              </span>
                            </div>
                            <Badge className="bg-red-500/20 text-red-300">Required</Badge>
                          </div>
                          <Button
                            variant="outline"
                            className="w-full border-white/20 hover:bg-white/10"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload ID Document
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Professional License/Credentials */}
                      <Card className="bg-white/5 border-white/10">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-5 h-5 text-purple-400" />
                              <span className="font-medium text-white">
                                Professional License/Credentials
                              </span>
                            </div>
                            <Badge className="bg-red-500/20 text-red-300">Required</Badge>
                          </div>
                          <Button
                            variant="outline"
                            className="w-full border-white/20 hover:bg-white/10"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload License/Credentials
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Income Verification */}
                      <Card className="bg-white/5 border-white/10">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-5 h-5 text-green-400" />
                              <span className="font-medium text-white">
                                Income Verification
                              </span>
                            </div>
                            <Badge className="bg-red-500/20 text-red-300">Required</Badge>
                          </div>
                          <Button
                            variant="outline"
                            className="w-full border-white/20 hover:bg-white/10"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Income Documentation
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="bg-amber-500/10 border-amber-500/30">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-gray-300">
                            <p className="font-semibold mb-1">Privacy & Security:</p>
                            <p>
                              All documents are encrypted and reviewed by our verification
                              team only. Documents are never shared with other users and
                              are deleted after verification.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Step 4: Video Verification */}
                {currentStep === 4 && (
                  <div className="space-y-4 text-center">
                    <div className="inline-block p-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
                      <Video className="w-16 h-16 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      Video Verification Call
                    </h3>
                    <p className="text-gray-300 max-w-2xl mx-auto">
                      Schedule a brief 5-minute video call with our verification team to
                      confirm your identity and review your documents. This ensures the
                      highest level of security for all Platinum members.
                    </p>

                    <Card className="bg-white/5 border-white/10 max-w-md mx-auto">
                      <CardContent className="p-6">
                        <h4 className="font-semibold text-white mb-3">
                          What to expect:
                        </h4>
                        <ul className="text-left space-y-2 text-sm text-gray-300">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>Identity verification with government ID</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>Quick review of uploaded documents</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>Answer any questions you may have</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>Usually completed within 24 hours</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-8 py-6 text-lg">
                      <Video className="w-5 h-5 mr-2" />
                      Schedule Video Call
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-6">
          {currentStep > 0 && (
            <Button
              onClick={handleBack}
              variant="outline"
              className="flex-1 border-white/20 hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={
              (currentStep === 0 && !verificationData.category) ||
              (currentStep === 1 &&
                (!verificationData.jobTitle || !verificationData.company)) ||
              (currentStep === 2 && !verificationData.incomeTier)
            }
            className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
          >
            {currentStep === steps.length - 1 ? "Complete Verification" : "Continue"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Cancel */}
        {onCancel && (
          <div className="text-center mt-4">
            <Button
              onClick={onCancel}
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              Cancel Verification
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
