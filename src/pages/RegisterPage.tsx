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

const registerSchema = z.object({
  firstName: z.string().min(2, "نام کوچک باید حداقل ۲ کاراکتر باشد"),
  lastName: z.string().min(2, "نام خانوادگی باید حداقل ۲ کاراکتر باشد"),
  phone: z
    .string()
    .regex(
      /^\+98\d{10,14}$/,
      "شماره تلفن باید با 98+ شروع شود (مانند: 989123456789+)",
    ),
  // # password validation disabled — any password accepted
  // password: z
  //   .string()
  //   .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد")
  //   .regex(/[A-Z]/, "رمز عبور باید شامل حداقل یک حرف بزرگ باشد")
  //   .regex(/[a-z]/, "رمز عبور باید شامل حداقل یک حرف کوچک باشد")
  //   .regex(/[0-9]/, "رمز عبور باید شامل حداقل یک عدد باشد")
  //   .regex(
  //     /[^A-Za-z0-9]/,
  //     "رمز عبور باید شامل حداقل یک کاراکتر خاص (@، $، ! و...) باشد",
  //   ),
  password: z.string(),
  confirmPassword: z.string(),
});
// .refine((data) => data.password === data.confirmPassword, {
//   message: "رمز عبور و تکرار آن مطابقت ندارند",
//   path: ["confirmPassword"],
// });

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const password = watch("password");

  // Password strength indicator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: "", color: "" };

    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;

    if (strength <= 2)
      return { strength, label: "ضعیف", color: "bg-destructive" };
    if (strength <= 4)
      return { strength, label: "متوسط", color: "bg-yellow-500" };
    return { strength, label: "قوی", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength(password);

  const onSubmit = async (data: RegisterForm) => {
    const toastId = toast.loading("در حال ایجاد حساب کاربری...");

    try {
      setIsSubmitting(true);

      await registerUser({
        phone: data.phone,
        first_name: data.firstName,
        last_name: data.lastName,
        password: data.password,
      });

      toast.success("حساب کاربری با موفقیت ایجاد شد!", { id: toastId });
    } catch (err: unknown) {
      toast.error(
        translateServerError(err) || "ثبت نام ناموفق. لطفاً دوباره تلاش کنید.",
        {
          id: toastId,
        },
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
      {/* <Card className="w-full max-w-lg">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <img src={logo} alt="Logo" className="h-40 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            ایجاد حساب کاربری
          </CardTitle>
          <CardDescription className="text-center">
            اطلاعات خود رو جهت ثبت نام وارد کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">نام</Label>
                <Input
                  id="firstName"
                  {...register("firstName")}
                  placeholder="نام خود را وارد کنید..."
                  className={errors.firstName ? "border-destructive" : ""}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">نام خانوادگی</Label>
                <Input
                  id="lastName"
                  {...register("lastName")}
                  placeholder="نام خانوادگی خود را وارد کنید..."
                  className={errors.lastName ? "border-destructive" : ""}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">شماره همراه</Label>
              <Input
                id="phone"
                type="tel"
                {...register("phone")}
                placeholder="+989123456789"
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="••••••••"
                  className={
                    errors.password ? "border-destructive pr-10" : "pr-10"
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i <= passwordStrength.strength
                            ? passwordStrength.color
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    قدرت: {passwordStrength.label}
                  </p>
                </div>
              )}
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تکرار رمز عبور</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  placeholder="••••••••"
                  className={
                    errors.confirmPassword
                      ? "border-destructive pr-10"
                      : "pr-10"
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!isValid || isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner size={16} className="mr-2" />
                  در حال ایجاد...
                </>
              ) : (
                "ایجاد حساب کاربری"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              قبلاً حساب کاربری دارید؟{" "}
              <Link
                to="/login"
                className="text-primary hover:underline font-medium">
                ورود
              </Link>
            </p>
          </form>
        </CardContent>
      </Card> */}
    </div>
  );
}
