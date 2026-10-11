const fs = require('fs');

const app = fs.readFileSync('./frontend/src/App.jsx', 'utf8');
const quot = fs.readFileSync('./frontend/src/components/ModuleProposalQuotation.jsx', 'utf8');
const css = fs.readFileSync('./frontend/src/index.css', 'utf8');

const checks = [
  { name: 'App.jsx banner has no-print print:hidden', pass: app.includes('Pure Zero-Data Initialized') && app.includes('no-print print:hidden') },
  { name: 'Quotation zero-mock banner has no-print print:hidden', pass: quot.includes('No Active Project Selected') && quot.includes('no-print print:hidden') },
  { name: 'Quotation wrapper has id="printable-quotation"', pass: quot.includes('id="printable-quotation"') },
  { name: 'index.css has strict @media print with #printable-quotation isolation', pass: css.includes('#printable-quotation') && css.includes('visibility: hidden') },
  { name: 'Quotation has internal_cost mode template', pass: quot.includes('quotationTemplate === "internal_cost"') },
  { name: 'Quotation has computedCompanyCost & computedGrossProfit', pass: quot.includes('computedCompanyCost') && quot.includes('computedGrossProfit') && quot.includes('computedMarginPct') },
  { name: 'Quotation Editor supports companyUnitCost & unitPrice', pass: quot.includes('companyUnitCost') && quot.includes('unitPrice') },
  { name: 'Quotation has Target Commercial Markup Simulator', pass: quot.includes('Target Commercial Markup Simulator') },
  { name: 'Quotation has Side-by-Side Comparison Table', pass: quot.includes('Itemized Company Cost vs Client Quotation Comparison') },
  { name: 'Quotation has Category Distribution Chart', pass: quot.includes('Company Procurement & Execution Cost Distribution') }
];

console.log('========================================================');
console.log('         QUOTATION & PRINT VERIFICATION RESULTS         ');
console.log('========================================================');
let allPassed = true;
checks.forEach(c => {
  console.log(`${c.pass ? '✅ PASS' : '❌ FAIL'}: ${c.name}`);
  if (!c.pass) allPassed = false;
});
console.log('========================================================');
if (allPassed) {
  console.log('🎯 ALL 10/10 VERIFICATION CHECKS PASSED PERFECTLY!');
} else {
  console.log('⚠️ Some checks failed!');
  process.exit(1);
}
