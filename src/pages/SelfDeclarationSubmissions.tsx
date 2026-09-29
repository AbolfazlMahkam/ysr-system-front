import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ClipboardList,
  ExternalLink,
  File,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import adminFormsApi from "../api/admin-forms";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { toast } from "sonner";
import { translateServerError } from "../lib/error-translations";
import { uploadUrl } from "../utiles/fileUtils";
import { cn, toPersianDigits } from "@/lib/utils";
import { formatProvinceCity } from "../data/iranian-provinces-cities";
import { formatContinentCountry } from "../data/continents-countries";

interface FieldDefinition {
  name: string;
  label: string;
  type: string;
  options?: { label: string; value: string }[];
}

interface SelfDeclarationUser {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
}

interface SelfDeclaration {
  id: number;
  user_id: number;
  data: Record<string, unknown>;
  status: "pending" | "approved" | "returned";
  admin_notes: string | null;
  correction_fields: string[] | null;
  created_at: string;
  updated_at: string;
  user: SelfDeclarationUser;
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: "در انتظار بررسی",
    class: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950",
  },
  approved: {
    icon: CheckCircle2,
    label: "تأیید شده",
    class: "text-green-600 bg-green-50 dark:bg-green-950",
  },
  returned: {
    icon: AlertTriangle,
    label: "بازگشت داده شده",
    class: "text-red-600 bg-red-50 dark:bg-red-950",
  },
};

export function SelfDeclarationSubmissions() {
  const [submissions, setSubmissions] = useState<SelfDeclaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [schemaFields, setSchemaFields] = useState<FieldDefinition[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<SelfDeclaration | null>(null);
  const [reviewAction, setReviewAction] = useState<"approved" | "returned">(
    "approved",
  );
  const [reviewNotes, setReviewNotes] = useState("");
  const [correctionFields, setCorrectionFields] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSubmissions();
    fetchSchema();
  }, []);

  const fetchSchema = async () => {
    try {
      const forms = await adminFormsApi.getAll();
      const selfDeclForm = forms.find(
        (f: { slug: string }) => f.slug === "self-declaration",
      );
      if (selfDeclForm?.fields) {
        setSchemaFields(selfDeclForm.fields);
      }
    } catch {
      // schema fetch is non-critical
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const data = await adminFormsApi.getSelfDeclarations();
      setSubmissions(data || []);
    } catch (err: unknown) {
      toast.error(translateServerError(err) || "خطا در دریافت اظهارنامه‌ها");
    } finally {
      setLoading(false);
    }
  };

  const openReviewDialog = (sub: SelfDeclaration) => {
    setSelectedSubmission(sub);
    setReviewAction("approved");
    setReviewNotes("");
    setCorrectionFields([]);
    setDialogOpen(true);
  };

  const handleReview = async () => {
    if (!selectedSubmission) return;
    setSubmitting(true);
    try {
      await adminFormsApi.reviewSelfDeclaration(selectedSubmission.id, {
        status: reviewAction,
        admin_notes: reviewAction === "returned" ? reviewNotes : undefined,
        correction_fields:
          reviewAction === "returned" ? correctionFields : undefined,
      });
      toast.success(
        reviewAction === "approved"
          ? "اظهارنامه تأیید شد"
          : "اظهارنامه برای اصلاح بازگشت داده شد",
      );
      setDialogOpen(false);
      setSelectedSubmission(null);
      await fetchSubmissions();
    } catch (err: unknown) {
      toast.error(translateServerError(err) || "خطا در بررسی اظهارنامه");
    } finally {
      setSubmitting(false);
    }
  };

  const getFieldDef = (name: string) =>
    schemaFields.find((f) => f.name === name);

  const filteredSubmissions = submissions.filter((sub) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const fullName =
      `${sub.user?.first_name ?? ""} ${sub.user?.last_name ?? ""}`.toLowerCase();
    const phone = sub.user?.phone ?? "";
    return fullName.includes(q) || phone.includes(q);
  });

  const renderValue = (fieldKey: string, value: unknown) => {
    const field = getFieldDef(fieldKey);
    const isFileUrl =
      typeof value === "string" &&
      (value.startsWith("/uploads/") || value.startsWith("http"));
    if (isFileUrl) {
      const fileUrl = uploadUrl(value);
      const isImage =
        typeof value === "string" && /\.(png|jpe?g|gif|webp|svg)$/i.test(value);
      if (isImage) {
        return (
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={fileUrl}
              alt=""
              className="max-w-xs max-h-48 rounded border object-cover cursor-pointer hover:opacity-90 transition-opacity"
            />
          </a>
        );
      }
      return (
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          <File className="h-3 w-3" />
          مشاهده فایل
          <ExternalLink className="h-3 w-3" />
        </a>
      );
    }
    if (Array.isArray(value)) {
      if (field?.options) {
        return value
          .map((v) => field.options?.find((o) => o.value === v)?.label || v)
          .join(", ");
      }
      return value.join(", ");
    }
    if (typeof value === "object" && value !== null) {
      if (field?.type === "province_city") return formatProvinceCity(value);
      if (field?.type === "continent_country")
        return formatContinentCountry(value);
      return Object.entries(value as Record<string, unknown>)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" | ");
    }
    if (field?.options) {
      const option = field.options.find((o) => o.value === value);
      if (option) return option.label;
    }
    return String(value ?? "");
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="h-6 w-6" />
            <CardTitle>اظهارنامه‌های کاربران</CardTitle>
          </div>
          <CardDescription>
            مشاهده و بررسی اظهارنامه‌های ارسال شده توسط کاربران
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size={32} />
            </div>
          ) : submissions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              هیچ اظهارنامه‌ای ارسال نشده است
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {toPersianDigits(submissions.length)} اظهارنامه ارسال شده
                </p>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="جستجو بر اساس نام یا شماره تماس..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-9"
                  />
                </div>
              </div>
              {filteredSubmissions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  نتیجه‌ای یافت نشد
                </p>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-border bg-muted/50">
                          <th className="text-right p-3 font-semibold">
                            کاربر
                          </th>
                          <th className="text-right p-3 font-semibold">
                            شماره تماس
                          </th>
                          <th className="text-center p-3 font-semibold">
                            وضعیت
                          </th>
                          <th className="text-center p-3 font-semibold">
                            عملیات
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSubmissions.map((sub) => {
                          const StatusIcon = statusConfig[sub.status].icon;
                          return (
                            <tr
                              key={sub.id}
                              className="border-b border-border hover:bg-muted/30 transition-colors"
                            >
                              <td className="p-3 font-medium">
                                {sub.user?.first_name} {sub.user?.last_name}
                              </td>
                              <td
                                className="p-3 text-left font-mono text-sm"
                                dir="ltr"
                              >
                                {sub.user?.phone}
                              </td>
                              <td className="p-3 text-center">
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
                                    statusConfig[sub.status].class,
                                  )}
                                >
                                  <StatusIcon className="h-3 w-3" />
                                  {statusConfig[sub.status].label}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2 justify-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openReviewDialog(sub)}
                                  >
                                    <ClipboardList className="h-3 w-3 ml-1" />
                                    بررسی
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="md:hidden space-y-3">
                    {filteredSubmissions.map((sub) => {
                      const StatusIcon = statusConfig[sub.status].icon;
                      return (
                        <div
                          key={sub.id}
                          className="border border-border rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 min-w-0">
                              <p className="font-medium truncate">
                                {sub.user?.first_name} {sub.user?.last_name}
                              </p>
                              <p
                                className="text-xs text-muted-foreground font-mono"
                                dir="ltr"
                              >
                                {sub.user?.phone}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0",
                                statusConfig[sub.status].class,
                              )}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig[sub.status].label}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-border">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => openReviewDialog(sub)}
                            >
                              <ClipboardList className="h-3 w-3 ml-1" />
                              بررسی
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          if (!o) {
            setDialogOpen(false);
            setSelectedSubmission(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>بررسی اظهارنامه</DialogTitle>
            {selectedSubmission && (
              <DialogDescription>
                {selectedSubmission.user?.first_name}{" "}
                {selectedSubmission.user?.last_name} -{" "}
                <span dir="ltr">{selectedSubmission.user?.phone}</span>
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              <div className="space-y-2">
                {schemaFields.map((field) => {
                  const value = selectedSubmission.data[field.name];
                  if (value === undefined || value === null || value === "")
                    return null;
                  return (
                    <div
                      key={field.name}
                      className="grid grid-cols-3 gap-2 text-sm"
                    >
                      <span className="font-medium text-muted-foreground col-span-1">
                        {field.label}
                      </span>
                      <span className="col-span-2">
                        {renderValue(field.name, value)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {selectedSubmission.admin_notes && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm">
                  <span className="font-medium text-yellow-700 dark:text-yellow-400">
                    یادداشت مدیریت:
                  </span>
                  <p className="text-yellow-600 dark:text-yellow-500 mt-1">
                    {selectedSubmission.admin_notes}
                  </p>
                </div>
              )}

              {selectedSubmission.correction_fields &&
                selectedSubmission.correction_fields.length > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm">
                    <span className="font-medium text-red-700 dark:text-red-400">
                      فیلدهای نیازمند اصلاح:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedSubmission.correction_fields.map((fieldName) => {
                        const fieldDef = getFieldDef(fieldName);
                        return (
                          <span
                            key={fieldName}
                            className="inline-flex items-center px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-xs"
                          >
                            {fieldDef?.label || fieldName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

              {selectedSubmission.status !== "approved" && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex gap-2">
                    <Button
                      variant={
                        reviewAction === "approved" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setReviewAction("approved")}
                    >
                      <CheckCircle2 className="ml-1 h-4 w-4" />
                      تأیید
                    </Button>
                    <Button
                      variant={
                        reviewAction === "returned" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setReviewAction("returned")}
                    >
                      <AlertTriangle className="ml-1 h-4 w-4" />
                      بازگشت برای اصلاح
                    </Button>
                  </div>
                  {reviewAction === "returned" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="review-notes">
                          علت بازگشت (الزامی)
                        </Label>
                        <Textarea
                          id="review-notes"
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          placeholder="توضیحات اصلاحات مورد نیاز را وارد کنید"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>فیلدهای نیازمند اصلاح (الزامی)</Label>
                        <MultiSelect
                          options={schemaFields.map((f) => ({
                            label: f.label,
                            value: f.name,
                          }))}
                          selected={correctionFields}
                          onChange={setCorrectionFields}
                          placeholder="فیلدها را انتخاب کنید"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setSelectedSubmission(null);
              }}
            >
              بستن
            </Button>
            {selectedSubmission?.status !== "approved" && (
              <Button
                onClick={handleReview}
                disabled={
                  submitting ||
                  (reviewAction === "returned" &&
                    (!reviewNotes.trim() || correctionFields.length === 0))
                }
              >
                {submitting ? "در حال ثبت..." : "ثبت بررسی"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
