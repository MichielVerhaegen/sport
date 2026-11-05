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

## 3. Connect Google Calendar (optional, 5 minutes)

Lane uses a small Google Apps Script that runs under your own account, so no Google Cloud project is needed.

1. Go to [script.google.com](https://script.google.com) and create a new project called *Lane bridge*.
2. Replace the contents of `Code.gs` with `apps-script/Code.gs` from this folder.
3. Left sidebar: **Services → +**, add **Google Calendar API**, keep the identifier `Calendar`.
4. Select the `setup` function at the top, click **Run**, and approve access. Open **Execution log** and copy the key.
5. **Deploy → New deployment → Web app**. Execute as: *Me*. Who has access: *Anyone*. Copy the web app link (ends in `/exec`).
6. In Lane: **Settings → Google Calendar**, paste the link and key, then tap **Test and sync**.

"Anyone" only means anyone with the link *and* your key can reach it. If your Workspace admin doesn't allow "Anyone", the sync won't work: use the *I'm working from home today* toggle in the app instead.

What it does: it reads your meetings and your Office/Home working location, places sessions in free time, finds three gaps for move breaks on home days, and adds sessions to your calendar when you tap **Add next 7 days to calendar**. Events it creates are tagged so they're never added twice.

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
