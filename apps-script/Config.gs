/**
 * Config.gs
 * Settings shared by every other file. Change values here, not elsewhere.
 */

var CONFIG = {
  APP_TITLE: 'PHPPS Student Portfolio',
  SCHOOL: 'PHPPS',
  CURRENT_YEAR: 2027,

  // One entry per table. The Sheet must have a tab with this exact name
  // and a header row with these exact column names, in this order.
  TABLES: {
    Students: ['student_id', 'google_account', 'display_name', 'initials', 'entry_year', 'status', 'support_flags'],
    Enrolments: ['enrolment_id', 'student_id', 'year', 'level', 'class', 'start_date', 'end_date'],
    StaffRoles: ['staff_email', 'staff_name', 'year', 'role', 'scope_type', 'scope_value', 'subject'],
    Prompts: ['prompt_code', 'section', 'domain', 'prompt_text', 'response_type', 'options', 'levels', 'cycle', 'sensitive'],
    Reflections: ['response_id', 'student_id', 'year', 'cycle', 'prompt_code', 'response_value', 'response_text', 'submitted_at', 'scan_status'],
    Academic: ['record_id', 'student_id', 'year', 'level', 'subject', 'assessment', 'target_score', 'process_goal', 'actual_score', 'max_score', 'gap_reflection', 'learning_goal'],
    Evidence: ['evidence_id', 'student_id', 'section', 'file_path', 'caption', 'linked_goal', 'year', 'created_at'],
    Feedback: ['feedback_id', 'student_id', 'target_record', 'author_email', 'author_role', 'comment_text', 'source', 'release_status', 'year', 'created_at']
  },

  SECTIONS: ['About Me', 'My Goals', 'Check-ins', 'My Learning', 'My Growth', 'Feedback'],

  // Cycles students can currently answer. A real system would let an admin open and close these.
  OPEN_CYCLES: ['Start of year', 'Term 1 end'],

  // The assessment students set score targets for, and its maximum score per subject.
  TARGET_ASSESSMENT: { name: 'WA2', max: { 'English': 30, 'Mathematics': 25, 'Science': 20, 'Mother Tongue': 30 } },
  LEVELS_WITH_SCORE_TARGETS: ['P3', 'P4', 'P5', 'P6'],

  // Longest answer accepted, in characters.
  TEXT_LIMITS: { 'Short text': 200, 'Long text': 1500, caption: 200, process_goal: 300, gap_reflection: 1000 },

  // Largest photo accepted after the browser has resized it.
  UPLOAD_MAX_BYTES: 3 * 1024 * 1024,
  UPLOAD_FOLDER_NAME: 'PHPPS Portfolio Uploads (fictional data)',

  // Levels at which each subject is taught. Used for HOD scope (own subject, all levels).
  SUBJECT_LEVELS: {
    'English': ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
    'Mathematics': ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
    'Mother Tongue': ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
    'Science': ['P3', 'P4', 'P5', 'P6']
  },

  // Roles offered in the "View as" switcher, in display order.
  // value is what appears in StaffRoles.role; Student is not a staff role.
  ROLE_OPTIONS: [
    { value: 'Student', label: 'Student' },
    { value: 'Form Teacher', label: 'Form Teacher' },
    { value: 'Subject Teacher', label: 'Subject Teacher' },
    { value: 'YH', label: 'Year Head' },
    { value: 'AYH', label: 'Assistant Year Head' },
    { value: 'LM', label: 'Level Manager' },
    { value: 'HOD', label: 'Head of Department' },
    { value: 'SENO', label: 'SENO' },
    { value: 'School Leader', label: 'School Leader' },
    { value: 'Admin', label: 'System Admin' }
  ],

  // The access matrix from the brief, one row per role.
  // E = create and edit own entries; V = view; C = view and give feedback;
  // A = academic goals only; N = no access.
  // Feedback column: E-own = write own feedback; V-released = view released only.
  ACCESS_MATRIX: {
    'Student':         { 'About Me': 'E', 'My Goals': 'E', 'Check-ins': 'E', 'My Learning': 'E', 'My Growth': 'E', 'Feedback': 'V-released', 'Export': 'None' },
    'Form Teacher':    { 'About Me': 'C', 'My Goals': 'C', 'Check-ins': 'C', 'My Learning': 'C', 'My Growth': 'C', 'Feedback': 'E-own', 'Export': 'Own class' },
    'Subject Teacher': { 'About Me': 'V', 'My Goals': 'A', 'Check-ins': 'N', 'My Learning': 'C-subject', 'My Growth': 'V', 'Feedback': 'E-own', 'Export': 'Own classes, own subject' },
    'YH':              { 'About Me': 'C', 'My Goals': 'C', 'Check-ins': 'C', 'My Learning': 'V', 'My Growth': 'C', 'Feedback': 'E-own', 'Export': 'Own level' },
    'AYH':             { 'About Me': 'C', 'My Goals': 'C', 'Check-ins': 'C', 'My Learning': 'V', 'My Growth': 'C', 'Feedback': 'E-own', 'Export': 'Own level' },
    'LM':              { 'About Me': 'V', 'My Goals': 'V', 'Check-ins': 'N', 'My Learning': 'V', 'My Growth': 'V', 'Feedback': 'V', 'Export': 'Own level' },
    'HOD':             { 'About Me': 'N', 'My Goals': 'A', 'Check-ins': 'N', 'My Learning': 'V-subject', 'My Growth': 'N', 'Feedback': 'V-subject', 'Export': 'Own subject' },
    'SENO':            { 'About Me': 'N', 'My Goals': 'N', 'Check-ins': 'N', 'My Learning': 'N', 'My Growth': 'N', 'Feedback': 'N', 'Export': 'None' },
    'School Leader':   { 'About Me': 'V', 'My Goals': 'V', 'Check-ins': 'V', 'My Learning': 'V', 'My Growth': 'V', 'Feedback': 'V', 'Export': 'Whole school' },
    'Admin':           { 'About Me': 'N', 'My Goals': 'N', 'Check-ins': 'N', 'My Learning': 'N', 'My Growth': 'N', 'Feedback': 'N', 'Export': 'Rosters and roles' }
  },

  // Plain language meaning of each matrix code, shown in the access panel.
  ACCESS_LABELS: {
    'E': 'Create and edit own entries',
    'C': 'View and give feedback',
    'C-subject': 'View and give feedback (own subject)',
    'V': 'View',
    'V-subject': 'View (own subject)',
    'V-released': 'View released comments only',
    'A': 'Academic goals only',
    'E-own': 'Write own comments',
    'N': 'No access'
  },

  // Roles allowed to see Students.support_flags.
  SUPPORT_FLAG_ROLES: ['YH', 'SENO', 'School Leader']
};
