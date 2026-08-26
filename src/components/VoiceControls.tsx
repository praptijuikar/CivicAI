import { useTranslation } from "react-i18next";
import { Mic, MicOff, Radio, Volume2 } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { useSpeechRecognition, voiceErrorMessage } from "../lib/voice";

interface VoiceFieldProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    rows?: number;
    inputType?: "input" | "textarea";
    required?: boolean;
}

export function VoiceField({ value, onChange, placeholder, className = "", rows = 3, inputType = "textarea", required = false }: VoiceFieldProps) {
  const { t } = useTranslation();
    const speech = useSpeechRecognition({ onFinalTranscript: (text) => onChange(`${value}${value ? " " : ""}${text}`) });
    const fieldClassName = `${className} ${speech.isListening ? "border-saffron ring-2 ring-saffron/50" : ""}`;
    const fieldProps = {
        value: `${value}${speech.isListening && speech.interimTranscript ? `${value ? " " : ""}${speech.interimTranscript}` : ""}`,
        onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value),
        placeholder,
        className: fieldClassName,
        required,
    };

    return (
        <div className="relative">
            {inputType === "input" ? <input {...fieldProps} type="text" /> : <textarea {...fieldProps} rows={rows} />}
            <VoiceButton speech={speech} />
            {speech.isListening && <span className="pointer-events-none absolute right-11 top-1/2 -translate-y-1/2 flex gap-0.5" aria-hidden="true">
                <i className="h-3 w-0.5 animate-pulse bg-cyan-300" />
                <i className="h-5 w-0.5 animate-pulse bg-cyan-400 [animation-delay:120ms]" />
                <i className="h-3 w-0.5 animate-pulse bg-cyan-300 [animation-delay:240ms]" />
            </span>}
            {speech.error && <p className="mt-1 text-[10px] text-rose-300" role="alert">{voiceErrorMessage(speech.error)}</p>}
        </div>
    );
}

function VoiceButton({ speech }: { speech: ReturnType<typeof useSpeechRecognition> }) {
    return <button
        type="button"
        onClick={speech.isListening ? speech.stop : speech.start}
        aria-label={speech.isListening ? "Stop dictation" : "Start dictation"}
        title={speech.isListening ? "Stop dictation" : "Dictate text"}
        className={`absolute right-2 top-2 rounded-lg p-2 transition ${speech.isListening ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/40" : "text-foreground/60 hover:bg-background hover:text-cyan-300"}`}
    >
        {speech.isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>;
}

interface VoiceCommandButtonProps {
    onCommand: (command: string) => boolean;
}

export function VoiceCommandButton({ onCommand }: VoiceCommandButtonProps) {
  const { t } = useTranslation();
    const [feedback, setFeedback] = useState("");
    const speech = useSpeechRecognition({
        onFinalTranscript: (command) => {
            if (!onCommand(command)) setFeedback("Try: go to dashboard, open analytics, or create new issue.");
            else setFeedback("");
        }
    });
    const message = speech.error ? voiceErrorMessage(speech.error) : speech.isListening
        ? `Listening${speech.interimTranscript ? `: ${speech.interimTranscript}` : "..."}`
        : "Voice commands";

    return <div className="fixed bottom-5 right-5 z-[1000] flex items-center gap-2">
        {speech.isListening && <div className="hidden rounded-xl border border-saffron/40 bg-white px-3 py-2 text-[11px] text-cyan-200 shadow-xl sm:block" role="status">
            <Radio className="mr-1 inline h-3 w-3 animate-pulse" />{message}
        </div>}
        {(speech.error || feedback) && <div className={`hidden max-w-[250px] rounded-xl border bg-white px-3 py-2 text-[11px] shadow-xl sm:block ${speech.error ? "border-rose-400/40 text-rose-200" : "border-amber-400/40 text-amber-200"}`} role="alert">{speech.error ? message : feedback}</div>}
        <button
            type="button"
            onClick={speech.isListening ? speech.stop : speech.start}
            aria-label={speech.isListening ? "Stop voice commands" : "Start voice commands"}
            title={speech.isListening ? "Stop voice commands" : "Voice commands"}
            className={`rounded-full border p-3 shadow-2xl transition ${speech.isListening ? "border-saffron bg-cyan-400 text-slate-950 shadow-cyan-500/40 animate-pulse" : "border-slate-600 bg-surface text-cyan-300 hover:border-saffron"}`}
        >
            {speech.isListening ? <MicOff className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
    </div>;
}
