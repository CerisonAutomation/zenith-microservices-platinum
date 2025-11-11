
// Design Tokens - Elite Atomic Design System
export const designTokens = {
  // Spacing Scale (8px base)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
    xxxl: '64px'
  },
  
  // Color Palette - Zenith Premium Theme
  colors: {
    // Primary Brand Colors
    primary: {
      50: '#fefce8',
      100: '#fef9c3',
      200: '#fef08a',
      300: '#fde047',
      400: '#facc15',
      500: '#eab308', // Main brand color
      600: '#ca8a04',
      700: '#a16207',
      800: '#854d0e',
      900: '#713f12'
    },
    
    // Neutral Colors
    neutral: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b'
    },
    
    // Semantic Colors
    success: {
      500: '#10b981',
      600: '#059669'
    },
    warning: {
      500: '#f59e0b',
      600: '#d97706'
    },
    error: {
      500: '#ef4444',
      600: '#dc2626'
    },
    
    // Background Colors
    background: {
      light: '#ffffff',
      dark: '#0f0f0f',
      surface: '#1a1a1a'
    }
  },
  
  // Typography Scale
  typography: {
    // Font Sizes (px)
    sizes: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
      '5xl': '48px'
    },
    
    // Font Weights
    weights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    
    // Line Heights
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75
    }
  },
  
  // Border Radius
  borderRadius: {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px'
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
  },
  
  // Breakpoints (Mobile First)
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  
  // Z-index Scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800
  }
};

// Atomic Components - Foundation of Design System

// 1. Button Component (All Variants)
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  ...props 
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: designTokens.borderRadius.md,
    fontWeight: designTokens.typography.weights.medium,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease-in-out',
    position: 'relative',
    overflow: 'hidden'
  };
  
  const sizeStyles = {
    xs: {
      padding: `${designTokens.spacing.xs} ${designTokens.spacing.sm}`,
      fontSize: designTokens.typography.sizes.xs,
      height: '32px'
    },
    sm: {
      padding: `${designTokens.spacing.sm} ${designTokens.spacing.md}`,
      fontSize: designTokens.typography.sizes.sm,
      height: '40px'
    },
    md: {
      padding: `${designTokens.spacing.md} ${designTokens.spacing.lg}`,
      fontSize: designTokens.typography.sizes.base,
      height: '48px'
    },
    lg: {
      padding: `${designTokens.spacing.lg} ${designTokens.spacing.xl}`,
      fontSize: designTokens.typography.sizes.lg,
      height: '56px'
    }
  };
  
  const variantStyles = {
    primary: {
      backgroundColor: designTokens.colors.primary[500],
      color: 'white',
      '&:hover': !disabled && !loading && {
        backgroundColor: designTokens.colors.primary[600],
        transform: 'translateY(-1px)'
      },
      '&:active': {
        transform: 'translateY(0)'
      }
    },
    secondary: {
      backgroundColor: 'transparent',
      color: designTokens.colors.primary[500],
      border: `1px solid ${designTokens.colors.primary[500]}`,
      '&:hover': !disabled && !loading && {
        backgroundColor: designTokens.colors.primary[50],
        transform: 'translateY(-1px)'
      }
    },
    ghost: {
      backgroundColor: 'transparent',
      color: designTokens.colors.neutral[600],
      '&:hover': !disabled && !loading && {
        backgroundColor: designTokens.colors.neutral[100]
      }
    },
    danger: {
      backgroundColor: designTokens.colors.error[500],
      color: 'white',
      '&:hover': !disabled && !loading && {
        backgroundColor: designTokens.colors.error[600]
      }
    }
  };
  
  const disabledStyles = disabled && {
    opacity: 0.6,
    pointerEvents: 'none'
  };
  
  const loadingStyles = loading && {
    pointerEvents: 'none',
    '&::after': {
      content: '""',
      position: 'absolute',
      width: '16px',
      height: '16px',
      border: `2px solid transparent`,
      borderTop: `2px solid currentColor`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }
  };
  
  const styles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...disabledStyles,
    ...loadingStyles
  };
  
  return (
    <button style={styles} disabled={disabled} {...props}>
      {loading ? '&nbsp;' : children}
    </button>
  );
};

// 2. Input Component
export const Input = ({ 
  label, 
  error, 
  helperText, 
  size = 'md', 
  ...props 
}) => {
  return (
    <div style={{ marginBottom: designTokens.spacing.md }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: designTokens.spacing.sm,
          fontWeight: designTokens.typography.weights.medium,
          color: designTokens.colors.neutral[700]
        }}>
          {label}
        </label>
      )}
      
      <input
        style={{
          width: '100%',
          padding: `${designTokens.spacing.md} ${designTokens.spacing.lg}`,
          border: `1px solid ${error ? designTokens.colors.error[500] : designTokens.colors.neutral[300]}`,
          borderRadius: designTokens.borderRadius.md,
          fontSize: designTokens.typography.sizes.base,
          transition: 'border-color 0.2s ease-in-out',
          '&:focus': {
            outline: 'none',
            borderColor: designTokens.colors.primary[500],
            boxShadow: `0 0 0 3px ${designTokens.colors.primary[100]}`
          }
        }}
        {...props}
      />
      
      {(error || helperText) && (
        <p style={{
          marginTop: designTokens.spacing.sm,
          fontSize: designTokens.typography.sizes.sm,
          color: error ? designTokens.colors.error[500] : designTokens.colors.neutral[500]
        }}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

// 3. Card Component
export const Card = ({ children, elevation = 'md', ...props }) => {
  const elevationStyles = {
    none: {},
    sm: { boxShadow: designTokens.shadows.sm },
    md: { boxShadow: designTokens.shadows.md },
    lg: { boxShadow: designTokens.shadows.lg }
  };
  
  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: designTokens.borderRadius.lg,
        padding: designTokens.spacing.xl,
        ...elevationStyles[elevation]
      }}
      {...props}
    >
      {children}
    </div>
  );
};

// 4. Avatar Component
export const Avatar = ({ 
  src, 
  alt, 
  size = 'md', 
  fallback,
  ...props 
}) => {
  const sizeStyles = {
    sm: { width: '32px', height: '32px' },
    md: { width: '48px', height: '48px' },
    lg: { width: '64px', height: '64px' },
    xl: { width: '96px', height: '96px' }
  };
  
  return (
    <div
      style={{
        ...sizeStyles[size],
        borderRadius: designTokens.borderRadius.full,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: designTokens.colors.neutral[200],
        color: designTokens.colors.neutral[600],
        fontWeight: designTokens.typography.weights.medium
      }}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        fallback || alt?.[0]?.toUpperCase() || 'U'
      )}
    </div>
  );
};

// CSS Animation for Loading Spinner
const styles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default designTokens;