declare global {
  namespace Express {
    interface User {
      userId?: string;
      role?: string;

      provider?: 'google';
      providerId?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
    }
  }
}

export {};