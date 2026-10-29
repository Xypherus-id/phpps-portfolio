// Automated checks run against the real .gs files. Usage: node --test dev/
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./gas');

const gas = load();
const list = (role, id) => gas.api_listStudents({ role, id });
const E = n => n + '@phpps.example';

test('the seeded Sheet passes the schema check', () => {
  assert.deepStrictEqual(Array.from(gas.Data.checkSchema()), []);
});

test('a student sees only their own record', () => {
  const r = list('Student', 'S2027-0005');
  assert.strictEqual(r.rows.length, 1);
  assert.strictEqual(r.rows[0].student_id, 'S2027-0005');
});

test('a student cannot be treated as another student', () => {
  assert.throws(() => gas.Access.assertCanSeeStudent(gas.Access.resolveUser({ role: 'Student', id: 'S2027-0005' }), 'S2027-0006'), /Access denied/);
});

test('the form teacher sees all 30 students in 4F1', () => {
  assert.strictEqual(list('Form Teacher', E('lim.peishan')).rows.length, 30);
});

test('the Mathematics teacher sees 4F1 students', () => {
  assert.strictEqual(list('Subject Teacher', E('ravi.chandran')).rows.length, 30);
});

test('level, subject and school scopes all cover the seeded class', () => {
  for (const [role, who] of [['YH', 'benjamin.koh'], ['AYH', 'hafiz.salleh'], ['LM', 'farah.iskandar'],
    ['HOD', 'ong.junhao'], ['School Leader', 'angela.tay'], ['Admin', 'alvin.teo'], ['SENO', 'grace.ho']]) {
    assert.strictEqual(list(role, E(who)).rows.length, 30, role);
  }
});

test('a person cannot claim a role they do not hold', () => {
  assert.throws(() => list('School Leader', E('ravi.chandran')), /does not hold the role/);
  assert.throws(() => list('YH', E('lim.peishan')), /does not hold the role/);
});

test('support flags are visible only to the Year Head, SENO and School Leader', () => {
  const allowed = { YH: 'benjamin.koh', SENO: 'grace.ho', 'School Leader': 'angela.tay' };
  for (const [role, who] of Object.entries(allowed)) {
    const r = list(role, E(who));
    assert.ok(r.columns.some(c => c.key === 'support_flags'), role);
    assert.ok(r.rows.some(s => s.support_flags), role);
  }
  const denied = [['Form Teacher', 'lim.peishan'], ['Subject Teacher', 'ravi.chandran'], ['AYH', 'hafiz.salleh'],
    ['LM', 'farah.iskandar'], ['HOD', 'ong.junhao'], ['Admin', 'alvin.teo']];
  for (const [role, who] of denied) {
    const r = list(role, E(who));
    assert.ok(!r.columns.some(c => c.key === 'support_flags'), role);
    assert.ok(r.rows.every(s => !('support_flags' in s)), role);
  }
  assert.ok(!('support_flags' in list('Student', 'S2027-0007').rows[0]));
});

test('scope rules exclude students outside the scope', () => {
  // Add a P2 student in class 2F1; the P4 Year Head, the Science HOD and the 4F1 teachers must not see them.
  const ss = gas._ss._sheets;
  ss.Students.values.push(['S2027-0099', '', 'Test Pupil', 'TP', 2026, 'Active', '']);
  ss.Enrolments.values.push(['E0099', 'S2027-0099', 2027, 'P2', '2F1', '2027-01-02', '']);
  gas.Data.reset();
  try {
    assert.strictEqual(list('YH', E('benjamin.koh')).rows.length, 30);
    assert.strictEqual(list('HOD', E('ong.junhao')).rows.length, 30, 'Science is not taught in P2');
    assert.strictEqual(list('Form Teacher', E('lim.peishan')).rows.length, 30);
    assert.strictEqual(list('School Leader', E('angela.tay')).rows.length, 31);
  } finally {
    ss.Students.values.pop();
    ss.Enrolments.values.pop();
    gas.Data.reset();
  }
});

test('the role switcher lists every seeded role', () => {
  const b = gas.api_bootstrap();
  assert.strictEqual(b.people.Student.length, 30);
  assert.deepStrictEqual(Array.from(b.roles, r => r.value),
    ['Student', 'Form Teacher', 'Subject Teacher', 'YH', 'AYH', 'LM', 'HOD', 'SENO', 'School Leader', 'Admin']);
  assert.strictEqual(b.people['Subject Teacher'].length, 4);
});
