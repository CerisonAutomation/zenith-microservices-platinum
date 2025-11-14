import { Crown, Check, Zap, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button, Card, Badge } from "@zenith/ui-components";
import { loadStripe } from "@stripe/stripe-js";

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const plans = [
  {
    id: "premium",
    name: "Premium",
    price: 9.99,
    icon: Star,
    color: "from-purple-500 to-pink-500",
    features: [
      "Unlimited likes & matches",
      "See who liked you",
      "Advanced filters",
      "Incognito mode",
      "Read receipts",
      "Rewind last swipe",
      "5 Super Likes per day",
      "Boost profile monthly",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    price: 19.99,
    icon: Crown,
    color: "from-yellow-500 to-orange-500",
    popular: true,
    features: [
      "Everything in Premium",
      "Priority placement",
      "Travel mode",
      "Unlimited Super Likes",
      "Weekly Boost",
      "Profile verification",
      "Video chat",
      "Concierge service",
      "Exclusive events access",
      "Ad-free experience",
    ],
  },
];

export default function SubscriptionDialog({ open, onOpenChange }: SubscriptionDialogProps) {
  const handleSubscribe = async (planId: string) => {
    // In production, create Stripe checkout session

    
    // Simulate Stripe checkout
    const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "pk_test_demo");
    
    // Create checkout session via API
    // const response = await fetch('/api/create-checkout-session', {
    //   method: 'POST',
    //   body: JSON.stringify({ planId })
    // });
    // const session = await response.json();
    // stripe?.redirectToCheckout({ sessionId: session.id });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl bg-gradient-to-br from-purple-900/95 via-black/95 to-pink-900/95 backdrop-blur-xl border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center">
            Upgrade Your Experience
          </DialogTitle>
          <p className="text-center text-gray-400 mt-2">
            Choose the perfect plan to unlock premium features
          </p>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id}
                className={`relative bg-white/5 border-white/10 p-6 ${
                  plan.popular ? "ring-2 ring-yellow-500" : ""
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 border-0">
                    Most Popular
                  </Badge>
                )}

                <div className="text-center mb-6">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${plan.color} mb-4`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 font-semibold`}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Subscribe Now
                </Button>

                <p className="text-xs text-center text-gray-500 mt-4">
                  Cancel anytime • Secure payment via Stripe
                </p>
              </Card>
            );
          })}
        </div>

        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30 p-6 mt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-500/20">
              <Crown className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h4 className="font-semibold mb-2">NFT Lifetime Membership</h4>
              <p className="text-sm text-gray-300 mb-3">
                Get all Elite features forever with our exclusive NFT pass. Limited to 1,000 members.
              </p>
              <Button variant="outline" className="border-blue-500/50 hover:bg-blue-500/10">
                Learn More
              </Button>
            </div>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
