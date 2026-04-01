/**
 * Pre-built protocol templates for common concierge medicine protocols.
 * These templates can be imported into the provider's protocol library
 * with a single click, then customized per patient.
 */

export interface TemplateStep {
  title: string;
  description?: string;
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "once" | "as_needed" | "custom";
  customDays?: ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[];
  startDay?: number | null;
  endDay?: number | null;
  timeOfDay: "morning" | "afternoon" | "evening" | "any";
  dosageAmount?: string | null;
  dosageUnit?: string | null;
  route?: string | null;
}

export interface ProtocolTemplate {
  key: string;
  name: string;
  description: string;
  category: "nutrition" | "supplement" | "lifestyle" | "lab_work" | "exercise" | "sleep" | "stress" | "peptides" | "hormone" | "other";
  durationDays: number | null;
  milestones: { day: number; label: string }[];
  labCheckpoints: { day: number; labName: string }[];
  steps: TemplateStep[];
  tags: string[];
  summary: string;
}

export const PROTOCOL_TEMPLATES: ProtocolTemplate[] = [
  // ─── BPC-157 HEALING ──────────────────────────
  {
    key: "bpc157-healing",
    name: "BPC-157 Healing Protocol",
    description:
      "Body Protection Compound-157 (BPC-157) is a synthetic peptide derived from gastric juice proteins. This protocol supports tissue repair, gut healing, and recovery from musculoskeletal injuries. Typical cycle is 4–8 weeks with subcutaneous injections.",
    category: "peptides",
    durationDays: 42,
    milestones: [
      { day: 7, label: "Initial response assessment — check injection site tolerance" },
      { day: 14, label: "Mid-point evaluation — assess symptom improvement" },
      { day: 28, label: "4-week check-in — evaluate progress, adjust dose if needed" },
      { day: 42, label: "Protocol completion — determine if extension is warranted" },
    ],
    labCheckpoints: [
      { day: 1, label: "Baseline labs: CMP, CBC, CRP, ESR" },
      { day: 28, label: "Follow-up labs: CRP, ESR (inflammation markers)" },
    ],
    steps: [
      {
        title: "BPC-157 Subcutaneous Injection",
        description:
          "Inject subcutaneously near the site of injury or in the abdominal fat pad. Rotate injection sites to prevent lipodystrophy. Use insulin syringe (29–31 gauge).",
        frequency: "daily",
        startDay: 1,
        endDay: 42,
        timeOfDay: "morning",
        dosageAmount: "250",
        dosageUnit: "mcg",
        route: "subcutaneous",
      },
      {
        title: "Reconstitute BPC-157 Vial",
        description:
          "Add 2 mL bacteriostatic water to 5 mg vial. Each 0.1 mL = 250 mcg. Store reconstituted peptide refrigerated (2–8°C). Discard after 28 days.",
        frequency: "once",
        startDay: 1,
        endDay: null,
        timeOfDay: "any",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "Gut Support — L-Glutamine",
        description:
          "Take L-Glutamine powder mixed in water on an empty stomach to support intestinal lining repair synergistically with BPC-157.",
        frequency: "daily",
        startDay: 1,
        endDay: 42,
        timeOfDay: "morning",
        dosageAmount: "5",
        dosageUnit: "g",
        route: "oral",
      },
      {
        title: "Anti-Inflammatory Diet Adherence",
        description:
          "Follow an anti-inflammatory diet: emphasize omega-3 fatty acids, leafy greens, berries, turmeric. Avoid processed foods, refined sugars, and seed oils.",
        frequency: "daily",
        startDay: 1,
        endDay: 42,
        timeOfDay: "any",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "Progress Journal Entry",
        description:
          "Rate pain/symptom severity on a 1–10 scale. Note any injection site reactions, changes in mobility, or GI improvements.",
        frequency: "daily",
        startDay: 1,
        endDay: 42,
        timeOfDay: "evening",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
    ],
    tags: ["peptide", "healing", "injury recovery", "gut health"],
    summary: "6-week BPC-157 healing cycle — 250 mcg/day subcutaneous with gut support",
  },

  // ─── VITAMIN D LOADING ────────────────────────
  {
    key: "vitamin-d-loading",
    name: "Vitamin D Loading Protocol",
    description:
      "High-dose Vitamin D3 loading protocol for patients with documented deficiency (25-OH Vitamin D < 30 ng/mL). Includes co-factors K2 and magnesium for optimal absorption and calcium metabolism. Loading phase followed by maintenance dosing.",
    category: "supplement",
    durationDays: 90,
    milestones: [
      { day: 7, label: "Check for GI tolerance of high-dose D3" },
      { day: 30, label: "End of loading phase — transition to maintenance dose" },
      { day: 60, label: "Mid-maintenance check-in" },
      { day: 90, label: "Recheck 25-OH Vitamin D level — target 50–80 ng/mL" },
    ],
    labCheckpoints: [
      { day: 1, label: "Baseline: 25-OH Vitamin D, calcium, PTH, magnesium" },
      { day: 45, label: "Mid-protocol: 25-OH Vitamin D, calcium" },
      { day: 90, label: "Completion: 25-OH Vitamin D, calcium, PTH, magnesium" },
    ],
    steps: [
      {
        title: "Vitamin D3 — Loading Phase",
        description:
          "Take with a fat-containing meal for optimal absorption. Loading dose for the first 30 days to rapidly replete stores.",
        frequency: "daily",
        startDay: 1,
        endDay: 30,
        timeOfDay: "morning",
        dosageAmount: "10000",
        dosageUnit: "IU",
        route: "oral",
      },
      {
        title: "Vitamin D3 — Maintenance Phase",
        description:
          "Reduced maintenance dose after loading. Continue taking with a fat-containing meal. Adjust based on follow-up labs.",
        frequency: "daily",
        startDay: 31,
        endDay: 90,
        timeOfDay: "morning",
        dosageAmount: "5000",
        dosageUnit: "IU",
        route: "oral",
      },
      {
        title: "Vitamin K2 (MK-7)",
        description:
          "Essential co-factor — directs calcium into bones and teeth rather than arteries. Always pair with Vitamin D3 supplementation.",
        frequency: "daily",
        startDay: 1,
        endDay: 90,
        timeOfDay: "morning",
        dosageAmount: "200",
        dosageUnit: "mcg",
        route: "oral",
      },
      {
        title: "Magnesium Glycinate",
        description:
          "Magnesium is required for Vitamin D activation. Glycinate form is well-absorbed and gentle on the GI tract. Take in the evening for sleep support.",
        frequency: "daily",
        startDay: 1,
        endDay: 90,
        timeOfDay: "evening",
        dosageAmount: "400",
        dosageUnit: "mg",
        route: "oral",
      },
      {
        title: "Sun Exposure — 15 min Midday",
        description:
          "When possible, get 15 minutes of midday sun exposure on arms and legs without sunscreen. This supports endogenous Vitamin D synthesis and circadian rhythm.",
        frequency: "daily",
        startDay: 1,
        endDay: 90,
        timeOfDay: "afternoon",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
    ],
    tags: ["vitamin D", "deficiency", "bone health", "immune support"],
    summary: "90-day Vitamin D3 repletion — 10,000 IU loading → 5,000 IU maintenance with K2 & Mg",
  },

  // ─── RETATRUTIDE ──────────────────────────────
  {
    key: "retatrutide",
    name: "Retatrutide Protocol",
    description:
      "Retatrutide is a triple agonist (GIP/GLP-1/glucagon receptor) peptide for metabolic optimization and weight management. This protocol follows a conservative titration schedule over 24 weeks to minimize GI side effects while maximizing metabolic benefit.",
    category: "peptides",
    durationDays: 168,
    milestones: [
      { day: 14, label: "Assess GI tolerance at starting dose" },
      { day: 28, label: "First dose escalation — evaluate appetite suppression" },
      { day: 56, label: "Mid-titration assessment — weight, waist circumference, energy" },
      { day: 84, label: "Target dose reached — monitor metabolic markers" },
      { day: 168, label: "Protocol completion — evaluate total weight loss, metabolic panel" },
    ],
    labCheckpoints: [
      { day: 1, label: "Baseline: CMP, lipid panel, HbA1c, fasting insulin, thyroid panel, CBC" },
      { day: 56, label: "Mid-protocol: CMP, lipid panel, HbA1c, fasting insulin" },
      { day: 168, label: "Completion: CMP, lipid panel, HbA1c, fasting insulin, thyroid panel" },
    ],
    steps: [
      {
        title: "Retatrutide — Initiation Phase",
        description:
          "Start at low dose to assess tolerance. Inject subcutaneously in the abdomen, thigh, or upper arm. Rotate injection sites weekly.",
        frequency: "weekly",
        startDay: 1,
        endDay: 28,
        timeOfDay: "morning",
        dosageAmount: "1",
        dosageUnit: "mg",
        route: "subcutaneous",
      },
      {
        title: "Retatrutide — Titration Phase",
        description:
          "Increase dose gradually every 4 weeks. Monitor for nausea, constipation, or injection site reactions. Reduce dose if GI side effects are intolerable.",
        frequency: "weekly",
        startDay: 29,
        endDay: 84,
        timeOfDay: "morning",
        dosageAmount: "2",
        dosageUnit: "mg",
        route: "subcutaneous",
      },
      {
        title: "Retatrutide — Maintenance Phase",
        description:
          "Full maintenance dose. Continue monitoring weight, appetite, and metabolic markers. Adjust based on clinical response and lab results.",
        frequency: "weekly",
        startDay: 85,
        endDay: 168,
        timeOfDay: "morning",
        dosageAmount: "4",
        dosageUnit: "mg",
        route: "subcutaneous",
      },
      {
        title: "High-Protein Diet — 1 g/lb Target",
        description:
          "Maintain high protein intake (minimum 1 g per pound of lean body mass) to preserve muscle during weight loss. Prioritize whole food protein sources: eggs, poultry, fish, beef, Greek yogurt.",
        frequency: "daily",
        startDay: 1,
        endDay: 168,
        timeOfDay: "any",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "Hydration — Minimum 80 oz Water",
        description:
          "GLP-1 agonists can cause dehydration and constipation. Drink at least 80 oz of water daily. Add electrolytes if needed.",
        frequency: "daily",
        startDay: 1,
        endDay: 168,
        timeOfDay: "any",
        dosageAmount: "80",
        dosageUnit: "oz",
        route: "oral",
      },
      {
        title: "Weekly Weigh-In & Measurements",
        description:
          "Record fasting weight, waist circumference, and hip circumference every week. Log in patient portal for trend tracking.",
        frequency: "weekly",
        startDay: 1,
        endDay: 168,
        timeOfDay: "morning",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
    ],
    tags: ["GLP-1", "weight management", "metabolic", "peptide"],
    summary: "24-week retatrutide titration — 1 mg → 2 mg → 4 mg weekly SC with metabolic monitoring",
  },

  // ─── TESAMORELIN ──────────────────────────────
  {
    key: "tesamorelin",
    name: "Tesamorelin Protocol",
    description:
      "Tesamorelin is a growth hormone-releasing hormone (GHRH) analog that stimulates endogenous GH production. Indicated for visceral adiposity reduction, improved body composition, and metabolic health. Administered as a daily subcutaneous injection.",
    category: "peptides",
    durationDays: 90,
    milestones: [
      { day: 14, label: "Assess injection site tolerance and early side effects" },
      { day: 30, label: "1-month check-in — evaluate sleep quality, energy, body composition changes" },
      { day: 60, label: "2-month assessment — measure waist circumference, review labs" },
      { day: 90, label: "Protocol completion — full body composition and metabolic evaluation" },
    ],
    labCheckpoints: [
      { day: 1, label: "Baseline: IGF-1, fasting glucose, HbA1c, lipid panel, CMP" },
      { day: 45, label: "Mid-protocol: IGF-1, fasting glucose" },
      { day: 90, label: "Completion: IGF-1, fasting glucose, HbA1c, lipid panel, CMP" },
    ],
    steps: [
      {
        title: "Tesamorelin Subcutaneous Injection",
        description:
          "Inject subcutaneously in the abdomen. Administer on an empty stomach (at least 2 hours after last meal, 30 minutes before next meal). Rotate injection sites. Use 29–31 gauge insulin syringe.",
        frequency: "daily",
        startDay: 1,
        endDay: 90,
        timeOfDay: "evening",
        dosageAmount: "2",
        dosageUnit: "mg",
        route: "subcutaneous",
      },
      {
        title: "Reconstitute Tesamorelin Vial",
        description:
          "Reconstitute with provided sterile water diluent. Gently swirl — do not shake. Use within 14 days of reconstitution. Store refrigerated (2–8°C).",
        frequency: "biweekly",
        startDay: 1,
        endDay: 90,
        timeOfDay: "any",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "Fasting Window — No Food 2 Hours Pre-Injection",
        description:
          "Tesamorelin efficacy is reduced when administered with food. Maintain a 2-hour fast before injection and wait 30 minutes after injection before eating.",
        frequency: "daily",
        startDay: 1,
        endDay: 90,
        timeOfDay: "evening",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "Resistance Training — 3–4x/week",
        description:
          "Engage in resistance training at least 3 times per week to maximize the anabolic effects of increased GH. Focus on compound movements: squats, deadlifts, bench press, rows.",
        frequency: "custom",
        customDays: ["mon", "wed", "fri", "sat"],
        startDay: 1,
        endDay: 90,
        timeOfDay: "any",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "Sleep Optimization — 7–9 Hours",
        description:
          "GH secretion peaks during deep sleep. Prioritize 7–9 hours of quality sleep. Avoid screens 1 hour before bed, keep bedroom cool (65–68°F), and maintain consistent sleep/wake times.",
        frequency: "daily",
        startDay: 1,
        endDay: 90,
        timeOfDay: "evening",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
    ],
    tags: ["GHRH", "growth hormone", "body composition", "visceral fat"],
    summary: "90-day tesamorelin — 2 mg/day SC evening injection with resistance training",
  },

  // ─── SERMORELIN ───────────────────────────────
  {
    key: "sermorelin",
    name: "Sermorelin Protocol",
    description:
      "Sermorelin is a GHRH analog (GH-releasing hormone 1–29) that stimulates the pituitary to produce growth hormone naturally. Used for anti-aging, improved sleep, recovery, and body composition. Administered as a nightly subcutaneous injection before bed.",
    category: "peptides",
    durationDays: 90,
    milestones: [
      { day: 14, label: "Early assessment — sleep quality improvements typically begin" },
      { day: 30, label: "1-month check-in — evaluate energy, recovery, skin quality" },
      { day: 60, label: "2-month assessment — body composition changes, IGF-1 check" },
      { day: 90, label: "Protocol completion — full evaluation, determine continuation" },
    ],
    labCheckpoints: [
      { day: 1, label: "Baseline: IGF-1, CMP, CBC, fasting glucose, lipid panel" },
      { day: 45, label: "Mid-protocol: IGF-1" },
      { day: 90, label: "Completion: IGF-1, CMP, fasting glucose, lipid panel" },
    ],
    steps: [
      {
        title: "Sermorelin Subcutaneous Injection",
        description:
          "Inject subcutaneously in the abdominal fat pad before bed on an empty stomach. GH release is synergistic with natural nocturnal GH pulses. Rotate injection sites.",
        frequency: "daily",
        startDay: 1,
        endDay: 90,
        timeOfDay: "evening",
        dosageAmount: "300",
        dosageUnit: "mcg",
        route: "subcutaneous",
      },
      {
        title: "No Food 2 Hours Before Injection",
        description:
          "Insulin and blood sugar spikes blunt GH release. Ensure at least a 2-hour fast before the evening injection for optimal peptide response.",
        frequency: "daily",
        startDay: 1,
        endDay: 90,
        timeOfDay: "evening",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "Sleep Hygiene Protocol",
        description:
          "Target 7–9 hours of sleep. Maintain a dark, cool room (65–68°F). Avoid caffeine after 2 PM. Use blue-light blocking glasses after sunset. Sermorelin enhances deep sleep stages where GH is released.",
        frequency: "daily",
        startDay: 1,
        endDay: 90,
        timeOfDay: "evening",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "Morning Recovery Assessment",
        description:
          "Rate sleep quality (1–10), note dream vividness, morning energy level, and any joint stiffness or water retention. Track trends over time.",
        frequency: "daily",
        startDay: 1,
        endDay: 90,
        timeOfDay: "morning",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "Resistance Training — 3x/week",
        description:
          "Strength training amplifies the effects of increased GH. Focus on progressive overload with compound lifts. Allow 48 hours between sessions for recovery.",
        frequency: "custom",
        customDays: ["mon", "wed", "fri"],
        startDay: 1,
        endDay: 90,
        timeOfDay: "any",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
    ],
    tags: ["GHRH", "growth hormone", "anti-aging", "sleep", "recovery"],
    summary: "90-day sermorelin — 300 mcg/day SC at bedtime with sleep optimization",
  },

  // ─── VO2 MAX TRAINING ─────────────────────────
  {
    key: "vo2max-training",
    name: "VO2 Max Training Protocol",
    description:
      "Structured high-intensity interval training (HIIT) protocol designed to maximize VO2 max — the gold standard measure of cardiorespiratory fitness and a strong predictor of all-cause mortality. Follows a progressive overload model with 2–3 sessions per week.",
    category: "exercise",
    durationDays: 84,
    milestones: [
      { day: 7, label: "Complete baseline VO2 max test or field assessment" },
      { day: 28, label: "4-week adaptation — increase interval intensity" },
      { day: 56, label: "8-week progress test — repeat VO2 max assessment" },
      { day: 84, label: "12-week completion — final VO2 max test, compare to baseline" },
    ],
    labCheckpoints: [
      { day: 1, label: "Baseline: resting HR, blood pressure, CBC, CMP, ferritin" },
      { day: 84, label: "Completion: resting HR, blood pressure, ferritin" },
    ],
    steps: [
      {
        title: "VO2 Max Intervals — 4×4 Norwegian Method",
        description:
          "Warm up 10 min at easy pace. Perform 4 intervals of 4 minutes at 90–95% max heart rate with 3 minutes active recovery between intervals. Cool down 5 min. Use rowing, cycling, running, or ski erg.",
        frequency: "custom",
        customDays: ["tue", "fri"],
        startDay: 1,
        endDay: 84,
        timeOfDay: "morning",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "Tabata Finisher (Optional 3rd Session)",
        description:
          "20 seconds all-out effort / 10 seconds rest × 8 rounds (4 minutes total). Use assault bike, rower, or burpees. Only add this session if recovery allows — monitor HRV.",
        frequency: "weekly",
        startDay: 1,
        endDay: 84,
        timeOfDay: "morning",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "Heart Rate Zone Tracking",
        description:
          "Wear a chest strap HR monitor during all sessions. Log peak HR, average HR during intervals, and recovery HR (1 min post-interval). Target: intervals at 90–95% HRmax.",
        frequency: "custom",
        customDays: ["tue", "fri"],
        startDay: 1,
        endDay: 84,
        timeOfDay: "morning",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "Recovery Day — Light Movement",
        description:
          "On non-interval days, perform 20–30 min of light movement: walking, yoga, or easy cycling. Keep HR below 60% max. Active recovery improves adaptation.",
        frequency: "daily",
        startDay: 1,
        endDay: 84,
        timeOfDay: "any",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "Post-Workout Nutrition",
        description:
          "Within 30 minutes of VO2 max sessions, consume 30–40 g protein + 40–60 g carbohydrates to support glycogen replenishment and muscle recovery.",
        frequency: "custom",
        customDays: ["tue", "fri"],
        startDay: 1,
        endDay: 84,
        timeOfDay: "morning",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
    ],
    tags: ["cardio", "VO2 max", "HIIT", "longevity", "fitness"],
    summary: "12-week VO2 max program — Norwegian 4×4 intervals 2x/week with progressive overload",
  },

  // ─── ZONE 2 CARDIO ───────────────────────────
  {
    key: "zone2-cardio",
    name: "Zone 2 Cardio Protocol",
    description:
      "Low-intensity steady-state (LISS) cardio performed in heart rate Zone 2 (60–70% HRmax) to build mitochondrial density, improve fat oxidation, and enhance metabolic flexibility. This is the foundation of Peter Attia's longevity exercise framework. Target 150–180 minutes per week.",
    category: "exercise",
    durationDays: null,
    milestones: [
      { day: 14, label: "Establish consistent Zone 2 HR range and preferred modality" },
      { day: 30, label: "1-month check — assess ability to maintain nasal breathing during sessions" },
      { day: 60, label: "2-month check — evaluate resting HR trend and subjective energy" },
      { day: 90, label: "3-month assessment — retest lactate threshold or MAF pace" },
    ],
    labCheckpoints: [
      { day: 1, label: "Baseline: resting HR, fasting glucose, fasting insulin, lipid panel" },
      { day: 90, label: "Follow-up: resting HR, fasting glucose, fasting insulin, lipid panel" },
    ],
    steps: [
      {
        title: "Zone 2 Cardio Session — 45 min",
        description:
          "Maintain heart rate at 60–70% of max HR (typically 120–145 bpm depending on age). You should be able to hold a conversation but not sing. Use cycling, walking on incline, rowing, or easy jogging. Nasal breathing is a good intensity check.",
        frequency: "custom",
        customDays: ["mon", "wed", "fri", "sun"],
        startDay: null,
        endDay: null,
        timeOfDay: "morning",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "Heart Rate Monitoring",
        description:
          "Use a chest strap or optical HR monitor. Stay strictly in Zone 2 — if HR drifts above 70% max, slow down. Log average HR and duration for each session.",
        frequency: "custom",
        customDays: ["mon", "wed", "fri", "sun"],
        startDay: null,
        endDay: null,
        timeOfDay: "morning",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "Fasted Session (Optional)",
        description:
          "Performing Zone 2 in a fasted state (morning before breakfast) may enhance fat oxidation and metabolic flexibility. Not required — prioritize consistency over fasting.",
        frequency: "custom",
        customDays: ["mon", "wed", "fri"],
        startDay: null,
        endDay: null,
        timeOfDay: "morning",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "Weekly Volume Log",
        description:
          "Track total Zone 2 minutes per week. Target: 150–180 minutes. Gradually increase from 90 min/week if starting from sedentary baseline.",
        frequency: "weekly",
        startDay: null,
        endDay: null,
        timeOfDay: "evening",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
    ],
    tags: ["cardio", "Zone 2", "mitochondria", "fat oxidation", "longevity"],
    summary: "Ongoing Zone 2 cardio — 4×45 min/week at 60–70% HRmax for metabolic health",
  },

  // ─── LOW-CARB PSEUDO-CARNIVORE DIET ───────────
  {
    key: "low-carb-pseudo-carnivore",
    name: "Low-Carb Single-Ingredient Pseudo-Carnivore Diet",
    description:
      "A structured low-carbohydrate nutrition protocol limiting total carbs to 110 g/day. Meals are built from single-ingredient whole foods — primarily animal proteins with select low-glycemic vegetables and fruits. Eliminates processed foods, seed oils, added sugars, and multi-ingredient packaged products. Designed for metabolic reset, insulin sensitivity, and inflammation reduction.",
    category: "nutrition",
    durationDays: 90,
    milestones: [
      { day: 7, label: "Adaptation phase — expect possible low-carb flu symptoms (fatigue, headache)" },
      { day: 14, label: "Keto-adaptation checkpoint — energy should stabilize" },
      { day: 30, label: "1-month review — assess weight, energy, cravings, digestion" },
      { day: 60, label: "2-month review — evaluate body composition and lab trends" },
      { day: 90, label: "Protocol completion — full metabolic panel, determine maintenance plan" },
    ],
    labCheckpoints: [
      { day: 1, label: "Baseline: fasting glucose, fasting insulin, HbA1c, lipid panel, CMP, CRP, uric acid" },
      { day: 45, label: "Mid-protocol: fasting glucose, fasting insulin, lipid panel" },
      { day: 90, label: "Completion: fasting glucose, fasting insulin, HbA1c, lipid panel, CMP, CRP, uric acid" },
    ],
    steps: [
      {
        title: "Daily Carb Target — 110 g Maximum",
        description:
          "Track total carbohydrate intake using a food diary or app. Maximum 110 g net carbs per day. Carb sources should come exclusively from single-ingredient whole foods: sweet potatoes, white rice, berries, seasonal fruit. No bread, pasta, cereal, or packaged carbs.",
        frequency: "daily",
        startDay: 1,
        endDay: 90,
        timeOfDay: "any",
        dosageAmount: "110",
        dosageUnit: "g",
        route: "oral",
      },
      {
        title: "Protein Target — 1 g per lb Lean Mass",
        description:
          "Prioritize animal protein from single-ingredient sources: beef, chicken, fish, eggs, organ meats, bone broth. Target minimum 1 g protein per pound of lean body mass. Each meal should center around a protein source.",
        frequency: "daily",
        startDay: 1,
        endDay: 90,
        timeOfDay: "any",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "Single-Ingredient Rule — Every Meal",
        description:
          "Every food item on your plate should be a single ingredient: steak, eggs, salmon, sweet potato, avocado, butter, olive oil, berries. If it has a nutrition label with multiple ingredients, do not eat it. Cook with butter, ghee, tallow, or olive oil only.",
        frequency: "daily",
        startDay: 1,
        endDay: 90,
        timeOfDay: "any",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "Electrolyte Supplementation",
        description:
          "Low-carb diets increase electrolyte excretion. Supplement daily: sodium (2–3 g from salt or broth), potassium (from avocado, meat), magnesium (400 mg glycinate). Prevents headaches, cramps, and fatigue.",
        frequency: "daily",
        startDay: 1,
        endDay: 90,
        timeOfDay: "morning",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "Magnesium Glycinate",
        description:
          "Supports electrolyte balance, sleep quality, and muscle recovery on a low-carb diet. Take in the evening.",
        frequency: "daily",
        startDay: 1,
        endDay: 90,
        timeOfDay: "evening",
        dosageAmount: "400",
        dosageUnit: "mg",
        route: "oral",
      },
      {
        title: "Daily Food Journal",
        description:
          "Log all meals with estimated macros. Note energy levels, hunger/satiety, digestion, and any cravings. This data helps the provider fine-tune the protocol.",
        frequency: "daily",
        startDay: 1,
        endDay: 90,
        timeOfDay: "evening",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
    ],
    tags: ["nutrition", "low-carb", "carnivore", "metabolic", "insulin sensitivity"],
    summary: "90-day low-carb (110 g/day) single-ingredient diet — animal protein-focused with metabolic labs",
  },

  // ─── TESTOSTERONE INJECTION MAINTENANCE ────────
  {
    key: "testosterone-maintenance",
    name: "Testosterone Injection Maintenance",
    description:
      "Standard testosterone replacement therapy (TRT) maintenance protocol for men with documented hypogonadism. Uses testosterone cypionate with twice-weekly subcutaneous micro-dosing for stable serum levels, paired with estrogen management (anastrozole PRN) and hCG to preserve fertility and testicular function. Ongoing protocol with quarterly lab monitoring.",
    category: "hormone",
    durationDays: 180,
    milestones: [
      { day: 14, label: "Initial tolerance check — assess injection site, energy, mood" },
      { day: 42, label: "6-week steady-state — first follow-up labs to dial in dose" },
      { day: 90, label: "Quarter 1 review — evaluate symptom resolution, libido, body composition" },
      { day: 180, label: "6-month comprehensive review — full hormone panel, DEXA if indicated" },
    ],
    labCheckpoints: [
      { day: 1, label: "Baseline: Total T, Free T, SHBG, Estradiol (sensitive), CBC, CMP, Lipid Panel, PSA, LH, FSH, Prolactin" },
      { day: 42, label: "6-week follow-up: Total T, Free T, Estradiol (sensitive), CBC, Hematocrit" },
      { day: 90, label: "Quarter 1: Total T, Free T, SHBG, Estradiol, CBC, CMP, Lipid Panel, PSA" },
      { day: 180, label: "6-month comprehensive: Total T, Free T, SHBG, Estradiol, CBC, CMP, Lipid Panel, PSA, LH, FSH, DHEA-S, IGF-1" },
    ],
    steps: [
      {
        title: "Testosterone Cypionate Injection",
        description:
          "Inject subcutaneously in the abdominal fat pad or ventral gluteal area using a 27–29 gauge insulin syringe. Split weekly dose into two injections (Mon/Thu or Tue/Fri) for more stable serum levels and reduced estrogen conversion. Draw from multi-dose vial (200 mg/mL). Rotate injection sites.",
        frequency: "custom",
        customDays: ["mon", "thu"],
        startDay: 1,
        endDay: 180,
        timeOfDay: "morning",
        dosageAmount: "40",
        dosageUnit: "mg",
        route: "subcutaneous",
      },
      {
        title: "hCG (Human Chorionic Gonadotropin)",
        description:
          "Preserves intratesticular testosterone production, testicular volume, and fertility potential. Inject subcutaneously on non-testosterone days. May be discontinued if fertility is not a concern and patient prefers simplicity.",
        frequency: "custom",
        customDays: ["tue", "fri"],
        startDay: 1,
        endDay: 180,
        timeOfDay: "morning",
        dosageAmount: "500",
        dosageUnit: "IU",
        route: "subcutaneous",
      },
      {
        title: "Anastrozole (As Needed)",
        description:
          "Aromatase inhibitor for estrogen management. Only use if Estradiol (sensitive) exceeds 40–50 pg/mL with symptoms (water retention, nipple sensitivity, mood changes). Start at 0.25 mg twice weekly and titrate based on labs. Many patients on subcutaneous micro-dosing do not need an AI.",
        frequency: "as_needed",
        startDay: null,
        endDay: null,
        timeOfDay: "morning",
        dosageAmount: "0.25",
        dosageUnit: "mg",
        route: "oral",
      },
      {
        title: "DHEA Supplementation",
        description:
          "Supports adrenal androgen production and overall hormonal balance. Take with breakfast. Dose may be adjusted based on DHEA-S lab results — target mid-to-upper reference range.",
        frequency: "daily",
        startDay: 1,
        endDay: 180,
        timeOfDay: "morning",
        dosageAmount: "25",
        dosageUnit: "mg",
        route: "oral",
      },
      {
        title: "Zinc Picolinate",
        description:
          "Essential mineral for testosterone synthesis, immune function, and aromatase modulation. Take with dinner. Do not exceed 50 mg/day to avoid copper depletion.",
        frequency: "daily",
        startDay: 1,
        endDay: 180,
        timeOfDay: "evening",
        dosageAmount: "30",
        dosageUnit: "mg",
        route: "oral",
      },
      {
        title: "Strength Training — Compound Lifts",
        description:
          "Resistance training is essential to maximize TRT benefits. Focus on compound movements: squat, deadlift, bench press, overhead press, rows. Minimum 3 sessions per week, progressive overload. Training amplifies the anabolic signal from exogenous testosterone.",
        frequency: "custom",
        customDays: ["mon", "wed", "fri"],
        startDay: 1,
        endDay: 180,
        timeOfDay: "morning",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "Blood Pressure & Hematocrit Monitoring",
        description:
          "Check blood pressure at home weekly. Testosterone can increase hematocrit (red blood cell concentration). If hematocrit exceeds 54%, consider therapeutic phlebotomy or dose reduction. Report headaches, flushing, or visual changes immediately.",
        frequency: "weekly",
        startDay: 1,
        endDay: 180,
        timeOfDay: "morning",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "Symptom Journal Entry",
        description:
          "Track energy level (1–10), libido (1–10), mood, sleep quality, morning erections, and any side effects (acne, hair changes, water retention). This data is critical for dose optimization at follow-up appointments.",
        frequency: "weekly",
        startDay: 1,
        endDay: 180,
        timeOfDay: "evening",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
    ],
    tags: ["TRT", "testosterone", "hormone replacement", "hypogonadism", "men's health"],
    summary: "6-month TRT maintenance — Test Cyp 80 mg/wk (split 2x), hCG 1000 IU/wk, with quarterly labs",
  },

  // ─── THYMOSIN ALPHA-1 IMMUNE PROTOCOL ─────────
  {
    key: "thymosin-alpha-1",
    name: "Thymosin Alpha-1 Immune Protocol",
    description:
      "Thymosin Alpha-1 (Tα1) is a thymic peptide that modulates immune function by enhancing T-cell maturation, dendritic cell activity, and NK cell cytotoxicity. Used in concierge medicine for chronic viral infections (EBV, CMV, Lyme co-infections), immune dysregulation, cancer adjunct support, and post-illness immune reconstitution. Standard protocol is 12 weeks with twice-weekly subcutaneous injections.",
    category: "peptides",
    durationDays: 84,
    milestones: [
      { day: 14, label: "Initial tolerance assessment — check injection sites, energy, any flu-like symptoms" },
      { day: 28, label: "4-week evaluation — assess symptom improvement, infection markers" },
      { day: 56, label: "8-week check-in — mid-protocol labs, evaluate immune response" },
      { day: 84, label: "Protocol completion — full immune panel, determine continuation or cycling off" },
    ],
    labCheckpoints: [
      { day: 1, label: "Baseline: CBC with differential, CMP, CRP, ESR, NK cell activity, CD4/CD8 ratio, IgG/IgA/IgM, EBV/CMV titers if applicable" },
      { day: 42, label: "Mid-protocol: CBC with differential, CRP, NK cell activity, CD4/CD8 ratio" },
      { day: 84, label: "Completion: CBC with differential, CMP, CRP, ESR, NK cell activity, CD4/CD8 ratio, IgG/IgA/IgM, viral titers" },
    ],
    steps: [
      {
        title: "Thymosin Alpha-1 Subcutaneous Injection",
        description:
          "Inject subcutaneously in the abdominal fat pad or upper arm using a 29–31 gauge insulin syringe. Administer twice weekly with 3–4 days between injections (e.g., Mon/Thu). Rotate injection sites. Store reconstituted peptide refrigerated (2–8°C).",
        frequency: "custom",
        customDays: ["mon", "thu"],
        startDay: 1,
        endDay: 84,
        timeOfDay: "morning",
        dosageAmount: "1.6",
        dosageUnit: "mg",
        route: "subcutaneous",
      },
      {
        title: "Vitamin C — Liposomal",
        description:
          "High-dose liposomal Vitamin C supports immune function synergistically with Tα1. Liposomal form provides superior bioavailability compared to standard ascorbic acid. Take on an empty stomach.",
        frequency: "daily",
        startDay: 1,
        endDay: 84,
        timeOfDay: "morning",
        dosageAmount: "2000",
        dosageUnit: "mg",
        route: "oral",
      },
      {
        title: "Quercetin with Bromelain",
        description:
          "Natural immunomodulator and zinc ionophore. Supports T-cell function and has antiviral properties. Take 30 minutes before meals for optimal absorption.",
        frequency: "daily",
        startDay: 1,
        endDay: 84,
        timeOfDay: "morning",
        dosageAmount: "500",
        dosageUnit: "mg",
        route: "oral",
      },
      {
        title: "Zinc Picolinate",
        description:
          "Essential for thymic function and T-cell development. Zinc deficiency impairs immune response. Take with food to minimize GI upset.",
        frequency: "daily",
        startDay: 1,
        endDay: 84,
        timeOfDay: "evening",
        dosageAmount: "30",
        dosageUnit: "mg",
        route: "oral",
      },
      {
        title: "Sleep Optimization — 8+ Hours",
        description:
          "Immune reconstitution is heavily dependent on sleep quality. Target 8+ hours nightly. Avoid screens 1 hour before bed, keep room cool (65–68°F), and maintain consistent sleep/wake times. Consider magnesium glycinate before bed.",
        frequency: "daily",
        startDay: 1,
        endDay: 84,
        timeOfDay: "evening",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "Immune Symptom Journal",
        description:
          "Track energy (1–10), any infection symptoms, lymph node tenderness, night sweats, brain fog, and injection site reactions. Note any illness episodes and recovery time.",
        frequency: "weekly",
        startDay: 1,
        endDay: 84,
        timeOfDay: "evening",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
    ],
    tags: ["peptide", "immune", "thymosin", "T-cell", "antiviral", "Lyme"],
    summary: "12-week Tα1 immune protocol — 1.6 mg 2x/wk subQ with immune support stack",
  },

  // ─── MOTS-c MITOCHONDRIAL PEPTIDE ───────────
  {
    key: "mots-c",
    name: "MOTS-c Mitochondrial Protocol",
    description:
      "MOTS-c is a mitochondrial-derived peptide that activates AMPK, enhances glucose metabolism, improves insulin sensitivity, and supports exercise capacity. It mimics the metabolic benefits of exercise at the cellular level. Used for metabolic optimization, longevity, and performance enhancement. Typical cycle is 8–12 weeks with subcutaneous injections 3–5 times per week.",
    category: "peptides",
    durationDays: 84,
    milestones: [
      { day: 14, label: "Initial response — assess energy, exercise tolerance, any injection site reactions" },
      { day: 28, label: "4-week evaluation — fasting glucose trends, body composition changes" },
      { day: 56, label: "8-week check-in — mid-protocol labs, exercise performance assessment" },
      { day: 84, label: "Protocol completion — full metabolic panel, determine continuation" },
    ],
    labCheckpoints: [
      { day: 1, label: "Baseline: CMP, fasting insulin, HbA1c, lipid panel, lactate, hs-CRP, body composition (DEXA or InBody)" },
      { day: 42, label: "Mid-protocol: CMP, fasting insulin, HbA1c, lipid panel, lactate" },
      { day: 84, label: "Completion: CMP, fasting insulin, HbA1c, lipid panel, lactate, hs-CRP, body composition" },
    ],
    steps: [
      {
        title: "MOTS-c Subcutaneous Injection",
        description:
          "Inject subcutaneously in the abdominal fat pad using a 29–31 gauge insulin syringe. Administer 5 days per week (Mon–Fri), rest on weekends. Best administered in the morning before exercise for synergistic metabolic activation. Rotate injection sites.",
        frequency: "custom",
        customDays: ["mon", "tue", "wed", "thu", "fri"],
        startDay: 1,
        endDay: 84,
        timeOfDay: "morning",
        dosageAmount: "10",
        dosageUnit: "mg",
        route: "subcutaneous",
      },
      {
        title: "Fasted Morning Exercise",
        description:
          "MOTS-c works synergistically with exercise via AMPK activation. Perform 30–45 minutes of moderate-intensity exercise (Zone 2 cardio or resistance training) in the morning after injection. Fasted state amplifies AMPK signaling.",
        frequency: "custom",
        customDays: ["mon", "wed", "fri"],
        startDay: 1,
        endDay: 84,
        timeOfDay: "morning",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "CoQ10 (Ubiquinol)",
        description:
          "Mitochondrial electron transport chain cofactor. Ubiquinol is the reduced, bioavailable form. Supports mitochondrial energy production synergistically with MOTS-c. Take with a fat-containing meal.",
        frequency: "daily",
        startDay: 1,
        endDay: 84,
        timeOfDay: "morning",
        dosageAmount: "200",
        dosageUnit: "mg",
        route: "oral",
      },
      {
        title: "PQQ (Pyrroloquinoline Quinone)",
        description:
          "Stimulates mitochondrial biogenesis — the creation of new mitochondria. Complements MOTS-c’s metabolic effects. Take in the morning with CoQ10.",
        frequency: "daily",
        startDay: 1,
        endDay: 84,
        timeOfDay: "morning",
        dosageAmount: "20",
        dosageUnit: "mg",
        route: "oral",
      },
      {
        title: "Blood Glucose Monitoring",
        description:
          "Track fasting blood glucose 2–3 times per week using a glucometer or CGM. MOTS-c should improve fasting glucose and post-prandial glucose over the protocol. Log readings in your journal.",
        frequency: "custom",
        customDays: ["mon", "wed", "fri"],
        startDay: 1,
        endDay: 84,
        timeOfDay: "morning",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "Metabolic Performance Journal",
        description:
          "Track energy (1–10), exercise performance (reps/weight/distance), fasting glucose readings, body weight, and any changes in appetite or body composition. Note exercise type and duration.",
        frequency: "weekly",
        startDay: 1,
        endDay: 84,
        timeOfDay: "evening",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
    ],
    tags: ["peptide", "mitochondrial", "AMPK", "metabolic", "longevity", "exercise"],
    summary: "12-week MOTS-c protocol — 10 mg 5x/wk subQ with mitochondrial support and fasted exercise",
  },

  // ─── SS-31 (ELAMIPRETIDE) MITOCHONDRIAL ───────
  {
    key: "ss-31",
    name: "SS-31 (Elamipretide) Mitochondrial Protocol",
    description:
      "SS-31 (Elamipretide) is a mitochondria-targeted tetrapeptide that concentrates in the inner mitochondrial membrane, stabilizing cardiolipin and restoring electron transport chain efficiency. It reduces reactive oxygen species (ROS) at the source rather than scavenging downstream. Used for cellular energy restoration, anti-aging, cardiac support, and recovery from mitochondrial dysfunction.",
    category: "peptides",
    durationDays: 60,
    milestones: [
      { day: 7, label: "Initial tolerance check — assess injection site reactions, energy changes" },
      { day: 21, label: "3-week evaluation — early energy and cognitive improvements expected" },
      { day: 42, label: "6-week assessment — mid-protocol labs, exercise capacity evaluation" },
      { day: 60, label: "Protocol completion — full assessment, determine cycling strategy" },
    ],
    labCheckpoints: [
      { day: 1, label: "Baseline: CMP, CBC, CoQ10 levels, lactate, 8-OHdG (oxidative stress marker), hs-CRP, BNP (if cardiac concern)" },
      { day: 30, label: "Mid-protocol: CMP, lactate, hs-CRP" },
      { day: 60, label: "Completion: CMP, CBC, CoQ10 levels, lactate, 8-OHdG, hs-CRP, BNP" },
    ],
    steps: [
      {
        title: "SS-31 Subcutaneous Injection",
        description:
          "Inject subcutaneously in the abdominal fat pad using a 29–31 gauge insulin syringe. Administer daily for the first 4 weeks, then taper to 5 days/week for weeks 5–8. Best taken in the morning. SS-31 rapidly concentrates in mitochondria within minutes of injection.",
        frequency: "daily",
        startDay: 1,
        endDay: 28,
        timeOfDay: "morning",
        dosageAmount: "5",
        dosageUnit: "mg",
        route: "subcutaneous",
      },
      {
        title: "SS-31 — Taper Phase",
        description:
          "Reduce to 5 days per week (Mon–Fri) during the taper phase. Continue morning administration. Assess whether benefits are maintained at reduced frequency.",
        frequency: "custom",
        customDays: ["mon", "tue", "wed", "thu", "fri"],
        startDay: 29,
        endDay: 60,
        timeOfDay: "morning",
        dosageAmount: "5",
        dosageUnit: "mg",
        route: "subcutaneous",
      },
      {
        title: "NAD+ Precursor (NMN or NR)",
        description:
          "Nicotinamide mononucleotide (NMN) or nicotinamide riboside (NR) supports NAD+ levels critical for mitochondrial function. Take sublingual NMN in the morning for best absorption. Synergistic with SS-31’s cardiolipin stabilization.",
        frequency: "daily",
        startDay: 1,
        endDay: 60,
        timeOfDay: "morning",
        dosageAmount: "500",
        dosageUnit: "mg",
        route: "sublingual",
      },
      {
        title: "Alpha-Lipoic Acid (R-ALA)",
        description:
          "R-Alpha Lipoic Acid is a mitochondrial antioxidant that recycles other antioxidants (Vitamin C, E, glutathione). The R-form is the bioactive isomer. Take on an empty stomach.",
        frequency: "daily",
        startDay: 1,
        endDay: 60,
        timeOfDay: "morning",
        dosageAmount: "300",
        dosageUnit: "mg",
        route: "oral",
      },
      {
        title: "Cold Exposure — Mitochondrial Stimulus",
        description:
          "Cold exposure (cold shower 2–3 min or cold plunge 1–2 min at 50–55°F) stimulates mitochondrial biogenesis via PGC-1α activation. Perform 3–4 times per week. Complements SS-31’s mitochondrial optimization.",
        frequency: "custom",
        customDays: ["mon", "wed", "fri", "sat"],
        startDay: 1,
        endDay: 60,
        timeOfDay: "morning",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "Energy & Recovery Journal",
        description:
          "Track daily energy (1–10), cognitive clarity (1–10), exercise recovery time, sleep quality, and any changes in endurance or strength. Note heart rate variability (HRV) if tracking.",
        frequency: "weekly",
        startDay: 1,
        endDay: 60,
        timeOfDay: "evening",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
    ],
    tags: ["peptide", "mitochondrial", "SS-31", "elamipretide", "anti-aging", "cardiolipin", "ROS"],
    summary: "8-week SS-31 protocol — 5 mg/day subQ (taper wk 5–8) with NAD+ and mitochondrial support",
  },

  // ─── GHK-Cu REGENERATIVE PEPTIDE ────────────
  {
    key: "ghk-cu",
    name: "GHK-Cu Regenerative Protocol",
    description:
      "GHK-Cu (Glycyl-L-Histidyl-L-Lysine Copper) is a naturally occurring copper peptide that declines with age. It activates over 4,000 genes involved in tissue remodeling, collagen synthesis, wound healing, anti-inflammation, and DNA repair. Used for skin rejuvenation, hair restoration, joint repair, post-surgical healing, and systemic anti-aging. Can be administered subcutaneously and/or topically.",
    category: "peptides",
    durationDays: 90,
    milestones: [
      { day: 14, label: "Initial assessment — check injection site tolerance, skin texture baseline photos" },
      { day: 30, label: "4-week evaluation — early skin/hair changes, wound healing improvements" },
      { day: 60, label: "8-week check-in — visible collagen/skin improvements expected" },
      { day: 90, label: "Protocol completion — full assessment, before/after comparison photos" },
    ],
    labCheckpoints: [
      { day: 1, label: "Baseline: CMP, CBC, copper/ceruloplasmin levels, zinc (copper:zinc ratio), hs-CRP" },
      { day: 45, label: "Mid-protocol: Copper, zinc, ceruloplasmin, CMP" },
      { day: 90, label: "Completion: CMP, CBC, copper/ceruloplasmin, zinc, hs-CRP" },
    ],
    steps: [
      {
        title: "GHK-Cu Subcutaneous Injection",
        description:
          "Inject subcutaneously in the abdominal fat pad using a 29–31 gauge insulin syringe. Administer daily for the first 30 days (loading), then 5 days/week for maintenance. For localized joint or injury support, inject near the affected area. Rotate injection sites.",
        frequency: "daily",
        startDay: 1,
        endDay: 30,
        timeOfDay: "morning",
        dosageAmount: "200",
        dosageUnit: "mcg",
        route: "subcutaneous",
      },
      {
        title: "GHK-Cu — Maintenance Phase",
        description:
          "Reduce to 5 days per week after the initial loading phase. Continue rotating injection sites. Monitor copper levels to ensure they remain within normal range.",
        frequency: "custom",
        customDays: ["mon", "tue", "wed", "thu", "fri"],
        startDay: 31,
        endDay: 90,
        timeOfDay: "morning",
        dosageAmount: "200",
        dosageUnit: "mcg",
        route: "subcutaneous",
      },
      {
        title: "GHK-Cu Topical Application (Face/Scalp)",
        description:
          "Apply GHK-Cu topical serum or cream to face, neck, and/or scalp nightly after cleansing. The topical route targets local collagen synthesis and hair follicle stimulation. Can be used alongside injectable protocol.",
        frequency: "daily",
        startDay: 1,
        endDay: 90,
        timeOfDay: "evening",
        dosageAmount: null,
        dosageUnit: null,
        route: "topical",
      },
      {
        title: "Vitamin C — Collagen Co-factor",
        description:
          "Vitamin C is essential for collagen hydroxylation and synthesis. Supports GHK-Cu’s tissue remodeling effects. Take with breakfast.",
        frequency: "daily",
        startDay: 1,
        endDay: 90,
        timeOfDay: "morning",
        dosageAmount: "1000",
        dosageUnit: "mg",
        route: "oral",
      },
      {
        title: "Collagen Peptides",
        description:
          "Hydrolyzed collagen peptides provide the amino acid building blocks (glycine, proline, hydroxyproline) for collagen synthesis. Mix in coffee or smoothie. Type I/III blend for skin and joints.",
        frequency: "daily",
        startDay: 1,
        endDay: 90,
        timeOfDay: "morning",
        dosageAmount: "20",
        dosageUnit: "g",
        route: "oral",
      },
      {
        title: "Progress Photos — Skin/Hair",
        description:
          "Take standardized photos of face (front, 45°, profile) and any target areas (scalp, scars, joints) every 2 weeks under consistent lighting. Upload to patient portal for provider review and before/after comparison.",
        frequency: "biweekly",
        startDay: 1,
        endDay: 90,
        timeOfDay: "morning",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
    ],
    tags: ["peptide", "copper peptide", "collagen", "skin", "hair", "anti-aging", "wound healing"],
    summary: "90-day GHK-Cu protocol — 200 mcg/day subQ (loading → maintenance) + topical with collagen support",
  },

  // ─── PERSONALIZED SUPPLEMENT ROUTINE ─────────
  {
    key: "supplement-routine-core",
    name: "Core Supplement Routine",
    description:
      "A comprehensive daily supplement stack built around foundational health optimization. Includes creatine monohydrate for cognitive and muscular performance, Vitamin D3/K2 for bone and immune health, magnesium glycinate for sleep and recovery, zinc for immune and hormonal support, omega-3 fatty acids for inflammation management, and IM8 immune support drink for daily immune resilience. Designed as an ongoing maintenance routine.",
    category: "supplement",
    durationDays: 90,
    milestones: [
      { day: 14, label: "2-week check-in — assess GI tolerance, energy changes, sleep quality" },
      { day: 30, label: "1-month evaluation — creatine loading complete, subjective improvements" },
      { day: 60, label: "2-month assessment — mid-protocol labs, body composition check" },
      { day: 90, label: "Quarter review — full labs, evaluate and adjust stack" },
    ],
    labCheckpoints: [
      { day: 1, label: "Baseline: CMP, CBC, 25-OH Vitamin D, RBC Magnesium, Zinc, Omega-3 Index, hs-CRP, lipid panel, creatinine/BUN" },
      { day: 90, label: "Follow-up: CMP, 25-OH Vitamin D, RBC Magnesium, Zinc, Omega-3 Index, hs-CRP, lipid panel, creatinine/BUN" },
    ],
    steps: [
      {
        title: "Creatine Monohydrate",
        description:
          "Creatine is the most well-researched supplement for muscular performance, cognitive function, and cellular energy (ATP regeneration). Take 5 g daily — no loading phase needed. Mix in water, coffee, or shake. Timing is flexible but consistency matters. Stay well-hydrated (additional 16–24 oz water daily).",
        frequency: "daily",
        startDay: 1,
        endDay: 90,
        timeOfDay: "morning",
        dosageAmount: "5",
        dosageUnit: "g",
        route: "oral",
      },
      {
        title: "Vitamin D3 + K2 (MK-7)",
        description:
          "Vitamin D3 supports immune function, bone density, mood, and hormonal health. K2 (MK-7) directs calcium into bones and teeth, preventing arterial calcification. Always pair D3 with K2. Take with a fat-containing meal for absorption. Adjust D3 dose based on 25-OH Vitamin D levels (target 50–80 ng/mL).",
        frequency: "daily",
        startDay: 1,
        endDay: 90,
        timeOfDay: "morning",
        dosageAmount: "5000",
        dosageUnit: "IU",
        route: "oral",
      },
      {
        title: "Magnesium Glycinate",
        description:
          "Magnesium is involved in 600+ enzymatic reactions. Glycinate form is highly bioavailable and promotes relaxation and sleep quality. Most adults are deficient. Take in the evening 30–60 minutes before bed for sleep support. Monitor RBC Magnesium (not serum) for accurate status.",
        frequency: "daily",
        startDay: 1,
        endDay: 90,
        timeOfDay: "evening",
        dosageAmount: "400",
        dosageUnit: "mg",
        route: "oral",
      },
      {
        title: "Zinc Picolinate",
        description:
          "Essential for immune function, testosterone synthesis, wound healing, and thyroid health. Picolinate form has superior absorption. Take with dinner — avoid taking with calcium or iron supplements. Do not exceed 50 mg/day long-term to prevent copper depletion.",
        frequency: "daily",
        startDay: 1,
        endDay: 90,
        timeOfDay: "evening",
        dosageAmount: "30",
        dosageUnit: "mg",
        route: "oral",
      },
      {
        title: "Omega-3 Fish Oil (EPA/DHA)",
        description:
          "High-potency omega-3 fatty acids for systemic inflammation management, cardiovascular health, brain function, and joint support. Use a triglyceride-form fish oil with at least 1000 mg combined EPA+DHA per serving. Take with a meal containing fat. Store in the refrigerator to prevent oxidation.",
        frequency: "daily",
        startDay: 1,
        endDay: 90,
        timeOfDay: "morning",
        dosageAmount: "2",
        dosageUnit: "g",
        route: "oral",
      },
      {
        title: "IM8 Immune Support Drink",
        description:
          "IM8 is a daily immune support supplement drink formulated for comprehensive immune resilience. Mix one serving in 8–12 oz of water. Take in the morning or early afternoon. Supports daily immune defense and overall vitality as part of the core supplement stack.",
        frequency: "daily",
        startDay: 1,
        endDay: 90,
        timeOfDay: "morning",
        dosageAmount: "1",
        dosageUnit: "serving",
        route: "oral",
      },
    ],
    tags: ["supplements", "creatine", "vitamin D", "magnesium", "zinc", "omega-3", "IM8", "daily stack"],
    summary: "90-day core supplement routine — creatine, D3/K2, mag glycinate, zinc, omega-3s, and IM8 daily",
  },

  // ─── COLD & HEAT STRESS PROTOCOL ─────────────
  {
    key: "cold-heat-stress",
    name: "Cold & Heat Stress Protocol",
    description:
      "Deliberate cold exposure and sauna-based heat stress protocol following the Søberg Principle — end on cold. Cold exposure drives a 200–300% sustained increase in dopamine and norepinephrine, activates brown adipose tissue, and improves insulin sensitivity. Sauna heat stress increases growth hormone up to 16x (when fasted), improves cardiovascular compliance, and activates heat shock proteins for cellular repair. Combined, this protocol is one of the highest-ROI interventions for metabolic health, mood, resilience, and longevity.",
    category: "lifestyle",
    durationDays: 60,
    milestones: [
      { day: 7, label: "Week 1 — Establish baseline tolerance, log durations and subjective mood" },
      { day: 14, label: "Week 2 — Begin extending cold exposure toward 2 min" },
      { day: 30, label: "4-week check — evaluate mood, energy, cold tolerance, resting HR changes" },
      { day: 60, label: "8-week completion — assess HRV trends, body composition, subjective well-being" },
    ],
    labCheckpoints: [
      { day: 1, label: "Baseline: fasting glucose, insulin, HbA1c, hs-CRP, lipid panel, thyroid (TSH, fT3, fT4), cortisol AM" },
      { day: 60, label: "Follow-up: fasting glucose, insulin, hs-CRP, lipid panel, thyroid panel, cortisol AM" },
    ],
    steps: [
      {
        title: "Cold Plunge — Deliberate Cold Exposure",
        description:
          "Immerse in cold water (38–55°F / 3–13°C) for 1–3 minutes. Begin at the warmer end and progress to colder temps as tolerance builds. Focus on slow nasal breathing — do not hyperventilate. Shiver is the goal: it drives the metabolic cascade. Do NOT warm up with a hot shower after — let the body reheat naturally (Søberg Principle). If no plunge is available, use a 2–3 min cold shower finishing cold.",
        frequency: "custom",
        customDays: ["mon", "wed", "fri", "sat"],
        startDay: 1,
        endDay: 60,
        timeOfDay: "morning",
        dosageAmount: "1-3",
        dosageUnit: "min",
        route: null,
      },
      {
        title: "Sauna Session — Dry or Infrared Heat Stress",
        description:
          "Sit in a sauna at 176–212°F (80–100°C) for 15–20 minutes per session. For maximum growth hormone response, use fasted (before eating). Do 1–2 rounds separated by a 5-min cool-down. Stay hydrated with electrolytes. On days you do both sauna and cold, do sauna first, then cold — always end on cold.",
        frequency: "custom",
        customDays: ["mon", "wed", "fri"],
        startDay: 1,
        endDay: 60,
        timeOfDay: "morning",
        dosageAmount: "15-20",
        dosageUnit: "min",
        route: null,
      },
      {
        title: "Post-Exposure — Natural Rewarming",
        description:
          "After cold exposure, resist the urge to jump in a hot shower or put on heavy layers. Allow your body to shiver and reheat itself for 10–15 minutes. This is where the metabolic benefit happens — shivering activates succinate release from muscle, converting white fat to metabolically active brown/beige fat. Light movement (walking) is fine.",
        frequency: "custom",
        customDays: ["mon", "wed", "fri", "sat"],
        startDay: 1,
        endDay: 60,
        timeOfDay: "morning",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "Log Session — Duration, Temp & Mood",
        description:
          "After each session, briefly log: water temperature (or sauna temp), total time in cold, total time in heat, subjective mood rating 1–10, and any notes (sleep quality, energy, focus). Tracking drives compliance and reveals patterns. Use a notes app or journal.",
        frequency: "custom",
        customDays: ["mon", "wed", "fri", "sat"],
        startDay: 1,
        endDay: 60,
        timeOfDay: "morning",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
      {
        title: "Electrolyte Replenishment",
        description:
          "Drink an electrolyte mix (sodium, potassium, magnesium) before or after sauna sessions to offset mineral loss from sweating. LMNT, Drip Drop, or a simple mix of 1/4 tsp salt + squeeze of lemon in 16 oz water. Critical for preventing lightheadedness and supporting cardiovascular function during heat stress.",
        frequency: "custom",
        customDays: ["mon", "wed", "fri"],
        startDay: 1,
        endDay: 60,
        timeOfDay: "morning",
        dosageAmount: "1",
        dosageUnit: "serving",
        route: "oral",
      },
      {
        title: "HRV Check-In",
        description:
          "Take a morning HRV reading before getting out of bed (use WHOOP, Oura, or HRV4Training). Cold and heat stress should improve parasympathetic tone over weeks. If HRV drops significantly for 2+ days, scale back intensity or take a rest day. HRV trending up = adaptation is working.",
        frequency: "daily",
        startDay: 1,
        endDay: 60,
        timeOfDay: "morning",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      },
    ],
    tags: ["cold exposure", "sauna", "heat stress", "dopamine", "brown fat", "HRV", "longevity", "recovery", "growth hormone"],
    summary: "8-week cold plunge + sauna protocol — Søberg method, 4x/week cold, 3x/week heat, end on cold",
  },
];
