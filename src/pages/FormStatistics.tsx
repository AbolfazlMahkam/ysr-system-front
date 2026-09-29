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
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  PieChart,
  ChartColumnDecreasing,
  Send,
  Table2,
  MapPin,
  ArrowRight,
  Globe,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import adminFormsApi from "../api/admin-forms";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { toast } from "sonner";
import { translateServerError } from "../lib/error-translations";
import { toPersianDigits } from "@/lib/utils";
import { IRANIAN_PROVINCES_CITIES } from "@/data/iranian-provinces-cities";
import { CONTINENTS_COUNTRIES } from "@/data/continents-countries";

interface FieldOption {
  label: string;
  value: string;
  count: number;
}

interface FieldStat {
  name: string;
  label: string;
  type: string;
  total: number;
  options: FieldOption[];
  provinceCity?: {
    provinceCounts: FieldOption[];
    cityCounts: Record<string, FieldOption[]>;
  };
  continentCountry?: {
    continentCounts: FieldOption[];
    countryCounts: Record<string, FieldOption[]>;
  };
}

interface FormSchema {
  id: number;
  slug: string;
  title: string;
}

interface StatisticsData {
  form: FormSchema;
  fields: FieldStat[];
  totalSubmissions: number;
}

const COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#14b8a6",
  "#64748b",
  "#84cc16",
  "#3b82f6",
  "#d946ef",
  "#0ea5e9",
  "#a855f7",
];

type ChartMode = "bar" | "pie";

export function FormStatistics() {
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loadingForms, setLoadingForms] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [chartModes, setChartModes] = useState<Record<string, ChartMode>>({});
  const [selectedProvince, setSelectedProvince] = useState<
    Record<string, string>
  >({});
  const [selectedContinent, setSelectedContinent] = useState<
    Record<string, string>
  >({});

  const getProvinceLabel = (value: string) =>
    IRANIAN_PROVINCES_CITIES.find((p) => p.value === value)?.label || value;

  const getCityLabel = (provinceValue: string, cityValue: string) =>
    IRANIAN_PROVINCES_CITIES.find(
      (p) => p.value === provinceValue,
    )?.cities.find((c) => c.value === cityValue)?.label || cityValue;

  const getContinentLabel = (value: string) =>
    CONTINENTS_COUNTRIES.find((c) => c.value === value)?.label || value;

  const getCountryLabel = (continentValue: string, countryValue: string) =>
    CONTINENTS_COUNTRIES.find(
      (c) => c.value === continentValue,
    )?.countries.find((co) => co.value === countryValue)?.label || countryValue;

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

  const fetchStats = async (formId: number) => {
    try {
      setLoadingStats(true);
      const data = await adminFormsApi.getStatistics(formId);
      setStats(data);
      const modes: Record<string, ChartMode> = {};
      (data.fields || []).forEach((f: FieldStat) => {
        modes[f.name] = "bar";
      });
      setChartModes(modes);
    } catch (err: unknown) {
      toast.error(translateServerError(err) || "خطا در دریافت آمار");
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleFormChange = (value: string) => {
    setSelectedFormId(value);
    if (value) {
      fetchStats(Number(value));
    } else {
      setStats(null);
    }
  };

  const toggleChartMode = (fieldName: string) => {
    setChartModes((prev) => ({
      ...prev,
      [fieldName]: prev[fieldName] === "bar" ? "pie" : "bar",
    }));
  };

  function renderProvinceCityChart(field: FieldStat) {
    const mode = chartModes[field.name] || "bar";
    const activeProvince = selectedProvince[field.name];

    if (activeProvince) {
      const cities = field.provinceCity!.cityCounts[activeProvince] || [];
      const chartData = cities.map((c) => ({
        name: getCityLabel(activeProvince, c.value),
        value: c.count,
      }));
      const hasData = chartData.some((d) => d.value > 0);

      return (
        <Card
          key={field.name}
          className="overflow-hidden group border-t-2 border-t-emerald-500/20 hover:border-t-emerald-500/40 transition-all duration-300 xl:col-span-2"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() =>
                      setSelectedProvince((prev) => ({
                        ...prev,
                        [field.name]: "",
                      }))
                    }
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-base">
                    {field.label} - {getProvinceLabel(activeProvince)}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2 flex-wrap mr-9">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-500">
                    شهرها
                  </span>
                  <span className="text-xs text-muted-foreground">
                    از {toPersianDigits(field.total)} پاسخ
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleChartMode(field.name)}
                className="gap-1.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity border-muted-foreground/20 hover:border-emerald-500/40"
              >
                {mode === "bar" ? (
                  <>
                    <PieChart className="h-3.5 w-3.5" />
                    <span className="text-xs">دایره‌ای</span>
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span className="text-xs">میله‌ای</span>
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!hasData ? (
              <div className="py-10 text-center">
                <MapPin className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground/60">
                  داده‌ای برای شهرهای این استان وجود ندارد
                </p>
              </div>
            ) : mode === "bar" ? (
              <div className="w-full" dir="ltr">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      angle={-15}
                      textAnchor="end"
                      height={50}
                      tickMargin={8}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid rgba(16,185,129,0.2)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                        backdropFilter: "blur(8px)",
                      }}
                      cursor={{ fill: "rgba(16,185,129,0.05)" }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {chartData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                          className="hover:opacity-80 transition-opacity"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="w-full" dir="ltr">
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={36}
                      paddingAngle={3}
                      cornerRadius={4}
                    >
                      {chartData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid rgba(16,185,129,0.2)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                        backdropFilter: "blur(8px)",
                      }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span className="text-xs">{value}</span>
                      )}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            )}

            {hasData && (
              <div className="mt-4 pt-3 border-t border-muted/50">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {chartData
                    .filter((d) => d.value > 0)
                    .map((d, i) => (
                      <div
                        key={d.name}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: COLORS[i % COLORS.length],
                          }}
                        />
                        <span className="truncate text-muted-foreground">
                          {d.name}
                        </span>
                        <span className="font-medium mr-auto">
                          {toPersianDigits(d.value)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    const provinceData = field.provinceCity!.provinceCounts;
    const chartData = provinceData
      .map((p) => ({
        name: getProvinceLabel(p.value),
        value: p.count,
        rawValue: p.value,
      }))
      .filter((d) => d.value > 0);
    const hasData = chartData.length > 0;

    return (
      <Card
        key={field.name}
        className="overflow-hidden group border-t-2 border-t-emerald-500/20 hover:border-t-emerald-500/40 transition-all duration-300 xl:col-span-2"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base">{field.label}</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-500">
                  استان‌ها
                </span>
                <span className="text-xs text-muted-foreground">
                  از {toPersianDigits(field.total)} پاسخ
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleChartMode(field.name)}
              className="gap-1.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity border-muted-foreground/20 hover:border-emerald-500/40"
            >
              {mode === "bar" ? (
                <>
                  <PieChart className="h-3.5 w-3.5" />
                  <span className="text-xs">دایره‌ای</span>
                </>
              ) : (
                <>
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span className="text-xs">میله‌ای</span>
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <div className="py-10 text-center">
              <MapPin className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground/60">
                داده‌ای برای نمایش وجود ندارد
              </p>
            </div>
          ) : mode === "bar" ? (
            <div className="w-full" dir="ltr">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    angle={-35}
                    textAnchor="end"
                    height={70}
                    tickMargin={8}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid rgba(16,185,129,0.2)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                      backdropFilter: "blur(8px)",
                    }}
                    cursor={{ fill: "rgba(16,185,129,0.05)" }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                    onClick={(data) => {
                      if (data?.rawValue) {
                        setSelectedProvince((prev) => ({
                          ...prev,
                          [field.name]: data.rawValue as string,
                        }));
                      }
                    }}
                    className="cursor-pointer"
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="w-full" dir="ltr">
              <ResponsiveContainer width="100%" height={340}>
                <RechartsPieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={40}
                    paddingAngle={2}
                    cornerRadius={4}
                    onClick={(_, index) => {
                      const item = chartData[index];
                      if (item?.rawValue) {
                        setSelectedProvince((prev) => ({
                          ...prev,
                          [field.name]: item.rawValue as string,
                        }));
                      }
                    }}
                    className="cursor-pointer"
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                        stroke="transparent"
                        className="cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid rgba(16,185,129,0.2)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                      backdropFilter: "blur(8px)",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="text-xs">{value}</span>
                    )}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          )}

          {hasData && (
            <div className="mt-4 pt-3 border-t border-muted/50">
              <p className="text-xs text-muted-foreground mb-2">
                روی هر استان کلیک کنید تا آمار شهرها نمایش داده شود
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {chartData.map((d, i) => (
                  <button
                    key={d.name}
                    onClick={() =>
                      setSelectedProvince((prev) => ({
                        ...prev,
                        [field.name]: d.rawValue as string,
                      }))
                    }
                    className="flex items-center gap-2 text-xs hover:bg-muted/50 rounded-md p-1 -m-1 transition-colors"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: COLORS[i % COLORS.length],
                      }}
                    />
                    <span className="truncate text-muted-foreground">
                      {d.name}
                    </span>
                    <span className="font-medium mr-auto">
                      {toPersianDigits(d.value)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  function renderContinentCountryChart(field: FieldStat) {
    const mode = chartModes[field.name] || "bar";
    const activeContinent = selectedContinent[field.name];

    if (activeContinent) {
      const countries =
        field.continentCountry!.countryCounts[activeContinent] || [];
      const chartData = countries.map((c) => ({
        name: getCountryLabel(activeContinent, c.value),
        value: c.count,
      }));
      const hasData = chartData.some((d) => d.value > 0);

      return (
        <Card
          key={field.name}
          className="overflow-hidden group border-t-2 border-t-violet-500/20 hover:border-t-violet-500/40 transition-all duration-300 xl:col-span-2"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() =>
                      setSelectedContinent((prev) => ({
                        ...prev,
                        [field.name]: "",
                      }))
                    }
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-base">
                    {field.label} - {getContinentLabel(activeContinent)}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2 flex-wrap mr-9">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-500/10 text-violet-500">
                    کشورها
                  </span>
                  <span className="text-xs text-muted-foreground">
                    از {toPersianDigits(field.total)} پاسخ
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleChartMode(field.name)}
                className="gap-1.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity border-muted-foreground/20 hover:border-violet-500/40"
              >
                {mode === "bar" ? (
                  <>
                    <PieChart className="h-3.5 w-3.5" />
                    <span className="text-xs">دایره‌ای</span>
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span className="text-xs">میله‌ای</span>
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!hasData ? (
              <div className="py-10 text-center">
                <Globe className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground/60">
                  داده‌ای برای کشورهای این قاره وجود ندارد
                </p>
              </div>
            ) : mode === "bar" ? (
              <div className="w-full" dir="ltr">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      angle={-15}
                      textAnchor="end"
                      height={50}
                      tickMargin={8}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid rgba(139,92,246,0.2)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                        backdropFilter: "blur(8px)",
                      }}
                      cursor={{ fill: "rgba(139,92,246,0.05)" }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {chartData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                          className="hover:opacity-80 transition-opacity"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="w-full" dir="ltr">
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={36}
                      paddingAngle={3}
                      cornerRadius={4}
                    >
                      {chartData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid rgba(139,92,246,0.2)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                        backdropFilter: "blur(8px)",
                      }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span className="text-xs">{value}</span>
                      )}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            )}

            {hasData && (
              <div className="mt-4 pt-3 border-t border-muted/50">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {chartData
                    .filter((d) => d.value > 0)
                    .map((d, i) => (
                      <div
                        key={d.name}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: COLORS[i % COLORS.length],
                          }}
                        />
                        <span className="truncate text-muted-foreground">
                          {d.name}
                        </span>
                        <span className="font-medium mr-auto">
                          {toPersianDigits(d.value)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    const continentData = field.continentCountry!.continentCounts;
    const chartData = continentData
      .map((c) => ({
        name: getContinentLabel(c.value),
        value: c.count,
        rawValue: c.value,
      }))
      .filter((d) => d.value > 0);
    const hasData = chartData.length > 0;

    return (
      <Card
        key={field.name}
        className="overflow-hidden group border-t-2 border-t-violet-500/20 hover:border-t-violet-500/40 transition-all duration-300 xl:col-span-2"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base">{field.label}</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-500/10 text-violet-500">
                  قاره‌ها
                </span>
                <span className="text-xs text-muted-foreground">
                  از {toPersianDigits(field.total)} پاسخ
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleChartMode(field.name)}
              className="gap-1.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity border-muted-foreground/20 hover:border-violet-500/40"
            >
              {mode === "bar" ? (
                <>
                  <PieChart className="h-3.5 w-3.5" />
                  <span className="text-xs">دایره‌ای</span>
                </>
              ) : (
                <>
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span className="text-xs">میله‌ای</span>
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <div className="py-10 text-center">
              <Globe className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground/60">
                داده‌ای برای نمایش وجود ندارد
              </p>
            </div>
          ) : mode === "bar" ? (
            <div className="w-full" dir="ltr">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    angle={-35}
                    textAnchor="end"
                    height={70}
                    tickMargin={8}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid rgba(139,92,246,0.2)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                      backdropFilter: "blur(8px)",
                    }}
                    cursor={{ fill: "rgba(139,92,246,0.05)" }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                    onClick={(data) => {
                      if (data?.rawValue) {
                        setSelectedContinent((prev) => ({
                          ...prev,
                          [field.name]: data.rawValue as string,
                        }));
                      }
                    }}
                    className="cursor-pointer"
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="w-full" dir="ltr">
              <ResponsiveContainer width="100%" height={340}>
                <RechartsPieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={40}
                    paddingAngle={2}
                    cornerRadius={4}
                    onClick={(_, index) => {
                      const item = chartData[index];
                      if (item?.rawValue) {
                        setSelectedContinent((prev) => ({
                          ...prev,
                          [field.name]: item.rawValue as string,
                        }));
                      }
                    }}
                    className="cursor-pointer"
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                        stroke="transparent"
                        className="cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid rgba(139,92,246,0.2)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                      backdropFilter: "blur(8px)",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="text-xs">{value}</span>
                    )}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          )}

          {hasData && (
            <div className="mt-4 pt-3 border-t border-muted/50">
              <p className="text-xs text-muted-foreground mb-2">
                روی هر قاره کلیک کنید تا آمار کشورها نمایش داده شود
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {chartData.map((d, i) => (
                  <button
                    key={d.name}
                    onClick={() =>
                      setSelectedContinent((prev) => ({
                        ...prev,
                        [field.name]: d.rawValue as string,
                      }))
                    }
                    className="flex items-center gap-2 text-xs hover:bg-muted/50 rounded-md p-1 -m-1 transition-colors"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: COLORS[i % COLORS.length],
                      }}
                    />
                    <span className="truncate text-muted-foreground">
                      {d.name}
                    </span>
                    <span className="font-medium mr-auto">
                      {toPersianDigits(d.value)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const selectedFormTitle = forms.find(
    (f) => String(f.id) === selectedFormId,
  )?.title;

  return (
    <div className="p-6 space-y-6">
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-indigo-500/10 via-background to-amber-500/5 p-8 glass">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-amber-500 rounded-r-full" />
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
            <ChartColumnDecreasing className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">آمار فرم‌ها</h1>
            <p className="text-sm text-muted-foreground">
              تحلیل و بصری‌سازی داده‌های فیلدهای انتخابی، رادیویی و چک‌باکس
            </p>
          </div>
        </div>
        <div className="mt-6">
          <Select value={selectedFormId} onValueChange={handleFormChange}>
            <SelectTrigger className="w-full max-w-xs bg-background/80 backdrop-blur-sm border-indigo-200 dark:border-indigo-800">
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
      </div>

      {loadingStats && (
        <div className="flex justify-center items-center py-24">
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner size={40} />
            <p className="text-sm text-muted-foreground">
              در حال محاسبه آمار...
            </p>
          </div>
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 p-5 glass-smoked">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <Table2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">فرم</p>
                  <p className="font-semibold truncate max-w-[160px]">
                    {selectedFormTitle}
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
                    {toPersianDigits(stats.totalSubmissions)}
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-5 glass-smoked">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">فیلدهای آماری</p>
                  <p className="text-2xl font-bold">
                    {toPersianDigits(stats.fields.length)}
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-rose-500/10 to-rose-500/5 p-5 glass-smoked">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-500">
                  <PieChart className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">نمودارها</p>
                  <p className="text-2xl font-bold">
                    {toPersianDigits(stats.fields.length)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {stats.fields.length === 0 && (
            <div className="rounded-xl border border-dashed p-12 text-center glass-smoked">
              <ChartColumnDecreasing className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">
                این فرم فیلدهای آماری (انتخابی، رادیویی، چک‌باکس، استان و شهر،
                قاره و کشور) ندارد
              </p>
            </div>
          )}

          {stats.fields.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {stats.fields.map((field) => {
                if (field.type === "province_city" && field.provinceCity) {
                  return renderProvinceCityChart(field);
                }
                if (
                  field.type === "continent_country" &&
                  field.continentCountry
                ) {
                  return renderContinentCountryChart(field);
                }

                const mode = chartModes[field.name] || "bar";
                const chartData = field.options.map((opt) => ({
                  name: opt.label,
                  value: opt.count,
                  label: opt.label,
                }));

                const hasData = chartData.some((d) => d.value > 0);
                const typeLabel =
                  field.type === "checkbox"
                    ? "چندگزینشی"
                    : field.type === "radio"
                      ? "تک‌گزینی"
                      : "منوی انتخابی";

                return (
                  <Card
                    key={field.name}
                    className="overflow-hidden group border-t-2 border-t-indigo-500/20 hover:border-t-indigo-500/40 transition-all duration-300"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="text-base">
                            {field.label}
                          </CardTitle>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-500">
                              {typeLabel}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              از {toPersianDigits(field.total)} پاسخ
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleChartMode(field.name)}
                          className="gap-1.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity border-muted-foreground/20 hover:border-indigo-500/40"
                        >
                          {mode === "bar" ? (
                            <>
                              <PieChart className="h-3.5 w-3.5" />
                              <span className="text-xs">دایره‌ای</span>
                            </>
                          ) : (
                            <>
                              <BarChart3 className="h-3.5 w-3.5" />
                              <span className="text-xs">میله‌ای</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {!hasData ? (
                        <div className="py-10 text-center">
                          <PieChart className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                          <p className="text-sm text-muted-foreground/60">
                            داده‌ای برای نمایش وجود ندارد
                          </p>
                        </div>
                      ) : mode === "bar" ? (
                        <div className="w-full" dir="ltr">
                          <ResponsiveContainer width="100%" height={280}>
                            <BarChart
                              data={chartData}
                              margin={{
                                top: 10,
                                right: 10,
                                left: 0,
                                bottom: 20,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                opacity={0.15}
                              />
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11 }}
                                angle={-15}
                                textAnchor="end"
                                height={50}
                                tickMargin={8}
                              />
                              <YAxis
                                allowDecimals={false}
                                tick={{ fontSize: 11 }}
                              />
                              <Tooltip
                                contentStyle={{
                                  borderRadius: "10px",
                                  border: "1px solid rgba(99,102,241,0.2)",
                                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                                  backdropFilter: "blur(8px)",
                                }}
                                cursor={{ fill: "rgba(99,102,241,0.05)" }}
                              />
                              <Bar
                                dataKey="value"
                                radius={[6, 6, 0, 0]}
                                maxBarSize={48}
                              >
                                {chartData.map((_, index) => (
                                  <Cell
                                    key={index}
                                    fill={COLORS[index % COLORS.length]}
                                    className="hover:opacity-80 transition-opacity"
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="w-full" dir="ltr">
                          <ResponsiveContainer width="100%" height={300}>
                            <RechartsPieChart>
                              <Pie
                                data={chartData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={90}
                                innerRadius={36}
                                paddingAngle={3}
                                cornerRadius={4}
                              >
                                {chartData.map((_, index) => (
                                  <Cell
                                    key={index}
                                    fill={COLORS[index % COLORS.length]}
                                    stroke="transparent"
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  borderRadius: "10px",
                                  border: "1px solid rgba(99,102,241,0.2)",
                                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                                  backdropFilter: "blur(8px)",
                                }}
                              />
                              <Legend
                                iconType="circle"
                                iconSize={8}
                                formatter={(value) => (
                                  <span className="text-xs">{value}</span>
                                )}
                              />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {hasData && (
                        <div className="mt-4 pt-3 border-t border-muted/50">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {chartData
                              .filter((d) => d.value > 0)
                              .map((d, i) => (
                                <div
                                  key={d.name}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{
                                      backgroundColor:
                                        COLORS[i % COLORS.length],
                                    }}
                                  />
                                  <span className="truncate text-muted-foreground">
                                    {d.name}
                                  </span>
                                  <span className="font-medium mr-auto">
                                    {toPersianDigits(d.value)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {!loadingStats && selectedFormId && !stats && (
        <div className="rounded-xl border border-dashed p-16 text-center glass-smoked">
          <Send className="h-14 w-14 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium mb-1">هیچ ارسالی وجود ندارد</h3>
          <p className="text-sm text-muted-foreground">
            برای این فرم هنوز ارسالی ثبت نشده است
          </p>
        </div>
      )}
    </div>
  );
}

export default FormStatistics;
