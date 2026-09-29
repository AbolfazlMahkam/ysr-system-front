import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toPersianDigits } from "./utils";

interface Consultant {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  gender: string | null;
}

interface ProcessionWithConsultants {
  id: number;
  name: string;
  location: string;
  address: string;
  responsible_name: string;
  responsible_phone: string;
  gender_requirement: string;
  show_on_dashboard: boolean;
  consultants: Consultant[];
  responsible_consultant: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
}

function getLocationLabel(location: string): string {
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
}

function getGenderLabel(gender: string): string {
  switch (gender) {
    case "male":
      return "فقط آقایان";
    case "female":
      return "فقط خانم\u200cها";
    case "both":
      return "آقایان و خانم\u200cها";
    default:
      return gender;
  }
}

function getGenderBadgeStyle(gender: string): string {
  switch (gender) {
    case "male":
      return "background: #dbeafe; color: #1e40af;";
    case "female":
      return "background: #fce7f3; color: #9d174d;";
    case "both":
      return "background: #dcfce7; color: #166534;";
    default:
      return "background: #f3f4f6; color: #374151;";
  }
}

function getLocationBadgeStyle(location: string): string {
  switch (location) {
    case "Karbala Mu'alla":
      return "background: #fee2e2; color: #991b1b;";
    case "Najaf Ashraf":
      return "background: #dcfce7; color: #166534;";
    case "Tariq Al-Hussein (AS)":
      return "background: #dbeafe; color: #1e40af;";
    default:
      return "background: #f3f4f6; color: #374151;";
  }
}

const STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'IBM Plex Sans Arabic', Tahoma, Arial, sans-serif;
    background: #ffffff;
    color: #1a1a1a;
    width: 800px;
    padding: 0;
    direction: rtl;
    line-height: 1.6;
  }
  .page-header {
    text-align: center;
    padding: 32px 32px 24px;
    border-bottom: 2px solid hsl(0, 8%, 88%);
    margin-bottom: 24px;
  }
  .page-header h1 {
    font-size: 24px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 6px;
  }
  .page-header .subtitle {
    font-size: 14px;
    color: hsl(0, 5%, 45%);
  }
  .page-header .page-num {
    font-size: 11px;
    color: hsl(0, 5%, 45%);
    margin-top: 4px;
  }
  .procession-card {
    border: 1px solid hsl(0, 8%, 88%);
    border-radius: 12px;
    margin: 0 32px 20px;
    overflow: hidden;
    background: #ffffff;
  }
  .card-header {
    padding: 16px 20px;
    border-bottom: 1px solid hsl(0, 8%, 88%);
    background: hsl(0, 8%, 96%);
  }
  .card-header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .card-title {
    font-size: 16px;
    font-weight: 700;
    color: #1a1a1a;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .card-title .index {
    color: hsl(0, 5%, 45%);
    font-weight: 500;
    font-size: 14px;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
  }
  .info-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 20px;
    font-size: 13px;
  }
  .info-item {
    display: flex;
    align-items: center;
    gap: 6px;
    color: hsl(0, 5%, 45%);
  }
  .info-item .label {
    font-weight: 500;
    color: hsl(0, 5%, 45%);
  }
  .info-item .value {
    color: #1a1a1a;
    font-weight: 500;
  }
  .info-item .value.phone {
    direction: ltr;
    unicode-bidi: embed;
  }
  .card-body {
    padding: 16px 20px;
  }
  .consultants-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid hsl(0, 8%, 88%);
  }
  .consultants-header .title {
    font-size: 13px;
    font-weight: 600;
    color: hsl(0, 5%, 45%);
  }
  .consultants-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .consultants-column .column-title {
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 8px;
    padding-bottom: 6px;
  }
  .consultants-column.male .column-title {
    color: #1e40af;
    border-bottom: 2px solid #dbeafe;
  }
  .consultants-column.female .column-title {
    color: #9d174d;
    border-bottom: 2px solid #fce7f3;
  }
  .consultant-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-radius: 8px;
    background: hsl(0, 8%, 96%);
    margin-bottom: 4px;
    font-size: 13px;
  }
  .consultant-row .name {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .consultant-row .index-num {
    font-size: 11px;
    color: hsl(0, 5%, 45%);
    flex-shrink: 0;
    min-width: 16px;
  }
  .consultant-row .full-name {
    color: #1a1a1a;
    font-weight: 500;
  }
  .consultant-row .phone {
    font-size: 12px;
    color: hsl(0, 5%, 45%);
    direction: ltr;
    unicode-bidi: embed;
    flex-shrink: 0;
    margin-right: 12px;
  }
  .no-consultants {
    font-size: 13px;
    color: hsl(0, 5%, 45%);
    padding: 12px 0;
    border-top: 1px solid hsl(0, 8%, 88%);
    margin-top: 12px;
  }
  .responsible-consultant {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    margin-top: 8px;
    color: hsl(0, 5%, 45%);
  }
  .responsible-consultant .name {
    color: #1a1a1a;
    font-weight: 600;
  }
  .page-footer {
    text-align: center;
    padding: 20px 32px;
    margin-top: 16px;
    border-top: 1px solid hsl(0, 8%, 88%);
    font-size: 11px;
    color: hsl(0, 5%, 45%);
  }
`;

function buildPageHeaderHtml(
  year: string,
  pageInfo?: { current: number; total: number },
): string {
  const pageInfoHtml = pageInfo
    ? `<p class="page-num">صفحه ${toPersianDigits(pageInfo.current)} از ${toPersianDigits(pageInfo.total)}</p>`
    : "";
  return `
    <div class="page-header">
      <h1>مواکب اربعین ${toPersianDigits(year)}</h1>
      <p class="subtitle">لیست مواکب و مشاوران آن\u200cها</p>
      ${pageInfoHtml}
    </div>
  `;
}

function buildCardHtml(
  proc: ProcessionWithConsultants,
  index: number,
): string {
  const maleConsultants = proc.consultants.filter((c) => c.gender === "male");
  const femaleConsultants = proc.consultants.filter(
    (c) => c.gender === "female",
  );
  const isBoth = proc.gender_requirement === "both";

  let html = `
    <div class="procession-card">
      <div class="card-header">
        <div class="card-header-top">
          <div class="card-title">
            <span class="index">${toPersianDigits(index + 1)}.</span>
            ${proc.name}
          </div>
          <span class="badge" style="${getGenderBadgeStyle(proc.gender_requirement)}">
            ${getGenderLabel(proc.gender_requirement)}
          </span>
        </div>
        <div class="info-row">
          <div class="info-item">
            <span class="label">مکان:</span>
            <span class="badge" style="${getLocationBadgeStyle(proc.location)}">
              ${getLocationLabel(proc.location)}
            </span>
          </div>
          <div class="info-item">
            <span class="label">مسئول:</span>
            <span class="value">${proc.responsible_name}</span>
          </div>
          <div class="info-item">
            <span class="label">شماره:</span>
            <span class="value phone">${toPersianDigits(proc.responsible_phone)}</span>
          </div>
        </div>
        ${
          proc.address
            ? `<div style="margin-top: 6px; font-size: 12px; color: hsl(0, 5%, 45%);">${proc.address}</div>`
            : ""
        }
        ${
          proc.responsible_consultant
            ? `<div class="responsible-consultant">
                <span style="color: #ca8a04;">&#9733;</span>
                <span>مسئول مشاورین:</span>
                <span class="name">${proc.responsible_consultant.first_name} ${proc.responsible_consultant.last_name}</span>
              </div>`
            : ""
        }
      </div>
      <div class="card-body">
  `;

  if (proc.consultants.length > 0) {
    html += `
      <div class="consultants-header">
        <span class="title">مشاوران (${toPersianDigits(proc.consultants.length)})</span>
      </div>
    `;

    if (isBoth) {
      html += `<div class="consultants-grid">`;

      html += `<div class="consultants-column male">
        <div class="column-title">آقایان (${toPersianDigits(maleConsultants.length)})</div>
        ${maleConsultants
          .map(
            (c, i) => `
          <div class="consultant-row">
            <div class="name">
              <span class="index-num">${toPersianDigits(i + 1)}.</span>
              <span class="full-name">${c.first_name} ${c.last_name}</span>
            </div>
            <span class="phone">${toPersianDigits(c.phone)}</span>
          </div>
        `,
          )
          .join("")}
        ${maleConsultants.length === 0 ? '<div style="font-size: 12px; color: hsl(0, 5%, 45%); padding: 8px 0;">مشاوری ثبت نشده</div>' : ""}
      </div>`;

      html += `<div class="consultants-column female">
        <div class="column-title">خانم\u200cها (${toPersianDigits(femaleConsultants.length)})</div>
        ${femaleConsultants
          .map(
            (c, i) => `
          <div class="consultant-row">
            <div class="name">
              <span class="index-num">${toPersianDigits(i + 1)}.</span>
              <span class="full-name">${c.first_name} ${c.last_name}</span>
            </div>
            <span class="phone">${toPersianDigits(c.phone)}</span>
          </div>
        `,
          )
          .join("")}
        ${femaleConsultants.length === 0 ? '<div style="font-size: 12px; color: hsl(0, 5%, 45%); padding: 8px 0;">مشاوری ثبت نشده</div>' : ""}
      </div>`;

      html += `</div>`;
    } else {
      html += `<div class="consultants-grid" style="grid-template-columns: 1fr;">`;
      html += `<div class="consultants-column">
        ${proc.consultants
          .map(
            (c, i) => `
          <div class="consultant-row">
            <div class="name">
              <span class="index-num">${toPersianDigits(i + 1)}.</span>
              <span class="full-name">${c.first_name} ${c.last_name}</span>
            </div>
            <span class="phone">${toPersianDigits(c.phone)}</span>
          </div>
        `,
          )
          .join("")}
      </div>`;
      html += `</div>`;
    }
  } else {
    html += `<p class="no-consultants">هنوز مشاوری اضافه نشده است</p>`;
  }

  html += `</div></div>`;
  return html;
}

function buildFullPageHtml(
  year: string,
  cardsHtml: string,
  pageInfo?: { current: number; total: number },
  showFooter: boolean = true,
): string {
  return `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>${STYLES}</style>
    </head>
    <body>
      ${buildPageHeaderHtml(year, pageInfo)}
      ${cardsHtml}
      ${
        showFooter
          ? `<div class="page-footer">تاریخ چاپ: ${toPersianDigits(new Date().toLocaleDateString("fa-IR"))}</div>`
          : ""
      }
    </body></html>
  `;
}

function createHiddenContainer(): HTMLDivElement {
  const el = document.createElement("div");
  el.style.position = "fixed";
  el.style.left = "-9999px";
  el.style.top = "0";
  el.style.width = "800px";
  return el;
}

async function renderToCanvas(
  element: HTMLElement,
): Promise<HTMLCanvasElement> {
  return html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });
}

function measureCardHeights(
  processions: ProcessionWithConsultants[],
  year: string,
): { cardHtmls: string[]; heights: number[] } {
  const cardHtmls = processions.map((proc, i) => buildCardHtml(proc, i));

  const container = createHiddenContainer();
  container.innerHTML = buildFullPageHtml(year, cardHtmls.join(""), undefined, false);
  document.body.appendChild(container);

  const cardElements = Array.from(
    container.querySelectorAll(".procession-card"),
  ) as HTMLElement[];
  const heights = cardElements.map((el) => el.offsetHeight);

  document.body.removeChild(container);
  return { cardHtmls, heights };
}

export async function generateProcessionsPdf(
  year: string,
  processions: ProcessionWithConsultants[],
): Promise<void> {
  if (processions.length === 0) return;

  const { cardHtmls, heights } = measureCardHeights(processions, year);

  const container = createHiddenContainer();
  container.innerHTML = buildFullPageHtml(year, cardHtmls.join(""), undefined, false);
  document.body.appendChild(container);

  const headerEl = container.querySelector(".page-header") as HTMLElement;
  const headerHeight = headerEl ? headerEl.offsetHeight : 120;
  document.body.removeChild(container);

  const CONTAINER_WIDTH = 800;
  const MARGIN_BOTTOM_PX = 20;
  const PAGE_PADDING_TOP = 5 * (CONTAINER_WIDTH / 200);
  const PAGE_PADDING_BOTTOM = 5 * (CONTAINER_WIDTH / 200);

  const measureContainer = createHiddenContainer();
  measureContainer.innerHTML = buildFullPageHtml(
    year,
    cardHtmls.join(""),
    { current: 1, total: 1 },
    true,
  );
  document.body.appendChild(measureContainer);
  const footerEl = measureContainer.querySelector(".page-footer") as HTMLElement;
  const footerHeight = footerEl ? footerEl.offsetHeight : 50;
  document.body.removeChild(measureContainer);

  const PAGE_CONTENT_HEIGHT =
    CONTAINER_WIDTH * (297 / 200) - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM;
  const FIRST_PAGE_AVAILABLE = PAGE_CONTENT_HEIGHT - headerHeight - 24;
  const NEXT_PAGE_AVAILABLE = PAGE_CONTENT_HEIGHT;

  const MAX_CARDS_PER_PAGE = 2;

  const pages: number[][] = [];
  let currentPage: number[] = [];
  let currentHeight = 0;
  let isFirstPage = true;

  for (let i = 0; i < cardHtmls.length; i++) {
    const cardHeight = heights[i] + MARGIN_BOTTOM_PX;
    const available = isFirstPage ? FIRST_PAGE_AVAILABLE : NEXT_PAGE_AVAILABLE;
    const isLastCard = i === cardHtmls.length - 1;
    const remainingAfterThis = currentPage.reduce(
      (sum, idx) => sum + heights[idx] + MARGIN_BOTTOM_PX,
      0,
    );
    const heightWithFooter =
      remainingAfterThis + cardHeight + footerHeight + 20;

    const pageIsFull =
      currentPage.length >= MAX_CARDS_PER_PAGE ||
      currentHeight + cardHeight > available;

    if (pageIsFull && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [i];
      currentHeight = cardHeight;
      isFirstPage = false;
    } else {
      currentPage.push(i);
      currentHeight += cardHeight;

      if (isLastCard && heightWithFooter > available) {
        pages.push(currentPage);
        currentPage = [];
      }
    }
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  const totalPages = pages.length;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  for (let p = 0; p < pages.length; p++) {
    if (p > 0) pdf.addPage();

    const pageCardHtml = pages[p]
      .map((idx) => cardHtmls[idx])
      .join("");

    const isLastPage = p === pages.length - 1;
    const pageHtml = buildFullPageHtml(
      year,
      pageCardHtml,
      totalPages > 1 ? { current: p + 1, total: totalPages } : undefined,
      isLastPage,
    );

    const pageContainer = createHiddenContainer();
    pageContainer.innerHTML = pageHtml;
    document.body.appendChild(pageContainer);

    try {
      const canvas = await renderToCanvas(pageContainer);
      const imgData = canvas.toDataURL("image/png");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pdfWidth - 10;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 5, 5, imgWidth, imgHeight);
    } finally {
      document.body.removeChild(pageContainer);
    }
  }

  pdf.save(`mawaqeb-${year}-${new Date().toISOString().split("T")[0]}.pdf`);
}
