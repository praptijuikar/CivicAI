import { useEffect, useRef, useState } from "react";

interface SpeechRecognitionResultLike {
    isFinal: boolean;
    0: { transcript: string };
}

interface SpeechRecognitionEventLike {
    resultIndex: number;
    results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
    error: string;
}

interface SpeechRecognitionLike {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onresult: ((event: SpeechRecognitionEventLike) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechWindow = Window & typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export type VoiceError = "unsupported" | "permission" | "network" | "no-speech" | "unknown";

export interface SpeechRecognitionState {
    isListening: boolean;
    transcript: string;
    interimTranscript: string;
    error: VoiceError | null;
    supported: boolean;
    start: () => void;
    stop: () => void;
}

export function useSpeechRecognition({
    language = "en-US",
    continuous = false,
    onFinalTranscript,
}: {
    language?: string;
    continuous?: boolean;
    onFinalTranscript?: (transcript: string) => void;
} = {}): SpeechRecognitionState {
    const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
    const callbackRef = useRef(onFinalTranscript);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [error, setError] = useState<VoiceError | null>(null);

    useEffect(() => {
        callbackRef.current = onFinalTranscript;
    }, [onFinalTranscript]);

    const supported = typeof window !== "undefined" && Boolean(
        (window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition
    );

    useEffect(() => {
        return () => {
            recognitionRef.current?.abort();
        };
    }, []);

    const start = () => {
        if (!supported) {
            setError("unsupported");
            return;
        }

        recognitionRef.current?.abort();
        const speechWindow = window as SpeechWindow;
        const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
        if (!Recognition) return;

        const recognition = new Recognition();
        recognition.continuous = continuous;
        recognition.interimResults = true;
        recognition.lang = language;
        recognition.onstart = () => {
            setError(null);
            setTranscript("");
            setInterimTranscript("");
            setIsListening(true);
        };
        recognition.onresult = (event) => {
            let finalText = "";
            let interimText = "";
            for (let index = event.resultIndex; index < event.results.length; index += 1) {
                const phrase = event.results[index][0].transcript;
                if (event.results[index].isFinal) finalText += phrase;
                else interimText += phrase;
            }
            if (finalText.trim()) {
                const cleanText = finalText.trim();
                setTranscript(cleanText);
                callbackRef.current?.(cleanText);
            }
            setInterimTranscript(interimText.trim());
        };
        recognition.onerror = (event) => {
            setError(event.error === "not-allowed" || event.error === "service-not-allowed"
                ? "permission"
                : event.error === "network" ? "network" : event.error === "no-speech" ? "no-speech" : "unknown");
            setIsListening(false);
        };
        recognition.onend = () => {
            setIsListening(false);
            setInterimTranscript("");
        };

        recognitionRef.current = recognition;
        setError(null);
        try {
            recognition.start();
        } catch {
            setError("unknown");
            setIsListening(false);
        }
    };

    const stop = () => {
        recognitionRef.current?.stop();
        setIsListening(false);
    };

    return { isListening, transcript, interimTranscript, error, supported, start, stop };
}

export function voiceErrorMessage(error: VoiceError | null): string {
    if (error === "unsupported") return "Voice input is not supported in this browser.";
    if (error === "permission") return "Microphone access was denied. Allow it in browser settings and try again.";
    if (error === "network") return "Voice service is unavailable. Check your connection and try again.";
    if (error === "no-speech") return "No speech detected. Move closer to the microphone and try again.";
    if (error === "unknown") return "Voice input stopped unexpectedly. You can type instead.";
    return "";
}
