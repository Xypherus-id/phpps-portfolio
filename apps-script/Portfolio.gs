/**
 * Portfolio.gs
 * Reads one student's portfolio and saves a student's own entries.
 * Every api_ function resolves the user through Access first.
 * Reads and writes go through Data; nothing here touches the Sheet directly.
 */

var Portfolio = (function () {

  function split_(s) {
    return String(s || '').split(';').map(function (x) { return x.trim(); }).filter(String);
  }

  function now_() {
    return Utilities.formatDate(new Date(), 'Asia/Singapore', 'yyyy-MM-dd HH:mm');
  }

  function nextIds_(table, prefix, width, count) {
    var first = Data.nextId(table, prefix, width);
    var n = parseInt(first.slice(prefix.length), 10);
    var ids = [];
    for (var i = 0; i < count; i++) {
      var s = String(n + i);
      while (s.length < width) s = '0' + s;
      ids.push(prefix + s);
    }
    return ids;
  }

  /** The student's enrolment for the current year. */
  function enrolment_(studentId) {
    var e = Data.where('Enrolments', function (r) {
      return r.student_id === studentId && Number(r.year) === CONFIG.CURRENT_YEAR && !r.end_date;
    })[0];
    if (!e) throw new Error('Student ' + studentId + ' is not enrolled in ' + CONFIG.CURRENT_YEAR + '.');
    return e;
  }

  /** Prompts that apply at this level, keyed by prompt_code. */
  function promptsFor_(level) {
    var out = {};
    Data.all('Prompts').forEach(function (p) {
      if (split_(p.levels).indexOf(level) >= 0) out[p.prompt_code] = p;
    });
    return out;
  }

  /** The open cycles in which this prompt is asked. */
  function openCyclesOf_(prompt) {
    var cycles = split_(prompt.cycle);
    return CONFIG.OPEN_CYCLES.filter(function (c) { return cycles.indexOf(c) >= 0; });
  }

  function subjectsFor_(level) {
    return Object.keys(CONFIG.SUBJECT_LEVELS).filter(function (s) { return CONFIG.SUBJECT_LEVELS[s].indexOf(level) >= 0; });
  }

  function myResponses_(studentId) {
    return Data.where('Reflections', function (r) {
      return r.student_id === studentId && Number(r.year) === CONFIG.CURRENT_YEAR;
    });
  }

  function findResponse_(responses, code, cycle) {
    return responses.filter(function (r) { return r.prompt_code === code && r.cycle === cycle; })[0] || null;
  }

  /** A readable label for what a feedback comment is about. */
  function feedbackLabel_(target, prompts) {
    var parts = String(target).split(':');
    if (parts[0] === 'Section') return parts[1];
    if (parts[0] === 'Reflections') {
      var r = Data.where('Reflections', function (x) { return x.response_id === parts[1]; })[0];
      var p = r && prompts[r.prompt_code];
      return p ? p.section + ': ' + p.prompt_text : 'Your reflection';
    }
    if (parts[0] === 'Academic') {
      var a = Data.where('Academic', function (x) { return x.record_id === parts[1]; })[0];
      return a ? 'My Learning: ' + a.subject + ' ' + a.assessment : 'My Learning';
    }
    return '';
  }

  /**
   * The full portfolio of one student for the current year.
   * In Milestone 2 only the student themself may call this.
   */
  function build(user, studentId) {
    Access.assertCanSeeStudent(user, studentId);
    var st = Data.where('Students', function (s) { return s.student_id === studentId; })[0];
    var enr = enrolment_(studentId);
    var prompts = promptsFor_(enr.level);
    var responses = myResponses_(studentId);
    var evidence = Data.where('Evidence', function (e) { return e.student_id === studentId && Number(e.year) === CONFIG.CURRENT_YEAR; });

    var sections = {};
    CONFIG.SECTIONS.forEach(function (name) { sections[name] = { items: [], done: 0, total: 0 }; });

    Object.keys(prompts).forEach(function (code) {
      var p = prompts[code];
      openCyclesOf_(p).forEach(function (cycle) {
        var r = findResponse_(responses, code, cycle);
        var item = {
          key: code + '|' + cycle,
          prompt_code: code, cycle: cycle, prompt_text: p.prompt_text, response_type: p.response_type,
          options: split_(p.options), domain: p.domain, sensitive: p.sensitive === 'Yes',
          locked: !!r && p.section === 'Check-ins',
          response: r ? { response_id: r.response_id, value: String(r.response_value), text: r.response_text, submitted_at: r.submitted_at } : null
        };
        sections[p.section].items.push(item);
        sections[p.section].total++;
        if (r) sections[p.section].done++;
      });
    });

    // Score targets for the next assessment, each paired with a process goal.
    var academic = Data.where('Academic', function (a) { return a.student_id === studentId && Number(a.year) === CONFIG.CURRENT_YEAR; });
    if (CONFIG.LEVELS_WITH_SCORE_TARGETS.indexOf(enr.level) >= 0) {
      var ta = CONFIG.TARGET_ASSESSMENT;
      var rows = subjectsFor_(enr.level).map(function (subj) {
        var a = academic.filter(function (x) { return x.subject === subj && x.assessment === ta.name; })[0];
        return { subject: subj, max_score: ta.max[subj], target_score: a ? a.target_score : '', process_goal: a ? a.process_goal : '' };
      });
      var set = rows.every(function (r) { return r.target_score !== '' && r.process_goal; });
      sections['My Goals'].targets = { assessment: ta.name, rows: rows, complete: set };
      sections['My Goals'].total++;
      if (set) sections['My Goals'].done++;
    }

    // Results already released, with the student's reflection on the gap.
    sections['My Learning'].results = academic
      .filter(function (a) { return a.actual_score !== ''; })
      .map(function (a) {
        return {
          record_id: a.record_id, subject: a.subject, assessment: a.assessment, target_score: a.target_score,
          actual_score: a.actual_score, max_score: a.max_score, process_goal: a.process_goal, gap_reflection: a.gap_reflection
        };
      });

    sections['My Growth'].evidence = evidence.map(function (e) {
      return { evidence_id: e.evidence_id, caption: e.caption, linked_goal: e.linked_goal, file_path: e.file_path, created_at: e.created_at };
    });

    // Students see Released feedback only.
    var showAll = Access.sectionCode(user, 'Feedback') !== 'V-released';
    sections['Feedback'].comments = Data.where('Feedback', function (f) {
      return f.student_id === studentId && (showAll || f.release_status === 'Released');
    }).map(function (f) {
      return { feedback_id: f.feedback_id, about: feedbackLabel_(f.target_record, prompts), comment_text: f.comment_text, created_at: f.created_at };
    });

    return {
      student: { student_id: st.student_id, display_name: st.display_name, initials: st.initials, level: enr.level, 'class': enr['class'] },
      year: CONFIG.CURRENT_YEAR,
      openCycles: CONFIG.OPEN_CYCLES,
      goalOptions: Object.keys(prompts).filter(function (c) { return prompts[c].section === 'My Goals'; })
        .map(function (c) {
          var r = responses.filter(function (x) { return x.prompt_code === c; })[0];
          return { code: c, label: prompts[c].domain + ' goal' + (r && r.response_text ? ': ' + r.response_text : '') };
        }),
      sections: sections
    };
  }

  function validateAnswer_(p, a) {
    var value = a.value === undefined || a.value === null ? '' : String(a.value).trim();
    var text = a.text === undefined || a.text === null ? '' : String(a.text).trim();
    var type = p.response_type;
    if (type === 'Multiple choice' || type === 'Scale') {
      if (split_(p.options).indexOf(value) < 0) throw new Error('Please choose one of the options for: ' + p.prompt_text);
      text = '';
    } else if (type === 'Short text' || type === 'Long text') {
      if (text.length > CONFIG.TEXT_LIMITS[type]) throw new Error('Your answer is too long (' + CONFIG.TEXT_LIMITS[type] + ' characters at most) for: ' + p.prompt_text);
      value = '';
    } else {
      throw new Error('Photos are added with the Add a photo button.');
    }
    return { value: value, text: text };
  }

  /** Saves a student's answers. Empty answers are skipped. Check-in answers cannot be changed once sent. */
  function saveAnswers(user, answers) {
    var studentId = Access.assertStudentSelf(user);
    var enr = enrolment_(studentId);
    var prompts = promptsFor_(enr.level);
    var stamp = now_();

    return Data.withLock(function () {
      var responses = myResponses_(studentId);
      var inserts = [];
      (answers || []).forEach(function (a) {
        var p = prompts[a.prompt_code];
        if (!p) throw new Error('Unknown question ' + a.prompt_code + ' for ' + enr.level + '.');
        if (openCyclesOf_(p).indexOf(a.cycle) < 0) throw new Error('The ' + a.cycle + ' cycle is not open for this question.');
        var blank = String(a.value || '').trim() === '' && String(a.text || '').trim() === '';
        if (blank) return;
        var v = validateAnswer_(p, a);
        var existing = findResponse_(responses, p.prompt_code, a.cycle);
        if (existing) {
          if (p.section === 'Check-ins') throw new Error('Check-in answers cannot be changed after they are sent.');
          if (String(existing.response_value) === v.value && existing.response_text === v.text) return;
          Data.update('Reflections', existing.response_id, {
            response_value: v.value, response_text: v.text, submitted_at: stamp,
            scan_status: Scan.statusFor(p, v.text, existing.scan_status)
          });
        } else {
          inserts.push({
            student_id: studentId, year: CONFIG.CURRENT_YEAR, cycle: a.cycle, prompt_code: p.prompt_code,
            response_value: v.value, response_text: v.text, submitted_at: stamp, scan_status: Scan.statusFor(p, v.text, '')
          });
        }
      });
      var ids = nextIds_('Reflections', 'R', 5, inserts.length);
      inserts.forEach(function (r, i) { r.response_id = ids[i]; });
      Data.insertMany('Reflections', inserts);
      return inserts.length;
    });
  }

  /** Saves score targets for the target assessment. Every target needs a process goal. */
  function saveTargets(user, targets) {
    var studentId = Access.assertStudentSelf(user);
    var enr = enrolment_(studentId);
    if (CONFIG.LEVELS_WITH_SCORE_TARGETS.indexOf(enr.level) < 0) throw new Error('Score targets start in P3.');
    var ta = CONFIG.TARGET_ASSESSMENT;
    var subjects = subjectsFor_(enr.level);

    var clean = (targets || []).map(function (t) {
      if (subjects.indexOf(t.subject) < 0) throw new Error('Unknown subject ' + t.subject + '.');
      var raw = String(t.target_score === undefined || t.target_score === null ? '' : t.target_score).trim();
      var goal = String(t.process_goal || '').trim();
      if (raw === '' && goal === '') return null;
      var max = ta.max[t.subject];
      var score = Number(raw);
      if (raw === '' || !/^\d+$/.test(raw) || score > max) throw new Error('Please enter a whole number from 0 to ' + max + ' as your ' + t.subject + ' target.');
      if (goal.length < 5) throw new Error('Every target needs a plan. Please write what you will do to reach your ' + t.subject + ' target.');
      if (goal.length > CONFIG.TEXT_LIMITS.process_goal) throw new Error('Your ' + t.subject + ' plan is too long.');
      return { subject: t.subject, target_score: score, process_goal: goal, max: max };
    }).filter(Boolean);

    return Data.withLock(function () {
      var existing = Data.where('Academic', function (a) {
        return a.student_id === studentId && Number(a.year) === CONFIG.CURRENT_YEAR && a.assessment === ta.name;
      });
      var inserts = [];
      clean.forEach(function (t) {
        var row = existing.filter(function (a) { return a.subject === t.subject; })[0];
        if (row) {
          Data.update('Academic', row.record_id, { target_score: t.target_score, process_goal: t.process_goal });
        } else {
          inserts.push({
            student_id: studentId, year: CONFIG.CURRENT_YEAR, level: enr.level, subject: t.subject, assessment: ta.name,
            target_score: t.target_score, process_goal: t.process_goal, actual_score: '', max_score: t.max
          });
        }
      });
      var ids = nextIds_('Academic', 'A', 4, inserts.length);
      inserts.forEach(function (r, i) { r.record_id = ids[i]; });
      Data.insertMany('Academic', inserts);
      return clean.length;
    });
  }

  /** Saves the student's reflection on the gap between target and result. */
  function saveGapReflection(user, recordId, text) {
    var studentId = Access.assertStudentSelf(user);
    text = String(text || '').trim();
    if (text.length > CONFIG.TEXT_LIMITS.gap_reflection) throw new Error('Your reflection is too long.');
    var rec = Data.where('Academic', function (a) { return a.record_id === recordId; })[0];
    if (!rec || rec.student_id !== studentId) throw new Error('Access denied: this result is not yours.');
    if (rec.actual_score === '') throw new Error('You can reflect once your result is ready.');
    return Data.withLock(function () { return Data.update('Academic', recordId, { gap_reflection: text }); });
  }

  function uploadFolder_() {
    var props = PropertiesService.getScriptProperties();
    var id = props.getProperty('UPLOAD_FOLDER_ID');
    if (id) {
      try { return DriveApp.getFolderById(id); } catch (e) { /* folder deleted; make a new one */ }
    }
    var folder = DriveApp.createFolder(CONFIG.UPLOAD_FOLDER_NAME);
    props.setProperty('UPLOAD_FOLDER_ID', folder.getId());
    return folder;
  }

  /** Stores a photo in a private Drive folder and records it in Evidence and Reflections. */
  function uploadEvidence(user, input) {
    var studentId = Access.assertStudentSelf(user);
    var enr = enrolment_(studentId);
    var prompts = promptsFor_(enr.level);
    var photoPrompt = Object.keys(prompts).map(function (c) { return prompts[c]; })
      .filter(function (p) { return p.response_type === 'Photo'; })[0];
    if (!photoPrompt) throw new Error('There is no photo question for ' + enr.level + '.');
    if (openCyclesOf_(photoPrompt).indexOf(input.cycle) < 0) throw new Error('The ' + input.cycle + ' cycle is not open.');

    var m = /^data:image\/(jpeg|png);base64,(.+)$/.exec(String(input.dataUrl || ''));
    if (!m) throw new Error('Please choose a JPEG or PNG photo.');
    var bytes = Utilities.base64Decode(m[2]);
    if (bytes.length > CONFIG.UPLOAD_MAX_BYTES) throw new Error('This photo is too large.');
    var caption = String(input.caption || '').trim();
    if (!caption) throw new Error('Please say what the photo shows and why you are proud of it.');
    if (caption.length > CONFIG.TEXT_LIMITS.caption) throw new Error('Your caption is too long.');
    var goal = String(input.linked_goal || '');
    if (goal && !(prompts[goal] && prompts[goal].section === 'My Goals')) throw new Error('Unknown goal.');

    return Data.withLock(function () {
      var evId = Data.nextId('Evidence', 'EV', 3);
      var ext = m[1] === 'png' ? 'png' : 'jpg';
      var file = uploadFolder_().createFile(Utilities.newBlob(bytes, 'image/' + m[1], studentId + '_' + evId + '.' + ext));
      var stamp = now_();
      Data.insert('Evidence', {
        evidence_id: evId, student_id: studentId, section: 'My Growth', file_path: 'drive:' + file.getId(),
        caption: caption, linked_goal: goal, year: CONFIG.CURRENT_YEAR, created_at: stamp
      });
      // The photo question is answered by the newest photo for that cycle.
      var existing = findResponse_(myResponses_(studentId), photoPrompt.prompt_code, input.cycle);
      if (existing) {
        Data.update('Reflections', existing.response_id, { response_value: evId, submitted_at: stamp });
      } else {
        Data.insert('Reflections', {
          response_id: Data.nextId('Reflections', 'R', 5), student_id: studentId, year: CONFIG.CURRENT_YEAR,
          cycle: input.cycle, prompt_code: photoPrompt.prompt_code, response_value: evId, response_text: '',
          submitted_at: stamp, scan_status: 'Not needed'
        });
      }
      return evId;
    });
  }

  /** The image for one evidence item as a data URL, or null for a seeded placeholder. */
  function evidenceImage(user, evidenceId) {
    var ev = Data.where('Evidence', function (e) { return e.evidence_id === evidenceId; })[0];
    if (!ev) throw new Error('No such photo.');
    Access.assertCanSeeStudent(user, ev.student_id);
    if (Access.sectionCode(user, ev.section) === 'N') throw new Error('Access denied: ' + user.role + ' cannot view ' + ev.section + '.');
    var path = String(ev.file_path);
    if (path.indexOf('drive:') !== 0) return null;
    var blob = DriveApp.getFileById(path.slice(6)).getBlob();
    return 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
  }

  return {
    build: build, saveAnswers: saveAnswers, saveTargets: saveTargets,
    saveGapReflection: saveGapReflection, uploadEvidence: uploadEvidence, evidenceImage: evidenceImage
  };
})();

// ----- Functions the browser may call -----

function api_getMyPortfolio(viewAs) {
  Data.reset();
  var user = Access.resolveUser(viewAs);
  return Portfolio.build(user, Access.assertStudentSelf(user));
}

function api_saveAnswers(viewAs, answers) {
  Data.reset();
  var user = Access.resolveUser(viewAs);
  var saved = Portfolio.saveAnswers(user, answers);
  Data.reset();
  return { saved: saved, portfolio: Portfolio.build(user, user.id) };
}

function api_saveTargets(viewAs, targets) {
  Data.reset();
  var user = Access.resolveUser(viewAs);
  Portfolio.saveTargets(user, targets);
  Data.reset();
  return { portfolio: Portfolio.build(user, user.id) };
}

function api_saveGapReflection(viewAs, recordId, text) {
  Data.reset();
  var user = Access.resolveUser(viewAs);
  Portfolio.saveGapReflection(user, recordId, text);
  Data.reset();
  return { portfolio: Portfolio.build(user, user.id) };
}

function api_uploadEvidence(viewAs, input) {
  Data.reset();
  var user = Access.resolveUser(viewAs);
  Portfolio.uploadEvidence(user, input);
  Data.reset();
  return { portfolio: Portfolio.build(user, user.id) };
}

function api_getEvidenceImage(viewAs, evidenceId) {
  Data.reset();
  return Portfolio.evidenceImage(Access.resolveUser(viewAs), evidenceId);
}
