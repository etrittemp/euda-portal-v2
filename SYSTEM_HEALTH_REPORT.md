# EUDA Portal - System Health Check Report

**Date:** 2025-10-27
**Performed by:** Claude Code
**Status:** ⚠️ CRITICAL ISSUES FOUND

---

## Executive Summary

**CRITICAL DATA ARCHITECTURE MISMATCH DETECTED**

The system has TWO conflicting data storage patterns:
1. **JSONB Storage** (new): `questionnaires.sections` column
2. **Relational Storage** (old): `questionnaire_sections` and `questions` tables

**Current State:**
- ✅ Autosave works and is SAFE (no deletions)
- ❌ **CRITICAL:** Autosaved data is NOT accessible to editors or respondents
- ❌ **CRITICAL:** Only manually saved questionnaires work properly
- ✅ Response submission works correctly
- ✅ Authentication and authorization work

---

## Detailed Analysis

### 1. AUTOSAVE ENDPOINT (`PATCH /api/questionnaires/:id/autosave`)

**Location:** `/backend/routes/questionnaires.js:472-531`

**What it does:**
```javascript
updates.sections = sections; // Stores as JSONB in questionnaires.sections
await supabase.from('questionnaires').update(updates)
```

**✅ SAFE:**
- NO DELETE operations
- Validates data before saving
- Only updates the main `questionnaires` table
- Cannot cause data loss

**❌ PROBLEM:**
- Data saved to `questionnaires.sections` (JSONB column)
- NOT synced to `questionnaire_sections` or `questions` tables

---

### 2. LOAD QUESTIONNAIRE FOR EDITING (`GET /api/questionnaires/:id`)

**Location:** `/backend/routes/questionnaires.js:41-94`

**What it does:**
```javascript
// Reads from SEPARATE TABLES (not JSONB!)
const sections = await supabase.from('questionnaire_sections').select('*')
const questions = await supabase.from('questions').select('*')
```

**❌ CRITICAL ISSUE:**
- Reads from `questionnaire_sections` and `questions` tables
- Autosaved data in `questionnaires.sections` (JSONB) is IGNORED
- **Result:** When you reopen a questionnaire after autosaving, you see EMPTY or OLD data

---

### 3. PUBLIC ACCESS FOR RESPONDENTS (`GET /api/questionnaires/public/:id`)

**Location:** `/backend/routes/questionnaires.js:155-209`

**What it does:**
```javascript
const sections = await supabase.from('questionnaire_sections').select('*')
const questions = await supabase.from('questions').select('*')
```

**❌ CRITICAL ISSUE:**
- Also reads from separate tables
- Autosaved questionnaires are INVISIBLE to respondents
- **Result:** Respondents see empty questionnaires or errors

---

### 4. MANUAL SAVE BUTTON (`PUT /api/questionnaires/:id`)

**Location:** `/backend/routes/questionnaires.js:308-467`

**What it does:**
```javascript
// 1. Updates main table
await supabase.from('questionnaires').update(updates)

// 2. DELETES all sections and questions
await supabase.from('questions').delete().eq('questionnaire_id', id)
await supabase.from('questionnaire_sections').delete().eq('questionnaire_id', id)

// 3. Re-creates sections and questions in separate tables
await supabase.from('questionnaire_sections').insert(sectionsData)
await supabase.from('questions').insert(questionsData)
```

**✅ THIS WORKS** - Syncs data to separate tables
**⚠️ DANGEROUS** - Deletes then recreates (risk of data loss if insert fails)

---

### 5. RESPONSE SUBMISSION (`POST /api/responses/submit`)

**Location:** `/backend/routes/responses.js:8-55`

**What it does:**
```javascript
await supabase.from('questionnaire_responses').insert({
  country,
  contact_name,
  contact_email,
  responses: responses, // JSONB field
  questionnaire_id
})
```

**✅ WORKS CORRECTLY:**
- No authentication required (public)
- Saves to `questionnaire_responses` table
- Responses stored as JSONB
- Includes all required fields

---

## Database Schema (Confirmed)

### Tables:
1. ✅ `questionnaires` - Main table (has `sections` JSONB column)
2. ✅ `questionnaire_sections` - Separate sections table
3. ✅ `questions` - Separate questions table
4. ✅ `questionnaire_responses` - Response storage

### Current Data:
- 📊 0 questionnaires in database
- 📊 0 responses in database
- ⚠️ All data was lost in previous autosave incident

---

## Critical Problems

### ❌ Problem 1: Autosave Data Is Invisible

**Scenario:**
1. You create a questionnaire
2. You edit it (autosave triggers every 2 seconds)
3. You navigate away
4. You come back to edit
5. **YOUR CHANGES ARE GONE** - loads from empty separate tables

**Why:**
- Autosave writes to `questionnaires.sections` (JSONB)
- Load reads from `questionnaire_sections` table (empty)

---

### ❌ Problem 2: Respondents See Empty Questionnaires

**Scenario:**
1. You create and autosave a questionnaire
2. You activate it
3. You share the link
4. Respondent opens it
5. **THEY SEE NOTHING** - no sections or questions

**Why:**
- Public endpoint reads from separate tables
- Autosaved data is in JSONB column

---

### ❌ Problem 3: Manual Save is Still Dangerous

**Scenario:**
1. You click "Save" button
2. Backend DELETES all sections/questions
3. Backend tries to INSERT new data
4. **IF INSERT FAILS** → All data is lost

**Why:**
- DELETE happens BEFORE INSERT
- No transaction/rollback protection

---

## What Works

### ✅ Autosave Safety
- No longer causes data deletion
- Validates before saving
- Uses PATCH endpoint correctly

### ✅ Response Submission
- Public endpoint works
- No authentication needed
- Saves responses correctly

### ✅ Authentication
- Admin login works
- Token-based auth works
- Permission checks work

### ✅ Password Protection
- Questionnaire password field exists
- Verification endpoints work

---

## Required Fixes (DO NOT IMPLEMENT YET - REPORTING ONLY)

### Fix Option 1: Use JSONB Everywhere (Recommended)

**Change ALL read endpoints to use JSONB:**

```javascript
// GET /:id - for editing
const { data } = await supabase.from('questionnaires').select('*')
// sections are already in data.sections (JSONB)

// GET /public/:id - for respondents
const { data } = await supabase.from('questionnaires').select('*')
.eq('status', 'active')
// sections are in data.sections
```

**Advantages:**
- Simple, clean architecture
- No data syncing issues
- Autosave just works
- No DELETE operations needed

**Disadvantages:**
- Cannot query individual questions
- Need to drop separate tables (data loss)

---

### Fix Option 2: Sync JSONB to Separate Tables on Autosave

**Make autosave sync to both places:**

```javascript
// In autosave endpoint
await supabase.from('questionnaires').update({ sections })
await syncToSeparateTables(id, sections) // Also update separate tables
```

**Advantages:**
- Backwards compatible
- Can query individual sections/questions

**Disadvantages:**
- Complex sync logic
- Potential race conditions
- Still uses separate tables

---

### Fix Option 3: Only Manual Save Syncs (Current Broken State)

**Keep current architecture but fix the flow:**

1. Autosave → JSONB only
2. Manual save → Syncs to separate tables
3. Load/Public → Check JSONB first, fallback to tables

**Advantages:**
- Minimal code changes

**Disadvantages:**
- Respondents can't see autosaved work
- Requires manual save before sharing

---

## Recommendations

### IMMEDIATE ACTION REQUIRED:

**Option A: Use JSONB Everywhere (Cleanest Solution)**
1. Update GET /:id to read from JSONB
2. Update GET /public/:id to read from JSONB
3. Remove separate tables dependency
4. Test thoroughly

**Option B: Disable Autosave Until Fixed**
1. Comment out autosave useEffect
2. Force manual saves only
3. Ensure manual save works
4. Implement proper fix later

---

## Test Plan (Before Making Changes)

### Test 1: Create and Autosave
1. Create questionnaire
2. Add sections/questions
3. Wait 2 seconds (autosave)
4. Navigate away
5. Come back
6. **EXPECTED:** Changes are visible
7. **CURRENT:** Changes are LOST

### Test 2: Activation and Sharing
1. Create questionnaire
2. Autosave
3. Activate
4. Share link to respondent
5. **EXPECTED:** Respondent sees questionnaire
6. **CURRENT:** Respondent sees EMPTY

### Test 3: Response Submission
1. Respondent fills questionnaire
2. Submits
3. **EXPECTED:** Response saved
4. **CURRENT:** Should work (if questionnaire visible)

---

## Conclusion

**The system is UNSAFE for production use** until the data architecture mismatch is resolved.

**Your options:**
1. **I recommend FIX OPTION 1** - Use JSONB everywhere (cleanest)
2. Or temporarily disable autosave until fixed
3. Or accept that only manually saved questionnaires work

**What would you like me to do?**
