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
  UserPlus,
  Trash2,
  Phone,
  User,
  Search,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import arbaeenApi from "../api/arbaeen";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { toast } from "sonner";
import { translateServerError } from "../lib/error-translations";
import { toPersianDigits } from "@/lib/utils";
import { useAuth } from "../hooks/useAuth";
import { Lock } from "lucide-react";

interface ArbaeenProcession {
  id: number;
  year_id: number;
  name: string;
  location: string;
  address: string;
  responsible_name: string;
  responsible_phone: string;
  gender_requirement: string;
  responsible_consultant_id: number | null;
  responsible_consultant: {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    gender: string | null;
  } | null;
  created_at: string;
}

interface Consultant {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  gender: string | null;
}

interface AvailableConsultant {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  gender: string | null;
}

export function ArbaeenProcessionDetail() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [procession, setProcession] = useState<ArbaeenProcession | null>(null);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [availableConsultants, setAvailableConsultants] = useState<
    AvailableConsultant[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isAddConsultantOpen, setIsAddConsultantOpen] = useState(false);
  const [isDeleteConsultantOpen, setIsDeleteConsultantOpen] = useState(false);
  const [selectedConsultant, setSelectedConsultant] =
    useState<Consultant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isSetResponsibleOpen, setIsSetResponsibleOpen] = useState(false);
  const [responsibleConsultantId, setResponsibleConsultantId] = useState<
    number | null
  >(null);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const procData = await arbaeenApi.getProcession(Number(id));
      setProcession(procData);
      setConsultants(procData?.consultants || []);
      setResponsibleConsultantId(
        procData?.responsible_consultant_id ?? null,
      );

      const genderFilter =
        procData?.gender_requirement !== "both"
          ? procData?.gender_requirement
          : undefined;
      const availData = await arbaeenApi.getAvailableConsultants(genderFilter);
      setAvailableConsultants(availData || []);
    } catch (err: unknown) {
      toast.error(translateServerError(err) || "خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignConsultant = async () => {
    if (selectedUserIds.length === 0) {
      toast.error("حداقل یک مشاور انتخاب کنید");
      return;
    }
    const toastId = toast.loading("در حال اضافه کردن مشاوران...");
    setIsSubmitting(true);
    try {
      const result = await arbaeenApi.assignConsultantsBatch(Number(id), {
        user_ids: selectedUserIds,
      });
      const addedCount = result?.added?.length || 0;
      const skippedCount = result?.skipped?.length || 0;
      if (addedCount > 0) {
        toast.success(
          `${addedCount} مشاور با موفقیت اضافه شد${
            skippedCount > 0 ? ` (${skippedCount} مورد رد شد)` : ""
          }`,
          { id: toastId },
        );
      } else {
        toast.error("هیچ مشاوری اضافه نشد", { id: toastId });
      }
      setIsAddConsultantOpen(false);
      setSelectedUserIds([]);
      setSearchQuery("");
      fetchData();
    } catch (err: unknown) {
      toast.error(translateServerError(err) || "خطا در اضافه کردن مشاوران", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveConsultant = async () => {
    if (!selectedConsultant) return;
    const toastId = toast.loading("در حال حذف مشاور...");
    try {
      await arbaeenApi.removeConsultant(Number(id), selectedConsultant.id);
      toast.success("مشاور با موفقیت حذف شد!", { id: toastId });
      setIsDeleteConsultantOpen(false);
      setSelectedConsultant(null);
      fetchData();
    } catch (err: unknown) {
      toast.error(translateServerError(err) || "خطا در حذف مشاور", {
        id: toastId,
      });
    }
  };

  const handleSetResponsibleConsultant = async () => {
    const toastId = toast.loading("در حال تنظیم مسئول مشاورین...");
    setIsSubmitting(true);
    try {
      await arbaeenApi.setResponsibleConsultant(Number(id), {
        responsible_consultant_id: responsibleConsultantId,
      });
      toast.success(
        responsibleConsultantId !== null
          ? "مسئول مشاورین با موفقیت تنظیم شد"
          : "مسئول مشاورین حذف شد",
        { id: toastId },
      );
      setIsSetResponsibleOpen(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(
        translateServerError(err) || "خطا در تنظیم مسئول مشاورین",
        { id: toastId },
      );
    } finally {
      setIsSubmitting(false);
    }
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

  const filteredAvailable = availableConsultants.filter(
    (c) => !consultants.some((assigned) => assigned.id === c.id),
  );

  const searchedConsultants = filteredAvailable.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
    const phone = c.phone.toLowerCase();
    return fullName.includes(q) || phone.includes(q);
  });

  const maleConsultants = consultants.filter((c) => c.gender === "male");
  const femaleConsultants = consultants.filter((c) => c.gender === "female");
  const unknownGenderConsultants = consultants.filter(
    (c) => c.gender !== "male" && c.gender !== "female",
  );
  const isBoth = procession?.gender_requirement === "both";

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
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size={32} />
        </div>
      ) : !procession ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-muted-foreground text-center">موکب یافت نشد</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Procession Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    navigate(`/admin/arbaeen/${procession.year_id}`)
                  }
                  className="ml-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <User className="h-6 w-6" />
                <CardTitle>{procession.name}</CardTitle>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 w-fit ${getGenderBadgeColor(
                  procession.gender_requirement,
                )}`}
              >
                {getGenderLabel(procession.gender_requirement)}
              </span>
              <CardDescription>اطلاعات موکب</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">مکان:</span>
                  <p className="font-medium">
                    {getLocationLabel(procession.location)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">آدرس:</span>
                  <p className="font-medium">{procession.address}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">نام مسئول:</span>
                  <p className="font-medium">{procession.responsible_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">شماره مسئول:</span>
                  <p className="font-medium" dir="ltr">
                    {toPersianDigits(procession.responsible_phone)}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      مسئول مشاورین:
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        setResponsibleConsultantId(
                          procession.responsible_consultant_id ?? null,
                        );
                        setIsSetResponsibleOpen(true);
                      }}
                    >
                      <Crown className="h-3 w-3 ml-1" />
                      {procession.responsible_consultant
                        ? "تغییر"
                        : "انتخاب"}
                    </Button>
                  </div>
                  {procession.responsible_consultant ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      <p className="font-medium">
                        {procession.responsible_consultant.first_name}{" "}
                        {procession.responsible_consultant.last_name}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      تعیین نشده
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consultants Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start">
                <div>
                  <CardTitle className="flex items-center gap-2 mb-4">
                    مشاوران ({toPersianDigits(consultants.length)})
                  </CardTitle>
                  <CardDescription className="mb-2">
                    لیست مشاوران اختصاص یافته به این موکب
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddConsultantOpen(true)}>
                  <UserPlus className="h-4 w-4 ml-2" />
                  افزودن مشاور
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {consultants.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  هنوز مشاوری اضافه نشده است
                </p>
              ) : isBoth ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3 pb-2 border-b border-blue-200 dark:border-blue-800">
                      آقایان ({toPersianDigits(maleConsultants.length)})
                    </p>
                    <div className="space-y-2">
                      {maleConsultants.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          مشاوری ثبت نشده
                        </p>
                      ) : (
                        maleConsultants.map((c, index) => (
                          <div
                            key={c.id}
                            className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center  gap-3">
                              <span className="text-sm text-muted-foreground font-medium">
                                {toPersianDigits(index + 1)}.
                              </span>
                              <div className="flex flex-col items-start">
                                <p className="font-medium">
                                  {c.first_name} {c.last_name}
                                </p>
                                <p
                                  className="text-xs text-muted-foreground flex items-center gap-1"
                                  dir="ltr"
                                >
                                  <Phone className="h-3 w-3" />
                                  {toPersianDigits(c.phone)}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedConsultant(c);
                                setIsDeleteConsultantOpen(true);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-pink-600 dark:text-pink-400 mb-3 pb-2 border-b border-pink-200 dark:border-pink-800">
                      خانم‌ها ({toPersianDigits(femaleConsultants.length)})
                    </p>
                    <div className="space-y-2">
                      {femaleConsultants.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          مشاوری ثبت نشده
                        </p>
                      ) : (
                        femaleConsultants.map((c, index) => (
                          <div
                            key={c.id}
                            className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground font-medium">
                                {toPersianDigits(index + 1)}.
                              </span>
                              <div className="flex flex-col items-start">
                                <p className="font-medium">
                                  {c.first_name} {c.last_name}
                                </p>
                                <p
                                  className="text-xs text-muted-foreground flex items-center gap-1"
                                  dir="ltr"
                                >
                                  <Phone className="h-3 w-3" />
                                  {toPersianDigits(c.phone)}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedConsultant(c);
                                setIsDeleteConsultantOpen(true);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  {unknownGenderConsultants.length > 0 && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground mb-3 pb-2 border-b border-border">
                        سایر ({toPersianDigits(unknownGenderConsultants.length)}
                        )
                      </p>
                      <div className="space-y-2">
                        {unknownGenderConsultants.map((c, index) => (
                          <div
                            key={c.id}
                            className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground font-medium">
                                {toPersianDigits(index + 1)}.
                              </span>
                              <div className="flex flex-col items-start">
                                <p className="font-medium">
                                  {c.first_name} {c.last_name}
                                </p>
                                <p
                                  className="text-xs text-muted-foreground flex items-center gap-1"
                                  dir="ltr"
                                >
                                  <Phone className="h-3 w-3" />
                                  {toPersianDigits(c.phone)}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedConsultant(c);
                                setIsDeleteConsultantOpen(true);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {consultants.map((c, index) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground font-medium">
                          {toPersianDigits(index + 1)}.
                        </span>
                        <div className="flex flex-col items-start">
                          <p className="font-medium">
                            {c.first_name} {c.last_name}
                          </p>
                          <p
                            className="text-xs text-muted-foreground flex items-center gap-1"
                            dir="ltr"
                          >
                            <Phone className="h-3 w-3" />
                            {toPersianDigits(c.phone)}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedConsultant(c);
                          setIsDeleteConsultantOpen(true);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Add Consultant Dialog */}
      <Dialog
        open={isAddConsultantOpen}
        onOpenChange={(open) => {
          setIsAddConsultantOpen(open);
          if (!open) {
            setSearchQuery("");
            setSelectedUserIds([]);
          }
        }}
      >
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader style={{ textAlign: "center" }}>
            <DialogTitle>افزودن مشاور</DialogTitle>
            <DialogDescription>
              با جستجو مشاوران مورد نظر را پیدا و انتخاب کنید
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو بر اساس نام یا شماره..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
                dir="rtl"
                autoFocus
              />
            </div>

            {selectedUserIds.length > 0 && (
              <div className="border border-border rounded-lg p-2">
                <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                  انتخاب شده ({toPersianDigits(selectedUserIds.length)})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedUserIds.map((uid) => {
                    const person = filteredAvailable.find((c) => c.id === uid);
                    if (!person) return null;
                    return (
                      <span
                        key={uid}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent text-accent-foreground text-xs"
                      >
                        {person.first_name} {person.last_name}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedUserIds((prev) =>
                              prev.filter((id) => id !== uid),
                            )
                          }
                          className="hover:text-destructive transition-colors ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto border border-border rounded-lg">
              {filteredAvailable.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  مشاوری موجود نیست
                </p>
              ) : searchedConsultants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  نتیجه‌ای یافت نشد
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {searchedConsultants.map((c) => {
                    const isSelected = selectedUserIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedUserIds((prev) =>
                              prev.filter((id) => id !== c.id),
                            );
                          } else {
                            setSelectedUserIds((prev) => [...prev, c.id]);
                            setSearchQuery("");
                          }
                        }}
                        className={`w-full flex items-center justify-between p-3 text-right transition-colors ${
                          isSelected
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {c.first_name} {c.last_name}
                          </p>
                          <p
                            className="text-xs text-muted-foreground"
                            dir="ltr"
                          >
                            {toPersianDigits(c.phone)}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="h-3 w-3 rounded-full bg-primary shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {searchedConsultants.length > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                {toPersianDigits(searchedConsultants.length)} نتیجه
                {searchQuery.trim() ? ` برای "${searchQuery}"` : ""}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddConsultantOpen(false)}
              disabled={isSubmitting}
              className="ml-2"
            >
              لغو
            </Button>
            <Button
              onClick={handleAssignConsultant}
              disabled={isSubmitting || selectedUserIds.length === 0}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size={16} />
                  در حال اضافه کردن...
                </>
              ) : (
                `اضافه کردن${selectedUserIds.length > 0 ? ` (${toPersianDigits(selectedUserIds.length)})` : ""}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Consultant Confirmation Dialog */}
      <Dialog
        open={isDeleteConsultantOpen}
        onOpenChange={setIsDeleteConsultantOpen}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader style={{ textAlign: "center" }}>
            <DialogTitle>حذف مشاور</DialogTitle>
            <DialogDescription>
              آیا مطمئن هستید که می‌خواهید این مشاور را حذف کنید؟
            </DialogDescription>
          </DialogHeader>
          {selectedConsultant && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium">
                {selectedConsultant.first_name} {selectedConsultant.last_name}
              </p>
              <p className="text-sm text-muted-foreground" dir="ltr">
                {toPersianDigits(selectedConsultant.phone)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteConsultantOpen(false)}
              className="ml-2"
            >
              لغو
            </Button>
            <Button variant="destructive" onClick={handleRemoveConsultant}>
              حذف مشاور
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Responsible Consultant Dialog */}
      <Dialog
        open={isSetResponsibleOpen}
        onOpenChange={(open) => {
          setIsSetResponsibleOpen(open);
          if (!open) {
            setResponsibleConsultantId(
              procession?.responsible_consultant_id ?? null,
            );
          }
        }}
      >
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader style={{ textAlign: "center" }}>
            <DialogTitle className="flex items-center justify-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              انتخاب مسئول مشاورین
            </DialogTitle>
            <DialogDescription>
              یکی از مشاوران این موکب را به عنوان مسئول انتخاب کنید
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto border border-border rounded-lg">
            {consultants.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                هنوز مشاوری اضافه نشده است
              </p>
            ) : (
              <div className="divide-y divide-border">
                <button
                  type="button"
                  onClick={() => setResponsibleConsultantId(null)}
                  className={`w-full flex items-center justify-between p-3 text-right transition-colors ${
                    responsibleConsultantId === null
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">—</span>
                    <p className="font-medium text-sm text-muted-foreground">
                      بدون مسئول مشاورین
                    </p>
                  </div>
                  {responsibleConsultantId === null && (
                    <div className="h-3 w-3 rounded-full bg-primary shrink-0" />
                  )}
                </button>
                {consultants.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setResponsibleConsultantId(c.id)}
                    className={`w-full flex items-center justify-between p-3 text-right transition-colors ${
                      responsibleConsultantId === c.id
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {c.first_name} {c.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground" dir="ltr">
                        {toPersianDigits(c.phone)}
                      </p>
                    </div>
                    {responsibleConsultantId === c.id && (
                      <Crown className="h-4 w-4 text-yellow-500 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSetResponsibleOpen(false)}
              disabled={isSubmitting}
              className="ml-2"
            >
              لغو
            </Button>
            <Button
              onClick={handleSetResponsibleConsultant}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size={16} />
                  در حال ذخیره...
                </>
              ) : (
                "ذخیره"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
