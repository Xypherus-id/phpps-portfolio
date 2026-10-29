// Milestone 2: the student experience. Each test starts from a fresh copy of the demo data.
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./gas');

const S = id => ({ role: 'Student', id });
const NEW = 'S2027-0029'; // has not done Start of year
const FT = { role: 'Form Teacher', id: 'lim.peishan@phpps.example' };
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const item = (p, section, code, cycle) => p.sections[section].items.find(i => i.prompt_code === code && i.cycle === cycle);
const rows = (gas, table) => gas.Data.all(table);

test('a new student sees their sections with nothing done for Start of year', () => {
  const gas = load();
  const p = gas.api_getMyPortfolio(S(NEW));
  assert.strictEqual(p.student.display_name, 'Faith Ang Shu Ting');
  assert.strictEqual(p.sections['About Me'].done, 0);
  assert.strictEqual(p.sections['About Me'].total, 3);
  assert.strictEqual(p.sections['My Goals'].total, 4, 'three goals plus score targets');
  assert.ok(p.sections['My Goals'].targets.rows.length === 4);
  assert.ok(p.sections['Check-ins'].items.every(i => i.cycle === 'Term 1 end'));
});

test('a student completes Start of year goals and score targets', () => {
  const gas = load();
  const before = rows(gas, 'Reflections').length;
  const res = gas.api_saveAnswers(S(NEW), [
    { prompt_code: 'AM01', cycle: 'Start of year', text: 'Drawing' },
    { prompt_code: 'AM02', cycle: 'Start of year', value: 'Care' },
    { prompt_code: 'AM03', cycle: 'Start of year', text: 'Cycling' },
    { prompt_code: 'GL01', cycle: 'Start of year', text: 'Read more books.' },
    { prompt_code: 'GL02', cycle: 'Start of year', text: 'Be kinder.' },
    { prompt_code: 'GL03', cycle: 'Start of year', text: 'Swim 50 metres' }
  ]);
  assert.strictEqual(res.saved, 6);
  assert.strictEqual(rows(gas, 'Reflections').length, before + 6);
  const r = gas.api_saveTargets(S(NEW), ['English', 'Mathematics', 'Science', 'Mother Tongue'].map(s => ({ subject: s, target_score: 15, process_goal: 'Practise every week.' })));
  assert.strictEqual(r.portfolio.sections['My Goals'].done, 4);
  assert.strictEqual(r.portfolio.sections['About Me'].done, 3);
  const wa2 = rows(gas, 'Academic').filter(a => a.student_id === NEW && a.assessment === 'WA2');
  assert.strictEqual(wa2.length, 4);
  assert.ok(wa2.every(a => a.actual_score === '' && a.level === 'P4'));
  const ids = rows(gas, 'Reflections').map(x => x.response_id);
  assert.strictEqual(new Set(ids).size, ids.length, 'response ids stay unique');
});

test('editing a goal updates the same row instead of adding a new one', () => {
  const gas = load();
  gas.api_saveAnswers(S(NEW), [{ prompt_code: 'GL03', cycle: 'Start of year', text: 'First' }]);
  const n = rows(gas, 'Reflections').length;
  gas.api_saveAnswers(S(NEW), [{ prompt_code: 'GL03', cycle: 'Start of year', text: 'Second' }]);
  assert.strictEqual(rows(gas, 'Reflections').length, n);
  assert.ok(rows(gas, 'Reflections').some(x => x.student_id === NEW && x.prompt_code === 'GL03' && x.response_text === 'Second'));
});

test('a score target without a plan is refused by the server', () => {
  const gas = load();
  assert.throws(() => gas.api_saveTargets(S(NEW), [{ subject: 'Science', target_score: 18, process_goal: '' }]), /needs a plan/);
  assert.throws(() => gas.api_saveTargets(S(NEW), [{ subject: 'Science', target_score: 25, process_goal: 'Revise keywords' }]), /0 to 20/);
});

test('answers are checked against the question type', () => {
  const gas = load();
  assert.throws(() => gas.api_saveAnswers(S(NEW), [{ prompt_code: 'AM02', cycle: 'Start of year', value: 'Bravery' }]), /choose one of the options/);
  assert.throws(() => gas.api_saveAnswers(S(NEW), [{ prompt_code: 'AM01', cycle: 'Start of year', text: 'x'.repeat(201) }]), /too long/);
  assert.throws(() => gas.api_saveAnswers(S(NEW), [{ prompt_code: 'AM01', cycle: 'Term 2 end', text: 'x' }]), /not open/);
  assert.throws(() => gas.api_saveAnswers(S(NEW), [{ prompt_code: 'ZZ99', cycle: 'Start of year', text: 'x' }]), /Unknown question/);
});

test('check-in text is scanned, and a flagged answer cannot be overwritten', () => {
  const gas = load();
  const kid = 'S2027-0026'; // did Start of year only
  gas.api_saveAnswers(S(kid), [
    { prompt_code: 'CI01', cycle: 'Term 1 end', value: '2' },
    { prompt_code: 'CI03', cycle: 'Term 1 end', text: 'Some boys keep pushing me at recess.' },
    { prompt_code: 'LN02', cycle: 'Term 1 end', text: 'Group work' }
  ]);
  const mine = rows(gas, 'Reflections').filter(r => r.student_id === kid && r.cycle === 'Term 1 end');
  assert.strictEqual(mine.find(r => r.prompt_code === 'CI03').scan_status, 'Flagged');
  assert.strictEqual(mine.find(r => r.prompt_code === 'CI01').scan_status, 'Cleared');
  assert.strictEqual(mine.find(r => r.prompt_code === 'LN02').scan_status, 'Not needed');
  assert.throws(() => gas.api_saveAnswers(S(kid), [{ prompt_code: 'CI03', cycle: 'Term 1 end', text: 'Never mind.' }]), /cannot be changed/);
  const p = gas.api_getMyPortfolio(S(kid));
  assert.ok(item(p, 'Check-ins', 'CI03', 'Term 1 end').locked);
});

test('a harmless check-in answer is Cleared', () => {
  const gas = load();
  gas.api_saveAnswers(S('S2027-0027'), [{ prompt_code: 'CI03', cycle: 'Term 1 end', text: 'I am excited about the learning journey.' }]);
  assert.strictEqual(rows(gas, 'Reflections').find(r => r.student_id === 'S2027-0027' && r.prompt_code === 'CI03').scan_status, 'Cleared');
});

test('a student sees only Released feedback', () => {
  const gas = load();
  // S2027-0009 has an Approved comment; S2027-0011 has an AI Draft. Neither may be shown.
  assert.strictEqual(gas.api_getMyPortfolio(S('S2027-0009')).sections.Feedback.comments.length, 0);
  assert.strictEqual(gas.api_getMyPortfolio(S('S2027-0011')).sections.Feedback.comments.length, 0);
  const c = gas.api_getMyPortfolio(S('S2027-0001')).sections.Feedback.comments;
  assert.strictEqual(c.length, 1);
  assert.match(c[0].about, /My Goals/);
});

test('a student can reflect on their own result but not on someone else\'s', () => {
  const gas = load();
  const mine = rows(gas, 'Academic').find(a => a.student_id === 'S2027-0002');
  const theirs = rows(gas, 'Academic').find(a => a.student_id === 'S2027-0003');
  gas.api_saveGapReflection(S('S2027-0002'), mine.record_id, 'I rushed the last part.');
  assert.strictEqual(rows(gas, 'Academic').find(a => a.record_id === mine.record_id).gap_reflection, 'I rushed the last part.');
  assert.throws(() => gas.api_saveGapReflection(S('S2027-0002'), theirs.record_id, 'x'), /not yours/);
});

test('staff cannot use the student save functions', () => {
  const gas = load();
  assert.throws(() => gas.api_saveAnswers(FT, [{ prompt_code: 'AM01', cycle: 'Start of year', text: 'x' }]), /only a student/);
  assert.throws(() => gas.api_getMyPortfolio(FT), /only a student/);
});

test('a photo upload creates Evidence and answers the photo question', () => {
  const gas = load();
  const r = gas.api_uploadEvidence(S(NEW), { cycle: 'Start of year', dataUrl: PNG, caption: 'My Lego robot', linked_goal: 'GL01' });
  const ev = rows(gas, 'Evidence').find(e => e.student_id === NEW);
  assert.ok(ev.file_path.startsWith('drive:'));
  assert.strictEqual(ev.caption, 'My Lego robot');
  assert.ok(item(r.portfolio, 'My Growth', 'GR01', 'Start of year').response);
  assert.match(gas.api_getEvidenceImage(S(NEW), ev.evidence_id), /^data:image\/png;base64,/);
  assert.throws(() => gas.api_getEvidenceImage(S('S2027-0001'), ev.evidence_id), /Access denied/);
  assert.throws(() => gas.api_uploadEvidence(S(NEW), { cycle: 'Start of year', dataUrl: 'data:text/html;base64,PGI+', caption: 'x' }), /JPEG or PNG/);
  assert.throws(() => gas.api_uploadEvidence(S(NEW), { cycle: 'Start of year', dataUrl: PNG, caption: '' }), /say what the photo shows/);
});

test('the placeholder scan catches the seeded concerns and ignores ordinary answers', () => {
  const gas = load();
  assert.ok(gas.Scan.matches('Some older pupils keep teasing me'));
  assert.ok(gas.Scan.matches('nobody  likes me'));
  assert.ok(!gas.Scan.matches('I am nervous about the swimming test.'));
  assert.ok(!gas.Scan.matches('My friend Hitesh is fun'), 'whole words only');
});
