/**
 * Code.gs
 * Entry point of the web app and the functions the browser may call.
 * Browser calls arrive through google.script.run.api_xxx(...).
 * Each api_ function checks the user through Access before touching data.
 */

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle(CONFIG.APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Lets Index.html pull in Styles.html and Client.html. */
function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

/** Everything the page needs when it first loads: the role switcher lists and a setup check. */
function api_bootstrap() {
  Data.reset();
  var year = CONFIG.CURRENT_YEAR;
  var classOf = {};
  Data.where('Enrolments', function (e) { return Number(e.year) === year; })
    .forEach(function (e) { classOf[e.student_id] = e['class']; });

  var people = {};
  people['Student'] = Data.all('Students')
    .filter(function (s) { return classOf[s.student_id]; })
    .map(function (s) { return { id: s.student_id, label: s.display_name + ' (' + classOf[s.student_id] + ')' }; });

  Data.where('StaffRoles', function (r) { return Number(r.year) === year; }).forEach(function (r) {
    var list = people[r.role] = people[r.role] || [];
    var scope = [];
    if (r.subject) scope.push(r.subject);
    if (r.scope_type !== 'School' && r.scope_value !== r.subject) scope.push(r.scope_value);
    var label = r.staff_name + (scope.length ? ' (' + scope.join(', ') + ')' : '');
    var existing = list.filter(function (p) { return p.id === r.staff_email; })[0];
    if (!existing) list.push({ id: r.staff_email, label: label });
  });

  return {
    title: CONFIG.APP_TITLE,
    year: year,
    roles: CONFIG.ROLE_OPTIONS.filter(function (o) { return people[o.value]; }),
    people: people,
    setupProblems: Data.checkSchema()
  };
}

/** The list of students the chosen user may see, with only the columns they may see. */
function api_listStudents(viewAs) {
  Data.reset();
  var user = Access.resolveUser(viewAs);
  var ids = Access.studentIdsInScope(user);
  var showFlags = Access.canSeeSupportFlags(user);

  var classOf = {};
  Data.where('Enrolments', function (e) { return Number(e.year) === CONFIG.CURRENT_YEAR; })
    .forEach(function (e) { classOf[e.student_id] = e['class']; });

  var columns = [
    { key: 'student_id', label: 'Student ID' },
    { key: 'display_name', label: 'Name' },
    { key: 'initials', label: 'Initials' },
    { key: 'class', label: 'Class' },
    { key: 'status', label: 'Status' }
  ];
  if (showFlags) columns.push({ key: 'support_flags', label: 'Support flags (restricted)' });

  var rows = Data.where('Students', function (s) { return ids.indexOf(s.student_id) >= 0; })
    .map(function (s) {
      var out = {};
      columns.forEach(function (c) { out[c.key] = c.key === 'class' ? classOf[s.student_id] : s[c.key]; });
      return out;
    });

  return {
    user: { role: user.role, name: user.name, id: user.id },
    roleLabel: roleLabel_(user.role),
    scope: Access.describeScope(user),
    access: Access.matrixRow(user),
    supportFlagsVisible: showFlags,
    columns: columns,
    rows: rows
  };
}

/** Run this once from the Script editor (select it, then click Run) to check the Sheet is set up correctly. */
function checkSetup() {
  var problems = Data.checkSchema();
  Logger.log(problems.length ? 'Problems found:\n' + problems.join('\n') : 'All eight tabs are present with the correct columns.');
  return problems;
}

function roleLabel_(value) {
  var o = CONFIG.ROLE_OPTIONS.filter(function (x) { return x.value === value; })[0];
  return o ? o.label : value;
}
