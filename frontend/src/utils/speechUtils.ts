/**
 * Utility to clean AI response text before sending it to browser Text-to-Speech (speechSynthesis).
 * Strips raw Markdown characters (**, *, #, `, _, ~, links, URLs) and internal technical metadata
 * so the voice reads natural, human-readable sentences instead of literal formatting symbols.
 */

export function cleanTextForSpeech(rawText: string): string {
  if (!rawText || typeof rawText !== "string") {
    return "";
  }

  let text = rawText;

  // 1. Remove code blocks and inline backticks completely
  text = text.replace(/```[\s\S]*?```/g, "");
  text = text.replace(/`([^`]+)`/g, "$1");
  text = text.replace(/`/g, "");

  // 2. Remove HTML tags
  text = text.replace(/<[^>]*>/g, "");

  // 3. Remove Markdown links: [Link Text](http://...) -> Link Text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // 4. Remove raw URLs (e.g. https://... or http://...)
  text = text.replace(/\bhttps?:\/\/[^\s)]+/gi, "");

  // 5. Remove internal technical metadata & enum strings
  text = text.replace(/Verified Information\s*\|\s*Verification:\s*\w+\s*\|\s*Confidence:\s*\w+/gi, "");
  text = text.replace(/Verification:\s*[\w_]+/gi, "");
  text = text.replace(/Confidence:\s*[\w_]+/gi, "");
  text = text.replace(/verified_from_source_data/gi, "");
  text = text.replace(/requires_official_verification/gi, "");
  text = text.replace(/insufficient_evidence/gi, "");

  // 6. Handle Markdown headings (# Heading -> Heading.)
  text = text.replace(/^#{1,6}\s+(.*)$/gm, "$1.");

  // 7. Strip Bold and Italic formatting (**text**, *text*, __text__, _text_)
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");
  text = text.replace(/\*([^*]+)\*/g, "$1");
  text = text.replace(/_([^_]+)_/g, "$1");
  text = text.replace(/\*/g, "");
  text = text.replace(/_/g, " ");

  // 8. Convert bullet points (•, -, *) and list items into clean sentence breaks
  text = text.replace(/(?:^|\n|\s+)[•\-\*]\s+/g, ". ");
  text = text.replace(/\s+•\s+/g, ". ");

  // 9. Format key-value pairs (e.g. "Overview: text" -> "Overview. text")
  text = text.replace(/([A-Za-z0-9\u0900-\u0D7F]+):\s*/g, "$1. ");

  // 10. Remove special brackets and markdown symbols that cause vocal artifacts
  text = text.replace(/[\\#{}\[\]()<>~^|]/g, " ");

  // 11. Normalize duplicate periods, spaces, and line breaks
  text = text.replace(/\s+/g, " ");
  text = text.replace(/\.\s*\./g, ".");
  text = text.replace(/\s*\.\s*/g, ". ");
  text = text.trim();

  // Ensure sentence ending punctuation for natural speech cadence
  if (text && !/[.!?]$/.test(text)) {
    text += ".";
  }

  return text;
}

export function languageToBCP47(language: string): string {
  const lang = (language || "en").toLowerCase().trim();
  const map: Record<string, string> = {
    en: "en-IN",
    hi: "hi-IN",
    kn: "kn-IN",
    te: "te-IN",
    ta: "ta-IN",
    ml: "ml-IN",
    bn: "bn-IN",
    mr: "mr-IN",
    gu: "gu-IN",
  };
  return map[lang] || (lang.includes("-") ? lang : `${lang}-IN`);
}

let activeAudioElement: HTMLAudioElement | null = null;
let isSpeakingUtterance = false;

export function hasActivePlayback(): boolean {
  if (activeAudioElement && !activeAudioElement.paused && !activeAudioElement.ended) {
    return true;
  }
  if ("speechSynthesis" in window && (window.speechSynthesis.speaking || window.speechSynthesis.pending || isSpeakingUtterance)) {
    return true;
  }
  return false;
}

export function stopAllPlayback(): void {
  if (activeAudioElement) {
    activeAudioElement.pause();
    activeAudioElement = null;
  }
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  isSpeakingUtterance = false;
}

export function playExclusiveAudio(
  audioElement: HTMLAudioElement,
  onPlay?: () => void,
  onEnd?: () => void,
  onError?: () => void
): Promise<void> {
  stopAllPlayback();
  activeAudioElement = audioElement;

  audioElement.onended = () => {
    if (activeAudioElement === audioElement) {
      activeAudioElement = null;
    }
    onEnd?.();
  };

  audioElement.onerror = () => {
    if (activeAudioElement === audioElement) {
      activeAudioElement = null;
    }
    onError?.();
  };

  onPlay?.();
  return audioElement.play();
}

export function speakExclusive(
  utterance: SpeechSynthesisUtterance,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void
): void {
  stopAllPlayback();
  if ("speechSynthesis" in window) {
    isSpeakingUtterance = true;
    utterance.onstart = () => {
      isSpeakingUtterance = true;
      onStart?.();
    };
    utterance.onend = () => {
      isSpeakingUtterance = false;
      onEnd?.();
    };
    utterance.onerror = () => {
      isSpeakingUtterance = false;
      onError?.();
    };
    window.speechSynthesis.speak(utterance);
  }
}

