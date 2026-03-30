// Patient Portal Mock Data — Black Label Medicine, Concierge Optimization
// Patient: Sarah Mitchell | Provider: Dr. Jacob Egbert

export const patient = {
  id: "c1",
  name: "Sarah Mitchell",
  firstName: "Sarah",
  email: "sarah.m@email.com",
  phone: "(555) 234-5678",
  avatar: "SM",
  age: 34,
  gender: "Female",
  memberSince: "September 2025",
  nextAppointment: {
    date: "Wednesday, February 12",
    time: "10:00 AM",
    type: "Follow-up",
    provider: "Dr. Jacob Egbert",
    duration: "30 min",
    notes: "Review latest labs. Discuss protocol progression.",
  },
  provider: {
    name: "Dr. Jacob Egbert",
    title: "Concierge Optimization Specialist",
    avatar: "JE",
    clinic: "Black Label Medicine",
  },
  conditions: ["Chronic Fatigue", "Joint Inflammation"],
  goals: ["Reduce inflammation markers by 50%", "Improve energy levels", "Establish sustainable nutrition habits"],
};

export interface PatientProtocol {
  id: string;
  name: string;
  description: string;
  category: "nutrition" | "exercise" | "lifestyle" | "supplement";
  startDate: string;
  duration: string;
  progress: number; // 0-100
  currentWeek: number;
  totalWeeks: number;
  status: "active" | "completed" | "upcoming";
  steps: {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    dueDate: string;
  }[];
  dailyTasks: {
    id: string;
    title: string;
    time: string;
    completed: boolean;
    icon: string;
  }[];
}

export const patientProtocols: PatientProtocol[] = [
  {
    id: "pp1",
    name: "Anti-Inflammatory Diet",
    description: "A comprehensive dietary protocol focused on reducing systemic inflammation through whole foods, omega-3 rich sources, and elimination of common triggers.",
    category: "nutrition",
    startDate: "Nov 15, 2025",
    duration: "12 weeks",
    progress: 75,
    currentWeek: 9,
    totalWeeks: 12,
    status: "active",
    steps: [
      { id: "s1", title: "Elimination Phase", description: "Remove processed foods, refined sugars, gluten, and dairy for 4 weeks.", completed: true, dueDate: "Dec 13, 2025" },
      { id: "s2", title: "Omega-3 Integration", description: "Introduce wild-caught fish 3x/week, daily flaxseed, and walnuts.", completed: true, dueDate: "Dec 27, 2025" },
      { id: "s3", title: "Anti-Inflammatory Spices", description: "Add turmeric with black pepper and ginger to daily meals.", completed: true, dueDate: "Jan 10, 2026" },
      { id: "s4", title: "Food Diary & Tracking", description: "Log all meals and note energy levels, joint pain, and digestion.", completed: false, dueDate: "Jan 24, 2026" },
      { id: "s5", title: "Reintroduction Phase", description: "Systematically reintroduce eliminated foods one at a time, monitoring reactions.", completed: false, dueDate: "Feb 7, 2026" },
    ],
    dailyTasks: [
      { id: "dt1", title: "Morning anti-inflammatory smoothie", time: "7:00 AM", completed: true, icon: "🥤" },
      { id: "dt2", title: "Take omega-3 supplement", time: "8:00 AM", completed: true, icon: "💊" },
      { id: "dt3", title: "Log breakfast in food diary", time: "8:30 AM", completed: true, icon: "📝" },
      { id: "dt4", title: "Turmeric golden milk", time: "3:00 PM", completed: false, icon: "🍵" },
      { id: "dt5", title: "Prepare anti-inflammatory dinner", time: "6:00 PM", completed: false, icon: "🥗" },
      { id: "dt6", title: "Evening food diary entry", time: "8:00 PM", completed: false, icon: "📝" },
    ],
  },
  {
    id: "pp2",
    name: "Daily Movement Protocol",
    description: "Progressive movement protocol starting with gentle walks and building to 30 minutes of moderate activity daily. Designed to reduce joint stiffness and boost energy.",
    category: "exercise",
    startDate: "Dec 1, 2025",
    duration: "8 weeks",
    progress: 88,
    currentWeek: 7,
    totalWeeks: 8,
    status: "active",
    steps: [
      { id: "s6", title: "Gentle Walking (Week 1-2)", description: "10-minute daily walks at a comfortable pace.", completed: true, dueDate: "Dec 14, 2025" },
      { id: "s7", title: "Walking + Stretching (Week 3-4)", description: "15-minute walks followed by 5-minute stretching routine.", completed: true, dueDate: "Dec 28, 2025" },
      { id: "s8", title: "Moderate Activity (Week 5-6)", description: "20 minutes of varied moderate activity — walking, yoga, or swimming.", completed: true, dueDate: "Jan 11, 2026" },
      { id: "s9", title: "Full Movement (Week 7-8)", description: "30 minutes of varied exercise daily. Mix cardio and flexibility work.", completed: false, dueDate: "Jan 25, 2026" },
    ],
    dailyTasks: [
      { id: "dt7", title: "Morning stretch routine (10 min)", time: "6:30 AM", completed: true, icon: "🧘" },
      { id: "dt8", title: "30-min walk or activity", time: "12:00 PM", completed: false, icon: "🚶" },
      { id: "dt9", title: "Log activity & energy level", time: "1:00 PM", completed: false, icon: "📊" },
      { id: "dt10", title: "Evening gentle yoga", time: "7:00 PM", completed: false, icon: "🧘" },
    ],
  },
  {
    id: "pp3",
    name: "Sleep Optimization",
    description: "Evidence-based sleep hygiene protocol to improve sleep quality, duration, and consistency. Targeting 7-8 hours of restorative sleep.",
    category: "lifestyle",
    startDate: "Feb 15, 2026",
    duration: "6 weeks",
    progress: 0,
    currentWeek: 0,
    totalWeeks: 6,
    status: "upcoming",
    steps: [
      { id: "s10", title: "Sleep Environment Audit", description: "Assess bedroom for temperature, light, noise, and comfort.", completed: false, dueDate: "Feb 21, 2026" },
      { id: "s11", title: "Consistent Sleep Schedule", description: "Set fixed bedtime and wake time, even on weekends.", completed: false, dueDate: "Mar 1, 2026" },
      { id: "s12", title: "Evening Wind-Down Routine", description: "Create a 30-minute pre-bed routine without screens.", completed: false, dueDate: "Mar 15, 2026" },
      { id: "s13", title: "Blue Light Management", description: "No screens after 9 PM. Use blue-light blocking glasses if needed.", completed: false, dueDate: "Mar 22, 2026" },
      { id: "s14", title: "Sleep Tracking & Review", description: "Track sleep quality and review patterns with Dr. Egbert.", completed: false, dueDate: "Mar 29, 2026" },
    ],
    dailyTasks: [],
  },
];

export interface PatientMessage {
  id: string;
  sender: "patient" | "provider";
  senderName: string;
  senderAvatar: string;
  text: string;
  time: string;
  date: string;
  read: boolean;
}

export const patientMessages: PatientMessage[] = [
  {
    id: "pm1",
    sender: "provider",
    senderName: "Dr. Jacob Egbert",
    senderAvatar: "JE",
    text: "Hi Sarah! Welcome to Black Label Medicine. I've reviewed your intake form and health history. I'm excited to start working with you on reducing your inflammation and improving your energy levels.",
    time: "2:00 PM",
    date: "Sep 15, 2025",
    read: true,
  },
  {
    id: "pm2",
    sender: "patient",
    senderName: "Sarah Mitchell",
    senderAvatar: "SM",
    text: "Thank you, Dr. Egbert! I'm really looking forward to getting started. The chronic fatigue has been affecting my work and I'm ready to make changes.",
    time: "3:15 PM",
    date: "Sep 15, 2025",
    read: true,
  },
  {
    id: "pm3",
    sender: "provider",
    senderName: "Dr. Jacob Egbert",
    senderAvatar: "JE",
    text: "Completely understandable. Based on your labs, I can see elevated CRP and some markers suggesting systemic inflammation. I'm putting together an anti-inflammatory protocol that I think will make a significant difference. I'll have it ready for you by our next appointment.",
    time: "4:00 PM",
    date: "Sep 15, 2025",
    read: true,
  },
  {
    id: "pm4",
    sender: "patient",
    senderName: "Sarah Mitchell",
    senderAvatar: "SM",
    text: "That sounds great. Quick question — should I stop taking any of my current supplements before we start?",
    time: "4:30 PM",
    date: "Sep 15, 2025",
    read: true,
  },
  {
    id: "pm5",
    sender: "provider",
    senderName: "Dr. Jacob Egbert",
    senderAvatar: "JE",
    text: "Good question! Keep taking your vitamin D and magnesium for now. Hold off on the multivitamin until we review it together — some formulations contain fillers that can contribute to inflammation. We'll build a targeted supplement stack as part of your protocol.",
    time: "5:00 PM",
    date: "Sep 15, 2025",
    read: true,
  },
  {
    id: "pm6",
    sender: "provider",
    senderName: "Dr. Jacob Egbert",
    senderAvatar: "JE",
    text: "Sarah, your Anti-Inflammatory Diet protocol is now live in your portal. Take a look when you get a chance and let me know if you have any questions about the elimination phase. Remember — the first two weeks are the hardest, but you'll start feeling the difference soon.",
    time: "10:00 AM",
    date: "Nov 15, 2025",
    read: true,
  },
  {
    id: "pm7",
    sender: "patient",
    senderName: "Sarah Mitchell",
    senderAvatar: "SM",
    text: "Just looked through it — very thorough! I do have one concern: I travel for work occasionally. Any tips for staying on protocol while eating out?",
    time: "11:30 AM",
    date: "Nov 15, 2025",
    read: true,
  },
  {
    id: "pm8",
    sender: "provider",
    senderName: "Dr. Jacob Egbert",
    senderAvatar: "JE",
    text: "Great question. When eating out: 1) Stick to grilled proteins and vegetables, 2) Ask for olive oil instead of other dressings, 3) Skip the bread basket, 4) Bring your own turmeric capsules as a backup. I'll add a 'Travel Tips' section to your protocol.",
    time: "12:00 PM",
    date: "Nov 15, 2025",
    read: true,
  },
  {
    id: "pm9",
    sender: "patient",
    senderName: "Sarah Mitchell",
    senderAvatar: "SM",
    text: "Week 3 update: I'm actually starting to notice a difference! My joints feel less stiff in the mornings and I have more energy by mid-afternoon. The elimination phase was tough but I'm glad I stuck with it.",
    time: "9:00 AM",
    date: "Dec 6, 2025",
    read: true,
  },
  {
    id: "pm10",
    sender: "provider",
    senderName: "Dr. Jacob Egbert",
    senderAvatar: "JE",
    text: "That's fantastic progress, Sarah! The reduced morning stiffness is a really positive sign that the inflammation is coming down. Keep up the great work. I'm also adding the Daily Movement protocol to your plan — gentle walks to start. It'll complement the diet changes beautifully.",
    time: "10:30 AM",
    date: "Dec 6, 2025",
    read: true,
  },
  {
    id: "pm11",
    sender: "patient",
    senderName: "Sarah Mitchell",
    senderAvatar: "SM",
    text: "Sounds good! I've actually been wanting to be more active but was worried about the joint pain. Starting gentle makes sense.",
    time: "11:00 AM",
    date: "Dec 6, 2025",
    read: true,
  },
  {
    id: "pm12",
    sender: "provider",
    senderName: "Dr. Jacob Egbert",
    senderAvatar: "JE",
    text: "Sarah, your latest labs look fantastic! Your CRP is down 30% and your inflammation markers are trending in the right direction across the board. This is exactly what we hoped to see at this stage.",
    time: "11:00 AM",
    date: "Feb 8, 2026",
    read: true,
  },
  {
    id: "pm13",
    sender: "patient",
    senderName: "Sarah Mitchell",
    senderAvatar: "SM",
    text: "That's amazing news! I've been really consistent with the protocol. The food diary has been so helpful for staying accountable.",
    time: "11:30 AM",
    date: "Feb 8, 2026",
    read: true,
  },
  {
    id: "pm14",
    sender: "provider",
    senderName: "Dr. Jacob Egbert",
    senderAvatar: "JE",
    text: "It shows! Your consistency is the reason we're seeing these results. Let's discuss next steps at our Wednesday appointment — I want to talk about the reintroduction phase and potentially starting the Sleep Optimization protocol.",
    time: "12:00 PM",
    date: "Feb 8, 2026",
    read: true,
  },
  {
    id: "pm15",
    sender: "patient",
    senderName: "Sarah Mitchell",
    senderAvatar: "SM",
    text: "See you Wednesday! I'll bring my food diary. Also, I've been sleeping better already just from the movement protocol — curious to see what the sleep protocol adds.",
    time: "9:00 AM",
    date: "Feb 9, 2026",
    read: true,
  },
  {
    id: "pm16",
    sender: "provider",
    senderName: "Dr. Jacob Egbert",
    senderAvatar: "JE",
    text: "That's a great sign! Movement and sleep are deeply connected. The sleep protocol will build on that foundation with some targeted optimizations. See you Wednesday, Sarah!",
    time: "9:30 AM",
    date: "Feb 9, 2026",
    read: true,
  },
];

export const patientStats = {
  adherence: 92,
  daysOnProtocol: 87,
  completedTasks: 342,
  upcomingTasks: 6,
  labsImproved: 3,
  nextLabDate: "March 1, 2026",
};

export const patientAppointments = [
  {
    id: "pa1",
    date: "Wednesday, February 12",
    time: "10:00 AM",
    type: "Follow-up",
    provider: "Dr. Jacob Egbert",
    duration: "30 min",
    notes: "Review latest labs. Discuss protocol progression and reintroduction phase.",
    status: "upcoming" as const,
  },
  {
    id: "pa2",
    date: "Saturday, March 1",
    time: "9:00 AM",
    type: "Lab Work",
    provider: "Black Label Medicine Lab",
    duration: "15 min",
    notes: "Quarterly inflammation panel. Fasting required.",
    status: "upcoming" as const,
  },
  {
    id: "pa3",
    date: "Wednesday, March 5",
    time: "10:00 AM",
    type: "Follow-up",
    provider: "Dr. Jacob Egbert",
    duration: "30 min",
    notes: "Review March labs. Begin Sleep Optimization protocol.",
    status: "upcoming" as const,
  },
  {
    id: "pa4",
    date: "Monday, January 27",
    time: "10:00 AM",
    type: "Check-in",
    provider: "Dr. Jacob Egbert",
    duration: "20 min",
    notes: "Mid-protocol check-in. Reviewed food diary and movement progress.",
    status: "completed" as const,
  },
  {
    id: "pa5",
    date: "Monday, January 6",
    time: "10:00 AM",
    type: "Follow-up",
    provider: "Dr. Jacob Egbert",
    duration: "30 min",
    notes: "Discussed omega-3 integration results. Added spice protocol.",
    status: "completed" as const,
  },
];
