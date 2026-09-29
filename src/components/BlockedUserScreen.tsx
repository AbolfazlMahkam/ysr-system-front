import { LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "../hooks/useAuth";

export function BlockedUserScreen() {
  const { logout } = useAuth();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `
          radial-gradient(ellipse at 30% 20%, hsl(var(--destructive) / 0.08) 0%, transparent 60%),
          radial-gradient(ellipse at 70% 80%, hsl(var(--accent) / 0.08) 0%, transparent 60%),
          hsl(var(--muted) / 0.4)
        `,
      }}
    >
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto p-4 rounded-full bg-red-50 dark:bg-red-950">
            <ShieldAlert className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">
            عدم احراز شرایط
          </CardTitle>
          <CardDescription>
            حساب شما شرایط لازم برای ادامه فعالیت در سامانه را احراز نکرده
            است. در نتیجه امکان انجام هیچ‌گونه فعالیت یا عملیاتی در سامانه برای
            شما وجود ندارد.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            برای اطلاعات بیشتر با مدیریت موسسه در تماس باشید.
          </p>
          <Button variant="outline" className="w-full" onClick={logout}>
            <LogOut className="h-4 w-4 ml-2" />
            خروج از حساب کاربری
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
