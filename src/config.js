// Google sign-in for the calendar. One-time setup by the app owner (see README, section 3).
// The client ID is not a secret: it only identifies this app to Google.
// Paste the Android OAuth client ID (ends in .apps.googleusercontent.com) between the quotes.
export const GOOGLE_CLIENT_ID = '983195732563-m2tnc3ak4pv85s9sj0rguug7i84m6fou.apps.googleusercontent.com';

// Must match "appId" in capacitor.config.json and the Android OAuth client's package name.
export const REDIRECT_URI = 'eu.michiel.lane:/oauth2redirect';
