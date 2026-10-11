// Uses Node built-in fetch
const API_BASE = "http://localhost:5000/api";

async function runTests() {
  console.log("=== VERIFYING PROPOSAL SEAL & PHYSICAL INSTALLATION ===");

  // 1. Log in as Super Admin
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@greentech.pk", password: "Password123!" })
  });
  if (!loginRes.ok) {
    console.error("Login failed:", await loginRes.text());
    process.exit(1);
  }
  const { token, user } = await loginRes.json();
  console.log(`✅ Logged in as ${user.fullName} (${user.role})`);

  // 2. Fetch Projects
  const projRes = await fetch(`${API_BASE}/projects`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const projects = await projRes.json();
  if (projects.length === 0) {
    console.error("No projects found!");
    process.exit(1);
  }
  const testProject = projects[0];
  console.log(`✅ Using Project: ${testProject.projectCode} - ${testProject.clientName} (ID: ${testProject.id})`);

  // 3. Test Seal with "Password123!"
  console.log("\n[Test 1] Testing Proposal Seal with 'Password123!'...");
  const seal1 = await fetch(`${API_BASE}/projects/${testProject.id}/approve`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ password: "Password123!" })
  });
  const seal1Data = await seal1.json();
  console.log("Status:", seal1.status);
  console.log("Seal Response:", seal1Data.message, "Signature:", seal1Data.digitalSignature);
  if (!seal1.ok || !seal1Data.success) {
    console.error("❌ Seal 1 failed:", seal1Data);
    process.exit(1);
  }
  console.log("✅ Proposal sealed successfully!");

  // 4. Test Unlock
  console.log("\n[Test 2] Testing Proposal Unlock...");
  const unlock = await fetch(`${API_BASE}/projects/${testProject.id}/unlock`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ password: "Password123!" })
  });
  const unlockData = await unlock.json();
  console.log("Unlock Response:", unlockData.message);
  if (!unlock.ok || !unlockData.success) {
    console.error("❌ Unlock failed:", unlockData);
    process.exit(1);
  }
  console.log("✅ Proposal unlocked successfully!");

  // 5. Test Seal with Admin Passkey "7860"
  console.log("\n[Test 3] Testing Proposal Seal with Admin Passkey '7860'...");
  const seal2 = await fetch(`${API_BASE}/projects/${testProject.id}/approve`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ password: "7860" })
  });
  const seal2Data = await seal2.json();
  console.log("Status:", seal2.status, "Message:", seal2Data.message);
  if (!seal2.ok || !seal2Data.success) {
    console.error("❌ Seal 2 failed:", seal2Data);
    process.exit(1);
  }
  console.log("✅ Proposal sealed with Admin passkey!");

  // 6. Test Physical Installation Complete
  console.log("\n[Test 4] Testing Seal Physical Installation Complete...");
  const completeRes = await fetch(`${API_BASE}/projects/${testProject.id}/complete-installation`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const completeData = await completeRes.json();
  console.log("Status:", completeRes.status);
  console.log("Completion Message:", completeData.message);
  console.log("Site Completed At:", completeData.project?.siteCompletedAt);
  console.log("Completion Year:", completeData.project?.completionYear);
  console.log("Project Status:", completeData.project?.status);

  if (!completeRes.ok || !completeData.success || !completeData.project?.siteCompletedAt) {
    console.error("❌ Complete installation failed:", completeData);
    process.exit(1);
  }
  console.log("✅ Physical installation marked complete with year & audit timestamp!");

  console.log("\n=======================================================");
  console.log("ALL PROPOSAL SEAL & INSTALLATION TESTS PASSED 100%!");
  console.log("=======================================================");
}

runTests().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
