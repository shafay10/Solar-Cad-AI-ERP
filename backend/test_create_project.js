const API_BASE = "http://localhost:5000/api";

async function testCreateProject() {
  console.log("=== TESTING CREATE PROJECT API ===");

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

  // 2. Create New Project Payload (Same as what the user was entering in the screenshot!)
  const payload = {
    clientName: "Malik Usman Solar Project",
    clientCnic: "37405-1234567-1",
    siteAddress: "Plot 45, Sector B, DHA Phase 2, Islamabad",
    subDivision: "IESCO",
    latitude: 33.5204,
    longitude: 73.1587,
    systemCapacityKw: 10,
    contractPricePkr: 1250000,
    estimatedCostPkr: 980000,
    netProfitPkr: 270000,
    dealCloseDate: new Date().toISOString(),
    targetDeliveryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    projectDetails: "L3 structure with civil work",
    status: "ONBOARDED"
  };

  console.log("Submitting new project payload...");
  const createRes = await fetch(`${API_BASE}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  console.log("Create response status:", createRes.status);
  const responseText = await createRes.text();
  console.log("Create response body:", responseText);

  if (!createRes.ok) {
    console.error("❌ Create project failed!");
    process.exit(1);
  }

  const newProject = JSON.parse(responseText);
  console.log(`✅ Project created successfully! Code: ${newProject.projectCode}, ID: ${newProject.id}, Name: ${newProject.clientName}`);

  console.log("\n=================================================");
  console.log("PROJECT ONBOARDING VERIFIED 100% OPERATIONAL!");
  console.log("=================================================");
}

testCreateProject().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
