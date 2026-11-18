export const NAME_REGEX = /^[A-Za-z\u00C0-\u024F]+(?:[ ][A-Za-z\u00C0-\u024F]+)*$/;
export const MOBILE_REGEX = /^[0-9]{10}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 
export function validateName(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return 'Name is required';
  if (!NAME_REGEX.test(trimmed)) return 'Name should not contain numbers or special characters';
  return '';
}
 
export function validateMobile(value) {
  if (!value) return 'Mobile number is required';
  if (!MOBILE_REGEX.test(value)) return 'Enter 10 digit mobile number';
  return '';
}
 
export function validateEmail(value, required = true) {
  const trimmed = (value || '').trim();
  if (!trimmed) return required ? 'Email address is required' : '';
  if (!EMAIL_REGEX.test(trimmed)) return 'Enter a valid email address';
  return '';
}
 
export function validateRequired(value, label) {
  if (!value || !String(value).trim()) return `${label} is required`;
  return '';
}
 
export function validateAmount(value) {
  if (!value) return 'Amount is required';
  if (!/^\d+(\.\d{1,2})?$/.test(value) || Number(value) <= 0) return 'Enter a valid amount';
  return '';
}
 
