import { createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { authStore } from '@/lib/auth/authStore';

// ✅ CREATE COMPANY PAGE (Per Guide)
const CreateCompanyPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Form fields - Business accounting only
  const [formData, setFormData] = createSignal({
    // companyType removed - all companies are business entities
    name: '',
    email: '',
    phoneNumber: '',
    website: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    settings: {
      baseCurrency: 'USD',
      accountingMethod: 'accrual' as 'accrual' | 'cash',
      fiscalYearStart: '01-01',
    },
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const data = formData();

    // Validation
    if (!data.name.trim()) {
      setError('Company name is required');
      setIsLoading(false);
      return;
    }

    try {
      // ✅ CREATE COMPANY WITH MEMBERSHIP (Business only)
      const result = await authStore.createCompany({
        // companyType removed - all companies are business entities
        name: data.name.trim(),
        email: data.email.trim() || undefined,
        phoneNumber: data.phoneNumber.trim() || undefined,
        website: data.website.trim() || undefined,
        address: data.address,
        settings: data.settings,
      });

      if (result.success) {
        // Company created and selected automatically
        navigate('/dashboard');
      } else {
        setError(result.error || 'Failed to create company');
      }
    } catch {
      setError('Failed to create company. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSettingsChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      settings: { ...prev.settings, [field]: value },
    }));
  };

  return (
    <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-md">
        <div class="mb-6 text-center">
          <h2 class="text-2xl font-semibold text-gray-900">
            Create Your Company
          </h2>
          <p class="mt-2 text-gray-600">Set up your accounting workspace</p>
        </div>

        <form onSubmit={handleSubmit} class="space-y-4">
          {/* Company Name */}
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Company Name *
            </label>
            <input
              type="text"
              value={formData().name}
              onInput={(e) => handleInputChange('name', e.currentTarget.value)}
              placeholder="Enter company name"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isLoading()}
            />
          </div>

          {/* Company Email */}
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Company Email
            </label>
            <input
              type="email"
              value={formData().email}
              onInput={(e) => handleInputChange('email', e.currentTarget.value)}
              placeholder="company@example.com"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading()}
            />
          </div>

          {/* Base Currency */}
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Base Currency
            </label>
            <select
              value={formData().settings.baseCurrency}
              onChange={(e) =>
                handleSettingsChange('baseCurrency', e.currentTarget.value)
              }
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading()}
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="JPY">JPY - Japanese Yen</option>
              <option value="CHF">CHF - Swiss Franc</option>
              <option value="CNY">CNY - Chinese Yuan</option>
            </select>
          </div>

          {/* Accounting Method */}
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Accounting Method
            </label>
            <select
              value={formData().settings.accountingMethod}
              onChange={(e) =>
                handleSettingsChange('accountingMethod', e.currentTarget.value)
              }
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading()}
            >
              <option value="accrual">
                Accrual - Record when earned/incurred
              </option>
              <option value="cash">Cash - Record when paid/received</option>
            </select>
          </div>

          {/* Fiscal Year Start */}
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Fiscal Year Start
            </label>
            <select
              value={formData().settings.fiscalYearStart}
              onChange={(e) =>
                handleSettingsChange('fiscalYearStart', e.currentTarget.value)
              }
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading()}
            >
              <option value="01-01">January 1st</option>
              <option value="04-01">April 1st</option>
              <option value="07-01">July 1st</option>
              <option value="10-01">October 1st</option>
            </select>
          </div>

          {/* Error Message */}
          {error() && (
            <div class="rounded-md border border-red-200 bg-red-50 p-3">
              <p class="text-sm text-red-600">{error()}</p>
            </div>
          )}

          {/* Buttons */}
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/select-company')}
              class="flex-1 rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
              disabled={isLoading()}
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading()}
            >
              {isLoading() ? 'Creating...' : 'Create Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCompanyPage;
