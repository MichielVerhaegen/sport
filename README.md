# Lane

Lane is a personal training and food app for Android. It runs entirely on your phone: a weekly commitment, one-tap check-ins, a training week that fits around your calendar, the 30-day filling diet with a meal planner and shopping list, and Sunday weigh-ins with photos and a progress graph.

## 1. Install the app (5 minutes)

1. Download `lane.apk` from the latest release: [github.com/MichielVerhaegen/sport/releases/latest](https://github.com/MichielVerhaegen/sport/releases/latest).
2. Copy the APK to your phone (Drive, email, cable) and open it. Allow *Install unknown apps* for the app you opened it with. Updates install over the old version and keep your data.
3. Open Lane and tap **Turn on reminders**.
4. Recommended: in Android settings, set Lane's battery usage to *Unrestricted*, otherwise some phones delay reminders.
5. **Settings → Google Calendar → Sign in with Google**. Pick your account and allow calendar access. That's all: Lane now plans sessions around your meetings and detects your home days.
6. Train without a gym? **Settings → Training → I usually train at home**. Every session then shows its no-equipment version. You can switch per day on the Today tab.

Lane checks for new builds a few times a day. When there's one, the Today tab shows a **Download** button; install the file over the old app and your data stays.

Lane only sees your own calendar and only adds events you ask for. **Sign out** in Settings revokes access.

## 2. What the app does

### Today
- **Pick your week** (on Sunday): a *training week* (two sessions) or a *food week* (protein at every meal, no stress snacks). A week counts when you hit the target.
- **Daily check-in**: one tap, *Done* or *Not today*. On a miss you get a kind word and an if-then plan for tomorrow instead of guilt. Miss two days and the reminders get more persistent.
- **Today's training**: the session for today, with a start time that fits between your meetings, and a 15-minute minimum version for busy days.
- **Today's meals**: your planned bowls to tick off, plus the three extra strategies from the diet.
- **Home day moves**: on days you work from home, three two-minute moves fitted into gaps in your calendar.
- **Fresh start**: a Monday message after a slipped week.

### Train
The week: Monday short upper body (only if you rehearsed on Sunday), Tuesday musical, Wednesday calisthenics, Thursday upper body, Friday knee-friendly legs and grip, Saturday swim, Sunday rest and weigh-in. Open a day to see the exercises; tap an exercise for how to do it (setup, cues, easier and harder versions). Each gym or pool session has a **home version** without equipment (push-ups, towel rows, a loaded backpack, a walk or cycle instead of the swim): tick *At home* on that day. **Add next 7 days to calendar** puts the sessions in Google Calendar at the planned times; they're tagged so they're never added twice.

### Food: the 30-day filling diet
Based on *The 30-Day Filling Diet* by Built With Science. Three meals a day, each from one big bowl filled to the top with approved foods, no snacking, no calorie counting.
- **Day counter**: start day 1 and watch the 30 days fill up.
- **Meal plan**: breakfast, lunch and dinner for this week and next, chosen from five recipes, eleven bowl mixes, or your own bowl. **Auto-fill** does the week in one tap.
- **Shop tab**: every ingredient for the planned meals from today on, with amounts added up, plus the to-taste items and bowl-mix ingredients, all as check-offs.
- **Recipes and bowl mixes**: step-by-step recipes with macros, and combinations of approved foods that work together.
- **Diet guide**: the three rules, the full approved food list, extra strategies and FAQ.
- Pick your bowl size (1.9 L or 1.4 L) in Settings. Check the diet with your doctor or dietitian before you start.

### Progress
Weekly weigh-in with an optional photo, percentage towards your goal, kg lost and to go, BMI, streak, a graph, and your first photo next to your latest. A warning shows if you lose more than about 1 kg a week.

### Settings
Your start, goal and height; reminder times; training at home by default; habit tricks (a reward you only allow while training, a habit stack); Google Calendar; diet bowl size and start date; backup; app updates (which build you have, check now).

### Your data
Everything stays on your phone. Nothing is sent anywhere except your own Google Calendar when you sign in. Use **Settings → Export backup** now and then; sign-in tokens are left out of backups.

## 3. For the app owner

### Build the APK
Every push to `main` runs the **Build APK** workflow on GitHub Actions (about 3 minutes). It publishes a GitHub **release** `build-N` with `lane.apk` attached, and bakes build number N into the app; that's how installed apps notice a new build. You can also start a build by hand (**Actions → Build APK → Run workflow**); on branches other than `main` it only produces the **lane-apk** artifact, no release.

The signing key lives in `keystore/lane.keystore`, so every build installs over the previous one. The first build created it; if your organization blocks workflows from pushing, allow it under **Settings → Actions → General → Workflow permissions → Read and write**.

### Google sign-in (one-time, already done)
The app is registered with Google so that users only have to tap **Sign in with Google**. If you ever need to redo it, for example for a new signing key:

1. [console.cloud.google.com](https://console.cloud.google.com): a project with the **Google Calendar API** enabled.
2. **Google Auth Platform**: app name *Lane*, audience **Internal** (Workspace only, no review) or External with test users; scope `.../auth/calendar.events`.
3. **Clients → Create client → Android**, package `eu.michiel.lane`, SHA-1 of the keystore (`keytool -list -v -keystore keystore/lane.keystore -storepass android`). Open the client, **Advanced Settings → Enable custom URI scheme** (off by default; without it sign-in fails with *Error 400: invalid_request*).
4. Paste the client ID into `src/config.js` and push to `main`.

If a Workspace admin restricts third-party apps, they allow this client ID once under **Security → API controls**. The old Apps Script bridge (`apps-script/Code.gs`) still works under *Settings → Advanced*.

### Change things
- Exercises and the weekly plan: `src/content.js` (top half)
- Diet, recipes and bowl mixes: `src/content.js` (bottom half)
- Logic and screens: `src/app.js`; styling: `www/index.html`
- Local bundle: `npm ci && npm run build`, then open `www/index.html` in a browser (reminders and sign-in only work in the installed app)
