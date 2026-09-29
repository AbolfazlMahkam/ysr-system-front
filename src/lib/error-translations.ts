const errorTranslations: Record<string, string> = {
  "Invalid Google token": "توکن گوگل نامعتبر است",
  "Google authentication failed": "احراز هویت گوگل ناموفق بود",
  "Token has expired": "توکن منقضی شده است",
  "Invalid token": "توکن نامعتبر است",
  "Unauthorized access": "دسترسی غیرمجاز",
  "Access denied: User role not found": "دسترسی رد شد: نقش کاربر یافت نشد",
  "Invalid user ID": "شناسه کاربر نامعتبر است",
  "User not found": "کاربر یافت نشد",
  "Phone number already exists": "شماره تلفن قبلاً ثبت شده است",
  "Wrong Password": "رمز عبور اشتباه است",
  "code is not valid": "کد نامعتبر است",
  "Form not found": "فرم یافت نشد",
  "Submission not found": "ارسال یافت نشد",
  "Self-declaration form has already been submitted":
    "اظهارنامه قبلاً ارسال شده است",
  "Self-declaration form schema is not configured":
    "فرم اظهارنامه پیکربندی نشده است",
  "Self-declaration form not submitted yet": "اظهارنامه هنوز ارسال نشده است",
  "Self-declaration submission not found": "ارسال اظهارنامه یافت نشد",
  "Submission is already approved": "ارسال قبلاً تأیید شده است",
  "Admin notes are required when returning for correction":
    "یادداشت مدیر برای بازگشت برای اصلاح الزامی است",
  "At least one field must be selected for correction":
    "حداقل یک فیلد باید برای اصلاح انتخاب شود",
  "No file provided": "هیچ فایلی ارائه نشده است",
  "User successfully deleted": "کاربر با موفقیت حذف شد",
  "Your account does not meet the requirements and you are not allowed to perform any action":
    "حساب شما شرایط لازم را احراز نکرده است و امکان انجام هیچ‌گونه اقدامی برای شما وجود ندارد",
  "Your account does not meet the requirements and you are not allowed to resubmit the self-declaration form":
    "حساب شما شرایط لازم را احراز نکرده است و امکان ارسال مجدد اظهارنامه برای شما وجود ندارد",
  "This user does not meet the requirements and the self-declaration cannot be approved":
    "این کاربر شرایط لازم را احراز نکرده است و امکان تأیید اظهارنامه او وجود ندارد",
};

function translateDynamicMessage(message: string): string {
  if (message.endsWith(" is required")) {
    return message.replace(/ "(.+)" is required$/, ' "$1" الزامی است');
  }
  if (message.endsWith(" must be a string")) {
    return message.replace(/ "(.+)" must be a string$/, ' "$1" باید متن باشد');
  }
  if (message.endsWith(" must be a number")) {
    return message.replace(/ "(.+)" must be a number$/, ' "$1" باید عدد باشد');
  }
  if (message.includes("must be a valid date")) {
    return message.replace(
      / "(.+)" must be a valid date \(YYYY\/MM\/DD\)/,
      ' "$1" باید تاریخ معتبر باشد (YYYY/MM/DD)',
    );
  }
  if (message.endsWith(" must be an array")) {
    return message.replace(
      / "(.+)" must be an array$/,
      ' "$1" باید آرایه باشد',
    );
  }
  if (message.includes("contains invalid value")) {
    return message.replace(
      / "(.+)" contains invalid value "(.+)". Valid options: (.+)/,
      ' "$1" حاوی مقدار نامعتبر "$2" است. گزینه‌های معتبر: $3',
    );
  }
  if (message.endsWith(" must be one of:")) {
    return message.replace(
      / "(.+)" must be one of: (.+)/,
      ' "$1" باید یکی از: $2 باشد',
    );
  }
  if (message.endsWith(" must be a valid file URL")) {
    return message.replace(
      / "(.+)" must be a valid file URL$/,
      ' "$1" باید آدرس فایل معتبر باشد',
    );
  }
  if (message.includes("must be at least") && message.includes("characters")) {
    return message.replace(
      / "(.+)" must be at least (\d+) characters/,
      ' "$1" باید حداقل $2 کاراکتر باشد',
    );
  }
  if (message.includes("must be at most") && message.includes("characters")) {
    return message.replace(
      / "(.+)" must be at most (\d+) characters/,
      ' "$1" باید حداکثر $2 کاراکتر باشد',
    );
  }
  if (message.includes("does not match the required pattern")) {
    return message.replace(
      / "(.+)" does not match the required pattern/,
      ' "$1" با الگوی مورد نظر مطابقت ندارد',
    );
  }
  if (message.includes("must be at least") && !message.includes("characters")) {
    return message.replace(
      / "(.+)" must be at least (\d+)/,
      ' "$1" باید حداقل $2 باشد',
    );
  }
  if (message.includes("must be at most") && !message.includes("characters")) {
    return message.replace(
      / "(.+)" must be at most (\d+)/,
      ' "$1" باید حداکثر $2 باشد',
    );
  }
  if (message.startsWith("File type") && message.includes("is not allowed")) {
    return message.replace(
      /File type "(.+)" is not allowed/,
      'نوع فایل "$1" مجاز نیست',
    );
  }
  if (
    message.includes("MIME type") &&
    message.includes("does not match extension")
  ) {
    return message.replace(
      /MIME type "(.+)" does not match extension "(.+)"/,
      'نوع MIME "$1" با پسوند "$2" مطابقت ندارد',
    );
  }
  if (
    message.includes("File type") &&
    message.includes("not in the accepted types")
  ) {
    return message.replace(
      /File type "(.+)" is not in the accepted types: (.+)/,
      'نوع فایل "$1" در انواع مجاز نیست: $2',
    );
  }
  if (message.includes("File size exceeds")) {
    return message.replace(
      /File size exceeds the maximum allowed size of (\d+)MB/,
      "حجم فایل از حداکثر مجاز $1 مگابایت بیشتر است",
    );
  }
  if (message.startsWith("Phone must start with +98")) {
    return "شماره تلفن باید با +98 شروع شود (مثال: +989123456789)";
  }
  if (
    message.startsWith("Form with slug") &&
    message.includes("already exists")
  ) {
    return message.replace(
      /Form with slug "(.+)" already exists/,
      'فرم با شناسه "$1" از قبل وجود دارد',
    );
  }
  if (
    message.startsWith("Form schema with slug") &&
    message.includes("not found")
  ) {
    return message.replace(
      /Form schema with slug "(.+)" not found/,
      'فرم با شناسه "$1" یافت نشد',
    );
  }
  if (message.startsWith("Form with slug") && message.includes("not found")) {
    return message.replace(
      /Form with slug "(.+)" not found/,
      'فرم با شناسه "$1" یافت نشد',
    );
  }
  if (
    message.startsWith("Access denied: Requires one of the following roles:")
  ) {
    return message.replace(
      /Access denied: Requires one of the following roles: (.+)/,
      "دسترسی رد شد: نیاز به یکی از نقش‌های: $1",
    );
  }
  return message;
}

export function translateServerError(error: unknown): string {
  if (!error) return "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const axiosError = error as any;
  if (axiosError.response?.data?.message) {
    const serverMsg = axiosError.response.data.message;
    if (Array.isArray(serverMsg)) {
      return serverMsg
        .map((m: string) => errorTranslations[m] || translateDynamicMessage(m))
        .join("\n");
    }
    return errorTranslations[serverMsg] || translateDynamicMessage(serverMsg);
  }

  const message = typeof error === "string" ? error : (error as Error).message;
  if (!message) return "";
  return errorTranslations[message] || translateDynamicMessage(message);
}
