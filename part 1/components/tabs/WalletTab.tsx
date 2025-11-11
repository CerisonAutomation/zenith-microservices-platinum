import { Wallet as WalletIcon, Coins, Crown, Eye, EyeOff, Plane, Zap } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";

export default function WalletTab() {
  return (
    <div className="min-h-screen pb-6">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-purple-900/95 via-purple-800/95 to-amber-900/95 backdrop-blur-xl border-b border-amber-500/20">
        <div className="px-4 py-2">
          <h1 className="text-lg font-light tracking-wide bg-gradient-to-r from-amber-300 via-amber-200 to-amber-100 bg-clip-text text-transparent">
            Web3 Wallet
          </h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Wallet Balance */}
        <Card className="bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-500/20 backdrop-blur-sm border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <WalletIcon className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400">Token Balance</span>
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              Connected
            </Badge>
          </div>

          <div className="mb-2">
            <div className="text-4xl font-bold text-white mb-1">1,250</div>
            <div className="text-gray-400">LOVE Tokens</div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <Coins className="w-4 h-4 mr-2" />
              Buy Tokens
            </Button>
            <Button variant="outline" className="flex-1 border-white/20 hover:bg-white/10">
              Send
            </Button>
          </div>
        </Card>

        {/* Premium Features */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-400" />
            Premium Features
          </h2>

          <div className="space-y-3">
            {/* Unlimited Blocks */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <Zap className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">Unlimited Blocks</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Block unlimited profiles without restrictions
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-400 font-medium">100 tokens</span>
                    <Button size="sm" variant="outline" className="border-white/20 hover:bg-white/10">
                      Unlock
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Incognito Mode */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <EyeOff className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">Incognito Mode</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Browse profiles anonymously without leaving traces
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-400 font-medium">150 tokens</span>
                    <Button size="sm" variant="outline" className="border-white/20 hover:bg-white/10">
                      Unlock
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Travel Mode */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <Plane className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">Travel Mode</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Explore profiles in any location worldwide
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-400 font-medium">200 tokens</span>
                    <Button size="sm" variant="outline" className="border-white/20 hover:bg-white/10">
                      Unlock
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Priority Placement */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <Eye className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">Priority Placement</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Appear at the top of search results for 24 hours
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-400 font-medium">250 tokens</span>
                    <Button size="sm" variant="outline" className="border-white/20 hover:bg-white/10">
                      Unlock
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* NFT Membership */}
        <Card className="bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20 backdrop-blur-sm border-yellow-500/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="w-8 h-8 text-yellow-400" />
            <div>
              <h3 className="text-xl font-bold text-white">Premium NFT Pass</h3>
              <p className="text-sm text-gray-300">Unlock all features forever</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Available</span>
              <span className="text-white font-medium">47 / 1000</span>
            </div>
            <Progress value={4.7} className="h-2" />
          </div>

          <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold">
            Mint NFT Pass - 0.5 ETH
          </Button>
        </Card>

        {/* Transaction History */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Recent Transactions</h2>
          <div className="space-y-2">
            {[
              { type: "Purchase", amount: "+500", date: "2 days ago" },
              { type: "Unlock Feature", amount: "-150", date: "5 days ago" },
              { type: "Purchase", amount: "+1000", date: "1 week ago" },
            ].map((tx, i) => (
              <Card key={i} className="bg-white/5 backdrop-blur-sm border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">{tx.type}</div>
                    <div className="text-sm text-gray-400">{tx.date}</div>
                  </div>
                  <div className={`font-semibold ${tx.amount.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.amount} tokens
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
