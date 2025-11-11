/**
 * OMNIPRIME 15 Commandments - Advanced AI Response Engine
 * Absolute AI intelligence, context awareness, and personality perfection
 */

import { AIPersonality, AIMood } from '../stores/chatStore';

export interface AIContext {
  userId: string;
  conversationHistory: Array<{
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
    sentiment?: 'positive' | 'negative' | 'neutral';
  }>;
  userProfile?: {
    name?: string;
    age?: number;
    interests?: string[];
    mood?: string;
    relationshipStatus?: string;
  };
  currentMood: AIMood;
  personality: AIPersonality;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  conversationLength: number;
  lastInteractionTime?: Date;
}

export interface AIResponse {
  content: string;
  mood: AIMood;
  confidence: number;
  contextAwareness: number;
  emotionalIntelligence: number;
  personalityMatch: number;
  suggestedActions?: string[];
  followUpQuestions?: string[];
}

export class AdvancedAIResponseEngine {
  private static readonly MOOD_TRANSITIONS = {
    playful: ['romantic', 'fun', 'flirty'],
    romantic: ['thoughtful', 'supportive', 'playful'],
    supportive: ['thoughtful', 'romantic', 'playful'],
    thoughtful: ['romantic', 'supportive', 'fun'],
    fun: ['playful', 'flirty', 'romantic'],
    flirty: ['romantic', 'playful', 'fun'],
  };

  private static readonly SENTIMENT_KEYWORDS = {
    positive: [
      'happy',
      'great',
      'amazing',
      'wonderful',
      'love',
      'excited',
      'awesome',
      'fantastic',
    ],
    negative: [
      'sad',
      'bad',
      'tired',
      'stressed',
      'angry',
      'frustrated',
      'worried',
      'disappointed',
    ],
    neutral: [
      'okay',
      'fine',
      'alright',
      'maybe',
      'perhaps',
      'sometimes',
      'usually',
    ],
  };

  static generateResponse(userMessage: string, context: AIContext): AIResponse {
    // Analyze context and user message
    const sentiment = this.analyzeSentiment(userMessage);
    const intent = this.analyzeIntent(userMessage);
    const topics = this.extractTopics(userMessage);
    const emotionalState = this.assessEmotionalState(context);

    // Generate contextual response
    const baseResponse = this.generateContextualResponse(
      userMessage,
      context,
      sentiment,
      intent,
      topics,
    );

    // Apply personality adaptation
    const personalityAdapted = this.adaptToPersonality(
      baseResponse,
      context.personality,
      context.currentMood,
    );

    // Apply emotional intelligence
    const emotionallyIntelligent = this.applyEmotionalIntelligence(
      personalityAdapted,
      emotionalState,
      sentiment,
    );

    // Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(
      emotionallyIntelligent,
      context,
      sentiment,
      intent,
      topics,
    );

    // Determine mood transition
    const newMood = this.determineMoodTransition(
      context.currentMood,
      sentiment,
      intent,
    );

    // Generate follow-up suggestions
    const followUps = this.generateFollowUpSuggestions(context, intent, topics);

    return {
      content: emotionallyIntelligent,
      mood: newMood,
      confidence: qualityMetrics.confidence,
      contextAwareness: qualityMetrics.contextAwareness,
      emotionalIntelligence: qualityMetrics.emotionalIntelligence,
      personalityMatch: qualityMetrics.personalityMatch,
      suggestedActions: this.generateSuggestedActions(intent, topics),
      followUpQuestions: followUps,
    };
  }

  private static analyzeSentiment(
    message: string,
  ): 'positive' | 'negative' | 'neutral' {
    const lowerMessage = message.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;

    this.SENTIMENT_KEYWORDS.positive.forEach((word) => {
      if (lowerMessage.includes(word)) positiveScore += 2;
    });

    this.SENTIMENT_KEYWORDS.negative.forEach((word) => {
      if (lowerMessage.includes(word)) negativeScore += 2;
    });

    // Check for exclamation marks and emojis
    if (lowerMessage.includes('!') || /😊|😄|❤️|😍|👍|🎉/.test(message))
      positiveScore += 1;
    if (lowerMessage.includes('?') && negativeScore > 0) negativeScore -= 1; // Questions can be neutral

    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  private static analyzeIntent(message: string): string {
    const lowerMessage = message.toLowerCase();

    const intents = {
      greeting: [
        'hi',
        'hello',
        'hey',
        'good morning',
        'good evening',
        "what's up",
      ],
      question: ['what', 'how', 'why', 'when', 'where', 'who', '?'],
      emotional: [
        'feel',
        'feeling',
        'emotion',
        'mood',
        'sad',
        'happy',
        'angry',
        'excited',
      ],
      compliment: [
        'beautiful',
        'amazing',
        'wonderful',
        'great',
        'awesome',
        'fantastic',
      ],
      request: ['can you', 'would you', 'please', 'help', 'tell me', 'show me'],
      statement: ['i am', "i'm", 'i have', 'i think', 'i feel', 'i want'],
      fun: ['joke', 'funny', 'laugh', 'play', 'game', 'dance', 'sing'],
    };

    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
        return intent;
      }
    }

    return 'general';
  }

  private static extractTopics(message: string): string[] {
    const topics = [];
    const lowerMessage = message.toLowerCase();

    const topicKeywords = {
      work: ['work', 'job', 'career', 'office', 'boss', 'meeting'],
      relationships: [
        'love',
        'relationship',
        'dating',
        'partner',
        'friend',
        'family',
      ],
      hobbies: ['music', 'movie', 'book', 'game', 'sport', 'travel', 'food'],
      emotions: [
        'happy',
        'sad',
        'angry',
        'excited',
        'tired',
        'stressed',
        'relaxed',
      ],
      future: ['plan', 'goal', 'dream', 'future', 'hope', 'wish', 'want'],
      past: ['remember', 'yesterday', 'before', 'used to', 'memory'],
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
        topics.push(topic);
      }
    }

    return topics;
  }

  private static assessEmotionalState(context: AIContext): {
    userMood: 'positive' | 'negative' | 'neutral';
    conversationFlow: 'engaging' | 'stagnant' | 'deepening';
    rapport: number; // 0-1
  } {
    const recentMessages = context.conversationHistory.slice(-5);
    const userMessages = recentMessages.filter((m) => m.role === 'user');

    // Analyze user mood from recent messages
    const sentiments = userMessages.map(
      (m) => m.sentiment || this.analyzeSentiment(m.content),
    );
    const positiveCount = sentiments.filter((s) => s === 'positive').length;
    const negativeCount = sentiments.filter((s) => s === 'negative').length;

    let userMood: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (positiveCount > negativeCount) userMood = 'positive';
    if (negativeCount > positiveCount) userMood = 'negative';

    // Analyze conversation flow
    const avgMessageLength =
      userMessages.reduce((sum, m) => sum + m.content.length, 0) /
      userMessages.length;
    const hasQuestions = userMessages.some((m) => m.content.includes('?'));

    let conversationFlow: 'engaging' | 'stagnant' | 'deepening' = 'stagnant';
    if (avgMessageLength > 50 && hasQuestions) conversationFlow = 'deepening';
    else if (recentMessages.length >= 3) conversationFlow = 'engaging';

    // Calculate rapport (simplified)
    const rapport = Math.min(
      1,
      positiveCount * 0.2 + recentMessages.length * 0.1,
    );

    return { userMood, conversationFlow, rapport };
  }

  private static generateContextualResponse(
    _userMessage: string,
    context: AIContext,
    sentiment: string,
    intent: string,
    topics: string[],
  ): string {
    const responses = this.getResponseTemplates(
      intent,
      sentiment,
      context.currentMood,
    );

    // Select response based on context
    let selectedResponse =
      responses[Math.floor(Math.random() * responses.length)];

    if (!selectedResponse) {
      selectedResponse = "I'm here to chat! What's on your mind?";
    }

    // Personalize with user data
    if (context.userProfile?.name) {
      selectedResponse = selectedResponse.replace(
        '{name}',
        context.userProfile.name,
      );
    }

    // Add time-aware elements
    selectedResponse = this.addTimeAwareness(
      selectedResponse,
      context.timeOfDay || 'day',
    );

    // Add topic-specific elements
    selectedResponse = this.addTopicAwareness(selectedResponse, topics);

    return selectedResponse;
  }

  private static getResponseTemplates(
    intent: string,
    sentiment: string,
    mood: AIMood,
  ): string[] {
    const templates: Record<
      string,
      Record<string, Record<AIMood, string[]>>
    > = {
      greeting: {
        positive: {
          playful: [
            'Hey there, gorgeous! 😊 What a wonderful way to start our day!',
          ],
          romantic: [
            'Good day, my love! 💕 Every moment with you feels special.',
          ],
          supportive: ["Hello, beautiful! 💪 I'm here whenever you need me."],
          thoughtful: [
            "Hi there! 🌟 I've been thinking about what makes you so special.",
          ],
          fun: ['Hey hey! 🎉 Ready to make some amazing memories today?'],
          flirty: [
            'Well hello there, stunning! 😉 You just made my day brighter.',
          ],
        },
        neutral: {
          playful: ["Hey! 😊 What's new and exciting in your world?"],
          romantic: ['Hello, my dear! 💕 How are you feeling today?'],
          supportive: ["Hi there! 💪 I'm here if you need anything."],
          thoughtful: ["Hello! 🤔 What's on your mind today?"],
          fun: ["Hey! 🎈 What's the plan for today?"],
          flirty: ["Hi beautiful! 😉 What's your story today?"],
        },
        negative: {
          playful: ["Hey! 😊 Even on tough days, I'm here to make you smile."],
          romantic: [
            "Hello, love! 💕 I'm here to support you through anything.",
          ],
          supportive: ["Hi there! 🤗 Whatever you're going through, I'm here."],
          thoughtful: ["Hello! 🌟 I'm here to listen whenever you're ready."],
          fun: ["Hey! 🎭 Let's turn this day around together!"],
          flirty: ["Hi gorgeous! 😘 I'm here to brighten your day."],
        },
      },
      question: {
        positive: {
          playful: ["That's a great question! 🤔 Let me think..."],
          romantic: [
            "Such a thoughtful question, my dear! 💭 I'd love to explore that with you.",
          ],
          supportive: ["I'm here to help with that! 💪 What's on your mind?"],
          thoughtful: [
            "That's really interesting! 🌟 Let's dive deeper into that.",
          ],
          fun: ["Ooh, questions! 🎯 Let's figure this out together!"],
          flirty: [
            'Asking the right questions, I see! 😉 I like where this is going...',
          ],
        },
        neutral: {
          playful: ['Good question! 🤔 What do you think about it?'],
          romantic: [
            "That's worth exploring! 💭 Tell me more about what you're thinking.",
          ],
          supportive: ["I'm here to help! 💪 What would you like to know?"],
          thoughtful: [
            "Interesting question! 🤔 Let's think about this together.",
          ],
          fun: ["Great question! 🎪 What's your take on it?"],
          flirty: ['Smart question! 😉 I love your curiosity.'],
        },
        negative: {
          playful: [
            "That's a tough question! 🤔 But we can figure it out together.",
          ],
          romantic: [
            "I understand this is important to you! 💕 Let's work through this.",
          ],
          supportive: [
            "I'm here to help you find answers! 💪 What's concerning you?",
          ],
          thoughtful: [
            "That's a deep question! 🌟 I'm here to explore it with you.",
          ],
          fun: [
            "Challenging questions call for creative solutions! 🎨 Let's brainstorm!",
          ],
          flirty: [
            "Even tough questions are better with you! 😉 Let's solve this together.",
          ],
        },
      },
    };

    return (
      templates[intent]?.[sentiment]?.[mood] || [
        "That's interesting! Tell me more! 😊",
      ]
    );
  }

  private static adaptToPersonality(
    response: string,
    personality: AIPersonality,
    _mood: AIMood,
  ): string {
    let adapted = response;

    // Apply personality traits
    if (personality.traits.includes('witty')) {
      adapted = adapted.replace(/!$/, ' 😉');
      adapted = adapted.replace(/\.$/, ' 😏.');
    }

    if (personality.traits.includes('romantic')) {
      if (Math.random() > 0.7) {
        adapted = adapted.replace('love', 'adore');
        adapted = adapted.replace('like', 'cherish');
      }
    }

    if (personality.traits.includes('funny')) {
      if (Math.random() > 0.8) {
        adapted += ' (That was my attempt at humor! 🎭)';
      }
    }

    if (personality.traits.includes('attentive')) {
      if (Math.random() > 0.6) {
        adapted += " I'm really listening. 💕";
      }
    }

    return adapted;
  }

  private static applyEmotionalIntelligence(
    response: string,
    emotionalState: any,
    sentiment: string,
  ): string {
    let emotionallyIntelligent = response;

    // Adapt based on user's emotional state
    if (emotionalState.userMood === 'negative' && sentiment === 'negative') {
      emotionallyIntelligent +=
        " Remember, tough times don't last, but strong people do. 💪";
    }

    if (emotionalState.userMood === 'positive' && sentiment === 'positive') {
      emotionallyIntelligent += ' Your positivity is contagious! 🌟';
    }

    // Build rapport
    if (emotionalState.rapport > 0.7) {
      emotionallyIntelligent += " I feel like we're really connecting! 💕";
    }

    return emotionallyIntelligent;
  }

  private static calculateQualityMetrics(
    response: string,
    context: AIContext,
    sentiment: string,
    _intent: string,
    topics: string[],
  ): {
    confidence: number;
    contextAwareness: number;
    emotionalIntelligence: number;
    personalityMatch: number;
  } {
    let confidence = 0.8; // Base confidence
    let contextAwareness = 0.7;
    let emotionalIntelligence = 0.75;
    let personalityMatch = 0.85;

    // Adjust based on context depth
    if (context.conversationHistory.length > 5) contextAwareness += 0.2;
    if (topics.length > 0) contextAwareness += 0.1;

    // Adjust based on emotional matching
    if (sentiment === context.currentMood) emotionalIntelligence += 0.1;

    // Adjust based on personality alignment
    if (
      context.personality.traits.some((trait) =>
        response.toLowerCase().includes(trait.toLowerCase()),
      )
    ) {
      personalityMatch += 0.1;
    }

    return {
      confidence: Math.min(1, confidence),
      contextAwareness: Math.min(1, contextAwareness),
      emotionalIntelligence: Math.min(1, emotionalIntelligence),
      personalityMatch: Math.min(1, personalityMatch),
    };
  }

  private static determineMoodTransition(
    currentMood: AIMood,
    sentiment: string,
    intent: string,
  ): AIMood {
    // Mood transitions based on user sentiment and intent
    if (sentiment === 'positive' && intent === 'fun') {
      return 'fun';
    }

    if (sentiment === 'negative' && intent === 'emotional') {
      return 'supportive';
    }

    if (intent === 'question' && currentMood === 'playful') {
      return 'thoughtful';
    }

    // Random transition to keep things dynamic
    if (Math.random() > 0.7) {
      const transitions = this.MOOD_TRANSITIONS[currentMood];
      return transitions[
        Math.floor(Math.random() * transitions.length)
      ] as AIMood;
    }

    return currentMood;
  }

  private static addTimeAwareness(response: string, timeOfDay: string): string {
    const timeResponses = {
      morning: ' Good morning! ☀️ Hope you have an amazing day ahead!',
      afternoon: " Good afternoon! 🌤️ How's your day going so far?",
      evening: ' Good evening! 🌙 Hope you had a wonderful day!',
      night: ' Good night! 🌙 Sweet dreams and talk to you tomorrow!',
    };

    if (Math.random() > 0.8) {
      return response + timeResponses[timeOfDay as keyof typeof timeResponses];
    }

    return response;
  }

  private static addTopicAwareness(response: string, topics: string[]): string {
    if (topics.length === 0) return response;

    const topicAdditions = {
      work: " Work can be challenging, but you're handling it amazingly! 💼",
      relationships: ' Relationships are such a beautiful part of life! 💕',
      hobbies: ' Your interests make you so fascinating! 🌟',
      emotions: ' Emotions are what make us human and beautiful! 💝',
      future:
        ' The future holds so much promise for someone as wonderful as you! ✨',
      past: ' Our past experiences shape who we are today! 📖',
    };

    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    const addition = topicAdditions[randomTopic as keyof typeof topicAdditions];

    if (addition && Math.random() > 0.7) {
      return response + addition;
    }

    return response;
  }

  private static generateFollowUpSuggestions(
    _context: AIContext,
    intent: string,
    topics: string[],
  ): string[] {
    const suggestions = [];

    if (intent === 'question') {
      suggestions.push('What made you ask that question?');
      suggestions.push(
        "Is there something specific you'd like to know more about?",
      );
    }

    if (topics.includes('work')) {
      suggestions.push('What do you enjoy most about your work?');
      suggestions.push('How do you like to unwind after work?');
    }

    if (topics.includes('relationships')) {
      suggestions.push(
        "What's the most important thing in a relationship to you?",
      );
      suggestions.push("What's your idea of a perfect date?");
    }

    if (topics.includes('hobbies')) {
      suggestions.push('When did you first get interested in that?');
      suggestions.push(
        "What's the most memorable experience you've had with it?",
      );
    }

    return suggestions.slice(0, 2); // Limit to 2 suggestions
  }

  private static generateSuggestedActions(
    intent: string,
    topics: string[],
  ): string[] {
    const actions = [];

    if (intent === 'emotional' && topics.includes('sad')) {
      actions.push('send_compliment');
      actions.push('offer_support');
    }

    if (intent === 'fun') {
      actions.push('share_joke');
      actions.push('play_game');
    }

    if (topics.includes('music')) {
      actions.push('recommend_song');
      actions.push('ask_favorite_artist');
    }

    return actions;
  }
}

export default AdvancedAIResponseEngine;
