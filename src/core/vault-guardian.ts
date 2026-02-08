/**
 * @MODULE_ID core.vault-guardian
 * @STAGE global
 * @DATA_INPUTS ["user_input", "agent_response"]
 * @REQUIRED_TOOLS []
 */
const MAX_RESPONSE_CHARS = 1200;

type GuardResult = {
  blocked: boolean;
  score: number;
  reasons: string[];
  warning: string | null;
};

const SUSPICIOUS_PATTERNS = [
  /ignore\s+previous\s+instructions/i,
  /system\s+prompt/i,
  /reveal\s+.*(secret|token|key)/i,
  /exfiltrate/i,
  /dump\s+.*(database|logs|keys)/i,
  /supabase\s+key/i,
  /api\s+key/i,
  /access\s+token/i,
  /BEGIN\s+PRIVATE\s+KEY/i,
];

const REDACTION_PATTERNS = [
  /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
  /sk-[a-zA-Z0-9]{16,}/g,
];

export const scanUserInput = (input: string): GuardResult => {
  const reasons: string[] = [];
  let score = 0;

  SUSPICIOUS_PATTERNS.forEach((pattern) => {
    if (pattern.test(input)) {
      score += 2;
      reasons.push(`Pattern matched: ${pattern.source}`);
    }
  });

  const blocked = score >= 3;
  const warning = blocked
    ? "Sicherheitswarnung: Die Anfrage enthält potenziell schädliche Anweisungen. Bitte formuliere sie neu."
    : null;

  return { blocked, score, reasons, warning };
};

const redactSensitive = (response: string) => {
  return REDACTION_PATTERNS.reduce((acc, pattern) => acc.replace(pattern, "[REDACTED]"), response);
};

export const applyResponseGuard = (response: string) => {
  const sanitized = redactSensitive(response);
  if (sanitized.length <= MAX_RESPONSE_CHARS) {
    return sanitized;
  }

  return `${sanitized.slice(0, MAX_RESPONSE_CHARS)}\n\n[Antwort gekürzt zum Schutz der Daten.]`;
};
