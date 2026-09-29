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
import { FileText, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import adminFormsApi from "../api/admin-forms";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { toast } from "sonner";
import { translateServerError } from "../lib/error-translations";
import { toPersianDigits } from "@/lib/utils";

interface FormSchema {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  is_active: boolean;
  is_multi_submit: boolean;
  total_submissions: number;
  created_at: string;
}

export function FormDefinitions() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<FormSchema | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const data = await adminFormsApi.getAll();
      setForms(data || []);
    } catch (err: unknown) {
      toast.error(translateServerError(err) || "خطا در دریافت فرم‌ها");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const toastId = toast.loading("در حال حذف فرم...");
    setDeleting(true);
    try {
      await adminFormsApi.remove(deleteTarget.id);
      toast.success("فرم با موفقیت حذف شد", { id: toastId });
      setDeleteTarget(null);
      fetchForms();
    } catch (err: unknown) {
      toast.error(translateServerError(err) || "خطا در حذف فرم", {
        id: toastId,
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-6 w-6" />
                <CardTitle>تعاریف فرم‌ها</CardTitle>
              </div>
              <CardDescription>مدیریت تمام فرم‌های پویا</CardDescription>
            </div>
            <Button onClick={() => navigate("/admin/forms/new")}>
              <Plus className="h-4 w-4 ml-2" />
              ایجاد فرم جدید
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size={32} />
            </div>
          ) : forms.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              هیچ فرمی یافت نشد
            </p>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-border bg-muted/50">
                      <th className="text-right p-3 font-semibold">عنوان</th>
                      <th className="text-right p-3 font-semibold">Slug</th>
                      <th className="text-center p-3 font-semibold">
                        تعداد ارسال‌ها
                      </th>
                      <th className="text-center p-3 font-semibold">وضعیت</th>
                      <th className="text-right p-3 font-semibold">
                        تاریخ ایجاد
                      </th>
                      <th className="text-center p-3 font-semibold">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forms.map((form) => (
                      <tr
                        key={form.id}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-3 font-medium">{form.title}</td>
                        <td
                          className="p-3 text-left font-mono text-sm"
                          dir="ltr"
                        >
                          {form.slug}
                        </td>
                        <td className="p-3 text-center">
                          {toPersianDigits(form.total_submissions)}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              form.is_active
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {form.is_active ? "فعال" : "غیرفعال"}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {toPersianDigits(
                            new Date(form.created_at).toLocaleDateString(
                              "fa-IR",
                            ),
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                navigate(`/admin/forms/${form.id}/edit`)
                              }
                            >
                              <Pencil className="h-3 w-3 ml-1" />
                              ویرایش
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteTarget(form)}
                            >
                              <Trash2 className="h-3 w-3 ml-1" />
                              حذف
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-3">
                {forms.map((form) => (
                  <div
                    key={form.id}
                    className="border border-border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <p className="font-medium truncate">{form.title}</p>
                        <p
                          className="text-xs text-muted-foreground font-mono"
                          dir="ltr"
                        >
                          {form.slug}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                          form.is_active
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {form.is_active ? "فعال" : "غیرفعال"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        ارسال‌ها: {toPersianDigits(form.total_submissions)}
                      </span>
                      <span>
                        {toPersianDigits(
                          new Date(form.created_at).toLocaleDateString("fa-IR"),
                        )}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-1 border-t border-border">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate(`/admin/forms/${form.id}/edit`)}
                      >
                        <Pencil className="h-3 w-3 ml-1" />
                        ویرایش
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => setDeleteTarget(form)}
                      >
                        <Trash2 className="h-3 w-3 ml-1" />
                        حذف
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader style={{ textAlign: "center" }}>
            <DialogTitle>حذف فرم</DialogTitle>
            <DialogDescription>
              آیا مطمئن هستید که می‌خواهید این فرم را حذف کنید؟ تمام ارسال‌های
              مربوط به آن نیز حذف خواهند شد. این اقدام قابل بازگشت نیست.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium">{deleteTarget.title}</p>
              <p className="text-sm text-muted-foreground" dir="ltr">
                {deleteTarget.slug}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="ml-2"
            >
              لغو
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "در حال حذف..." : "حذف فرم"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
