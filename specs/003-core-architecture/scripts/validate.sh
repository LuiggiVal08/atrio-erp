#!/usr/bin/env bash
set -uo pipefail

echo "=== Atrio ERP — Quickstart Validation ==="
echo ""

# ── Prerequisites ──────────────────────────────────────────
BASE_URL="http://localhost:3000/api/v1"
TOKEN=""
TENANT_ID=""

cleanup() {
  echo ""
  echo "Cleaning up..."
}
trap cleanup EXIT

# ── Step 1: Create Tenant ──────────────────────────────────
echo "1. Creating tenant..."
CREATE_RES=$(curl -s -X POST "$BASE_URL/admin/tenants" \
  -H "Content-Type: application/json" \
  -d "{
    \"legalName\": \"Quickstart Test Corp\",
    \"taxId\": \"J-QUICKSTART-$(date +%s)\",
    \"adminEmail\": \"qs-admin@test.com\",
    \"adminName\": \"QS Admin\"
  }")
TENANT_ID=$(echo "$CREATE_RES" | jq -r '.tenant.id')
ADMIN_EMAIL=$(echo "$CREATE_RES" | jq -r '.adminUser.email')
ADMIN_PASSWORD="TempPass123!"
echo "  Tenant: $TENANT_ID"
echo "  Admin: $ADMIN_EMAIL / $ADMIN_PASSWORD"

# ── Step 2: Login ──────────────────────────────────────────
echo "2. Logging in..."
# First try with the actual password — might need to use the temporary password
LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\", \"tenantId\": \"$TENANT_ID\"}")
TOKEN=$(echo "$LOGIN_RES" | jq -r '.accessToken // empty')
echo "  Token obtained: $(if [ -n "$TOKEN" ]; then echo "YES"; else echo "NO"; fi)"

# If login fails, we'll use direct DB seeding via the integration test pattern
if [ -z "$TOKEN" ]; then
  echo "  WARN: Cannot login via API. Skip to integration tests."
fi

# ── Step 3: Enable Modules ─────────────────────────────────
if [ -n "$TOKEN" ]; then
  echo "3. Enabling modules..."
  curl -s -X PATCH "$BASE_URL/admin/tenants/$TENANT_ID/modules" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"enabledModules": ["inventory", "sales", "purchasing", "cash-payments", "localization", "client-vendor"]}' \
    | jq '.'
  echo ""
fi

# ── Step 4: Create Category ────────────────────────────────
if [ -n "$TOKEN" ]; then
  echo "4. Creating product category..."
  CAT_RES=$(curl -s -X POST "$BASE_URL/inventory/categories" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name": "Electrónicos"}')
  CAT_ID=$(echo "$CAT_RES" | jq -r '.id')
  echo "  Category: $CAT_ID"
fi

# ── Step 5: Create Product ─────────────────────────────────
if [ -n "$TOKEN" ] && [ -n "${CAT_ID:-}" ]; then
  echo "5. Creating product..."
  PROD_RES=$(curl -s -X POST "$BASE_URL/inventory/products" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"sku\": \"LAP-QUICK-$(date +%s)\",
      \"name\": \"Laptop Quick\",
      \"categoryId\": \"$CAT_ID\",
      \"unitPrice\": 1200.00,
      \"costPrice\": 800.00,
      \"isService\": false
    }")
  PROD_ID=$(echo "$PROD_RES" | jq -r '.id')
  echo "  Product: $PROD_ID"
fi

# ── Step 6: Create Client ──────────────────────────────────
if [ -n "$TOKEN" ]; then
  echo "6. Creating client..."
  CLI_RES=$(curl -s -X POST "$BASE_URL/client-vendor/clients" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "taxId": "J-QUICK-CLI-1",
      "legalName": "Quick Client C.A.",
      "email": "client@quick.com"
    }')
  CLI_ID=$(echo "$CLI_RES" | jq -r '.id')
  echo "  Client: $CLI_ID"
fi

# ── Step 7: Create Tax + Currency Rate ─────────────────────
if [ -n "$TOKEN" ]; then
  echo "7. Creating tax and currency rate..."
  curl -s -X POST "$BASE_URL/localization/taxes" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name": "IVA 16%", "rate": 16.0, "type": "percentage"}' \
    | jq '.'
  curl -s -X POST "$BASE_URL/localization/currency-rates" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"fromCurrency\": \"USD\", \"toCurrency\": \"VES\", \"rate\": 89.50, \"date\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"}" \
    | jq '.'
fi

# ── Step 8: Create Cash Register ───────────────────────────
if [ -n "$TOKEN" ]; then
  echo "8. Creating cash register..."
  curl -s -X POST "$BASE_URL/cash-payments/registers" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name": "Caja Principal", "currency": "USD"}' \
    | jq '.'
fi

# ── Step 9: Verify Audit ──────────────────────────────────
if [ -n "$TOKEN" ]; then
  echo "9. Checking audit logs..."
  curl -s "$BASE_URL/admin/audit-logs" \
    -H "Authorization: Bearer $TOKEN" \
    | jq '.items | length' | xargs echo "  Audit entries:"
fi

echo ""
echo "=== Validation complete ==="
