import { Injectable } from '@nestjs/common';
import { AuthService as BetterAuthService } from '@thallesp/nestjs-better-auth';
import { auth } from './better-auth.config.js';

/**
 * AuthService provides business logic for authentication
 * BetterAuth handles most authentication operations automatically
 * This service can be extended for custom business logic
 */
@Injectable()
export class AuthService {
  constructor(private readonly betterAuthService: BetterAuthService<typeof auth>) {}

  /**
   * Get current user session
   * @param sessionToken - Session token from cookie
   * @returns User session or null
   */
  async getSession(sessionToken: string) {
    return this.betterAuthService.api.getSession({
      headers: {
        cookie: `better-auth.session_token=${sessionToken}`,
      },
    });
  }

  /**
   * Sign out user
   * @param sessionToken - Session token to invalidate
   */
  async signOut(sessionToken: string) {
    return this.betterAuthService.api.signOut({
      headers: {
        cookie: `better-auth.session_token=${sessionToken}`,
      },
    });
  }

  // Add custom business logic methods here as needed
  // BetterAuth handles:
  // - Email/password registration and login
  // - OAuth (GitHub, Microsoft) flows
  // - Session management
  // - Password reset
  // - Email verification (if enabled)
}
