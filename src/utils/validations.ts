export const requiredValidation = (
  value: string | null | undefined,
  label: string | undefined,
  isRequired?: boolean,
): string | undefined => {
  if (isRequired && (!value || value.trim() === '')) {
    return `${label || 'This field'} is required`
  }
  return undefined
}

export const maxLengthValidation = (
  value: string | null | undefined,
  label: string | undefined,
  maxLength?: number,
): string | undefined => {
  if (maxLength && value && value.length > maxLength) {
    return `${label || 'This field'} must be less than ${maxLength} characters`
  }
  return undefined
}

export const emailAddressValidation = (
  value: string | null | undefined,
  label: string | undefined,
  isEmail?: boolean,
): string | undefined => {
  if (isEmail && value && value.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value.trim())) {
      return `${label || 'Email'} is invalid`
    }
  }
  return undefined
}

export const phoneNumberValidation = (
  value: string | null | undefined,
  isPhoneNumber?: boolean,
): string | undefined => {
  if (isPhoneNumber && value && value.trim() !== '') {
    const phoneRegex = /^[\d\s-()+]+$/
    if (!phoneRegex.test(value.trim()) || value.trim().length < 10) {
      return 'Phone number is invalid'
    }
  }
  return undefined
}

