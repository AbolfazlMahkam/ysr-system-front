import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-3xl">۴۰۴</CardTitle>
          <CardDescription>صفحه مورد نظر یافت نشد.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/">بازگشت به صفحه اصلی</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
