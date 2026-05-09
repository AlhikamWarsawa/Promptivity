# Promptivity Integration Testing — Milestone M3

This document outlines the final end-to-end integration test scenarios to validate the stability of Promptivity Milestone M3.

## Test Objective
Ensure the full user journey from landing to dashboard persistence works flawlessly across devices without state loss or race conditions.

---

## Scenario 1: The Overwhelmed Student (Pelajar Deadline Ujian)

**Context:**
- 3 upcoming exams in 2 weeks.
- Stack of assignments (Math, History, Essay).
- Messy sleep schedule.
- High anxiety.

**Journey:**
1. **Landing:** Navigate to Home, click "Start Without Account".
2. **Onboarding:** Select "Story Mode".
3. **Brain Dump:** Enter the context above (~50 words).
4. **Processing:** Wait for Moti to analyze.
5. **Dashboard Check:** 
   - Recommended: Time Blocking or Eisenhower.
   - Task List: Should contain "Schedule study blocks", "Draft essay", "Review Math notes".
6. **Interaction:** Mark "Schedule study blocks" as complete.
7. **Refresh:** Ensure "Schedule study blocks" stays completed.

---

## Scenario 2: The Chaos Freelancer (Banyak Klien)

**Context:**
- 5 active clients.
- Parallel deadlines this Friday.
- Communication chaos (Email, WhatsApp, Slack).
- Needs structure.

**Journey:**
1. **Auth:** Register a new account.
2. **Onboarding:** Select "Confused Mode" (Chat).
3. **Conversation:** Chat with Moti about the 5 clients and deadlines.
4. **Processing:** Finalize session.
5. **Dashboard Check:**
   - Recommended: Kanban or GTD.
   - Medals: Check 🥇 Gold, 🥈 Silver badges on the grid.
6. **Task Operations:** 
   - Add a manual task "Reply to Client A email" with 15 min duration.
   - Edit a task to change duration to 1 hour.
7. **Check:** Verify duration labels "15 min" and "1 hour" appear on Task Cards.

---

## Scenario 3: The Productivity Geek (Structured Employee)

**Context:**
- Corporate role.
- High structure preference.
- Wants OKRs and Weekly Review.
- Already has a list of tasks.

**Journey:**
1. **Auth:** Login with existing credentials.
2. **Onboarding:** Skip if session exists, or start fresh.
3. **Brain Dump:** Enter structured work goals.
4. **Framework Audit:**
   - Navigate to "OKRs" framework page.
   - Update Key Result progress slider.
   - Refresh page.
5. **Check:** Ensure slider progress is persisted.

---

## Scenario 4: The Mobile "Quick Capture" (User On-the-Go)

**Context:**
- Using mobile browser (375px width).
- Needs to add a task quickly.

**Journey:**
1. **Dashboard:** Open on mobile.
2. **Interaction:** 
   - Click "+ Add Task" button.
   - Use the Duration selector.
   - Save task.
3. **Visibility:** Ensure task appears clearly in the single-column list.
4. **Responsiveness:** Check if the Framework Grid stacks vertically (single column).

---

## Scenario 5: Error & AI Safety

**Context:**
- Malformed AI output (simulated by slow network or partial response).

**Journey:**
1. **Processing:** Start a new story.
2. **Stress:** Refresh page during processing.
3. **Check:** Ensure app recovers to "Home" or "Processing" state without blank screen.
4. **Data Safety:** Manually navigate to a framework route (e.g., `/frameworks/pomodoro`) when no session exists.
5. **Check:** Ensure "Empty State" (desert icon) appears instead of a crash.

---

## Sign-off Checklist
- [ ] No `undefined` crashes on Framework Pages.
- [ ] LocalStorage quota management (`clearOldSessions`) is active.
- [ ] Duration estimation persists and displays properly.
- [ ] Medals (🥇, 🥈, 🥉) appear in the framework grid.
- [ ] Responsive layout passes on 375px, 768px, and 1280px.
