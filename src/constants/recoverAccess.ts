export const RECOVER_ALLOWED_EMAIL = 'joel.damian.echeverria@gmail.com';

export const canRecoverCotizacion = (email: string | null): boolean => {
  if (!email) return false;
  return email.toLowerCase() === RECOVER_ALLOWED_EMAIL;
};
