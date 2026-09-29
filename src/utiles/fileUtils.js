import localStorageService from "./localStorageService";

// The backend hands back uploads as root-relative paths ("/uploads/<file>").
// Those only resolve when the app and the API share an origin — true behind the
// nginx in nginx.conf, but false on GitHub Pages, where the browser would look
// them up on the Pages domain and 404. Rewriting to the API origin makes every
// stored upload path work on any host.
//
// This is the single funnel for upload links: UsersPage, FormSubmissions and
// SelfDeclarationSubmissions all render through uploadUrl(), so they need no
// changes of their own.
const apiOrigin = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

export function uploadUrl(pathOrUrl) {
  if (typeof pathOrUrl !== "string" || !pathOrUrl.startsWith("/uploads/")) {
    return pathOrUrl;
  }
  const absolute = `${apiOrigin}${pathOrUrl}`;
  const token = localStorageService.getToken();
  const sep = absolute.includes("?") ? "&" : "?";
  return `${absolute}${sep}token=${encodeURIComponent(token || "")}`;
}
