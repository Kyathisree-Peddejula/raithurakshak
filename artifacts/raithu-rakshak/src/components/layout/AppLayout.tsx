import { Sidebar } from "./Sidebar";
import { useLang } from "@/context/LanguageContext";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { lang, toggle } = useLang();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
        <header className="h-16 bg-card border-b border-border flex items-center px-8 shrink-0 justify-between">
          <h2 className="font-semibold text-lg text-foreground">District Operations</h2>
          <div className="flex items-center gap-4">
            {/* Language toggle */}
            <button
              onClick={toggle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-bold transition-colors hover:bg-accent"
              title={lang === "en" ? "Switch to Telugu" : "Switch to English"}
            >
              <span className={lang === "en" ? "text-primary" : "text-muted-foreground"}>EN</span>
              <span className="text-muted-foreground/50">|</span>
              <span className={lang === "te" ? "text-primary" : "text-muted-foreground"}>తె</span>
            </button>

            <div className="text-right">
              <p className="text-sm font-medium">
                {lang === "te" ? "విధి అధికారి" : "Duty Officer"}
              </p>
              <p className="text-xs text-muted-foreground">
                {lang === "te" ? "అత్యవసర స్పందన బృందం" : "Emergency Response Team"}
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
              DO
            </div>
          </div>
        </header>
        <div className="p-8 flex-1 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
