// Scripted conversations that prove the adaptive branching works.
const assert = require('assert');
const { newSession, handle } = require('../src/engine');

function run(script) {
  let s = newSession(); const log = [];
  for (const msg of script) { const r = handle(s, msg); s = r.s; log.push({ msg, replies: r.replies }); }
  return { s, log };
}
const asked = s => Object.keys(s.answers);

// Persona: Ramappa, 55, farmer, readymade glasses, rides two-wheeler, diabetic
const ramappa = run([
  'hi', '1', '1', 'Ramappa', '55',
  '1',   // occupation: farming
  '5',   // glasses: readymade
  '3',   // glasses_age: >2 yrs
  '2',   // screen 1-3h
  '2',   // nearwork 1-3h
  '4',   // outdoor >6h
  '3',   // drive: two-wheeler
  '3',   // night: glare
  '3',   // difficulty: near
  '1',   // presby: yes
  '1',   // switching: yes
  '2,4', // symptoms: strain + light? (index 2,4)
  '1',   // medical: diabetes
  '2',   // diab_spots: sometimes
  '3',   // diab_check: never
  '4',   // family: none
  '5',   // redflag: none
  '1',   // priority: price
]);
assert(ramappa.s.done, 'Ramappa should finish');
for (const id of ['glasses_age', 'night', 'presby', 'diab_spots', 'diab_check']) assert(asked(ramappa.s).includes(id), id + ' should be asked');
assert.strictEqual(ramappa.s.result.tri, 'amber');
console.log('✓ Ramappa: follow-ups for glasses age, night glare, presbyopia and diabetes were asked; triage =', ramappa.s.result.tri, '; lens =', ramappa.s.result.lens);

// Persona: 21-year-old student, no glasses, no vehicle-night, no diabetes => short path
const student = run(['hi', '1', '1', 'Ravi', '21', '4', '1', '4', '4', '1', '1', '1', '5', '3', '5', '4', '5', '1']);
assert(student.s.done);
for (const id of ['glasses_age', 'night', 'presby', 'switching', 'diab_spots', 'diab_check']) assert(!asked(student.s).includes(id), id + ' should be skipped');
console.log('✓ Student (21): skipped', 6, 'irrelevant follow-ups; answered', asked(student.s).length, 'questions vs', asked(ramappa.s).length, 'for Ramappa');

// Red flag interrupts immediately (answer by question id so the script cannot drift)
{
  let s = newSession();
  for (const m of ['hi', '1', '1', 'Test', '40']) s = handle(s, m).s;
  const pick = { difficulty: '4', symptoms: '6', medical: '4', family: '4', redflag: '1' }; // redflag 1 = sudden vision loss
  let urgentShown = false, guard = 0;
  while (!s.done && guard++ < 30) {
    const id = s.current, r = handle(s, pick[id] || '1'); s = r.s;
    if (id === 'redflag') urgentShown = r.replies.some(x => x.includes('🔴'));
  }
  assert(urgentShown, 'urgent warning should appear right after the red-flag answer');
  assert.strictEqual(s.result.tri, 'red'); assert.strictEqual(s.result.lens, 'defer');
  console.log('✓ Red flag: urgent message sent immediately; triage = red; lens deferred to in-person exam');
}

// Back button, bad input, voice note
let s = newSession(); handle(s, 'hi'); handle(s, '3'); handle(s, '1'); handle(s, 'Raju'); handle(s, '50');
let r = handle(s, '9'); assert(r.replies[0].includes('ಕ್ಷಮಿಸಿ'), 'invalid choice should retry in Kannada');
r = handle(s, '', { hasAudio: true }); assert(r.replies[0].includes('ವಾಯ್ಸ್'));
handle(s, 'kheti'); assert.strictEqual(s.answers.occupation, 'farming', 'keyword match');
handle(s, 'back'); assert(!('occupation' in s.answers), 'back removes last answer');
console.log('✓ Retry, voice-note fallback, keyword matching and back all work');
console.log('\nAll checks passed.');
