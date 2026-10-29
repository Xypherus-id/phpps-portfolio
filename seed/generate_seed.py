"""Generate fictional seed data for the PHPPS portfolio prototype.

All names are invented. No NRIC or Birth Certificate numbers are produced.
Outputs:
  seed/PHPPS_Portfolio_Data.xlsx  (eight tabs, one per table, for Google Sheets)
  seed/seed.json                  (same data, for the local test harness)
Run: python3 seed/generate_seed.py
"""
import json
import os
import random

from openpyxl import Workbook

random.seed(2027)
HERE = os.path.dirname(os.path.abspath(__file__))
YEAR = 2027
CLASS = "4F1"
LEVEL = "P4"
DOMAIN = "phpps.example"  # .example is a reserved domain, so no real mailbox

# Column lists must match apps-script/Config.gs exactly.
COLUMNS = {
    "Students": ["student_id", "google_account", "display_name", "initials", "entry_year", "status", "support_flags"],
    "Enrolments": ["enrolment_id", "student_id", "year", "level", "class", "start_date", "end_date"],
    "StaffRoles": ["staff_email", "staff_name", "year", "role", "scope_type", "scope_value", "subject"],
    "Prompts": ["prompt_code", "section", "domain", "prompt_text", "response_type", "options", "levels", "cycle", "sensitive"],
    "Reflections": ["response_id", "student_id", "year", "cycle", "prompt_code", "response_value", "response_text", "submitted_at", "scan_status"],
    "Academic": ["record_id", "student_id", "year", "level", "subject", "assessment", "target_score", "process_goal", "actual_score", "max_score", "gap_reflection", "learning_goal"],
    "Evidence": ["evidence_id", "student_id", "section", "file_path", "caption", "linked_goal", "year", "created_at"],
    "Feedback": ["feedback_id", "student_id", "target_record", "author_email", "author_role", "comment_text", "source", "release_status", "year", "created_at"],
}

NAMES = [
    "Tan Jia Hui", "Muhammad Irfan bin Rosli", "Aarav Krishnan", "Chloe Lim Xin Yi",
    "Nur Aisyah binte Hamzah", "Ethan Goh Zhi Hao", "Kavya Ramesh", "Lucas Chua Wen Jie",
    "Siti Zulaikha binte Osman", "Ryan Teo Kai Xuan", "Ananya Pillai", "Isaac Ng Jun Wei",
    "Amirah binte Yusof", "Megan Yeo Hui Min", "Arjun Nair", "Javier Seah Yi Heng",
    "Hannah Rodrigues", "Daniel Ho Jun Kai", "Nurul Iman binte Jamil", "Sophie Koh Le Xuan",
    "Rayyan bin Mohd Fadzil", "Priya Subramaniam", "Marcus Low Wei Ming", "Zara Fernandez",
    "Caleb Toh Rui En", "Aisyah Rahmat", "Nathan Quek Zheng Yu", "Ishaan Menon",
    "Faith Ang Shu Ting", "Haziq bin Abdul Rahim",
]

# Students 26 to 30 are incomplete: 26 and 27 did Start of Year only; 28 to 30 did nothing.
SOY_DONE = set(range(1, 28))
T1_DONE = set(range(1, 26))
FLAGGED = {4: "Some older pupils keep teasing me and pushing me at recess. I feel scared to go to the canteen.",
           12: "I cry a lot at night because my parents keep quarrelling. I feel alone at home.",
           19: "Someone in my class says mean things about me in the class chat and tells others not to play with me."}
SUPPORT = {7: "Learning support programme (literacy)", 15: "Access arrangements for examinations", 23: "Financial assistance scheme"}

STAFF = [
    ("lim.peishan", "Ms Lim Pei Shan", "Form Teacher", "Class", CLASS, ""),
    ("lim.peishan", "Ms Lim Pei Shan", "Subject Teacher", "Class", CLASS, "English"),
    ("ravi.chandran", "Mr Ravi Chandran", "Subject Teacher", "Class", CLASS, "Mathematics"),
    ("wong.meiling", "Mrs Wong Mei Ling", "Subject Teacher", "Class", CLASS, "Science"),
    ("siti.aminah", "Mdm Siti Aminah", "Subject Teacher", "Class", CLASS, "Mother Tongue"),
    ("benjamin.koh", "Mr Benjamin Koh", "YH", "Level", LEVEL, ""),
    ("hafiz.salleh", "Mr Hafiz Salleh", "AYH", "Level", LEVEL, ""),
    ("farah.iskandar", "Ms Farah Iskandar", "LM", "Level", LEVEL, ""),
    ("ong.junhao", "Mr Ong Jun Hao", "HOD", "Subject", "Science", "Science"),
    ("grace.ho", "Ms Grace Ho", "SENO", "School", "PHPPS", ""),
    ("angela.tay", "Mrs Angela Tay", "School Leader", "School", "PHPPS", ""),
    ("alvin.teo", "Mr Alvin Teo", "Admin", "School", "PHPPS", ""),
]

ALL_LEVELS = "P1; P2; P3; P4; P5; P6"
TERM_ENDS = "Term 1 end; Term 2 end; Term 3 end; Term 4 end"
PROMPTS = [
    ("AM01", "About Me", "Personal", "What are you good at?", "Short text", "", ALL_LEVELS, "Start of year", "No"),
    ("AM02", "About Me", "Character", "Which school value describes you best?", "Multiple choice",
     "Respect; Responsibility; Resilience; Integrity; Care; Harmony", ALL_LEVELS, "Start of year", "No"),
    ("AM03", "About Me", "Personal", "What do you enjoy doing outside of school?", "Short text", "", ALL_LEVELS, "Start of year", "No"),
    ("GL01", "My Goals", "Academic", "What is one learning goal you have for this year?", "Long text", "", ALL_LEVELS, "Start of year", "No"),
    ("GL02", "My Goals", "Character", "What is one character goal you have for this year? How will you work on it?", "Long text", "", ALL_LEVELS, "Start of year", "No"),
    ("GL03", "My Goals", "Personal", "What is one personal goal you have for this year?", "Short text", "", ALL_LEVELS, "Start of year", "No"),
    ("CI01", "Check-ins", "Wellbeing", "How do you feel about school this term? (1 means not happy at all, 5 means very happy)", "Scale",
     "1; 2; 3; 4; 5", ALL_LEVELS, TERM_ENDS, "Yes"),
    ("CI02", "Check-ins", "Wellbeing", "Who do you usually go to when you need help?", "Multiple choice",
     "Parent or guardian; Form teacher; Friend; Brother or sister; School counsellor; No one", ALL_LEVELS, TERM_ENDS, "Yes"),
    ("CI03", "Check-ins", "Wellbeing", "Is there anything worrying you that you would like a teacher to know?", "Long text", "", ALL_LEVELS, TERM_ENDS, "Yes"),
    ("LN01", "My Learning", "Academic", "How confident do you feel about your learning this term? (1 means not confident, 5 means very confident)", "Scale",
     "1; 2; 3; 4; 5", "P3; P4; P5; P6", TERM_ENDS, "No"),
    ("LN02", "My Learning", "Academic", "What helped you learn best this term?", "Long text", "", ALL_LEVELS, TERM_ENDS, "No"),
    ("GR01", "My Growth", "Personal", "Share a photo of something you are proud of, and say why.", "Photo", "", ALL_LEVELS, "Start of year; " + TERM_ENDS + "; End of year", "No"),
    ("GR02", "My Growth", "Character", "How did you work on your character goal this term?", "Long text", "", ALL_LEVELS, TERM_ENDS, "No"),
]

GOOD_AT = ["Drawing animals", "Solving puzzles", "Running fast", "Reading story books", "Helping my friends", "Playing the piano",
           "Building with Lego", "Swimming", "Telling jokes", "Writing stories", "Football", "Remembering facts about space"]
OUTSIDE = ["Cycling at the park with my family", "Baking cookies with my grandmother", "Playing badminton", "Reading comics",
           "Visiting the library", "Taking care of my fish", "Watching nature documentaries", "Practising silat",
           "Playing chess with my father", "Dancing", "Drawing on my tablet", "Going to the beach"]
LEARNING_GOALS = ["I want to improve my problem sums in Mathematics by checking my working.",
                  "I want to read one English story book every week.",
                  "I want to explain Science answers using the right keywords.",
                  "I want to write longer compositions with better vocabulary.",
                  "I want to speak more confidently in Mother Tongue oral.",
                  "I want to finish my homework on time without being reminded.",
                  "I want to learn my multiplication tables up to 12 by heart."]
CHAR_GOALS = ["I want to be more patient with my younger brother. I will count to five before I respond.",
              "I want to be more responsible. I will pack my school bag every night.",
              "I want to be kinder to classmates. I will invite someone new to play at recess.",
              "I want to be braver. I will put up my hand to answer at least once a day.",
              "I want to show respect by listening without interrupting.",
              "I want to be more resilient. When I get something wrong, I will try again instead of giving up."]
PERSONAL_GOALS = ["Learn to swim 50 metres", "Read 30 books this year", "Make two new friends", "Sleep before 10 pm",
                  "Learn to cook fried rice", "Practise the piano every day", "Join the school football team"]
HELP_ANSWERS = ["Parent or guardian", "Parent or guardian", "Form teacher", "Friend", "Brother or sister", "Parent or guardian"]
WORRIES_SAFE = ["", "", "", "No, I am fine.", "I am a bit worried about my Mathematics test.", "Nothing for now.",
                "I am nervous about the swimming test.", "I miss my best friend who moved to another school."]
LEARN_BEST = ["When my teacher showed us with real objects.", "Doing group work with my friends.", "Practising with past questions.",
              "Watching the videos in class.", "When I asked questions after class.", "Using mind maps to revise."]
CHAR_PROGRESS = ["I counted to five most of the time, but sometimes I forgot.", "I packed my bag every night except twice.",
                 "I invited Kai Xuan to play with us and now we are friends.", "I put up my hand more often in Science.",
                 "I tried to listen more. My teacher noticed it.", "I tried again when I made mistakes in my spelling."]

SUBJECTS = {"English": 30, "Mathematics": 25, "Science": 20, "Mother Tongue": 30}
PROCESS_GOALS = {
    "English": ["I will read for 20 minutes every night.", "I will learn five new words every week.", "I will check my spelling before I hand in my work."],
    "Mathematics": ["I will practise ten problem sums every weekend.", "I will check my working step by step.", "I will ask my teacher when I do not understand."],
    "Science": ["I will revise the keywords for each topic.", "I will use the CER method to answer open-ended questions.", "I will redo my wrong questions."],
    "Mother Tongue": ["I will speak Mother Tongue at home for 15 minutes a day.", "I will read one Mother Tongue story every week.", "I will practise writing ten words a day."],
}
GAP_ABOVE = ["I did better than my target because I practised a lot.", "Reading every night helped me understand the questions."]
GAP_BELOW = ["I did not reach my target because I was careless in the last section.", "I ran out of time. Next time I will skip difficult questions first.",
             "I forgot some keywords. I will make flash cards.", "I did not understand the question. I will read it twice next time."]


def initials(name):
    parts = [p for p in name.split() if p.lower() not in ("bin", "binte")]
    return "".join(p[0] for p in parts).upper()


def stamp(month, day_lo, day_hi):
    return f"{YEAR}-{month:02d}-{random.randint(day_lo, day_hi):02d} {random.randint(8, 16):02d}:{random.choice(['05','12','20','34','41','58'])}"


def build():
    t = {k: [] for k in COLUMNS}
    for i, name in enumerate(NAMES, start=1):
        sid = f"S{YEAR}-{i:04d}"
        t["Students"].append([sid, f"{sid.lower()}@students.{DOMAIN}", name, initials(name), 2024, "Active", SUPPORT.get(i, "")])
        t["Enrolments"].append([f"E{i:04d}", sid, YEAR, LEVEL, CLASS, f"{YEAR}-01-02", ""])
    for email, nm, role, stype, sval, subj in STAFF:
        t["StaffRoles"].append([f"{email}@{DOMAIN}", nm, YEAR, role, stype, sval, subj])
    t["Prompts"] = [list(p) for p in PROMPTS]

    rid = 0

    def add(sid, cycle, code, value="", text="", when="", scan="Not needed"):
        nonlocal rid
        rid += 1
        t["Reflections"].append([f"R{rid:05d}", sid, YEAR, cycle, code, value, text, when, scan])

    for i in range(1, 31):
        sid = f"S{YEAR}-{i:04d}"
        if i in SOY_DONE:
            when = stamp(1, 12, 30)
            add(sid, "Start of year", "AM01", text=random.choice(GOOD_AT), when=when)
            add(sid, "Start of year", "AM02", value=random.choice(["Respect", "Responsibility", "Resilience", "Integrity", "Care", "Harmony"]), when=when)
            add(sid, "Start of year", "AM03", text=random.choice(OUTSIDE), when=when)
            add(sid, "Start of year", "GL01", text=random.choice(LEARNING_GOALS), when=when)
            add(sid, "Start of year", "GL02", text=random.choice(CHAR_GOALS), when=when)
            add(sid, "Start of year", "GL03", text=random.choice(PERSONAL_GOALS), when=when)
        if i in T1_DONE:
            when = stamp(3, 9, 13)
            flagged = i in FLAGGED
            add(sid, "Term 1 end", "CI01", value=str(2 if flagged else random.choice([3, 4, 4, 5, 5])), when=when, scan="Cleared")
            add(sid, "Term 1 end", "CI02", value=("No one" if i == 19 else random.choice(HELP_ANSWERS)), when=when, scan="Cleared")
            add(sid, "Term 1 end", "CI03", text=(FLAGGED[i] if flagged else random.choice(WORRIES_SAFE)), when=when,
                scan="Flagged" if flagged else "Cleared")
            add(sid, "Term 1 end", "LN01", value=str(random.choice([2, 3, 3, 4, 4, 5])), when=when)
            add(sid, "Term 1 end", "LN02", text=random.choice(LEARN_BEST), when=when)
            add(sid, "Term 1 end", "GR02", text=random.choice(CHAR_PROGRESS), when=when)

    aid = 0
    gap_count = 0
    for i in range(1, 31):
        sid = f"S{YEAR}-{i:04d}"
        for subj, mx in SUBJECTS.items():
            aid += 1
            actual = max(4, min(mx, round(random.gauss(0.72 * mx, 0.14 * mx))))
            if i in SOY_DONE:
                target = min(mx, round(random.uniform(0.65, 0.9) * mx))
                pgoal = random.choice(PROCESS_GOALS[subj])
            else:
                target, pgoal = "", ""
            gap = ""
            if target != "" and i <= 20 and random.random() < 0.3:
                gap = random.choice(GAP_ABOVE if actual >= target else GAP_BELOW)
                gap_count += 1
            t["Academic"].append([f"A{aid:04d}", sid, YEAR, LEVEL, subj, "WA1", target, pgoal, actual, mx, gap, ""])

    evidence = [
        (1, "My Growth", "placeholder:artwork", "My poster for Racial Harmony Day.", "GL02"),
        (3, "My Growth", "placeholder:science", "Our plant growth experiment. Mine grew the tallest.", "GL01"),
        (5, "My Growth", "placeholder:sports", "Second place in the class relay race.", "GL03"),
        (10, "My Growth", "placeholder:cca", "My first performance with the school choir.", ""),
        (14, "My Growth", "placeholder:via", "Making cards for the elderly at the community centre.", "GL02"),
        (20, "My Growth", "placeholder:writing", "My composition that was read out in class.", "GL01"),
    ]
    for n, (i, sec, path, cap, goal) in enumerate(evidence, start=1):
        t["Evidence"].append([f"EV{n:03d}", f"S{YEAR}-{i:04d}", sec, path, cap, goal, YEAR, stamp(3, 1, 20)])

    def rec(i, code, cycle):
        sid = f"S{YEAR}-{i:04d}"
        for r in t["Reflections"]:
            if r[1] == sid and r[4] == code and r[3] == cycle:
                return f"Reflections:{r[0]}"
        raise ValueError((i, code))

    def acad(i, subj):
        sid = f"S{YEAR}-{i:04d}"
        for r in t["Academic"]:
            if r[1] == sid and r[4] == subj:
                return f"Academic:{r[0]}"

    ft = f"lim.peishan@{DOMAIN}"
    feedback = [
        (1, rec(1, "GL02", "Start of year"), ft, "Form Teacher", "This is a thoughtful goal. I have seen you being more patient during group work. Keep it up.", "Written by teacher", "Released"),
        (2, rec(2, "GL01", "Start of year"), ft, "Form Teacher", "A clear and specific goal. Try to set a small weekly target so you can track your progress.", "Written by teacher", "Released"),
        (3, "Section:My Growth", ft, "Form Teacher", "Your plant experiment showed great curiosity. Well done for recording your observations carefully.", "Written by teacher", "Released"),
        (6, acad(6, "Mathematics"), f"ravi.chandran@{DOMAIN}", "Subject Teacher", "Good effort in WA1. Your process goal of checking your working is the right one. Let us practise it together.", "Written by teacher", "Released"),
        (8, acad(8, "Science"), f"wong.meiling@{DOMAIN}", "Subject Teacher", "You used keywords well in the open-ended questions. Aim to explain the reason fully in each answer.", "Written by teacher", "Released"),
        (9, rec(9, "GR02", "Term 1 end"), ft, "Form Teacher", "I am proud of how you kept trying this term. Your persistence is showing.", "Written by teacher", "Approved"),
        (11, rec(11, "GL01", "Start of year"), ft, "Form Teacher", "AK has set a clear reading goal. Suggest pairing it with a simple weekly log so progress is visible.", "AI draft", "Draft"),
        (13, rec(13, "GR02", "Term 1 end"), ft, "Form Teacher", "AY reflected honestly on the character goal. Encourage one specific example of kindness next term.", "AI draft", "Draft"),
        (16, acad(16, "English"), ft, "Subject Teacher", "Your English result is close to your target. Keep reading every night.", "Written by teacher", "Draft"),
    ]
    for n, (i, target, author, role, text, src, status) in enumerate(feedback, start=1):
        t["Feedback"].append([f"F{n:04d}", f"S{YEAR}-{i:04d}", target, author, role, text, src, status, YEAR, stamp(3, 15, 25)])

    inits = [r[3] for r in t["Students"]]
    assert len(set(inits)) == len(inits), "initials must be unique"
    for table, rows in t.items():
        for r in rows:
            assert len(r) == len(COLUMNS[table]), (table, r)
    return t, gap_count


def main():
    tables, gaps = build()
    wb = Workbook()
    wb.remove(wb.active)
    for name, cols in COLUMNS.items():
        ws = wb.create_sheet(name)
        ws.append(cols)
        for r in tables[name]:
            ws.append(r)
    wb.save(os.path.join(HERE, "PHPPS_Portfolio_Data.xlsx"))
    out = {name: [dict(zip(COLUMNS[name], r)) for r in rows] for name, rows in tables.items()}
    with open(os.path.join(HERE, "seed.json"), "w") as f:
        json.dump({"columns": COLUMNS, "tables": out}, f, indent=1)
    for name in COLUMNS:
        print(f"{name:12s} {len(tables[name]):4d} rows")
    print("gap reflections:", gaps)


if __name__ == "__main__":
    main()
