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
