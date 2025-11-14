import { Brain, TrendingUp, Users, Heart, Zap, Target, BarChart3, Activity } from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

export default function AIMatchingDashboard() {
  const matchScore = 87;
  const compatibilityFactors = [
    { name: "Interests", score: 92, color: "from-purple-500 to-pink-500" },
    { name: "Location", score: 85, color: "from-blue-500 to-cyan-500" },
    { name: "Lifestyle", score: 88, color: "from-green-500 to-emerald-500" },
    { name: "Values", score: 84, color: "from-yellow-500 to-orange-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white pb-20">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20">
            <Brain className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI Matching</h1>
            <p className="text-gray-400">Powered by advanced algorithms</p>
          </div>
        </div>

        {/* Match Score */}
        <Card className="bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-500/20 border-purple-500/30 p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mb-4">
              <div className="text-5xl font-bold">{matchScore}</div>
            </div>
            <h3 className="text-2xl font-bold mb-2">Your Match Score</h3>
            <p className="text-gray-300">Based on your profile and preferences</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-1">247</div>
              <div className="text-sm text-gray-400">Total Matches</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-400 mb-1">34</div>
              <div className="text-sm text-gray-400">This Week</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400 mb-1">92%</div>
              <div className="text-sm text-gray-400">Success Rate</div>
            </div>
          </div>
        </Card>

        {/* Compatibility Factors */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Compatibility Factors
          </h3>
          
          <div className="space-y-4">
            {compatibilityFactors.map((factor) => (
              <div key={factor.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{factor.name}</span>
                  <span className="text-sm text-gray-400">{factor.score}%</span>
                </div>
                <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 bg-gradient-to-r ${factor.color} rounded-full`}
                    style={{ width: `${factor.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* AI Insights */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            AI Insights
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <TrendingUp className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Peak Activity Time</h4>
                <p className="text-sm text-gray-300">You get 3x more matches between 7-9 PM. Try being active during these hours!</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <Users className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Profile Optimization</h4>
                <p className="text-sm text-gray-300">Adding 2 more photos could increase your match rate by 45%</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <Heart className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Compatibility Boost</h4>
                <p className="text-sm text-gray-300">Users with similar interests to yours are 67% more likely to respond</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Match Preferences */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Your Match Preferences
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Age Range</span>
              <Badge className="bg-white/10 border-white/20">25-35 years</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Distance</span>
              <Badge className="bg-white/10 border-white/20">Within 10 km</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Looking For</span>
              <Badge className="bg-white/10 border-white/20">Relationship</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Activity Level</span>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Very Active</Badge>
            </div>
          </div>
        </Card>

        {/* Weekly Stats */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-400" />
            This Week's Performance
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5">
              <div className="text-2xl font-bold text-purple-400 mb-1">156</div>
              <div className="text-sm text-gray-400">Profile Views</div>
              <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>+23%</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/5">
              <div className="text-2xl font-bold text-pink-400 mb-1">42</div>
              <div className="text-sm text-gray-400">New Likes</div>
              <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>+15%</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/5">
              <div className="text-2xl font-bold text-cyan-400 mb-1">28</div>
              <div className="text-sm text-gray-400">Messages Sent</div>
              <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>+8%</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/5">
              <div className="text-2xl font-bold text-orange-400 mb-1">12</div>
              <div className="text-sm text-gray-400">New Matches</div>
              <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>+31%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
