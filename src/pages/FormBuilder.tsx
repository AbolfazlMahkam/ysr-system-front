import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Save,
  Copy,
} from "lucide-react";
import adminFormsApi from "../api/admin-forms";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { toast } from "sonner";
import { translateServerError } from "../lib/error-translations";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { cn, toPersianDigits } from "@/lib/utils";

interface FieldOption {
  label: string;
  value: string;
}

interface FileConfig {
  accept?: string;
  maxSize?: number;
}

interface FieldCondition {
  field: string;
  operator: "equals" | "not_equals" | "not_empty";
  value: string;
}

interface FieldDefinition {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: FieldOption[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validations?: Record<string, any>;
  fileConfig?: FileConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue?: any;
  multiple?: boolean;
  condition?: FieldCondition;
}

const FIELD_TYPES = [
  { value: "text", label: "متن کوتاه" },
  { value: "textarea", label: "پاراگراف" },
  { value: "number", label: "عدد" },
  { value: "date", label: "تاریخ" },
  { value: "select", label: "Dropdown" },
  { value: "radio", label: "دکمه رادیویی" },
  { value: "checkbox", label: "چک‌باکس" },
  { value: "file", label: "آپلود فایل" },
  { value: "province_city", label: "استان و شهر" },
  { value: "continent_country", label: "قاره و کشور" },
  { value: "range", label: "مقیاس (اسلایدر)" },
];

function generateFieldName(label: string, index: number): string {
  return `field_${index}_${
    label
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "")
      .toLowerCase() || "unnamed"
  }`;
}

export function FormBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isMultiSubmit, setIsMultiSubmit] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationText, setNotificationText] = useState("");
  const [fields, setFields] = useState<FieldDefinition[]>([]);

  useEffect(() => {
    if (isEdit) {
      fetchForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      const data = await adminFormsApi.getOne(Number(id));
      setSlug(data.slug);
      setTitle(data.title);
      setDescription(data.description || "");
      setIsActive(data.is_active);
      setIsMultiSubmit(data.is_multi_submit);
      setShowNotification(data.show_notification ?? false);
      setNotificationTitle(data.notification_title || "");
      setNotificationText(data.notification_text || "");
      setFields(data.fields || []);
    } catch (err: unknown) {
      toast.error(translateServerError(err) || "خطا در بارگذاری فرم");
      navigate("/admin/forms");
    } finally {
      setLoading(false);
    }
  };

  const addField = () => {
    const index = fields.length;
    const newField: FieldDefinition = {
      name: generateFieldName("new", index),
      label: "",
      type: "text",
      required: false,
      placeholder: "",
      options: [],
    };
    setFields([...fields, newField]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const copyField = (index: number) => {
    const field = fields[index];
    const cloned: FieldDefinition = {
      ...field,
      name: generateFieldName(field.label || "copy", fields.length),
      options: field.options ? field.options.map((o) => ({ ...o })) : undefined,
      validations: field.validations ? { ...field.validations } : undefined,
      fileConfig: field.fileConfig ? { ...field.fileConfig } : undefined,
    };
    const updated = [...fields];
    updated.splice(index + 1, 0, cloned);
    setFields(updated);
  };

  const updateField = (
    index: number,
    key: keyof FieldDefinition,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
  ) => {
    const updated = fields.map((field, i) => {
      if (i !== index) return field;
      const next = { ...field, [key]: value };
      if (key === "label") {
        next.name = generateFieldName(value, index);
      }
      if (
        key === "type" &&
        ![
          "select",
          "radio",
          "checkbox",
          "province_city",
          "continent_country",
        ].includes(value)
      ) {
        next.options = undefined;
      }
      if (
        [
          "select",
          "radio",
          "checkbox",
          "province_city",
          "continent_country",
        ].includes(value) &&
        !next.options
      ) {
        next.options = [];
      }
      if (key === "type" && value === "range" && !next.validations) {
        next.validations = { min: 0, max: 10, step: 1 };
      }
      if (key === "type" && value === "file" && !next.fileConfig) {
        next.fileConfig = { accept: ".pdf,.jpg,.png", maxSize: 10 };
      }
      if (key === "type" && value !== "file") {
        next.fileConfig = undefined;
      }
      return next;
    });
    setFields(updated);
  };

  const addOption = (fieldIndex: number) => {
    const updated = fields.map((field, i) => {
      if (i !== fieldIndex) return field;
      const optIndex = (field.options?.length || 0) + 1;
      return {
        ...field,
        options: [
          ...(field.options || []),
          { label: `گزینه ${optIndex}`, value: `option_${optIndex}` },
        ],
      };
    });
    setFields(updated);
  };

  const updateOption = (
    fieldIndex: number,
    optIndex: number,
    key: keyof FieldOption,
    value: string,
  ) => {
    const updated = fields.map((field, i) => {
      if (i !== fieldIndex) return field;
      const options = [...(field.options || [])];
      options[optIndex] = { ...options[optIndex], [key]: value };
      return { ...field, options };
    });
    setFields(updated);
  };

  const removeOption = (fieldIndex: number, optIndex: number) => {
    const updated = fields.map((field, i) => {
      if (i !== fieldIndex) return field;
      return {
        ...field,
        options: (field.options || []).filter((_, oi) => oi !== optIndex),
      };
    });
    setFields(updated);
  };

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  const moveField = (from: number, to: number) => {
    if (to < 0 || to >= fields.length) return;
    const updated = [...fields];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setFields(updated);
  };

  const moveUp = (index: number) => moveField(index, index - 1);
  const moveDown = (index: number) => moveField(index, index + 1);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
    dragOverIndex.current = index;
  };

  const handleDragOver = (index: number) => {
    dragOverIndex.current = index;
  };

  const handleDragEnd = () => {
    if (
      dragIndex !== null &&
      dragOverIndex.current !== null &&
      dragIndex !== dragOverIndex.current
    ) {
      moveField(dragIndex, dragOverIndex.current);
    }
    setDragIndex(null);
    dragOverIndex.current = null;
  };

  const validate = (): string | null => {
    if (!title.trim()) return "عنوان فرم الزامی است";
    if (!slug.trim()) return "slug فرم الزامی است";
    if (fields.length === 0) return "حداقل یک فیلد به فرم اضافه کنید";
    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].label.trim()) return `برچسب فیلد ${i + 1} الزامی است`;
    }
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    const toastId = toast.loading(
      isEdit ? "در حال بروزرسانی فرم..." : "در حال ایجاد فرم...",
    );
    setSaving(true);
    try {
      const payload = {
        slug,
        title,
        description: description || null,
        is_active: isActive,
        is_multi_submit: isMultiSubmit,
        show_notification: showNotification,
        notification_title: showNotification ? notificationTitle : null,
        notification_text: showNotification ? notificationText : null,
        fields,
      };
      if (isEdit) {
        await adminFormsApi.update(Number(id), payload);
        toast.success("فرم با موفقیت بروزرسانی شد", { id: toastId });
      } else {
        await adminFormsApi.create(payload);
        toast.success("فرم با موفقیت ایجاد شد", { id: toastId });
      }
      navigate("/admin/forms");
    } catch (err: unknown) {
      toast.error(translateServerError(err) || "خطا در ذخیره فرم", {
        id: toastId,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-20">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/forms")}
        >
          <ArrowRight className="h-4 w-4 ml-1" />
          بازگشت
        </Button>
        <h1 className="text-2xl font-bold">
          {isEdit ? "ویرایش فرم" : "ایجاد فرم جدید"}
        </h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
            step === 1
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          ۱<span className="hidden sm:inline">تنظیمات فرم</span>
        </div>
        <div className="h-px flex-1 bg-border" />
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
            step === 2
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          ۲<span className="hidden sm:inline">ساختار فیلدها</span>
        </div>
        <div className="h-px flex-1 bg-border" />
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
            step === 3
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          ۳<span className="hidden sm:inline">اعلان پس از ارسال</span>
        </div>
      </div>

      {/* Step 1: Meta */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>تنظیمات فرم</CardTitle>
            <CardDescription>
              اطلاعات پایه و تنظیمات فرم را وارد کنید
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان فرم</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان فرم را وارد کنید"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                dir="ltr"
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.replace(/\s+/g, "-").toLowerCase())
                }
                placeholder="form-slug"
              />
              <p className="text-xs text-muted-foreground">
                شناسه یکتای فرم در URL
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">توضیحات</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="توضیحات اختیاری فرم"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={isActive}
                onCheckedChange={(v) => setIsActive(v === true)}
              />
              <Label htmlFor="isActive">فرم فعال باشد</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isMultiSubmit"
                checked={isMultiSubmit}
                onCheckedChange={(v) => setIsMultiSubmit(v === true)}
              />
              <Label htmlFor="isMultiSubmit">
                کاربر می‌تواند چند بار ارسال کند
              </Label>
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={() => setStep(2)}>
                مرحله بعد
                <ArrowLeft className="h-4 w-4 mr-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Fields */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>ساختار فیلدها</CardTitle>
                <CardDescription>فیلدهای فرم را تعریف کنید</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addField}>
                <Plus className="h-4 w-4 ml-1" />
                افزودن فیلد
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length === 0 && (
              <p className="text-muted-foreground text-center py-8">
                هیچ فیلدی تعریف نشده است. برای شروع یک فیلد اضافه کنید.
              </p>
            )}
            {fields.map((field, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => {
                  e.preventDefault();
                  handleDragOver(index);
                }}
                onDragEnd={handleDragEnd}
                className={cn(
                  "border rounded-lg p-4 space-y-3 transition-shadow",
                  dragIndex === index
                    ? "opacity-50 shadow-inner"
                    : "bg-muted/30",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      فیلد {toPersianDigits(index + 1)}
                    </span>
                    <div className="flex items-center gap-0.5 mr-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === 0}
                        onClick={() => moveUp(index)}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === fields.length - 1}
                        onClick={() => moveDown(index)}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyField(index)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>نوع فیلد</Label>
                    <Select
                      value={field.type}
                      onValueChange={(v) => updateField(index, "type", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((ft) => (
                          <SelectItem key={ft.value} value={ft.value}>
                            {ft.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>برچسب</Label>
                    <Input
                      value={field.label}
                      onChange={(e) =>
                        updateField(index, "label", e.target.value)
                      }
                      placeholder="برچسب فیلد"
                    />
                  </div>
                  {![
                    "select",
                    "radio",
                    "checkbox",
                    "file",
                    "province_city",
                    "continent_country",
                    "range",
                  ].includes(field.type) && (
                    <div className="space-y-2">
                      <Label>Placeholder</Label>
                      <Input
                        value={field.placeholder || ""}
                        onChange={(e) =>
                          updateField(index, "placeholder", e.target.value)
                        }
                        placeholder="متن راهنما"
                      />
                    </div>
                  )}
                  <div className="flex items-end gap-4">
                    <div className="flex items-center gap-2 pb-2">
                      <Checkbox
                        id={`required-${index}`}
                        checked={field.required}
                        onCheckedChange={(v) =>
                          updateField(index, "required", v === true)
                        }
                      />
                      <Label htmlFor={`required-${index}`}>اجباری</Label>
                    </div>
                  </div>
                </div>

                {/* Range config */}
                {field.type === "range" && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>حداقل</Label>
                      <Input
                        type="number"
                        value={field.validations?.min ?? 0}
                        onChange={(e) =>
                          updateField(index, "validations", {
                            ...field.validations,
                            min: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>حداکثر</Label>
                      <Input
                        type="number"
                        value={field.validations?.max ?? 10}
                        onChange={(e) =>
                          updateField(index, "validations", {
                            ...field.validations,
                            max: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>گام</Label>
                      <Input
                        type="number"
                        step="any"
                        value={field.validations?.step ?? 1}
                        onChange={(e) =>
                          updateField(index, "validations", {
                            ...field.validations,
                            step: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {/* File type config */}
                {field.type === "file" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>انواع فایل مجاز</Label>
                      <Select
                        value={field.fileConfig?.accept || ""}
                        onValueChange={(v) =>
                          updateField(index, "fileConfig", {
                            ...field.fileConfig,
                            accept: v,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب نوع فایل" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value=".jpg,.jpeg,.png,.gif,.webp,.svg">
                            تصاویر
                          </SelectItem>
                          <SelectItem value=".pdf,.doc,.docx,.txt">
                            اسناد
                          </SelectItem>
                          <SelectItem value=".xls,.xlsx">
                            صفحات گسترده
                          </SelectItem>
                          <SelectItem value=".pdf">PDF</SelectItem>
                          <SelectItem value=".jpg,.jpeg,.png,.pdf">
                            تصاویر و PDF
                          </SelectItem>
                          <SelectItem value=".jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar">
                            همه انواع
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>حداکثر حجم (مگابایت)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={field.fileConfig?.maxSize ?? 10}
                        onChange={(e) =>
                          updateField(index, "fileConfig", {
                            ...field.fileConfig,
                            maxSize: Number(e.target.value),
                          })
                        }
                        placeholder="10"
                      />
                    </div>
                  </div>
                )}

                {/* Options for select/radio/checkbox */}
                {["select", "radio", "checkbox"].includes(field.type) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>گزینه‌ها</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addOption(index)}
                      >
                        <Plus className="h-3 w-3 ml-1" />
                        افزودن گزینه
                      </Button>
                    </div>
                    {field.type === "select" && (
                      <div className="flex items-center gap-2 pb-1">
                        <Checkbox
                          id={`multiple-${index}`}
                          checked={field.multiple ?? false}
                          onCheckedChange={(v) =>
                            updateField(index, "multiple", v === true)
                          }
                        />
                        <Label htmlFor={`multiple-${index}`}>
                          انتخاب چندگانه
                        </Label>
                      </div>
                    )}
                    {(field.options || []).map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <Input
                          className="flex-1"
                          value={opt.label}
                          onChange={(e) =>
                            updateOption(index, oi, "label", e.target.value)
                          }
                          placeholder="برچسب"
                        />
                        <Input
                          className="flex-1"
                          dir="ltr"
                          value={opt.value}
                          onChange={(e) =>
                            updateOption(index, oi, "value", e.target.value)
                          }
                          placeholder="value"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(index, oi)}
                          className="text-destructive shrink-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Conditional field config */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">شرط نمایش</Label>
                    <div className="flex items-center gap-2">
                      {field.condition && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive h-7 text-xs"
                          onClick={() =>
                            updateField(index, "condition", undefined)
                          }
                        >
                          حذف شرط
                        </Button>
                      )}
                      <Checkbox
                        id={`has-condition-${index}`}
                        checked={!!field.condition}
                        onCheckedChange={(v) => {
                          if (v === true) {
                            const otherFields = fields.filter(
                              (_, i) => i !== index,
                            );
                            const firstOther = otherFields[0];
                            updateField(index, "condition", {
                              field: firstOther?.name || "",
                              operator: "equals",
                              value: "",
                            });
                          } else {
                            updateField(index, "condition", undefined);
                          }
                        }}
                      />
                      <Label
                        htmlFor={`has-condition-${index}`}
                        className="text-sm"
                      >
                        وابسته به فیلد دیگر
                      </Label>
                    </div>
                  </div>
                  {field.condition && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-muted/50 p-3 rounded-md">
                      <div className="space-y-1">
                        <Label className="text-xs">فیلد وابسته</Label>
                        <Select
                          value={field.condition.field}
                          onValueChange={(v) =>
                            updateField(index, "condition", {
                              ...field.condition!,
                              field: v,
                              value: "",
                            })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="انتخاب فیلد" />
                          </SelectTrigger>
                          <SelectContent>
                            {fields
                              .filter((_, i) => i !== index)
                              .map((f) => (
                                <SelectItem key={f.name} value={f.name}>
                                  {f.label || f.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">شرط</Label>
                        <Select
                          value={field.condition.operator}
                          onValueChange={(v) =>
                            updateField(index, "condition", {
                              ...field.condition!,
                              operator: v,
                              value: "",
                            })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">برابر باشد</SelectItem>
                            <SelectItem value="not_equals">
                              برابر نباشد
                            </SelectItem>
                            <SelectItem value="not_empty">
                              خالی نباشد
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {field.condition.operator !== "not_empty" && (
                        <div className="space-y-1">
                          <Label className="text-xs">مقدار</Label>
                          {(() => {
                            const depField = fields.find(
                              (f) => f.name === field.condition!.field,
                            );
                            if (
                              depField &&
                              ["select", "radio"].includes(depField.type) &&
                              depField.options?.length
                            ) {
                              return (
                                <Select
                                  value={field.condition!.value}
                                  onValueChange={(v) =>
                                    updateField(index, "condition", {
                                      ...field.condition!,
                                      value: v,
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="انتخاب مقدار" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {depField.options.map((opt) => (
                                      <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                      >
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              );
                            }
                            return (
                              <Input
                                className="h-8"
                                value={field.condition!.value}
                                onChange={(e) =>
                                  updateField(index, "condition", {
                                    ...field.condition!,
                                    value: e.target.value,
                                  })
                                }
                                placeholder="مقدار"
                              />
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {fields.length > 0 && (
              <div className="flex justify-center pt-2">
                <Button variant="outline" size="sm" onClick={addField}>
                  <Plus className="h-4 w-4 ml-1" />
                  افزودن فیلد دیگر
                </Button>
              </div>
            )}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowRight className="h-4 w-4 ml-1" />
                مرحله قبل
              </Button>
              <Button onClick={() => setStep(3)}>
                مرحله بعد
                <ArrowLeft className="h-4 w-4 mr-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Notification */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>اعلان پس از ارسال</CardTitle>
            <CardDescription>
              در صورت تمایل، پیام اعلانی پس از ارسال موفق فرم به کاربر نمایش
              دهید
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="showNotification"
                checked={showNotification}
                onCheckedChange={(v) => setShowNotification(v === true)}
              />
              <Label htmlFor="showNotification">
                نمایش پیام اعلان پس از ارسال فرم
              </Label>
            </div>
            {showNotification && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notificationTitle">عنوان اعلان</Label>
                  <Input
                    id="notificationTitle"
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                    placeholder="عنوان پیام اعلان را وارد کنید..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notificationText">متن اعلان</Label>
                  <Textarea
                    id="notificationText"
                    value={notificationText}
                    onChange={(e) => setNotificationText(e.target.value)}
                    placeholder="متن پیام اعلان را وارد کنید..."
                    rows={4}
                  />
                </div>
              </div>
            )}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowRight className="h-4 w-4 ml-1" />
                مرحله قبل
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 ml-1" />
                {saving
                  ? "در حال ذخیره..."
                  : isEdit
                    ? "بروزرسانی فرم"
                    : "ذخیره فرم"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
