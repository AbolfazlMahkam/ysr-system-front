import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  UserCheck,
  Users,
  FileSignature,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileText,
  ClipboardList,
  ChevronLeft,
  ListChecks,
  MapPin,
  UsersRound,
  ClipboardCheck,
  Send,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "../hooks/useAuth";
import { useActiveForms } from "../hooks/useActiveForms";
import formsApi from "../api/forms";
import adminFormsApi from "../api/admin-forms";
import arbaeenApi from "../api/arbaeen";
import { toPersianDigits } from "@/lib/utils";
import Image from "@/assets/IMG_20260405_115046_685.jpg";

interface Submission {
  id: number;
  form_id: number;
  created_at: string;
  form?: {
    id: number;
    title: string;
    slug: string;
  };
}

interface SelfDeclaration {
  id: number;
  status: "pending" | "approved" | "returned";
  admin_notes?: string | null;
  correction_fields?: string[] | null;
}

interface FormWithNotification {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  show_notification?: boolean;
  notification_title?: string | null;
  notification_text?: string | null;
}

interface AdminDashboardStats {
  users: {
    total: number;
    byStatus: {
      not_started: number;
      form_completed: number;
      awaiting_interview: number;
      accepted: number;
      not_meeting_requirements: number;
    };
  };
  selfDeclarations: {
    total: number;
    byStatus: {
      pending: number;
      approved: number;
      returned: number;
    };
  };
  forms: {
    id: number;
    slug: string;
    title: string;
    total_submissions: number;
    unique_users: number;
  }[];
  participation: {
    total_forms: number;
    total_users: number;
    users_with_submissions: number;
    total_submissions: number;
    byFormCount: { forms: number; users: number }[];
  };
}

interface Notification {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  action?: { label: string; to: string };
}

interface ProcessionInfo {
  id: number;
  name: string;
  location: string;
  address: string;
  consultants: {
    id: number;
    first_name: string;
    last_name: string;
    gender: string | null;
  }[];
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: "در انتظار تأیید",
    color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950",
  },
  approved: {
    icon: CheckCircle2,
    label: "تأیید شده",
    color: "text-green-600 bg-green-50 dark:bg-green-950",
  },
  returned: {
    icon: AlertTriangle,
    label: "نیازمند اصلاح",
    color: "text-red-600 bg-red-50 dark:bg-red-950",
  },
} as const;

export function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { forms, loading: formsLoading } = useActiveForms();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selfDeclaration, setSelfDeclaration] =
    useState<SelfDeclaration | null>(null);
  const [loading, setLoading] = useState(true);
  const [myProcessions, setMyProcessions] = useState<ProcessionInfo[]>([]);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const [adminStats, setAdminStats] = useState<AdminDashboardStats | null>(
    null,
  );
  const [adminStatsLoading, setAdminStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const promises = [
          formsApi.getMyAllSubmissions().catch(() => []),
          formsApi.getMySelfDeclaration().catch(() => null),
          arbaeenApi.getMyProcessions().catch(() => []),
        ];

        if (isAdmin) {
          promises.push(adminFormsApi.getDashboardStats().catch(() => null));
        }

        const [
          submissionsData,
          selfDeclData,
          myProcessionsData,
          adminStatsData,
        ] = await Promise.all(promises);
        if (cancelled) return;
        setSubmissions(submissionsData || []);
        setSelfDeclaration(selfDeclData);
        setMyProcessions(myProcessionsData || []);
        if (adminStatsData) {
          setAdminStats(adminStatsData);
        }
      } catch {
        // Silently handle
      } finally {
        if (!cancelled) {
          setLoading(false);
          setAdminStatsLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const notifications: Notification[] = [];

  if (selfDeclaration) {
    const status = statusConfig[selfDeclaration.status];
    const StatusIcon = status.icon;
    notifications.push({
      id: "self-declaration",
      title: `اظهارنامه ${status.label}`,
      description:
        selfDeclaration.status === "returned"
          ? "اظهارنامه شما نیازمند اصلاح است. لطفاً اقدام کنید."
          : selfDeclaration.status === "approved"
            ? "اظهارنامه شما توسط مدیریت تأیید شد."
            : "اظهارنامه شما در انتظار بررسی مدیریت است.",
      icon: StatusIcon,
      color: status.color,
      action:
        selfDeclaration.status === "returned"
          ? { label: "اصلاح اظهارنامه", to: "/forms/self-declaration" }
          : undefined,
    });
  }

  const formsWithNotification = forms as FormWithNotification[];
  for (const form of formsWithNotification) {
    if (form.show_notification) {
      notifications.push({
        id: `form-${form.slug}`,
        title: form.notification_title || form.title,
        description:
          form.notification_text || `فرم "${form.title}" در دسترس است`,
        icon: FileText,
        color: "text-blue-600 bg-blue-50 dark:bg-blue-950",
        action: {
          label: "پر کردن فرم",
          to: `/forms/${form.slug}`,
        },
      });
    }
  }

  const selfDeclSubmitted = !!selfDeclaration;
  const submittedFormIds = new Set(submissions.map((s) => s.form_id));
  const remainingForms = forms.filter((f) => !submittedFormIds.has(f.id));
  const completedForms = forms.filter((f) => submittedFormIds.has(f.id));

  const totalForms = forms.length + 1;
  const totalSubmissions = submissions.length + (selfDeclSubmitted ? 1 : 0);
  const totalRemaining = remainingForms.length + (selfDeclSubmitted ? 0 : 1);
  const selfDeclForm = {
    id: -1,
    slug: "self-declaration",
    title: "اظهارنامه",
    description: "فرم اظهارنامه شخصی",
  };

  if (loading || formsLoading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <img src={Image} className="rounded-2xl" />
      </div>

      <div>
        <h1 className="text-2xl font-bold">
          خوش آمدید، {user?.first_name} {user?.last_name}
        </h1>
        <p className="text-muted-foreground mt-1">
          به داشبورد {isAdmin ? "مدیریت" : "کاربری"} خود خوش آمدید
        </p>
      </div>

      <ProcessionInfoCard processions={myProcessions} />

      {isAdmin && (
        <>
          <div className="border-t pt-6" />

          {adminStatsLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : adminStats ? (
            <>
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl" />
                <div className="relative flex items-center gap-3 p-4">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">داشبورد مدیریت</h2>
                    <p className="text-sm text-muted-foreground">
                      آمار و وضعیت کلی سیستم
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <SummaryWidget
                  icon={Users}
                  label="کل کاربران"
                  value={adminStats.users.total}
                  color="text-blue-600"
                  bgColor="bg-blue-50 dark:bg-blue-950"
                />
                <SummaryWidget
                  icon={FileText}
                  label="کل اظهارنامه‌ها"
                  value={adminStats.selfDeclarations.total}
                  color="text-purple-600"
                  bgColor="bg-purple-50 dark:bg-purple-950"
                />
                <SummaryWidget
                  icon={Clock}
                  label="در انتظار مصاحبه"
                  value={adminStats.users.byStatus.awaiting_interview}
                  color="text-yellow-600"
                  bgColor="bg-yellow-50 dark:bg-yellow-950"
                />
                <SummaryWidget
                  icon={CheckCircle2}
                  label="پذیرفته شده"
                  value={adminStats.users.byStatus.accepted}
                  color="text-green-600"
                  bgColor="bg-green-50 dark:bg-green-950"
                />
                <SummaryWidget
                  icon={ClipboardCheck}
                  label="شرکت در فرم‌ها"
                  value={adminStats.participation?.users_with_submissions ?? 0}
                  color="text-teal-600"
                  bgColor="bg-teal-50 dark:bg-teal-950"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UsersStatsCard stats={adminStats.users} />
                <SelfDeclarationStatsCard stats={adminStats.selfDeclarations} />
              </div>

              <div className="mt-6">
                <FormsParticipationCard
                  forms={adminStats.forms}
                  participation={adminStats.participation}
                />
              </div>
            </>
          ) : null}
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RegistrationStatusCard
          selfDeclaration={selfDeclaration}
          interviewStatus={user?.interview_status}
          navigate={navigate}
        />
        <StatsCard
          totalForms={totalForms}
          submissionsCount={totalSubmissions}
          remainingCount={totalRemaining}
          selfDeclaration={selfDeclaration}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuickAccessCard
          remainingForms={remainingForms}
          completedForms={completedForms}
          selfDeclaration={selfDeclaration}
          selfDeclForm={selfDeclForm}
          navigate={navigate}
        />
        <NotificationsCard notifications={notifications} navigate={navigate} />
      </div>
    </div>
  );
}

function RegistrationStatusCard({
  selfDeclaration,
  interviewStatus,
  navigate,
}: {
  selfDeclaration: SelfDeclaration | null;
  interviewStatus: string | null | undefined;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">وضعیت ثبت‌نام</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {!selfDeclaration ? (
          <div className="text-center py-4 space-y-4">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              اظهارنامه هنوز تکمیل نشده است
            </p>
            <Button onClick={() => navigate("/forms/self-declaration")}>
              تکمیل اظهارنامه
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              const status = statusConfig[selfDeclaration.status];
              const StatusIcon = status.icon;
              return (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${status.color}`}
                >
                  <StatusIcon className="h-5 w-5 shrink-0" />
                  <span className="font-medium">{status.label}</span>
                </div>
              );
            })()}
            {selfDeclaration.status === "approved" && interviewStatus && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600">
                {interviewStatus === "awaiting_interview" && (
                  <>
                    <Clock className="h-5 w-5 shrink-0" />
                    <span className="font-medium">در انتظار مصاحبه</span>
                  </>
                )}
                {interviewStatus === "accepted" && (
                  <>
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span className="font-medium">پذیرفته شده</span>
                  </>
                )}
                {interviewStatus === "not_meeting_requirements" && (
                  <>
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <span className="font-medium">عدم احراز شرایط</span>
                  </>
                )}
              </div>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/forms/self-declaration")}
            >
              مشاهده اظهارنامه
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatsCard({
  totalForms,
  submissionsCount,
  remainingCount,
  selfDeclaration,
}: {
  totalForms: number;
  submissionsCount: number;
  remainingCount: number;
  selfDeclaration: SelfDeclaration | null;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">آمار فرم‌ها</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">
              {toPersianDigits(totalForms)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">فرم فعال</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {toPersianDigits(submissionsCount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">ارسال شده</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-amber-600">
              {toPersianDigits(remainingCount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">باقی‌مانده</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold">
              {selfDeclaration
                ? statusConfig[selfDeclaration.status].label
                : "تکمیل نشده"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              وضعیت اظهارنامه
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAccessCard({
  remainingForms,
  completedForms,
  selfDeclaration,
  selfDeclForm,
  navigate,
}: {
  remainingForms: {
    id: number;
    slug: string;
    title: string;
    description: string | null;
  }[];
  completedForms: { id: number; slug: string; title: string }[];
  selfDeclaration: SelfDeclaration | null;
  selfDeclForm: {
    id: number;
    slug: string;
    title: string;
    description: string;
  };
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileSignature className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">فرم‌های قابل پر کردن</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {(remainingForms.length > 0 || !selfDeclaration) && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                نیاز به تکمیل
              </p>
              {remainingForms.map((form) => (
                <div
                  key={form.slug}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors mb-2"
                >
                  <div className="min-w-0 flex-1 ml-2">
                    <p className="font-medium text-sm truncate">{form.title}</p>
                    {form.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {form.description}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/forms/${form.slug}`)}
                  >
                    <ChevronLeft className="h-4 w-4 ml-1" />
                    پر کردن
                  </Button>
                </div>
              ))}
              {!selfDeclaration && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors mb-2">
                  <div className="min-w-0 flex-1 ml-2">
                    <p className="font-medium text-sm truncate">
                      {selfDeclForm.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {selfDeclForm.description}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/forms/${selfDeclForm.slug}`)}
                  >
                    <ChevronLeft className="h-4 w-4 ml-1" />
                    پر کردن
                  </Button>
                </div>
              )}
            </div>
          )}
          {(completedForms.length > 0 || selfDeclaration) && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                تکمیل شده
              </p>
              {completedForms.map((form) => (
                <div
                  key={form.slug}
                  className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/50 mb-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 ml-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <p className="font-medium text-sm truncate">{form.title}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/forms/${form.slug}`)}
                  >
                    <ListChecks className="h-4 w-4 ml-1" />
                    مشاهده
                  </Button>
                </div>
              ))}
              {selfDeclaration && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/50 mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1 ml-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <p className="font-medium text-sm truncate">
                      {selfDeclForm.title}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/forms/${selfDeclForm.slug}`)}
                  >
                    <ListChecks className="h-4 w-4 ml-1" />
                    مشاهده
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryWidget({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${bgColor}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold">{toPersianDigits(value)}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UsersStatsCard({ stats }: { stats: AdminDashboardStats["users"] }) {
  const statusItems = [
    {
      key: "not_started",
      label: "ثبت‌نام نکرده",
      value: stats.byStatus.not_started,
      barColor: "bg-gray-400",
      textColor: "text-gray-600",
      bgColor: "bg-gray-50 dark:bg-gray-950",
    },
    {
      key: "form_completed",
      label: "تکمیل فرم",
      value: stats.byStatus.form_completed,
      barColor: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      key: "awaiting_interview",
      label: "در انتظار مصاحبه",
      value: stats.byStatus.awaiting_interview,
      barColor: "bg-yellow-500",
      textColor: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
    },
    {
      key: "accepted",
      label: "پذیرفته شده",
      value: stats.byStatus.accepted,
      barColor: "bg-green-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      key: "not_meeting_requirements",
      label: "عدم احراز شرایط",
      value: stats.byStatus.not_meeting_requirements,
      barColor: "bg-red-500",
      textColor: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950",
    },
  ];

  const maxVal = Math.max(...statusItems.map((i) => i.value), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">کاربران</CardTitle>
          </div>
          <div className="text-left">
            <p className="text-2xl font-bold text-primary">
              {toPersianDigits(stats.total)}
            </p>
            <p className="text-xs text-muted-foreground">کل</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {statusItems.map((item) => (
            <div key={item.key}>
              <div className="flex items-center justify-between mb-1">
                <div
                  className={`flex items-center gap-2 px-2 py-1 rounded-md ${item.bgColor}`}
                >
                  <span className={`text-xs font-medium ${item.textColor}`}>
                    {item.label}
                  </span>
                </div>
                <span className="text-sm font-bold">
                  {toPersianDigits(item.value)}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${item.barColor}`}
                  style={{ width: `${(item.value / maxVal) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SelfDeclarationStatsCard({
  stats,
}: {
  stats: AdminDashboardStats["selfDeclarations"];
}) {
  const statusItems = [
    {
      key: "pending",
      label: "در انتظار تأیید",
      value: stats.byStatus.pending,
      icon: Clock,
      textColor: "text-yellow-600",
      barColor: "bg-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
    },
    {
      key: "approved",
      label: "تأیید شده",
      value: stats.byStatus.approved,
      icon: CheckCircle2,
      textColor: "text-green-600",
      barColor: "bg-green-500",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      key: "returned",
      label: "نیازمند اصلاح",
      value: stats.byStatus.returned,
      icon: AlertTriangle,
      textColor: "text-red-600",
      barColor: "bg-red-500",
      bgColor: "bg-red-50 dark:bg-red-950",
    },
  ];

  const maxVal = Math.max(...statusItems.map((i) => i.value), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">اظهارنامه‌ها</CardTitle>
          </div>
          <div className="text-left">
            <p className="text-2xl font-bold text-primary">
              {toPersianDigits(stats.total)}
            </p>
            <p className="text-xs text-muted-foreground">کل</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {statusItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.key}>
                <div className="flex items-center justify-between mb-1">
                  <div
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${item.bgColor}`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${item.textColor}`} />
                    <span className={`text-xs font-medium ${item.textColor}`}>
                      {item.label}
                    </span>
                  </div>
                  <span className="text-sm font-bold">
                    {toPersianDigits(item.value)}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${item.barColor}`}
                    style={{ width: `${(item.value / maxVal) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function FormsParticipationCard({
  forms,
  participation,
}: {
  forms: AdminDashboardStats["forms"];
  participation: AdminDashboardStats["participation"];
}) {
  const maxUsers = Math.max(1, participation?.total_users ?? 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-500/10">
              <ClipboardCheck className="h-5 w-5 text-teal-500" />
            </div>
            <div>
              <CardTitle className="text-lg">مشارکت در فرم‌ها</CardTitle>
              <CardDescription>
                تعداد کاربرانی که هر فرم را تکمیل کرده‌اند
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
              <Users className="h-3.5 w-3.5" />
              {toPersianDigits(
                participation?.users_with_submissions ?? 0,
              )} از {toPersianDigits(participation?.total_users ?? 0)} کاربر
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium">
              <Send className="h-3.5 w-3.5" />
              {toPersianDigits(participation?.total_submissions ?? 0)} ارسال
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {!forms || forms.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            فرمی یافت نشد
          </p>
        ) : (
          <div className="space-y-3">
            {forms.map((form) => {
              const rate = Math.round((form.unique_users / maxUsers) * 100);
              return (
                <div key={form.id}>
                  <div className="flex items-center justify-between mb-1 gap-3">
                    <span className="text-sm font-medium truncate">
                      {form.title}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {toPersianDigits(form.unique_users)} کاربر •{" "}
                      {toPersianDigits(form.total_submissions)} ارسال
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {participation?.byFormCount && participation.byFormCount.length > 0 && (
          <div className="pt-4 border-t border-muted/50">
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              توزیع کاربران بر اساس تعداد فرم تکمیل‌شده
            </p>
            <div className="flex flex-wrap gap-2">
              {participation.byFormCount.map((item) => (
                <span
                  key={item.forms}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs"
                >
                  {item.forms === 0
                    ? "بدون ارسال"
                    : `${toPersianDigits(item.forms)} فرم`}
                  <span className="font-bold">
                    {toPersianDigits(item.users)}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NotificationsCard({
  notifications,
  navigate,
}: {
  notifications: Notification[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">اعلان‌ها</CardTitle>
        </div>
        <CardDescription>
          آخرین وضعیت درخواست‌ها و اعلان‌های شما
        </CardDescription>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-6">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-2">هیچ اعلانی وجود ندارد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const Icon = n.icon;
              return (
                <div
                  key={n.id}
                  className="flex items-start gap-3 p-4 rounded-lg border"
                >
                  <div className={`p-2 rounded-full shrink-0 ${n.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{n.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {n.description}
                    </p>
                  </div>
                  {n.action && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => navigate(n.action!.to)}
                    >
                      {n.action.label}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProcessionInfoCard({
  processions,
}: {
  processions: ProcessionInfo[];
}) {
  if (processions.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {processions.map((procession) => {
        const maleConsultants = procession.consultants.filter(
          (c) => c.gender === "male",
        );
        const femaleConsultants = procession.consultants.filter(
          (c) => c.gender === "female",
        );
        const unknownGenderConsultants = procession.consultants.filter(
          (c) => c.gender !== "male" && c.gender !== "female",
        );
        const isBoth =
          maleConsultants.length > 0 && femaleConsultants.length > 0;

        return (
          <Card
            key={procession.id}
            className="overflow-hidden border-primary/20"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <UsersRound className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{procession.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-muted-foreground">
                  {procession.address}
                </span>
              </div>
              {procession.consultants.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">
                    مشاوران
                  </p>
                  {isBoth ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 pb-1 border-b border-blue-200 dark:border-blue-800">
                          آقایان ({toPersianDigits(maleConsultants.length)})
                        </p>
                        <div className="space-y-1.5">
                          {maleConsultants.map((consultant) => (
                            <span
                              key={consultant.id}
                              className="flex px-2.5 py-1 rounded-md bg-muted text-sm"
                            >
                              {consultant.first_name} {consultant.last_name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-pink-600 dark:text-pink-400 mb-2 pb-1 border-b border-pink-200 dark:border-pink-800">
                          خانم‌ها ({toPersianDigits(femaleConsultants.length)})
                        </p>
                        <div className="space-y-1.5">
                          {femaleConsultants.map((consultant) => (
                            <span
                              key={consultant.id}
                              className="flex px-2.5 py-1 rounded-md bg-muted text-sm"
                            >
                              {consultant.first_name} {consultant.last_name}
                            </span>
                          ))}
                        </div>
                      </div>
                      {unknownGenderConsultants.length > 0 && (
                        <div className="col-span-2">
                          <p className="text-xs font-medium text-muted-foreground mb-2 pb-1 border-b border-border">
                            سایر (
                            {toPersianDigits(unknownGenderConsultants.length)})
                          </p>
                          <div className="space-y-1.5">
                            {unknownGenderConsultants.map((consultant) => (
                              <span
                                key={consultant.id}
                                className="flex px-2.5 py-1 rounded-md bg-muted text-sm"
                              >
                                {consultant.first_name} {consultant.last_name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {procession.consultants.map((consultant) => (
                        <span
                          key={consultant.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-sm"
                        >
                          {consultant.first_name} {consultant.last_name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
