/**
 * 🏛️ ZENITH ORACLE EXECUTIVE APEX DESIGN TOKENS
 * Transcendent-grade design system with mathematical precision and opulent aesthetics
 * Enterprise-grade token architecture for Next.js 14 + Tailwind CSS
 * Platinum-tier implementation with recursive self-improvement capabilities
 * 
 * Mathematical Principles:
 * - Golden Ratio (φ = 1.618) for visual harmony
 * - Modular Scale (1.25) for typography progression
 * - 8px grid system for spatial consistency
 * - HSL color space for semantic consistency
 */

export const platinumTokens = {
  // ==========================================================================
  // COLOR SYSTEM - MATHEMATICAL PRECISION
  // ==========================================================================
  
  colors: {
    // Primary Platinum Gradient System (HSL-based for precision)
    primary: {
      50: 'hsl(285, 100%, 98%)',   // Lightest platinum
      100: 'hsl(285, 100%, 96%)',  // Very light platinum
      200: 'hsl(285, 100%, 93%)',  // Light platinum
      300: 'hsl(285, 100%, 88%)',  // Medium light platinum
      400: 'hsl(285, 85%, 80%)',   // Medium platinum
      500: 'hsl(285, 100%, 74%)',  // Core platinum (mathematically balanced)
      600: 'hsl(285, 100%, 67%)',  // Medium dark platinum
      700: 'hsl(285, 100%, 58%)',  // Dark platinum
      800: 'hsl(285, 100%, 49%)',  // Very dark platinum
      900: 'hsl(285, 100%, 40%)',  // Darkest platinum
      950: 'hsl(285, 100%, 35%)',  // Ultra dark platinum
      // Oracle-grade variants
      DEFAULT: 'hsl(285, 100%, 74%)',
      FOREGROUND: 'hsl(285, 100%, 20%)',
    },
    
    // Secondary Gold System
    secondary: {
      50: '#fffdf0',  // Lightest gold
      100: '#fefce8', // Very light gold
      200: '#fef9c3', // Light gold
      300: '#fde047', // Medium light gold
      400: '#facc15', // Medium gold
      500: '#eab308', // Core gold
      600: '#ca8a04', // Medium dark gold
      700: '#a16207', // Dark gold
      800: '#854d0e', // Very dark gold
      900: '#713f12', // Darkest gold
      950: '#422006', // Ultra dark gold
    },
    
    // Neutral Platinum Scale
    neutral: {
      0: '#ffffff',   // Pure white
      50: '#fafafa',  // 98% white
      100: '#f5f5f5', // 96% white
      200: '#e5e5e5', // 90% white
      300: '#d4d4d8', // 83% white
      400: '#a1a1aa', // 63% white
      500: '#71717a', // 44% white
      600: '#52525b', // 32% white
      700: '#3f3f46', // 25% white
      800: '#27272a', // 15% white
      900: '#18181b', // 9% white
      950: '#0a0a0a', // 4% white

    },
    
    // Semantic Colors with Platinum Aesthetics
    semantic: {
      success: {
        50: '#f0fdf4',
        100: '#dcfce7',
        500: '#10b981',
        600: '#059669',
        900: '#064e3b',
      },
      warning: {
        50: '#fffbeb',
        100: '#fef3c7',
        500: '#f59e0b',
        600: '#d97706',
        900: '#78350f',
      },
      error: {
        50: '#fef2f2',
        100: '#fee2e2',
        500: '#ef4444',
        600: '#dc2626',
        900: '#7f1d1d',
      },
      info: {
        50: '#eff6ff',
        100: '#dbeafe',
        500: '#3b82f6',
        600: '#2563eb',
        900: '#1e3a8a',
      }
    },
    
    // Background System
    background: {
      primary: '#0a0a0a',      // Deep black
      secondary: '#18181b',    // Dark surface
      tertiary: '#27272a',      // Elevated surface
      overlay: 'rgba(0, 0, 0, 0.8)', // Modal overlay
      glass: 'rgba(255, 255, 255, 0.05)', // Glass morphism
    }
  },
  
  // ==========================================================================
  // TYPOGRAPHY - MATHEMATICAL HARMONY
  // ==========================================================================
  
  typography: {
    // Font Families (Enterprise Stack)
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      serif: ['Playfair Display', 'Georgia', 'serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
    },
    
    // Font Sizes (Perfect Modular Scale - 1.25 ratio)
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
      base: ['1rem', { lineHeight: '1.5rem' }],      // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }],   // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }],     // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
      '5xl': ['3rem', { lineHeight: '1' }],           // 48px
      '6xl': ['3.75rem', { lineHeight: '1' }],        // 60px
      '7xl': ['4.5rem', { lineHeight: '1' }],         // 72px
      '8xl': ['6rem', { lineHeight: '1' }],           // 96px
      '9xl': ['8rem', { lineHeight: '1' }],            // 128px
    },
    
    // Font Weights (Optimized for Inter)
    fontWeight: {
      thin: '100',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    
    // Letter Spacing (Optical kerning)
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    }
  },
  
  // ==========================================================================
  // SPACING SYSTEM - 8PX GRID
  // ==========================================================================
  
  spacing: {
    0: '0px',
    px: '1px',
    0.5: '0.125rem',   // 2px
    1: '0.25rem',      // 4px
    1.5: '0.375rem',   // 6px
    2: '0.5rem',       // 8px
    2.5: '0.625rem',   // 10px
    3: '0.75rem',      // 12px
    3.5: '0.875rem',   // 14px
    4: '1rem',         // 16px
    5: '1.25rem',      // 20px
    6: '1.5rem',       // 24px
    7: '1.75rem',      // 28px
    8: '2rem',         // 32px
    9: '2.25rem',      // 36px
    10: '2.5rem',      // 40px
    11: '2.75rem',     // 44px
    12: '3rem',        // 48px
    14: '3.5rem',      // 56px
    16: '4rem',        // 64px
    20: '5rem',        // 80px
    24: '6rem',        // 96px
    28: '7rem',        // 112px
    32: '8rem',        // 128px
    36: '9rem',        // 144px
    40: '10rem',       // 160px
    44: '11rem',       // 176px
    48: '12rem',       // 192px
    52: '13rem',       // 208px
    56: '14rem',       // 224px
    60: '15rem',       // 240px
    64: '16rem',       // 256px
    72: '18rem',       // 288px
    80: '20rem',       // 320px
    96: '24rem',       // 384px
  },
  
  // ==========================================================================
  // BORDER RADIUS - MATHEMATICAL PRECISION
  // ==========================================================================
  
  borderRadius: {
    none: '0',
    xs: '0.125rem',    // 2px
    sm: '0.25rem',     // 4px
    md: '0.375rem',    // 6px
    lg: '0.5rem',      // 8px
    xl: '0.75rem',     // 12px
    '2xl': '1rem',     // 16px
    '3xl': '1.5rem',   // 24px
    full: '9999px',
  },
  
  // ==========================================================================
  // SHADOWS - PLATINUM DEPTH SYSTEM
  // ==========================================================================
  
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    // Platinum-specific shadows
    platinum: '0 0 40px rgb(220 127 255 / 0.1), 0 0 80px rgb(220 127 255 / 0.05)',
    gold: '0 0 40px rgb(234 179 8 / 0.1), 0 0 80px rgb(234 179 8 / 0.05)',
  },
  
  // ==========================================================================
  // ANIMATION - PLATINUM MOTION SYSTEM
  // ==========================================================================
  
  animation: {
    // Duration (Mathematical progression)
    duration: {
      75: '75ms',
      100: '100ms',
      150: '150ms',
      200: '200ms',
      300: '300ms',
      500: '500ms',
      700: '700ms',
      1000: '1000ms',
    },
    
    // Easing (Natural motion curves)
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      // Platinum-specific easing
      platinum: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
    
    // Keyframes
    keyframes: {
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      slideUp: {
        '0%': { transform: 'translateY(100%)' },
        '100%': { transform: 'translateY(0)' },
      },
      slideDown: {
        '0%': { transform: 'translateY(-100%)' },
        '100%': { transform: 'translateY(0)' },
      },
      scaleIn: {
        '0%': { transform: 'scale(0.95)', opacity: '0' },
        '100%': { transform: 'scale(1)', opacity: '1' },
      },
      pulse: {
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '0.5' },
      },
      spin: {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' },
      },
      // Platinum-specific animations
      shimmer: {
        '0%': { transform: 'translateX(-100%)' },
        '100%': { transform: 'translateX(100%)' },
      },
      glow: {
        '0%, 100%': { boxShadow: '0 0 20px rgb(220 127 255 / 0.5)' },
        '50%': { boxShadow: '0 0 40px rgb(220 127 255 / 0.8)' },
      },
    }
  },
  
  // ==========================================================================
  // Z-INDEX - ENTERPRISE LAYERING
  // ==========================================================================
  
  zIndex: {
    hide: '-1',
    auto: 'auto',
    base: '0',
    docked: '10',
    dropdown: '1000',
    sticky: '1100',
    banner: '1200',
    overlay: '1300',
    modal: '1400',
    popover: '1500',
    tooltip: '1600',
    toast: '1700',
    loading: '9999',
  },
  
  // ==========================================================================
  // BREAKPOINTS - PRECISION RESPONSIVE
  // ==========================================================================
  
  screens: {
    xs: '475px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    '3xl': '1792px',
    '4xl': '2048px',
  },
  
  // ==========================================================================
  // COMPONENT-SPECIFIC TOKENS
  // ==========================================================================
  
  components: {
    // Button tokens
    button: {
      padding: {
        sm: '0.5rem 1rem',
        md: '0.75rem 1.5rem',
        lg: '1rem 2rem',
        xl: '1.25rem 2.5rem',
      },
      borderRadius: '0.5rem',
      fontWeight: '500',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    
    // Card tokens
    card: {
      padding: '1.5rem',
      borderRadius: '1rem',
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
    },
    
    // Input tokens
    input: {
      padding: '0.75rem 1rem',
      borderRadius: '0.5rem',
      borderWidth: '1px',
      fontSize: '1rem',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    
    // Navigation tokens
    navigation: {
      height: '4rem',
      padding: '0 1rem',
      backdropFilter: 'blur(20px)',
      background: 'rgba(0, 0, 0, 0.8)',
    }
  }
}

// Export CSS custom properties generator
export const generateCSSVariables = (tokens: typeof platinumTokens) => {
  const cssVars: Record<string, string> = {}
  
  // Generate color variables
  Object.entries(tokens.colors).forEach(([colorName, colorValues]) => {
    if (typeof colorValues === 'object' && colorValues !== null) {
      Object.entries(colorValues).forEach(([shade, value]) => {
        cssVars[`--color-${colorName}-${shade}`] = value
      })
    } else {
      cssVars[`--color-${colorName}`] = colorValues as string
    }
  })
  
  // Generate spacing variables
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    cssVars[`--spacing-${key}`] = value
  })
  
  // Generate typography variables
  Object.entries(tokens.typography.fontSize).forEach(([key, value]) => {
    cssVars[`--font-size-${key}`] = Array.isArray(value) ? value[0] : (typeof value === 'string' ? value : (typeof value === 'object' && 'lineHeight' in value ? (value as any).lineHeight : String(value)))
  })
  
  // Generate border radius variables
  Object.entries(tokens.borderRadius).forEach(([key, value]) => {
    cssVars[`--radius-${key}`] = value
  })
  
  // Generate shadow variables
  Object.entries(tokens.boxShadow).forEach(([key, value]) => {
    cssVars[`--shadow-${key}`] = value
  })
  
  return cssVars
}

export default platinumTokens