import { createContext, useContext, useState, useEffect } from "react";

export type Lang = "en" | "te";

interface LanguageContextValue {
  lang: Lang;
  toggle: () => void;
  t: (en: string, te: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  toggle: () => {},
  t: (en) => en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return (localStorage.getItem("rr_lang") as Lang) ?? "en";
    } catch {
      return "en";
    }
  });

  useEffect(() => {
    localStorage.setItem("rr_lang", lang);
  }, [lang]);

  const toggle = () => setLang(l => l === "en" ? "te" : "en");
  const t = (en: string, te: string) => lang === "te" ? te : en;

  return (
    <LanguageContext.Provider value={{ lang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}

// Static Telugu translations for standard risk messages
export const teluguRiskMessages: Record<string, string> = {
  critical: "పిడుగుల ప్రమాదం ఉంది. వెంటనే సురక్షిత ప్రదేశానికి వెళ్లండి.",
  high:     "పిడుగుల ప్రమాదం అధికంగా ఉంది. పొలాలలో పని ఆపండి.",
  medium:   "పిడుగుల ప్రమాదం ఉంది. జాగ్రత్తగా ఉండండి.",
  low:      "తక్కువ పిడుగుల ప్రమాదం. వాతావరణ నవీకరణలను గమనించండి.",
  safe:     "ఇప్పుడు సురక్షితంగా ఉంది.",
};

export const teluguAlertBanner: Record<string, string> = {
  critical: "🚨 విపత్కర హెచ్చరిక: పిడుగుల ప్రమాదం ఉంది. వెంటనే సురక్షిత ప్రదేశానికి వెళ్లండి.",
  high:     "⚠️ అధిక హెచ్చరిక: పొలాలలో పని ఆపి, సురక్షిత ప్రదేశానికి వెళ్లండి.",
  medium:   "⚠️ మధ్యస్థ హెచ్చరిక: పిడుగుల ప్రమాదం ఉంది. జాగ్రత్తగా ఉండండి.",
  low:      "ℹ️ తక్కువ ప్రమాదం: వాతావరణ నవీకరణలను గమనించండి.",
};
