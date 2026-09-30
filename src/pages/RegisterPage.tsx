import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import logo from "../assets/logo-nt.png";

// Self-registration is closed: the sign-up window has ended, so this page renders
// a notice and a link back to login rather than a form. The form below is kept
// commented out so it can be restored when registration reopens.
//
// NOTE: restoring it also requires restoring the logic that used to accompany it —
// the `registerSchema` (zod), the `useForm` wiring, the `useAuth().register` call
// and the password-visibility/strength state. All of that was removed because
// none of it was reachable while the form was commented out, and the unused
// variables were failing lint. Retrieve it from the git history for this file:
//
//   git log -p --follow -- src/pages/RegisterPage.tsx
export function RegisterPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `
          radial-gradient(ellipse at 30% 20%, hsl(var(--primary) / 0.1) 0%, transparent 60%),
          radial-gradient(ellipse at 70% 80%, hsl(var(--accent) / 0.08) 0%, transparent 60%),
          hsl(var(--muted) / 0.4)
        `,
      }}
    >
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <img src={logo} alt="Logo" className="h-40 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            پایان مهلت ثبت نام
          </CardTitle>
          <CardDescription className="text-center">
            متاسفانه مهلت ثبت نام به پایان رسیده و تا اطلاع ثانوی امکان ثبت نام
            وجود ندارد.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            بازگشت به صفحه{" "}
            <Link
              to="/login"
              className="text-primary hover:underline font-medium"
            >
              ورود
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
