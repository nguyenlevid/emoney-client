import { createSignal, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [form, setForm] = createSignal<ForgotPasswordForm>({ email: '' });
  const [errors, setErrors] = createSignal<Partial<ForgotPasswordForm>>({});
  const [isLoading, setIsLoading] = createSignal(false);
  const [isSuccess, setIsSuccess] = createSignal(false);
  const [generalError, setGeneralError] = createSignal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setGeneralError('');

    try {
      // Validate form
      forgotPasswordSchema.parse(form());

      // Simulate password reset request
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setIsSuccess(true);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<ForgotPasswordForm> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof ForgotPasswordForm] = err.message;
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

  const updateField = (field: keyof ForgotPasswordForm) => (value: string) => {
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
          <h1 class="mb-2 text-3xl font-bold text-gray-900">Reset Password</h1>
          <p class="text-gray-600">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>
        </div>

        <Show
          when={!isSuccess()}
          fallback={
            <div class="rounded-md border border-green-200 bg-green-50 p-6 text-center">
              <svg
                class="mx-auto mb-4 h-12 w-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
              <h3 class="mb-2 text-lg font-medium text-green-900">
                Check your email
              </h3>
              <p class="mb-4 text-sm text-green-700">
                We've sent a password reset link to{' '}
                <strong>{form().email}</strong>
              </p>
              <p class="text-sm text-green-600">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onclick={() => setIsSuccess(false)}
                  class="font-medium underline hover:no-underline"
                >
                  try again
                </button>
              </p>
            </div>
          }
        >
          <form onSubmit={handleSubmit} class="mt-8 space-y-6">
            <Show when={generalError()}>
              <div class="rounded-md border border-red-200 bg-red-50 p-4">
                <div class="text-sm text-red-700">{generalError()}</div>
              </div>
            </Show>

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

            <Button type="submit" disabled={isLoading()} class="w-full">
              <Show when={isLoading()} fallback="Send reset link">
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
                  Sending...
                </span>
              </Show>
            </Button>
          </form>
        </Show>

        <div class="text-center">
          <A
            href="/login"
            class="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            ← Back to sign in
          </A>
        </div>
      </div>
    </div>
  );
}
