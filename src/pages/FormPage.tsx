import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, ArrowRight, RefreshCw } from "lucide-react";
import formsApi from "../api/forms";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio";
import { Textarea } from "../components/ui/textarea";
import { Slider } from "../components/ui/slider";
import { MultiSelect } from "../components/ui/multi-select";
import { toPersianDigits, toWesternDigits } from "../lib/utils";
import { toast } from "sonner";
import { translateServerError } from "../lib/error-translations";
import { IRANIAN_PROVINCES_CITIES } from "../data/iranian-provinces-cities";
import { CONTINENTS_COUNTRIES } from "../data/continents-countries";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/prime.css";

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
  type:
    | "text"
    | "textarea"
    | "number"
    | "date"
    | "select"
    | "radio"
    | "checkbox"
    | "file"
    | "province_city"
    | "continent_country"
    | "range";
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validations?: Record<string, any>;
  fileConfig?: FileConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue?: any;
  multiple?: boolean;
  condition?: FieldCondition;
}

interface FormSchema {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  fields: FieldDefinition[];
  show_notification: boolean;
  notification_title: string | null;
  notification_text: string | null;
}

function buildSchema(schema: FormSchema) {
  const shape: Record<string, z.ZodTypeAny> = {};

  const requiredMsg = "این فیلد الزامی است";

  for (const field of schema.fields) {
    let fieldSchema: z.ZodTypeAny;
    const isConditional = !!field.condition;
    const isRequired = field.required && !isConditional;

    switch (field.type) {
      case "number":
        if (isRequired) {
          fieldSchema = z.coerce.number(requiredMsg);
        } else {
          fieldSchema = z.coerce.number().optional();
        }
        break;
      case "checkbox":
        if (isRequired) {
          fieldSchema = z.array(z.string()).min(1, requiredMsg);
        } else {
          fieldSchema = z.array(z.string()).optional();
        }
        break;
      case "date":
        if (isRequired) {
          fieldSchema = z.string(requiredMsg).min(1, requiredMsg);
        } else {
          fieldSchema = z.string().optional();
        }
        break;
      case "range":
        if (isRequired) {
          fieldSchema = z.coerce
            .number(requiredMsg)
            .min(
              field.validations?.min ?? 0,
              `حداقل مقدار ${field.validations?.min ?? 0} است`,
            )
            .max(
              field.validations?.max ?? 10,
              `حداکثر مقدار ${field.validations?.max ?? 10} است`,
            );
        } else {
          fieldSchema = z.coerce.number().optional();
        }
        break;
      case "select":
        if (field.multiple) {
          if (isRequired) {
            fieldSchema = z.array(z.string()).min(1, requiredMsg);
          } else {
            fieldSchema = z.array(z.string()).optional();
          }
        } else {
          if (isRequired) {
            fieldSchema = z.string(requiredMsg).min(1, requiredMsg);
          } else {
            fieldSchema = z.string().optional();
          }
        }
        break;
      case "province_city":
        fieldSchema = z.object({
          province: z.string("استان الزامی است").min(1, "استان الزامی است"),
          city: z.string("شهر الزامی است").min(1, "شهر الزامی است"),
        });
        if (!isRequired) fieldSchema = fieldSchema.optional();
        break;
      case "continent_country":
        fieldSchema = z.object({
          continent: z.string("قاره الزامی است").min(1, "قاره الزامی است"),
          country: z.string("کشور الزامی است").min(1, "کشور الزامی است"),
        });
        if (!isRequired) fieldSchema = fieldSchema.optional();
        break;
      case "file":
        if (isRequired) {
          fieldSchema = z.string(requiredMsg).min(1, requiredMsg);
        } else {
          fieldSchema = z.string().optional();
        }
        break;
      default:
        if (isRequired) {
          fieldSchema = z.string(requiredMsg).min(1, requiredMsg);
        } else {
          fieldSchema = z.string().optional();
        }
    }

    shape[field.name] = fieldSchema;
  }

  return z.object(shape);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynamicFormData = Record<string, any>;

export function FormPage() {
  const { formSlug } = useParams<{ formSlug: string }>();
  const navigate = useNavigate();
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>(
    {},
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DynamicFormData>({
    resolver: schema ? zodResolver(buildSchema(schema)) : undefined,
    mode: "onChange",
  });

  const formValues = watch();

  const handleFileUpload = async (
    fieldName: string,
    file: File,
    fileConfig?: FileConfig,
  ) => {
    setUploadingFiles((prev) => ({ ...prev, [fieldName]: true }));
    try {
      const result = await formsApi.uploadFile(
        file,
        fileConfig?.accept,
        fileConfig?.maxSize,
      );
      setValue(fieldName, result.url);
      toast.success(`فایل "${file.name}" با موفقیت بارگذاری شد`);
    } catch (err: unknown) {
      toast.error(translateServerError(err) || "خطا در بارگذاری فایل");
      setValue(fieldName, "");
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [fieldName]: false }));
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await formsApi.getSchemaBySlug(formSlug!);
        if (!cancelled) {
          setSchema(data);
          reset(data.default_values || {});
        }
      } catch {
        if (!cancelled) setSchema(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [formSlug, reset]);

  async function onSubmit(data: DynamicFormData) {
    setSubmitting(true);
    try {
      await formsApi.submitForm(formSlug!, data);
      setSubmitted(true);
      toast.success("فرم با موفقیت ارسال شد");
    } catch (err: unknown) {
      toast.error(translateServerError(err) || "خطا در ارسال فرم");
    } finally {
      setSubmitting(false);
    }
  }

  function handleRefillForm() {
    setSubmitted(false);
    reset();
    toast.info("فرم جدید آماده تکمیل است", { title: "پر کردن مجدد فرم" });
  }

  function isFieldVisible(field: FieldDefinition): boolean {
    if (!field.condition) return true;
    const depValue = formValues[field.condition.field];
    switch (field.condition.operator) {
      case "equals":
        return depValue === field.condition.value;
      case "not_equals":
        return depValue !== field.condition.value;
      case "not_empty":
        return depValue !== undefined && depValue !== null && depValue !== "";
      default:
        return true;
    }
  }

  function renderField(field: FieldDefinition) {
    const value = formValues[field.name];

    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            {...register(field.name)}
            placeholder={field.placeholder}
            rows={4}
          />
        );

      case "select":
        if (field.multiple) {
          return (
            <MultiSelect
              options={field.options}
              selected={Array.isArray(value) ? value : []}
              onChange={(selected) => setValue(field.name, selected)}
              placeholder={field.placeholder}
            />
          );
        }
        return (
          <Select
            value={value || ""}
            onValueChange={(v) => setValue(field.name, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "radio":
        return (
          <RadioGroup
            dir="rtl"
            value={value || ""}
            onValueChange={(v) => setValue(field.name, v)}
            className="flex gap-4 pt-2"
          >
            {field.options?.map((opt) => (
              <div key={opt.value} className="flex items-center gap-2">
                <RadioGroupItem
                  value={opt.value}
                  id={`${field.name}-${opt.value}`}
                />
                <Label
                  htmlFor={`${field.name}-${opt.value}`}
                  className="cursor-pointer"
                >
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "checkbox":
        return (
          <div className="space-y-2 pt-2">
            {field.options?.map((opt) => {
              const checked = Array.isArray(value) && value.includes(opt.value);
              return (
                <div key={opt.value} className="flex items-center gap-2 py-1">
                  <Checkbox
                    id={`${field.name}-${opt.value}`}
                    checked={checked}
                    onCheckedChange={() => {
                      const current = Array.isArray(value) ? [...value] : [];
                      if (checked) {
                        setValue(
                          field.name,
                          current.filter((v: string) => v !== opt.value),
                        );
                      } else {
                        setValue(field.name, [...current, opt.value]);
                      }
                    }}
                  />
                  <Label
                    htmlFor={`${field.name}-${opt.value}`}
                    className="cursor-pointer"
                  >
                    {opt.label}
                  </Label>
                </div>
              );
            })}
          </div>
        );

      case "number":
        return (
          <Input
            type="number"
            {...register(field.name, { valueAsNumber: true })}
            placeholder={field.placeholder}
          />
        );

      case "range": {
        const min = field.validations?.min ?? 0;
        const max = field.validations?.max ?? 10;
        const step = field.validations?.step ?? 1;
        const current = value ?? min;
        return (
          <div className="space-y-3 pt-2">
            <Slider
              dir="rtl"
              value={[current]}
              onValueChange={([v]) => setValue(field.name, v)}
              min={min}
              max={max}
              step={step}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{toPersianDigits(min)}</span>
              <span className="font-medium text-foreground">
                {toPersianDigits(current)}
              </span>
              <span>{toPersianDigits(max)}</span>
            </div>
          </div>
        );
      }

      case "province_city": {
        const provinceVal = value?.province || "";
        const cityVal = value?.city || "";
        const selectedProvince = IRANIAN_PROVINCES_CITIES.find(
          (p) => p.value === provinceVal,
        );
        const cities = selectedProvince?.cities || [];

        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>استان</Label>
              <Select
                dir="rtl"
                value={provinceVal}
                onValueChange={(v) =>
                  setValue(field.name, { province: v, city: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="استان را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  {IRANIAN_PROVINCES_CITIES.map((province) => (
                    <SelectItem key={province.value} value={province.value}>
                      {province.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>شهر</Label>
              <Select
                dir="rtl"
                value={cityVal}
                onValueChange={(v) =>
                  setValue(field.name, { province: provinceVal, city: v })
                }
                disabled={!provinceVal}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      provinceVal
                        ? "شهر را انتخاب کنید"
                        : "ابتدا استان را انتخاب کنید"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.value} value={city.value}>
                      {city.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      }

      case "continent_country": {
        const continentVal = value?.continent || "";
        const countryVal = value?.country || "";
        const selectedContinent = CONTINENTS_COUNTRIES.find(
          (c) => c.value === continentVal,
        );
        const countries = selectedContinent?.countries || [];

        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>قاره</Label>
              <Select
                dir="rtl"
                value={continentVal}
                onValueChange={(v) =>
                  setValue(field.name, { continent: v, country: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="قاره را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  {CONTINENTS_COUNTRIES.map((continent) => (
                    <SelectItem key={continent.value} value={continent.value}>
                      {continent.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>کشور</Label>
              <Select
                dir="rtl"
                value={countryVal}
                onValueChange={(v) =>
                  setValue(field.name, { continent: continentVal, country: v })
                }
                disabled={!continentVal}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      continentVal
                        ? "کشور را انتخاب کنید"
                        : "ابتدا قاره را انتخاب کنید"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      }

      case "file":
        return (
          <div className="space-y-2">
            <Input
              type="file"
              accept={field.fileConfig?.accept || undefined}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(field.name, file, field.fileConfig);
                }
              }}
            />
            {uploadingFiles[field.name] && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال بارگذاری...
              </div>
            )}
            {value && !uploadingFiles[field.name] && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>فایل بارگذاری شد</span>
              </div>
            )}
          </div>
        );

      case "date":
        return (
          <DatePicker
            calendar={persian}
            locale={persian_fa}
            value={(value as string) || null}
            onChange={(date) => {
              setValue(
                field.name,
                date ? toWesternDigits(date.format("YYYY/MM/DD")) : "",
              );
            }}
            placeholder={field.placeholder || "تاریخ را انتخاب کنید"}
            inputClass="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            containerClassName="w-full"
            calendarPosition="bottom-right"
            format="YYYY/MM/DD"
          />
        );

      default:
        return (
          <Input
            type="text"
            {...register(field.name)}
            placeholder={field.placeholder}
          />
        );
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">فرم مورد نظر یافت نشد</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (
    submitted &&
    schema.show_notification &&
    (schema.notification_title || schema.notification_text)
  ) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6 text-center space-y-6">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
            {schema.notification_title && (
              <h2 className="text-xl font-bold">{schema.notification_title}</h2>
            )}
            {schema.notification_text && (
              <p className="text-muted-foreground whitespace-pre-line">
                {schema.notification_text}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <Button onClick={handleRefillForm}>
                <RefreshCw className="h-4 w-4 ml-1" />
                پر کردن مجدد فرم
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                <ArrowRight className="h-4 w-4 ml-1" />
                بازگشت به داشبورد
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6 text-center space-y-6">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
            <h2 className="text-xl font-bold">فرم با موفقیت ارسال شد</h2>
            <p className="text-muted-foreground">
              پاسخ‌های شما با موفقیت ثبت شد
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleRefillForm}>
                <RefreshCw className="h-4 w-4 ml-1" />
                پر کردن مجدد فرم
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                <ArrowRight className="h-4 w-4 ml-1" />
                بازگشت به داشبورد
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{schema.title}</CardTitle>
          {schema.description && (
            <CardDescription>{schema.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {schema.fields.map((field) =>
              isFieldVisible(field) ? (
                <div key={field.name} className="space-y-2">
                  <Label>
                    {field.label}
                    {field.required && (
                      <span className="text-destructive mr-1">*</span>
                    )}
                  </Label>
                  {renderField(field)}
                  {errors[field.name] && (
                    <p className="text-sm text-destructive">
                      {errors[field.name]?.message as string}
                    </p>
                  )}
                </div>
              ) : null,
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                )}
                ارسال فرم
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
              >
                انصراف
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
