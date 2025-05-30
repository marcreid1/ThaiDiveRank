import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { SignInForm } from "@/components/auth/SignInForm";

export default function Auth() {
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<"signin" | "signup">("signin");
  const [currentForm, setCurrentForm] = useState<"signin" | "signup">("signin");

  const handleShowDialog = (mode: "signin" | "signup") => {
    setDialogMode(mode);
    setShowDialog(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Test the SignUpForm and SignInForm components with live API integration
          </p>
          
          <div className="flex gap-4 justify-center mb-12">
            <Button onClick={() => handleShowDialog("signin")}>
              Open Sign In Dialog
            </Button>
            <Button variant="outline" onClick={() => handleShowDialog("signup")}>
              Open Sign Up Dialog
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Sign In Form</h2>
            <SignInForm onSwitchToSignUp={() => setCurrentForm("signup")} />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Sign Up Form</h2>
            <SignUpForm onSwitchToSignIn={() => setCurrentForm("signin")} />
          </div>
        </div>

        <div className="mt-12 max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Features Demonstrated:</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>✓ Email and password validation using Zod schemas</li>
              <li>✓ Password visibility toggle with eye icons</li>
              <li>✓ Form validation with error messages</li>
              <li>✓ Loading states during API calls</li>
              <li>✓ Success and error toast notifications</li>
              <li>✓ JWT token storage in localStorage</li>
              <li>✓ Form switching between Sign In and Sign Up</li>
              <li>✓ Responsive design with Tailwind CSS</li>
              <li>✓ Integration with Shadcn/ui components</li>
              <li>✓ React Hook Form with zodResolver</li>
            </ul>
          </div>
        </div>
      </div>

      <AuthDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        defaultMode={dialogMode}
      />
    </div>
  );
}