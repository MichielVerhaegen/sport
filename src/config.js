// Google sign-in for the calendar. One-time setup by the app owner (see README, section 3).
// The client ID is not a secret: it only identifies this app to Google.
// Paste the Android OAuth client ID (ends in .apps.googleusercontent.com) between the quotes.
export const GOOGLE_CLIENT_ID = '';

// Must match "appId" in capacitor.config.json and the Android OAuth client's package name.
export const REDIRECT_URI = 'eu.michiel.lane:/oauth2redirect';
