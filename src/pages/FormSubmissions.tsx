import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  ClipboardList,
  Eye,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  File,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import adminFormsApi from "../api/admin-forms";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { toast } from "sonner";
import { translateServerError } from "../lib/error-translations";
import { uploadUrl } from "../utiles/fileUtils";
import { toPersianDigits } from "@/lib/utils";
import { formatProvinceCity } from "../data/iranian-provinces-cities";
import { formatContinentCountry } from "../data/continents-countries";

interface FieldDefinition {
  name: string;
  label: string;
  type: string;
  options?: { label: string; value: string }[];
}

interface FormSchema {
  id: number;
  slug: string;
  title: string;
  fields: FieldDefinition[];
}

interface SubmissionUser {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
}

interface Submission {
  id: number;
  user_id: number;
  form_id: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  answers: Record<string, any>;
  created_at: string;
  user: SubmissionUser;
}

export function FormSubmissions() {
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [formTitle, setFormTitle] = useState("");
  const [loadingForms, setLoadingForms] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [formFields, setFormFields] = useState<FieldDefinition[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoadingForms(true);
      const data = await adminFormsApi.getAll();
      setForms(
        (data || []).filter((f: FormSchema) => f.slug !== "self-declaration"),
      );
    } catch (err: unknown) {
      toast.error(translateServerError(err) || "خطا در دریافت فرم‌ها");
    } finally {
      setLoadingForms(false);
    }
  };

  const fetchSubmissions = async (formId: number) => {
    try {
      setLoadingSubs(true);
      const data = await adminFormsApi.getSubmissions(formId);
      setSubmissions(data.submissions || []);
      setFormTitle(data.form?.title || "");
      setFormFields(data.form?.fields || []);
    } catch (err: unknown) {
      toast.error(translateServerError(err) || "خطا در دریافت ارسال‌ها");
      setSubmissions([]);
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleFormChange = (value: string) => {
    setSelectedFormId(value);
    setExpandedId(null);
    if (value) {
      fetchSubmissions(Number(value));
    } else {
      setSubmissions([]);
      setFormTitle("");
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const fullName =
      `${sub.user?.first_name ?? ""} ${sub.user?.last_name ?? ""}`.toLowerCase();
    const phone = sub.user?.phone ?? "";
    return fullName.includes(q) || phone.includes(q);
  });

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="h-6 w-6" />
            <CardTitle>ارسال‌های فرم‌ها</CardTitle>
          </div>
          <CardDescription>
            مشاهده ارسال‌های کاربران برای هر فرم
          </CardDescription>
          <div className="mt-4">
            <Label htmlFor="form-select">انتخاب فرم</Label>
            <Select value={selectedFormId} onValueChange={handleFormChange}>
              <SelectTrigger id="form-select" className="w-full max-w-sm mt-1">
                <SelectValue placeholder="یک فرم را انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                {loadingForms ? (
                  <SelectItem value="__loading__" disabled>
                    در حال بارگذاری...
                  </SelectItem>
                ) : forms.length === 0 ? (
                  <SelectItem value="__empty__" disabled>
                    هیچ فرمی یافت نشد
                  </SelectItem>
                ) : (
                  forms.map((form) => (
                    <SelectItem key={form.id} value={String(form.id)}>
                      {form.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loadingSubs ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size={32} />
            </div>
          ) : !selectedFormId ? (
            <p className="text-muted-foreground text-center py-8">
              لطفاً یک فرم را انتخاب کنید
            </p>
          ) : submissions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              هیچ ارسالی برای این فرم وجود ندارد
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {toPersianDigits(submissions.length)} ارسال برای "{formTitle}"
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
                filteredSubmissions.map((sub) => (
                  <Card key={sub.id} className="overflow-hidden">
                    <button
                      onClick={() => toggleExpand(sub.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-right"
                    >
                      <div className="flex items-center gap-3">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {sub.user?.first_name} {sub.user?.last_name}
                          </p>
                          <p
                            className="text-xs text-muted-foreground"
                            dir="ltr"
                          >
                            {sub.user?.phone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {toPersianDigits(
                            new Date(sub.created_at).toLocaleDateString(
                              "fa-IR",
                            ),
                          )}
                        </span>
                        {expandedId === sub.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </button>
                    {expandedId === sub.id && (
                      <div className="border-t px-4 py-3 space-y-2 bg-muted/20">
                        {formFields.map((field) => {
                          const value = sub.answers[field.name];
                          if (
                            value === undefined ||
                            value === null ||
                            value === ""
                          )
                            return null;

                          const formatValue = (val: unknown) => {
                            const isFileUrl =
                              typeof val === "string" &&
                              (val.startsWith("/uploads/") ||
                                val.startsWith("http"));
                            if (isFileUrl) {
                              const fileUrl = uploadUrl(val);
                              const isImage =
                                typeof val === "string" &&
                                /\.(png|jpe?g|gif|webp|svg)$/i.test(val);
                              if (isImage) {
                                return (
                                  <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
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
                            if (Array.isArray(val)) {
                              if (field?.options) {
                                return val
                                  .map(
                                    (v) =>
                                      field.options?.find((o) => o.value === v)
                                        ?.label || v,
                                  )
                                  .join(", ");
                              }
                              return val.join(", ");
                            }
                            if (typeof val === "object" && val !== null) {
                              if (field?.type === "province_city")
                                return formatProvinceCity(val);
                              if (field?.type === "continent_country")
                                return formatContinentCountry(val);
                              return Object.entries(val)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(" | ");
                            }
                            if (field?.options) {
                              const option = field.options.find(
                                (o) => o.value === val,
                              );
                              if (option) return option.label;
                            }
                            return String(val ?? "");
                          };

                          return (
                            <div
                              key={field.name}
                              className="grid grid-cols-3 gap-2 text-sm"
                            >
                              <span className="font-medium text-muted-foreground col-span-1">
                                {field.label}
                              </span>
                              <span className="col-span-2">
                                {formatValue(value)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
