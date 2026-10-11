import assert from "node:assert";
import { safeIsoString, safeFormatDate, safeFormatDateTime } from "./frontend/src/utils/dateUtils.js";

async function verifyDates() {
  console.log("=== STEP 1: Testing dateUtils edge cases ===");
  assert.strictEqual(safeIsoString(null), "");
  assert.strictEqual(safeIsoString(undefined), "");
  assert.strictEqual(safeIsoString({}), "");
  assert.strictEqual(safeIsoString([]), "");
  assert.strictEqual(safeIsoString("invalid_date"), "");
  assert.strictEqual(safeIsoString(""), "");

  const testIso = "2026-09-11T11:17:14.432Z";
  assert.strictEqual(safeIsoString(testIso), testIso);
  assert.strictEqual(safeIsoString(testIso, 16), "2026-09-11T11:17");
  assert.strictEqual(safeIsoString(testIso, 10), "2026-09-11");

  assert.strictEqual(safeFormatDate(null), "Pending");
  assert.strictEqual(safeFormatDate({}), "Pending");
  assert.strictEqual(safeFormatDate("invalid"), "Pending");
  assert.strictEqual(safeFormatDate(testIso), new Date(testIso).toLocaleDateString("en-PK"));

  console.log("✓ dateUtils edge cases passed 100%!");

  console.log("\n=== STEP 2: Testing live Backend API projects date types ===");
  const loginRes = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@greentech.pk", password: "Password123!" })
  });
  const loginData = await loginRes.json();
  assert(loginData.token, "Login failed, no token");
  const token = loginData.token;

  const projRes = await fetch("http://localhost:5000/api/projects", {
    headers: { Authorization: "Bearer " + token }
  });
  const projects = await projRes.json();
  assert(Array.isArray(projects), "Projects must be an array");
  console.log(`Found ${projects.length} projects in system.`);

  for (const p of projects) {
    console.log(`Checking project: ${p.projectCode} (${p.clientName})`);
    assert(typeof p.dealCloseDate === "string", `dealCloseDate must be string, got: ${typeof p.dealCloseDate}`);
    assert(p.dealCloseDate !== "[object Object]", "dealCloseDate cannot be object string");
    
    // Check targetDeliveryDate
    if (p.targetDeliveryDate !== null) {
      assert(typeof p.targetDeliveryDate === "string", `targetDeliveryDate must be string, got: ${typeof p.targetDeliveryDate}`);
    }
    
    // Check createdAt
    assert(typeof p.createdAt === "string", `createdAt must be string, got: ${typeof p.createdAt}`);
    console.log(`  ✓ Project ${p.projectCode} dates verified clean.`);
  }

  console.log("\n=== STEP 3: Testing Edit Project (PUT /api/projects/:id) ===");
  const targetProject = projects[0];
  const updatePayload = {
    clientName: targetProject.clientName,
    siteAddress: targetProject.siteAddress,
    systemCapacityKw: targetProject.systemCapacityKw,
    contractPricePkr: targetProject.contractPricePkr,
    estimatedCostPkr: targetProject.estimatedCostPkr,
    netProfitPkr: targetProject.netProfitPkr,
    dealCloseDate: safeIsoString(targetProject.dealCloseDate),
    targetDeliveryDate: safeIsoString(targetProject.targetDeliveryDate) || null,
    projectDetails: "Updated via automated test suite",
    status: targetProject.status
  };

  const putRes = await fetch(`http://localhost:5000/api/projects/${targetProject.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify(updatePayload)
  });

  assert.strictEqual(putRes.status, 200, "Project update should succeed with 200");
  const updatedProject = await putRes.json();
  console.log("✓ Project successfully updated! Response ID:", updatedProject.id);
  assert.strictEqual(updatedProject.projectDetails, "Updated via automated test suite");
  assert(typeof updatedProject.dealCloseDate === "string", "dealCloseDate must remain string");
  console.log("✓ Updated project dates verified valid string ISO format.");

  console.log("\n=== ALL VERIFICATIONS PASSED SUCCESSFULLY! ===");
}

verifyDates().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
