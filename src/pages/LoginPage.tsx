import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { toast } from "sonner";
import { translateServerError } from "../lib/error-translations";
import logo from "../assets/logo-nt.png";

// Validation schema - Only phone and password required now
const loginSchema = z.object({
  phone: z
    .string()
    .regex(
      /^\+98\d{10,14}$/,
      "شماره تلفن باید با 98+ شروع شود (مانند: 989123456789+)",
    ),
  password: z.string().min(1, "رمز عبور الزامیست"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();

  // Password login form setup
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
      rememberMe: false,
    },
  });

  // Password login handler
  const onLogin = async (data: LoginFormData) => {
    const toastId = toast.loading("در حال ورود...");

    try {
      setIsSubmitting(true);
      await login(data.phone, data.password);
      toast.success("با موفقیت وارد شدید!", { id: toastId });
    } catch (err: unknown) {
      toast.error(
        translateServerError(err) ||
          "ورود ناموفق. لطفاً اطلاعات خود را بررسی کنید.",
        { id: toastId },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <img src={logo} alt="Logo" className="h-40 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            سامانه ثبت نام و ثبت فعالیت موسسه یاوران سلامت روان
          </CardTitle>
          <CardDescription className="text-center">
            نام کاربری و رمز عبور خود را وارد کنید.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={loginForm.handleSubmit(onLogin)}
            className="space-y-4"
          >
            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone">شماره همراه</Label>
              <Input
                id="phone"
                type="tel"
                dir="ltr"
                {...loginForm.register("phone")}
                placeholder="+989123456789"
                className={
                  loginForm.formState.errors.phone ? "border-destructive" : ""
                }
              />
              {loginForm.formState.errors.phone && (
                <p className="text-sm text-destructive">
                  {loginForm.formState.errors.phone.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...loginForm.register("password")}
                  placeholder="رمز عبور خود را وارد کنید"
                  className={
                    loginForm.formState.errors.password
                      ? "border-destructive pr-10"
                      : "pr-10"
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-2">
                <Checkbox id="remember" {...loginForm.register("rememberMe")} />
                <label
                  htmlFor="remember"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  مر ا به خاطر داشته باش
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner size={16} className="mr-2" />
                  در حال ورود...
                </>
              ) : (
                "ورود"
              )}
            </Button>
          </form>

          {/*Register Link*/}
          <p className="text-center text-sm text-muted-foreground pt-2">
            آیا حساب کاربری ندارید؟{" "}
            <Link
              to="/register"
              className="text-primary hover:underline font-medium"
            >
              ثبت نام
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
