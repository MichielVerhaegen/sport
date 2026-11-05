// Google sign-in for the calendar. One-time setup by the app owner (see README, section 3).
// The client ID is not a secret: it only identifies this app to Google.
// Paste the Android OAuth client ID (ends in .apps.googleusercontent.com) between the quotes.
export const GOOGLE_CLIENT_ID = '983195732563-m2tnc3ak4pv85s9sj0rguug7i84m6fou.apps.googleusercontent.com';

// Google requires the redirect scheme to be the reversed client ID. Derived automatically;
// the APK build registers the same scheme in AndroidManifest.xml.
export const REDIRECT_SCHEME = `com.googleusercontent.apps.${GOOGLE_CLIENT_ID.split('.')[0]}`;
export const REDIRECT_URI = `${REDIRECT_SCHEME}:/oauth2redirect`;
