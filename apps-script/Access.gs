/**
 * Access.gs
 * Decides who the current user is and which students and sections they may see.
 * Every function in Api.gs calls Access before returning any data.
 *
 * PROTOTYPE NOTE: there is no real sign-in. The browser sends "viewAs"
 * (a role and a person) from the role switcher, and the server checks that
 * this person really holds that role in StaffRoles before trusting it.
 * A real deployment would take the email from Google sign-in instead.
 */

var Access = (function () {

  function currentEnrolments_() {
    return Data.where('Enrolments', function (e) {
      return Number(e.year) === CONFIG.CURRENT_YEAR && !e.end_date;
    });
  }

  /**
   * Turns the role switcher choice into a checked user object:
   *   { role, id, name, scopes: [{ scope_type, scope_value, subject }] }
   * Throws if the person does not hold the role.
   */
  function resolveUser(viewAs) {
    if (!viewAs || !viewAs.role || !viewAs.id) throw new Error('Please choose a role and a person.');

    if (viewAs.role === 'Student') {
      var st = Data.where('Students', function (s) { return s.student_id === viewAs.id; })[0];
      if (!st) throw new Error('No student with id ' + viewAs.id + '.');
      return { role: 'Student', id: st.student_id, name: st.display_name, scopes: [] };
    }

    var rows = Data.where('StaffRoles', function (r) {
      return r.staff_email === viewAs.id && r.role === viewAs.role && Number(r.year) === CONFIG.CURRENT_YEAR;
    });
    if (!rows.length) throw new Error(viewAs.id + ' does not hold the role ' + viewAs.role + ' in ' + CONFIG.CURRENT_YEAR + '.');
    return {
      role: viewAs.role,
      id: viewAs.id,
      name: rows[0].staff_name,
      scopes: rows.map(function (r) { return { scope_type: r.scope_type, scope_value: r.scope_value, subject: r.subject }; })
    };
  }

  /** student_ids this user may see at all, for the current year. */
  function studentIdsInScope(user) {
    if (user.role === 'Student') return [user.id];

    var ids = {};
    var enrolments = currentEnrolments_();
    user.scopes.forEach(function (sc) {
      enrolments.forEach(function (e) {
        var match = false;
        if (sc.scope_type === 'Class') match = e['class'] === sc.scope_value;
        else if (sc.scope_type === 'Level') match = e.level === sc.scope_value;
        else if (sc.scope_type === 'Subject') match = (CONFIG.SUBJECT_LEVELS[sc.scope_value] || []).indexOf(e.level) >= 0;
        else if (sc.scope_type === 'School') match = true;
        if (match) ids[e.student_id] = true;
      });
    });
    return Object.keys(ids).sort();
  }

  /** Throws unless the user may see this student. */
  function assertCanSeeStudent(user, studentId) {
    if (studentIdsInScope(user).indexOf(studentId) < 0) {
      throw new Error('Access denied: ' + user.name + ' (' + user.role + ') may not view student ' + studentId + '.');
    }
  }

  function canSeeSupportFlags(user) {
    return CONFIG.SUPPORT_FLAG_ROLES.indexOf(user.role) >= 0;
  }

  /** The access matrix row for this role, with plain language labels. */
  function matrixRow(user) {
    var row = CONFIG.ACCESS_MATRIX[user.role] || {};
    return Object.keys(row).map(function (area) {
      var code = row[area];
      return { area: area, code: code, label: area === 'Export' ? code : (CONFIG.ACCESS_LABELS[code] || code) };
    });
  }

  /** One sentence describing what this user's scope covers. */
  function describeScope(user) {
    if (user.role === 'Student') return 'Your own portfolio only.';
    return user.scopes.map(function (sc) {
      if (sc.scope_type === 'Class') return 'Class ' + sc.scope_value + (sc.subject ? ' (' + sc.subject + ')' : '');
      if (sc.scope_type === 'Level') return 'All classes in ' + sc.scope_value;
      if (sc.scope_type === 'Subject') return sc.scope_value + ' across all levels where it is taught';
      return 'The whole school';
    }).join('; ') + '.';
  }

  return {
    resolveUser: resolveUser,
    studentIdsInScope: studentIdsInScope,
    assertCanSeeStudent: assertCanSeeStudent,
    canSeeSupportFlags: canSeeSupportFlags,
    matrixRow: matrixRow,
    describeScope: describeScope
  };
})();
