import { useEffect, useState } from "react";
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
  Shield,
  Lock,
  Plus,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  Eye,
  File,
  ExternalLink,
  Download,
  LogIn,
} from "lucide-react";
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
import usersApi from "../api/users";
import formsApi from "../api/forms";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";
import { translateServerError } from "../lib/error-translations";
import { uploadUrl } from "../utiles/fileUtils";
import { toPersianDigits } from "@/lib/utils";
import { formatProvinceCity } from "../data/iranian-provinces-cities";
import { formatContinentCountry } from "../data/continents-countries";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as XLSX from "xlsx";

const userBaseSchema = z.object({
  first_name: z.string().min(1, "نام الزامی است"),
  last_name: z.string().min(1, "نام خانوادگی الزامی است"),
  phone: z
    .string()
    .min(1, "شماره همراه الزامی است")
    .regex(/^\+98\d{10,14}$/, "شماره تلفن باید با 98+ شروع شود"),
  role: z.string().min(1, "نقش الزامی است"),
});

const addUserSchema = userBaseSchema.extend({
  password: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد"),
});

const editUserSchema = userBaseSchema.extend({
  password: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length >= 8,
      "رمز عبور در صورت ارائه باید حداقل ۸ کاراکتر باشد",
    ),
});

type AddUserFormData = z.infer<typeof addUserSchema>;
type EditUserFormData = z.infer<typeof editUserSchema>;

interface FieldDefinition {
  name: string;
  label: string;
  type: string;
  options?: { label: string; value: string }[];
}

interface User {
  id: number;
  phone: string;
  role: string;
  first_name: string;
  last_name: string;
  national_code: string | null;
  birth_date: string | null;
  gender: string | null;
  education: string | null;
  address: string | null;
  self_declaration_data: Record<string, unknown>;
  interview_status: string | null;
  interview_notes: string | null;
}

export function UsersPage() {
  const { user: currentUser, loginAsUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isInterviewDialogOpen, setIsInterviewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [interviewStatus, setInterviewStatus] = useState<string>("");
  const [interviewNotes, setInterviewNotes] = useState<string>("");
  const [isShowInfoDialogOpen, setIsShowInfoDialogOpen] = useState(false);
  const [showInfoUser, setShowInfoUser] = useState<User | null>(null);
  const [schemaFields, setSchemaFields] = useState<FieldDefinition[]>([]);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [exporting, setExporting] = useState(false);

  const addForm = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      role: "user",
      password: "",
    },
  });

  const editForm = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      role: "user",
      password: "",
    },
  });

  const isSuperAdmin = currentUser?.role === "super_admin";

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getAllUsers();
      setUsers(data || []);
    } catch (err: unknown) {
      toast.error(translateServerError(err) || "خطا در دریافت کاربران");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      let fields: FieldDefinition[] = [];
      try {
        const schema = await formsApi.getSchemaBySlug("self-declaration");
        if (schema?.fields) {
          fields = schema.fields.filter(
            (f: FieldDefinition) => f.type !== "file",
          );
        }
      } catch {
        // If schema fetch fails, proceed with empty fields (will use raw keys)
      }

      const rows = users.map((user, idx) => {
        const row: Record<string, string> = {
          ردیف: String(idx + 1),
          نام: user.first_name || "",
          "نام خانوادگی": user.last_name || "",
          "شماره همراه": user.phone || "",
          نقش: user.role || "",
          "کد ملی": user.national_code || "",
          "تاریخ تولد": user.birth_date || "",
          جنسیت:
            user.gender === "male"
              ? "مرد"
              : user.gender === "female"
                ? "زن"
                : user.gender || "",
          تحصیلات: user.education || "",
          آدرس: user.address || "",
          "وضعیت مصاحبه": getInterviewLabel(user.interview_status),
        };

        const selfDeclData = user.self_declaration_data || {};
        if (fields.length > 0) {
          for (const field of fields) {
            const value = selfDeclData[field.name];
            if (value === undefined || value === null || value === "") {
              row[field.label] = "";
            } else if (Array.isArray(value)) {
              if (field.options) {
                row[field.label] = value
                  .map(
                    (v) =>
                      field.options?.find((o) => o.value === v)?.label || v,
                  )
                  .join(", ");
              } else {
                row[field.label] = value.join(", ");
              }
            } else if (typeof value === "object") {
              if (field.type === "province_city")
                row[field.label] = formatProvinceCity(value);
              else if (field.type === "continent_country")
                row[field.label] = formatContinentCountry(value);
              else
                row[field.label] = Object.entries(
                  value as Record<string, unknown>,
                )
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(" | ");
            } else if (field.options) {
              const option = field.options.find((o) => o.value === value);
              row[field.label] = option ? option.label : String(value);
            } else {
              row[field.label] = String(value);
            }
          }
        } else {
          for (const [key, val] of Object.entries(selfDeclData)) {
            if (
              typeof val === "string" &&
              (val.startsWith("/uploads/") || val.startsWith("http"))
            )
              continue;
            if (typeof val === "object" && val !== null) {
              row[key] = JSON.stringify(val);
            } else if (Array.isArray(val)) {
              row[key] = val.join(", ");
            } else {
              row[key] = String(val ?? "");
            }
          }
        }

        return row;
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Users");

      const colWidths = Object.keys(rows[0] || {}).map((key) => {
        const maxLen = Math.max(
          key.length,
          ...rows.map((r) => String(r[key] || "").length),
        );
        return { wch: Math.min(maxLen + 2, 50) };
      });
      ws["!cols"] = colWidths;

      XLSX.writeFile(
        wb,
        `users-export-${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    } catch {
      toast.error("خطا در خروجی اکسل");
    } finally {
      setExporting(false);
    }
  };

  // Filter users based on role, status, search query, and sort by id ascending
  const filteredUsers = users.filter((user) => {
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" || user.interview_status === statusFilter;
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      fullName.includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery);
    return matchesRole && matchesStatus && matchesSearch;
  });
  const sortedUsers = [...filteredUsers].sort((a, b) => a.id - b.id);

  const handleAddUser = async (data: AddUserFormData) => {
    const toastId = toast.loading("در حال ایجاد کاربر...");
    setIsSubmitting(true);

    try {
      await usersApi.createUser(data);
      toast.success("کاربر با موفقیت ساخته شد!", { id: toastId });
      setIsAddDialogOpen(false);
      addForm.reset();
      fetchAllUsers();
    } catch (err: unknown) {
      toast.error(translateServerError(err) || "خطا در ایجاد کاربر", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (data: EditUserFormData) => {
    if (!selectedUser) return;

    const toastId = toast.loading("در حال بروزرسانی کاربر");
    setIsSubmitting(true);

    try {
      const updateData = { ...data };
      if (!updateData.password) {
        delete updateData.password;
      }
      await usersApi.updateUser(selectedUser.id, updateData);
      toast.success("کاربر با موفقیت بروز شد!", { id: toastId });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      editForm.reset();
      fetchAllUsers();
    } catch (err: unknown) {
      toast.error(translateServerError(err) || "خطا در بروزرسانی کاربر", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    const toastId = toast.loading("در حال حذف کاربر...");

    try {
      await usersApi.deleteUser(selectedUser.id);
      toast.success("کاربر با موفقیت حذف شد!", { id: toastId });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchAllUsers();
    } catch (err: unknown) {
      toast.error(translateServerError(err) || "خطا در حذف کاربر", {
        id: toastId,
      });
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    editForm.reset({
      phone: user.phone,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const openInterviewDialog = (user: User) => {
    setSelectedUser(user);
    setInterviewStatus(user.interview_status || "accepted");
    setInterviewNotes(user.interview_notes || "");
    setIsInterviewDialogOpen(true);
  };

  const openShowInfoDialog = async (user: User) => {
    setShowInfoUser(user);
    setIsShowInfoDialogOpen(true);
    setLoadingSchema(true);
    try {
      const schema = await formsApi.getSchemaBySlug("self-declaration");
      if (schema?.fields) {
        setSchemaFields(schema.fields);
      }
    } catch {
      setSchemaFields([]);
    } finally {
      setLoadingSchema(false);
    }
  };

  const handleInterviewUpdate = async () => {
    if (!selectedUser) return;

    const toastId = toast.loading("در حال بروزرسانی وضعیت...");
    setIsSubmitting(true);

    try {
      const data: { status: string; notes?: string } = {
        status: interviewStatus,
      };
      if (interviewStatus === "not_meeting_requirements" && interviewNotes) {
        data.notes = interviewNotes;
      }
      await usersApi.updateInterview(selectedUser.id, data);
      toast.success("وضعیت با موفقیت بروز شد!", { id: toastId });
      setIsInterviewDialogOpen(false);
      setSelectedUser(null);
      fetchAllUsers();
    } catch (err: unknown) {
      toast.error(
        translateServerError(err) || "خطا در بروزرسانی وضعیت مصاحبه",
        { id: toastId },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInterviewBadgeColor = (status: string | null) => {
    switch (status) {
      case "awaiting_interview":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "accepted":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "not_meeting_requirements":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getInterviewLabel = (status: string | null) => {
    switch (status) {
      case "awaiting_interview":
        return "در انتظار مصاحبه";
      case "accepted":
        return "پذیرفته شده";
      case "not_meeting_requirements":
        return "عدم احراز شرایط";
      default:
        return "ثبت‌نام نکرده";
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "admin":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "user":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const renderValue = (
    field: {
      name: string;
      label: string;
      type: string;
      options?: { label: string; value: string }[];
    },
    value: unknown,
  ) => {
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

  // Check if user has admin or super_admin role
  const isSuperAdminFn = (role: string) => role === "super_admin";

  const hasAccess =
    currentUser?.role === "admin" || currentUser?.role === "super_admin";

  if (!hasAccess) {
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
              فقط مدیران می‌توانند این صفحه را مشاهده کنند. اگر فکر می‌کنید باید
              به این صفحه دسترسی داشته باشید، لطفاً با مدیر سیستم خود تماس
              بگیرید.
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
              <div className="flex items-center gap-2 mb-2 ">
                <Shield className="h-6 w-6" />
                <CardTitle>داشبورد کاربران</CardTitle>
              </div>
              <CardDescription className="max-sm:mb-2">
                مدیریت تمام کاربران
              </CardDescription>
            </div>
            {isSuperAdmin && (
              <div className="flex gap-2 max-sm:flex-col max-sm:items-start max-sm:min-w-full">
                <Button
                  onClick={handleExportExcel}
                  disabled={exporting}
                  className="max-sm:min-w-full"
                >
                  <Download className="h-4 w-4 ml-2" />
                  {exporting ? "در حال خروجی..." : "خروجی اکسل"}
                </Button>
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="max-sm:min-w-full"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  اضافه کردن کاربر
                </Button>
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 max-sm:flex-col max-sm:items-start max-sm:w-full">
            <div className="flex items-center gap-2 max-sm:w-full">
              <Label htmlFor="search" className="whitespace-nowrap">
                جستجو:
              </Label>
              <Input
                id="search"
                placeholder="نام یا شماره همراه..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[200px] max-sm:w-full"
              />
            </div>
            <div className="flex items-center gap-2 max-sm:w-full">
              <Label htmlFor="role-filter" className="whitespace-nowrap">
                نقش:
              </Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger
                  id="role-filter"
                  className="w-[150px] max-sm:w-full"
                >
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ALL ROLES</SelectItem>
                  <SelectItem value="super_admin">SUPER ADMIN</SelectItem>
                  <SelectItem value="admin">ADMIN</SelectItem>
                  <SelectItem value="user">USER</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 max-sm:w-full">
              <Label htmlFor="status-filter" className="whitespace-nowrap">
                وضعیت:
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  id="status-filter"
                  className="w-[150px] max-sm:w-full"
                >
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ALL STATUSES</SelectItem>
                  <SelectItem value="awaiting_interview">
                    در انتظار مصاحبه
                  </SelectItem>
                  <SelectItem value="accepted">پذیرفته شده</SelectItem>
                  <SelectItem value="not_meeting_requirements">
                    عدم احراز شرایط
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="text-sm text-muted-foreground mr-auto">
              {toPersianDigits(filteredUsers.length)} {"کاربر"}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size={32} />
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              کاربری یافت نشد
            </p>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-border bg-muted/50">
                      <th className="text-right p-3 font-semibold">ردیف</th>
                      <th className="text-right p-3 font-semibold">
                        {" "}
                        کاربرنام
                      </th>
                      <th className="text-right p-3 font-semibold">
                        شماره همراه
                      </th>
                      <th className="text-right p-3 font-semibold">نقش</th>
                      <th className="text-right p-3 font-semibold">وضعیت</th>
                      <th className="text-right p-3 font-semibold">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map((user, index) => (
                      <tr
                        key={user.id}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-3 font-medium">
                          {toPersianDigits(index + 1)}
                        </td>
                        <td className="p-3">
                          {user.first_name} {user.last_name}
                        </td>
                        <td className="p-3 text-right" dir="ltr">
                          {toPersianDigits(user.phone)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                              user.role,
                            )}`}
                          >
                            {user.role.replace("_", " ").toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getInterviewBadgeColor(
                              user.interview_status,
                            )}`}
                          >
                            {getInterviewLabel(user.interview_status)}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openShowInfoDialog(user)}
                            >
                              <Eye className="h-3 w-3 ml-1" />
                              اطلاعات
                            </Button>
                            {isSuperAdmin && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openInterviewDialog(user)}
                                >
                                  <UserCheck className="h-3 w-3 ml-1" />
                                  مصاحبه
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditDialog(user)}
                                >
                                  ویرایش
                                  <Pencil className="h-3 w-3 mr-1" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => loginAsUser(user.id)}
                                  className="bg-green-800 text-green-100 hover:bg-green-900"
                                >
                                  <LogIn className="h-3 w-3 ml-1" />
                                  ورود
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => openDeleteDialog(user)}
                                >
                                  حذف
                                  <Trash2 className="h-3 w-3 mr-1" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-3">
                {sortedUsers.map((user, index) => (
                  <div
                    key={user.id}
                    className="border border-border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <p className="font-medium truncate">
                          {toPersianDigits(index + 1)}. {user.first_name}{" "}
                          {user.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground" dir="ltr">
                          {toPersianDigits(user.phone)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                            user.role,
                          )}`}
                        >
                          {user.role.replace("_", " ").toUpperCase()}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getInterviewBadgeColor(
                            user.interview_status,
                          )}`}
                        >
                          {getInterviewLabel(user.interview_status)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 pt-2 border-t border-border">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => openShowInfoDialog(user)}
                      >
                        <Eye className="h-3 w-3 ml-1" />
                        اطلاعات
                      </Button>
                      {isSuperAdmin && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => openInterviewDialog(user)}
                          >
                            <UserCheck className="h-3 w-3 ml-1" />
                            مصاحبه
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => openEditDialog(user)}
                          >
                            <Pencil className="h-3 w-3 ml-1" />
                            ویرایش
                          </Button>
                          <Button
                            size="sm"
                            className="w-full bg-green-800 text-green-100 hover:bg-green-900"
                            onClick={() => loginAsUser(user.id)}
                          >
                            <LogIn className="h-3 w-3 ml-1" />
                            ورود
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-full"
                            onClick={() => openDeleteDialog(user)}
                          >
                            <Trash2 className="h-3 w-3 ml-1" />
                            حذف
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Show Information Dialog */}
      <Dialog
        open={isShowInfoDialogOpen}
        onOpenChange={(o) => {
          if (!o) {
            setIsShowInfoDialogOpen(false);
            setShowInfoUser(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>نمایش اطلاعات کاربر</DialogTitle>
            {showInfoUser && (
              <DialogDescription>
                {showInfoUser.first_name} {showInfoUser.last_name} -{" "}
                <span dir="ltr">{toPersianDigits(showInfoUser.phone)}</span>
              </DialogDescription>
            )}
          </DialogHeader>

          {showInfoUser && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3 pb-2 border-b">
                  اطلاعات شخصی
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">نام:</span>
                    <p className="font-medium">{showInfoUser.first_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">نام خانوادگی:</span>
                    <p className="font-medium">{showInfoUser.last_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">شماره همراه:</span>
                    <p className="font-medium" dir="ltr">
                      {toPersianDigits(showInfoUser.phone)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">نقش:</span>
                    <p className="font-medium">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(showInfoUser.role)}`}
                      >
                        {showInfoUser.role.replace("_", " ").toUpperCase()}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">جنسیت:</span>
                    <p className="font-medium">
                      {showInfoUser.gender === "male"
                        ? "مرد"
                        : showInfoUser.gender === "female"
                          ? "زن"
                          : showInfoUser.gender || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Interview Status */}
              <div>
                <h3 className="font-semibold text-lg mb-3 pb-2 border-b">
                  وضعیت مصاحبه
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">وضعیت:</span>
                    <p className="font-medium mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInterviewBadgeColor(showInfoUser.interview_status)}`}
                      >
                        {getInterviewLabel(showInfoUser.interview_status)}
                      </span>
                    </p>
                  </div>
                  {showInfoUser.interview_notes && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">یادداشت‌ها:</span>
                      <p className="font-medium mt-1 p-2 bg-muted rounded text-sm">
                        {showInfoUser.interview_notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Self-Declaration Data */}
              <div>
                <h3 className="font-semibold text-lg mb-3 pb-2 border-b">
                  اطلاعات اظهارنامه
                </h3>
                {loadingSchema ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <LoadingSpinner size={16} />
                    در حال بارگذاری...
                  </div>
                ) : Object.keys(showInfoUser.self_declaration_data || {})
                    .length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    اظهارنامه‌ای ثبت نشده است
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(schemaFields.length > 0
                      ? schemaFields
                      : Object.keys(showInfoUser.self_declaration_data).map(
                          (key) => ({ name: key, label: key, type: "text" }),
                        )
                    ).map((field) => {
                      const value =
                        showInfoUser.self_declaration_data?.[field.name];
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
                            {renderValue(field, value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsShowInfoDialogOpen(false);
                setShowInfoUser(null);
              }}
            >
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader style={{ textAlign: "center" }}>
            <DialogTitle>افزودن کاربر جدید</DialogTitle>
            <DialogDescription>ایجاد کاربر جدید با نقش خاص</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={addForm.handleSubmit(handleAddUser)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-first-name">نام</Label>
                <Input
                  id="add-first-name"
                  {...addForm.register("first_name")}
                  placeholder="جان"
                  className={
                    addForm.formState.errors.first_name
                      ? "border-destructive"
                      : ""
                  }
                />
                {addForm.formState.errors.first_name && (
                  <p className="text-sm text-destructive">
                    {addForm.formState.errors.first_name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-last-name">نام خانوادگی</Label>
                <Input
                  id="add-last-name"
                  {...addForm.register("last_name")}
                  placeholder="دو"
                  className={
                    addForm.formState.errors.last_name
                      ? "border-destructive"
                      : ""
                  }
                />
                {addForm.formState.errors.last_name && (
                  <p className="text-sm text-destructive">
                    {addForm.formState.errors.last_name.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-phone">شماره همراه</Label>
              <Input
                id="add-phone"
                dir="ltr"
                {...addForm.register("phone")}
                placeholder="+989123456789"
                className={
                  addForm.formState.errors.phone ? "border-destructive" : ""
                }
              />
              {addForm.formState.errors.phone && (
                <p className="text-sm text-destructive">
                  {addForm.formState.errors.phone.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-password">رمز عبور</Label>
              <Input
                id="add-password"
                type="password"
                {...addForm.register("password")}
                placeholder="حداقل 8 کاراکتر"
                className={
                  addForm.formState.errors.password ? "border-destructive" : ""
                }
              />
              {addForm.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {addForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-role">نقش</Label>
              <Select
                onValueChange={(value) =>
                  addForm.setValue("role", value, { shouldValidate: true })
                }
                defaultValue="user"
              >
                <SelectTrigger
                  id="add-role"
                  className={
                    addForm.formState.errors.role ? "border-destructive" : ""
                  }
                >
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">SUPER ADMIN</SelectItem>
                  <SelectItem value="admin">ADMIN</SelectItem>
                  <SelectItem value="user">USER</SelectItem>
                </SelectContent>
              </Select>
              {addForm.formState.errors.role && (
                <p className="text-sm text-destructive">
                  {addForm.formState.errors.role.message}
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

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader style={{ textAlign: "center" }}>
            <DialogTitle>ویرایش کاربر</DialogTitle>
            <DialogDescription>ویرایش اطلاعات کاربر</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit(handleEditUser)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-first-name">نام</Label>
                <Input
                  id="edit-first-name"
                  {...editForm.register("first_name")}
                  placeholder="John"
                  className={
                    editForm.formState.errors.first_name
                      ? "border-destructive"
                      : ""
                  }
                />
                {editForm.formState.errors.first_name && (
                  <p className="text-sm text-destructive">
                    {editForm.formState.errors.first_name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-last-name">نام خانوادگی</Label>
                <Input
                  id="edit-last-name"
                  {...editForm.register("last_name")}
                  placeholder="Doe"
                  className={
                    editForm.formState.errors.last_name
                      ? "border-destructive"
                      : ""
                  }
                />
                {editForm.formState.errors.last_name && (
                  <p className="text-sm text-destructive">
                    {editForm.formState.errors.last_name.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">شماره همراه</Label>
              <Input
                id="edit-phone"
                dir="ltr"
                {...editForm.register("phone")}
                placeholder="+1234567890"
                className={
                  editForm.formState.errors.phone ? "border-destructive" : ""
                }
              />
              {editForm.formState.errors.phone && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.phone.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">
                رمز عبور (برای به‌روز بودن، خالی بگذارید)
              </Label>
              <Input
                id="edit-password"
                type="password"
                {...editForm.register("password")}
                placeholder="رمز عبور جدید"
                className={
                  editForm.formState.errors.password ? "border-destructive" : ""
                }
              />
              {editForm.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">نقش</Label>
              <Select
                onValueChange={(value) =>
                  editForm.setValue("role", value, { shouldValidate: true })
                }
                value={editForm.watch("role")}
              >
                <SelectTrigger
                  id="edit-role"
                  className={
                    editForm.formState.errors.role ? "border-destructive" : ""
                  }
                >
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">SUPER ADMIN</SelectItem>
                  <SelectItem value="admin">ADMIN</SelectItem>
                  <SelectItem value="user">USER</SelectItem>
                </SelectContent>
              </Select>
              {editForm.formState.errors.role && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.role.message}
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
        <DialogContent className="max-w-md">
          <DialogHeader style={{ textAlign: "center" }}>
            <DialogTitle>حذف کاربر</DialogTitle>
            <DialogDescription>
              آیا مطمئن هستید که می‌خواهید این کاربر را حذف کنید؟ این اقدام قابل
              بازگشت نیست.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium">
                {selectedUser.first_name} {selectedUser.last_name}
              </p>
              <p className="text-sm text-muted-foreground" dir="ltr">
                {toPersianDigits(selectedUser.phone)}
              </p>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getRoleBadgeColor(
                  selectedUser.role,
                )}`}
              >
                {selectedUser.role.replace("_", " ").toUpperCase()}
              </span>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="ml-2 max-sm:w-full max-sm:mt-2"
            >
              لغو
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteUser}
            >
              حذف کاربر
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Interview Dialog */}
      <Dialog
        open={isInterviewDialogOpen}
        onOpenChange={setIsInterviewDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader style={{ textAlign: "center" }}>
            <DialogTitle>نتیجه مصاحبه</DialogTitle>
            <DialogDescription>
              {selectedUser
                ? `${selectedUser.first_name} ${selectedUser.last_name}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              {selectedUser.interview_status && (
                <div className="flex items-center justify-center">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getInterviewBadgeColor(
                      selectedUser.interview_status,
                    )}`}
                  >
                    {getInterviewLabel(selectedUser.interview_status)}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <Label>نتیجه مصاحبه</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={
                      interviewStatus === "accepted" ? "default" : "outline"
                    }
                    className="w-full"
                    onClick={() => setInterviewStatus("accepted")}
                  >
                    <UserCheck className="h-4 w-4 ml-2" />
                    پذیرفته شده
                  </Button>
                  <Button
                    type="button"
                    variant={
                      interviewStatus === "not_meeting_requirements"
                        ? "default"
                        : "outline"
                    }
                    className="w-full"
                    onClick={() =>
                      setInterviewStatus("not_meeting_requirements")
                    }
                  >
                    <UserX className="h-4 w-4 ml-2" />
                    عدم احراز شرایط
                  </Button>
                </div>
              </div>

              {interviewStatus === "not_meeting_requirements" && (
                <div className="space-y-2">
                  <Label htmlFor="interview-notes">توضیحات</Label>
                  <Textarea
                    id="interview-notes"
                    placeholder="دلیل عدم احراز شرایط را وارد کنید"
                    value={interviewNotes}
                    onChange={(e) => setInterviewNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsInterviewDialogOpen(false)}
              disabled={isSubmitting}
              className="ml-2 max-sm:w-full max-sm:mt-2"
            >
              لغو
            </Button>
            <Button
              type="button"
              onClick={handleInterviewUpdate}
              disabled={
                isSubmitting ||
                (interviewStatus === "not_meeting_requirements" &&
                  !interviewNotes.trim())
              }
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size={16} />
                  در حال بروزرسانی...
                </>
              ) : (
                "ثبت نتیجه"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
