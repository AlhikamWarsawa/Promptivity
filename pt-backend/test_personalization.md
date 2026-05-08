# Personalization Comparison Test Guide

This document outlines how to verify that the personalization engine in Promptivity is working correctly.

## Test Case 1: Structured vs Flexible
**Scenario**: User has a large list of messy tasks.

### Step A: Structured Persona
1. Set Persona:
   - Name: "Alice"
   - Role: "Manager"
   - Style: **Structured**
   - Energy: Morning
2. Submit Story: "I have 5 meetings today, need to write a report, and fix the leaking sink."
3. **EXPECTED RESULT**:
   - High scores for: GTD, Eisenhower, SMART Goals.
   - Task wording: Precise, actionable (e.g., "Draft Q3 Financial Report").
   - Recommendation reason: Mentions structure, clarity, or organization.

### Step B: Flexible Persona
1. Set Persona:
   - Name: "Bob"
   - Role: "Creative"
   - Style: **Flexible**
   - Energy: Night
2. Submit Story: "I have 5 meetings today, need to write a report, and fix the leaking sink." (SAME STORY)
3. **EXPECTED RESULT**:
   - High scores for: Kanban, Eat the Frog, Pomodoro.
   - Task wording: Action-oriented but less formal.
   - Recommendation reason: Mentions flow, energy management, or visual tracking.

---

## Test Case 2: Morning vs Night Energy
**Scenario**: Verify Time Blocking hours.

### Step A: Morning Persona
1. Set Energy: **Morning**.
2. Generate Mission.
3. Open **Time Blocking** view.
4. **EXPECTED RESULT**:
   - Timeline starts at **07:00**.
   - Badge: "Optimized for morning energy".

### Step B: Night Persona
1. Set Energy: **Night**.
2. Generate Mission.
3. Open **Time Blocking** view.
4. **EXPECTED RESULT**:
   - Timeline starts at **13:00**.
   - Productive blocks shifted to late afternoon/evening.
   - Badge: "Optimized for night energy".

---

## Test Case 3: Journal Persistence
1. Generate a mission today.
2. Go to `/journal`.
3. Verify today's date has a "🎯 Mission" badge.
4. Click the date and verify story and tasks match the session.
5. Refresh the page and ensure data persists.
