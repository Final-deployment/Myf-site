const Database = require('better-sqlite3');
const db = new Database('/app/data/db.sqlite');

const courseFixes = [
  {
    "id": "course_aqeeda",
    "duration": "4س 19د",
    "duration_en": "4h 19m"
  },
  {
    "id": "course_fiqh1-waseelit",
    "duration": "2س 49د",
    "duration_en": "2h 49m"
  },
  {
    "id": "course_fiqh2-it7af",
    "duration": "2س 48د",
    "duration_en": "2h 48m"
  },
  {
    "id": "course_madkhal",
    "duration": "2س 9د",
    "duration_en": "2h 9m"
  },
  {
    "id": "course_nifas",
    "duration": "1س 37د",
    "duration_en": "1h 37m"
  },
  {
    "id": "course_seerah",
    "duration": "3س 36د",
    "duration_en": "3h 36m"
  },
  {
    "id": "course_tafseer",
    "duration": "1س 20د",
    "duration_en": "1h 20m"
  },
  {
    "id": "course_tazkiyah",
    "duration": "2س 27د",
    "duration_en": "2h 27m"
  },
  {
    "id": "course_arba3oon",
    "duration": "6س 49د",
    "duration_en": "6h 49m"
  }
];

const episodeUpdates = [
  { "id": "ep_1", "duration": "29:02" },
  { "id": "ep_2", "duration": "29:10" },
  { "id": "ep_3", "duration": "22:04" },
  { "id": "ep_4", "duration": "27:02" },
  { "id": "ep_5", "duration": "30:22" },
  { "id": "ep_6", "duration": "27:29" },
  { "id": "ep_7", "duration": "23:04" },
  { "id": "ep_8", "duration": "26:21" },
  { "id": "ep_9", "duration": "20:20" },
  { "id": "ep_10", "duration": "24:51" },
  { "id": "ep_11", "duration": "19:40" },
  { "id": "ep_12", "duration": "16:42" },
  { "id": "ep_13", "duration": "31:39" },
  { "id": "ep_14", "duration": "30:49" },
  { "id": "ep_15", "duration": "31:29" },
  { "id": "ep_16", "duration": "20:41" },
  { "id": "ep_17", "duration": "43:03" },
  { "id": "ep_18", "duration": "30:19" },
  { "id": "ep_19", "duration": "35:10" },
  { "id": "ep_20", "duration": "25:46" },
  { "id": "ep_21", "duration": "16:20" },
  { "id": "ep_22", "duration": "25:21" },
  { "id": "ep_23", "duration": "24:14" },
  { "id": "ep_24", "duration": "33:04" },
  { "id": "ep_25", "duration": "28:13" },
  { "id": "ep_26", "duration": "26:38" },
  { "id": "ep_27", "duration": "28:50" },
  { "id": "ep_28", "duration": "28:54" },
  { "id": "ep_29", "duration": "24:54" },
  { "id": "ep_30", "duration": "22:42" },
  { "id": "ep_31", "duration": "28:01" },
  { "id": "ep_32", "duration": "29:34" },
  { "id": "ep_33", "duration": "30:52" },
  { "id": "ep_34", "duration": "15:26" },
  { "id": "ep_35", "duration": "30:03" },
  { "id": "ep_36", "duration": "25:28" },
  { "id": "ep_37", "duration": "26:27" },
  { "id": "ep_38", "duration": "31:54" },
  { "id": "ep_seerah01", "duration": "23:57" },
  { "id": "ep_seerah02", "duration": "30:04" },
  { "id": "ep_seerah03", "duration": "24:32" },
  { "id": "ep_seerah04", "duration": "22:01" },
  { "id": "ep_seerah05", "duration": "23:37" },
  { "id": "ep_seerah06", "duration": "21:35" },
  { "id": "ep_seerah07", "duration": "25:35" },
  { "id": "ep_seerah08", "duration": "22:33" },
  { "id": "ep_seerah09", "duration": "22:03" },
  { "id": "ep_seerah10", "duration": "00:00" },
  { "id": "tafseer_01", "duration": "31:38" },
  { "id": "tafseer_02", "duration": "28:24" },
  { "id": "tafseer_03", "duration": "20:04" },
  { "id": "tazkiyah_01", "duration": "22:46" },
  { "id": "tazkiyah_02", "duration": "20:06" },
  { "id": "tazkiyah_03", "duration": "22:35" },
  { "id": "tazkiyah_04", "duration": "20:53" },
  { "id": "tazkiyah_05", "duration": "20:15" },
  { "id": "tazkiyah_06", "duration": "17:17" },
  { "id": "tazkiyah_07", "duration": "23:44" },
  { "id": "arba3oon_01", "duration": "24:55" },
  { "id": "arba3oon_02", "duration": "27:26" },
  { "id": "arba3oon_03", "duration": "24:22" },
  { "id": "arba3oon_04", "duration": "18:32" },
  { "id": "arba3oon_05", "duration": "17:07" },
  { "id": "arba3oon_06", "duration": "20:45" },
  { "id": "arba3oon_07", "duration": "24:05" },
  { "id": "arba3oon_08", "duration": "26:47" },
  { "id": "arba3oon_09", "duration": "23:43" },
  { "id": "arba3oon_10", "duration": "31:28" },
  { "id": "arba3oon_11", "duration": "30:41" },
  { "id": "arba3oon_12", "duration": "27:07" },
  { "id": "arba3oon_13", "duration": "30:51" },
  { "id": "arba3oon_14", "duration": "26:25" },
  { "id": "arba3oon_15", "duration": "27:39" },
  { "id": "arba3oon_16", "duration": "27:28" },
  { "id": "ep_madkhal01", "duration": "15:46" },
  { "id": "ep_madkhal02", "duration": "19:28" },
  { "id": "ep_madkhal03", "duration": "19:07" },
  { "id": "ep_madkhal04", "duration": "27:07" },
  { "id": "ep_madkhal05", "duration": "12:32" },
  { "id": "ep_madkhal06", "duration": "34:11" },
  { "id": "ep_madkhal07", "duration": "10:43" },
  { "id": "ep_nifas01", "duration": "13:21" },
  { "id": "ep_nifas02", "duration": "09:59" },
  { "id": "ep_nifas03", "duration": "11:51" },
  { "id": "ep_nifas04", "duration": "10:20" },
  { "id": "ep_nifas05", "duration": "12:47" },
  { "id": "ep_nifas06", "duration": "12:59" },
  { "id": "ep_nifas07", "duration": "10:50" },
  { "id": "ep_nifas08", "duration": "14:26" }
];

const epStmt = db.prepare('UPDATE episodes SET duration = ? WHERE id = ?');
for (const ep of episodeUpdates) {
  if (ep.duration && ep.duration !== '0:00' && ep.duration !== '00:00') {
    epStmt.run(ep.duration, ep.id);
  }
}
console.log('Updated ' + episodeUpdates.length + ' episodes.');

const daysMap = {
  'course_madkhal': 5,
  'course_aqeeda': 15,
  'course_fiqh1-waseelit': 20,
  'course_nifas': 12,
  'course_tafseer': 5,
  'course_tazkiyah': 10,
  'course_seerah': 15,
  'course_arba3oon': 25,
  'course_fiqh2-it7af': 25
};

const cStmt = db.prepare('UPDATE courses SET duration = ?, duration_en = ?, days_available = ?, lessons_count = ? WHERE id = ?');
for (const f of courseFixes) {
  const eps = db.prepare('SELECT COUNT(*) as cnt FROM episodes WHERE courseId = ?').get(f.id);
  const count = eps ? eps.cnt : 0;
  const days = daysMap[f.id] || 30;
  cStmt.run(f.duration, f.duration_en, days, count, f.id);
  console.log('Fixed ' + f.id + ' -> lessons: ' + count + ' | duration: ' + f.duration + ' | days: ' + days);
}
console.log('Done modifying the database!');