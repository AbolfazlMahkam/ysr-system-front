import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Users,
  ClipboardCheck,
  Send,
  Table2,
  PieChart,
  Search,
  Lock,
} from "lucide-react";
import adminFormsApi from "../api/admin-forms";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { toast } from "sonner";
import { translateServerError } from "../lib/error-translations";
import { toPersianDigits } from "@/lib/utils";
import { useAuth } from "../hooks/useAuth";

interface FormParticipation {
  id: number;
  slug: string;
  title: string;
  total_submissions: number;
  unique_users: number;
}

interface UserParticipation {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  forms_submitted: number;
  submissions_count: number;
  by_form: Record<number, number>;
}

interface ParticipationReport {
  forms: FormParticipation[];
  users: UserParticipation[];
  totals: {
    total_forms: number;
    total_users: number;
    users_with_submissions: number;
    total_submissions: number;
  };
  byFormCount: { forms: number; users: number }[];
}

const ALL_FORMS = "__all__";

export function FormParticipation() {
  const { user: currentUser } = useAuth();
  const [report, setReport] = useState<ParticipationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlySubmitters, setOnlySubmitters] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState(ALL_FORMS);

  const isAdmin =
    currentUser?.role === "admin" || currentUser?.role === "super_admin";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await adminFormsApi.getParticipation();
        if (!cancelled) setReport(data);
      } catch (err: unknown) {
        toast.error(translateServerError(err) || "خطا در دریافت گزارش مشارکت");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    if (!report) return [];
    const query = searchQuery.trim().toLowerCase();
    const formId =
      selectedFormId && selectedFormId !== ALL_FORMS
        ? Number(selectedFormId)
        : null;
    const rows = report.users.filter((user) => {
      if (onlySubmitters) {
        if (formId) {
          if (!(user.by_form[formId] || 0)) return false;
        } else if (user.submissions_count === 0) return false;
      }
      if (!query) return true;
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      return fullName.includes(query) || user.phone.includes(query);
    });
    if (formId) {
      return [...rows].sort((a, b) => {
        const ac = a.by_form[formId] || 0;
        const bc = b.by_form[formId] || 0;
        if (ac > 0 && bc === 0) return -1;
        if (bc > 0 && ac === 0) return 1;
        return a.id - b.id;
      });
    }
    return rows;
  }, [report, searchQuery, onlySubmitters, selectedFormId]);

  const selectedForm =
    report?.forms.find((f) => String(f.id) === selectedFormId) || null;

  const selectForm = (id: string) => {
    setSelectedFormId(id);
    document
      .getElementById("participation-matrix")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    <div className="p-6 space-y-6">
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-teal-500/10 via-background to-sky-500/5 p-8 glass">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-teal-500 to-sky-500 rounded-r-full" />
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-500">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">گزارش مشارکت در فرم‌ها</h1>
            <p className="text-sm text-muted-foreground">
              تعداد کاربرانی که هر فرم را تکمیل کرده‌اند و تعداد فرم‌های
              تکمیل‌شده برای هر کاربر
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24">
          <LoadingSpinner size={40} />
          <p className="text-sm text-muted-foreground">
            در حال دریافت گزارش...
          </p>
        </div>
      ) : !report ? (
        <div className="rounded-xl border border-dashed p-16 text-center glass-smoked">
          <PieChart className="h-14 w-14 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium mb-1">گزارش در دسترس نیست</h3>
          <p className="text-sm text-muted-foreground">
            خطایی در دریافت داده‌ها رخ داده است
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-teal-500/10 to-teal-500/5 p-5 glass-smoked">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-500">
                  <Table2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">فرم فعال</p>
                  <p className="text-2xl font-bold">
                    {toPersianDigits(report.totals.total_forms)}
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-sky-500/10 to-sky-500/5 p-5 glass-smoked">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-500">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">کل کاربران</p>
                  <p className="text-2xl font-bold">
                    {toPersianDigits(report.totals.total_users)}
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-5 glass-smoked">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    کاربران شرکت‌کننده
                  </p>
                  <p className="text-2xl font-bold">
                    {toPersianDigits(report.totals.users_with_submissions)}
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-5 glass-smoked">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">کل ارسال‌ها</p>
                  <p className="text-2xl font-bold">
                    {toPersianDigits(report.totals.total_submissions)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-teal-500/10">
                    <Table2 className="h-5 w-5 text-teal-500" />
                  </div>
                  <CardTitle className="text-lg">
                    تعداد کاربران به تفکیک فرم
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {report.forms.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    فرمی یافت نشد
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-border bg-muted/50">
                          <th className="text-right p-3 font-semibold">ردیف</th>
                          <th className="text-right p-3 font-semibold">فرم</th>
                          <th className="text-right p-3 font-semibold">
                            کل ارسال‌ها
                          </th>
                          <th className="text-right p-3 font-semibold">
                            کاربران شرکت‌کننده
                          </th>
                          <th className="text-right p-3 font-semibold">
                            نرخ مشارکت
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.forms.map((form, index) => {
                          const rate =
                            report.totals.total_users > 0
                              ? Math.round(
                                  (form.unique_users /
                                    report.totals.total_users) *
                                    100,
                                )
                              : 0;
                          return (
                            <tr
                              key={form.id}
                              onClick={() => selectForm(String(form.id))}
                              className={`border-b border-border hover:bg-muted/30 transition-colors cursor-pointer ${
                                String(form.id) === selectedFormId
                                  ? "bg-teal-500/5"
                                  : ""
                              }`}
                            >
                              <td className="p-3 font-medium">
                                {toPersianDigits(index + 1)}
                              </td>
                              <td className="p-3 font-medium">{form.title}</td>
                              <td className="p-3">
                                {toPersianDigits(form.total_submissions)}
                              </td>
                              <td className="p-3">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-500/10 text-teal-500">
                                  {toPersianDigits(form.unique_users)} کاربر
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-teal-500 transition-all duration-500"
                                      style={{ width: `${rate}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium whitespace-nowrap">
                                    ٪{toPersianDigits(rate)}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {report.forms.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-3">
                    برای نمایش کاربران هر فرم، روی ردیف فرم کلیک کنید
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-sky-500/10">
                    <PieChart className="h-5 w-5 text-sky-500" />
                  </div>
                  <CardTitle className="text-lg">
                    توزیع کاربران بر اساس تعداد فرم
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {report.byFormCount.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    داده‌ای برای نمایش وجود ندارد
                  </p>
                ) : (
                  <div className="space-y-3">
                    {report.byFormCount.map((item) => {
                      const maxUsers = Math.max(
                        1,
                        ...report.byFormCount.map((b) => b.users),
                      );
                      return (
                        <div key={item.forms}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">
                              {item.forms === 0
                                ? "بدون ارسال"
                                : `${toPersianDigits(item.forms)} فرم`}
                            </span>
                            <span className="text-sm font-bold">
                              {toPersianDigits(item.users)} نفر
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-teal-500 transition-all duration-500"
                              style={{
                                width: `${(item.users / maxUsers) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card id="participation-matrix" className="scroll-mt-4">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <ClipboardCheck className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {selectedForm
                        ? `مشارکت در فرم «${selectedForm.title}»`
                        : "مشارکت به تفکیک کاربر و فرم"}
                    </CardTitle>
                    <CardDescription>
                      {selectedForm
                        ? "کاربرانی که در این فرم شرکت کرده‌اند را می‌بینید — برای نمای کلی «همه فرم‌ها» را انتخاب کنید"
                        : "تعداد ارسال‌های هر کاربر به هر فرم را نشان می‌دهد — نشانگر سبز یعنی کاربر در آن فرم شرکت کرده است"}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Select
                    value={selectedFormId}
                    onValueChange={setSelectedFormId}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="انتخاب فرم" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_FORMS}>همه فرم‌ها</SelectItem>
                      {report.forms.map((form) => (
                        <SelectItem key={form.id} value={String(form.id)}>
                          {form.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="جستجوی نام یا شماره..."
                      className="w-[200px]"
                    />
                  </div>
                  <Button
                    variant={onlySubmitters ? "default" : "outline"}
                    size="sm"
                    onClick={() => setOnlySubmitters((prev) => !prev)}
                  >
                    {selectedForm
                      ? "فقط شرکت‌کنندگان"
                      : "فقط کاربران دارای ارسال"}
                  </Button>
                </div>
              </div>
              {selectedForm && (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium">
                    <Users className="h-3.5 w-3.5" />
                    {toPersianDigits(selectedForm.unique_users)} کاربر
                    شرکت‌کننده
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-medium">
                    <Send className="h-3.5 w-3.5" />
                    {toPersianDigits(selectedForm.total_submissions)} ارسال
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-500 text-xs font-medium">
                    <BarChart3 className="h-3.5 w-3.5" />٪
                    {toPersianDigits(
                      report.totals.total_users > 0
                        ? Math.round(
                            (selectedForm.unique_users /
                              report.totals.total_users) *
                              100,
                          )
                        : 0,
                    )}{" "}
                    نرخ مشارکت
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {report.users.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  کاربری یافت نشد
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-border bg-muted/50">
                        <th className="text-right p-3 font-semibold whitespace-nowrap">
                          نام کاربر
                        </th>
                        <th className="text-right p-3 font-semibold whitespace-nowrap">
                          شماره همراه
                        </th>
                        {selectedForm ? (
                          <th className="text-center p-3 font-semibold whitespace-nowrap">
                            {selectedForm.title}
                          </th>
                        ) : (
                          report.forms.map((form) => (
                            <th
                              key={form.id}
                              className="text-center p-3 font-semibold whitespace-nowrap"
                              title={form.title}
                            >
                              {form.title}
                            </th>
                          ))
                        )}
                        <th className="text-center p-3 font-semibold whitespace-nowrap">
                          فرم‌های مختلف
                        </th>
                        <th className="text-center p-3 font-semibold whitespace-nowrap">
                          کل ارسال‌ها
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className={`border-b border-border hover:bg-muted/30 transition-colors ${
                            selectedForm &&
                            (user.by_form[selectedForm.id] || 0) > 0
                              ? "bg-emerald-500/5"
                              : ""
                          }`}
                        >
                          <td className="p-3 font-medium whitespace-nowrap">
                            {user.first_name} {user.last_name}
                          </td>
                          <td
                            className="p-3 text-right whitespace-nowrap"
                            dir="ltr"
                          >
                            {toPersianDigits(user.phone)}
                          </td>
                          {selectedForm ? (
                            <td className="p-2 text-center">
                              {(user.by_form[selectedForm.id] || 0) > 0 ? (
                                <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
                                  {toPersianDigits(
                                    user.by_form[selectedForm.id] || 0,
                                  )}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/40">
                                  —
                                </span>
                              )}
                            </td>
                          ) : (
                            report.forms.map((form) => {
                              const count = user.by_form[form.id] || 0;
                              return (
                                <td key={form.id} className="p-2 text-center">
                                  {count > 0 ? (
                                    <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
                                      {toPersianDigits(count)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground/40">
                                      —
                                    </span>
                                  )}
                                </td>
                              );
                            })
                          )}
                          <td className="p-3 text-center">
                            <span className="font-medium whitespace-nowrap">
                              {toPersianDigits(user.forms_submitted)}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-bold whitespace-nowrap">
                              {toPersianDigits(user.submissions_count)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default FormParticipation;
