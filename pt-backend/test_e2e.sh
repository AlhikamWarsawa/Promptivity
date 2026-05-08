#!/bin/bash
# ============================================
# Promptivity — End-to-End Test Script
# Day 13: Test 3 user stories
# Run: chmod +x test_e2e.sh && ./test_e2e.sh
# ============================================

BASE_URL="http://localhost:8000"
PASS=0
FAIL=0

echo "🧠 Promptivity E2E Test — Day 13"
echo "=================================="

# Helper: check if JSON key exists and is non-empty
check_field() {
  local response="$1"
  local field="$2"
  local value
  value=$(echo "$response" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    parts = '$field'.split('.')
    val = data
    for p in parts:
        if isinstance(val, list): val = val[0] if val else None
        else: val = val.get(p) if isinstance(val, dict) else None
    if val is None or val == [] or val == '':
        print('EMPTY')
    else:
        print('OK')
except Exception as e:
    print(f'ERROR: {e}')
" 2>&1)

  if [ "$value" = "OK" ]; then
    echo "  ✅ $field"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $field — $value"
    FAIL=$((FAIL + 1))
  fi
}

run_test() {
  local name="$1"
  local story_file="$2"
  local persona="$3"

  echo ""
  echo "📖 Test: $name"
  echo "---"

  STORY=$(cat "$story_file")
  PAYLOAD=$(python3 -c "
import json, sys
story = open('$story_file').read()
data = {'story': story}
if '$persona':
    data['personalization'] = json.loads('$persona')
print(json.dumps(data))
")

  RESPONSE=$(curl -s -X POST "$BASE_URL/api/process-story" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")

  # Check top-level success
  SUCCESS=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if d.get('success') else 'FAIL: ' + str(d.get('error','')))" 2>&1)

  if [ "$SUCCESS" != "OK" ]; then
    echo "  ❌ API call failed: $SUCCESS"
    FAIL=$((FAIL + 1))
    return
  fi
  echo "  ✅ API call successful"
  PASS=$((PASS + 1))

  # Check required fields
  check_field "$RESPONSE" "data.topRecommendation"
  check_field "$RESPONSE" "data.topRecommendationReason"
  check_field "$RESPONSE" "data.masterTaskList"
  check_field "$RESPONSE" "data.todayPlan"
  check_field "$RESPONSE" "data.frameworks"

  # Check all 13 frameworks exist
  FRAMEWORK_COUNT=$(echo "$RESPONSE" | python3 -c "
import sys, json
d = json.load(sys.stdin)
frameworks = d.get('data', {}).get('frameworks', [])
print(len(frameworks))
" 2>&1)

  if [ "$FRAMEWORK_COUNT" = "13" ]; then
    echo "  ✅ All 13 frameworks present"
    PASS=$((PASS + 1))
  else
    echo "  ❌ Only $FRAMEWORK_COUNT/13 frameworks present"
    FAIL=$((FAIL + 1))
  fi

  # Check specific framework fields
  check_field "$RESPONSE" "data.frameworks.0.frameworkId"
  check_field "$RESPONSE" "data.frameworks.0.recommendationScore"
  check_field "$RESPONSE" "data.frameworks.0.todayActions"

  # Save response for manual inspection
  echo "$RESPONSE" | python3 -m json.tool > "test_output_${name// /_}.json" 2>/dev/null
  echo "  📄 Full output saved to test_output_${name// /_}.json"
}

# ---- Run tests ----

run_test "Mahasiswa" "test_stories/mahasiswa.txt" ""

run_test "Freelancer" "test_stories/freelancer.txt" '{
  "name": "Andi",
  "role": "freelancer",
  "bigGoal": "Scale freelance ke income 2x dalam 6 bulan",
  "energyPattern": "morning",
  "preferredStyle": "flexible"
}'

run_test "Karyawan" "test_stories/karyawan.txt" '{
  "name": "Sari",
  "role": "profesional",
  "bigGoal": "Menjadi director-level PM dalam 2 tahun",
  "energyPattern": "variable",
  "preferredStyle": "structured"
}'

# ---- Summary ----

echo ""
echo "=================================="
echo "📊 Results: $PASS passed, $FAIL failed"
echo ""

if [ "$FAIL" -eq 0 ]; then
  echo "🎉 All tests passed! Schema finalized."
else
  echo "⚠️  $FAIL tests failed. Check output files and fix parsers."
fi
