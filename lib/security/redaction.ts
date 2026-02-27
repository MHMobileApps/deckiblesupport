export function redactForLlm(text: string) {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, (m) => `${m.slice(0, 2)}***@***`)
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '[redacted-phone]')
    .replace(/(api[_-]?key|token|password)\s*[:=]\s*\S+/gi, '$1:[redacted]');
}

export function containsSecretPatterns(text: string) {
  const patterns = [/api[_-]?key\s*[:=]\s*\S+/i, /password\s*[:=]\s*\S+/i, /token\s*[:=]\s*\S+/i, /sk-[a-z0-9]{20,}/i];
  return patterns.some((re) => re.test(text));
}
