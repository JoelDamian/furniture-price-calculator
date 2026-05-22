export const FINANZAS_ALLOWED_EMAILS = [
  'yazmontecinos@gmail.com',
  'joel.damian.echeverria@gmail.com',
];

export const FINANZAS_ORG = {
  CARPINTERIA: 1,
  STUDIO: 2,
} as const;

export const canAccessFinanzas = (email: string | null): boolean => {
  if (!email) return false;
  return FINANZAS_ALLOWED_EMAILS.includes(email.toLowerCase());
};
