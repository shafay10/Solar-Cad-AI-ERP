const API = "http://localhost:5000/api";

async function run() {
  console.log("=== Testing Super-Admin Proposal Password & Delegation Flow ===");

  // 1. Super-Admin Login
  const loginRes = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@greentech.pk", password: "Password123!" })
  });
  const adminAuth = await loginRes.json();
  if (!loginRes.ok) throw new Error("Admin login failed: " + JSON.stringify(adminAuth));
  const adminToken = adminAuth.token;
  console.log("1. Super-Admin logged in successfully. User canLockProposals:", adminAuth.user.canLockProposals);

  // 2. Fetch current approval password
  const getPwRes = await fetch(`${API}/admin/approval-password`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const pwData = await getPwRes.json();
  console.log("2. Current seal password:", pwData.approvalPassword);

  // 3. Super-Admin changes approval password to 'SuperAdminPass2026!'
  const updatePwRes = await fetch(`${API}/admin/approval-password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ newPassword: "SuperAdminPass2026!" })
  });
  const updatePwData = await updatePwRes.json();
  console.log("3. Password changed by Super-Admin:", updatePwData.message);

  // 4. Super-Admin provisions or logs in a test engineer
  let engToken;
  let engUser;
  const engineerLoginRes = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "tariq@greentech.pk", password: "Password123!" })
  });
  if (engineerLoginRes.ok) {
    const data = await engineerLoginRes.json();
    engToken = data.token;
    engUser = data.user;
  } else {
    // Create the engineer via Super-Admin
    const createRes = await fetch(`${API}/auth/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        fullName: "Engr. Tariq Khan",
        email: "tariq@greentech.pk",
        password: "Password123!",
        role: "SURVEY_ENGINEER"
      })
    });
    const createData = await createRes.json();
    engUser = createData.user || createData;
    
    // Log in as engineer
    const loginRes2 = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "tariq@greentech.pk", password: "Password123!" })
    });
    const data2 = await loginRes2.json();
    engToken = data2.token;
    engUser = data2.user;
  }
  console.log("4. Engineer logged in. Initial canLockProposals:", engUser.canLockProposals);

  // Ensure initial unapproved state
  await fetch(`${API}/auth/users/${engUser.id}/toggle-lock-permission`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ canLockProposals: false })
  });

  const unapprovedLoginRes = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "tariq@greentech.pk", password: "Password123!" })
  });
  const unapprovedAuth = await unapprovedLoginRes.json();
  const unapprovedToken = unapprovedAuth.token;

  const engForbiddenCheck = await fetch(`${API}/admin/approval-password`, {
    headers: { Authorization: `Bearer ${unapprovedToken}` }
  });
  console.log("   Engineer trying to access admin approval password -> status:", engForbiddenCheck.status, "(expected 403)");
  if (engForbiddenCheck.status !== 403) throw new Error("Security breach: Non-admin accessed admin approval password!");

  // 5. Engineer tries to seal proposal BEFORE being approved by Super-Admin
  const projectsRes = await fetch(`${API}/projects`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const projects = await projectsRes.json();
  const targetProject = projects[0];
  console.log("   Target Project:", targetProject.projectCode, targetProject.clientName);

  const unapprovedSealRes = await fetch(`${API}/projects/${targetProject.id}/approve`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${unapprovedToken}`
    },
    body: JSON.stringify({ password: "SuperAdminPass2026!" })
  });
  console.log("5. Unapproved engineer trying to seal proposal -> status:", unapprovedSealRes.status, "(expected 403)");
  const unapprovedSealData = await unapprovedSealRes.json();
  console.log("   Rejection reason:", unapprovedSealData.error);
  if (unapprovedSealRes.status !== 403) throw new Error("Security breach: Unapproved user sealed proposal!");

  // 6. Super-Admin grants Proposal Seal Authority to Engineer
  const grantRes = await fetch(`${API}/auth/users/${engUser.id}/toggle-lock-permission`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ canLockProposals: true })
  });
  const grantData = await grantRes.json();
  console.log("6. Super-Admin granted seal authority:", grantData.message);

  // Re-login engineer to get fresh JWT/profile with canLockProposals = true
  const refreshedEngRes = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "tariq@greentech.pk", password: "Password123!" })
  });
  const refreshedEngAuth = await refreshedEngRes.json();
  const refreshedEngToken = refreshedEngAuth.token;
  console.log("   Refreshed engineer canLockProposals:", refreshedEngAuth.user.canLockProposals);

  // 7. Approved Engineer tries to seal with WRONG password
  const wrongPwSealRes = await fetch(`${API}/projects/${targetProject.id}/approve`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${refreshedEngToken}`
    },
    body: JSON.stringify({ password: "WrongPassword999" })
  });
  console.log("7. Approved engineer with wrong password -> status:", wrongPwSealRes.status, "(expected 401)");
  if (wrongPwSealRes.status !== 401) throw new Error("Seal accepted wrong password!");

  // 8. Approved Engineer seals with CORRECT password set by Super-Admin ('SuperAdminPass2026!')
  const correctSealRes = await fetch(`${API}/projects/${targetProject.id}/approve`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${refreshedEngToken}`
    },
    body: JSON.stringify({ password: "SuperAdminPass2026!" })
  });
  const sealData = await correctSealRes.json();
  console.log("8. Approved engineer with correct password -> status:", correctSealRes.status, "(expected 200)");
  console.log("   Digital Signature Generated:", sealData.project?.digitalSignature);
  if (correctSealRes.status !== 200) throw new Error("Valid seal failed: " + JSON.stringify(sealData));

  // 9. Unlock proposal
  const unlockRes = await fetch(`${API}/projects/${targetProject.id}/unlock`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${refreshedEngToken}`
    },
    body: JSON.stringify({ password: "SuperAdminPass2026!" })
  });
  const unlockData = await unlockRes.json();
  console.log("9. Unlock proposal -> status:", unlockRes.status, "message:", unlockData.message);

  // 10. Super-Admin resets password back to default for convenience
  await fetch(`${API}/admin/approval-password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ newPassword: "Password123!" })
  });
  console.log("10. Reset seal password back to Password123! for user convenience.");

  console.log("\nALL VERIFICATION CHECKS PASSED PERFECTLY!");
}

run().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
