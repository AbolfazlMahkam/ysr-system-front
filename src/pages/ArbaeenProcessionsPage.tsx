import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Phone,
  Users,
  Search,
  Crown,
  Eye,
  EyeOff,
  Download,
} from "lucide-react";
import { generateProcessionsPdf } from "../lib/generate-processions-pdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import arbaeenApi from "../api/arbaeen";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { toast } from "sonner";
import { translateServerError } from "../lib/error-translations";
import { toPersianDigits } from "@/lib/utils";
import { useAuth } from "../hooks/useAuth";
import { Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const processionSchema = z.object({
  name: z.string().min(1, "نام الزامی است"),
  location: z.string().min(1, "مکان الزامی است"),
  address: z.string().min(1, "آدرس الزامی است"),
  responsible_name: z.string().min(1, "نام مسئول الزامی است"),
  responsible_phone: z.string().min(1, "شماره مسئول الزامی است"),
  gender_requirement: z.string().min(1, "جنسیت الزامی است"),
});

type ProcessionFormData = z.infer<typeof processionSchema>;

interface ArbaeenYear {
  id: number;
  year: string;
}

interface ArbaeenProcession {
  id: number;
  year_id: number;
  name: string;
  location: string;
  address: string;
  responsible_name: string;
  responsible_phone: string;
  gender_requirement: string;
  show_on_dashboard: boolean;
  created_at: string;
}

interface Consultant {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  gender: string | null;
}

interface ProcessionWithConsultants extends ArbaeenProcession {
  consultants: Consultant[];
  responsible_consultant: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
}

export function ArbaeenProcessionsPage() {
  const { user } = useAuth();
  const { yearId } = useParams<{ yearId: string }>();
  const navigate = useNavigate();
  const [year, setYear] = useState<ArbaeenYear | null>(null);
  const [processions, setProcessions] = useState<ProcessionWithConsultants[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProcession, setSelectedProcession] =
    useState<ArbaeenProcession | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [showOnDashboard, setShowOnDashboard] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const addForm = useForm<ProcessionFormData>({
    resolver: zodResolver(processionSchema),
    defaultValues: {
      name: "",
      location: "",
      address: "",
      responsible_name: "",
      responsible_phone: "",
      gender_requirement: "both",
    },
  });

  const editForm = useForm<ProcessionFormData>({
    resolver: zodResolver(processionSchema),
    defaultValues: {
      name: "",
      location: "",
      address: "",
      responsible_name: "",
      responsible_phone: "",
      gender_requirement: "both",
    },
  });

  useEffect(() => {
    if (yearId) fetchData();
  }, [yearId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const yearsData = await arbaeenApi.getYears();
      const currentYear = yearsData?.find(
        (y: ArbaeenYear) => y.id === Number(yearId),
      );
      setYear(currentYear || null);

      const procData = await arbaeenApi.getProcessionsByYear(Number(yearId));
      const procs = procData || [];

      const withConsultants = await Promise.all(
        procs.map(async (proc: ArbaeenProcession) => {
          try {
            const detail = await arbaeenApi.getProcession(proc.id);
            return {
              ...proc,
              consultants: detail?.consultants || [],
              responsible_consultant: detail?.responsible_consultant || null,
            };
          } catch {
            return {
              ...proc,
              consultants: [],
              responsible_consultant: null,
            };
          }
        }),
      );
      setProcessions(withConsultants);
      setShowOnDashboard(
        withConsultants.length > 0 &&
          withConsultants.some((p) => p.show_on_dashboard),
      );
    } catch (err: unknown) {
      toast.error(translateServerError(err) || "خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProcession = async (data: ProcessionFormData) => {
    const toastId = toast.loading("در حال ایجاد موکب...");
    setIsSubmitting(true);
    try {
      await arbaeenApi.createProcession({
        ...data,
        year_id: Number(yearId),
      });
      toast.success("موکب با موفقیت ایجاد شد!", { id: toastId });
      setIsAddDialogOpen(false);
      addForm.reset();
      fetchData();
    } catch (err: unknown) {
      toast.error(translateServerError(err) || "خطا در ایجاد موکب", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProcession = async (data: ProcessionFormData) => {
    if (!selectedProcession) return;
    const toastId = toast.loading("در حال بروزرسانی موکب...");
    setIsSubmitting(true);
    try {
      await arbaeenApi.updateProcession(selectedProcession.id, data);
      toast.success("موکب با موفقیت بروز شد!", { id: toastId });
      setIsEditDialogOpen(false);
      setSelectedProcession(null);
      editForm.reset();
      fetchData();
    } catch (err: unknown) {
      toast.error(translateServerError(err) || "خطا در بروزرسانی موکب", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProcession = async () => {
    if (!selectedProcession) return;
    const toastId = toast.loading("در حال حذف موکب...");
    try {
      await arbaeenApi.deleteProcession(selectedProcession.id);
      toast.success("موکب با موفقیت حذف شد!", { id: toastId });
      setIsDeleteDialogOpen(false);
      setSelectedProcession(null);
      fetchData();
    } catch (err: unknown) {
      toast.error(translateServerError(err) || "خطا در حذف موکب", {
        id: toastId,
      });
    }
  };

  const handleToggleShowOnDashboard = async () => {
    if (!yearId) return;
    try {
      const result = await arbaeenApi.toggleShowOnDashboard(Number(yearId));
      setShowOnDashboard(result.show_on_dashboard);
      toast.success(
        result.show_on_dashboard
          ? "نمایش مواکب در داشبورد فعال شد"
          : "نمایش مواکب در داشبورد غیرفعال شد",
      );
    } catch (err: unknown) {
      toast.error(translateServerError(err) || "خطا در تغییر وضعیت نمایش");
    }
  };

  const handleExportPdf = async () => {
    if (!year || processions.length === 0) {
      toast.error("داده‌ای برای خروجی وجود ندارد");
      return;
    }
    setExportingPdf(true);
    const toastId = toast.loading("در حال ساخت PDF...");
    try {
      await generateProcessionsPdf(year.year, processions);
      toast.success("PDF با موفقیت دانلود شد", { id: toastId });
    } catch {
      toast.error("خطا در ساخت PDF", { id: toastId });
    } finally {
      setExportingPdf(false);
    }
  };

  const openEditDialog = (proc: ArbaeenProcession) => {
    setSelectedProcession(proc);
    editForm.reset({
      name: proc.name,
      location: proc.location,
      address: proc.address,
      responsible_name: proc.responsible_name,
      responsible_phone: proc.responsible_phone,
      gender_requirement: proc.gender_requirement,
    });
    setIsEditDialogOpen(true);
  };

  const getLocationLabel = (location: string) => {
    switch (location) {
      case "Najaf Ashraf":
        return "نجف اشرف";
      case "Karbala Mu'alla":
        return "کربلای معلی";
      case "Tariq Al-Hussein (AS)":
        return "طريق الحسين (ع)";
      default:
        return location;
    }
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case "male":
        return "فقط آقایان";
      case "female":
        return "فقط خانم‌ها";
      case "both":
        return "آقایان و خانم‌ها";
      default:
        return gender;
    }
  };

  const getGenderBadgeColor = (gender: string) => {
    switch (gender) {
      case "male":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "female":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
      case "both":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getLocationBadgeColor = (location: string) => {
    switch (location) {
      case "Karbala Mu'alla":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "Najaf Ashraf":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Tariq Al-Hussein (AS)":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const filteredProcessions = processions.filter((proc) => {
    const matchesLocation =
      locationFilter === "all" || proc.location === locationFilter;
    if (!searchQuery.trim()) return matchesLocation;
    const q = searchQuery.toLowerCase();
    const nameMatch = proc.name.toLowerCase().includes(q);
    const consultantMatch = proc.consultants.some(
      (c) =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q),
    );
    return matchesLocation && (nameMatch || consultantMatch);
  });

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
      <div className="mb-6">
        <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/arbaeen")}
                className="ml-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <MapPin className="h-6 w-6" />
              <h1 className="text-2xl font-bold">
                مواکب اربعین {year ? toPersianDigits(year.year) : ""}
              </h1>
            </div>
            <p className="text-muted-foreground mr-10">
              لیست مواکب و مشاوران آن‌ها
            </p>
          </div>
          <div className="flex items-center gap-2 max-sm:flex-col max-sm:w-full">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[180px] max-sm:w-full">
                <SelectValue placeholder="فیلتر مکان" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه مکان‌ها</SelectItem>
                <SelectItem value="Najaf Ashraf">نجف اشرف</SelectItem>
                <SelectItem value="Karbala Mu'alla">کربلای معلی</SelectItem>
                <SelectItem value="Tariq Al-Hussein (AS)">
                  طريق الحسين (ع)
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="relative max-sm:w-full">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجوی موکب یا مشاور..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 w-[250px] max-sm:w-full"
                dir="rtl"
              />
            </div>
            <Button
              variant={showOnDashboard ? "default" : "outline"}
              onClick={handleToggleShowOnDashboard}
              className="gap-1.5 max-sm:w-full"
            >
              {showOnDashboard ? (
                <>
                  <Eye className="h-4 w-4" />
                  نمایش در داشبورد
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" />
                  نمایش در داشبورد
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPdf}
              disabled={exportingPdf || processions.length === 0}
              className="gap-1.5 max-sm:w-full"
            >
              <Download className="h-4 w-4" />
              دانلود PDF
            </Button>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="max-sm:w-full"
            >
              <Plus className="h-4 w-4 ml-2" />
              افزودن موکب
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size={32} />
        </div>
      ) : filteredProcessions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-muted-foreground text-center">
              {searchQuery.trim()
                ? "موکبی یافت نشد"
                : "هنوز موکبی اضافه نشده است"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredProcessions.map((proc) => {
            const maleConsultants = proc.consultants.filter(
              (c) => c.gender === "male",
            );
            const femaleConsultants = proc.consultants.filter(
              (c) => c.gender === "female",
            );
            const isBoth = proc.gender_requirement === "both";

            return (
              <Card key={proc.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4 max-sm:flex-col">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-lg font-bold truncate">
                          {proc.name}
                        </h2>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${getGenderBadgeColor(
                            proc.gender_requirement,
                          )}`}
                        >
                          {getGenderLabel(proc.gender_requirement)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${getLocationBadgeColor(
                              proc.location,
                            )}`}
                          >
                            {getLocationLabel(proc.location)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            {proc.responsible_name} -{" "}
                            <span dir="ltr">
                              {toPersianDigits(proc.responsible_phone)}
                            </span>
                          </span>
                        </div>
                        <div className="sm:col-span-2 text-muted-foreground text-xs">
                          {proc.address}
                        </div>
                        {proc.responsible_consultant && (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Crown className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                            <span className="text-muted-foreground">
                              مسئول مشاورین:
                            </span>
                            <span className="font-medium">
                              {proc.responsible_consultant.first_name}{" "}
                              {proc.responsible_consultant.last_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(proc)}
                      >
                        <Pencil className="h-3 w-3 ml-1" />
                        ویرایش
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedProcession(proc);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-3 w-3 ml-1" />
                        حذف
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {proc.consultants.length === 0 ? (
                    <div className="flex items-center justify-between py-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        هنوز مشاوری اضافه نشده است
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate(`/admin/arbaeen/procession/${proc.id}`)
                        }
                      >
                        <Users className="h-3 w-3 ml-1" />
                        افزودن مشاور
                      </Button>
                    </div>
                  ) : (
                    <div className="border-t border-border pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-muted-foreground">
                          مشاوران ({toPersianDigits(proc.consultants.length)})
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            navigate(`/admin/arbaeen/procession/${proc.id}`)
                          }
                        >
                          <Users className="h-3 w-3 ml-1" />
                          مدیریت
                        </Button>
                      </div>
                      {isBoth ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 pb-1 border-b border-blue-200 dark:border-blue-800">
                              آقایان
                            </p>
                            <div className="space-y-2">
                              {maleConsultants.length === 0 ? (
                                <p className="text-xs text-muted-foreground py-2">
                                  مشاوری ثبت نشده
                                </p>
                              ) : (
                                maleConsultants.map((c, i) => (
                                  <div
                                    key={c.id}
                                    className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-xs text-muted-foreground shrink-0">
                                        {toPersianDigits(i + 1)}.
                                      </span>
                                      <span className="truncate">
                                        {c.first_name} {c.last_name}
                                      </span>
                                    </div>
                                    <span
                                      className="text-xs text-muted-foreground shrink-0 mr-2"
                                      dir="ltr"
                                    >
                                      {toPersianDigits(c.phone)}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-pink-600 dark:text-pink-400 mb-2 pb-1 border-b border-pink-200 dark:border-pink-800">
                              خانم‌ها
                            </p>
                            <div className="space-y-2">
                              {femaleConsultants.length === 0 ? (
                                <p className="text-xs text-muted-foreground py-2">
                                  مشاوری ثبت نشده
                                </p>
                              ) : (
                                femaleConsultants.map((c, i) => (
                                  <div
                                    key={c.id}
                                    className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-xs text-muted-foreground shrink-0">
                                        {toPersianDigits(i + 1)}.
                                      </span>
                                      <span className="truncate">
                                        {c.first_name} {c.last_name}
                                      </span>
                                    </div>
                                    <span
                                      className="text-xs text-muted-foreground shrink-0 mr-2"
                                      dir="ltr"
                                    >
                                      {toPersianDigits(c.phone)}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {proc.consultants.map((c, i) => (
                            <div
                              key={c.id}
                              className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {toPersianDigits(i + 1)}.
                                </span>
                                <span className="truncate">
                                  {c.first_name} {c.last_name}
                                </span>
                              </div>
                              <span
                                className="text-xs text-muted-foreground shrink-0 mr-2"
                                dir="ltr"
                              >
                                {toPersianDigits(c.phone)}
                              </span>
                            </div>
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
      )}

      {/* Add Procession Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader style={{ textAlign: "center" }}>
            <DialogTitle>افزودن موکب جدید</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={addForm.handleSubmit(handleAddProcession)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>نام موکب</Label>
              <Input
                {...addForm.register("name")}
                placeholder="نام موکب"
                className={
                  addForm.formState.errors.name ? "border-destructive" : ""
                }
              />
              {addForm.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {addForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>مکان</Label>
              <Select
                onValueChange={(value) =>
                  addForm.setValue("location", value, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger
                  className={
                    addForm.formState.errors.location
                      ? "border-destructive"
                      : ""
                  }
                >
                  <SelectValue placeholder="انتخاب مکان" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Najaf Ashraf">نجف اشرف</SelectItem>
                  <SelectItem value="Karbala Mu'alla">کربلای معلی</SelectItem>
                  <SelectItem value="Tariq Al-Hussein (AS)">
                    طريق الحسين (ع)
                  </SelectItem>
                </SelectContent>
              </Select>
              {addForm.formState.errors.location && (
                <p className="text-sm text-destructive">
                  {addForm.formState.errors.location.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>آدرس</Label>
              <Textarea
                {...addForm.register("address")}
                placeholder="آدرس کامل"
                className={
                  addForm.formState.errors.address ? "border-destructive" : ""
                }
              />
              {addForm.formState.errors.address && (
                <p className="text-sm text-destructive">
                  {addForm.formState.errors.address.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>نام مسئول</Label>
              <Input
                {...addForm.register("responsible_name")}
                placeholder="نام و نام خانوادگی مسئول"
                className={
                  addForm.formState.errors.responsible_name
                    ? "border-destructive"
                    : ""
                }
              />
              {addForm.formState.errors.responsible_name && (
                <p className="text-sm text-destructive">
                  {addForm.formState.errors.responsible_name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>شماره مسئول</Label>
              <Input
                {...addForm.register("responsible_phone")}
                placeholder="شماره تماس مسئول"
                dir="ltr"
                className={
                  addForm.formState.errors.responsible_phone
                    ? "border-destructive"
                    : ""
                }
              />
              {addForm.formState.errors.responsible_phone && (
                <p className="text-sm text-destructive">
                  {addForm.formState.errors.responsible_phone.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>جنسیت مشاوران</Label>
              <Select
                onValueChange={(value) =>
                  addForm.setValue("gender_requirement", value, {
                    shouldValidate: true,
                  })
                }
                defaultValue="both"
              >
                <SelectTrigger
                  className={
                    addForm.formState.errors.gender_requirement
                      ? "border-destructive"
                      : ""
                  }
                >
                  <SelectValue placeholder="انتخاب جنسیت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">فقط آقایان</SelectItem>
                  <SelectItem value="female">فقط خانم‌ها</SelectItem>
                  <SelectItem value="both">آقایان و خانم‌ها</SelectItem>
                </SelectContent>
              </Select>
              {addForm.formState.errors.gender_requirement && (
                <p className="text-sm text-destructive">
                  {addForm.formState.errors.gender_requirement.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isSubmitting}
                className="ml-2 max-sm:w-full max-sm:mt-2"
              >
                لغو
              </Button>
              <Button type="submit" disabled={isSubmitting}>
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
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Procession Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader style={{ textAlign: "center" }}>
            <DialogTitle>ویرایش موکب</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit(handleEditProcession)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>نام موکب</Label>
              <Input
                {...editForm.register("name")}
                placeholder="نام موکب"
                className={
                  editForm.formState.errors.name ? "border-destructive" : ""
                }
              />
              {editForm.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>مکان</Label>
              <Select
                onValueChange={(value) =>
                  editForm.setValue("location", value, {
                    shouldValidate: true,
                  })
                }
                value={editForm.watch("location")}
              >
                <SelectTrigger
                  className={
                    editForm.formState.errors.location
                      ? "border-destructive"
                      : ""
                  }
                >
                  <SelectValue placeholder="انتخاب مکان" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Najaf Ashraf">نجف اشرف</SelectItem>
                  <SelectItem value="Karbala Mu'alla">کربلای معلی</SelectItem>
                  <SelectItem value="Tariq Al-Hussein (AS)">
                    طريق الحسين (ع)
                  </SelectItem>
                </SelectContent>
              </Select>
              {editForm.formState.errors.location && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.location.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>آدرس</Label>
              <Textarea
                {...editForm.register("address")}
                placeholder="آدرس کامل"
                className={
                  editForm.formState.errors.address ? "border-destructive" : ""
                }
              />
              {editForm.formState.errors.address && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.address.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>نام مسئول</Label>
              <Input
                {...editForm.register("responsible_name")}
                placeholder="نام و نام خانوادگی مسئول"
                className={
                  editForm.formState.errors.responsible_name
                    ? "border-destructive"
                    : ""
                }
              />
              {editForm.formState.errors.responsible_name && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.responsible_name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>شماره مسئول</Label>
              <Input
                {...editForm.register("responsible_phone")}
                placeholder="شماره تماس مسئول"
                dir="ltr"
                className={
                  editForm.formState.errors.responsible_phone
                    ? "border-destructive"
                    : ""
                }
              />
              {editForm.formState.errors.responsible_phone && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.responsible_phone.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>جنسیت مشاوران</Label>
              <Select
                onValueChange={(value) =>
                  editForm.setValue("gender_requirement", value, {
                    shouldValidate: true,
                  })
                }
                value={editForm.watch("gender_requirement")}
              >
                <SelectTrigger
                  className={
                    editForm.formState.errors.gender_requirement
                      ? "border-destructive"
                      : ""
                  }
                >
                  <SelectValue placeholder="انتخاب جنسیت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">فقط آقایان</SelectItem>
                  <SelectItem value="female">فقط خانم‌ها</SelectItem>
                  <SelectItem value="both">آقایان و خانم‌ها</SelectItem>
                </SelectContent>
              </Select>
              {editForm.formState.errors.gender_requirement && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.gender_requirement.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSubmitting}
                className="ml-2 max-sm:w-full max-sm:mt-2"
              >
                لغو
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size={16} />
                    در حال بروزرسانی...
                  </>
                ) : (
                  "بروزرسانی"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader style={{ textAlign: "center" }}>
            <DialogTitle>حذف موکب</DialogTitle>
            <DialogDescription>
              آیا مطمئن هستید؟ تمام مشاوران این موکب حذف خواهند شد.
            </DialogDescription>
          </DialogHeader>
          {selectedProcession && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium">{selectedProcession.name}</p>
              <p className="text-sm text-muted-foreground">
                {getLocationLabel(selectedProcession.location)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="ml-2 max-sm:w-full max-sm:mt-2"
            >
              لغو
            </Button>
            <Button variant="destructive" onClick={handleDeleteProcession}>
              حذف موکب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
