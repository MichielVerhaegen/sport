// Training content for Lane.
// Weekly structure agreed with Michiel; exercise picks inspired by Kevin Zhang
// (calisthenics progressions) and Trainer Winny (simple upper/lower lifting),
// with squats/deadlifts swapped for knee-friendly work (no meniscus).

export const WORKOUTS = {
  monShort: {
    title: 'Short upper body',
    mins: 30,
    style: 'Quick session for a rehearsal week',
    exercises: [
      ['Push-ups', '3 × as many as you can, stop 1–2 reps before failure'],
      ['Rows (dumbbell, cable or towel row)', '3 × 8–12'],
      ['Biceps curls', '2 × 10–12'],
      ['Dead hang', '2 × 20–40 s'],
    ],
  },
  calisthenics: {
    title: 'Calisthenics',
    mins: 50,
    style: 'Kevin Zhang style: bodyweight progressions',
    exercises: [
      ['Straight-arm plank', '3 × 30 s'],
      ['Push-ups (incline until 3 × 12 clean, then floor, then decline)', '3 × 8–12'],
      ['Australian rows, then negative pull-ups', '3 × 5–8'],
      ['Dead hang (climbing grip)', '3 × 20–40 s'],
      ['Pike push-ups', '3 × 6–10'],
      ['Hollow body hold', '3 × 20 s'],
    ],
    note: 'Hit the top of the range on every set? Move to the next, harder variation next time.',
  },
  upper: {
    title: 'Upper body',
    mins: 60,
    style: 'Trainer Winny style: simple lifts, add a little each week',
    exercises: [
      ['Bench press', '3 × 6–10'],
      ['Seated cable row', '3 × 8–12'],
      ['Overhead press', '3 × 6–10'],
      ['Lat pulldown', '3 × 8–12'],
      ['Biceps curls', '3 × 10–12'],
      ['Dips (assisted if needed)', '3 × 6–10'],
    ],
    note: 'Progressive overload: one more rep or a small weight jump each week. Chest, arms and back are your focus areas.',
  },
  legs: {
    title: 'Legs and grip',
    mins: 50,
    style: 'Knee-friendly lower body plus forearms for climbing',
    exercises: [
      ['Leg press, limited range (stop before deep bend)', '3 × 10–12'],
      ['Hamstring curl', '3 × 10–12'],
      ['Glute bridge or hip thrust', '3 × 10–12'],
      ['Calf raises', '3 × 12–15'],
      ["Farmer's carry", '3 × 30–40 m'],
      ['Dead hang', '2 × as long as you can'],
    ],
    note: 'Agree the leg ranges with your physio. Knee pain above 3 out of 10? Stop that exercise for today.',
  },
  swim: {
    title: 'Swim',
    mins: 60,
    style: 'Low-impact cardio, your home turf',
    exercises: [
      ['Easy warm-up', '200–400 m'],
      ['Main set', '4–6 × 200 m freestyle, steady'],
      ['Pull buoy (arms only)', '4 × 100 m'],
      ['Easy cool-down', '200 m'],
    ],
    note: 'No pool today? Cycle 45 minutes instead.',
  },
};

export const MINIMUM = {
  title: 'Minimum version',
  mins: 15,
  exercises: [
    ['Push-ups', '3 rounds × 8'],
    ['Dead hang or towel row', '3 rounds × 20 s'],
    ['Plank', '3 rounds × 30 s'],
    ['Walk', '20 minutes, any time today'],
  ],
  note: 'For busy weeks. It keeps the habit alive, and it counts.',
};

// Weekday (0 = Sunday) → plan entry.
export const WEEK = {
  0: { kind: 'rest', title: 'Rest, weigh-in and rehearsal', text: 'Weigh in once this morning, then rest. Rehearse your lines.' },
  1: { kind: 'flex', title: 'Rehearsal or short upper body', text: 'Rehearsed yesterday? Then do the short upper session. Otherwise today is for rehearsal.' },
  2: { kind: 'musical', title: 'Musical', text: 'Dancing plus the warm-up counts as training. Nothing extra today.' },
  3: { kind: 'session', workout: 'calisthenics' },
  4: { kind: 'session', workout: 'upper' },
  5: { kind: 'session', workout: 'legs' },
  6: { kind: 'session', workout: 'swim' },
};

// No-equipment, knee-friendly moves for home days.
export const MICRO = [
  ['Push-ups', 'as many as you can, minus two'],
  ['Pike push-ups', '6–8'],
  ['Plank', '40 s'],
  ['Side plank', '25 s each side'],
  ['Glute bridge', '15'],
  ['Chair dips', '10'],
  ['Hollow body hold', '20 s'],
  ['Bird dog', '10 each side'],
  ['Doorframe rows', '12'],
  ['Push-up hold (top position)', '30 s'],
];

export const MICRO_WINDOWS = [
  ['Morning', '08:00', '11:30'],
  ['Noon', '11:30', '14:00'],
  ['Afternoon', '14:00', '17:30'],
];

export const KIND_WORDS = [
  'A bad day is just a bad day. It is not a reason to stop for six months.',
  'You missed today. That is information, not a verdict. What is the plan for tomorrow?',
  'Be as kind to yourself as you would be to a castmate who had a rough day.',
];
