import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { config } from '../config';

export const configurePassport = () => {
  // Google OAuth Strategy
  if (config.googleClientId && config.googleClientSecret && config.googleCallbackUrl) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: config.googleClientId,
          clientSecret: config.googleClientSecret,
          callbackURL: config.googleCallbackUrl,
        },
        (accessToken, refreshToken, profile, done) => {
          const user = {
            id: profile.id,
            email: profile.emails?.[0]?.value || '',
            displayName: profile.displayName,
            profilePicture: profile.photos?.[0]?.value,
            provider: 'google',
            accessToken,
            refreshToken,
          };
          done(null, user);
        }
      )
    );
  }

  // GitHub OAuth Strategy
  if (config.githubClientId && config.githubClientSecret && config.githubCallbackUrl) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: config.githubClientId,
          clientSecret: config.githubClientSecret,
          callbackURL: config.githubCallbackUrl,
        },
        (accessToken: string, refreshToken: string, profile: any, done: any) => {
          const user = {
            id: profile.id,
            email: profile.emails?.[0]?.value || '',
            displayName: profile.displayName || profile.username,
            profilePicture: profile.photos?.[0]?.value,
            provider: 'github',
            accessToken,
            refreshToken,
          };
          done(null, user);
        }
      )
    );
  }
};
