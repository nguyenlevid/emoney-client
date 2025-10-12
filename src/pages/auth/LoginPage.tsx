import { createSignal, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { z } from 'zod';
import { authStore } from '@/lib/auth/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = createSignal<LoginForm>({ email: '', password: '' });
  const [errors, setErrors] = createSignal<Partial<LoginForm>>({});
  const [isLoading, setIsLoading] = createSignal(false);
  const [generalError, setGeneralError] = createSignal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setGeneralError('');

    try {
      // Validate form
      const validatedForm = loginSchema.parse(form());

      // Attempt login
      console.log('Attempting login with:', { account: validatedForm.email });
      const success = await authStore.login({
        account: validatedForm.email,
        password: validatedForm.password,
      });

      console.log('Login result:', success);

      if (success) {
        // Check if user has any memberships
        if (authStore.memberships.length > 0) {
          navigate('/company-selector');
        } else {
          navigate('/create-company');
        }
      } else {
        setGeneralError('Invalid email or password');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<LoginForm> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof LoginForm] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setGeneralError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof LoginForm) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors()[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div class="flex min-h-screen items-center justify-center bg-gray-50">
      <div class="w-full max-w-md space-y-8 p-8">
        <div class="text-center">
          <h1 class="mb-2 text-3xl font-bold text-gray-900">
            E-Money Accounting
          </h1>
          <h2 class="mb-2 text-xl font-semibold text-gray-700">
            Sign in to your account
          </h2>
          <p class="text-gray-600">Access your financial data securely</p>
        </div>

        <form onSubmit={handleSubmit} class="mt-8 space-y-6">
          <Show when={generalError()}>
            <div class="rounded-md border border-red-200 bg-red-50 p-4">
              <div class="text-sm text-red-700">{generalError()}</div>
            </div>
          </Show>

          <div class="space-y-4">
            <FormField label="Email address" error={errors().email} required>
              <Input
                type="email"
                value={form().email}
                onInput={(e) => updateField('email')(e.currentTarget.value)}
                placeholder="Enter your email"
                autocomplete="email"
                required
                class="w-full"
              />
            </FormField>

            <FormField label="Password" error={errors().password} required>
              <Input
                type="password"
                value={form().password}
                onInput={(e) => updateField('password')(e.currentTarget.value)}
                placeholder="Enter your password"
                autocomplete="current-password"
                required
                class="w-full"
              />
            </FormField>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label for="remember-me" class="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div class="text-sm">
              <a
                href="/forgot-password"
                class="font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </a>
            </div>
          </div>

          <Button type="submit" disabled={isLoading()} class="w-full">
            <Show when={isLoading()} fallback="Sign in">
              <span class="flex items-center justify-center">
                <svg
                  class="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Signing in...
              </span>
            </Show>
          </Button>
        </form>

        <div class="text-center">
          <p class="text-sm text-gray-600">
            Don't have an account?{' '}
            <a
              href="/register"
              class="font-medium text-blue-600 hover:text-blue-500"
            >
              Contact your administrator
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
