/**
 * Seed script — Creates test data for end-to-end provider/patient portal testing.
 * Run: node seed-test-data.mjs
 *
 * Creates:
 * - Test patient "Alex Test" (linked to the owner's auth user)
 * - A protocol with steps assigned to the patient
 * - Upcoming and past appointments
 * - Bidirectional messages
 * - Client notes
 * - Client tasks
 * - Notifications
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set. Run from the project directory.");
  process.exit(1);
}

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);
  console.log("Connected to database.");

  try {
    // 1. Get the owner user (the provider)
    const [users] = await connection.execute("SELECT * FROM users ORDER BY id ASC LIMIT 2");
    if (users.length === 0) {
      console.error("No users found. Log in as provider first.");
      process.exit(1);
    }
    const providerUser = users[0];
    console.log(`Provider user: ${providerUser.name} (id: ${providerUser.id})`);

    // 2. Check if test patient already exists
    const [existingPatients] = await connection.execute(
      "SELECT * FROM patients WHERE email = ?",
      ["testpatient@blacklabelmedicine.com"]
    );

    let patientId;
    if (existingPatients.length > 0) {
      patientId = existingPatients[0].id;
      console.log(`Test patient already exists (id: ${patientId}). Updating...`);
      await connection.execute(
        `UPDATE patients SET status = 'active', firstName = 'Alex', lastName = 'Test',
         phone = '555-0199', subscriptionTier = 'premium',
         healthGoals = ?, conditions = ?,
         updatedAt = NOW()
         WHERE id = ?`,
        [
          JSON.stringify(["Optimize gut health", "Improve sleep quality", "Increase energy levels"]),
          JSON.stringify(["IBS", "Chronic fatigue", "Mild anxiety"]),
          patientId,
        ]
      );
    } else {
      // Create test patient
      const [result] = await connection.execute(
        `INSERT INTO patients (firstName, lastName, email, phone, dateOfBirth,
         status, subscriptionTier, healthGoals, conditions, notes, providerId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          "Alex",
          "Test",
          "testpatient@blacklabelmedicine.com",
          "555-0199",
          "1990-06-15",
          "active",
          "premium",
          JSON.stringify(["Optimize gut health", "Improve sleep quality", "Increase energy levels"]),
          JSON.stringify(["IBS", "Chronic fatigue", "Mild anxiety"]),
          "Test patient for end-to-end portal testing.",
          providerUser.id,
        ]
      );
      patientId = result.insertId;
      console.log(`Created test patient (id: ${patientId})`);
    }

    // 3. Create a protocol with steps
    const [existingProtocols] = await connection.execute(
      "SELECT * FROM protocols WHERE name = ?",
      ["Gut Restoration — 12 Week"]
    );

    let protocolId;
    if (existingProtocols.length > 0) {
      protocolId = existingProtocols[0].id;
      console.log(`Protocol already exists (id: ${protocolId})`);
    } else {
      const [protocolResult] = await connection.execute(
        `INSERT INTO protocols (name, description, category, durationDays, createdBy, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          "Gut Restoration — 12 Week",
          "A comprehensive protocol to restore gut microbiome balance, reduce inflammation, and improve digestive function through targeted supplementation, dietary modifications, and lifestyle changes.",
          "nutrition",
          84,
          providerUser.id,
        ]
      );
      protocolId = protocolResult.insertId;
      console.log(`Created protocol (id: ${protocolId})`);

      // Add steps
      const steps = [
        { title: "Eliminate inflammatory foods", description: "Remove gluten, dairy, refined sugar, and processed foods for the first 4 weeks.", frequency: "daily", sortOrder: 1 },
        { title: "Take L-Glutamine", description: "5g L-Glutamine powder in water, morning and evening to support gut lining repair.", frequency: "daily", sortOrder: 2 },
        { title: "Probiotic supplementation", description: "Multi-strain probiotic (50B CFU) with breakfast. Rotate strains every 4 weeks.", frequency: "daily", sortOrder: 3 },
        { title: "Bone broth protocol", description: "Consume 8-12 oz of organic bone broth daily for collagen and amino acid support.", frequency: "daily", sortOrder: 4 },
        { title: "Digestive enzyme with meals", description: "Take comprehensive digestive enzyme 15 minutes before each main meal.", frequency: "custom", customDays: JSON.stringify(["Monday", "Wednesday", "Friday"]), sortOrder: 5 },
        { title: "Stress management practice", description: "10-minute guided meditation or breathwork session. Critical for gut-brain axis.", frequency: "daily", sortOrder: 6 },
      ];

      for (const step of steps) {
        await connection.execute(
          `INSERT INTO protocol_steps (protocolId, title, description, frequency, customDays, sortOrder, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [protocolId, step.title, step.description, step.frequency, step.customDays || null, step.sortOrder]
        );
      }
      console.log(`Created ${steps.length} protocol steps.`);
    }

    // 4. Assign protocol to patient
    const [existingAssignments] = await connection.execute(
      "SELECT * FROM protocol_assignments WHERE patientId = ? AND protocolId = ?",
      [patientId, protocolId]
    );

    if (existingAssignments.length === 0) {
      await connection.execute(
        `INSERT INTO protocol_assignments (patientId, protocolId, assignedBy, status, startDate, providerNotes, createdAt, updatedAt)
         VALUES (?, ?, ?, 'active', DATE_SUB(NOW(), INTERVAL 3 WEEK), 'Assigned for gut health optimization.', NOW(), NOW())`,
        [patientId, protocolId, providerUser.id]
      );
      console.log("Assigned protocol to patient.");
    } else {
      console.log("Protocol already assigned.");
    }

    // 5. Create appointments
    const [existingApts] = await connection.execute(
      "SELECT COUNT(*) as count FROM appointments WHERE patientId = ?",
      [patientId]
    );

    if (existingApts[0].count === 0) {
      const appointments = [
        { type: "initial", status: "completed", scheduledAt: "DATE_SUB(NOW(), INTERVAL 3 WEEK)", duration: 60, title: "Initial Consultation", notes: "Comprehensive health assessment and protocol introduction." },
        { type: "follow_up", status: "completed", scheduledAt: "DATE_SUB(NOW(), INTERVAL 1 WEEK)", duration: 30, title: "Week 2 Check-in", notes: "Reviewed initial response to protocol. Patient reports improved energy." },
        { type: "lab_work", status: "scheduled", scheduledAt: "DATE_ADD(NOW(), INTERVAL 3 DAY)", duration: 15, title: "Lab Work — Comprehensive Panel", notes: "Fasting required. Comprehensive metabolic panel + gut markers." },
        { type: "follow_up", status: "scheduled", scheduledAt: "DATE_ADD(NOW(), INTERVAL 10 DAY)", duration: 30, title: "Week 6 Review", notes: "Review lab results and adjust protocol as needed." },
      ];

      for (const apt of appointments) {
        await connection.execute(
          `INSERT INTO appointments (patientId, providerId, createdBy, type, status, scheduledAt, durationMinutes, title, assistantNotes, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ${apt.scheduledAt}, ?, ?, ?, NOW(), NOW())`,
          [patientId, providerUser.id, providerUser.id, apt.type, apt.status, apt.duration, apt.title, apt.notes]
        );
      }
      console.log(`Created ${appointments.length} appointments.`);
    } else {
      console.log("Appointments already exist.");
    }

    // 6. Create messages (bidirectional)
    const [existingMsgs] = await connection.execute(
      "SELECT COUNT(*) as count FROM messages WHERE patientId = ?",
      [patientId]
    );

    if (existingMsgs[0].count === 0) {
      const messages = [
        { senderId: providerUser.id, senderType: "provider", content: "Welcome to Black Label Medicine, Alex! I've assigned your Gut Restoration protocol. Please review the steps and let me know if you have any questions.", createdAt: "DATE_SUB(NOW(), INTERVAL 3 WEEK)" },
        { senderId: 0, senderType: "patient", content: "Thank you Dr. Egbert! I've started the elimination diet. Quick question — is almond milk okay during the elimination phase?", createdAt: "DATE_SUB(NOW(), INTERVAL 20 DAY)" },
        { senderId: providerUser.id, senderType: "provider", content: "Great question! Yes, unsweetened almond milk is fine. Just make sure it doesn't contain carrageenan — check the ingredients. Oat milk is also a good option.", createdAt: "DATE_SUB(NOW(), INTERVAL 20 DAY)" },
        { senderId: 0, senderType: "patient", content: "Got it, thanks! I'm already noticing less bloating after just 5 days.", createdAt: "DATE_SUB(NOW(), INTERVAL 18 DAY)" },
        { senderId: providerUser.id, senderType: "provider", content: "That's excellent progress! The reduction in inflammatory foods often shows results within the first week. Keep it up and we'll review everything at your Week 2 check-in.", createdAt: "DATE_SUB(NOW(), INTERVAL 18 DAY)" },
        { senderId: 0, senderType: "patient", content: "Just had my Week 2 check-in. Feeling much better overall. The L-Glutamine seems to be helping a lot.", createdAt: "DATE_SUB(NOW(), INTERVAL 1 WEEK)" },
        { senderId: providerUser.id, senderType: "provider", content: "Wonderful to hear! Your lab work is coming up in a few days. Remember to fast for 12 hours before. I'll send a reminder the day before.", createdAt: "DATE_SUB(NOW(), INTERVAL 5 DAY)" },
      ];

      for (const msg of messages) {
        await connection.execute(
          `INSERT INTO messages (patientId, senderId, content, receiverId, createdAt)
           VALUES (?, ?, ?, ?, ${msg.createdAt})`,
          [patientId, msg.senderId, msg.content, msg.senderId === providerUser.id ? 0 : providerUser.id]
        );
      }
      console.log(`Created ${messages.length} messages.`);
    } else {
      console.log("Messages already exist.");
    }

    // 7. Create client notes
    const [existingNotes] = await connection.execute(
      "SELECT COUNT(*) as count FROM client_notes WHERE patientId = ?",
      [patientId]
    );

    if (existingNotes[0].count === 0) {
      const notes = [
        { category: "clinical", content: "Initial assessment: Patient presents with chronic digestive issues (IBS-D), fatigue, and mild anxiety. History of antibiotic use in past year. Gut microbiome testing ordered.", createdAt: "DATE_SUB(NOW(), INTERVAL 3 WEEK)" },
        { category: "follow_up", content: "Week 2 check-in: Patient reports 60% reduction in bloating, improved energy in mornings. Sleep still disrupted. Consider adding magnesium glycinate.", createdAt: "DATE_SUB(NOW(), INTERVAL 1 WEEK)" },
        { category: "lab_review", content: "Pending: Comprehensive metabolic panel + GI-MAP stool test scheduled for next week. Will review results at Week 6 appointment.", createdAt: "DATE_SUB(NOW(), INTERVAL 3 DAY)" },
      ];

      for (const note of notes) {
        await connection.execute(
          `INSERT INTO client_notes (patientId, authorId, category, content, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ${note.createdAt}, NOW())`,
          [patientId, providerUser.id, note.category, note.content]
        );
      }
      console.log(`Created ${notes.length} client notes.`);
    } else {
      console.log("Notes already exist.");
    }

    // 8. Create client tasks
    const [existingTasks] = await connection.execute(
      "SELECT COUNT(*) as count FROM client_tasks WHERE patientId = ?",
      [patientId]
    );

    if (existingTasks[0].count === 0) {
      const tasks = [
        { title: "Complete food diary for Week 3", description: "Log all meals and snacks for the next 7 days. Note any digestive symptoms within 2 hours of eating.", priority: "high", status: "pending", dueDate: "DATE_ADD(NOW(), INTERVAL 4 DAY)" },
        { title: "Schedule lab work appointment", description: "Fasting blood draw — comprehensive metabolic panel and inflammatory markers.", priority: "urgent", status: "completed", dueDate: "DATE_ADD(NOW(), INTERVAL 3 DAY)" },
        { title: "Start sleep hygiene protocol", description: "No screens 1 hour before bed. Take magnesium glycinate 400mg at 9pm. Room temp 65-68°F.", priority: "medium", status: "pending", dueDate: "DATE_ADD(NOW(), INTERVAL 7 DAY)" },
        { title: "Order recommended supplements", description: "L-Glutamine powder, multi-strain probiotic (50B CFU), digestive enzymes. Links sent via message.", priority: "low", status: "completed", dueDate: "DATE_SUB(NOW(), INTERVAL 2 WEEK)" },
      ];

      for (const task of tasks) {
        await connection.execute(
          `INSERT INTO client_tasks (patientId, assignedBy, title, description, priority, status, dueDate, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ${task.dueDate}, NOW(), NOW())`,
          [patientId, providerUser.id, task.title, task.description, task.priority, task.status]
        );
      }
      console.log(`Created ${tasks.length} client tasks.`);
    } else {
      console.log("Tasks already exist.");
    }

    // 9. Create notifications
    const [existingNotifs] = await connection.execute(
      "SELECT COUNT(*) as count FROM notifications WHERE userId = ?",
      [providerUser.id]
    );

    if (existingNotifs[0].count < 3) {
      const notifications = [
        { type: "message", title: "New message from Alex Test", content: "Just had my Week 2 check-in. Feeling much better overall...", createdAt: "DATE_SUB(NOW(), INTERVAL 1 WEEK)" },
        { type: "appointment_reminder", title: "Upcoming: Lab Work — Alex Test", content: "Lab work appointment scheduled in 3 days. Patient has been reminded to fast.", createdAt: "DATE_SUB(NOW(), INTERVAL 1 DAY)" },
        { type: "compliance_alert", title: "Task overdue: Food diary — Alex Test", content: "Alex Test has not completed the food diary task due 2 days ago.", createdAt: "DATE_SUB(NOW(), INTERVAL 2 DAY)" },
      ];

      for (const notif of notifications) {
        await connection.execute(
          `INSERT INTO notifications (userId, type, title, body, isRead, createdAt)
           VALUES (?, ?, ?, ?, 0, ${notif.createdAt})`,
          [providerUser.id, notif.type, notif.title, notif.content]
        );
      }
      console.log(`Created ${notifications.length} notifications.`);
    } else {
      console.log("Notifications already exist.");
    }

    // 10. Update patient attention score
    await connection.execute(
      `UPDATE patients SET lastProviderInteraction = DATE_SUB(NOW(), INTERVAL 5 DAY) WHERE id = ?`,
      [patientId]
    );
    console.log("Updated attention score.");

    console.log("\n✅ Test data seeded successfully!");
    console.log(`\nTest patient: Alex Test (id: ${patientId})`);
    console.log("Email: testpatient@blacklabelmedicine.com");
    console.log("Protocol: Gut Restoration — 12 Week (assigned, 3 weeks in)");
    console.log("Appointments: 2 completed, 2 upcoming");
    console.log("Messages: 7 bidirectional conversation");
    console.log("Notes: 3 clinical notes");
    console.log("Tasks: 4 (2 pending, 2 completed)");
    console.log("Notifications: 3 for provider");
    console.log("\nTo test the patient portal, you need to link Alex Test to an auth user.");
    console.log("Log in as a patient, then the system will auto-link by email.");

  } finally {
    await connection.end();
  }
}

main().catch(console.error);
