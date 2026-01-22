// Validation service for input validation
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  details?: Record<string, string>;
}

export class ValidationService {
  static validateEmail(email: string): ValidationResult {
    if (!email) {
      return {
        isValid: false,
        errors: ['Имейлът е задължителен'],
        details: { email: 'Имейлът е задължителен' }
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        errors: ['Невалиден формат на имейл адреса'],
        details: { email: 'Имейлът трябва да е във валиден формат' }
      };
    }

    return { isValid: true, errors: [] };
  }

  static validatePhone(phone: string): ValidationResult {
    if (!phone) {
      return {
        isValid: false,
        errors: ['Телефонът е задължителен'],
        details: { phone: 'Телефонът е задължителен' }
      };
    }

    const phoneRegex = /^(\+359|0)[0-9]{9}$/;
    if (!phoneRegex.test(phone)) {
      return {
        isValid: false,
        errors: ['Невалиден формат на телефонния номер'],
        details: { phone: 'Използвайте формат: +359XXXXXXXXX или 0XXXXXXXXX' }
      };
    }

    return { isValid: true, errors: [] };
  }

  static validateName(name: string): ValidationResult {
    if (!name) {
      return {
        isValid: false,
        errors: ['Името е задължително'],
        details: { name: 'Името е задължително' }
      };
    }

    const nameRegex = /^[а-яА-Яa-zA-Z\s]{2,50}$/;
    if (!nameRegex.test(name.trim())) {
      return {
        isValid: false,
        errors: ['Името трябва да е между 2 и 50 символа и да съдържа само букви'],
        details: { name: 'Името трябва да е между 2 и 50 символа и да съдържа само букви' }
      };
    }

    return { isValid: true, errors: [] };
  }

  static validatePassword(password: string): ValidationResult {
    if (!password) {
      return {
        isValid: false,
        errors: ['Паролата е задължителна'],
        details: { password: 'Паролата е задължителна' }
      };
    }

    if (password.length < 8) {
      return {
        isValid: false,
        errors: ['Паролата трябва да е поне 8 символа дълга'],
        details: { password: 'Паролата трябва да е поне 8 символа дълга' }
      };
    }

    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return {
        isValid: false,
        errors: ['Паролата трябва да съдържа поне една буква и една цифра'],
        details: { password: 'Паролата трябва да съдържа поне една буква и една цифра' }
      };
    }

    return { isValid: true, errors: [] };
  }
}
