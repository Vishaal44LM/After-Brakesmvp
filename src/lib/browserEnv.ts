// Utilities for detecting in-app browsers and platform.
// Used to give better guidance when geolocation / camera fail.

export type InAppBrowser = "instagram" | "facebook" | "messenger" | "tiktok" | "linkedin" | null;

export function detectInAppBrowser(): InAppBrowser {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  if (/Instagram/i.test(ua)) return "instagram";
  if (/FBAN|FBAV/i.test(ua)) return "facebook";
  if (/Messenger/i.test(ua)) return "messenger";
  if (/TikTok|BytedanceWebview/i.test(ua)) return "tiktok";
  if (/LinkedInApp/i.test(ua)) return "linkedin";
  return null;
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iPhone|iPad|iPod/i.test(ua) || (/Mac/i.test(ua) && "ontouchend" in document);
}

export function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent || "");
}

export function openInExternalBrowser(url = window.location.href): void {
  if (isAndroid()) {
    // Chrome intent — most Android in-app browsers will hand off
    const intent = `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intent;
    return;
  }
  if (isIOS()) {
    // Safari deep link
    window.location.href = url.replace(/^https?:\/\//, "x-safari-https://");
    return;
  }
  window.open(url, "_blank", "noopener");
}
