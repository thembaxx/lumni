const IPA_TO_ARPABET: Record<string, string> = {
  i: "IY",
  iː: "IY",
  ɪ: "IH",
  e: "EY",
  eɪ: "EY",
  ɛ: "EH",
  æ: "AE",
  a: "AA",
  ɑ: "AA",
  ɑː: "AA",
  ɒ: "AA",
  ʌ: "AH",
  ɔ: "AO",
  ɔː: "AO",
  o: "OW",
  oʊ: "OW",
  u: "UW",
  uː: "UW",
  ʊ: "UH",
  ə: "AH",
  ɚ: "ER",
  ɝ: "ER",
  ər: "ER",
  p: "P",
  b: "B",
  t: "T",
  d: "D",
  k: "K",
  ɡ: "G",
  g: "G",
  tʃ: "CH",
  dʒ: "JH",
  f: "F",
  v: "V",
  θ: "TH",
  ð: "DH",
  s: "S",
  z: "Z",
  ʃ: "SH",
  ʒ: "ZH",
  h: "HH",
  m: "M",
  n: "N",
  ŋ: "NG",
  l: "L",
  r: "R",
  j: "Y",
  w: "W",
  aɪ: "AY",
  aʊ: "AW",
  ɔɪ: "OY",
  ju: "Y UW",
  juː: "Y UW",
};

export function ipaToArpabet(ipa: string): string[] {
  const cleaned = ipa
    .replace(/^\/+|\/+$/g, "")
    .replace(/[ˈˌ]/g, "")
    .trim();
  if (!cleaned) return [];

  const result: string[] = [];
  let i = 0;

  while (i < cleaned.length) {
    let matched = false;

    for (const len of [3, 2, 1]) {
      const slice = cleaned.slice(i, i + len);
      const arpa = IPA_TO_ARPABET[slice];
      if (arpa) {
        const parts = arpa.split(/\s+/);
        result.push(...parts);
        i += len;
        matched = true;
        break;
      }
    }

    if (!matched) {
      i++;
    }
  }

  return result;
}
