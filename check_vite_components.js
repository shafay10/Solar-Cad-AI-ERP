const fs = require('fs');

async function check() {
  const r1 = await fetch('http://localhost:3000/src/components/StructureSchematicSVG.jsx');
  const t1 = await r1.text();
  console.log('StructureSchematicSVG status:', r1.status);
  const m1 = t1.match(/className:\s*"([^"]*)"/g);
  console.log('StructureSchematicSVG first 5 classNames:', m1?.slice(0, 5));

  const r2 = await fetch('http://localhost:3000/src/components/ModuleFieldSurvey.jsx');
  const t2 = await r2.text();
  console.log('ModuleFieldSurvey status:', r2.status);
  const m2 = t2.match(/Installation Area \(sq ft\)/);
  console.log('ModuleFieldSurvey contains Installation Area:', !!m2);
  const idx2 = t2.indexOf('Installation Area (sq ft)');
  console.log('Snippet around Installation Area:', t2.slice(idx2 - 120, idx2 + 60));

  const r3 = await fetch('http://localhost:3000/src/components/ModuleHelioScopeCAD.jsx');
  const t3 = await r3.text();
  console.log('ModuleHelioScopeCAD status:', r3.status);
  const idx3 = t3.indexOf('Inter-Row Safe Pitch:');
  console.log('Snippet around Inter-Row Safe Pitch:', t3.slice(idx3 - 120, idx3 + 60));
}

check().catch(console.error);
