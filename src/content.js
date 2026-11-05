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
    home: {
      style: 'Quick home session, no equipment',
      exercises: [
        ['Push-ups', '3 × as many as you can, stop 1–2 reps before failure'],
        ['Towel or doorframe rows', '3 × 10–12'],
        ['Backpack curls (books or bottles inside)', '2 × 10–12'],
        ['Towel hang (wrap a towel over a door, pull and hold)', '2 × 20–40 s'],
      ],
    },
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
    home: {
      style: 'Home version: bodyweight plus a loaded backpack',
      exercises: [
        ['Push-ups (feet raised on a chair for more load)', '4 × 8–12'],
        ['Doorframe rows or towel rows', '4 × 8–12'],
        ['Pike push-ups', '3 × 6–10'],
        ['Backpack rows (bent over, backpack in both hands)', '3 × 10–12'],
        ['Backpack curls', '3 × 10–12'],
        ['Chair dips', '3 × 8–12'],
      ],
      note: 'Make it harder each week: more reps, slower lowering, or more books in the backpack.',
    },
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
    home: {
      style: 'Home version: knee-friendly, no equipment',
      exercises: [
        ['Box squats to a chair, limited range (sit back, stand up)', '3 × 10–12'],
        ['Glute bridge, single leg when easy', '3 × 10–12'],
        ['Hamstring walk-outs (lying, heels on a towel on a smooth floor)', '3 × 8–10'],
        ['Standing calf raises on a step', '3 × 12–15'],
        ["Backpack farmer's carry", '3 × 30–40 m'],
        ['Towel hang or towel wring-outs', '2 × as long as you can'],
      ],
      note: 'Same rule as in the gym: knee pain above 3 out of 10? Stop that exercise for today.',
    },
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
    home: {
      title: 'Home cardio',
      mins: 45,
      style: 'Low-impact cardio without the pool',
      exercises: [
        ['Brisk walk or cycle', '35–45 minutes, able to talk but not sing'],
        ['Or: stairs at an easy pace', '10 × up and down, rest as needed'],
        ['Finish: dead hang or towel hang', '2 × 20–40 s'],
      ],
      note: 'Keep it easy on the knee: no running, no jumping.',
    },
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

/* ---------------- Food: the 30-Day Filling Diet ----------------
   Source: "The 30-Day Filling Diet" by Built With Science (Jeremy Ethier).
   Personal use only; keep this repository private. */

export const DIET = {
  days: 30,
  bowls: {
    large: { label: 'Large bowl, 1.9 L', detail: '21 cm (8 in) wide, 10 cm (4 in) tall' },
    medium: { label: 'Medium bowl, 1.4 L', detail: '19 cm (7.5 in) wide, 10 cm (4 in) tall' },
  },
  rules: [
    ['One bowl for every meal', 'Breakfast, lunch and dinner come out of one big bowl. No snacking in between. No suitable bowl? A big Tupperware or plate works, the point is plenty of food.'],
    ['Only approved foods', 'Build each bowl from the approved list. Everything you pick goes into that one bowl, not separate dishes. Respect the limit per category.'],
    ['Fill it to the top', 'Every meal, fill the bowl all the way. No partial bowls: the volume is what keeps you full.'],
  ],
  foods: [
    { name: 'Volume foods', amount: 'Unlimited', groups: [
      ['Vegetables', ['Broccoli', 'Cabbage', 'Lettuce', 'Spinach', 'Mushroom', 'Cucumber', 'Cauliflower', 'Zucchini', 'Kimchi', 'Pumpkin', 'Carrots', 'Squash']],
      ['Fruits', ['Strawberries', 'Watermelon', 'Cantaloupe']],
      ['Ultra low-calorie', ['Konjac noodles', 'Sugar-free jello']],
    ] },
    { name: 'Protein', amount: 'Unlimited', groups: [
      [null, ['Chicken breast (ground or whole)', 'Shrimp', 'Egg whites', 'Tuna', 'Tilapia', '0% fat sugar-free Greek yogurt', '0% fat cottage cheese']],
    ] },
    { name: 'Fat', amount: 'Pick 1 per meal', groups: [
      [null, ['1 tbsp olive or sesame oil', '1 tbsp half-fat mayo', '2 tbsp chia seeds', '20 olives', '½ avocado', '2 whole eggs', '20 almonds', '2 tbsp light cream cheese']],
    ] },
    { name: 'Seasonings and sweeteners', amount: 'Unlimited', groups: [
      [null, ['Salt', 'Pepper', 'Spices', 'Herbs', 'Splenda or stevia', 'Sugar-free syrup']],
    ] },
    { name: 'Sauce', amount: 'Unlimited', groups: [
      [null, ['Soy sauce', 'Fish sauce', 'Sriracha', 'Salsa', 'Hot sauce', 'Mustard', 'Fat-free tomato sauce', 'Sugar-free / fat-free sauces or dressings (under 15 kcal per tbsp)']],
    ] },
    { name: 'Liquid', amount: 'Unlimited', groups: [[null, ['No liquid calories']]] },
    { name: 'Supplements', amount: '1 serving per day', groups: [[null, ['Fish oil']]] },
    { name: 'Cooking oil', amount: '1 serving per meal', groups: [[null, ['Oil cooking spray']]] },
  ],
  strategies: [
    ['Diet soda or sparkling water', 'One can with each meal. Carbonation adds fullness for up to an hour, and a zero-calorie sweet drink takes the edge off cravings.'],
    ['Broth', 'Start one meal with broth. In one study people ate about 20% fewer calories at the meal after a low-calorie broth soup.'],
    ['Small utensil', 'Eat with chopsticks or a teaspoon. More bites and more time at the table means you feel fuller at the end. Participants found this the most effective one.'],
  ],
  faq: [
    ['What bowl should I use?', "Don't overcomplicate it: about 2–3 times bigger than your regular bowl. The big bowl nudges you to fill it with high-volume, filling foods."],
    ['Can I pick just one strategy?', 'Yes. Try them all and keep what works for you.'],
    ['Can I use the big bowl for just one meal?', 'Yes. Even one big-bowl meal should keep you fuller for longer and naturally reduce what you eat at the others.'],
  ],
  careNote: 'You have a bariatric team and a knee to look after. Show this diet to your bariatric team or dietitian before you start, especially the bowl size, and keep protein high. You can pick a smaller bowl in Settings.',
};

export const SLOTS = [['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner']];

// Ingredient: [name, quantity (null = to taste), unit, note]. Units g/ml/tbsp/tsp are summed on the shopping list.
export const RECIPES = [
  {
    id: 'greek', title: 'Greek chicken bowl', kcal: 428, protein: 66, carbs: 22, fat: 9, slots: ['lunch', 'dinner'],
    ingredients: [
      ['Chicken breast, raw', 140, 'g'], ['Lettuce', 250, 'g'], ['Cucumber', 300, 'g'],
      ['0% Greek yogurt', 177, 'ml', '¾ cup'], ['Half-fat light mayo', 1, 'tbsp'],
      ['Lemon juice', 10, 'g', 'about 2 tsp'], ['Garlic, minced or powder', 2, 'tsp'],
      ['Dill relish or fresh dill', 15, 'ml', '1 tbsp'], ['Salt', null, '', 'to taste'],
    ],
    steps: [
      ['Cook the chicken', 'Season lightly with salt and garlic powder. Bake at 200 °C (400 °F) for 20–25 minutes, until 74 °C (165 °F) inside. Rest a few minutes, then slice or chop. Pre-cooked chicken saves time.'],
      ['Prep the vegetables', 'Slice the cucumber and chop or tear the lettuce into bite-sized pieces.'],
      ['Make the lemon dill sauce', 'Mix the Greek yogurt, half the light mayo, lemon juice, dill, garlic and salt. Taste and adjust.'],
      ['Assemble', 'Lettuce and cucumber in the bowl, sliced chicken on top.'],
      ['Dress and toss', 'Spoon the sauce over and toss until coated.'],
      ['Serve', 'Finish with extra dill, a squeeze of lemon or a pinch of salt.'],
    ],
  },
  {
    id: 'rainbow', title: 'Rainbow power breakfast bowl', kcal: 484, protein: 42, carbs: 58, fat: 11, slots: ['breakfast'],
    ingredients: [
      ['Pumpkin, cooked', 230, 'g', '1.5 cups, from one small pumpkin'], ['Cauliflower', 195, 'g', '2 cups'], ['Broccoli', 1, 'serving'],
      ['Carrots, chopped', 185, 'g', '2 cups'], ['Mushrooms, sliced', 170, 'g', '2 cups'], ['Eggs, medium', 2, 'pc'],
      ['Egg whites', 165, 'g'], ['Garlic powder', 5, 'g'], ['Fresh chives', 5, 'g'],
      ['Paprika', null, '', 'to taste'], ['Sriracha', null, '', 'to taste'], ['Sugar-free maple syrup', null, '', 'to taste'], ['Lime juice', null, '', 'to taste'],
    ],
    steps: [
      ['Soften the pumpkin', 'Microwave the whole small pumpkin for 4–5 minutes so it is easier to cut.'],
      ['Prep the vegetables', 'Preheat the oven to 220 °C (425 °F). Slice the mushrooms, carrots and cauliflower into bite-sized pieces.'],
      ['Bake the vegetables', 'Spread mushrooms, carrots and cauliflower on a tray, season, and bake 20–25 minutes, tossing halfway.'],
      ['Finish the pumpkin', 'Cool, cut open, remove the seeds and portion out 230 g. Microwave 1–3 more minutes if still firm.'],
      ['Season the pumpkin', 'Toss with garlic powder, paprika, sriracha, sugar-free maple syrup and lime juice.'],
      ['Soft-boil the eggs', 'Lower 2 eggs into boiling water for 6½–7 minutes, then into cold water. Peel once cool.'],
      ['Scramble the egg whites', 'Cook 165 g egg whites in a non-stick pan over medium-low heat for 2–4 minutes, stirring gently.'],
      ['Finish the vegetables', 'Sprinkle chopped chives over the baked vegetables.'],
      ['Plate and serve', 'Bowl everything, add the halved eggs, finish with extra sriracha, lime, paprika or syrup.'],
    ],
  },
  {
    id: 'tuna', title: 'Tuna kimchi salad bowl', kcal: 407, protein: 58, carbs: 34, fat: 6, slots: ['lunch', 'dinner'],
    ingredients: [
      ['Cucumber', 300, 'g', 'English cucumber'], ['Carrots', 65, 'g'], ['Half-fat light mayo', 1, 'tbsp'], ['Kimchi', 250, 'g'],
      ['Chunk light tuna in water', 113, 'g'], ['Lettuce', 150, 'g'], ['Garlic, minced or powder', 2, 'tsp'],
      ['0% Greek yogurt', 177, 'ml'], ['Soy sauce', 15, 'ml'],
    ],
    steps: [
      ['Prep vegetables', 'Thinly slice the cucumber and carrots. Chop or tear the lettuce.'],
      ['Drain the tuna', 'Drain off any excess liquid.'],
      ['Make the dressing', 'Mix light mayo, soy sauce, Greek yogurt and garlic until smooth. Season with salt or garlic powder.'],
      ['Assemble', 'Lettuce, cucumber, carrots and drained tuna in the bowl.'],
      ['Dress', 'Spoon the dressing over and toss until coated.'],
      ['Finish', 'Top with kimchi just before serving. Adjust garlic or salt.'],
    ],
  },
  {
    id: 'yakisoba', title: 'Chicken konjac yakisoba', kcal: 521, protein: 72, carbs: 35, fat: 13, slots: ['lunch', 'dinner'],
    ingredients: [
      ['Konjac noodles (Moki or similar)', 1, 'bag'], ['Ground chicken breast', 300, 'g'], ['Frozen mixed Normandy-style vegetables', 2, 'cup'],
      ['Soy sauce', 45, 'ml', '3 tbsp'], ['Worcestershire sauce', 15, 'ml'], ['Splenda or no-calorie sweetener', 1, 'packet'],
      ['Salt', 1, 'tsp'], ['Olive oil', 1, 'tsp'], ['Vinegar', null, '', 'a splash, for the noodles'],
    ],
    steps: [
      ['Prepare the noodles', 'Drain, then boil with a splash of vinegar to remove the earthy smell. Rinse in cold water. For better texture, dry-fry them over medium heat until they squeak.'],
      ['Cook the chicken', 'Add the raw ground chicken to the pan with a small splash of water. Break it into fine crumbles with a masher or spoon and cook through.'],
      ['Steam the vegetables', 'Add the frozen vegetables, cover about 1 minute to thaw and tenderize.'],
      ['Combine', 'Add the prepared noodles to the pan.'],
      ['Sauce', 'Mix soy sauce, Worcestershire and sweetener. Pour over and stir-fry a few minutes until it thickens. Add the olive oil and salt.'],
      ['Serve and enjoy', ''],
    ],
  },
  {
    id: 'jello', title: 'Jello yogurt bowl', kcal: 410, protein: 52, carbs: 52, fat: 2, slots: ['breakfast', 'lunch'],
    ingredients: [
      ['Sugar-free Jell-O', 1, 'serving'], ['0% Greek yogurt', 473, 'ml', '2 cups'], ['Strawberries', 500, 'g'],
      ['Splenda or no-calorie sweetener', 2, 'g'],
    ],
    steps: [
      ['Make the Jell-O', 'Prepare the sugar-free Jell-O per the package and let it set fully.'],
      ['Assemble', 'Break the set Jell-O into chunks and add the Greek yogurt.'],
      ['Add strawberries', 'Top with sliced strawberries and the sweetener. Mix or leave layered.'],
      ['Serve chilled', ''],
    ],
  },
];

// Bowl mixes: combinations built only from the approved list. One fat pick per meal.
// Fields: protein, volume (veg/fruit/ultra low-cal), fat (the single pick), flavor (sauces, seasonings), tip.
export const MIXES = [
  { id: 'shrimp-stirfry', title: 'Shrimp stir-fry', slots: ['lunch', 'dinner'],
    protein: ['Shrimp'], volume: ['Broccoli', 'Cabbage', 'Mushroom', 'Carrots', 'Konjac noodles'], fat: '1 tbsp sesame oil', flavor: ['Soy sauce', 'Sriracha'],
    tip: 'Stir-fry the veg first, add shrimp last so it stays tender, toss with the noodles.' },
  { id: 'fish-taco', title: 'Tilapia taco bowl', slots: ['lunch', 'dinner'],
    protein: ['Tilapia'], volume: ['Lettuce', 'Cabbage', 'Cucumber'], fat: '½ avocado', flavor: ['Salsa', 'Spices', 'Hot sauce'],
    tip: 'Rub the fish with spices, pan-fry with cooking spray, flake over the crunchy base.' },
  { id: 'cottage-garden', title: 'Cottage cheese garden bowl', slots: ['breakfast', 'lunch'],
    protein: ['0% cottage cheese'], volume: ['Cucumber', 'Carrots', 'Lettuce'], fat: '20 olives', flavor: ['Pepper', 'Herbs'],
    tip: 'Cold, crunchy and quick. Nothing to cook.' },
  { id: 'egg-scramble', title: 'Veggie egg scramble', slots: ['breakfast'],
    protein: ['Egg whites'], volume: ['Spinach', 'Mushroom', 'Zucchini'], fat: '2 whole eggs', flavor: ['Hot sauce', 'Salt', 'Pepper'],
    tip: 'Cook the veg down first, then scramble the whites and eggs in.' },
  { id: 'chicken-broccoli', title: 'Chicken and broccoli', slots: ['lunch', 'dinner'],
    protein: ['Chicken breast'], volume: ['Broccoli', 'Cauliflower', 'Carrots'], fat: '1 tbsp olive oil', flavor: ['Mustard', 'Soy sauce', 'Pepper'],
    tip: 'Roast the veg and chicken together on one tray.' },
  { id: 'tuna-avocado', title: 'Tuna avocado salad', slots: ['lunch', 'dinner'],
    protein: ['Tuna'], volume: ['Lettuce', 'Cucumber', 'Spinach'], fat: '½ avocado', flavor: ['Mustard', 'Pepper', 'Salt'],
    tip: 'Mash the avocado with the mustard as the dressing.' },
  { id: 'berry-yogurt', title: 'Berry chia yogurt', slots: ['breakfast'],
    protein: ['0% Greek yogurt'], volume: ['Strawberries', 'Watermelon'], fat: '2 tbsp chia seeds', flavor: ['Stevia'],
    tip: 'Stir the chia into the yogurt, leave 10 minutes to thicken, top with fruit.' },
  { id: 'zoodle-shrimp', title: 'Zucchini and shrimp in tomato', slots: ['lunch', 'dinner'],
    protein: ['Shrimp'], volume: ['Zucchini', 'Mushroom'], fat: '1 tbsp olive oil', flavor: ['Fat-free tomato sauce', 'Herbs', 'Pepper'],
    tip: 'Spiralize or slice the zucchini thin, simmer in the tomato sauce with the shrimp.' },
  { id: 'pumpkin-chicken', title: 'Creamy pumpkin chicken', slots: ['lunch', 'dinner'],
    protein: ['Chicken breast'], volume: ['Pumpkin', 'Spinach', 'Cauliflower'], fat: '2 tbsp light cream cheese', flavor: ['Spices', 'Hot sauce', 'Salt'],
    tip: 'Melt the cream cheese into the pumpkin for a creamy sauce.' },
  { id: 'kimchi-noodle', title: 'Kimchi egg-white noodles', slots: ['lunch', 'dinner'],
    protein: ['Egg whites'], volume: ['Kimchi', 'Cabbage', 'Konjac noodles'], fat: '1 tbsp sesame oil', flavor: ['Fish sauce', 'Soy sauce'],
    tip: 'Dry-fry the rinsed konjac noodles first so they absorb the flavour.' },
  { id: 'melon-cottage', title: 'Melon cottage cheese with jello', slots: ['breakfast'],
    protein: ['0% cottage cheese'], volume: ['Cantaloupe', 'Sugar-free jello'], fat: '20 almonds', flavor: ['Stevia'],
    tip: 'Sweet and cold. Break the set jello into chunks over the cheese.' },
];

// How to do each exercise. Matched by keyword against the exercise name (first match wins).
// Each entry: [keywords, setup, cues, easier/harder or safety note]
export const HOWTO = [
  [['dead hang or towel row'], 'Dead hang: hang from a bar with straight arms. Towel row: see towel rows.', 'Hang or row for the time given, keep shoulders slightly active.', 'Either option counts.'],
  [['finish: dead hang'], 'Dead hang from a bar, or a towel hang over a door.', 'Hang with straight arms, shoulders slightly pulled down, as long as you can.', 'Grip training for climbing.'],
  [['pike push'], 'Hands and feet on the floor, hips pushed up high so your body makes an upside-down V. Look at your feet.', 'Bend your elbows and lower the top of your head towards the floor between your hands, then press back up.', 'Easier: hands on a step or chair. Harder: feet on a chair.'],
  [['push-up hold'], 'Top of a push-up: hands under shoulders, arms straight, body in one line from head to heels.', 'Squeeze glutes and belly, push the floor away so your upper back rounds slightly. Hold, breathe normally.', 'Easier: hands on a table or wall.'],
  [['push-ups (incline'], 'Start with hands on a table or bench, body in one line.', 'Lower your chest to the edge, elbows about 45 degrees from your body, press back up. Three sets of 12 clean reps there? Move to the floor, then to feet-raised.', 'Progression ladder: wall, table, bench, floor, feet on a chair.'],
  [['push-ups (feet'], 'Feet on a chair, hands on the floor a bit wider than your shoulders.', 'Lower your chest towards the floor with elbows about 45 degrees from your body, press back up. Keep hips in line with shoulders and heels.', 'Too hard? Feet on the floor, or hands on a step.'],
  [['push-up', 'push ups', 'push-ups'], 'Hands a bit wider than your shoulders, body in one line from head to heels, belly tight.', 'Lower your chest to a fist\'s height from the floor with elbows about 45 degrees from your body, then press back up. Breathe in down, out up.', 'Easier: hands on a table or bench. Harder: feet raised or slower lowering.'],
  [['straight-arm plank'], 'Top of a push-up: hands under shoulders, arms straight, feet together.', 'Squeeze glutes, pull your belly button in, push the floor away. Keep hips level, don\'t let them sag or pike. Breathe.', 'Easier: knees down. Harder: lift one foot.'],
  [['side plank'], 'Lie on your side, elbow under your shoulder, feet stacked or staggered.', 'Lift your hips so your body is a straight line from head to feet. Push the floor away with your elbow. Hold, then switch sides.', 'Easier: bottom knee on the floor.'],
  [['plank'], 'Forearms on the floor, elbows under shoulders, feet together, body in one line.', 'Squeeze glutes and belly, push the floor away so your upper back is slightly rounded. Hold, breathe normally, don\'t hold your breath.', 'Easier: knees down. Harder: add time or lift one foot.'],
  [['hollow body'], 'Lie on your back, lower back pressed into the floor, arms along your body.', 'Lift shoulders and legs a few centimetres off the floor, keep the lower back glued down. Hold. If your back lifts, raise your legs higher or bend your knees.', 'Easier: knees bent, arms by your sides. Harder: arms overhead.'],
  [['bird dog'], 'On hands and knees, hands under shoulders, knees under hips, back flat.', 'Reach one arm forward and the opposite leg back until both are in line with your body. Hold a second, return slowly, switch sides. Don\'t let your hips twist.', 'Keep it slow; it\'s about control, not speed.'],
  [['australian rows', 'negative pull-ups'], 'Australian row: hang under a low bar or sturdy table, heels on the floor, body straight. Pull your chest to the bar, lower slowly.', 'Negative pull-up: step or jump up so your chin is over the bar, then lower yourself as slowly as you can, 3–5 seconds. Climb back up and repeat.', 'Australian rows are easier with knees bent, harder with feet raised.'],
  [['towel or doorframe rows', 'doorframe rows or towel rows', 'doorframe rows'], 'Towel: loop a towel around a door handle (door closed, handle side towards you). Doorframe: hold both sides of a doorframe. Lean back with straight arms, feet near the base.', 'Pull your chest towards your hands by driving your elbows back, squeeze your shoulder blades, lower slowly.', 'Harder: feet further forward so you lean back more.'],
  [['rows (dumbbell', 'towel row'], 'Dumbbell: one hand and knee on a bench, dumbbell in the other hand hanging straight down. Cable: seated, chest up. Towel: see towel rows, lean back and pull.', 'Pull your elbow back past your ribs, squeeze your shoulder blade, lower slowly. Keep your back flat and don\'t twist.', 'Choose a weight where the last rep is hard but clean.'],
  [['backpack rows'], 'Load a backpack with books, hold it by the top handle or straps with both hands. Hinge forward at the hips with a flat back, knees slightly bent.', 'Pull the bag to your lower ribs with elbows close to your body, squeeze your shoulder blades, lower slowly.', 'Add books as it gets easier.'],
  [['backpack curls'], 'Hold a loaded backpack by the top handle with both hands, or by the straps, arms straight, elbows by your sides.', 'Curl it up to shoulder height without swinging, lower slowly over 2–3 seconds.', 'Harder: more books, or hold the top for a second.'],
  [['biceps curls'], 'Stand tall with dumbbells or a bar, elbows by your sides.', 'Curl the weight up without swinging your body, squeeze at the top, lower slowly over 2–3 seconds.', 'If you swing, the weight is too heavy.'],
  [['seated cable row'], 'Sit at the cable row, feet on the platform, knees slightly bent, chest up.', 'Pull the handle to your lower ribs with elbows close to your body, squeeze your shoulder blades, then let your arms straighten slowly.', 'Don\'t lean back and forth; the back stays still.'],
  [['lat pulldown'], 'Sit with thighs under the pads, grip the bar a bit wider than your shoulders.', 'Pull the bar to the top of your chest by driving your elbows down and back, chest up, then let it rise slowly.', 'Don\'t lean far back or pull behind your neck.'],
  [['bench press'], 'Lie on the bench, eyes under the bar, feet flat, shoulder blades pulled together, grip a bit wider than shoulders.', 'Lower the bar to your lower chest with elbows about 45 degrees from your body, press back up to over your shoulders.', 'Use a spotter or safety pins for heavy sets.'],
  [['overhead press'], 'Stand with the bar or dumbbells at shoulder height, hands just outside shoulders, glutes and belly tight.', 'Press straight up until your arms are locked out, then lower back to your shoulders under control.', 'Don\'t arch your lower back; squeeze your glutes.'],
  [['chair dips'], 'Sit on the edge of a sturdy chair, hands beside your hips, slide forward so your hips are off the seat, knees bent.', 'Bend your elbows to lower your hips, elbows pointing back, until your upper arms are about level with the floor, then press back up.', 'Easier: knees more bent. Harder: legs straight. Stop if your shoulders pinch.'],
  [['dips (assisted'], 'Hold the parallel bars with straight arms, lean slightly forward. Use the assisted dip machine or a band if needed.', 'Lower until your upper arms are about level with the floor, elbows pointing back, then press up.', 'Shoulder pain? Shorten the range or use more assistance.'],
  [['towel hang', 'towel wring'], 'Towel hang: fold a towel over the top of a closed door (or around a bar), grip both ends, bend your knees and hang your weight from it. Wring-outs: hold a towel in both hands and twist it hard as if wringing water out, both directions.', 'Hold as long as you can with a firm grip, shoulders slightly pulled down.', 'Make sure the door and hinges can take your weight.'],
  [['dead hang'], 'Grip a pull-up bar, hands shoulder width or a bit wider, hang with straight arms. Climbing grip: fingers over an edge or hangboard.', 'Keep shoulders slightly pulled down and back, not shrugged up to your ears. Hang, breathe. Step down before your grip gives out.', 'Start with partial support from your feet if needed.'],
  [['leg press'], 'Sit in the leg press, feet shoulder width on the platform, a bit higher than centre so the knees aren\'t stressed.', 'Lower the platform only as far as your physio agreed, well before a deep knee bend, then press back up without locking the knees.', 'Set the safety stops to the agreed range so you can\'t go too deep.'],
  [['box squats'], 'Stand in front of a chair, feet shoulder width, toes slightly out.', 'Push your hips back and sit down slowly and under control; touch the seat, then stand up by driving through your heels. Knees track over your toes, not inward.', 'Easier: higher chair or cushion. Harder: hold a backpack to your chest.'],
  [['hamstring walk-outs'], 'Lie on your back on a smooth floor, heels on a towel, knees bent, hips lifted into a bridge.', 'Keeping hips up, slowly slide your heels away until your legs are nearly straight, then pull them back in. Keep the glutes tight.', 'Easier: lower the hips between reps. Harder: one leg at a time.'],
  [['hamstring curl'], 'Lie or sit in the hamstring curl machine, pad just above your heels.', 'Curl your heels towards your glutes, pause, then lower slowly over 2–3 seconds.', 'Don\'t lift your hips off the pad.'],
  [['glute bridge or hip thrust'], 'Bridge: lie on your back, knees bent, feet flat near your glutes. Hip thrust: upper back on a bench, bar or weight across your hips.', 'Drive through your heels and lift your hips until your body is a straight line from knees to shoulders. Squeeze the glutes hard at the top, lower slowly.', 'Don\'t arch your lower back; chin slightly tucked.'],
  [['glute bridge'], 'Lie on your back, knees bent, feet flat on the floor near your glutes, arms by your sides.', 'Push through your heels and lift your hips until your body is a straight line from knees to shoulders. Squeeze the glutes at the top, lower slowly.', 'Harder: one leg extended, the other does the work.'],
  [['standing calf raises', 'calf raises'], 'Stand on the edge of a step with the balls of your feet, heels hanging, hold something for balance.', 'Rise up as high as you can onto your toes, pause, then lower your heels below the step for a stretch. Slow both ways.', 'Harder: one leg, or hold a backpack.'],
  [["backpack farmer", "farmer's carry"], 'Pick up a heavy weight in each hand (dumbbells, kettlebells, or a loaded backpack and bag), stand tall.', 'Walk with short, steady steps, shoulders back and down, belly tight, don\'t lean to one side. Set the weight down with a flat back.', 'Grip gives out before your legs? That\'s the point: it builds climbing grip.'],
  [['easy warm-up'], 'Easy swimming in any stroke, no clock.', 'Long, relaxed strokes, breathe easily, let shoulders loosen up.', 'You should finish feeling warm, not tired.'],
  [['main set'], 'Freestyle in sets of 200 m with a short rest between them.', 'Steady pace, long strokes, breathe every two or three strokes, keep the rest the same each round.', 'Slow down if the last 50 m falls apart.'],
  [['pull buoy'], 'Put the pull buoy between your thighs so your legs float; arms only.', 'Focus on a long reach, a high elbow under water, and pushing all the way past your hip.', 'Also fine with a kickboard held under one arm.'],
  [['easy cool-down'], 'Very easy swimming or floating.', 'Let your breathing settle, relax your shoulders.', 'Any stroke.'],
  [['brisk walk or cycle'], 'Outdoors or on a home trainer.', 'A pace where you can talk in short sentences but not sing. Keep it steady for the whole time.', 'Cycling is the kindest option for the knee.'],
  [['stairs'], 'Any staircase, hold the rail if you like.', 'Walk up at an easy pace, walk down carefully (the down is harder on the knee), rest as needed between rounds.', 'Knee complains on the way down? Switch to the walk or cycle instead.'],
  [['walk'], 'Anywhere, any time today, in one go or in parts.', 'Brisk enough that you breathe a bit harder. Twenty minutes total.', 'Walking to the station counts.'],
];
