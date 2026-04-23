import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell, BookOpen, Building2, CreditCard, FileText,
  HeadphonesIcon, LayoutDashboard, LogOut, MessageSquare, MoreHorizontal, Settings,
  TrendingDown, TrendingUp, Users
} from "lucide-react";
import { isNative } from "../utils/native";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import useIdleTimeout from "../hooks/useIdleTimeout";
import { Modal, MONTHS, SectionSkeleton } from "../components/UI";
import { BrandMark } from "../components/BrandLogo";
import PendingInviteBanner from "../components/PendingInviteBanner";
import { societyApi } from "../lib/api";
import { APP_UPGRADE_URL } from "../utils/brand";
import {
  buildReminders,
  filterRemindersByPrefs,
  getDismissedReminderIds,
  getSentBrowserReminderIds,
  saveDismissedReminderIds,
  saveSentBrowserReminderIds
} from "../utils/reminders";
import { formatSubscriptionDate, isReviewAccessEnabled, isTrialActive } from "../utils/subscription";
import { getOrgConfig, getOrgType, ORG_TYPES } from "../utils/orgTypes";

const Dashboard = lazy(() => import("../sections/Dashboard"));
const IncomeSection = lazy(() => import("../sections/IncomeSection"));
const ExpensesSection = lazy(() => import("../sections/ExpensesSection"));
const EmiSection = lazy(() => import("../sections/EmiSection"));
const InvoicesSection = lazy(() => import("../sections/InvoicesSection"));
const KhataSection = lazy(() => import("../sections/KhataSection"));
const SettingsSection = lazy(() => import("../sections/SettingsSection"));
const OrgSection = lazy(() => import("../sections/SettingsSection"));
const AdminPanel = lazy(() => import("../sections/AdminPanel"));
const AdminUsersSection = lazy(() => import("../sections/AdminUsersSection"));
const AdminSupportSection = lazy(() => import("../sections/AdminSupportSection"));
const DiscussionsSection = lazy(() => import("../sections/DiscussionsSection"));

const now = new Date();
const TAB_COLOR = {
  dashboard: "var(--accent)",
  users: "var(--blue)",
  org: "var(--blue)",
  income: "var(--accent)",
  expenses: "var(--danger)",
  emi: "var(--gold)",
  khata: "var(--gold)",
  invoices: "var(--blue)",
  discussions: "var(--blue)",
  settings: "var(--purple)",
  adminDashboard: "var(--gold)",
  adminSupport: "var(--blue)"
};
const TAB_ICONS = {
  dashboard: LayoutDashboard,
  users: Users,
  income: TrendingUp,
  expenses: TrendingDown,
  emi: CreditCard,
  khata: BookOpen,
  invoices: FileText,
  discussions: MessageSquare,
  org: Building2,
  settings: Settings,
  adminSupport: HeadphonesIcon,
  adminDashboard: LayoutDashboard
};

function HeaderDatePicker({ year, month, onChange, viewMode, onViewModeChange }) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const triggerRef = useRef(null);
  const [useNativeMonthPicker, setUseNativeMonthPicker] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 768 : false));
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const isCurrentMonth = year === currentYear && month === currentMonth;
  const isCurrentYear = year === currentYear;
  const yearOptions = Array.from({ length: 8 }, (_, index) => currentYear - (7 - index));
  const compactPicker = typeof window !== "undefined" ? window.innerWidth <= 420 : false;

  useEffect(() => {
    if (!open) return undefined;

    function handleClick(event) {
      if (!event.target.closest(".header-date-picker")) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const update = () => setUseNativeMonthPicker(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!useNativeMonthPicker) return;
    if (viewMode !== "month") {
      onViewModeChange("month");
    }
    setOpen(false);
  }, [onViewModeChange, useNativeMonthPicker, viewMode]);

  function prev() {
    if (viewMode === "month") {
      let nextMonth = month - 1;
      let nextYear = year;
      if (nextMonth < 0) {
        nextMonth = 11;
        nextYear -= 1;
      }
      onChange(nextYear, nextMonth);
      return;
    }
    onChange(year - 1, month);
  }

  function next() {
    if (viewMode === "month") {
      if (isCurrentMonth) return;
      let nextMonth = month + 1;
      let nextYear = year;
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear += 1;
      }
      onChange(nextYear, nextMonth);
      return;
    }

    if (isCurrentYear) return;
    onChange(year + 1, month);
  }

  const nextDisabled = viewMode === "month" ? isCurrentMonth : isCurrentYear;
  const monthInputValue = `${year}-${String(month + 1).padStart(2, "0")}`;

  return (
    <div className="header-date-picker" style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, width: "fit-content", maxWidth: "100%", marginLeft: "auto" }}>
      <button
        onClick={prev}
        style={{
          width: compactPicker ? 30 : 32,
          height: compactPicker ? 30 : 32,
          borderRadius: 9,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          color: "var(--text-sec)",
          fontSize: 16,
          fontWeight: 700,
          cursor: "pointer",
          flexShrink: 0
        }}
      >
        {"‹"}
      </button>

      {useNativeMonthPicker ? (
        <div style={{ minWidth: compactPicker ? 102 : 112, maxWidth: compactPicker ? 120 : 128, padding: compactPicker ? "4px 7px" : "5px 8px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)", flexShrink: 1 }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 2 }}>
            Month
          </div>
          <input
            type="month"
            value={monthInputValue}
            max={`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`}
            onChange={event => {
              const nextValue = String(event.target.value || "");
              if (!nextValue) return;
              const [nextYearRaw, nextMonthRaw] = nextValue.split("-");
              const nextYear = Number(nextYearRaw);
              const nextMonth = Number(nextMonthRaw) - 1;
              if (Number.isNaN(nextYear) || Number.isNaN(nextMonth) || nextMonth < 0 || nextMonth > 11) return;
              onChange(nextYear, nextMonth);
            }}
            style={{ width: "100%", border: "none", background: "transparent", color: "var(--blue)", fontFamily: "var(--serif)", fontSize: compactPicker ? 12 : 13, lineHeight: 1.2, padding: 0 }}
          />
        </div>
      ) : (
        <button
          ref={triggerRef}
          onClick={() => {
            if (triggerRef.current) {
              const rect = triggerRef.current.getBoundingClientRect();
              setDropdownPos({ top: rect.bottom + 10, right: window.innerWidth - rect.right });
            }
            setOpen(current => !current);
          }}
          style={{
            minWidth: compactPicker ? 86 : 96,
            maxWidth: compactPicker ? 112 : 118,
            padding: compactPicker ? "5px 8px" : "6px 9px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
            flexShrink: 1
          }}
        >
          <span style={{ fontSize: 8, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.55 }}>
            {viewMode === "month" ? "Month" : "Year"}
          </span>
          <span style={{ fontFamily: "var(--serif)", fontSize: compactPicker ? 12 : 13, color: "var(--blue)", lineHeight: 1.1, marginTop: 1, whiteSpace: "nowrap" }}>
            {viewMode === "month" ? `${MONTHS[month].slice(0, 3)} ${year}` : year}
          </span>
        </button>
      )}

      <button
        onClick={next}
        disabled={nextDisabled}
        style={{
          width: compactPicker ? 30 : 32,
          height: compactPicker ? 30 : 32,
          borderRadius: 9,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          color: nextDisabled ? "var(--text-dim)" : "var(--text)",
          fontSize: 16,
          fontWeight: 700,
          cursor: nextDisabled ? "not-allowed" : "pointer",
          opacity: nextDisabled ? 0.5 : 1,
          flexShrink: 0
        }}
      >
        {"›"}
      </button>

      {open && !useNativeMonthPicker && (
        <div
          style={{
            position: "fixed",
            top: dropdownPos.top,
            right: dropdownPos.right,
            width: 280,
            maxWidth: "calc(100vw - 32px)",
            padding: 14,
            borderRadius: 18,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 18px 50px rgba(0,0,0,0.24)",
            zIndex: 120
          }}
        >
          <div style={{ display: "flex", background: "var(--surface-high)", borderRadius: 12, padding: 4, marginBottom: 14 }}>
            <button
              onClick={() => onViewModeChange("month")}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 10,
                border: "none",
                background: viewMode === "month" ? "var(--surface-pop)" : "transparent",
                color: viewMode === "month" ? "var(--text)" : "var(--text-dim)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Month
            </button>
            <button
              onClick={() => onViewModeChange("year")}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 10,
                border: "none",
                background: viewMode === "year" ? "var(--surface-pop)" : "transparent",
                color: viewMode === "year" ? "var(--text)" : "var(--text-dim)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Year
            </button>
          </div>

          {viewMode === "month" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
              {MONTHS.map((label, index) => (
                (() => {
                  const monthDisabled = year === currentYear && index > currentMonth;
                  return (
                <button
                  key={label}
                  onClick={() => {
                    if (monthDisabled) return;
                    onChange(year, index);
                    setOpen(false);
                  }}
                  disabled={monthDisabled}
                  style={{
                    padding: "12px 10px",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: index === month ? "var(--accent-deep)" : "var(--surface-high)",
                    color: monthDisabled ? "var(--text-dim)" : index === month ? "var(--accent)" : "var(--text)",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: monthDisabled ? "not-allowed" : "pointer",
                    opacity: monthDisabled ? 0.45 : 1
                  }}
                >
                  {label}
                </button>
                  );
                })()
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
              {yearOptions.map(option => (
                <button
                  key={option}
                  onClick={() => {
                    onChange(option, month);
                    setOpen(false);
                  }}
                  style={{
                    padding: "12px 10px",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: option === year ? "var(--blue-deep)" : "var(--surface-high)",
                    color: option === year ? "var(--blue)" : "var(--text)",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MainApp() {
  const { user, logout } = useAuth();
  const data = useData();
  const { account, isReadOnlyFreeMode, isViewerMode, activeSharedOrgRole, sharedOrgs, activeSharedOrgKey, switchToSharedOrg, switchToOwnOrg } = data;
  const [showOrgSwitcher, setShowOrgSwitcher] = useState(false);
  const orgSwitcherRef = useRef(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const headerMenuRef = useRef(null);
  // Banner visibility state (must be before usage)
  const [showFreeBanner, setShowFreeBanner] = useState(true);
  const [trialBannerVisible, setTrialBannerVisible] = useState(true);
  const [trialBannerOpacity, setTrialBannerOpacity] = useState(1);
  const showTrialBanner = trialBannerVisible;
  const dismissTrialBanner = React.useCallback(() => {
    setTrialBannerOpacity(0);
    setTimeout(() => setTrialBannerVisible(false), 400);
  }, []);
  React.useEffect(() => {
    if (!trialBannerVisible) return;
    const fadeTimer = setTimeout(() => setTrialBannerOpacity(0), 5000);
    const hideTimer = setTimeout(() => setTrialBannerVisible(false), 5400);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, [trialBannerVisible]);
  const [tab, setTab] = useState("dashboard");
  const [settingsNavigation, setSettingsNavigation] = useState(null);
  const [quickstartIntent, setQuickstartIntent] = useState(null);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [viewMode, setViewMode] = useState("month"); // "month" or "year"
  const [showReminders, setShowReminders] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(() => getDismissedReminderIds(user?.id));
  const [readOnlyNotice, setReadOnlyNotice] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 768 : false));
  const [isCompactMobile, setIsCompactMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 420 : false));
  const [idleWarning, setIdleWarning] = useState(false);
  const [idleCountdown, setIdleCountdown] = useState(120);
  const [residentMemberView, setResidentMemberView] = useState(null);
  const idleCountdownRef = useRef(null);
  const historyMountedRef = useRef(false);
  const isPopStateRef = useRef(false);

  const handleIdleWarn = useCallback((remainingSeconds) => {
    setIdleCountdown(remainingSeconds);
    setIdleWarning(true);
  }, []);

  const handleIdleLogout = useCallback(async () => {
    setIdleWarning(false);
    await logout();
  }, [logout]);

  const { resetTimer: resetIdle } = useIdleTimeout({
    idleMinutes: 15,
    warningMinutes: 2,
    onWarn: handleIdleWarn,
    onLogout: handleIdleLogout,
    enabled: Boolean(user)
  });

  // Dismiss idle warning when user acts
  const handleStayLoggedIn = useCallback(() => {
    setIdleWarning(false);
    resetIdle();
  }, [resetIdle]);

  // Countdown tick while warning is visible
  useEffect(() => {
    if (!idleWarning) {
      if (idleCountdownRef.current) clearInterval(idleCountdownRef.current);
      return undefined;
    }
    idleCountdownRef.current = setInterval(() => {
      setIdleCountdown(prev => {
        if (prev <= 1) {
          clearInterval(idleCountdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(idleCountdownRef.current);
  }, [idleWarning]);

  const handleNavigate = useCallback((target) => {
    const nextTarget = typeof target === "string" ? { tab: target } : target;
    const routedTab = nextTarget?.tab || "dashboard";
    const nextTab = routedTab === "settings" && ["account", "customers", "create-org", "org-records"].includes(nextTarget?.screen)
      ? "org"
      : routedTab;

    if (nextTarget?.quickstart) {
      setQuickstartIntent({ action: nextTarget.quickstart, token: Date.now() });
    }

    setTab(nextTab);

    if (nextTab === "settings" || nextTab === "org") {
      setSettingsNavigation({
        screen: nextTarget?.screen || "main",
        orgSectionKey: nextTarget?.orgSectionKey || "",
        token: Date.now()
      });
      return;
    }

    setSettingsNavigation(null);
  }, []);

  // Handle #upgrade deep link — open the plan-request screen automatically
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#upgrade") {
      window.history.replaceState({}, "", window.location.pathname);
      setTab("org");
      setSettingsNavigation({ screen: "plan-request", token: Date.now() });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync tab → browser history so back/forward work
  useEffect(() => {
    if (isPopStateRef.current) {
      isPopStateRef.current = false;
      return;
    }
    if (!historyMountedRef.current) {
      historyMountedRef.current = true;
      window.history.replaceState({ tab }, "", window.location.pathname);
      return;
    }
    window.history.pushState({ tab }, "", window.location.pathname);
  }, [tab]);

  // Handle browser back/forward button
  useEffect(() => {
    function handlePopState(event) {
      const nextTab = event.state?.tab;
      if (nextTab) {
        isPopStateRef.current = true;
        setTab(nextTab);
        setSettingsNavigation(null);
      }
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleAppNavigate = event => {
      if (event?.detail) {
        handleNavigate(event.detail);
      }
    };
    window.addEventListener("ledger:navigate", handleAppNavigate);
    return () => window.removeEventListener("ledger:navigate", handleAppNavigate);
  }, []);

  // Close org switcher dropdown on outside click
  useEffect(() => {
    if (!showOrgSwitcher) return;
    function handleClickOutside(e) {
      if (orgSwitcherRef.current && !orgSwitcherRef.current.contains(e.target)) {
        setShowOrgSwitcher(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showOrgSwitcher]);

  useEffect(() => {
    const handleReadOnlyBlocked = event => {
      const msg = event?.detail?.message || "Your trial has ended. Upgrade to Pro (Rs 69/month) to continue.";
      setReadOnlyNotice({ message: msg, key: Date.now() });
    };
    window.addEventListener("ledger:readonly-blocked", handleReadOnlyBlocked);
    return () => window.removeEventListener("ledger:readonly-blocked", handleReadOnlyBlocked);
  }, []);

  useEffect(() => {
    const handleFirstSuccess = event => {
      const detail = event?.detail || {};
      if (!detail?.title || !detail?.message) return;
      setSuccessNotice({
        title: detail.title,
        message: detail.message,
        actionLabel: detail.actionLabel || "Open",
        target: detail.target || null,
        key: Date.now()
      });
    };

    window.addEventListener("ledger:first-success", handleFirstSuccess);
    return () => window.removeEventListener("ledger:first-success", handleFirstSuccess);
  }, []);

  useEffect(() => {
    const handleSecondSuccess = event => {
      const detail = event?.detail || {};
      if (!detail?.title || !detail?.message) return;
      setSuccessNotice({
        title: detail.title,
        message: detail.message,
        actionLabel: detail.actionLabel || "Open",
        target: detail.target || null,
        key: Date.now()
      });
    };

    window.addEventListener("ledger:second-success", handleSecondSuccess);
    return () => window.removeEventListener("ledger:second-success", handleSecondSuccess);
  }, []);

  useEffect(() => {
    if (!readOnlyNotice) return undefined;
    const timeout = window.setTimeout(() => setReadOnlyNotice(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [readOnlyNotice]);

  // Android hardware back button — go back within app instead of exiting
  useEffect(() => {
    if (!isNative) return undefined;
    let cleanup = () => {};
    import("@capacitor/app").then(({ App: CapApp }) => {
      const listener = CapApp.addListener("backButton", () => {
        if (tab !== "dashboard") {
          setTab("dashboard");
        }
        // If already on dashboard, do nothing (don't exit)
      });
      cleanup = () => listener.then(h => h.remove()).catch(() => {});
    }).catch(() => {});
    return () => cleanup();
  }, [tab]);

  useEffect(() => {
    if (!successNotice) return undefined;
    const timeout = window.setTimeout(() => setSuccessNotice(null), 6200);
    return () => window.clearTimeout(timeout);
  }, [successNotice]);

  useEffect(() => {
    setDismissedIds(getDismissedReminderIds(user?.id));
  }, [user?.id]);

  useEffect(() => {
    function handleDocumentClick(event) {
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target)) {
        setShowHeaderMenu(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("touchstart", handleDocumentClick);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("touchstart", handleDocumentClick);
    };
  }, []);

  const hasResidentPortalAccess = Boolean(user?.societyPortalId && user?.societyPortalRole === "member");

  const liveReminders = useMemo(() => {
    if (hasResidentPortalAccess) {
      const flatDue = residentMemberView?.flatDue || null;
      const pendingAmount = Number(flatDue?.pendingAmount || 0);
      if (pendingAmount <= 0) return [];

      const period = String(flatDue?.period || new Date().toISOString().slice(0, 7));
      const [yearPart, monthPart] = period.split("-");
      const monthNumber = Number(monthPart);
      const monthLabel = monthNumber >= 1 && monthNumber <= 12
        ? `${MONTHS[monthNumber - 1]} ${yearPart}`
        : period;

      return [
        {
          id: `resident-due-${residentMemberView?.portal?.id || user?.societyPortalId || "portal"}-${period}`,
          type: "pendingCollections",
          tab: "org",
          tone: "gold",
          title: `Pending due for Flat ${flatDue?.flatNumber || user?.societyFlatNumber || "-"}`,
          message: `${monthLabel} still has ${pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pending. Open the resident access section to review your dues.`
        }
      ];
    }

    const currentDate = new Date();
    const reminders = buildReminders(data, currentDate.getFullYear(), currentDate.getMonth());
    return filterRemindersByPrefs(reminders, data.notificationPrefs || {});
  }, [data, hasResidentPortalAccess, residentMemberView, user?.societyFlatNumber, user?.societyPortalId]);

  const inboxReminders = useMemo(
    () => liveReminders.filter(item => !dismissedIds.includes(item.id)),
    [dismissedIds, liveReminders]
  );

  useEffect(() => {
    if (!user?.id || typeof window === "undefined" || !("Notification" in window)) return;
    if (!data.notificationPrefs?.browserEnabled || Notification.permission !== "granted") return;

    const sentIds = getSentBrowserReminderIds(user.id);
    const nextSentIds = [...sentIds];

    liveReminders.forEach(reminder => {
      if (sentIds.includes(reminder.id) || dismissedIds.includes(reminder.id)) return;

      new Notification(reminder.title, {
        body: reminder.message,
        tag: reminder.id
      });
      nextSentIds.push(reminder.id);
    });

    if (nextSentIds.length !== sentIds.length) {
      saveSentBrowserReminderIds(user.id, nextSentIds);
    }
  }, [dismissedIds, liveReminders, data.notificationPrefs?.browserEnabled, user?.id]);

  const isAdmin = user?.role === "admin";
  const reviewAccessEnabled = isReviewAccessEnabled();
  const trialActive = isTrialActive(user);
  const trialEndLabel = formatSubscriptionDate(user?.subscriptionEndsAt);
  const currentOrgType = getOrgType(account?.organizationType || user?.organizationType);
  const orgConfig = getOrgConfig(currentOrgType) || getOrgConfig(ORG_TYPES.SMALL_BUSINESS);
  const isPersonalOrg = currentOrgType === ORG_TYPES.PERSONAL;
  const isFreelancerOrg = currentOrgType === ORG_TYPES.FREELANCER;
  const isSmallBusinessOrg = currentOrgType === ORG_TYPES.SMALL_BUSINESS;
  const isApartmentOrg = currentOrgType === ORG_TYPES.APARTMENT;
  const hideInvoices = !isAdmin && orgConfig.hideInvoices;
  const currentOrgLabel = account?.name?.trim() || "Khata";
  const TABS = useMemo(() => ([
    { id: "dashboard", icon: isAdmin ? "AD" : "DB", label: isAdmin ? "Admin" : "Dashboard" },
    ...(isAdmin ? [{ id: "users", icon: "US", label: "Users" }, { id: "adminSupport", icon: "SP", label: "Support Ops" }] : []),
    ...(user?.role !== "admin" ? [
      { id: "income", icon: "IN", label: orgConfig.incomeLabel },
      { id: "expenses", icon: "EX", label: orgConfig.expensesLabel },
      ...(isPersonalOrg ? [{ id: "emi", icon: "EM", label: "EMIs" }] : [])
    ] : []),
    ...(!isAdmin && !hideInvoices && isSmallBusinessOrg ? [{ id: "khata", icon: "KH", label: "Khata" }] : []),
    ...(!hideInvoices && !activeSharedOrgKey ? [{ id: "invoices", icon: "IV", label: isAdmin ? "Subscriptions" : orgConfig.invoicesLabel }] : []),
    ...(!isAdmin && isApartmentOrg ? [{ id: "discussions", icon: "DS", label: "Chat" }] : []),
    ...(!isAdmin && !activeSharedOrgKey ? [{ id: "org", icon: "OR", label: "Khata" }] : []),
    ...(isAdmin ? [] : [])
  ]), [activeSharedOrgKey, currentOrgLabel, hideInvoices, isAdmin, isApartmentOrg, isPersonalOrg, isSmallBusinessOrg, orgConfig.expensesLabel, orgConfig.incomeLabel, orgConfig.invoicesLabel, user?.role]);

  const activeDashboardColor = isAdmin ? TAB_COLOR.adminDashboard : TAB_COLOR.dashboard;
  const handleDateChange = useCallback((nextYear, nextMonth) => {
    setYear(nextYear);
    setMonth(nextMonth);
  }, []);
  const handleQuickstartHandled = useCallback(() => {
    setQuickstartIntent(null);
  }, []);
  const openUpgradeFlow = useCallback(() => {
    // On Android we cannot use in-app payments (Play Store policy).
    // Send users to the website to upgrade there.
    if (isNative) {
      import("@capacitor/browser").then(({ Browser }) => {
        Browser.open({ url: APP_UPGRADE_URL });
      }).catch(() => {
        window.open(APP_UPGRADE_URL, "_blank");
      });
      return;
    }
    handleNavigate({ tab: "settings", screen: reviewAccessEnabled ? "main" : "plan-request" });
  }, [handleNavigate, reviewAccessEnabled]);
  const datePickerNode = useMemo(() => (
    <HeaderDatePicker
      year={year}
      month={month}
      onChange={handleDateChange}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
    />
  ), [handleDateChange, month, viewMode, year]);

  function dismissReminder(id) {
    const nextIds = Array.from(new Set([...dismissedIds, id]));
    setDismissedIds(nextIds);
    saveDismissedReminderIds(user?.id, nextIds);
  }

  function clearAllReminders() {
    const nextIds = Array.from(new Set([...dismissedIds, ...liveReminders.map(item => item.id)]));
    setDismissedIds(nextIds);
    saveDismissedReminderIds(user?.id, nextIds);
  }

  function openReminder(reminder) {
    const nextTab = reminder.tab === "invoices" && hideInvoices ? "income" : reminder.tab || "dashboard";
    setTab(nextTab);
    dismissReminder(reminder.id);
    setShowReminders(false);
  }

  useEffect(() => {
    if (hideInvoices && tab === "invoices") {
      setTab("income");
    }
  }, [hideInvoices, tab]);

  // When switching into a shared org, leave owner-only tabs
  useEffect(() => {
    if (activeSharedOrgKey && (tab === "org" || tab === "invoices")) {
      setTab("dashboard");
    }
  }, [activeSharedOrgKey, tab]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsCompactMobile(window.innerWidth <= 420);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!hasResidentPortalAccess) {
      setResidentMemberView(null);
      return undefined;
    }

    let cancelled = false;
    const period = new Date().toISOString().slice(0, 7);

    async function loadResidentMemberView() {
      try {
        const result = await societyApi.getMemberView(period);
        if (!cancelled) {
          setResidentMemberView(result || null);
        }
      } catch {
        if (!cancelled) {
          setResidentMemberView(null);
        }
      }
    }

    loadResidentMemberView();
    return () => {
      cancelled = true;
    };
  }, [hasResidentPortalAccess, user?.societyPortalId, user?.societyFlatNumber]);

  const renderTabContent = useCallback(() => {
    const fallback = tab === "settings" || (isAdmin && tab === "users")
      ? <SectionSkeleton rows={5} showHero={false} />
      : <SectionSkeleton rows={4} />;

    return (
      <Suspense fallback={fallback}>
        {tab === "dashboard" && (isAdmin ? <AdminPanel year={year} month={month} /> : <Dashboard year={year} month={month} viewMode={viewMode} onNav={handleNavigate} headerDatePicker={datePickerNode} />)}
        {tab === "users" && isAdmin && <AdminUsersSection />}
        {tab === "adminSupport" && isAdmin && <AdminSupportSection />}
        {tab === "org" && !isAdmin && <OrgSection navigationTarget={settingsNavigation} sectionMode="org" />}
        {tab === "income" && (
          <IncomeSection
            year={year}
            month={month}
            orgType={currentOrgType}
            quickstartIntent={quickstartIntent}
            onQuickstartHandled={handleQuickstartHandled}
            headerDatePicker={datePickerNode}
          />
        )}
        {tab === "expenses" && <ExpensesSection year={year} month={month} orgType={currentOrgType} headerDatePicker={datePickerNode} />}
        {tab === "emi" && isPersonalOrg && <EmiSection year={year} month={month} orgType={currentOrgType} headerDatePicker={datePickerNode} />}
        {tab === "discussions" && isApartmentOrg && <DiscussionsSection />}
        {tab === "khata" && !isAdmin && isSmallBusinessOrg && <KhataSection orgType={currentOrgType} />}
        {tab === "invoices" && !hideInvoices && (
          <InvoicesSection
            year={year}
            month={month}
            orgType={currentOrgType}
            quickstartIntent={quickstartIntent}
            onQuickstartHandled={handleQuickstartHandled}
            headerDatePicker={datePickerNode}
          />
        )}
        {tab === "settings" && <SettingsSection navigationTarget={settingsNavigation} />}
      </Suspense>
    );
  }, [currentOrgType, datePickerNode, handleNavigate, handleQuickstartHandled, hideInvoices, isAdmin, isApartmentOrg, isPersonalOrg, isSmallBusinessOrg, month, quickstartIntent, settingsNavigation, tab, viewMode, year]);


  const footerTabs = useMemo(() => {
    const baseTabOrder = isAdmin
      ? ["dashboard", "users", "adminSupport", "invoices"]
      : isApartmentOrg
        ? ["dashboard", "income", "expenses", "discussions", "invoices", "org"]
        : ["dashboard", "income", "expenses", "emi", "invoices", "org"];
    const baseTabs = baseTabOrder
      .filter(tabId => TABS.some(item => item.id === tabId))
      .map(tabId => TABS.find(item => item.id === tabId))
      .filter(Boolean);
    if (baseTabs.some(item => item.id === tab) || !TABS.some(item => item.id === tab)) {
      return baseTabs.map(item => ({
        ...item,
        label:
          item.id === "dashboard" ? "Home" :
          item.id === "income" && isApartmentOrg ? "Maint." :
          item.id === "income" && isFreelancerOrg ? "Payments" :
          item.id === "expenses" ? "Spend" :
          item.id === "invoices" && isApartmentOrg ? "Bills" :
          item.id === "invoices" && (isFreelancerOrg || isSmallBusinessOrg) ? "Invoices" :
          item.id === "discussions" ? "Chat" :
          item.id === "org" ? "Khata" :
          item.id === "adminSupport" ? "Support" :
          item.label
      }));
    }
    const fallbackTab = TABS.find(item => item.id === tab);
    const nextTabs = fallbackTab ? [...baseTabs, fallbackTab] : baseTabs;
    return nextTabs.map(item => ({
      ...item,
        label:
        item.id === "dashboard" ? "Home" :
        item.id === "income" && isApartmentOrg ? "Maint." :
        item.id === "income" && isFreelancerOrg ? "Payments" :
        item.id === "expenses" ? "Spend" :
        item.id === "invoices" && isApartmentOrg ? "Bills" :
        item.id === "invoices" && (isFreelancerOrg || isSmallBusinessOrg) ? "Invoices" :
        item.id === "discussions" ? "Chat" :
        item.id === "org" ? "Khata" :
        item.id === "adminSupport" ? "Support" :
        item.label
    }));
  }, [TABS, isAdmin, isApartmentOrg, isFreelancerOrg, isSmallBusinessOrg, tab]);
  const bottomNoticeBase = "calc(env(safe-area-inset-bottom, 0px) + 92px)";

  return (
    <div className="app-shell" style={{ minHeight: "100vh", position: "relative", display: "flex" }}>

      {/* Fixed banners at the top, above sidebar/content */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, pointerEvents: 'none' }}>
        {isReadOnlyFreeMode && !isAdmin && showFreeBanner && (
          <div style={{
            margin: '0 auto',
            marginTop: 12,
            width: "min(calc(100% - 16px), 760px)",
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid var(--gold)',
            background: 'var(--gold-deep)',
            color: 'var(--gold)',
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1.5,
            position: 'relative',
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            pointerEvents: 'auto'
          }}>
            Free Plan (Read-only): You can view existing records and download reports. Create, edit, and delete actions require Pro.
            {!reviewAccessEnabled && (
              <button
                className="btn-secondary"
                type="button"
                onClick={openUpgradeFlow}
                style={{ marginTop: 8, padding: "7px 10px", fontSize: 11, color: "var(--gold)", borderColor: "var(--gold)" }}
              >
                Upgrade to Pro
              </button>
            )}
            <button
              style={{ position: 'absolute', top: 8, right: 12, background: 'none', border: 'none', color: 'var(--gold)', fontSize: 18, cursor: 'pointer', fontWeight: 900 }}
              aria-label="Dismiss"
              onClick={() => setShowFreeBanner(false)}
            >×</button>
          </div>
        )}
        {!isAdmin && user?.subscriptionStatus === "trial" && trialActive && showTrialBanner && (
          isMobile ? (
            <div style={{
              margin: '8px 12px 0',
              padding: '6px 10px',
              borderRadius: 20,
              border: '1px solid var(--accent)',
              background: 'var(--accent-deep)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              opacity: trialBannerOpacity,
              transition: 'opacity 0.4s ease'
            }}>
              <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Trial active{trialEndLabel ? ` · ends ${trialEndLabel}` : ""}
              </span>
              {!reviewAccessEnabled && (
                <button
                  type="button"
                  onClick={openUpgradeFlow}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  Upgrade
                </button>
              )}
              <button
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 16, cursor: 'pointer', fontWeight: 900, lineHeight: 1, flexShrink: 0, padding: '0 2px' }}
                aria-label="Dismiss"
                onClick={dismissTrialBanner}
              >×</button>
            </div>
          ) : (
            <div style={{
              margin: '0 auto',
              marginTop: 12,
              width: "min(calc(100% - 16px), 760px)",
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px solid var(--accent)',
              background: 'var(--accent-deep)',
              color: 'var(--accent)',
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1.5,
              position: 'relative',
              boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
              pointerEvents: 'auto',
              opacity: trialBannerOpacity,
              transition: 'opacity 0.4s ease'
            }}>
              <span style={{ fontWeight: 800 }}>
                Pro Trial Active{trialEndLabel ? ` until ${trialEndLabel}` : ""}.
              </span> You currently have full editing access. Upgrade before trial end to avoid moving to Free read-only mode.
              {!reviewAccessEnabled && (
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={openUpgradeFlow}
                  style={{ marginTop: 8, padding: "7px 10px", fontSize: 11, color: "var(--accent)", borderColor: "var(--accent)" }}
                >
                  Manage Subscription
                </button>
              )}
              <button
                style={{ position: 'absolute', top: 8, right: 12, background: 'none', border: 'none', color: 'var(--accent)', fontSize: 18, cursor: 'pointer', fontWeight: 900 }}
                aria-label="Dismiss"
                onClick={dismissTrialBanner}
              >×</button>
            </div>
          )
        )}
      </div>
      {/* Main content area */}
      <div style={{ flex: 1, minWidth: 0, height: "100dvh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div className="menu-glass" style={{ position: "sticky", top: 0, zIndex: 110, background: "var(--bg)", borderBottom: "1px solid color-mix(in srgb, var(--border) 70%, transparent)", paddingTop: isMobile ? "env(safe-area-inset-top, 0px)" : undefined }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: isMobile ? (isCompactMobile ? "6px 8px" : "8px 10px") : "12px 20px 12px", gap: isCompactMobile ? 6 : 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: isCompactMobile ? 8 : 10, minWidth: 0, flex: 1 }}>
              <button
                onClick={() => setTab("dashboard")}
                title="Go to dashboard"
                style={{
                  width: isCompactMobile ? 30 : 34,
                  height: isCompactMobile ? 30 : 34,
                  borderRadius: isCompactMobile ? 15 : 17,
                  border: "1px solid var(--border)",
                  background: "var(--surface-high)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  padding: 0,
                  marginTop: 0
                }}
              >
                <BrandMark size={isCompactMobile ? 17 : 20} />
              </button>
              <div style={{ minWidth: 0, paddingRight: isMobile ? 4 : 0 }}>
                <div style={{ fontSize: isMobile ? (isCompactMobile ? 8 : 9) : 12, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: isCompactMobile ? 0.45 : 0.7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {isAdmin ? "Admin" : (account?.name || currentOrgLabel || "My Khata")}
                </div>
                <div style={{ fontFamily: "var(--font)", fontSize: isMobile ? (isCompactMobile ? 15 : 17) : 24, fontWeight: 700, color: "var(--text)", lineHeight: 1.08, marginTop: isMobile ? 1 : 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {TABS.find(item => item.id === tab)?.label}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: isCompactMobile ? 6 : 8 }}>
              {/* Org switcher — only shown when user has shared orgs */}
              {sharedOrgs.length > 0 && (
                <div style={{ position: "relative" }} ref={orgSwitcherRef}>
                  <button
                    onClick={() => setShowOrgSwitcher(v => !v)}
                    title="Switch Khata"
                    style={{ height: isMobile ? (isCompactMobile ? 30 : 34) : 38, borderRadius: isCompactMobile ? 10 : 11, border: `1px solid ${activeSharedOrgKey ? "var(--accent)" : "color-mix(in srgb, var(--accent) 34%, var(--border))"}`, background: activeSharedOrgKey ? "var(--accent-deep)" : "linear-gradient(180deg, color-mix(in srgb, var(--accent-deep) 92%, var(--surface-high)), color-mix(in srgb, var(--surface-pop) 92%, transparent))", color: activeSharedOrgKey ? "var(--accent)" : "var(--text)", cursor: "pointer", fontSize: isCompactMobile ? 9 : 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 5, padding: isCompactMobile ? "0 9px" : "0 11px", flexShrink: 0, minWidth: isCompactMobile ? 88 : 118, maxWidth: isCompactMobile ? 104 : 152, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", boxShadow: activeSharedOrgKey ? "0 0 0 1px color-mix(in srgb, var(--accent) 22%, transparent)" : "0 6px 16px color-mix(in srgb, var(--accent) 12%, transparent)" }}
                  >
                    <span style={{ width: isCompactMobile ? 6 : 7, height: isCompactMobile ? 6 : 7, borderRadius: 999, background: "var(--accent)", flexShrink: 0 }} />
                    <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {activeSharedOrgKey
                        ? (sharedOrgs.find(o => o.key === activeSharedOrgKey)?.orgName || "Shared")
                        : (isCompactMobile ? "Switch" : "My Khata")}
                    </span>
                    <span style={{ flexShrink: 0, color: activeSharedOrgKey ? "var(--accent)" : "var(--text-dim)" }}>▾</span>
                  </button>
                  {showOrgSwitcher && (
                    <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 11, minWidth: isCompactMobile ? 184 : 210, maxWidth: isCompactMobile ? 220 : 260, boxShadow: "0 10px 28px rgba(15,23,42,0.12)", zIndex: 200, overflow: "hidden" }}>
                      <button
                        onClick={() => { switchToOwnOrg(); setShowOrgSwitcher(false); }}
                        style={{ width: "100%", padding: "9px 12px", textAlign: "left", background: !activeSharedOrgKey ? "var(--accent-deep)" : "transparent", border: "none", color: !activeSharedOrgKey ? "var(--accent)" : "var(--text)", fontSize: 12, fontWeight: !activeSharedOrgKey ? 700 : 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                      >
                        {!activeSharedOrgKey && <span style={{ fontSize: 10 }}>✓</span>}
                        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{account?.name || "My Organization"}</span>
                        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-dim)", fontWeight: 600, flexShrink: 0 }}>Owner</span>
                      </button>
                      <div style={{ height: 1, background: "var(--border)", margin: "0 12px" }} />
                      {sharedOrgs.map(org => (
                        <button
                          key={org.key}
                          onClick={() => { switchToSharedOrg(org.key); setShowOrgSwitcher(false); }}
                          style={{ width: "100%", padding: "9px 12px", textAlign: "left", background: activeSharedOrgKey === org.key ? "var(--accent-deep)" : "transparent", border: "none", color: activeSharedOrgKey === org.key ? "var(--accent)" : "var(--text)", fontSize: 12, fontWeight: activeSharedOrgKey === org.key ? 700 : 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                        >
                          {activeSharedOrgKey === org.key && <span style={{ fontSize: 10 }}>✓</span>}
                          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{org.orgName || "Organization"}</span>
                          <span style={{ marginLeft: "auto", fontSize: 10, color: activeSharedOrgKey === org.key ? "var(--accent)" : "var(--text-dim)", fontWeight: 600, textTransform: "capitalize", flexShrink: 0 }}>{org.role}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => setShowReminders(true)}
                title="Open reminders"
                style={{ width: isMobile ? (isCompactMobile ? 28 : 32) : 36, height: isMobile ? (isCompactMobile ? 28 : 32) : 36, borderRadius: isCompactMobile ? 9 : 10, border: "1px solid var(--border)", background: "var(--surface-high)", color: inboxReminders.length ? "var(--gold)" : "var(--text-sec)", cursor: "pointer", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                  <Bell size={isMobile ? (isCompactMobile ? 13 : 14) : 16} strokeWidth={2} />
                {inboxReminders.length > 0 && (
                    <span style={{ position: "absolute", top: isCompactMobile ? -4 : -5, right: isCompactMobile ? -4 : -5, minWidth: isCompactMobile ? 15 : 18, height: isCompactMobile ? 15 : 18, borderRadius: 9, background: "var(--danger)", color: "#fff", fontSize: isCompactMobile ? 8 : 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                    {inboxReminders.length}
                  </span>
                )}
              </button>
              <div style={{ position: "relative" }} ref={headerMenuRef}>
                <button
                  onClick={() => setShowHeaderMenu(value => !value)}
                  title="More options"
                  style={{ width: isMobile ? (isCompactMobile ? 28 : 32) : 36, height: isMobile ? (isCompactMobile ? 28 : 32) : 36, borderRadius: isCompactMobile ? 9 : 10, border: "1px solid var(--border)", background: "var(--surface-high)", color: "var(--text-sec)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                >
                  <MoreHorizontal size={isMobile ? (isCompactMobile ? 13 : 14) : 16} strokeWidth={2} />
                </button>
                {showHeaderMenu && (
                  <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, minWidth: 168, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 10px 24px rgba(0,0,0,0.18)", overflow: "hidden", zIndex: 220 }}>
                    <button
                      onClick={() => {
                        setShowHeaderMenu(false);
                        handleNavigate({ tab: "settings", screen: "main" });
                      }}
                      style={{ width: "100%", padding: "11px 14px", textAlign: "left", background: "transparent", border: "none", color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <Settings size={15} strokeWidth={2} />
                      Settings
                    </button>
                    <div style={{ height: 1, background: "var(--border)", margin: "0 12px" }} />
                    <button
                      onClick={() => {
                        setShowHeaderMenu(false);
                        if (window.confirm("Sign out of EazyKhata?")) logout();
                      }}
                      style={{ width: "100%", padding: "11px 14px", textAlign: "left", background: "transparent", border: "none", color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <LogOut size={15} strokeWidth={2} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Invite banners — shown when pending invitations exist */}
        <PendingInviteBanner />

        {/* Shared-org context strip — shown when viewing someone else's org */}
        {activeSharedOrgKey && (() => {
          const org = sharedOrgs.find(o => o.key === activeSharedOrgKey);
          return org ? (
            <div style={{ background: "var(--surface-high)", borderBottom: "1px solid var(--border)", padding: isCompactMobile ? "6px 10px" : "7px 18px", display: "flex", alignItems: "center", gap: isCompactMobile ? 8 : 10, fontSize: isCompactMobile ? 11 : 12 }}>
              <span style={{ color: "var(--text-dim)" }}>Viewing</span>
              <span style={{ fontWeight: 700, color: "var(--text)" }}>{org.orgName}</span>
              {(() => { const liveRole = activeSharedOrgRole ?? org.role ?? "viewer"; return (
              <span style={{ padding: "2px 8px", borderRadius: 6, background: liveRole === "admin" ? "var(--accent-deep)" : "var(--surface)", color: liveRole === "admin" ? "var(--accent)" : "var(--text-dim)", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>{liveRole}</span>
              ); })()}
              <button onClick={() => { switchToOwnOrg(); }} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text-sec)", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>← Back to my org</button>
            </div>
          ) : null;
        })()}

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", padding: isMobile ? (isCompactMobile ? "8px 6px calc(env(safe-area-inset-bottom, 0px) + 82px)" : "10px 8px calc(env(safe-area-inset-bottom, 0px) + 92px)") : "14px 18px 104px" }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div
        className="app-bottom-nav menu-glass"
        style={{ gridTemplateColumns: `repeat(${Math.max(footerTabs.length, 1)}, minmax(0, 1fr))` }}
      >
          {footerTabs.map(tabItem => {
            const active = tab === tabItem.id;
            const activeColor = TAB_COLOR[tabItem.id] || "var(--accent)";
            const IconComponent = TAB_ICONS[tabItem.id];
            return (
              <button
                key={tabItem.id}
                type="button"
                className={`app-bottom-nav-btn${active ? " active" : ""}`}
                onClick={() => (tabItem.id === "org" || tabItem.id === "settings") ? handleNavigate({ tab: tabItem.id, screen: "main" }) : setTab(tabItem.id)}
                style={active ? { color: activeColor } : undefined}
              >
                <span className="app-bottom-nav-icon" style={active ? { color: activeColor, borderColor: `color-mix(in srgb, ${activeColor} 40%, var(--border))`, background: `color-mix(in srgb, ${activeColor} 12%, var(--surface-high))` } : undefined}>
                  {IconComponent ? <IconComponent size={14} strokeWidth={active ? 2.5 : 2} /> : "•"}
                </span>
                <span className="app-bottom-nav-label">{tabItem.label}</span>
              </button>
            );
          })}
      </div>

      {readOnlyNotice && (
        <div style={{ position: "fixed", left: 16, right: 16, bottom: bottomNoticeBase, zIndex: 140, display: "flex", justifyContent: "center" }}>
          <div style={{ maxWidth: 520, width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--gold)", background: "var(--gold-deep)", color: "var(--gold)", fontSize: 13, fontWeight: 700, boxShadow: "0 10px 24px rgba(0,0,0,0.25)" }}>
            {readOnlyNotice.message}
          </div>
        </div>
      )}

      {successNotice && (
        <div style={{ position: "fixed", left: 16, right: 16, bottom: readOnlyNotice ? "calc(env(safe-area-inset-bottom, 0px) + 156px)" : bottomNoticeBase, zIndex: 142, display: "flex", justifyContent: "center" }}>
          <div style={{ maxWidth: 560, width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--accent)", background: "var(--accent-deep)", color: "var(--accent)", boxShadow: "0 10px 24px rgba(0,0,0,0.25)", display: "flex", gap: 10, alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", flexDirection: isMobile ? "column" : "row" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{successNotice.title}</div>
              <div style={{ fontSize: 12, marginTop: 3, color: "var(--text-sec)", lineHeight: 1.45 }}>{successNotice.message}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, width: isMobile ? "100%" : "auto" }}>
              {successNotice.target && (
                <button
                  className="btn-secondary"
                  type="button"
                  style={{ padding: "8px 10px", fontSize: 12, color: "var(--accent)", flex: isMobile ? 1 : "unset" }}
                  onClick={() => {
                    handleNavigate(successNotice.target);
                    setSuccessNotice(null);
                  }}
                >
                  {successNotice.actionLabel}
                </button>
              )}
              <button className="btn-secondary" type="button" style={{ padding: "8px 10px", fontSize: 12, flex: isMobile ? 1 : "unset" }} onClick={() => setSuccessNotice(null)}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}



      {showReminders && (
        <Modal title="Reminders" onClose={() => setShowReminders(false)} onSave={clearAllReminders} saveLabel="Clear All" canSave={liveReminders.length > 0} accentColor="var(--gold)">
          <div className="card">
            {inboxReminders.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", fontSize: 14, color: "var(--text-dim)" }}>No unread reminders right now.</div>
            ) : (
              inboxReminders.map(reminder => (
                <div key={reminder.id} className="card-row" style={{ alignItems: "flex-start", gap: 12, cursor: "pointer" }} onClick={() => openReminder(reminder)}>
                  <div style={{ width: 10, height: 10, borderRadius: 999, background: reminder.tone === "danger" ? "var(--danger)" : "var(--gold)", marginTop: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: reminder.tone === "danger" ? "var(--danger)" : "var(--gold)" }}>{reminder.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 4, lineHeight: 1.5 }}>{reminder.message}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button className="btn-secondary" style={{ padding: "8px 12px", fontSize: 12 }} onClick={event => { event.stopPropagation(); dismissReminder(reminder.id); }}>Dismiss</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}

      {idleWarning && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--surface)", borderRadius: 18, padding: "32px 28px", maxWidth: 380, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.45)", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Session Expiring</div>
            <div style={{ fontSize: 14, color: "var(--text-sec)", lineHeight: 1.6, marginBottom: 24 }}>
              You&apos;ve been inactive for a while. For your security, you&apos;ll be signed out in{" "}
              <span style={{ fontWeight: 800, color: "var(--danger)" }}>{idleCountdown}s</span>.
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={handleIdleLogout}
                style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface-high)", color: "var(--text-sec)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
              >
                Sign Out
              </button>
              <button
                onClick={handleStayLoggedIn}
                style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}
              >
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
