const fs = require('fs');

const financial = fs.readFileSync('./frontend/src/components/ModuleFinancial.jsx', 'utf8');
const app = fs.readFileSync('./frontend/src/App.jsx', 'utf8');
const prop = fs.readFileSync('./frontend/src/components/ModuleProposalQuotation.jsx', 'utf8');

const checks = [
  { name: "ModuleFinancial default isCalculated = false", pass: financial.includes("const [isCalculated, setIsCalculated] = useState(false)") },
  { name: "ModuleFinancial Purge & Clear button exists", pass: financial.includes("Purge & Clear Financial Matrix (Zero Slate)") },
  { name: "ModuleFinancial Zero Simulated Projections notice exists", pass: financial.includes("Zero Simulated Projections: Financial Matrix is Inactive") },
  { name: "ModuleFinancial hides table when !isCalculated", pass: financial.includes("{!isCalculated || !liveFinancials ?") },
  { name: "App.jsx financialData is null by default", pass: app.includes("const financialData = null;") },
  { name: "ModuleProposalQuotation fake 'Ibrahim' removed", pass: !prop.includes('clientName: "Ibrahim"') },
  { name: "ModuleProposalQuotation fake 'Engr. Zoha Akbar' removed", pass: !prop.includes('preparedBy: "Engr. Zoha Akbar"') },
  { name: "ModuleProposalQuotation fake phone '+92 321 4183404' removed", pass: !prop.includes("+92 321 4183404") },
  { name: "ModuleProposalQuotation fake quote 'GT 123' removed from defaults", pass: !prop.includes('quoteNumber: "GT 123"') }
];

let allPassed = true;
checks.forEach(c => {
  console.log(`${c.pass ? '✅' : '❌'} ${c.name}`);
  if (!c.pass) allPassed = false;
});

if (allPassed) {
  console.log("\n🚀 ALL 9 ZERO-FAKE-DATA CHECKS PASSED PERFECTLY!");
  process.exit(0);
} else {
  console.error("\n❌ Some checks failed!");
  process.exit(1);
}
