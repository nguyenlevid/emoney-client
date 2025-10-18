import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import FuturisticCard from '@/components/ui/FuturisticCard';
import FuturisticButton from '@/components/ui/FuturisticButton';
import CompanySelector from '@/components/ui/CompanySelector';
import { EmoneyInput } from '@/components/ui/EmoneyInput';
import { EmoneySelect } from '@/components/ui/EmoneySelect';
import { Input, Textarea } from '@/components/ui/Input';
import { KobalteInput } from '@/components/ui/KobalteInput';
import { KobalteSelect } from '@/components/ui/KobalteSelect';

export const FuturisticDemo: Component = () => {
  const [formData, setFormData] = createSignal({
    companyName: '',
    email: '',
    accountType: '',
    accountCode: '',
    description: '',
    currency: '',
    notes: '',
  });

  const handleFormUpdate = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  return (
    <div class="min-h-screen space-y-8 bg-background p-8">
      {/* Header Section */}
      <div class="space-y-4 text-center">
        <h1 class="text-glow text-4xl font-bold text-textPrimary">
          Next-Generation Finance Platform
        </h1>
        <p class="mx-auto max-w-2xl text-lg text-textSecondary">
          Experience the future of financial management with our intelligent,
          secure, and beautifully designed interface.
        </p>
      </div>

      {/* Company Selector Demo */}
      <FuturisticCard class="mx-auto max-w-md">
        <h2 class="mb-4 text-xl font-semibold text-textPrimary">
          Organization Selector
        </h2>
        <CompanySelector class="w-full" />
      </FuturisticCard>

      {/* Button Demos */}
      <FuturisticCard class="mx-auto max-w-4xl">
        <h2 class="mb-6 text-xl font-semibold text-textPrimary">
          Futuristic Buttons
        </h2>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="space-y-4">
            <FuturisticButton variant="primary">
              Primary Action
            </FuturisticButton>
            <FuturisticButton variant="accent">Accent Button</FuturisticButton>
            <FuturisticButton variant="secondary">
              Secondary Action
            </FuturisticButton>
            <FuturisticButton variant="ghost">Ghost Button</FuturisticButton>
          </div>
          <div class="space-y-4">
            <FuturisticButton variant="primary" size="sm">
              Small Button
            </FuturisticButton>
            <FuturisticButton variant="accent" size="lg">
              Large Button
            </FuturisticButton>
            <FuturisticButton variant="primary" loading>
              Loading State
            </FuturisticButton>
            <FuturisticButton variant="secondary" disabled>
              Disabled Button
            </FuturisticButton>
          </div>
        </div>
      </FuturisticCard>

      {/* Card Demos */}
      <div class="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <FuturisticCard>
          <h3 class="mb-2 text-lg font-semibold text-textPrimary">
            Revenue Analytics
          </h3>
          <div class="mb-2 text-3xl font-bold text-accent">$127,495</div>
          <p class="text-sm text-textSecondary">+12.5% from last month</p>
        </FuturisticCard>

        <FuturisticCard glow>
          <h3 class="mb-2 text-lg font-semibold text-textPrimary">
            Active Transactions
          </h3>
          <div class="mb-2 text-3xl font-bold text-success">1,247</div>
          <p class="text-sm text-textSecondary">Processing in real-time</p>
        </FuturisticCard>

        <FuturisticCard>
          <h3 class="mb-2 text-lg font-semibold text-textPrimary">
            Security Score
          </h3>
          <div class="mb-2 text-3xl font-bold text-accentAlt">98.7%</div>
          <p class="text-sm text-textSecondary">All systems operational</p>
        </FuturisticCard>
      </div>

      {/* Advanced UI Elements */}
      <FuturisticCard class="mx-auto max-w-4xl" glow>
        <h2 class="mb-6 text-xl font-semibold text-textPrimary">
          Financial Dashboard
        </h2>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Chart Placeholder */}
          <div class="flex aspect-video items-center justify-center rounded-glass border border-accent/20 bg-gradient-to-br from-accent/10 to-accentAlt/10">
            <div class="text-center">
              <div class="mb-2 text-accent">
                <svg
                  class="mx-auto h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <p class="text-textSecondary">Interactive Chart</p>
            </div>
          </div>

          {/* Stats Panel */}
          <div class="space-y-4">
            <div class="glass rounded-glass border border-border/30 p-4">
              <div class="flex items-center justify-between">
                <span class="text-sm text-textSecondary">Cash Flow</span>
                <span class="text-sm font-medium text-success">+5.2%</span>
              </div>
              <div class="mt-2 text-2xl font-bold text-textPrimary">
                $45,230
              </div>
            </div>

            <div class="glass rounded-glass border border-border/30 p-4">
              <div class="flex items-center justify-between">
                <span class="text-sm text-textSecondary">Expenses</span>
                <span class="text-sm font-medium text-warning">-2.1%</span>
              </div>
              <div class="mt-2 text-2xl font-bold text-textPrimary">
                $23,840
              </div>
            </div>

            <div class="glass rounded-glass border border-border/30 p-4">
              <div class="flex items-center justify-between">
                <span class="text-sm text-textSecondary">Net Profit</span>
                <span class="text-sm font-medium text-accent">+8.7%</span>
              </div>
              <div class="mt-2 text-2xl font-bold text-textPrimary">
                $21,390
              </div>
            </div>
          </div>
        </div>
      </FuturisticCard>

      {/* Form Components Demo */}
      <FuturisticCard class="mx-auto max-w-4xl">
        <h2 class="mb-6 text-xl font-semibold text-textPrimary">
          Enhanced Form Components
        </h2>
        <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Left Column - Emoney Components */}
          <div class="space-y-6">
            <h3 class="text-lg font-medium text-textPrimary">
              Emoney Components
            </h3>

            <EmoneyInput
              label="Company Name"
              placeholder="Enter company name"
              value={formData().companyName}
              onInput={(value) => handleFormUpdate('companyName', value)}
              required
            />

            <EmoneyInput
              label="Email Address"
              type="email"
              placeholder="user@example.com"
              value={formData().email}
              onInput={(value) => handleFormUpdate('email', value)}
              icon={
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              }
            />

            <EmoneySelect
              label="Account Type"
              placeholder="Select account type"
              value={formData().accountType}
              onChange={(value) => handleFormUpdate('accountType', value)}
              options={[
                { value: 'asset', label: 'Asset' },
                { value: 'liability', label: 'Liability' },
                { value: 'equity', label: 'Equity' },
                { value: 'revenue', label: 'Revenue' },
                { value: 'expense', label: 'Expense' },
              ]}
            />
          </div>

          {/* Right Column - Base Components */}
          <div class="space-y-6">
            <h3 class="text-lg font-medium text-textPrimary">
              Base Components
            </h3>

            <Input
              label="Account Code"
              placeholder="1000"
              value={formData().accountCode}
              onInput={(e) =>
                handleFormUpdate('accountCode', e.currentTarget.value)
              }
            />

            <KobalteInput
              label="Description"
              placeholder="Account description"
              value={formData().description}
              onInput={(value) => handleFormUpdate('description', value)}
            />

            <KobalteSelect
              label="Currency"
              placeholder="Select currency"
              value={formData().currency}
              onChange={(value) => handleFormUpdate('currency', value || '')}
              options={[
                { value: 'USD', label: '🇺🇸 US Dollar (USD)' },
                { value: 'EUR', label: '🇪🇺 Euro (EUR)' },
                { value: 'GBP', label: '🇬🇧 British Pound (GBP)' },
                { value: 'JPY', label: '🇯🇵 Japanese Yen (JPY)' },
              ]}
            />

            <Textarea
              label="Notes"
              placeholder="Additional notes or comments..."
              value={formData().notes}
              onInput={(e) => handleFormUpdate('notes', e.currentTarget.value)}
            />
          </div>
        </div>

        {/* Error State Demo */}
        <div class="mt-8 border-t border-border pt-6">
          <h3 class="mb-4 text-lg font-medium text-textPrimary">
            Error States
          </h3>
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <EmoneyInput
              label="Invalid Email"
              type="email"
              value="invalid-email"
              error="Please enter a valid email address"
            />
            <EmoneySelect
              label="Required Field"
              placeholder="This field is required"
              error="Please select an option"
              options={[
                { value: 'option1', label: 'Option 1' },
                { value: 'option2', label: 'Option 2' },
              ]}
            />
          </div>
        </div>

        <div class="mt-8 flex justify-end space-x-4">
          <FuturisticButton variant="secondary">Cancel</FuturisticButton>
          <FuturisticButton variant="accent">Save Account</FuturisticButton>
        </div>
      </FuturisticCard>
    </div>
  );
};

export default FuturisticDemo;
