'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Elite Landing Page Component
export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100">
      {/* GDPR Cookie Consent Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-neutral-800/95 backdrop-blur-sm p-6 border-t border-neutral-600 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <p className="flex-1 min-w-[300px] text-sm text-neutral-300 m-0">
            We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
            <Link href="/privacy" className="text-primary ml-2 hover:underline">
              Learn more
            </Link>
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">
              Reject
            </Button>
            <Button variant="default" size="sm">
              Accept All
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-24 px-4 text-center bg-gradient-to-b from-neutral-950/80 to-neutral-900/90">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-600 bg-clip-text text-transparent mb-6">
            Zenith Elite Dating Platform
          </h1>

          <p className="text-xl text-neutral-300 mb-8 leading-relaxed">
            Connect with elite singles in a secure, premium environment.
            Advanced matching, real-time chat, and verified profiles.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button variant="default" size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black">
              Join Free Today
            </Button>
            <Button variant="outline" size="lg">
              Explore Members
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-neutral-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-neutral-100 mb-16">
            Premium Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "AI-Powered Matching",
                description: "Advanced algorithms connect you with compatible partners based on personality, interests, and values.",
                icon: "🤖"
              },
              {
                title: "Verified Profiles",
                description: "All members undergo rigorous verification ensuring authentic connections and enhanced safety.",
                icon: "✅"
              },
              {
                title: "Real-Time Chat",
                description: "Instant messaging with read receipts, typing indicators, and media sharing capabilities.",
                icon: "💬"
              },
              {
                title: "Premium Security",
                description: "End-to-end encryption, GDPR compliance, and advanced privacy controls for your peace of mind.",
                icon: "🔒"
              },
              {
                title: "Video Calling",
                description: "High-quality video calls within the platform for deeper connections before meeting in person.",
                icon: "📹"
              },
              {
                title: "Event Networking",
                description: "Exclusive virtual and in-person events for premium members to connect in curated settings.",
                icon: "🎪"
              }
            ].map((feature, index) => (
              <Card key={index} className="bg-neutral-800/50 border-neutral-700 hover:bg-neutral-800/70 transition-colors">
                <CardHeader>
                  <div className="text-5xl mb-4 text-center">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl text-center text-neutral-100">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-neutral-400 text-center leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-neutral-900/90 to-neutral-950/80">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-neutral-100 mb-8">
            Trusted by Elite Singles Worldwide
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {[
              { number: "50,000+", label: "Active Members" },
              { number: "95%", label: "Success Rate" },
              { number: "150+", label: "Countries" },
              { number: "4.9/5", label: "User Rating" }
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-4xl font-bold text-yellow-500 mb-2">
                  {stat.number}
                </div>
                <div className="text-neutral-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <Button variant="default" size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black">
            Start Your Journey Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-neutral-700 bg-neutral-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-neutral-100 mb-4 text-xl font-semibold">
              Zenith
            </h3>
            <p className="text-neutral-400">
              The premier dating platform for discerning singles seeking meaningful connections.
            </p>
          </div>
          <div>
            <h4 className="text-neutral-300 mb-3 font-medium">
              Legal
            </h4>
            <ul className="list-none p-0 m-0 space-y-2">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR Compliance'].map((item) => (
                <li key={item}>
                  <Link
                    href={`/${item.toLowerCase().replace(' ', '-')}`}
                    className="text-neutral-400 hover:text-neutral-200 transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-neutral-700 text-center text-neutral-500">
          © 2025 Zenith Dating Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
