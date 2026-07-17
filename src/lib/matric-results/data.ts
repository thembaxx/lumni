interface DemoMatricResult {
  name: string;
  examNumber: string;
  school: string;
  province: string;
  subjects: { name: string; percentage: number }[];
  overall: number;
}

const _provinces = [
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
] as const;

const subjects = [
  "Mathematics",
  "Physical Sciences",
  "English HL",
  "Afrikaans HL",
  "Life Sciences",
  "Geography",
  "History",
  "Accounting",
  "Economics",
  "Business Studies",
  "Life Orientation",
  "Agricultural Sciences",
  "Engineering Graphics",
  "Technical Mathematics",
  "isiZulu HL",
  "isiXhosa HL",
  "Sesotho HL",
  "Setswana HL",
  "Sepedi HL",
  "Xitsonga HL",
  "Tshivenda HL",
  "isiNdebele HL",
  "siSwati HL",
];

interface RawRecord {
  name: string;
  school: string;
  province: string;
  subjectSubset: string[];
}

const rawRecords: RawRecord[] = [
  {
    name: "Amahle Nkosi",
    school: "Soweto High School",
    province: "Gauteng",
    subjectSubset: ["Mathematics", "Physical Sciences", "English HL", "Life Sciences", "Geography"],
  },
  {
    name: "Liam van der Merwe",
    school: "Grey College",
    province: "Free State",
    subjectSubset: ["Mathematics", "Physical Sciences", "English HL", "Accounting", "Economics"],
  },
  {
    name: "Sarah Mthethwa",
    school: "St. Mary's Diocesan",
    province: "KwaZulu-Natal",
    subjectSubset: ["Mathematics", "Physical Sciences", "English HL", "Life Sciences", "Geography"],
  },
  {
    name: "Joshua Jacobs",
    school: "Rondebosch Boys High",
    province: "Western Cape",
    subjectSubset: ["Mathematics", "Physical Sciences", "English HL", "History", "Geography"],
  },
  {
    name: "Priya Pillay",
    school: "Westville Girls High",
    province: "KwaZulu-Natal",
    subjectSubset: ["Mathematics", "Physical Sciences", "English HL", "Life Sciences", "Geography"],
  },
  {
    name: "Thabo Mokoena",
    school: "Parktown Boys High",
    province: "Gauteng",
    subjectSubset: ["Mathematics", "Physical Sciences", "English HL", "Life Sciences", "Geography"],
  },
  {
    name: "Emma Steyn",
    school: "Hoër Meisieskool Bloemfontein",
    province: "Free State",
    subjectSubset: [
      "Mathematics",
      "Physical Sciences",
      "Afrikaans HL",
      "Life Sciences",
      "Geography",
    ],
  },
  {
    name: "Siyabonga Mbeki",
    school: "Mthatha High",
    province: "Eastern Cape",
    subjectSubset: ["Mathematics", "Physical Sciences", "English HL", "History", "Geography"],
  },
  {
    name: "Chloe Williams",
    school: "St. George's College",
    province: "Western Cape",
    subjectSubset: [
      "Mathematics",
      "Physical Sciences",
      "English HL",
      "Life Sciences",
      "Business Studies",
    ],
  },
  {
    name: "Michael Brown",
    school: "Pretoria Boys High",
    province: "Gauteng",
    subjectSubset: ["Mathematics", "Physical Sciences", "English HL", "Accounting", "Economics"],
  },
  {
    name: "Nina de Villiers",
    school: "Rustenburg Girls High",
    province: "Western Cape",
    subjectSubset: ["Mathematics", "Physical Sciences", "English HL", "History", "Geography"],
  },
  {
    name: "Thandeka Dube",
    school: "Girls' High School Pietermaritzburg",
    province: "KwaZulu-Natal",
    subjectSubset: ["Mathematics", "Life Sciences", "English HL", "Geography", "History"],
  },
  {
    name: "Henk van Zyl",
    school: "Affies",
    province: "Gauteng",
    subjectSubset: [
      "Mathematics",
      "Physical Sciences",
      "Afrikaans HL",
      "Engineering Graphics",
      "Technical Mathematics",
    ],
  },
  {
    name: "Zanele Khoza",
    school: "Orlando High",
    province: "Gauteng",
    subjectSubset: ["Mathematics", "Physical Sciences", "English HL", "Life Sciences", "Geography"],
  },
  {
    name: "Isabella Fourie",
    school: "Pretoria Girls High",
    province: "Gauteng",
    subjectSubset: ["Mathematics", "Physical Sciences", "English HL", "Life Sciences", "Geography"],
  },
  {
    name: "Neo Moloto",
    school: "Mamelodi High",
    province: "Gauteng",
    subjectSubset: ["Mathematics", "Physical Sciences", "English HL", "Life Sciences", "Geography"],
  },
  {
    name: "Jade Nel",
    school: "Queens College",
    province: "Eastern Cape",
    subjectSubset: ["Mathematics", "Physical Sciences", "English HL", "History", "Geography"],
  },
  {
    name: "Sibusiso Ndlovu",
    school: "Empangeni High",
    province: "KwaZulu-Natal",
    subjectSubset: ["Mathematics", "Physical Sciences", "English HL", "Geography", "Life Sciences"],
  },
  {
    name: "Anika Greyling",
    school: "Bloemfontein Boys High",
    province: "Free State",
    subjectSubset: ["Mathematics", "Physical Sciences", "Afrikaans HL", "Accounting", "Economics"],
  },
  {
    name: "Kwaku Asante",
    school: "St. Albans College",
    province: "Gauteng",
    subjectSubset: ["Mathematics", "Physical Sciences", "English HL", "Life Sciences", "Geography"],
  },
  {
    name: "Retha Smuts",
    school: "St. Andrew's College",
    province: "Eastern Cape",
    subjectSubset: ["Mathematics", "Physical Sciences", "English HL", "History", "Geography"],
  },
  {
    name: "Mandla Zulu",
    school: "Inanda Seminary",
    province: "KwaZulu-Natal",
    subjectSubset: ["Mathematics", "Life Sciences", "English HL", "Geography", "History"],
  },
  {
    name: "Pieter Smith",
    school: "Paarl Boys High",
    province: "Western Cape",
    subjectSubset: [
      "Mathematics",
      "Physical Sciences",
      "Afrikaans HL",
      "Accounting",
      "Business Studies",
    ],
  },
  {
    name: "Ayanda Mkhize",
    school: "Ohlange High",
    province: "KwaZulu-Natal",
    subjectSubset: ["Mathematics", "Physical Sciences", "English HL", "Life Sciences", "Geography"],
  },
  {
    name: "Wilhelmina Basson",
    school: "Hoërskool Jan van Riebeeck",
    province: "Western Cape",
    subjectSubset: [
      "Mathematics",
      "Physical Sciences",
      "Afrikaans HL",
      "Life Sciences",
      "Geography",
    ],
  },
  {
    name: "Lesego Moiloa",
    school: "Montshiwa High",
    province: "North West",
    subjectSubset: ["Mathematics", "Physical Sciences", "English HL", "Life Sciences", "Geography"],
  },
  {
    name: "Tshiamo Masire",
    school: "Rekopantswe Secondary",
    province: "North West",
    subjectSubset: ["Mathematics", "Accounting", "English HL", "Economics", "Business Studies"],
  },
  {
    name: "Naledi Moroka",
    school: "Mahikeng High",
    province: "North West",
    subjectSubset: ["Mathematics", "Life Sciences", "English HL", "Geography", "History"],
  },
  {
    name: "Mpho Ramaphosa",
    school: "Tshwane High",
    province: "Gauteng",
    subjectSubset: [
      "Mathematics",
      "Physical Sciences",
      "English HL",
      "Accounting",
      "Life Sciences",
    ],
  },
  {
    name: "Lindiwe Nxumalo",
    school: "Durban Girls High",
    province: "KwaZulu-Natal",
    subjectSubset: ["Mathematics", "Life Sciences", "English HL", "isiZulu HL", "Geography"],
  },
  {
    name: "Chrisjan Mostert",
    school: "Diamantveld High",
    province: "Northern Cape",
    subjectSubset: [
      "Mathematics",
      "Physical Sciences",
      "Afrikaans HL",
      "Engineering Graphics",
      "Geography",
    ],
  },
  {
    name: "Katlego Phiri",
    school: "Kuruman High",
    province: "Northern Cape",
    subjectSubset: ["Mathematics", "Life Sciences", "English HL", "Setswana HL", "Geography"],
  },
  {
    name: "Masego Moalusi",
    school: "Kimberley Girls High",
    province: "Northern Cape",
    subjectSubset: [
      "Mathematics",
      "Physical Sciences",
      "English HL",
      "Accounting",
      "Life Sciences",
    ],
  },
  {
    name: "Olivia Marais",
    school: "Hoërskool Upington",
    province: "Northern Cape",
    subjectSubset: ["Mathematics", "Afrikaans HL", "English HL", "Geography", "Life Sciences"],
  },
  {
    name: "Musa Khumalo",
    school: "Pholela High",
    province: "KwaZulu-Natal",
    subjectSubset: [
      "Mathematics",
      "Physical Sciences",
      "English HL",
      "isiZulu HL",
      "Life Sciences",
    ],
  },
  {
    name: "Nomsa Shabangu",
    school: "Hlanganani High",
    province: "Mpumalanga",
    subjectSubset: ["Mathematics", "Life Sciences", "English HL", "Geography", "History"],
  },
  {
    name: "Xolani Nkosi",
    school: "Barberton High",
    province: "Mpumalanga",
    subjectSubset: [
      "Mathematics",
      "Physical Sciences",
      "English HL",
      "Agricultural Sciences",
      "Geography",
    ],
  },
  {
    name: "Megan Snyman",
    school: "Hoërskool Nelspruit",
    province: "Mpumalanga",
    subjectSubset: ["Mathematics", "Afrikaans HL", "English HL", "Accounting", "Business Studies"],
  },
  {
    name: "Buhle Dlamini",
    school: "Mbombela High",
    province: "Mpumalanga",
    subjectSubset: ["Mathematics", "Physical Sciences", "English HL", "Life Sciences", "Geography"],
  },
  {
    name: "Kabelo Moloi",
    school: "Sekhukhune High",
    province: "Limpopo",
    subjectSubset: [
      "Mathematics",
      "Physical Sciences",
      "English HL",
      "Agricultural Sciences",
      "Geography",
    ],
  },
  {
    name: "Ronewa Mudau",
    school: "Makhado High",
    province: "Limpopo",
    subjectSubset: ["Mathematics", "Life Sciences", "English HL", "Tshivenda HL", "Geography"],
  },
  {
    name: "Pfarelo Ramaliba",
    school: "Mbilwi Secondary",
    province: "Limpopo",
    subjectSubset: [
      "Mathematics",
      "Physical Sciences",
      "English HL",
      "Life Sciences",
      "Accounting",
    ],
  },
  {
    name: "Rendani Nemakonde",
    school: "Tshipise High",
    province: "Limpopo",
    subjectSubset: [
      "Mathematics",
      "Physical Sciences",
      "English HL",
      "Agricultural Sciences",
      "Geography",
    ],
  },
  {
    name: "Ndivho Netshitenzhe",
    school: "Louis Trichardt High",
    province: "Limpopo",
    subjectSubset: ["Mathematics", "Life Sciences", "English HL", "Geography", "History"],
  },
  {
    name: "Lerato Mokoena",
    school: "Sekolo sa Borokgo",
    province: "Free State",
    subjectSubset: [
      "Mathematics",
      "Physical Sciences",
      "English HL",
      "Life Sciences",
      "Sesotho HL",
    ],
  },
  {
    name: "Bongani Dlamini",
    school: "Harrismith High",
    province: "Free State",
    subjectSubset: ["Mathematics", "Accounting", "English HL", "Economics", "Business Studies"],
  },
  {
    name: "Mosa Mokhele",
    school: "Lenyora Secondary",
    province: "Free State",
    subjectSubset: ["Mathematics", "Life Sciences", "English HL", "Sesotho HL", "Geography"],
  },
  {
    name: "Teboho Motaung",
    school: "Bethlehem High",
    province: "Free State",
    subjectSubset: ["Mathematics", "Physical Sciences", "English HL", "History", "Geography"],
  },
  {
    name: "Kealeboga Moeketsi",
    school: "Tlotlisang High",
    province: "Free State",
    subjectSubset: [
      "Mathematics",
      "Physical Sciences",
      "English HL",
      "Accounting",
      "Life Sciences",
    ],
  },
  {
    name: "Zimkhitha Mbuli",
    school: "Lumko High",
    province: "Eastern Cape",
    subjectSubset: ["Mathematics", "Life Sciences", "English HL", "isiXhosa HL", "Geography"],
  },
  {
    name: "Sipho Makana",
    school: "Duncan Village High",
    province: "Eastern Cape",
    subjectSubset: [
      "Mathematics",
      "Physical Sciences",
      "English HL",
      "isiXhosa HL",
      "Agricultural Sciences",
    ],
  },
  {
    name: "Asanda Mtwesi",
    school: "Grahamstown High",
    province: "Eastern Cape",
    subjectSubset: ["Mathematics", "Accounting", "English HL", "Economics", "Business Studies"],
  },
  {
    name: "Lilitha Bembe",
    school: "Dale College",
    province: "Eastern Cape",
    subjectSubset: ["Mathematics", "Physical Sciences", "English HL", "Life Sciences", "Geography"],
  },
  {
    name: "Mihlali N Capa",
    school: "Selborne College",
    province: "Eastern Cape",
    subjectSubset: ["Mathematics", "Physical Sciences", "English HL", "History", "Geography"],
  },
  {
    name: "Ethan Fortuin",
    school: "Wynberg Boys High",
    province: "Western Cape",
    subjectSubset: ["Mathematics", "Physical Sciences", "English HL", "Life Sciences", "Geography"],
  },
  {
    name: "Megan October",
    school: "Groote Schuur High",
    province: "Western Cape",
    subjectSubset: ["Mathematics", "Life Sciences", "English HL", "History", "Geography"],
  },
  {
    name: "Fatima Abrahams",
    school: "Belgravia High",
    province: "Western Cape",
    subjectSubset: ["Mathematics", "Life Sciences", "English HL", "Accounting", "Economics"],
  },
  {
    name: "Dylen Peterson",
    school: "Maitland High",
    province: "Western Cape",
    subjectSubset: [
      "Mathematics",
      "Physical Sciences",
      "English HL",
      "Engineering Graphics",
      "Geography",
    ],
  },
  {
    name: "Tayla Jansen",
    school: "Eersterivier Secondary",
    province: "Western Cape",
    subjectSubset: ["Mathematics", "Life Sciences", "English HL", "Afrikaans HL", "Geography"],
  },
  {
    name: "Emily Ndlovu",
    school: "Sandton High",
    province: "Gauteng",
    subjectSubset: [
      "Mathematics",
      "Physical Sciences",
      "English HL",
      "Life Sciences",
      "Business Studies",
    ],
  },
  {
    name: "Ryan Naidu",
    school: "Northwood School",
    province: "KwaZulu-Natal",
    subjectSubset: ["Mathematics", "Physical Sciences", "English HL", "Accounting", "Economics"],
  },
  {
    name: "Megan Govender",
    school: "Brettonwood High",
    province: "KwaZulu-Natal",
    subjectSubset: ["Mathematics", "Life Sciences", "English HL", "History", "Geography"],
  },
  {
    name: "Tumelo Moeti",
    school: "Sehunelo Secondary",
    province: "North West",
    subjectSubset: [
      "Mathematics",
      "Physical Sciences",
      "English HL",
      "Setswana HL",
      "Agricultural Sciences",
    ],
  },
  {
    name: "Onalenna Moeng",
    school: "Ithuteng High",
    province: "North West",
    subjectSubset: ["Mathematics", "Accounting", "English HL", "Economics", "Geography"],
  },
  {
    name: "Gofaone Mooketsi",
    school: "Tlhabane High",
    province: "North West",
    subjectSubset: ["Mathematics", "Life Sciences", "English HL", "Setswana HL", "History"],
  },
  {
    name: "Lorato Mosweu",
    school: "Rustenburg High",
    province: "North West",
    subjectSubset: ["Mathematics", "Physical Sciences", "English HL", "Life Sciences", "Geography"],
  },
  {
    name: "Tsakani Maluleke",
    school: "Valencia High",
    province: "Mpumalanga",
    subjectSubset: ["Mathematics", "Life Sciences", "English HL", "Xitsonga HL", "Geography"],
  },
  {
    name: "Sibusiso Mthembu",
    school: "Pongola High",
    province: "Mpumalanga",
    subjectSubset: [
      "Mathematics",
      "Physical Sciences",
      "English HL",
      "Agriculture",
      "Life Sciences",
    ],
  },
  {
    name: "Jessica Strydom",
    school: "Hoërskool Lydenburg",
    province: "Mpumalanga",
    subjectSubset: ["Mathematics", "Afrikaans HL", "English HL", "Accounting", "Life Sciences"],
  },
  {
    name: "Nandi Hlongwane",
    school: "Siyabuswa High",
    province: "Mpumalanga",
    subjectSubset: ["Mathematics", "Life Sciences", "English HL", "siSwati HL", "Geography"],
  },
  {
    name: "Dineo Mokonyane",
    school: "Amajwawana High",
    province: "Gauteng",
    subjectSubset: ["Mathematics", "Physical Sciences", "English HL", "Setswana HL", "History"],
  },
  {
    name: "Khensani Magwaza",
    school: "Nwamatikana High",
    province: "Limpopo",
    subjectSubset: ["Mathematics", "Life Sciences", "English HL", "Xitsonga HL", "Geography"],
  },
  {
    name: "Brendan Hendricks",
    school: "Soutpan High",
    province: "Northern Cape",
    subjectSubset: [
      "Mathematics",
      "Physical Sciences",
      "Afrikaans HL",
      "English HL",
      "Agricultural Sciences",
    ],
  },
  {
    name: "Marlize van Wyk",
    school: "Hoërskool Barkly-Wes",
    province: "Northern Cape",
    subjectSubset: ["Mathematics", "Afrikaans HL", "English HL", "Geography", "Life Sciences"],
  },
  {
    name: "Itumeleng Moswane",
    school: "Kgoro High",
    province: "Northern Cape",
    subjectSubset: ["Mathematics", "Setswana HL", "English HL", "Life Sciences", "Geography"],
  },
  {
    name: "Thato Tshepo",
    school: "Batswana High",
    province: "North West",
    subjectSubset: [
      "Mathematics",
      "Setswana HL",
      "English HL",
      "Life Sciences",
      "Business Studies",
    ],
  },
  {
    name: "Karabo Seroke",
    school: "Bophelo High",
    province: "Gauteng",
    subjectSubset: [
      "Mathematics",
      "Physical Sciences",
      "English HL",
      "Life Orientation",
      "Geography",
    ],
  },
  {
    name: "Zinzi Mgudlwa",
    school: "Zelela High",
    province: "Eastern Cape",
    subjectSubset: ["Mathematics", "isiXhosa HL", "English HL", "Life Sciences", "History"],
  },
  {
    name: "Ashley Klink",
    school: "Heuwelsig High",
    province: "Free State",
    subjectSubset: [
      "Mathematics",
      "Afrikaans HL",
      "English HL",
      "Geography",
      "Engineering Graphics",
    ],
  },
  {
    name: "Matshidiso Rabotapi",
    school: "Thuto-Thebe Secondary",
    province: "Free State",
    subjectSubset: ["Mathematics", "Setswana HL", "English HL", "Life Sciences", "Accounting"],
  },
  {
    name: "Olebogeng Nthebe",
    school: "Phokeng High",
    province: "North West",
    subjectSubset: ["Mathematics", "Setswana HL", "English HL", "Economics", "Business Studies"],
  },
  {
    name: "Asavela Dotwana",
    school: "Sophitsho High",
    province: "Eastern Cape",
    subjectSubset: ["Mathematics", "isiXhosa HL", "English HL", "Life Sciences", "Geography"],
  },
  {
    name: "Solo Mathebula",
    school: "Shayandima High",
    province: "Limpopo",
    subjectSubset: [
      "Mathematics",
      "Tshivenda HL",
      "English HL",
      "Physical Sciences",
      "Life Sciences",
    ],
  },
  {
    name: "Naledi Moroke",
    school: "Mankweng High",
    province: "Limpopo",
    subjectSubset: ["Mathematics", "Sepedi HL", "English HL", "Life Sciences", "Geography"],
  },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pickRandom<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function generateScore(rng: () => number): number {
  const base = rng() * 100;
  if (base < 10) return Math.floor(30 + rng() * 10);
  if (base < 25) return Math.floor(40 + rng() * 10);
  if (base < 50) return Math.floor(50 + rng() * 10);
  if (base < 75) return Math.floor(60 + rng() * 10);
  if (base < 90) return Math.floor(70 + rng() * 10);
  return Math.floor(80 + rng() * 20);
}

function pickSubjects(
  record: RawRecord,
  rng: () => number,
): { name: string; percentage: number }[] {
  const lo = pickRandom(
    subjects.filter((s) => !record.subjectSubset.includes(s)),
    rng,
  );
  const result = [
    ...record.subjectSubset.map((name) => ({
      name,
      percentage: generateScore(rng),
    })),
    { name: lo, percentage: generateScore(rng) },
  ];
  const loIdx = result.findIndex((s) => s.name === lo);
  if (loIdx > 0) {
    const [subj] = result.splice(loIdx, 1);
    result.push(subj);
  }
  return result;
}

function computeOverall(subjects: { name: string; percentage: number }[]): number {
  return Math.round(subjects.reduce((sum, s) => sum + s.percentage, 0) / subjects.length);
}

const YEARS = [2021, 2022, 2023, 2024, 2025] as const;
const RECORDS_PER_YEAR = rawRecords.length;

export const matricResultsYears = YEARS;

function getMatricResultsForYear(year: number): DemoMatricResult[] {
  if (!(YEARS as readonly number[]).includes(year)) return [];

  const _yearIndex = YEARS.indexOf(year as (typeof YEARS)[number]);
  const rng = seededRandom(year * 17 + 42);

  const records: DemoMatricResult[] = [];
  for (let i = 0; i < RECORDS_PER_YEAR; i++) {
    const raw = rawRecords[i];
    const subjects = pickSubjects(raw, rng);
    const overall = computeOverall(subjects);
    records.push({
      name: raw.name,
      examNumber: `${year}/${String(i + 1).padStart(3, "0")}`,
      school: raw.school,
      province: raw.province,
      subjects,
      overall,
    });
  }
  return records;
}

export function searchMatricResults(query: string, year: number): DemoMatricResult[] {
  const results = getMatricResultsForYear(year);
  const normalized = query.toLowerCase().trim();
  if (!normalized) return results;
  return results.filter(
    (r) =>
      r.name.toLowerCase().includes(normalized) ||
      r.school.toLowerCase().includes(normalized) ||
      r.province.toLowerCase().includes(normalized) ||
      r.examNumber.toLowerCase().includes(normalized),
  );
}
