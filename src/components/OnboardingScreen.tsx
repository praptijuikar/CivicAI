import { useTranslation } from "react-i18next";
import { ArrowRight, Check, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import type { Language } from "../types.ts";
import { languages } from "../lib/i18n.ts";

interface OnboardingScreenProps {
    language: Language;
    zone: string;
    onLanguageChange: (language: Language) => void;
    onZoneChange: (zone: string) => void;
    onContinue: () => void;
}

const zones = ["Central district", "North zone", "East zone", "South zone", "West zone"];

export default function OnboardingScreen({
    language,
    zone,
    onLanguageChange,
    onZoneChange,
    onContinue,
}: OnboardingScreenProps) {
  const { t } = useTranslation();
    return (
        <main className="min-h-screen overflow-hidden bg-background text-foreground">
            <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
                <section className="relative flex flex-col justify-between overflow-hidden bg-blue-700 px-6 py-8 text-foreground sm:px-10 lg:px-16 lg:py-12">
                    <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full border-[36px] border-blue-300/20" />
                    <div className="absolute -bottom-28 -left-28 h-72 w-72 rounded-full border-[36px] border-[#e87b52]/20" />

                    <div className="relative z-10 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-foreground">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-lg font-bold tracking-tight">Civic<span className="text-blue-200">AI</span></p>
                            <p className="text-[11px] uppercase tracking-[0.22em] text-foreground">Civic action, made visible</p>
                        </div>
                    </div>

                    <div className="relative z-10 max-w-xl py-16 lg:py-24">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-900/30 px-3 py-1.5 text-xs font-semibold text-blue-100">
                            <Sparkles className="h-3.5 w-3.5" />
                            Your neighborhood, moving forward
                        </div>
                        <h1 className="max-w-lg text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                            Better streets start with one report.
                        </h1>
                        <p className="mt-6 max-w-md text-base leading-7 text-foreground sm:text-lg">
                            Connect with your civic network, share what needs attention, and follow every response from report to resolution.
                        </p>
                    </div>

                    <div className="relative z-10 grid max-w-lg grid-cols-3 gap-3 border-t border-white/15 pt-5 text-xs text-foreground">
                        <div><strong className="block text-xl text-foreground">01</strong>Report clearly</div>
                        <div><strong className="block text-xl text-foreground">02</strong>Track openly</div>
                        <div><strong className="block text-xl text-foreground">03</strong>Improve together</div>
                    </div>
                </section>

                <section className="flex items-center bg-surface px-6 py-10 sm:px-10 lg:px-16">
                    <div className="w-full max-w-lg">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Welcome to your civic desk</p>
                        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Let&apos;s make this local.</h2>
                        <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
                            Choose how CivicAI should speak to you and set your neighborhood view before you enter the dashboard.
                        </p>

                        <div className="mt-9">
                            <div className="mb-3 flex items-center justify-between">
                                <label className="text-sm font-bold" htmlFor="language">Preferred language</label>
                                <span className="text-xs text-foreground/60">Step 1 of 2</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {languages.map((option) => {
                                    const selected = option.code === language;
                                    return (
                                        <button
                                            key={option.code}
                                            type="button"
                                            onClick={() => onLanguageChange(option.code)}
                                            className={`relative min-h-16 rounded-xl border px-3 py-2 text-left transition ${selected
                                                ? "border-blue-600 bg-blue-600 text-foreground shadow-lg shadow-blue-600/20"
                                                : "border-border-subtle bg-background text-foreground/80 hover:border-blue-400"
                                                }`}
                                        >
                                            {selected && <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-blue-100" />}
                                            <span className="block text-sm font-bold">{option.nativeLabel}</span>
                                            <span className={`text-[11px] ${selected ? "text-foreground" : "text-foreground/60"}`}>{option.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-8">
                            <div className="mb-3 flex items-center justify-between">
                                <label className="text-sm font-bold" htmlFor="zone">Your area</label>
                                <span className="text-xs text-foreground/60">Step 2 of 2</span>
                            </div>
                            <div className="relative">
                                <MapPin className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-blue-600" />
                                <select
                                    id="zone"
                                    value={zone}
                                    onChange={(event) => onZoneChange(event.target.value)}
                                    className="w-full appearance-none rounded-xl border border-border-subtle bg-surface px-10 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-blue-600"
                                >
                                    {zones.map((option) => <option key={option}>{option}</option>)}
                                </select>
                            </div>
                            <p className="mt-2 text-xs text-foreground/60">You can change this later from your dashboard.</p>
                        </div>

                        <button
                            type="button"
                            onClick={onContinue}
                            className="mt-10 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-foreground shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                        >
                            Enter CivicAI
                            <ArrowRight className="h-4 w-4" />
                        </button>
                        <p className="mt-4 text-center text-xs text-foreground/60">A public service workspace for every resident.</p>
                    </div>
                </section>
            </div>
        </main>
    );
}
