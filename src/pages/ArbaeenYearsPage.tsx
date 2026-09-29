import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import arbaeenApi from "../api/arbaeen";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { toast } from "sonner";
import { translateServerError } from "../lib/error-translations";
import { toPersianDigits } from "@/lib/utils";
import { useAuth } from "../hooks/useAuth";
import { Lock } from "lucide-react";

interface ArbaeenYear {
  id: number;
  year: string;
  created_at: string;
}

export function ArbaeenYearsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [years, setYears] = useState<ArbaeenYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<ArbaeenYear | null>(null);
  const [newYear, setNewYear] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  useEffect(() => {
    fetchYears();
  }, []);

  const fetchYears = async () => {
    try {
      setLoading(true);
      const data = await arbaeenApi.getYears();
      setYears(data || []);
    } catch (err: unknown) {
      toast.error(translateServerError(err) || "خطا در دریافت سال‌ها");
    } finally {
      setLoading(false);
    }
  };

  const handleAddYear = async () => {
    if (!newYear.trim()) {
      toast.error("سال را وارد کنید");
      return;
    }
    const toastId = toast.loading("در حال ایجاد سال...");
    setIsSubmitting(true);
    try {
      await arbaeenApi.createYear({ year: newYear.trim() });
      toast.success("سال با موفقیت ایجاد شد!", { id: toastId });
      setIsAddDialogOpen(false);
      setNewYear("");
      fetchYears();
    } catch (err: unknown) {
      toast.error(translateServerError(err) || "خطا در ایجاد سال", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteYear = async () => {
    if (!selectedYear) return;
    const toastId = toast.loading("در حال حذف سال...");
    try {
      await arbaeenApi.deleteYear(selectedYear.id);
      toast.success("سال با موفقیت حذف شد!", { id: toastId });
      setIsDeleteDialogOpen(false);
      setSelectedYear(null);
      fetchYears();
    } catch (err: unknown) {
      toast.error(translateServerError(err) || "خطا در حذف سال", {
        id: toastId,
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-6 w-6 text-destructive" />
              <CardTitle>دسترسی رد شد</CardTitle>
            </div>
            <CardDescription>
              شما اجازه دسترسی به این صفحه را ندارید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              فقط مدیران می‌توانند این صفحه را مشاهده کنند.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-6 w-6" />
                <CardTitle>مواکب اربعین</CardTitle>
              </div>
              <CardDescription>مدیریت لیست مواکب اربعین سالانه</CardDescription>
            </div>
            <Button className="mt-2" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              افزودن سال
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size={32} />
            </div>
          ) : years.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              هنوز سالی اضافه نشده است
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {years.map((year) => (
                <div
                  key={year.id}
                  className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => navigate(`/admin/arbaeen/${year.id}`)}
                      className="flex items-center gap-3 hover:text-primary transition-colors"
                    >
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div className="text-right">
                        <p className="font-medium text-lg">
                          {toPersianDigits(year.year)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          مشاهده مواکب
                        </p>
                      </div>
                    </button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedYear(year);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Year Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader style={{ textAlign: "center" }}>
            <DialogTitle>افزودن سال جدید</DialogTitle>
            <DialogDescription>
              سال اربعین مورد نظر را وارد کنید
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-year">سال</Label>
              <Input
                id="new-year"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                placeholder="مثال: 1445"
                dir="ltr"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddYear();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isSubmitting}
              className="ml-2"
            >
              لغو
            </Button>
            <Button onClick={handleAddYear} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner size={16} />
                  در حال ایجاد...
                </>
              ) : (
                "ایجاد"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader style={{ textAlign: "center" }}>
            <DialogTitle>حذف سال</DialogTitle>
            <DialogDescription>
              آیا مطمئن هستید؟ تمام مواکب و مشاوران این سال حذف خواهند شد.
            </DialogDescription>
          </DialogHeader>
          {selectedYear && (
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="font-medium text-lg">
                {toPersianDigits(selectedYear.year)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="ml-2"
            >
              لغو
            </Button>
            <Button variant="destructive" onClick={handleDeleteYear}>
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
