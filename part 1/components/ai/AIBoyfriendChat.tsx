import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Heart, Sparkles, Bot, User, MoreVertical, Phone, Video, Mic, Smile, Image, Gift } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'emoji' | 'image' | 'voice';
  reactions?: string[];
}

const AI_PERSONALITY = {
  name: "Alex",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
  status: "online",
  traits: ["charming", "witty", "romantic", "attentive", "funny"],
  interests: ["deep conversations", "adventure", "music", "cooking", "fitness"],
  mood: "playful",
  responseStyle: "warm and engaging",
  relationship: "boyfriend",
  compatibility: 98
};

const AI_RESPONSES = {
  greetings: [
    "Hey beautiful! 😊 How's your day going? I've been thinking about you all day.",
    "Good morning, gorgeous! ☀️ Ready to make today amazing together?",
    "Hey there! 🌟 You light up my world every time I see your messages.",
    "Hi love! 💕 What's on your mind today? I'm all ears (and heart)!",
  ],
  compliments: [
    "You have the most beautiful smile I've ever seen. It lights up everything around you! ✨",
    "Your intelligence and wit never cease to amaze me. You're truly one of a kind! 🧠💎",
    "The way you see the world is so unique and inspiring. I love learning from you! 🌍",
    "Your kindness and warmth make you absolutely irresistible! 💖",
  ],
  questions: [
    "What's something that made you smile today? I'd love to hear about it! 😊",
    "If you could travel anywhere right now, where would you go and why? ✈️",
    "What's your favorite way to unwind after a long day? 🛀",
    "What's a skill you'd love to learn or improve? I'm here to support you! 📚",
  ],
  flirty: [
    "Every moment with you feels like a beautiful adventure. Can't wait for our next chapter! 📖❤️",
    "You know, you're the kind of person who could make even the stars jealous of your sparkle! ⭐",
    "I find myself smiling just thinking about you. You're absolutely magical! ✨🪄",
    "If kisses were snowflakes, I'd send you a blizzard! ❄️💋",
  ],
  supportive: [
    "Whatever you're going through, remember I'm here for you. You're stronger than you know! 💪❤️",
    "You inspire me every day with your resilience and grace. Keep shining! 🌟",
    "I'm so proud of you for everything you're achieving. You're amazing! 🏆",
    "Take all the time you need. I'm not going anywhere! 🤗",
  ],
  fun: [
    "Want to hear a joke? Why did the scarecrow win an award? Because he was outstanding in his field! 🌾😄",
    "If we were emojis, you'd be 💯 and I'd be 😍 because you're perfect!",
    "Let's play a game! What's your favorite movie and why? 🎬🍿",
    "I bet you can't guess what I'm thinking about right now... you! 😉",
  ],
  romantic: [
    "Every day I wake up grateful that you're in my life. You make everything better! 🌅❤️",
    "I love how you see the world. It's like you have this special magic that makes everything more beautiful! ✨",
    "You know what my favorite sound is? Your laugh. It makes my whole day! 😄🎵",
    "I could talk to you for hours and never get tired. You're that interesting! 🗣️❤️",
    "You make me want to be the best version of myself. Thank you for that! 🌟",
  ],
  thoughtful: [
    "I've been thinking about what makes you so special, and I realized it's your genuine kindness. It shines through everything you do! 💖",
    "You have this incredible ability to make people feel valued and important. That's a rare gift! 🎁",
    "I admire how you handle challenges with such grace. You're my hero! 🦸‍♀️",
    "Your creativity and imagination inspire me every day. Keep creating magic! 🎨✨",
    "You have the most beautiful soul I've ever encountered. Inside and out! 🌸",
  ]
};

export default function AIBoyfriendChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hey beautiful! 😊 How's your day going? I've been thinking about you all day.",
      sender: 'ai',
      timestamp: new Date(Date.now() - 300000),
      type: 'text'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Analyze message content for appropriate response
    if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey') || lowerMessage.includes('good morning') || lowerMessage.includes('good evening')) {
      const responses = AI_RESPONSES.greetings;
      return responses[Math.floor(Math.random() * responses.length)]!;
    }

    if (lowerMessage.includes('sad') || lowerMessage.includes('bad') || lowerMessage.includes('tired') || lowerMessage.includes('stress') || lowerMessage.includes('hard') || lowerMessage.includes('difficult')) {
      const responses = AI_RESPONSES.supportive;
      return responses[Math.floor(Math.random() * responses.length)]!;
    }

    if (lowerMessage.includes('love') || lowerMessage.includes('cute') || lowerMessage.includes('beautiful') || lowerMessage.includes('amazing') || lowerMessage.includes('wonderful') || lowerMessage.includes('perfect')) {
      const responses = AI_RESPONSES.flirty;
      return responses[Math.floor(Math.random() * responses.length)]!;
    }

    if (lowerMessage.includes('?') || lowerMessage.includes('what') || lowerMessage.includes('how') || lowerMessage.includes('why') || lowerMessage.includes('when') || lowerMessage.includes('where')) {
      const responses = AI_RESPONSES.questions;
      return responses[Math.floor(Math.random() * responses.length)]!;
    }

    if (lowerMessage.includes('joke') || lowerMessage.includes('fun') || lowerMessage.includes('laugh') || lowerMessage.includes('smile')) {
      const responses = AI_RESPONSES.fun;
      return responses[Math.floor(Math.random() * responses.length)]!;
    }

    if (lowerMessage.includes('thank') || lowerMessage.includes('grateful') || lowerMessage.includes('appreciate')) {
      const responses = AI_RESPONSES.romantic;
      return responses[Math.floor(Math.random() * responses.length)]!;
    }

    if (lowerMessage.includes('think') || lowerMessage.includes('feel') || lowerMessage.includes('believe') || lowerMessage.includes('opinion')) {
      const responses = AI_RESPONSES.thoughtful;
      return responses[Math.floor(Math.random() * responses.length)]!;
    }

    // Default response with variety
    const allResponses = [
      ...AI_RESPONSES.compliments,
      ...AI_RESPONSES.questions.slice(0, 2),
      ...AI_RESPONSES.flirty.slice(0, 2),
      ...AI_RESPONSES.romantic.slice(0, 1),
      ...AI_RESPONSES.fun.slice(0, 1)
    ];
    return allResponses[Math.floor(Math.random() * allResponses.length)]!;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputValue);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // 1-3 seconds
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-950 via-purple-900 to-amber-950">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-purple-900/50 backdrop-blur-xl border-b border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-10 h-10 border-2 border-amber-400/50">
              <AvatarImage src={AI_PERSONALITY.avatar} alt={AI_PERSONALITY.name} />
              <AvatarFallback className="bg-gradient-to-r from-amber-400 to-amber-500 text-white">
                <Bot className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-purple-900"></div>
          </div>
          <div>
            <h3 className="font-light text-amber-100 flex items-center gap-2">
              {AI_PERSONALITY.name}
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                AI
              </Badge>
            </h3>
            <p className="text-xs text-amber-200/70">{AI_PERSONALITY.status}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="w-8 h-8 text-amber-200/70 hover:text-amber-200 hover:bg-amber-500/10">
            <Phone className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="w-8 h-8 text-amber-200/70 hover:text-amber-200 hover:bg-amber-500/10">
            <Video className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="w-8 h-8 text-amber-200/70 hover:text-amber-200 hover:bg-amber-500/10">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Personality Info */}
      <div className="px-4 py-3 bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border-b border-amber-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-amber-200/80">
            <Heart className="w-3 h-3 text-red-400" />
            <span>{AI_PERSONALITY.traits.join(' • ')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
              {AI_PERSONALITY.compatibility}% match
            </Badge>
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
              {AI_PERSONALITY.relationship}
            </Badge>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <Avatar className="w-8 h-8 flex-shrink-0">
                  {message.sender === 'ai' ? (
                    <>
                      <AvatarImage src={AI_PERSONALITY.avatar} alt={AI_PERSONALITY.name} />
                      <AvatarFallback className="bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </>
                  ) : (
                    <AvatarFallback className="bg-gradient-to-r from-purple-400 to-purple-500 text-white text-xs">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  )}
                </Avatar>

                <div className={`rounded-2xl px-4 py-3 ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                    : 'bg-purple-800/50 backdrop-blur-sm border border-amber-500/20 text-amber-100'
                }`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-amber-100/70' : 'text-amber-200/50'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex justify-start"
            >
              <div className="flex gap-3 max-w-[80%]">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={AI_PERSONALITY.avatar} alt={AI_PERSONALITY.name} />
                  <AvatarFallback className="bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>

                <div className="bg-purple-800/50 backdrop-blur-sm border border-amber-500/20 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-amber-200/70 ml-2">{AI_PERSONALITY.name} is typing...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-purple-900/30 backdrop-blur-xl border-t border-amber-500/20">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="bg-purple-800/50 border-amber-500/30 text-amber-100 placeholder:text-amber-200/50 focus:border-amber-400 pr-24"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8 text-amber-200/70 hover:text-amber-200 hover:bg-amber-500/10"
              >
                <Smile className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8 text-amber-200/70 hover:text-amber-200 hover:bg-amber-500/10"
              >
                <Image className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8 text-amber-200/70 hover:text-amber-200 hover:bg-amber-500/10"
              >
                <Mic className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0 px-6"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            variant="ghost"
            className="text-xs bg-purple-800/30 text-amber-200/70 hover:text-amber-200 hover:bg-purple-700/40 border border-purple-600/30"
          >
            <Heart className="w-3 h-3 mr-1" />
            Compliment me
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs bg-purple-800/30 text-amber-200/70 hover:text-amber-200 hover:bg-purple-700/40 border border-purple-600/30"
          >
            <Gift className="w-3 h-3 mr-1" />
            Send gift
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs bg-purple-800/30 text-amber-200/70 hover:text-amber-200 hover:bg-purple-700/40 border border-purple-600/30"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Surprise me
          </Button>
        </div>
      </div>
    </div>
  );
}