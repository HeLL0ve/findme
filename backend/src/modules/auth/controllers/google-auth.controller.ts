import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../config/prisma';
import { env } from '../../../config/env';
import { tokenService } from '../services/token.service';

// Configure Google strategy only if credentials are provided
if (env.googleClientId && env.googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.googleClientId,
        clientSecret: env.googleClientSecret,
        callbackURL: `${env.publicApiUrl}/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile: Profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email from Google'), undefined);

          // Find by googleId first, then by email
          let user = await prisma.user.findFirst({
            where: { OR: [{ googleId: profile.id }, { email }] },
          });

          if (user) {
            // Link googleId if not linked yet
            if (!user.googleId) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId: profile.id },
              });
            }
          } else {
            // Create new user
            user = await prisma.user.create({
              data: {
                email,
                googleId: profile.id,
                name: profile.displayName || email.split('@')[0],
                avatarUrl: profile.photos?.[0]?.value || null,
                emailVerifiedAt: new Date(), // Google accounts are pre-verified
              },
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err as Error, undefined);
        }
      }
    )
  );
}

passport.serializeUser((user: Express.User, done) => done(null, user));
passport.deserializeUser((user: Express.User, done) => done(null, user));

export function googleAuthInitController(req: Request, res: Response, next: NextFunction) {
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
}

export async function googleAuthCallbackController(req: Request, res: Response, next: NextFunction) {
  passport.authenticate('google', { session: false }, async (err: Error | null, user: { id: string; role: string } | null) => {
    if (err || !user) {
      return res.redirect(`${env.clientOrigin}/login?error=google_failed`);
    }

    try {
      const accessToken = jwt.sign({ userId: user.id, role: user.role }, env.jwtAccessSecret, {
        expiresIn: '15m',
      });

      const refreshToken = jwt.sign({ userId: user.id }, env.jwtRefreshSecret, {
        expiresIn: '7d',
      });

      const ttlSeconds = 7 * 24 * 60 * 60;
      await tokenService.saveRefreshToken(refreshToken, user.id, ttlSeconds);

      // Set refresh token cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https',
        sameSite: 'none',
        maxAge: ttlSeconds * 1000,
        path: '/',
      });

      // Redirect to frontend with access token in URL fragment
      return res.redirect(`${env.clientOrigin}/auth/google/callback?token=${accessToken}`);
    } catch (error) {
      return next(error);
    }
  })(req, res, next);
}
