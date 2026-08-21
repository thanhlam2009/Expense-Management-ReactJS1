// Form validation utilities

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export function validateField(value: any, rules: ValidationRule): string | null {
  // Required check
  if (rules.required && (!value || value.toString().trim() === '')) {
    return 'Trường này là bắt buộc';
  }

  // Skip other validations if value is empty and not required
  if (!value || value.toString().trim() === '') {
    return null;
  }

  const stringValue = value.toString();

  // MinLength check
  if (rules.minLength && stringValue.length < rules.minLength) {
    return `Phải có ít nhất ${rules.minLength} ký tự`;
  }

  // MaxLength check
  if (rules.maxLength && stringValue.length > rules.maxLength) {
    return `Không được vượt quá ${rules.maxLength} ký tự`;
  }

  // Min value check
  if (rules.min !== undefined && Number(value) < rules.min) {
    return `Giá trị tối thiểu là ${rules.min}`;
  }

  // Max value check
  if (rules.max !== undefined && Number(value) > rules.max) {
    return `Giá trị tối đa là ${rules.max}`;
  }

  // Email validation
  if (rules.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(stringValue)) {
      return 'Email không hợp lệ';
    }
  }

  // Phone validation (Vietnamese format)
  if (rules.phone) {
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (!phoneRegex.test(stringValue.replace(/\s/g, ''))) {
      return 'Số điện thoại không hợp lệ';
    }
  }

  // Pattern check
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    return 'Định dạng không hợp lệ';
  }

  // Custom validation
  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
}

export function validateForm<T extends Record<string, any>>(
  values: T,
  rules: ValidationRules
): { isValid: boolean; errors: Partial<Record<keyof T, string>> } {
  const errors: Partial<Record<keyof T, string>> = {};

  Object.keys(rules).forEach((key) => {
    const error = validateField(values[key], rules[key]);
    if (error) {
      errors[key as keyof T] = error;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Password strength validation
export function validatePasswordStrength(password: string): {
  strength: 'weak' | 'medium' | 'strong';
  message: string;
  score: number;
} {
  if (!password) {
    return { strength: 'weak', message: 'Mật khẩu không được để trống', score: 0 };
  }

  let score = 0;
  
  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Complexity checks
  if (/[a-z]/.test(password)) score += 1; // Has lowercase
  if (/[A-Z]/.test(password)) score += 1; // Has uppercase
  if (/[0-9]/.test(password)) score += 1; // Has number
  if (/[^a-zA-Z0-9]/.test(password)) score += 1; // Has special char

  if (score <= 2) {
    return {
      strength: 'weak',
      message: 'Mật khẩu yếu - Nên có ít nhất 8 ký tự, chữ hoa, chữ thường và số',
      score
    };
  } else if (score <= 4) {
    return {
      strength: 'medium',
      message: 'Mật khẩu trung bình - Thêm ký tự đặc biệt để tăng độ bảo mật',
      score
    };
  } else {
    return {
      strength: 'strong',
      message: 'Mật khẩu mạnh',
      score
    };
  }
}

// Amount validation (for transaction amounts)
export function validateAmount(amount: any): string | null {
  if (!amount || amount === '') {
    return 'Số tiền không được để trống';
  }

  const numAmount = Number(amount);
  
  if (isNaN(numAmount)) {
    return 'Số tiền phải là một số';
  }

  if (numAmount <= 0) {
    return 'Số tiền phải lớn hơn 0';
  }

  if (numAmount > 999999999999) {
    return 'Số tiền quá lớn';
  }

  return null;
}

// Date validation
export function validateDate(date: string, options?: {
  allowFuture?: boolean;
  allowPast?: boolean;
  minDate?: string;
  maxDate?: string;
}): string | null {
  if (!date) {
    return 'Ngày không được để trống';
  }

  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Ngày không hợp lệ';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (options?.allowFuture === false && dateObj > today) {
    return 'Không được chọn ngày trong tương lai';
  }

  if (options?.allowPast === false && dateObj < today) {
    return 'Không được chọn ngày trong quá khứ';
  }

  if (options?.minDate) {
    const minDateObj = new Date(options.minDate);
    if (dateObj < minDateObj) {
      return `Ngày phải sau ${minDateObj.toLocaleDateString('vi-VN')}`;
    }
  }

  if (options?.maxDate) {
    const maxDateObj = new Date(options.maxDate);
    if (dateObj > maxDateObj) {
      return `Ngày phải trước ${maxDateObj.toLocaleDateString('vi-VN')}`;
    }
  }

  return null;
}

// Confirm password validation
export function validateConfirmPassword(password: string, confirmPassword: string): string | null {
  if (!confirmPassword) {
    return 'Vui lòng xác nhận mật khẩu';
  }

  if (password !== confirmPassword) {
    return 'Mật khẩu xác nhận không khớp';
  }

  return null;
}
