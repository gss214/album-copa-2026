// Mapeamento section_code / section_name → { flag, pages }
// Lookup: getSectionInfo(sectionCode, sectionName)

const SECTION_INFO = {
  // ── FWC (por section_name, pois section_code é igual para ambas) ──
  "Página Inicial":        { flag: "🏆", pages: "1–7"       },
  "FIFA World Cup History":{ flag: "🏆", pages: "106–109"   },

  // ── Grupo A ──────────────────────────────────────────────────────
  MEX: { flag: "🇲🇽", pages: "8–9"   },
  RSA: { flag: "🇿🇦", pages: "10–11" },
  KOR: { flag: "🇰🇷", pages: "12–13" },
  CZE: { flag: "🇨🇿", pages: "14–15" },

  // ── Grupo B ──────────────────────────────────────────────────────
  CAN: { flag: "🇨🇦", pages: "16–17" },
  BIH: { flag: "🇧🇦", pages: "18–19" },
  QAT: { flag: "🇶🇦", pages: "20–21" },
  SUI: { flag: "🇨🇭", pages: "22–23" },

  // ── Grupo C ──────────────────────────────────────────────────────
  BRA: { flag: "🇧🇷", pages: "24–25" },
  MAR: { flag: "🇲🇦", pages: "26–27" },
  HAI: { flag: "🇭🇹", pages: "28–29" },
  SCO: { flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", pages: "30–31" },

  // ── Grupo D ──────────────────────────────────────────────────────
  USA: { flag: "🇺🇸", pages: "32–33" },
  PAR: { flag: "🇵🇾", pages: "34–35" },
  AUS: { flag: "🇦🇺", pages: "36–37" },
  TUR: { flag: "🇹🇷", pages: "38–39" },

  // ── Grupo E ──────────────────────────────────────────────────────
  GER: { flag: "🇩🇪", pages: "40–41" },
  CUW: { flag: "🇨🇼", pages: "42–43" },
  CIV: { flag: "🇨🇮", pages: "44–45" },
  ECU: { flag: "🇪🇨", pages: "46–47" },

  // ── Grupo F ──────────────────────────────────────────────────────
  NED: { flag: "🇳🇱", pages: "48–49" },
  JPN: { flag: "🇯🇵", pages: "50–51" },
  SWE: { flag: "🇸🇪", pages: "52–53" },
  TUN: { flag: "🇹🇳", pages: "54–55" },

  // ── Grupo G ──────────────────────────────────────────────────────
  BEL: { flag: "🇧🇪", pages: "58–59" },
  EGY: { flag: "🇪🇬", pages: "60–61" },
  IRN: { flag: "🇮🇷", pages: "62–63" },
  NZL: { flag: "🇳🇿", pages: "64–65" },

  // ── Grupo H ──────────────────────────────────────────────────────
  ESP: { flag: "🇪🇸", pages: "66–67" },
  CPV: { flag: "🇨🇻", pages: "68–69" },
  KSA: { flag: "🇸🇦", pages: "70–71" },
  URU: { flag: "🇺🇾", pages: "72–73" },

  // ── Grupo I ──────────────────────────────────────────────────────
  FRA: { flag: "🇫🇷", pages: "74–75" },
  SEN: { flag: "🇸🇳", pages: "76–77" },
  IRQ: { flag: "🇮🇶", pages: "78–79" },
  NOR: { flag: "🇳🇴", pages: "80–81" },

  // ── Grupo J ──────────────────────────────────────────────────────
  ARG: { flag: "🇦🇷", pages: "82–83" },
  ALG: { flag: "🇩🇿", pages: "84–85" },
  AUT: { flag: "🇦🇹", pages: "86–87" },
  JOR: { flag: "🇯🇴", pages: "88–89" },

  // ── Grupo K ──────────────────────────────────────────────────────
  POR: { flag: "🇵🇹", pages: "90–91"   },
  COD: { flag: "🇨🇩", pages: "92–93"   },
  UZB: { flag: "🇺🇿", pages: "94–95"   },
  COL: { flag: "🇨🇴", pages: "96–97"   },

  // ── Grupo L ──────────────────────────────────────────────────────
  ENG: { flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", pages: "98–99"   },
  CRO: { flag: "🇭🇷", pages: "100–101" },
  GHA: { flag: "🇬🇭", pages: "102–103" },
  PAN: { flag: "🇵🇦", pages: "104–105" },

  // ── Coca-Cola ─────────────────────────────────────────────────────
  CC:  { flag: "🥤", pages: "111"      },
};

export function getSectionInfo(sectionCode, sectionName) {
  return SECTION_INFO[sectionCode] ?? SECTION_INFO[sectionName] ?? null;
}
