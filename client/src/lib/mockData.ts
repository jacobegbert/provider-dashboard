// Mock data for the Provider Dashboard demo
// Design: "Warm Command Center" — Scandinavian Functionalism

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  age: number;
  gender: string;
  status: "active" | "attention" | "inactive" | "new";
  joinDate: string;
  lastActivity: string;
  protocols: string[];
  adherence: number; // 0-100
  unreadMessages: number;
  nextAppointment: string | null;
  notes: string;
  conditions: string[];
}

export interface Protocol {
  id: string;
  name: string;
  description: string;
  category: "nutrition" | "exercise" | "medication" | "therapy" | "lifestyle";
  duration: string;
  steps: string[];
  assignedClients: number;
}

export interface Message {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  messages: {
    id: string;
    sender: "provider" | "client";
    text: string;
    time: string;
  }[];
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar: string;
  type: "check-in" | "follow-up" | "initial" | "urgent";
  date: string;
  time: string;
  duration: string;
  notes: string;
}

const avatarColors = [
  "bg-gold/15 text-gold",
  "bg-red-500/10 text-red-400",
  "bg-amber-100 text-amber-700",
  "bg-blue-100 text-blue-700",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
];

export const clients: Client[] = [
  {
    id: "c1",
    name: "Sarah Mitchell",
    email: "sarah.m@email.com",
    phone: "(555) 234-5678",
    avatar: "SM",
    age: 34,
    gender: "Female",
    status: "active",
    joinDate: "2025-09-15",
    lastActivity: "2 hours ago",
    protocols: ["Anti-Inflammatory Diet", "Daily Movement"],
    adherence: 92,
    unreadMessages: 0,
    nextAppointment: "Feb 12, 2026 at 10:00 AM",
    notes: "Responding well to protocol. Energy levels improving.",
    conditions: ["Chronic Fatigue", "Joint Inflammation"],
  },
  {
    id: "c2",
    name: "James Rodriguez",
    email: "james.r@email.com",
    phone: "(555) 345-6789",
    avatar: "JR",
    age: 45,
    gender: "Male",
    status: "attention",
    joinDate: "2025-07-22",
    lastActivity: "3 days ago",
    protocols: ["Blood Sugar Management", "Stress Reduction"],
    adherence: 58,
    unreadMessages: 2,
    nextAppointment: "Feb 11, 2026 at 2:00 PM",
    notes: "Missed last two check-ins. Follow up needed.",
    conditions: ["Pre-Diabetes", "Hypertension"],
  },
  {
    id: "c3",
    name: "Emily Chen",
    email: "emily.c@email.com",
    phone: "(555) 456-7890",
    avatar: "EC",
    age: 28,
    gender: "Female",
    status: "active",
    joinDate: "2025-11-03",
    lastActivity: "5 hours ago",
    protocols: ["Gut Health Restoration", "Sleep Optimization"],
    adherence: 87,
    unreadMessages: 1,
    nextAppointment: "Feb 14, 2026 at 11:30 AM",
    notes: "Digestive symptoms improving. Sleep quality up 40%.",
    conditions: ["IBS", "Insomnia"],
  },
  {
    id: "c4",
    name: "Marcus Thompson",
    email: "marcus.t@email.com",
    phone: "(555) 567-8901",
    avatar: "MT",
    age: 52,
    gender: "Male",
    status: "active",
    joinDate: "2025-06-10",
    lastActivity: "1 day ago",
    protocols: ["Cardiac Wellness", "Mediterranean Diet"],
    adherence: 95,
    unreadMessages: 0,
    nextAppointment: "Feb 18, 2026 at 9:00 AM",
    notes: "Excellent progress. Cholesterol down 15%. Continue current plan.",
    conditions: ["High Cholesterol", "Family History CVD"],
  },
  {
    id: "c5",
    name: "Aisha Patel",
    email: "aisha.p@email.com",
    phone: "(555) 678-9012",
    avatar: "AP",
    age: 39,
    gender: "Female",
    status: "new",
    joinDate: "2026-02-01",
    lastActivity: "Just now",
    protocols: [],
    adherence: 0,
    unreadMessages: 1,
    nextAppointment: "Feb 10, 2026 at 3:00 PM",
    notes: "New patient. Initial consultation scheduled.",
    conditions: ["Anxiety", "Hormonal Imbalance"],
  },
  {
    id: "c6",
    name: "David Kim",
    email: "david.k@email.com",
    phone: "(555) 789-0123",
    avatar: "DK",
    age: 61,
    gender: "Male",
    status: "active",
    joinDate: "2025-04-18",
    lastActivity: "6 hours ago",
    protocols: ["Joint Mobility", "Anti-Inflammatory Diet", "Supplement Protocol"],
    adherence: 78,
    unreadMessages: 0,
    nextAppointment: "Feb 20, 2026 at 1:00 PM",
    notes: "Mobility improving. Reduced pain medication by 50%.",
    conditions: ["Osteoarthritis", "Chronic Pain"],
  },
  {
    id: "c7",
    name: "Lisa Nakamura",
    email: "lisa.n@email.com",
    phone: "(555) 890-1234",
    avatar: "LN",
    age: 31,
    gender: "Female",
    status: "attention",
    joinDate: "2025-10-05",
    lastActivity: "5 days ago",
    protocols: ["Thyroid Support", "Stress Reduction"],
    adherence: 45,
    unreadMessages: 3,
    nextAppointment: null,
    notes: "Has not scheduled follow-up. Multiple missed messages.",
    conditions: ["Hypothyroidism", "Adrenal Fatigue"],
  },
  {
    id: "c8",
    name: "Robert Williams",
    email: "robert.w@email.com",
    phone: "(555) 901-2345",
    avatar: "RW",
    age: 48,
    gender: "Male",
    status: "inactive",
    joinDate: "2025-03-12",
    lastActivity: "2 weeks ago",
    protocols: ["Weight Management"],
    adherence: 22,
    unreadMessages: 0,
    nextAppointment: null,
    notes: "Paused program. Requested break due to personal reasons.",
    conditions: ["Obesity", "Sleep Apnea"],
  },
  {
    id: "c9",
    name: "Maria Gonzalez",
    email: "maria.g@email.com",
    phone: "(555) 012-3456",
    avatar: "MG",
    age: 42,
    gender: "Female",
    status: "active",
    joinDate: "2025-08-20",
    lastActivity: "4 hours ago",
    protocols: ["Hormone Balance", "Nutrition Reset"],
    adherence: 88,
    unreadMessages: 0,
    nextAppointment: "Feb 15, 2026 at 10:30 AM",
    notes: "Great progress on hormone panel. Energy and mood improved.",
    conditions: ["Perimenopause", "Fatigue"],
  },
  {
    id: "c10",
    name: "Thomas Wright",
    email: "thomas.w@email.com",
    phone: "(555) 123-4567",
    avatar: "TW",
    age: 55,
    gender: "Male",
    status: "active",
    joinDate: "2025-05-30",
    lastActivity: "1 hour ago",
    protocols: ["Cardiac Wellness", "Stress Reduction", "Daily Movement"],
    adherence: 91,
    unreadMessages: 0,
    nextAppointment: "Feb 17, 2026 at 4:00 PM",
    notes: "Blood pressure normalized. Continuing maintenance phase.",
    conditions: ["Hypertension", "Stress"],
  },
];

export const protocols: Protocol[] = [
  {
    id: "p1",
    name: "Anti-Inflammatory Diet",
    description: "A comprehensive dietary protocol focused on reducing systemic inflammation through whole foods, omega-3 rich sources, and elimination of common triggers.",
    category: "nutrition",
    duration: "12 weeks",
    steps: ["Eliminate processed foods", "Increase omega-3 intake", "Add turmeric & ginger daily", "Track food diary", "Weekly check-in"],
    assignedClients: 3,
  },
  {
    id: "p2",
    name: "Daily Movement",
    description: "Progressive movement protocol starting with gentle walks and building to 30 minutes of moderate activity daily.",
    category: "exercise",
    duration: "8 weeks",
    steps: ["10-min daily walks (Week 1-2)", "15-min walks + stretching (Week 3-4)", "20-min moderate activity (Week 5-6)", "30-min varied exercise (Week 7-8)"],
    assignedClients: 2,
  },
  {
    id: "p3",
    name: "Blood Sugar Management",
    description: "Dietary and lifestyle interventions to stabilize blood glucose levels and improve insulin sensitivity.",
    category: "nutrition",
    duration: "16 weeks",
    steps: ["Blood glucose monitoring 3x daily", "Low glycemic meal plan", "Post-meal walks", "Supplement protocol", "Bi-weekly labs"],
    assignedClients: 1,
  },
  {
    id: "p4",
    name: "Stress Reduction",
    description: "Mind-body protocol combining breathwork, meditation, and lifestyle modifications to lower cortisol and improve resilience.",
    category: "lifestyle",
    duration: "10 weeks",
    steps: ["Daily 10-min breathwork", "Progressive muscle relaxation", "Digital sunset routine", "Journaling practice", "Weekly coaching call"],
    assignedClients: 3,
  },
  {
    id: "p5",
    name: "Gut Health Restoration",
    description: "Phased approach to healing gut lining, rebalancing microbiome, and reintroducing foods systematically.",
    category: "nutrition",
    duration: "12 weeks",
    steps: ["Elimination phase (4 weeks)", "Gut healing supplements", "Probiotic introduction", "Systematic reintroduction", "Maintenance plan"],
    assignedClients: 1,
  },
  {
    id: "p6",
    name: "Sleep Optimization",
    description: "Evidence-based sleep hygiene protocol to improve sleep quality, duration, and consistency.",
    category: "lifestyle",
    duration: "6 weeks",
    steps: ["Sleep environment audit", "Consistent sleep schedule", "Evening wind-down routine", "Blue light management", "Sleep tracking & review"],
    assignedClients: 1,
  },
  {
    id: "p7",
    name: "Cardiac Wellness",
    description: "Comprehensive cardiovascular health protocol combining diet, exercise, stress management, and monitoring.",
    category: "lifestyle",
    duration: "20 weeks",
    steps: ["Baseline cardiac panel", "Heart-healthy meal plan", "Graduated cardio program", "Stress management", "Monthly progress labs"],
    assignedClients: 2,
  },
];

export const conversations: Message[] = [
  {
    id: "m1",
    clientId: "c2",
    clientName: "James Rodriguez",
    clientAvatar: "JR",
    lastMessage: "I've been having trouble sticking to the meal plan this week...",
    lastMessageTime: "10:30 AM",
    unread: 2,
    messages: [
      { id: "msg1", sender: "client", text: "Hi Dr. Chen, I wanted to check in about my blood sugar readings.", time: "Yesterday 2:15 PM" },
      { id: "msg2", sender: "provider", text: "Hi James! I'd love to see your readings. How have things been going with the meal plan?", time: "Yesterday 2:45 PM" },
      { id: "msg3", sender: "client", text: "The readings have been a bit higher than usual. I think it's because of the holidays.", time: "Yesterday 3:00 PM" },
      { id: "msg4", sender: "provider", text: "That's understandable. Let's review your food diary together at our next appointment. In the meantime, try to focus on the low-glycemic options we discussed.", time: "Yesterday 3:30 PM" },
      { id: "msg5", sender: "client", text: "I've been having trouble sticking to the meal plan this week...", time: "Today 10:30 AM" },
    ],
  },
  {
    id: "m2",
    clientId: "c3",
    clientName: "Emily Chen",
    clientAvatar: "EC",
    lastMessage: "My sleep has been so much better! Thank you for the magnesium recommendation.",
    lastMessageTime: "9:15 AM",
    unread: 1,
    messages: [
      { id: "msg6", sender: "client", text: "Quick question — is it okay to take the probiotic with breakfast or should it be on an empty stomach?", time: "Yesterday 8:00 AM" },
      { id: "msg7", sender: "provider", text: "Great question! Take it 30 minutes before breakfast on an empty stomach for best absorption.", time: "Yesterday 9:00 AM" },
      { id: "msg8", sender: "client", text: "Got it, thanks! Also, my sleep has been so much better! Thank you for the magnesium recommendation.", time: "Today 9:15 AM" },
    ],
  },
  {
    id: "m3",
    clientId: "c5",
    clientName: "Aisha Patel",
    clientAvatar: "AP",
    lastMessage: "Looking forward to our first appointment today!",
    lastMessageTime: "8:45 AM",
    unread: 1,
    messages: [
      { id: "msg9", sender: "client", text: "Hi! I just signed up and I'm excited to get started. I've filled out the intake form.", time: "Yesterday 4:00 PM" },
      { id: "msg10", sender: "provider", text: "Welcome, Aisha! I've received your intake form and I'm reviewing it now. Looking forward to meeting you tomorrow!", time: "Yesterday 5:00 PM" },
      { id: "msg11", sender: "client", text: "Looking forward to our first appointment today!", time: "Today 8:45 AM" },
    ],
  },
  {
    id: "m4",
    clientId: "c7",
    clientName: "Lisa Nakamura",
    clientAvatar: "LN",
    lastMessage: "Sorry for the late reply. Things have been hectic at work.",
    lastMessageTime: "Feb 5",
    unread: 3,
    messages: [
      { id: "msg12", sender: "provider", text: "Hi Lisa, I noticed you missed your last appointment. Is everything okay?", time: "Feb 2 10:00 AM" },
      { id: "msg13", sender: "provider", text: "Just checking in — I want to make sure you're doing well. Let me know if you'd like to reschedule.", time: "Feb 4 9:00 AM" },
      { id: "msg14", sender: "client", text: "Sorry for the late reply. Things have been hectic at work.", time: "Feb 5 3:00 PM" },
    ],
  },
  {
    id: "m5",
    clientId: "c1",
    clientName: "Sarah Mitchell",
    clientAvatar: "SM",
    lastMessage: "See you Wednesday! I'll bring my food diary.",
    lastMessageTime: "Yesterday",
    unread: 0,
    messages: [
      { id: "msg15", sender: "provider", text: "Sarah, your latest labs look fantastic! Your inflammation markers are down 30%.", time: "Feb 8 11:00 AM" },
      { id: "msg16", sender: "client", text: "That's amazing news! I've been really consistent with the protocol.", time: "Feb 8 11:30 AM" },
      { id: "msg17", sender: "provider", text: "It shows! Let's discuss next steps at our Wednesday appointment.", time: "Feb 8 12:00 PM" },
      { id: "msg18", sender: "client", text: "See you Wednesday! I'll bring my food diary.", time: "Feb 9 9:00 AM" },
    ],
  },
  {
    id: "m6",
    clientId: "c4",
    clientName: "Marcus Thompson",
    clientAvatar: "MT",
    lastMessage: "My cholesterol numbers are the best they've been in 10 years!",
    lastMessageTime: "Feb 8",
    unread: 0,
    messages: [
      { id: "msg19", sender: "client", text: "Just got my lab results back. My cholesterol numbers are the best they've been in 10 years!", time: "Feb 8 2:00 PM" },
      { id: "msg20", sender: "provider", text: "Marcus, that is incredible! Your dedication to the Mediterranean diet and exercise plan is really paying off. Let's keep this momentum going.", time: "Feb 8 3:00 PM" },
    ],
  },
];

export const appointments: Appointment[] = [
  {
    id: "a1",
    clientId: "c5",
    clientName: "Aisha Patel",
    clientAvatar: "AP",
    type: "initial",
    date: "Today",
    time: "3:00 PM",
    duration: "60 min",
    notes: "Initial consultation. Review intake form and health history.",
  },
  {
    id: "a2",
    clientId: "c2",
    clientName: "James Rodriguez",
    clientAvatar: "JR",
    type: "urgent",
    date: "Tomorrow",
    time: "2:00 PM",
    duration: "30 min",
    notes: "Urgent follow-up. Discuss adherence issues and adjust protocol.",
  },
  {
    id: "a3",
    clientId: "c1",
    clientName: "Sarah Mitchell",
    clientAvatar: "SM",
    type: "follow-up",
    date: "Feb 12",
    time: "10:00 AM",
    duration: "30 min",
    notes: "Review latest labs. Discuss protocol progression.",
  },
  {
    id: "a4",
    clientId: "c3",
    clientName: "Emily Chen",
    clientAvatar: "EC",
    type: "check-in",
    date: "Feb 14",
    time: "11:30 AM",
    duration: "20 min",
    notes: "Quick check-in on gut health protocol progress.",
  },
  {
    id: "a5",
    clientId: "c9",
    clientName: "Maria Gonzalez",
    clientAvatar: "MG",
    type: "follow-up",
    date: "Feb 15",
    time: "10:30 AM",
    duration: "30 min",
    notes: "Review hormone panel results. Adjust supplement protocol.",
  },
  {
    id: "a6",
    clientId: "c10",
    clientName: "Thomas Wright",
    clientAvatar: "TW",
    type: "check-in",
    date: "Feb 17",
    time: "4:00 PM",
    duration: "20 min",
    notes: "Blood pressure monitoring check-in.",
  },
  {
    id: "a7",
    clientId: "c4",
    clientName: "Marcus Thompson",
    clientAvatar: "MT",
    type: "follow-up",
    date: "Feb 18",
    time: "9:00 AM",
    duration: "30 min",
    notes: "Quarterly review. Discuss long-term maintenance plan.",
  },
];

export const avatarColorMap: Record<string, string> = {
  SM: avatarColors[0],
  JR: avatarColors[1],
  EC: avatarColors[2],
  MT: avatarColors[3],
  AP: avatarColors[4],
  DK: avatarColors[5],
  LN: avatarColors[6],
  RW: avatarColors[7],
  MG: avatarColors[0],
  TW: avatarColors[1],
};

export const stats = {
  totalClients: clients.length,
  activeClients: clients.filter(c => c.status === "active").length,
  needsAttention: clients.filter(c => c.status === "attention").length,
  newClients: clients.filter(c => c.status === "new").length,
  totalUnread: conversations.reduce((sum, c) => sum + c.unread, 0),
  upcomingAppointments: appointments.length,
  avgAdherence: Math.round(
    clients.filter(c => c.adherence > 0).reduce((sum, c) => sum + c.adherence, 0) /
    clients.filter(c => c.adherence > 0).length
  ),
  activeProtocols: protocols.length,
};
