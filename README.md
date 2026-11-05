# Lane

Your personal training and habit app: weekly commitment, one-tap check-ins, Sunday weigh-ins with photos, progress towards 115 kg, a training week built around your musical, and move breaks on home days.

## 1. Build the APK on GitHub (about 10 minutes)

1. Create a **private** repository in your GitHub organization, for example `lane`.
2. Upload everything in this folder (including the hidden `.github` folder) to the `main` branch. On github.com: **Add file → Upload files**, then drag the folder contents in.
3. Open the **Actions** tab. The *Build APK* workflow starts by itself (or click **Run workflow**). A build takes 5–8 minutes of your Actions minutes.
4. When it's green, open the run and download **lane-apk** under *Artifacts*. Unzip it to get `app-debug.apk`.

The first build saves a signing key in `keystore/`, so later builds install over the old app without losing data. If your organization blocks workflows from pushing, the run shows a warning: then go to **Settings → Actions → General → Workflow permissions** and choose *Read and write*, or export a backup before each update.

## 2. Install on your phone

1. Send `app-debug.apk` to your phone (Drive, email, cable).
2. Open it and allow *Install unknown apps* for the app you opened it with.
3. Open Lane and tap **Turn on reminders**.
4. Recommended: in Android settings, set Lane's battery usage to *Unrestricted*, otherwise some phones delay reminders.

## 3. Connect Google Calendar (sign in with Google)

**For everyone using the app:** open **Settings → Google Calendar → Sign in with Google**, pick your account, allow access. Done. No scripts, links or keys.

**One-time setup by the app owner** (about 10 minutes, so nobody else has to):

1. In [Google Cloud Console](https://console.cloud.google.com) create a project (for example *Lane*) and enable the **Google Calendar API**.
2. **Google Auth Platform → Branding / Audience**: app name *Lane*. Choose **Internal** if you use Google Workspace (only your organization can sign in, no Google review needed). Otherwise choose External and add the people who will use it as test users.
3. **Data access**: add the scope `.../auth/calendar.events`.
4. **Clients → Create client → Android**:
   - Package name: `eu.michiel.lane`
   - SHA-1 fingerprint: `1C:ED:73:7D:83:59:75:F7:14:9C:62:CA:45:39:15:53:69:D1:CE:27` (the key in `keystore/lane.keystore`; if you ever replace that file, run `keytool -list -v -keystore keystore/lane.keystore -storepass android` for the new one).
5. Copy the client ID (ends in `.apps.googleusercontent.com`) into `src/config.js` and push to `main`. The new APK has the sign-in button working.

Workspace admins who restrict third-party apps must allow this client ID once (Admin console → Security → API controls).

What it does: it reads your meetings and your Office/Home working location, places sessions in free time, finds three gaps for move breaks on home days, and adds sessions to your calendar when you tap **Add next 7 days to calendar**. Events it creates are tagged so they're never added twice. Sign-in tokens stay on your phone and are left out of backups. **Sign out** revokes access.

The old Apps Script bridge (`apps-script/Code.gs`) still works under *Settings → Advanced* for anyone who already set it up.

## How the app works

- **Pick your week** (Sunday): training week = 2 sessions; food week = protein at every meal, no stress snacks. A week counts when you hit it.
- **Daily check-in**: one tap. Miss two days and reminders get more persistent; on a "Not today" you get an if-then plan instead of guilt.
- **Fresh start**: a Monday message after a slipped week.
- **Training**: Mon short upper body only if you rehearsed Sunday, Tue musical, Wed calisthenics (Kevin Zhang style), Thu upper body (Trainer Winny style), Fri knee-friendly legs and grip, Sat swim, Sun rest and weigh-in.
- **Progress**: weekly weight, % towards your goal, BMI, streak, graph and first-vs-latest photos. A warning shows if you lose more than about 1 kg a week.
- **Food**: the 30-Day Filling Diet (Built With Science): day counter, weekly meal planner (3 meals a day from 5 recipes or your own bowl), auto-fill, shopping list that adds up the week's ingredients, daily meal check-offs on the Today tab, approved foods, rules and FAQ. A Sunday reminder nudges you to plan next week. Recipes and diet text: `src/content.js`.
- **Data**: stays on your phone only. Use **Settings → Export backup** now and then.

## Change things

- Exercises and the weekly plan: `src/content.js`
- Logic and screens: `src/app.js`, styling: `www/index.html`

Push to `main` and a new APK is built.
