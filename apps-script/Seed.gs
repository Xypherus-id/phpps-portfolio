/**
 * Seed.gs
 * Builds the eight tabs and fills them with FICTIONAL demo data.
 * All names are invented. No NRIC or Birth Certificate numbers are produced.
 *
 * To use: in the Script editor choose setupDemoData and click Run.
 * WARNING: this replaces everything in the eight tabs. Use it to set up
 * the Sheet the first time, or to reset the demo before a presentation.
 */

/** Creates or clears the eight tabs and writes the demo data. Owner only. */
function setupDemoData() {
  assertOwner_();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var demo = buildDemoData_();
  Object.keys(CONFIG.TABLES).forEach(function (table) {
    var cols = CONFIG.TABLES[table];
    var sh = ss.getSheetByName(table) || ss.insertSheet(table);
    sh.clear();
    var rows = [cols].concat(demo[table]);
    sh.getRange(1, 1, rows.length, cols.length).setValues(rows);
    sh.getRange(1, 1, 1, cols.length).setFontWeight('bold').setBackground('#e7eff7');
    sh.setFrozenRows(1);
  });
  // Remove the default empty tab if it is still there.
  var blank = ss.getSheetByName('Sheet1');
  if (blank && ss.getSheets().length > 1 && blank.getLastRow() === 0) ss.deleteSheet(blank);
  Logger.log('Demo data written: ' + Object.keys(demo).map(function (t) { return t + ' ' + demo[t].length; }).join(', '));
}

/**
 * Only the owner of the script may run setup functions.
 * Visitors to the web app could otherwise call them through google.script.run.
 */
function assertOwner_() {
  var active = Session.getActiveUser().getEmail();
  if (!active || active !== Session.getEffectiveUser().getEmail()) {
    throw new Error('Only the owner of this Sheet can run this function, from the Script editor.');
  }
}

/** Returns { TableName: [ [row values in CONFIG.TABLES column order], ... ] }. Same output every time. */
function buildDemoData_() {
  var YEAR = CONFIG.CURRENT_YEAR, CLASS = '4F1', LEVEL = 'P4', DOMAIN = 'phpps.example';

  // Repeatable pseudo random numbers, so every reset gives the same demo data.
  var seed = 2027;
  function rand() {
    seed = (seed + 0x6D2B79F5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
  function between(lo, hi) { return lo + Math.floor(rand() * (hi - lo + 1)); }
  function pad(n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; }
  function sid(i) { return 'S' + YEAR + '-' + pad(i, 4); }
  function stamp(month, lo, hi) {
    return YEAR + '-' + pad(month, 2) + '-' + pad(between(lo, hi), 2) + ' ' + pad(between(8, 16), 2) + ':' + pick(['05', '12', '20', '34', '41', '58']);
  }
  function initials(name) {
    return name.split(' ').filter(function (p) { return p !== 'bin' && p !== 'binte'; })
      .map(function (p) { return p.charAt(0); }).join('').toUpperCase();
  }

  var NAMES = [
    'Tan Jia Hui', 'Muhammad Irfan bin Rosli', 'Aarav Krishnan', 'Chloe Lim Xin Yi',
    'Nur Aisyah binte Hamzah', 'Ethan Goh Zhi Hao', 'Kavya Ramesh', 'Lucas Chua Wen Jie',
    'Siti Zulaikha binte Osman', 'Ryan Teo Kai Xuan', 'Ananya Pillai', 'Isaac Ng Jun Wei',
    'Amirah binte Yusof', 'Megan Yeo Hui Min', 'Arjun Nair', 'Javier Seah Yi Heng',
    'Hannah Rodrigues', 'Daniel Ho Jun Kai', 'Nurul Iman binte Jamil', 'Sophie Koh Le Xuan',
    'Rayyan bin Mohd Fadzil', 'Priya Subramaniam', 'Marcus Low Wei Ming', 'Zara Fernandez',
    'Caleb Toh Rui En', 'Aisyah Rahmat', 'Nathan Quek Zheng Yu', 'Ishaan Menon',
    'Faith Ang Shu Ting', 'Haziq bin Abdul Rahim'
  ];
  // Students 26 to 30 are incomplete: 26 and 27 did Start of year only; 28 to 30 did nothing.
  function didStartOfYear(i) { return i <= 27; }
  function didTerm1(i) { return i <= 25; }
  var FLAGGED = {
    4: 'Some older pupils keep teasing me and pushing me at recess. I feel scared to go to the canteen.',
    12: 'I cry a lot at night because my parents keep quarrelling. I feel alone at home.',
    19: 'Someone in my class says mean things about me in the class chat and tells others not to play with me.'
  };
  var SUPPORT = { 7: 'Learning support programme (literacy)', 15: 'Access arrangements for examinations', 23: 'Financial assistance scheme' };

  var STAFF = [
    ['lim.peishan', 'Ms Lim Pei Shan', 'Form Teacher', 'Class', CLASS, ''],
    ['lim.peishan', 'Ms Lim Pei Shan', 'Subject Teacher', 'Class', CLASS, 'English'],
    ['ravi.chandran', 'Mr Ravi Chandran', 'Subject Teacher', 'Class', CLASS, 'Mathematics'],
    ['wong.meiling', 'Mrs Wong Mei Ling', 'Subject Teacher', 'Class', CLASS, 'Science'],
    ['siti.aminah', 'Mdm Siti Aminah', 'Subject Teacher', 'Class', CLASS, 'Mother Tongue'],
    ['benjamin.koh', 'Mr Benjamin Koh', 'YH', 'Level', LEVEL, ''],
    ['hafiz.salleh', 'Mr Hafiz Salleh', 'AYH', 'Level', LEVEL, ''],
    ['farah.iskandar', 'Ms Farah Iskandar', 'LM', 'Level', LEVEL, ''],
    ['ong.junhao', 'Mr Ong Jun Hao', 'HOD', 'Subject', 'Science', 'Science'],
    ['grace.ho', 'Ms Grace Ho', 'SENO', 'School', CONFIG.SCHOOL, ''],
    ['angela.tay', 'Mrs Angela Tay', 'School Leader', 'School', CONFIG.SCHOOL, ''],
    ['alvin.teo', 'Mr Alvin Teo', 'Admin', 'School', CONFIG.SCHOOL, '']
  ];

  var ALL = 'P1; P2; P3; P4; P5; P6';
  var TERMS = 'Term 1 end; Term 2 end; Term 3 end; Term 4 end';
  var PROMPTS = [
    ['AM01', 'About Me', 'Personal', 'What are you good at?', 'Short text', '', ALL, 'Start of year', 'No'],
    ['AM02', 'About Me', 'Character', 'Which school value describes you best?', 'Multiple choice', 'Respect; Responsibility; Resilience; Integrity; Care; Harmony', ALL, 'Start of year', 'No'],
    ['AM03', 'About Me', 'Personal', 'What do you enjoy doing outside of school?', 'Short text', '', ALL, 'Start of year', 'No'],
    ['GL01', 'My Goals', 'Academic', 'What is one learning goal you have for this year?', 'Long text', '', ALL, 'Start of year', 'No'],
    ['GL02', 'My Goals', 'Character', 'What is one character goal you have for this year? How will you work on it?', 'Long text', '', ALL, 'Start of year', 'No'],
    ['GL03', 'My Goals', 'Personal', 'What is one personal goal you have for this year?', 'Short text', '', ALL, 'Start of year', 'No'],
    ['CI01', 'Check-ins', 'Wellbeing', 'How do you feel about school this term? (1 means not happy at all, 5 means very happy)', 'Scale', '1; 2; 3; 4; 5', ALL, TERMS, 'Yes'],
    ['CI02', 'Check-ins', 'Wellbeing', 'Who do you usually go to when you need help?', 'Multiple choice', 'Parent or guardian; Form teacher; Friend; Brother or sister; School counsellor; No one', ALL, TERMS, 'Yes'],
    ['CI03', 'Check-ins', 'Wellbeing', 'Is there anything worrying you that you would like a teacher to know?', 'Long text', '', ALL, TERMS, 'Yes'],
    ['LN01', 'My Learning', 'Academic', 'How confident do you feel about your learning this term? (1 means not confident, 5 means very confident)', 'Scale', '1; 2; 3; 4; 5', 'P3; P4; P5; P6', TERMS, 'No'],
    ['LN02', 'My Learning', 'Academic', 'What helped you learn best this term?', 'Long text', '', ALL, TERMS, 'No'],
    ['GR01', 'My Growth', 'Personal', 'Share a photo of something you are proud of, and say why.', 'Photo', '', ALL, 'Start of year; ' + TERMS + '; End of year', 'No'],
    ['GR02', 'My Growth', 'Character', 'How did you work on your character goal this term?', 'Long text', '', ALL, TERMS, 'No']
  ];

  var GOOD_AT = ['Drawing animals', 'Solving puzzles', 'Running fast', 'Reading story books', 'Helping my friends', 'Playing the piano',
    'Building with Lego', 'Swimming', 'Telling jokes', 'Writing stories', 'Football', 'Remembering facts about space'];
  var OUTSIDE = ['Cycling at the park with my family', 'Baking cookies with my grandmother', 'Playing badminton', 'Reading comics',
    'Visiting the library', 'Taking care of my fish', 'Watching nature documentaries', 'Practising silat',
    'Playing chess with my father', 'Dancing', 'Drawing on my tablet', 'Going to the beach'];
  var VALUES = ['Respect', 'Responsibility', 'Resilience', 'Integrity', 'Care', 'Harmony'];
  var LEARNING_GOALS = ['I want to improve my problem sums in Mathematics by checking my working.',
    'I want to read one English story book every week.', 'I want to explain Science answers using the right keywords.',
    'I want to write longer compositions with better vocabulary.', 'I want to speak more confidently in Mother Tongue oral.',
    'I want to finish my homework on time without being reminded.', 'I want to learn my multiplication tables up to 12 by heart.'];
  var CHAR_GOALS = ['I want to be more patient with my younger brother. I will count to five before I respond.',
    'I want to be more responsible. I will pack my school bag every night.',
    'I want to be kinder to classmates. I will invite someone new to play at recess.',
    'I want to be braver. I will put up my hand to answer at least once a day.',
    'I want to show respect by listening without interrupting.',
    'I want to be more resilient. When I get something wrong, I will try again instead of giving up.'];
  var PERSONAL_GOALS = ['Learn to swim 50 metres', 'Read 30 books this year', 'Make two new friends', 'Sleep before 10 pm',
    'Learn to cook fried rice', 'Practise the piano every day', 'Join the school football team'];
  var HELP = ['Parent or guardian', 'Parent or guardian', 'Form teacher', 'Friend', 'Brother or sister', 'Parent or guardian'];
  var WORRIES = ['', '', '', 'No, I am fine.', 'I am a bit worried about my Mathematics test.', 'Nothing for now.',
    'I am nervous about the swimming test.', 'I miss my best friend who moved to another school.'];
  var LEARN_BEST = ['When my teacher showed us with real objects.', 'Doing group work with my friends.', 'Practising with past questions.',
    'Watching the videos in class.', 'When I asked questions after class.', 'Using mind maps to revise.'];
  var CHAR_PROGRESS = ['I counted to five most of the time, but sometimes I forgot.', 'I packed my bag every night except twice.',
    'I invited a new classmate to play with us and now we are friends.', 'I put up my hand more often in Science.',
    'I tried to listen more. My teacher noticed it.', 'I tried again when I made mistakes in my spelling.'];

  var SUBJECTS = [['English', 30], ['Mathematics', 25], ['Science', 20], ['Mother Tongue', 30]];
  var PROCESS_GOALS = {
    'English': ['I will read for 20 minutes every night.', 'I will learn five new words every week.', 'I will check my spelling before I hand in my work.'],
    'Mathematics': ['I will practise ten problem sums every weekend.', 'I will check my working step by step.', 'I will ask my teacher when I do not understand.'],
    'Science': ['I will revise the keywords for each topic.', 'I will use the CER method to answer open-ended questions.', 'I will redo my wrong questions.'],
    'Mother Tongue': ['I will speak Mother Tongue at home for 15 minutes a day.', 'I will read one Mother Tongue story every week.', 'I will practise writing ten words a day.']
  };
  var GAP_ABOVE = ['I did better than my target because I practised a lot.', 'Reading every night helped me understand the questions.'];
  var GAP_BELOW = ['I did not reach my target because I was careless in the last section.',
    'I ran out of time. Next time I will skip difficult questions first.',
    'I forgot some keywords. I will make flash cards.', 'I did not understand the question. I will read it twice next time.'];

  var t = { Students: [], Enrolments: [], StaffRoles: [], Prompts: PROMPTS, Reflections: [], Academic: [], Evidence: [], Feedback: [] };

  NAMES.forEach(function (name, k) {
    var i = k + 1;
    t.Students.push([sid(i), sid(i).toLowerCase() + '@students.' + DOMAIN, name, initials(name), 2024, 'Active', SUPPORT[i] || '']);
    t.Enrolments.push(['E' + pad(i, 4), sid(i), YEAR, LEVEL, CLASS, YEAR + '-01-02', '']);
  });
  STAFF.forEach(function (s) { t.StaffRoles.push([s[0] + '@' + DOMAIN, s[1], YEAR, s[2], s[3], s[4], s[5]]); });

  var rid = 0;
  function reflect(i, cycle, code, value, text, when, scan) {
    rid++;
    t.Reflections.push(['R' + pad(rid, 5), sid(i), YEAR, cycle, code, value, text, when, scan || 'Not needed']);
  }
  for (var i = 1; i <= NAMES.length; i++) {
    if (didStartOfYear(i)) {
      var w = stamp(1, 12, 30);
      reflect(i, 'Start of year', 'AM01', '', pick(GOOD_AT), w);
      reflect(i, 'Start of year', 'AM02', pick(VALUES), '', w);
      reflect(i, 'Start of year', 'AM03', '', pick(OUTSIDE), w);
      reflect(i, 'Start of year', 'GL01', '', pick(LEARNING_GOALS), w);
      reflect(i, 'Start of year', 'GL02', '', pick(CHAR_GOALS), w);
      reflect(i, 'Start of year', 'GL03', '', pick(PERSONAL_GOALS), w);
    }
    if (didTerm1(i)) {
      var w1 = stamp(3, 9, 13);
      var flagged = !!FLAGGED[i];
      reflect(i, 'Term 1 end', 'CI01', String(flagged ? 2 : pick([3, 4, 4, 5, 5])), '', w1, 'Cleared');
      reflect(i, 'Term 1 end', 'CI02', i === 19 ? 'No one' : pick(HELP), '', w1, 'Cleared');
      reflect(i, 'Term 1 end', 'CI03', '', flagged ? FLAGGED[i] : pick(WORRIES), w1, flagged ? 'Flagged' : 'Cleared');
      reflect(i, 'Term 1 end', 'LN01', String(pick([2, 3, 3, 4, 4, 5])), '', w1);
      reflect(i, 'Term 1 end', 'LN02', '', pick(LEARN_BEST), w1);
      reflect(i, 'Term 1 end', 'GR02', '', pick(CHAR_PROGRESS), w1);
    }
  }

  var aid = 0;
  for (i = 1; i <= NAMES.length; i++) {
    SUBJECTS.forEach(function (s) {
      aid++;
      var subj = s[0], max = s[1];
      // Roughly bell shaped scores around 72 percent.
      var spread = (rand() + rand() + rand() - 1.5) * 0.28 * max;
      var actual = Math.max(4, Math.min(max, Math.round(0.72 * max + spread)));
      var target = '', goal = '', gap = '';
      if (didStartOfYear(i)) {
        target = Math.min(max, Math.round((0.65 + rand() * 0.25) * max));
        goal = pick(PROCESS_GOALS[subj]);
        if (i <= 20 && rand() < 0.3) gap = pick(actual >= target ? GAP_ABOVE : GAP_BELOW);
      }
      t.Academic.push(['A' + pad(aid, 4), sid(i), YEAR, LEVEL, subj, 'WA1', target, goal, actual, max, gap, '']);
    });
  }

  [[1, 'placeholder:artwork', 'My poster for Racial Harmony Day.', 'GL02'],
   [3, 'placeholder:science', 'Our plant growth experiment. Mine grew the tallest.', 'GL01'],
   [5, 'placeholder:sports', 'Second place in the class relay race.', 'GL03'],
   [10, 'placeholder:cca', 'My first performance with the school choir.', ''],
   [14, 'placeholder:via', 'Making cards for the elderly at the community centre.', 'GL02'],
   [20, 'placeholder:writing', 'My composition that was read out in class.', 'GL01']
  ].forEach(function (e, k) {
    t.Evidence.push(['EV' + pad(k + 1, 3), sid(e[0]), 'My Growth', e[1], e[2], e[3], YEAR, stamp(3, 1, 20)]);
  });

  function reflectionRef(i, code) {
    var row = t.Reflections.filter(function (r) { return r[1] === sid(i) && r[4] === code; })[0];
    return 'Reflections:' + row[0];
  }
  function academicRef(i, subj) {
    var row = t.Academic.filter(function (r) { return r[1] === sid(i) && r[4] === subj; })[0];
    return 'Academic:' + row[0];
  }
  var FT = 'lim.peishan@' + DOMAIN;
  [[1, reflectionRef(1, 'GL02'), FT, 'Form Teacher', 'This is a thoughtful goal. I have seen you being more patient during group work. Keep it up.', 'Written by teacher', 'Released'],
   [2, reflectionRef(2, 'GL01'), FT, 'Form Teacher', 'A clear and specific goal. Try to set a small weekly target so you can track your progress.', 'Written by teacher', 'Released'],
   [3, 'Section:My Growth', FT, 'Form Teacher', 'Your plant experiment showed great curiosity. Well done for recording your observations carefully.', 'Written by teacher', 'Released'],
   [6, academicRef(6, 'Mathematics'), 'ravi.chandran@' + DOMAIN, 'Subject Teacher', 'Good effort in WA1. Your process goal of checking your working is the right one. Let us practise it together.', 'Written by teacher', 'Released'],
   [8, academicRef(8, 'Science'), 'wong.meiling@' + DOMAIN, 'Subject Teacher', 'You used keywords well in the open-ended questions. Aim to explain the reason fully in each answer.', 'Written by teacher', 'Released'],
   [9, reflectionRef(9, 'GR02'), FT, 'Form Teacher', 'I am proud of how you kept trying this term. Your persistence is showing.', 'Written by teacher', 'Approved'],
   [11, reflectionRef(11, 'GL01'), FT, 'Form Teacher', 'AP has set a clear learning goal. Suggest pairing it with a simple weekly log so progress is visible.', 'AI draft', 'Draft'],
   [13, reflectionRef(13, 'GR02'), FT, 'Form Teacher', 'AY reflected honestly on the character goal. Encourage one specific example of kindness next term.', 'AI draft', 'Draft'],
   [16, academicRef(16, 'English'), FT, 'Subject Teacher', 'Your English result is close to your target. Keep reading every night.', 'Written by teacher', 'Draft']
  ].forEach(function (f, k) {
    t.Feedback.push(['F' + pad(k + 1, 4), sid(f[0]), f[1], f[2], f[3], f[4], f[5], f[6], YEAR, stamp(3, 15, 25)]);
  });

  return t;
}
