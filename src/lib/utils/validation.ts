import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format');
export const phoneSchema = z
  .string()
  .regex(
    /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
    'Invalid phone number format'
  );
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one lowercase, uppercase, and number'
  );

// Authentication schemas
export const loginSchema = z.object({
  account: z.string().min(1, 'Account is required'),
  password: z.string().min(1, 'Password is required'),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const requestPasswordResetSchema = z.object({
  email: emailSchema,
});

// Company schemas
export const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

export const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  email: emailSchema,
  phoneNumber: phoneSchema.optional(),
  address: addressSchema.optional(),
  settings: z
    .object({
      baseCurrency: z.string().default('USD'),
      fiscalYearStart: z.string().default('01-01'),
      accountingMethod: z.enum(['accrual', 'cash']).default('accrual'),
    })
    .optional(),
});

export const updateCompanySchema = companySchema.partial();

// Account schemas
export const accountSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  code: z.string().min(1, 'Account code is required'),
  name: z.string().min(1, 'Account name is required'),
  accountType: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  subType: z.string().min(1, 'Sub type is required'),
  parentAccount: z.string().optional(),
  description: z.string().optional(),
  taxCode: z.string().optional(),
});

export const updateAccountSchema = accountSchema
  .partial()
  .omit({ companyId: true });

// Transaction schemas
export const transactionEntrySchema = z.object({
  account: z.string().min(1, 'Account is required'),
  debit: z.number().min(0, 'Debit must be non-negative'),
  credit: z.number().min(0, 'Credit must be non-negative'),
  description: z.string().optional(),
});

export const transactionSchema = z
  .object({
    companyId: z.string().min(1, 'Company ID is required'),
    date: z.string().min(1, 'Date is required'),
    description: z.string().min(1, 'Description is required'),
    reference: z.string().optional(),
    sourceType: z.enum(['MANUAL', 'INVOICE', 'EXPENSE', 'PAYMENT']).optional(),
    entries: z
      .array(transactionEntrySchema)
      .min(2, 'At least two entries are required'),
    customerId: z.string().optional(),
    supplierId: z.string().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      const totalDebits = data.entries.reduce(
        (sum, entry) => sum + entry.debit,
        0
      );
      const totalCredits = data.entries.reduce(
        (sum, entry) => sum + entry.credit,
        0
      );
      return Math.abs(totalDebits - totalCredits) < 0.01;
    },
    {
      message: 'Total debits must equal total credits',
      path: ['entries'],
    }
  );

export const manualTransactionSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().min(1, 'Date is required'),
  amount: z.number().positive('Amount must be positive'),
  debitAccountId: z.string().min(1, 'Debit account is required'),
  creditAccountId: z.string().min(1, 'Credit account is required'),
  reference: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const expenseTransactionSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().min(1, 'Date is required'),
  amount: z.number().positive('Amount must be positive'),
  expenseAccountId: z.string().min(1, 'Expense account is required'),
  payableAccountId: z.string().min(1, 'Payable account is required'),
  supplierId: z.string().optional(),
  merchant: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Contact schemas
const baseContactSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  type: z.enum(['customer', 'supplier', 'employee', 'merchant', 'other']),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  address: addressSchema.optional(),
  currency: z.string().optional(),
  creditLimit: z.number().min(0).optional(),
  paymentTerms: z.string().optional(),
  taxId: z.string().optional(),
  website: z.string().url().optional(),
  notes: z.string().optional(),
});

export const contactSchema = baseContactSchema.refine(
  (data) => data.firstName || data.lastName || data.companyName,
  {
    message: 'Either name or company name is required',
    path: ['firstName'],
  }
);

export const updateContactSchema = baseContactSchema
  .partial()
  .omit({ companyId: true })
  .refine((data) => data.firstName || data.lastName || data.companyName, {
    message: 'Either name or company name is required',
    path: ['firstName'],
  });

// User management schemas
export const inviteUserSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  email: emailSchema,
  role: z.enum(['admin', 'accountant', 'viewer']),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// Search and filter schemas
export const searchSchema = z.object({
  search: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
});

export const dateRangeSchema = z
  .object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      return new Date(data.startDate) <= new Date(data.endDate);
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

// Form validation helper
export function validateField<T>(
  schema: z.ZodSchema<T>,
  value: unknown,
  field?: string
): { isValid: boolean; error?: string } {
  try {
    schema.parse(value);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = field
        ? error.errors.find((err) => err.path.includes(field))
        : error.errors[0];
      return {
        isValid: false,
        error: fieldError?.message || 'Invalid value',
      };
    }
    return {
      isValid: false,
      error: 'Validation failed',
    };
  }
}

// Currency validation
export const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'JPY',
  'CHF',
  'CNY',
  'INR',
  'MXN',
] as const;

export const currencySchema = z.enum(SUPPORTED_CURRENCIES);

// Account type validation
export const ACCOUNT_TYPES = [
  'ASSET',
  'LIABILITY',
  'EQUITY',
  'REVENUE',
  'EXPENSE',
] as const;

export const ACCOUNT_SUB_TYPES = {
  ASSET: ['CURRENT_ASSET', 'FIXED_ASSET', 'OTHER_CURRENT_ASSET', 'OTHER_ASSET'],
  LIABILITY: [
    'CURRENT_LIABILITY',
    'LONG_TERM_LIABILITY',
    'OTHER_CURRENT_LIABILITY',
  ],
  EQUITY: ['EQUITY', 'RETAINED_EARNINGS'],
  REVENUE: ['REVENUE', 'OTHER_INCOME'],
  EXPENSE: ['EXPENSE', 'COST_OF_GOODS_SOLD', 'OTHER_EXPENSE'],
} as const;

// File upload validation
export const fileUploadSchema = z
  .object({
    file: z.instanceof(File),
    maxSize: z.number().optional(),
    allowedTypes: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (data.maxSize && data.file.size > data.maxSize) {
        return false;
      }
      return true;
    },
    {
      message: 'File size exceeds maximum limit',
      path: ['file'],
    }
  )
  .refine(
    (data) => {
      if (data.allowedTypes && !data.allowedTypes.includes(data.file.type)) {
        return false;
      }
      return true;
    },
    {
      message: 'File type not allowed',
      path: ['file'],
    }
  );

// Custom validation functions
export function isValidAccountCode(code: string): boolean {
  // Account codes should be numeric and between 1000-9999
  const numericCode = parseInt(code);
  return !isNaN(numericCode) && numericCode >= 1000 && numericCode <= 9999;
}

export function isValidAmount(amount: number): boolean {
  return !isNaN(amount) && amount >= 0 && amount <= Number.MAX_SAFE_INTEGER;
}

export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}
