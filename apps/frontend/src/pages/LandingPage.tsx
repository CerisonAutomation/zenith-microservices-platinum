'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Elite Landing Page Component
export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-yellow-500 focus:text-black focus:rounded-md focus:font-semibold"
      >
        Skip to main content
      </a>

      {/* GDPR Cookie Consent Banner */}
      <aside className="fixed bottom-0 left-0 right-0 bg-neutral-800/95 backdrop-blur-sm p-6 border-t border-neutral-600 z-50" role="complementary" aria-label="Cookie consent">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <p className="flex-1 min-w-[300px] text-sm text-neutral-300 m-0">
            We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
            <Link href="/privacy" className="text-primary ml-2 hover:underline">
              Learn more about our privacy policy
            </Link>
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" aria-label="Reject cookies">
              Reject
            </Button>
            <Button variant="default" size="sm" aria-label="Accept all cookies">
              Accept All
            </Button>
          </div>
        </div>
      </aside>

      <main id="main-content">
        {/* Hero Section */}
        <section className="py-24 px-4 text-center bg-gradient-to-b from-neutral-950/80 to-neutral-900/90" aria-labelledby="hero-heading">
          <div className="max-w-4xl mx-auto">
            <h1 id="hero-heading" className="text-5xl font-bold bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-600 bg-clip-text text-transparent mb-6">
              Zenith Elite Dating Platform
            </h1>

            <p className="text-xl text-neutral-300 mb-8 leading-relaxed">
              Connect with elite singles in a secure, premium environment.
              Advanced matching, real-time chat, and verified profiles.
            </p>

            <div className="flex gap-4 justify-center flex-wrap">
              <Button variant="default" size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black" aria-label="Join Zenith Dating for free today">
                Join Free Today
              </Button>
              <Button variant="outline" size="lg" aria-label="Explore our members">
                Explore Members
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 bg-neutral-900/50" aria-labelledby="features-heading">
          <div className="max-w-7xl mx-auto">
            <h2 id="features-heading" className="text-4xl font-bold text-center text-neutral-100 mb-16">
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
              <Card key={index} className="bg-neutral-800/50 border-neutral-700 hover:bg-neutral-800/70 transition-colors" role="article">
                <CardHeader>
                  <div className="text-5xl mb-4 text-center" aria-hidden="true">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl text-center text-neutral-100" id={`feature-${index}`}>
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-neutral-400 text-center leading-relaxed" aria-describedby={`feature-${index}`}>
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-16 px-4 bg-gradient-to-b from-neutral-900/90 to-neutral-950/80" aria-labelledby="social-proof-heading">
          <div className="max-w-5xl mx-auto text-center">
            <h2 id="social-proof-heading" className="text-3xl font-bold text-neutral-100 mb-8">
              Trusted by Elite Singles Worldwide
            </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {[
              { number: "50,000+", label: "Active Members" },
              { number: "95%", label: "Success Rate" },
              { number: "150+", label: "Countries" },
              { number: "4.9/5", label: "User Rating" }
            ].map((stat, index) => (
              <div key={index} role="group" aria-label={`${stat.label}: ${stat.number}`}>
                <div className="text-4xl font-bold text-yellow-500 mb-2" aria-hidden="true">
                  {stat.number}
                </div>
                <div className="text-neutral-400" aria-hidden="true">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <Button variant="default" size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black" aria-label="Start your dating journey with Zenith today">
            Start Your Journey Today
          </Button>
        </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-neutral-700 bg-neutral-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-neutral-100 mb-4 text-xl font-semibold">
              Zenith
            </h2>
            <p className="text-neutral-400">
              The premier dating platform for discerning singles seeking meaningful connections.
            </p>
          </div>
          <nav aria-label="Footer legal links">
            <h3 className="text-neutral-300 mb-3 font-medium">
              Legal
            </h3>
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
          </nav>
        </div>
        <div className="mt-8 pt-6 border-t border-neutral-700 text-center text-neutral-500">
          © 2025 Zenith Dating Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
