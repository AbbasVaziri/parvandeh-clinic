/**
 * Generates supabase/seed/fake-patients.sql with fake Persian patient records
 * (+ a sprinkle of examinations) so the clinic can test search & UI at scale.
 *
 * Usage:  node scripts/generate-fake-data.mjs [count]   (default 10000)
 * Then run the generated file against your PostgreSQL database.
 * Deterministic output (seeded RNG) — same file every run.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";

const COUNT = Number(process.argv[2] ?? 10000);
const EXAM_RATE = 0.08; // ~8% of patients have 1–3 exams

/* ------------------------- seeded RNG ------------------------- */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(42);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const int = (min, max) => min + Math.floor(rnd() * (max - min + 1));

/* ------------------------- name banks ------------------------- */
const FIRST_NAMES = [
  "علی","محمد","رضا","حسین","مهدی","امیر","احمد","حسن","سعید","محمود",
  "مصطفی","بهنام","بهزاد","کامران","فرهاد","بابک","آرش","سامان","کیوان","نیما",
  "فاطمه","زهرا","مریم","سارا","نرگس","لیلا","مرضیه","الهام","شیرین","پریسا",
  "نازنین","مینا","رویا","سمانه","هدیه","یاسمن","نگار","الهه","درسا","آیدا",
];
const LAST_NAMES = [
  "احمدی","محمدی","حسینی","رضایی","کریمی","موسوی","جعفری","صادقی","نوری","قاسمی",
  "شریفی","اکبری","علوی","مرادی","حسنی","کاظمی","رحیمی","افشار","یزدانی","فرهادی",
  "امینی","صالحی","توکلی","حیدری","نجفی","مقدم","نظری","بهرامی","انصاری","خسروی",
  "طاهری","عباسی","زمانی","ملکی","سیفی","هدایتی","سلمانی","کرمانی","تهرانی","اصفهانی",
];
const CITIES = [
  "تهران","مشهد","اصفهان","شیراز","تبریز","کرج","قم","اهواز","رشت","یزد",
  "کرمان","همدان","اراک","سنندج","بندرعباس",
];
const NOTE_SAMPLES = [
  "بیمار قدیمی کلینیک؛ پرونده کاغذی قبلی موجود است.",
  "حساسیت فصلی دارد؛ عینک مطالعه استفاده می‌کند.",
  "فارسی‌زبان؛ تماس ترجیحاً بعدازظهر.",
  "کارمند شرکت؛ ساعت مراجعه محدود است.",
  "پرونده خانوادگی (همسر و فرزند نیز مراجعه‌کننده).",
  null, null, null,
];
const VA_VALUES = ["6/6","6/5","6/9","6/12","6/18","6/24","6/36","CF","HM","PL"];
const EXAM_NOTES = [
  "فوندوس طبیعی؛ DIOD سالم.",
  "خشکی چشم خفیف؛ اشک مصنوعی تجویز شد.",
  "کنترل بعدی ۶ ماه دیگر.",
  "افت V/A چپ نسبت به معاینه قبل.",
  "پاپیل قرنیه شفاف؛ IOP در محدوده طبیعی.",
  null,
];

/* ------------------------- generators ------------------------- */
const usedIds = new Set();

function genNationalId() {
  while (true) {
    const digits = Array.from({ length: 9 }, () => int(0, 9));
    if (new Set(digits).size === 1) continue; // skip all-same
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i);
    const r = sum % 11;
    const check = r < 2 ? r : 11 - r;
    const code = digits.join("") + check;
    if (!usedIds.has(code)) {
      usedIds.add(code);
      return code;
    }
  }
}

function genMobile() {
  const prefixes = ["0912","0911","0919","0913","0921","0935","0936","0937","0938","0939","0901","0902","0903","0990","0991","0992","0993","0994","0995","0996"];
  return pick(prefixes) + String(int(1000000, 9999999));
}

function genBirthDate() {
  const y = int(1948, 2008);
  const m = String(int(1, 12)).padStart(2, "0");
  const d = String(int(1, 28)).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function genExamData() {
  const num = (min, max) => Number((rnd() * (max - min) + min).toFixed(2));
  const va = () => pick(VA_VALUES);
  const axis = () => int(0, 180);
  return JSON.stringify({
    va: { od: { sc: va(), cc: va() }, os: { sc: va(), cc: va() } },
    refraction: {
      od: { sph: num(-6, 3), cyl: num(-3, 0), axis: axis() },
      os: { sph: num(-6, 3), cyl: num(-3, 0), axis: axis() },
    },
    custom: [],
  });
}

const esc = (s) => s.replace(/'/g, "''");
const sqlText = (s) => (s ? `'${esc(s)}'` : "null");

/* ------------------------- build rows ------------------------- */
const patientRows = [];
const examRows = [];

for (let i = 0; i < COUNT; i++) {
  const id = randomUUID();
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const address =
    rnd() < 0.5 ? `${pick(CITIES)}، خیابان ${pick(LAST_NAMES)}، پلاک ${int(1, 200)}` : null;

  patientRows.push(
    `('${id}', '${esc(first)}', '${esc(last)}', '${genNationalId()}', '${genMobile()}', '${genBirthDate()}'` +
    `, ${sqlText(address)}, ${sqlText(pick(NOTE_SAMPLES))}, null)`
  );

  if (rnd() < EXAM_RATE) {
    const n = int(1, 3);
    for (let k = 0; k < n; k++) {
      const daysAgo = int(0, 730);
      const dt = new Date(Date.now() - daysAgo * 86400000);
      dt.setHours(int(8, 19), int(0, 59), 0, 0);
      examRows.push(
        `('${randomUUID()}', '${id}', '${dt.toISOString()}', '${esc(genExamData())}'::jsonb, ` +
        `${sqlText(pick(EXAM_NOTES))}, null)`
      );
    }
  }
}

/* ------------------------- write SQL ------------------------- */
function chunkedInserts(table, columns, rows, chunkSize) {
  const out = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    out.push(
      `insert into public.${table} (${columns}) values\n  ` +
      chunk.join(",\n  ") +
      "\non conflict do nothing;"
    );
  }
  return out.join("\n\n");
}

const sql =
  `-- ============================================================================\n` +
  `-- TEST DATA (fake): ${COUNT} patients + ${examRows.length} examinations\n` +
  `-- Generated by scripts/generate-fake-data.mjs — safe to run multiple times.\n` +
  `-- Remove later with:\n` +
  `--   truncate table public.examinations, public.patients cascade;\n` +
  `--   (warning: deletes ALL patients — only do this while testing)\n` +
  `-- ============================================================================\n\n` +
  chunkedInserts(
    "patients",
    "id, first_name, last_name, national_id, mobile, birth_date, address, notes, avatar_path",
    patientRows,
    500
  ) +
  "\n\n" +
  (examRows.length
    ? chunkedInserts(
        "examinations",
        "id, patient_id, exam_date, data, notes, created_by",
        examRows,
        500
      )
    : "") +
  "\n";

mkdirSync("supabase/seed", { recursive: true });
writeFileSync("supabase/seed/fake-patients.sql", sql);

console.log(
  `✓ wrote supabase/seed/fake-patients.sql — ${COUNT} patients, ${examRows.length} exams`
);
