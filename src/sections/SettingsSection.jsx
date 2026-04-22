import React, { useCallback, useEffect, useMemo, useState } from "react";
import { isNative } from "../utils/native";
import { supportApi, adminApi, societyApi, orgsApi } from "../lib/api";
import { logError } from "../utils/logger";
import PlanRequestModal from "./settings/PlanRequestModal";
import NotificationsModal from "./settings/NotificationsModal";
import SupportModal, { SUPPORT_TOPIC_OPTIONS } from "./settings/SupportModal";
import ProfileModal from "./settings/ProfileModal";
import AccountModal from "./settings/AccountModal";
import OrganizationSwitcherModal from "../components/OrganizationSwitcherModal";
import CustomersScreen from "./settings/CustomersScreen";
import SocietyPortalScreen from "./settings/SocietyPortalScreen";
import AuditLogScreen from "./settings/AuditLogScreen";
import OrgMembersScreen from "./settings/OrgMembersScreen";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useTheme } from "../context/ThemeContext";
import { callAuthedFunction as callFunction } from "../utils/functionsClient";
import { loadRazorpay } from "../utils/razorpay";
import { Modal, Field, Input, Textarea, Select, CurrencyPicker, Avatar, DateSelectInput, DeleteBtn, fmtMoney, MONTHS, MonthSelectInput, UpgradeModal, EmptyState, ToastNotice, SectionSkeleton } from "../components/UI";
import { downloadMonthlyReport, downloadAdminMonthlyReport, downloadFinancialYearReport } from "../utils/reportGen";
import { downloadCSV, generateIncomeCSV, generateExpensesCSV, generateCollectionsCSV } from "../utils/csvGen";
import {
  isOptionalEmail,
  isOptionalPhone,
  isValidDateValue,
  isValidEmail,
  isValidGstin,
  isValidName,
  isValidPhone,
  normalizeEmail,
  sanitizePhone
} from "../utils/validator";
import {
  buildDateOfBirthFromParts,
  buildLocationLabel,
  buildPhoneNumber,
  DEFAULT_PHONE_COUNTRY_CODE,
  getBirthDayOptions,
  getBirthYearOptions,
  getStateProvinceOptions,
  getAgeGroupFromDateOfBirth,
  isValidDateOfBirth,
  isValidUserPhoneNumber,
  parseLocationFields,
  parseDateOfBirthParts,
  sanitizePhoneDigits,
  splitPhoneNumber
} from "../utils/profile";
import {
  BILLING_CYCLES,
  PAYMENT_REQUEST_STATUS,
  UPI_CONFIG,
  canUseFeature,
  canChangeOrgType as canChangeOrgTypeFn,
  formatSubscriptionDate,
  getBillingAmount,
  getUserPlan,
  getPlanSummary,
  getUpgradeCopy,
  isReviewAccessEnabled,
  isPaidActive,
  PLAN_LABELS,
  PLANS
} from "../utils/subscription";
import { APP_SUPPORT_EMAIL, APP_UPGRADE_URL } from "../utils/brand";
import { LEGAL_PATHS } from "../utils/legal";
import { ORG_TYPE_OPTIONS, ORG_TYPES, getOrgConfig, getOrgType, getSelectableOrgTypeOptions } from "../utils/orgTypes";

function getCurrentFinancialYearStart(date = new Date()) {
  return date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
}

const APARTMENT_IMPORT_TYPES = ["flat", "collection", "expense", "opening_balance", "due"];
const APARTMENT_IMPORT_TEMPLATE_HEADERS = [
  "record_type",
  "flat_number",
  "name",
  "owner_name",
  "phone",
  "email",
  "date",
  "month",
  "amount",
  "category",
  "payment_mode",
  "reference_no",
  "paid_to",
  "note"
];

function normalizeImportKey(value = "") {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function parseCsvLine(line = "") {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current);
  return values.map(item => String(item || "").trim());
}

function parseApartmentImportCsv(text = "") {
  const lines = String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  if (!lines.length) return { headers: [], rows: [] };

  const headers = parseCsvLine(lines[0]).map(normalizeImportKey);
  const rows = lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const record = {};
    headers.forEach((header, columnIndex) => {
      record[header] = String(values[columnIndex] || "").trim();
    });
    return { rowNumber: index + 2, raw: record };
  });
  return { headers, rows };
}

function isValidMonthValue(value = "") {
  return /^\d{4}-\d{2}$/.test(String(value || "").trim());
}

function normalizeSupportMessages(ticket) {
  const baseMessages = Array.isArray(ticket?.messages) ? ticket.messages : [];
  if (baseMessages.length) return baseMessages;
  const fallbackMessage = String(ticket?.message || "").trim();
  if (!fallbackMessage) return [];
  return [
    {
      id: `${ticket?.id || "ticket"}-initial`,
      senderRole: "user",
      senderId: ticket?.userId || "",
      senderName: ticket?.userName || "User",
      message: fallbackMessage,
      createdAt: ticket?.createdAt || ""
    }
  ];
}

function buildSocietyPortalId(ownerId = "", orgId = "") {
  return `portal_${String(ownerId || "").trim()}_${String(orgId || "").trim()}`;
}

function normalizeInviteCode(value = "") {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
}

function createInviteCode() {
  return normalizeInviteCode(Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-2));
}

function flatDueDocId(flatNumber = "") {
  return String(flatNumber || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "-");
}

function createEmptyServiceProduct() {
  return {
    id: `product-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    productName: "",
    productType: "unit",
    unit: "pcs",
    price: "",
    quantity: "",
    lowStockAt: "10"
  };
}

function normalizeServiceProducts(products = []) {
  return products
    .map(product => ({
      id: product.id || `product-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      productName: String(product.productName || "").trim(),
      productType: String(product.productType || "unit").trim().toLowerCase() === "weight" ? "weight" : "unit",
      unit: String(product.unit || "").trim(),
      price: String(product.price || "").trim(),
      quantity: String(product.quantity || "").trim(),
      lowStockAt: String(product.lowStockAt || "").trim()
    }))
    .map(product => ({
      ...product,
      unit: product.unit || (product.productType === "weight" ? "kg" : "pcs"),
      lowStockAt: product.lowStockAt !== "" ? product.lowStockAt : (product.productType === "weight" ? "2" : "10")
    }))
    .filter(product => product.productName && Number(product.price || 0) > 0 && product.quantity !== "" && Number(product.quantity || 0) >= 0 && Number(product.lowStockAt || 0) >= 0);
}

function buildAccountFormState(account, user) {
  const parsedLocation = parseLocationFields(account?.location || account?.address || "");
  const phoneParts = splitPhoneNumber(account?.phone || user?.phone || "", account?.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE);
  const addressLine = account?.addressLine || parsedLocation.addressLine || "";
  const city = account?.city || parsedLocation.city || "";
  const state = account?.state || parsedLocation.state || "";
  const country = account?.country || parsedLocation.country || "India";
  const location = account?.location || buildLocationLabel({ city, state, country });
  return {
    name: account?.name || "",
    email: account?.email || user?.email || "",
    phone: account?.phone || user?.phone || "",
    phoneCountryCode: account?.phoneCountryCode || phoneParts.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE,
    phoneNumber: phoneParts.phoneNumber,
    addressLine,
    city,
    state,
    country,
    location,
    address: account?.address || buildLocationLabel({ addressLine, city, state, country }),
    gstin: account?.gstin || "",
    showHSN: account?.showHSN ?? true,
    organizationType: getOrgType(account?.organizationType || user?.organizationType)
  };
}

function buildCustomerFormState(customer = {}, orgType = "") {
  const parsedLocation = parseLocationFields(customer?.location || customer?.address || "");
  const country = customer?.country || parsedLocation.country || "India";
  const phoneParts = splitPhoneNumber(customer?.phone || "", customer?.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE);
  const addressLine = customer?.addressLine || parsedLocation.addressLine || "";
  return {
    ...customer,
    name: customer?.name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    phoneCountryCode: customer?.phoneCountryCode || phoneParts.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE,
    phoneNumber: phoneParts.phoneNumber,
    addressLine,
    city: customer?.city || parsedLocation.city || "",
    state: customer?.state || parsedLocation.state || "",
    country,
    location: customer?.location || buildLocationLabel({
      city: customer?.city || parsedLocation.city || "",
      state: customer?.state || parsedLocation.state || "",
      country
    }),
    address: orgType === "apartment" ? "" : customer?.address || buildLocationLabel({
      addressLine,
      city: customer?.city || parsedLocation.city || "",
      state: customer?.state || parsedLocation.state || "",
      country
    }),
    gstin: customer?.gstin || ""
  };
}

export default function SettingsSection({ navigationTarget, sectionMode = "settings" }) {
  const { user, logout, updateProfile, setUser } = useAuth();
  const {
    loaded,
    account,
    currency,
    setCurrency,
    saveAccount,
    resetForOrgTypeChange,
    customers,
    addCustomer,
    updateCustomer,
    removeCustomer,
    goals,
    saveGoals,
    budgets,
    income,
    addIncome,
    expenses,
    addExpense,
    invoices,
    notificationPrefs,
    saveNotificationPrefs,
    orgRecords,
    addOrgRecord,
    updateOrgRecord,
    removeOrgRecord,
    organizations,
    activeOrgId,
    createOrganization,
    switchOrganization,
    deleteOrganization,
    maxOrganizations,
    canCreateOrganization
  } = useData();
  const { theme, toggle } = useTheme();

  const [screen, setScreen] = useState("main");
  const [custForm, setCustForm] = useState(null);
  const [editCust, setEditCust] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const initialPhoneParts = splitPhoneNumber(user?.phone || "", user?.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE);
  const initialLocationParts = parseLocationFields(user?.location || "");
  const initialDobParts = parseDateOfBirthParts(user?.dateOfBirth || "");
  const [userForm, setUserForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phoneCountryCode: user?.phoneCountryCode || initialPhoneParts.phoneCountryCode,
    phoneNumber: initialPhoneParts.phoneNumber,
    gender: user?.gender || "",
    birthDay: initialDobParts.birthDay,
    birthMonth: initialDobParts.birthMonth,
    birthYear: initialDobParts.birthYear,
    addressLine: user?.addressLine || initialLocationParts.addressLine || "",
    city: user?.city || initialLocationParts.city || "",
    state: user?.state || initialLocationParts.state || "",
    country: user?.country || initialLocationParts.country || "India"
  });
  const [accForm, setAccForm] = useState(buildAccountFormState(account, user));
  const [goalForm, setGoalForm] = useState({
    targetAmount: goals?.targetAmount ?? goals?.monthlySavings ?? "",
    targetDate: goals?.targetDate || "",
    savedAmount: goals?.savedAmount ?? "",
    note: goals?.note || ""
  });
  const [notificationForm, setNotificationForm] = useState(notificationPrefs);
  const [planRequestForm, setPlanRequestForm] = useState({
    billingCycle: BILLING_CYCLES.MONTHLY,
    note: ""
  });
  const [supportForm, setSupportForm] = useState({
    topic: "account",
    subject: "",
    message: ""
  });
  const [supportTickets, setSupportTickets] = useState([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [submittingSupport, setSubmittingSupport] = useState(false);
  const [supportReplyDrafts, setSupportReplyDrafts] = useState({});
  const [replyingTicketId, setReplyingTicketId] = useState("");
  const [supportView, setSupportView] = useState("inbox");
  const [selectedSupportTicketId, setSelectedSupportTicketId] = useState("");
  const [showCurrPicker, setShowCurrPicker] = useState(false);
  const [showOrgSwitcher, setShowOrgSwitcher] = useState(false);
  const [createOrgForm, setCreateOrgForm] = useState({
    name: "",
    organizationType: getOrgType(account?.organizationType || user?.organizationType)
  });
  const [upgradeInfo, setUpgradeInfo] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showReportPicker, setShowReportPicker] = useState(false);
  const [societyPortalMeta, setSocietyPortalMeta] = useState(null);
  const [societyPortalLoading, setSocietyPortalLoading] = useState(false);
  const [societyPortalInvites, setSocietyPortalInvites] = useState([]);
  const [societyPortalForm, setSocietyPortalForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    notice: ""
  });
  const [memberInviteForm, setMemberInviteForm] = useState({
    email: "",
    flatNumber: ""
  });
  const [societyJoinForm, setSocietyJoinForm] = useState({
    inviteCode: ""
  });
  const [orgSectionKey, setOrgSectionKey] = useState("");
  const [orgRecordForm, setOrgRecordForm] = useState(null);
  const [editOrgRecord, setEditOrgRecord] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pendingOrgTypeChange, setPendingOrgTypeChange] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerPage, setCustomerPage] = useState(1);
  const [customerPageSize, setCustomerPageSize] = useState(25);
  const [importCsvText, setImportCsvText] = useState("");
  const [importPreview, setImportPreview] = useState(null);
  const [importingData, setImportingData] = useState(false);
  const [reportForm, setReportForm] = useState(() => {
    const now = new Date();
    return {
      period: "month",
      month: now.getMonth(),
      year: now.getFullYear(),
      financialYearStart: getCurrentFinancialYearStart(now)
    };
  });
  const currentPlan = getUserPlan(user);
  const reviewAccessEnabled = isReviewAccessEnabled();
  const isOrgMode = sectionMode === "org";
  const orgType = getOrgType(accForm.organizationType || account?.organizationType || user?.organizationType);
  const planSummary = getPlanSummary(user, orgType);
  const canChangeOrgType = user?.role === "admin" || canChangeOrgTypeFn(user);
  const isPersonalOrg = orgType === ORG_TYPES.PERSONAL;
  const isApartmentOrg = orgType === ORG_TYPES.APARTMENT;
  const showApartmentWhatsappField = isApartmentOrg;
  const canManageSocietyPortal = Boolean(
    user?.id &&
    user?.role !== "admin" &&
    isApartmentOrg &&
    activeOrgId &&
    canUseFeature(user, "residentPortal")
  );
  const societyPortalId = useMemo(() => buildSocietyPortalId(user?.id, activeOrgId), [activeOrgId, user?.id]);
  const hasMemberPortalAccess = Boolean(user?.societyPortalId && user?.societyPortalRole === "member");
  const showOrgBusinessFields = !isPersonalOrg;
  const showPersonContactFields = orgType !== "apartment" && orgType !== ORG_TYPES.PERSONAL;
  const orgConfig = getOrgConfig(orgType);
  const showFullCustomerForm = showPersonContactFields && !orgConfig.simpleCustomerForm;
  const selectableOrgTypeOptions = useMemo(() => getSelectableOrgTypeOptions(accForm.organizationType || orgType), [accForm.organizationType, orgType]);
  const selectableCreateOrgTypeOptions = useMemo(() => getSelectableOrgTypeOptions(createOrgForm.organizationType), [createOrgForm.organizationType]);

  const [customerInsights, setCustomerInsights] = useState(customers);
  const CUSTOMER_SCREENS = new Set(["customers", "customer-detail", "customer-form"]);
  useEffect(() => {
    // Only fetch when the user actually opens a customer screen — not on settings mount.
    // This prevents triggering a heavy analytics endpoint just by opening settings.
    if (!orgConfig.showCustomerFinancials || !user?.id || !activeOrgId) return;
    if (!CUSTOMER_SCREENS.has(screen)) return;
    let cancelled = false;
    orgsApi.getCustomerInsights(user.id, activeOrgId)
      .then(result => { if (!cancelled) setCustomerInsights(Array.isArray(result) ? result : []); })
      .catch(err => logError("customer insights", err));
    return () => { cancelled = true; };
  }, [activeOrgId, user?.id, orgConfig.showCustomerFinancials, screen]);

  const customerDirectory = useMemo(() => {
    const safeInsights = customerInsights || [];
    const safeCustomers = customers || [];
    if (orgConfig.showCustomerFinancials === false) return safeCustomers;
    // Show any customer that was just added locally but isn't yet in the fetched insights
    const insightIds = new Set(safeInsights.map(c => c.id));
    const pending = safeCustomers.filter(c => c.id && !insightIds.has(c.id));
    return [...safeInsights, ...pending];
  }, [customers, customerInsights, orgConfig.showCustomerFinancials]);
  const filteredCustomerDirectory = useMemo(() => {
    const safeDirectory = customerDirectory || [];
    const needle = customerSearch.trim().toLowerCase();
    if (!needle) return safeDirectory;

    return safeDirectory.filter(customer => {
      const fields = [
        customer.name,
        customer.ownerName,
        customer.tenantName,
        customer.phone,
        customer.email,
        customer.location,
        customer.monthlyMaintenance,
        customer.outstanding,
        customer.totalRevenue
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return fields.includes(needle);
    });
  }, [customerDirectory, customerSearch]);
  const paginatedCustomerDirectory = useMemo(() => {
    const startIndex = (customerPage - 1) * customerPageSize;
    return filteredCustomerDirectory.slice(startIndex, startIndex + customerPageSize);
  }, [customerPage, customerPageSize, filteredCustomerDirectory]);
  const activeOrgSection = useMemo(
    () => (orgConfig.extraSections || []).find(section => section.key === orgSectionKey) || null,
    [orgConfig, orgSectionKey]
  );
  const visibleOrgSections = useMemo(
    () => (orgConfig.extraSections || []).filter(section => !(orgType === ORG_TYPES.PERSONAL && section.key === "loans")),
    [orgConfig.extraSections, orgType]
  );
  const selectedCustomerPayments = useMemo(
    () => selectedCustomer?.payments || [],
    [selectedCustomer]
  );
  const selectedSupportTicket = useMemo(
    () => supportTickets.find(ticket => ticket.id === selectedSupportTicketId) || supportTickets[0] || null,
    [selectedSupportTicketId, supportTickets]
  );
  const stateProvinceOptions = useMemo(() => getStateProvinceOptions(userForm.country), [userForm.country]);
  const orgStateProvinceOptions = useMemo(() => getStateProvinceOptions(accForm.country), [accForm.country]);
  const customerStateProvinceOptions = useMemo(() => getStateProvinceOptions(custForm?.country || "India"), [custForm?.country]);
  const birthYearOptions = useMemo(() => getBirthYearOptions(), []);
  const birthDayOptions = useMemo(() => getBirthDayOptions(userForm.birthMonth, userForm.birthYear), [userForm.birthMonth, userForm.birthYear]);
  const reportYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 8 }, (_, index) => currentYear - index);
  }, []);
  const financialYearOptions = useMemo(() => {
    const currentFinancialYearStart = getCurrentFinancialYearStart(new Date());
    return Array.from({ length: 8 }, (_, index) => currentFinancialYearStart - index);
  }, []);

  function showNotice(message, tone = "danger", title = "") {
    setNotice({ id: Date.now(), message, tone, title });
  }

  const loadSocietyPortalMeta = useCallback(async () => {
    if (!canManageSocietyPortal) {
      setSocietyPortalMeta(null);
      setSocietyPortalInvites([]);
      return;
    }
    setSocietyPortalLoading(true);
    try {
      const portal = await societyApi.getPortal(activeOrgId);
      if (!portal) {
        setSocietyPortalMeta(null);
        setSocietyPortalInvites([]);
        return;
      }
      setSocietyPortalMeta(portal);
      const invites = Array.isArray(portal.invites) ? portal.invites : [];
      setSocietyPortalInvites(invites);
    } catch (err) {
      logError("Society portal load error", err);
      showNotice("Could not load resident access settings right now.");
    } finally {
      setSocietyPortalLoading(false);
    }
  }, [canManageSocietyPortal, activeOrgId]);

  useEffect(() => {
    loadSocietyPortalMeta();
  }, [loadSocietyPortalMeta]);

  async function handleSwitchOrganization(orgId) {
    const res = await switchOrganization(orgId);
    if (res?.error) {
      showNotice(res.error);
      return;
    }
    setShowOrgSwitcher(false);
    setScreen("main");
    showNotice("Khata switched.", "success");
  }

  async function handleDeleteOrganization(orgId) {
    const res = await deleteOrganization(orgId);
    if (res?.error) {
      showNotice(res.error);
      return;
    }
    setShowOrgSwitcher(false);
    setScreen("main");
    showNotice("Khata deleted.", "success");
  }

  async function handleCreateOrganizationWorkspace() {
    showNotice("Single-workspace mode is enabled. Creating additional organizations is disabled.");
  }

  const noticeNode = <ToastNotice notice={notice} onClose={() => setNotice(null)} />;
  const withNotice = node => <>{node}{noticeNode}</>;

  async function confirmOrgTypeChange() {
    if (!pendingOrgTypeChange?.nextAccount) return;
    resetForOrgTypeChange(pendingOrgTypeChange.nextAccount);
    setPendingOrgTypeChange(null);
    showNotice("Khata type changed. Existing records were cleared.", "success");
    setScreen("main");
  }

  function hasExistingOrgTypeData() {
    return Boolean(
      customers.length ||
      income.length ||
      expenses.length ||
      invoices.length ||
      Object.keys(orgRecords || {}).length ||
      Object.keys(budgets || {}).length ||
      Number((goals?.targetAmount ?? goals?.monthlySavings) || 0) > 0 ||
      Number(goals?.savedAmount || 0) > 0 ||
      String(goals?.targetDate || "").trim() ||
      String(goals?.note || "").trim()
    );
  }

  function renderDynamicField(field, value, onChange) {
    const commonProps = {
      value: value || "",
      onChange: event => onChange(event.target.value),
      placeholder: field.placeholder || ""
    };

    if (field.type === "select") {
      return (
        <Select {...commonProps}>
          {(field.options || []).map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      );
    }

    if (field.type === "textarea") {
      return <Textarea {...commonProps} />;
    }

    if (field.type === "date") {
      return <DateSelectInput value={value || ""} onChange={onChange} />;
    }

    if (field.type === "month") {
      return <MonthSelectInput value={value || ""} onChange={onChange} />;
    }

    return <Input {...commonProps} type={field.type || "text"} min={field.type === "number" ? "0" : undefined} step={field.type === "number" ? "0.01" : undefined} />;
  }

  useEffect(() => {
    const nextPhoneParts = splitPhoneNumber(user?.phone || "", user?.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE);
    const nextLocationParts = parseLocationFields(user?.location || "");
    const nextDobParts = parseDateOfBirthParts(user?.dateOfBirth || "");
    setUserForm({
      name: user?.name || "",
      email: user?.email || "",
      phoneCountryCode: user?.phoneCountryCode || nextPhoneParts.phoneCountryCode,
      phoneNumber: nextPhoneParts.phoneNumber,
      gender: user?.gender || "",
      birthDay: nextDobParts.birthDay,
      birthMonth: nextDobParts.birthMonth,
      birthYear: nextDobParts.birthYear,
      addressLine: user?.addressLine || nextLocationParts.addressLine || "",
      city: user?.city || nextLocationParts.city || "",
      state: user?.state || nextLocationParts.state || "",
      country: user?.country || nextLocationParts.country || "India"
    });
  }, [user?.addressLine, user?.city, user?.country, user?.dateOfBirth, user?.email, user?.gender, user?.location, user?.name, user?.phone, user?.phoneCountryCode, user?.state]);

  useEffect(() => {
    if (userForm.state && !stateProvinceOptions.includes(userForm.state)) {
      setUserForm(current => ({ ...current, state: "" }));
    }
  }, [stateProvinceOptions, userForm.state]);

  useEffect(() => {
    if (accForm.state && !orgStateProvinceOptions.includes(accForm.state)) {
      setAccForm(current => ({ ...current, state: "" }));
    }
  }, [accForm.state, orgStateProvinceOptions]);

  useEffect(() => {
    if (!custForm) return;
    if (custForm.state && !customerStateProvinceOptions.includes(custForm.state)) {
      setCustForm(current => ({ ...current, state: "" }));
      return;
    }
  }, [custForm, customerStateProvinceOptions]);

  useEffect(() => {
    if (userForm.birthDay && !birthDayOptions.includes(userForm.birthDay)) {
      setUserForm(current => ({ ...current, birthDay: "" }));
    }
  }, [birthDayOptions, userForm.birthDay]);

  useEffect(() => {
    setAccForm(buildAccountFormState(account, user));
  }, [account, user?.email, user?.organizationType, user?.phone]);

  useEffect(() => {
    setCreateOrgForm(current => ({
      ...current,
      organizationType: getOrgType(account?.organizationType || user?.organizationType)
    }));
  }, [account?.organizationType, user?.organizationType]);

  useEffect(() => {
    setGoalForm({
      targetAmount: goals?.targetAmount ?? goals?.monthlySavings ?? "",
      targetDate: goals?.targetDate || "",
      savedAmount: goals?.savedAmount ?? "",
      note: goals?.note || ""
    });
  }, [goals?.targetAmount, goals?.monthlySavings, goals?.targetDate, goals?.savedAmount, goals?.note]);

  useEffect(() => {
    setNotificationForm(notificationPrefs);
  }, [notificationPrefs]);

  useEffect(() => {
    if (!navigationTarget?.token) return;

    if (navigationTarget.screen === "customers") {
      setScreen("customers");
      return;
    }

    if (navigationTarget.screen === "account") {
      if (user?.role === "admin") {
        setScreen("main");
        return;
      }
      setScreen("account");
      return;
    }

    if (navigationTarget.screen === "org-records" && navigationTarget.orgSectionKey) {
      setOrgSectionKey(navigationTarget.orgSectionKey);
      setOrgRecordForm(null);
      setEditOrgRecord(null);
      setScreen("org-records");
      return;
    }

    if (navigationTarget.screen === "plan-request") {
      setScreen("plan-request");
      return;
    }

    if (navigationTarget.screen === "savings-goal") {
      setScreen("savings-goal");
      return;
    }

    setScreen("main");
  }, [navigationTarget, user?.role]);

  async function saveUserProfile() {
    const cleanName = String(userForm.name || "").trim();
    const cleanEmail = normalizeEmail(user?.email || userForm.email);
    const cleanPhoneNumber = sanitizePhoneDigits(userForm.phoneNumber);
    const cleanPhoneCountryCode = userForm.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE;
    const cleanPhone = buildPhoneNumber(cleanPhoneCountryCode, cleanPhoneNumber);
    const cleanGender = String(userForm.gender || "").trim();
    const cleanDateOfBirth = buildDateOfBirthFromParts({
      birthDay: userForm.birthDay,
      birthMonth: userForm.birthMonth,
      birthYear: userForm.birthYear
    });
    const cleanAddressLine = String(userForm.addressLine || "").trim();
    const cleanCity = String(userForm.city || "").trim();
    const cleanState = String(userForm.state || "").trim();
    const cleanCountry = String(userForm.country || "").trim();
    const cleanLocation = buildLocationLabel({ city: cleanCity, state: cleanState, country: cleanCountry });
    const cleanAddress = buildLocationLabel({ addressLine: cleanAddressLine, city: cleanCity, state: cleanState, country: cleanCountry });

    if (!isValidName(cleanName)) {
      showNotice("Please enter your full name.");
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      showNotice("Please enter a valid email address.");
      return;
    }
    if (!isValidUserPhoneNumber(cleanPhoneNumber)) {
      showNotice("Please enter a valid phone number.");
      return;
    }
    if (cleanDateOfBirth && !isValidDateOfBirth(cleanDateOfBirth)) {
      showNotice("Please enter a valid date of birth.");
      return;
    }
    if (!cleanCity || !cleanState || !cleanCountry) {
      showNotice("Please enter your city, state, and country.");
      return;
    }

    const res = await updateProfile({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      phoneCountryCode: cleanPhoneCountryCode,
      gender: cleanGender,
      dateOfBirth: cleanDateOfBirth,
      ageGroup: getAgeGroupFromDateOfBirth(cleanDateOfBirth),
      addressLine: cleanAddressLine,
      city: cleanCity,
      state: cleanState,
      country: cleanCountry,
      location: cleanLocation,
      address: cleanAddress
    });
    if (res?.error) {
      showNotice(res.error);
      return;
    }

    showNotice("Your personal profile has been updated.", "success");
    setScreen("main");
  }

  const saveAcc = async () => {
    const cleanEmail = showOrgBusinessFields ? normalizeEmail(accForm.email) : "";
    const cleanPhoneNumber = showOrgBusinessFields ? sanitizePhoneDigits(accForm.phoneNumber) : "";
    const cleanPhoneCountryCode = accForm.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE;
    const cleanPhone = buildPhoneNumber(cleanPhoneCountryCode, cleanPhoneNumber);
    const cleanName = String(accForm.name || "").trim();
    const cleanGstin = showOrgBusinessFields ? String(accForm.gstin || "").trim().toUpperCase() : "";
    const cleanAddressLine = String(accForm.addressLine || "").trim();
    const cleanCity = String(accForm.city || "").trim();
    const cleanState = String(accForm.state || "").trim();
    const cleanCountry = String(accForm.country || "").trim();
    const cleanLocation = isApartmentOrg ? cleanAddressLine : buildLocationLabel({ city: cleanCity, state: cleanState, country: cleanCountry });
    const cleanAddress = isApartmentOrg ? cleanAddressLine : buildLocationLabel({ addressLine: cleanAddressLine, city: cleanCity, state: cleanState, country: cleanCountry });
    const cleanOrganizationType = getOrgType(accForm.organizationType);
    const previousOrganizationType = getOrgType(account?.organizationType || user?.organizationType);
    const isOrgTypeChanging = previousOrganizationType !== cleanOrganizationType;

    if (!isValidName(cleanName)) {
      showNotice("Please enter your full name.");
      return;
    }
    if (showOrgBusinessFields && !isValidEmail(cleanEmail)) {
      showNotice("Please enter a valid email address.");
      return;
    }
    if (showOrgBusinessFields && !isValidUserPhoneNumber(cleanPhoneNumber)) {
      showNotice("Please enter a valid phone number.");
      return;
    }
    if (showOrgBusinessFields && !isValidGstin(cleanGstin)) {
      showNotice("Please enter a valid GSTIN or leave it empty.");
      return;
    }
    if (!isApartmentOrg && (!cleanCity || !cleanState || !cleanCountry)) {
      showNotice("Please enter your organization city, state, and country.");
      return;
    }
    if (isApartmentOrg && !cleanAddressLine) {
      showNotice("Please enter the apartment or society address.");
      return;
    }

    const nextAccount = {
      ...account,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      phoneCountryCode: cleanPhoneCountryCode,
      addressLine: cleanAddressLine,
      city: cleanCity,
      state: cleanState,
      country: cleanCountry,
      location: cleanLocation,
      address: cleanAddress,
      gstin: cleanGstin,
      showHSN: showOrgBusinessFields ? Boolean(accForm.showHSN) : false,
      organizationType: cleanOrganizationType
    };

    if (isOrgTypeChanging && hasExistingOrgTypeData()) {
      setPendingOrgTypeChange({
        previousOrganizationType,
        nextOrganizationType: cleanOrganizationType,
        nextAccount
      });
      return;
    }

    saveAccount(nextAccount);
    showNotice("Your organization profile has been updated.", "success");
    setScreen("main");
  };

  function openNewCust() {
    const next = buildCustomerFormState({}, orgType);
    (orgConfig.customerFields || []).forEach(field => {
      next[field.key] = field.type === "select" ? field.options?.[0] || "" : "";
    });
    if (orgType === ORG_TYPES.APARTMENT && account?.monthlyMaintenanceAmount) {
      next.monthlyMaintenance = String(account.monthlyMaintenanceAmount);
    }
    setCustForm(next);
    setEditCust(null);
    setScreen("customer-form");
  }

  function openEditCust(customer) {
    setCustForm(buildCustomerFormState(customer, orgType));
    setEditCust(customer);
    setScreen("customer-form");
  }

  function openCustomerDetail(customer) {
    const detail = orgConfig.showCustomerFinancials === false
      ? customer
      : customerInsights.find(item => item.id === customer.id) || customer;
    setSelectedCustomer(detail);
    setScreen("customer-detail");
  }

  function saveCust() {
    const cleanName = String(custForm?.name || "").trim();
    const cleanEmail = showFullCustomerForm ? normalizeEmail(custForm?.email) : "";
    const canCapturePhone = showPersonContactFields || showApartmentWhatsappField;
    const cleanPhoneNumber = canCapturePhone ? sanitizePhoneDigits(custForm?.phoneNumber) : "";
    const cleanPhoneCountryCode = custForm?.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE;
    const cleanPhone = buildPhoneNumber(cleanPhoneCountryCode, cleanPhoneNumber);
    const cleanAddressLine = showFullCustomerForm ? String(custForm?.addressLine || "").trim() : "";
    const cleanCity = showFullCustomerForm ? String(custForm?.city || "").trim() : "";
    const cleanState = showFullCustomerForm ? String(custForm?.state || "").trim() : "";
    const cleanCountry = showFullCustomerForm ? String(custForm?.country || "").trim() : "";
    const cleanLocation = buildLocationLabel({ city: cleanCity, state: cleanState, country: cleanCountry });
    const cleanAddress = buildLocationLabel({ addressLine: cleanAddressLine, city: cleanCity, state: cleanState, country: cleanCountry });
    const cleanGstin = showFullCustomerForm ? String(custForm?.gstin || "").trim().toUpperCase() : "";

    if (orgType === "apartment") {
      if (!cleanName) {
        showNotice("Please enter the flat number.");
        return;
      }
    } else if (!isValidName(cleanName)) {
      showNotice("Please enter the customer name.");
      return;
    }
    if (showFullCustomerForm && !isOptionalEmail(cleanEmail)) {
      showNotice("Please enter a valid customer email or leave it empty.");
      return;
    }
    const missingRequiredField = (orgConfig.customerFields || []).find(field => field.required && !String(custForm?.[field.key] || "").trim());
    if (missingRequiredField) {
      showNotice(`Please enter ${missingRequiredField.label.toLowerCase()}.`);
      return;
    }
    if (cleanPhone && !isValidUserPhoneNumber(cleanPhoneNumber)) {
      showNotice("Please enter a valid customer phone number or leave it empty.");
      return;
    }
    if (showFullCustomerForm && !isValidGstin(cleanGstin)) {
      showNotice("Please enter a valid GSTIN or leave it empty.");
      return;
    }
    const hasPartialAddress = cleanCity || cleanState;
    if (showFullCustomerForm && hasPartialAddress && (!cleanCity || !cleanState || !cleanCountry)) {
      showNotice("Please complete the address — city, state, and country are all required together.");
      return;
    }
    if (!editCust) {
      if (isApartmentOrg) {
        const flatCount = (customers || []).filter(item => String(item?.name || "").trim()).length;
        if (!canUseFeature(user, "apartmentFlatCreate", { flatCount }, orgType)) {
          setUpgradeInfo(getUpgradeCopy("apartmentFlatCreate", orgType));
          return;
        }
      } else if (!canUseFeature(user, "customerCreate", { customerCount: customers.length, flatCount: customers.length }, orgType)) {
        setUpgradeInfo(getUpgradeCopy("customerCreate", orgType));
        return;
      }
    }

    const payload = {
      name: cleanName,
      email: orgType === "apartment" ? "" : cleanEmail,
      phone: cleanPhone,
      phoneCountryCode: cleanPhone ? cleanPhoneCountryCode : "",
      phoneNumber: cleanPhone ? cleanPhoneNumber : "",
      addressLine: showFullCustomerForm ? cleanAddressLine : "",
      city: showFullCustomerForm ? cleanCity : "",
      state: showFullCustomerForm ? cleanState : "",
      country: showFullCustomerForm ? cleanCountry : "",
      location: showFullCustomerForm ? cleanLocation : "",
      address: showFullCustomerForm ? cleanAddress : "",
      gstin: showFullCustomerForm ? cleanGstin : ""
    };
    (orgConfig.customerFields || []).forEach(field => {
      payload[field.key] = String(custForm?.[field.key] || "").trim();
    });

    if (editCust) updateCustomer({ ...payload, id: editCust.id });
    else addCustomer(payload);
    setScreen("customers");
  }

  function openOrgSection(sectionKey) {
    setOrgSectionKey(sectionKey);
    setOrgRecordForm(null);
    setEditOrgRecord(null);
    setScreen("org-records");
  }

  function openNewOrgRecord() {
    if (!activeOrgSection) return;
    setEditOrgRecord(null);
    const base = activeOrgSection.empty();
    if (activeOrgSection.key === "services") {
      base.products = [createEmptyServiceProduct()];
    }
    setOrgRecordForm(base);
    setScreen("org-record-form");
  }

  function openEditOrgRecord(record) {
    setEditOrgRecord(record);
    setOrgRecordForm({
      ...record,
      products: activeOrgSection?.key === "services"
        ? (Array.isArray(record.products) && record.products.length ? record.products : [createEmptyServiceProduct()])
        : record.products
    });
    setScreen("org-record-form");
  }

  function saveOrgSectionRecord() {
    if (!activeOrgSection || !orgRecordForm) return;

    const requiredField = activeOrgSection.fields.find(field => field.required && !String(orgRecordForm[field.key] || "").trim());
    if (requiredField) {
      showNotice(`Please enter ${requiredField.label.toLowerCase()}.`);
      return;
    }

    const payload = {};
    activeOrgSection.fields.forEach(field => {
      payload[field.key] = String(orgRecordForm[field.key] || "").trim();
    });

    if (activeOrgSection.key === "services") {
      const normalizedProducts = normalizeServiceProducts(orgRecordForm.products || []);
      if (!normalizedProducts.length) {
        showNotice("Please add at least one product with price and quantity for this service.");
        return;
      }
      payload.products = normalizedProducts;
    }

    if (editOrgRecord?.id) updateOrgRecord(activeOrgSection.key, { ...payload, id: editOrgRecord.id });
    else addOrgRecord(activeOrgSection.key, payload);

    setScreen("org-records");
    setOrgRecordForm(null);
    setEditOrgRecord(null);
  }

  function saveGoalSettings() {
    const targetAmount = Number(goalForm.targetAmount || 0);
    const savedAmount = Number(goalForm.savedAmount || 0);
    const targetDate = String(goalForm.targetDate || "").trim();
    const note = String(goalForm.note || "").trim();

    if (!Number.isFinite(targetAmount) || targetAmount < 0) {
      showNotice("Please enter a valid target amount.");
      return;
    }
    if (!Number.isFinite(savedAmount) || savedAmount < 0) {
      showNotice("Please enter a valid saved amount.");
      return;
    }
    if (targetDate && !isValidDateValue(targetDate)) {
      showNotice("Please enter a valid target date.");
      return;
    }
    if ((savedAmount > 0 || targetDate || note) && targetAmount <= 0) {
      showNotice("Set a target amount before adding other goal details.");
      return;
    }
    saveGoals({
      monthlySavings: targetAmount,
      targetAmount,
      targetDate,
      savedAmount,
      note
    });
    showNotice(targetAmount > 0 ? "Savings goal updated." : "Savings goal cleared.", "success");
    setScreen("main");
  }

  function openReportPicker() {
    if (!canUseFeature(user, "reports")) {
      setUpgradeInfo(getUpgradeCopy("reports"));
      return;
    }

    setShowReportPicker(true);
  }

  async function handleReportDownload() {
    if (!canUseFeature(user, "reports")) {
      setUpgradeInfo(getUpgradeCopy("reports"));
      return;
    }

    const year = Number(reportForm.year);
    const month = Number(reportForm.month);
    const financialYearStart = Number(reportForm.financialYearStart);

    setGeneratingReport(true);
    if (user?.role === "admin") {
      try {
        const [usersResult, paymentRequests] = await Promise.all([
          adminApi.listUsers(1, 500),
          adminApi.listPaymentRequests()
        ]);
        await downloadAdminMonthlyReport({ users: usersResult.users || [], paymentRequests: paymentRequests || [] }, year, month, currency?.symbol || "Rs");
        showNotice("Admin report downloaded.", "success");
        setShowReportPicker(false);
      } catch (err) {
        logError("Admin report error", err);
        showNotice(err?.message || "Unable to generate admin report right now.");
      } finally {
        setGeneratingReport(false);
      }

      return;
    }

    try {
      const reportData = { account, currency, customers, income, expenses, invoices, goals, budgets, orgRecords };

      if (reportForm.period === "financial-year") {
        await downloadFinancialYearReport(reportData, financialYearStart, currency?.symbol || "Rs");
      } else {
        await downloadMonthlyReport(reportData, year, month, currency?.symbol || "Rs");
      }

      showNotice("Report downloaded.", "success");
      setShowReportPicker(false);
    } catch (err) {
      logError("Report download error", err);
      showNotice(err?.message || "Unable to generate the report right now.");
    } finally {
      setGeneratingReport(false);
    }
  }

  function handleCSVDownload() {
    const sym = currency?.symbol || "Rs";
    const year = Number(reportForm.year);
    const month = Number(reportForm.month);
    const financialYearStart = Number(reportForm.financialYearStart);

    if (reportForm.period === "financial-year") {
      const startMk = `${financialYearStart}-04`;
      const endMk = `${financialYearStart + 1}-03`;
      const incomeRows = (income || []).filter(r => {
        const mk = (r.date || r.month || "").slice(0, 7);
        return mk >= startMk && mk <= endMk;
      });
      const expenseRows = (expenses || []).filter(r => {
        const mk = (r.date || "").slice(0, 7);
        return mk >= startMk && mk <= endMk;
      });
      const incomeCsv = generateIncomeCSV(incomeRows, sym);
      const expensesCsv = generateExpensesCSV(expenseRows, sym);
      downloadCSV(`income-FY${financialYearStart}-${financialYearStart + 1}.csv`, incomeCsv);
      setTimeout(() => downloadCSV(`expenses-FY${financialYearStart}-${financialYearStart + 1}.csv`, expensesCsv), 300);
    } else {
      const mk = `${year}-${String(month + 1).padStart(2, "0")}`;
      if (isApartmentOrg) {
        const csv = generateCollectionsCSV(income || [], customers || [], sym, mk);
        downloadCSV(`collections-${mk}.csv`, csv);
      } else {
        const incomeRows = (income || []).filter(r => (r.date || r.month || "").startsWith(mk));
        const expenseRows = (expenses || []).filter(r => (r.date || "").startsWith(mk));
        downloadCSV(`income-${mk}.csv`, generateIncomeCSV(incomeRows, sym));
        setTimeout(() => downloadCSV(`expenses-${mk}.csv`, generateExpensesCSV(expenseRows, sym)), 300);
      }
    }
    showNotice("CSV downloaded.", "success");
    setShowReportPicker(false);
  }

  async function saveSocietyPortal() {
    if (!canManageSocietyPortal) return;
    try {
      await societyApi.savePortal(activeOrgId, account?.name || "Society");
      await loadSocietyPortalMeta();
      showNotice("Resident read-only access is saved.", "success");
    } catch (err) {
      logError("Society portal save error", err);
      showNotice("Could not save resident access settings.");
    }
  }

  async function createMemberInvite() {
    const inviteEmail = normalizeEmail(memberInviteForm.email || "");
    const flatNumber = String(memberInviteForm.flatNumber || "").trim().toUpperCase();
    if (!inviteEmail || !isValidEmail(inviteEmail)) {
      showNotice("Enter a valid resident email for this invite.");
      return;
    }
    if (!flatNumber) {
      showNotice("Select a flat number for this resident invite.");
      return;
    }
    try {
      const invite = await societyApi.createInvite(activeOrgId, flatNumber, inviteEmail);
      setMemberInviteForm({ email: "", flatNumber: "" });
      await loadSocietyPortalMeta();
      showNotice(`Invite created for ${flatNumber}. Share code: ${invite.id}`, "success");
    } catch (err) {
      logError("Create member invite error", err);
      showNotice("Could not create resident invite.");
    }
  }

  async function deactivateMemberInvite(inviteCode) {
    try {
      await societyApi.deactivateInvite(inviteCode);
      await loadSocietyPortalMeta();
      showNotice("Invite deactivated.", "success");
    } catch (err) {
      logError("Deactivate invite error", err);
      showNotice("Could not deactivate invite.");
    }
  }

  async function publishSocietyPortalRecords() {
    if (!canManageSocietyPortal) return;
    const period = String(societyPortalForm.month || "").trim();
    if (!/^\d{4}-\d{2}$/.test(period)) {
      showNotice("Choose a valid month before publishing.");
      return;
    }
    const symbol = currency?.symbol || "Rs";
    const flats = (customers || []).filter(item => String(item?.name || "").trim());
    const maintenanceRows = (income || []).filter(item => {
      const itemPeriod = item.collectionMonth || item.month || item.date?.slice(0, 7);
      return itemPeriod === period && String(item.collectionType || "").trim() === "Monthly Maintenance";
    });
    const expenseAmount = (expenses || []).reduce((sum, item) => {
      const itemPeriod = item.month || item.date?.slice(0, 7);
      return itemPeriod === period ? sum + Number(item.amount || 0) : sum;
    }, 0);
    const defaultMonthlyAmount = Number(account?.monthlyMaintenanceAmount || 0);
    const flatRows = flats.map(flat => {
      const flatNumber = String(flat.name || "").trim();
      const expectedAmount = Number(flat.monthlyMaintenance || defaultMonthlyAmount || 0);
      const paidAmount = maintenanceRows
        .filter(item => String(item.flatNumber || "").trim() === flatNumber)
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const pendingAmount = Math.max(0, expectedAmount - paidAmount);
      return {
        flatNumber,
        ownerName: flat.ownerName || "",
        period,
        expectedAmount,
        paidAmount,
        pendingAmount,
        status: pendingAmount <= 0 ? "paid" : paidAmount > 0 ? "partial" : "pending",
        currencySymbol: symbol,
        updatedAt: new Date().toISOString()
      };
    });
    const expectedAmount = flatRows.reduce((sum, row) => sum + Number(row.expectedAmount || 0), 0);
    const collectedAmount = flatRows.reduce((sum, row) => sum + Number(row.paidAmount || 0), 0);
    const pendingAmount = Math.max(0, expectedAmount - collectedAmount);
    const notice = String(societyPortalForm.notice || "").trim();
    try {
      await societyApi.publish(activeOrgId, period, {
        expectedAmount,
        collectedAmount,
        pendingAmount,
        expenseAmount,
        totalFlats: flatRows.length,
        paidFlats: flatRows.filter(row => row.status === "paid").length,
        pendingFlats: flatRows.filter(row => row.status !== "paid").length,
        notice,
        notices: notice ? [notice] : [],
        currencySymbol: symbol
      }, flatRows);
      showNotice(`Published resident records for ${period}.`, "success");
    } catch (err) {
      logError("Society publish error", err);
      showNotice("Could not publish resident records.");
    }
  }

  async function joinSocietyPortalWithInvite() {
    const inviteCode = normalizeInviteCode(societyJoinForm.inviteCode);
    if (!inviteCode) {
      showNotice("Enter invite code shared by your apartment admin.");
      return;
    }
    try {
      const result = await societyApi.join(inviteCode);
      setUser(prev => prev ? ({
        ...prev,
        societyPortalId:   result.societyPortalId,
        societyPortalRole: result.societyPortalRole,
        societyFlatNumber: result.societyFlatNumber,
        societyInviteCode: result.societyInviteCode
      }) : prev);
      setSocietyJoinForm({ inviteCode: "" });
      showNotice("Resident access joined successfully.", "success");
      setScreen("main");
    } catch (err) {
      logError("Join portal error", err);
      showNotice(err.message || "Could not join resident access with this code.");
    }
  }

  async function leaveSocietyPortalAccess() {
    if (!user?.societyPortalId) return;
    try {
      await societyApi.leave();
      setUser(prev => prev ? ({
        ...prev,
        societyPortalId:   "",
        societyPortalRole: "",
        societyFlatNumber: "",
        societyInviteCode: ""
      }) : prev);
      showNotice("You left resident access.", "success");
      setScreen("main");
    } catch (err) {
      logError("Leave portal error", err);
      showNotice("Could not leave resident access right now.");
    }
  }

  async function saveNotificationSettings() {
    if (!canUseFeature(user, "notifications")) {
      setUpgradeInfo(getUpgradeCopy("notifications"));
      return;
    }
    let nextPrefs = { ...notificationForm };

    if (nextPrefs.browserEnabled && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          nextPrefs = { ...nextPrefs, browserEnabled: false };
          showNotice("Browser notifications were not allowed, so in-app reminders will stay active without browser popups.", "warning");
        }
      } else if (Notification.permission !== "granted") {
        nextPrefs = { ...nextPrefs, browserEnabled: false };
        showNotice("Browser notifications are blocked in this browser. You can still use the in-app reminder inbox.", "warning");
      }
    }

    saveNotificationPrefs(nextPrefs);
    showNotice("Notification settings updated.", "success");
    setScreen("main");
  }

  async function submitPlanRequest() {
    // On Android, in-app payments are not allowed (Play Store policy).
    // Send users to the website to complete the upgrade there.
    if (isNative) {
      import("@capacitor/browser").then(({ Browser }) => {
        Browser.open({ url: APP_UPGRADE_URL });
      }).catch(() => {
        window.open(APP_UPGRADE_URL, "_blank");
      });
      setScreen("main");
      return;
    }

    const targetPlan = PLANS.PRO;
    const billingCycle = planRequestForm.billingCycle || BILLING_CYCLES.MONTHLY;
    const cleanNote = planRequestForm.note.trim();

    setSubmittingPayment(true);
    try {
      const RazorpayClass = await loadRazorpay().catch(() => null);
      if (!RazorpayClass) {
        showNotice("Secure checkout is not available right now. Please refresh and try again.");
        return;
      }

      const orderResponse = await callFunction("createUpiSubscriptionOrder", {
        targetPlan,
        billingCycle,
        note: cleanNote
      });

      const orderData = orderResponse?.data || {};
      if (!orderData?.orderId || !orderData?.keyId) {
        showNotice("Unable to start payment right now. Please try again.");
        return;
      }

      const checkout = new RazorpayClass({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "EazyKhata",
        description: `${PLAN_LABELS[targetPlan] || "Pro"} Subscription`,
        order_id: orderData.orderId,
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
          emi: false,
          paylater: true
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || ""
        },
        notes: {
          userId: user?.id || "",
          targetPlan,
          billingCycle
        },
        modal: {
          ondismiss: () => {
            setSubmittingPayment(false);
            showNotice("Payment cancelled. Your subscription has not changed. You can try again anytime.");
          }
        },
        handler: async response => {
          try {
            await callFunction("verifyUpiSubscriptionPayment", {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature
            });

            // Immediately update user plan in context — no manual refresh needed
            const nowIso = new Date().toISOString();
            const durationDays = billingCycle === BILLING_CYCLES.YEARLY ? 365 : 30;
            const endsAt = new Date(Date.now() + durationDays * 86400000).toISOString();
            setUser(prev => prev ? {
              ...prev,
              plan: targetPlan,
              subscriptionStatus: "active",
              subscriptionEndsAt: endsAt,
              trialEligible: false,
              updatedAt: nowIso
            } : prev);

            setPlanRequestForm({ billingCycle: BILLING_CYCLES.MONTHLY, note: "" });
            setScreen("main");
            showNotice(`Payment successful! ${PLAN_LABELS[targetPlan] || "Pro"} is now active.`, "success");
          } catch (verifyErr) {
            logError("Payment verification error", verifyErr);
            showNotice(verifyErr?.message || "Payment received but activation is pending. Please wait a moment — your plan will update automatically.");
          }
        }
      });

      checkout.on("payment.failed", failure => {
        setSubmittingPayment(false);
        const reason = failure?.error?.description || failure?.error?.reason || "Payment failed.";
        showNotice(`Payment failed: ${reason} Please try again.`);
      });

      checkout.open();
    } catch (err) {
      logError("Payment request error", err);
      if (err?.code === "permission-denied") {
        showNotice("Payment checkout is blocked by server permissions. Please contact support.");
        return;
      }
      showNotice(err?.message || "We couldn't start your payment right now. Please try again.");
    } finally {
      setSubmittingPayment(false);
    }
  }

  async function copySupportEmail() {
    try {
      await navigator.clipboard.writeText(APP_SUPPORT_EMAIL);
      showNotice("Support email copied.", "success");
    } catch (err) {
      showNotice(`Copy failed. Please use this email manually: ${APP_SUPPORT_EMAIL}`);
    }
  }

  function emailPaymentProof() {
    const amount = getBillingAmount(planRequestForm.billingCycle || BILLING_CYCLES.MONTHLY, PLANS.PRO, orgType);
    const subject = encodeURIComponent(`EazyKhata payment proof - ${user?.name || "Customer"}`);
    const body = encodeURIComponent(
      `Hello,\n\nI have completed the UPI payment for EazyKhata.\n\nPlan: Pro\nBilling cycle: ${planRequestForm.billingCycle || BILLING_CYCLES.MONTHLY}\nAmount: Rs ${amount}\nTransaction ID: ${planRequestForm.transactionId || ""}\n\nPlease find my payment screenshot attached.\n\nThanks.`
    );
    window.location.href = `mailto:${APP_SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  }

  function buildSupportContext() {
    return [
      `User: ${user?.name || "--"}`,
      `Email: ${user?.email || "--"}`,
      `Role: ${user?.role || "user"}`,
      `Plan: ${planSummary.title || user?.plan || "--"}`,
      `Organization: ${account?.name || "--"}`,
      `Usage type: ${orgConfig.profileNameLabel || orgType || "--"}`
    ].join("\n");
  }

  function openSupportComposer() {
    const topicLabel = SUPPORT_TOPIC_OPTIONS.find(([value]) => value === supportForm.topic)?.[1] || "Customer support";
    const subject = encodeURIComponent(String(supportForm.subject || `${topicLabel} - ${user?.name || "Customer"}`).trim());
    const message = String(supportForm.message || "").trim();
    const body = encodeURIComponent(
      `Hello EazyKhata Support,\n\nTopic: ${topicLabel}\n\n${message ? `${message}\n\n` : ""}Support context:\n${buildSupportContext()}\n\nPlease help me with this issue.\n`
    );
    window.location.href = `mailto:${APP_SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  }

  async function copySupportContext() {
    try {
      await navigator.clipboard.writeText(buildSupportContext());
      showNotice("Support context copied.", "success");
    } catch (err) {
      showNotice("Copy failed. You can still use the email action below.");
    }
  }

  async function loadSupportTickets() {
    if (!user?.id || user?.role === "admin") return;
    setSupportLoading(true);
    try {
      const tickets = await supportApi.list();
      setSupportTickets(
        tickets
          .map(t => ({ ...t, messages: normalizeSupportMessages(t) }))
          .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
      );
    } catch (err) {
      logError("Support ticket load error", err);
      showNotice("We couldn't load your support tickets right now.");
      setSupportTickets([]);
    } finally {
      setSupportLoading(false);
    }
  }

  async function submitSupportTicket() {
    const topic = String(supportForm.topic || "other").trim();
    const subject = String(supportForm.subject || "").trim() || `${SUPPORT_TOPIC_OPTIONS.find(([value]) => value === topic)?.[1] || "Customer support"} - ${user?.name || "Customer"}`;
    const message = String(supportForm.message || "").trim();

    if (!message) {
      showNotice("Please describe the issue before submitting a support ticket.");
      return;
    }

    setSubmittingSupport(true);
    try {
      await supportApi.create({
        subject,
        message,
        topic,
        userName: user?.name || "",
        userEmail: user?.email || "",
        organizationName: account?.name || "",
        activeOrgId: activeOrgId || "",
        supportContext: buildSupportContext()
      });
      showNotice("Support ticket submitted.", "success");
      setSupportForm({ topic: "account", subject: "", message: "" });
      await loadSupportTickets();
    } catch (err) {
      logError("Support ticket submit error", err);
      showNotice(err?.message || "We couldn't submit your support ticket right now.");
    } finally {
      setSubmittingSupport(false);
    }
  }

  async function sendSupportReply(ticket) {
    const draft = String(supportReplyDrafts?.[ticket.id] || "").trim();
    if (!draft) {
      showNotice("Write a reply before sending.");
      return;
    }
    setReplyingTicketId(ticket.id);
    try {
      await supportApi.reply(ticket.id, draft);
      setSupportReplyDrafts(current => ({ ...current, [ticket.id]: "" }));
      await loadSupportTickets();
      showNotice("Reply sent to support.", "success");
    } catch (err) {
      logError("Support reply error", err);
      showNotice("We couldn't send your reply right now.");
    } finally {
      setReplyingTicketId("");
    }
  }

  function downloadApartmentImportTemplate() {
    const sampleRows = [
      APARTMENT_IMPORT_TEMPLATE_HEADERS.join(","),
      "flat,A-101,A-101,Sushma Reddy,9876543210,sushma@example.com,,,,,,,," ,
      "collection,A-101,,, , ,2026-04-05,2026-04,2500,Monthly Maintenance,upi,UPI-REF-7721,,April collection",
      "expense,,,,,,2026-04-07,,1200,Cleaning,upi,UPI-REF-9102,Cleaning Vendor,Lobby cleaning",
      "opening_balance,A-101,,,,,2026-04-01,,5000,due,,,,Carry-forward due",
      "due,A-101,,,,,2026-04-01,2026-04,2500,Monthly Maintenance,,,,April due pending"
    ];
    const blob = new Blob([sampleRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "apartment_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleApartmentImportFile(event) {
    const file = event?.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = loadEvent => {
      const text = String(loadEvent?.target?.result || "");
      setImportCsvText(text);
      buildApartmentImportPreview(text);
    };
    reader.onerror = () => showNotice("Could not read this file. Please upload a CSV file.");
    reader.readAsText(file);
  }

  function buildApartmentImportPreview(sourceText = importCsvText) {
    const text = String(sourceText || "").trim();
    if (!text) {
      setImportPreview(null);
      return;
    }

    const { headers, rows } = parseApartmentImportCsv(text);
    const errors = [];
    const validRows = [];
    const summary = { flat: 0, collection: 0, expense: 0, opening_balance: 0, due: 0 };

    if (!headers.includes("record_type") && !headers.includes("type")) {
      setImportPreview({
        headers,
        rows: [],
        validRows: [],
        summary,
        errors: [{ rowNumber: 1, message: "Missing required column: record_type" }]
      });
      return;
    }

    rows.forEach(row => {
      const recordType = normalizeImportKey(row.raw.record_type || row.raw.type);
      const flatNumber = String(row.raw.flat_number || row.raw.flat || row.raw.name || "").trim().toUpperCase();
      const amount = Number(row.raw.amount || 0);
      const date = String(row.raw.date || "").trim();
      const month = String(row.raw.month || "").trim();

      if (!APARTMENT_IMPORT_TYPES.includes(recordType)) {
        errors.push({ rowNumber: row.rowNumber, message: `Unsupported record_type: ${recordType || "--"}` });
        return;
      }
      if (recordType !== "expense" && !flatNumber) {
        errors.push({ rowNumber: row.rowNumber, message: "Flat number is required for this record_type." });
        return;
      }
      if ((recordType === "collection" || recordType === "expense" || recordType === "opening_balance" || recordType === "due") && !(amount > 0)) {
        errors.push({ rowNumber: row.rowNumber, message: "Amount must be greater than 0." });
        return;
      }
      if (recordType === "collection" || recordType === "expense" || recordType === "opening_balance" || recordType === "due") {
        const dateToCheck = date || (isValidMonthValue(month) ? `${month}-01` : "");
        if (!isValidDateValue(dateToCheck)) {
          errors.push({ rowNumber: row.rowNumber, message: "Provide a valid date (YYYY-MM-DD) or month (YYYY-MM)." });
          return;
        }
      }

      summary[recordType] += 1;
      validRows.push({ ...row, recordType, flatNumber, amount, date, month });
    });

    setImportPreview({ headers, rows, validRows, summary, errors });
  }

  function applyApartmentImport() {
    if (!importPreview?.validRows?.length) {
      showNotice("No valid rows to import. Please check your file and preview.");
      return;
    }

    setImportingData(true);
    try {
      const flatByName = new Map((customers || []).map(flat => [String(flat?.name || "").trim().toUpperCase(), flat]));
      const initialFlatCount = Array.from(flatByName.values()).filter(flat => String(flat?.name || "").trim()).length;
      let createdFlats = 0;
      let updatedFlats = 0;
      let importedCollections = 0;
      let importedExpenses = 0;
      const canCreateAnotherFlat = () => canUseFeature(user, "apartmentFlatCreate", { flatCount: initialFlatCount + createdFlats }, orgType);

      importPreview.validRows.forEach(row => {
        if (row.recordType === "flat") {
          const existing = flatByName.get(row.flatNumber);
          const basePayload = {
            name: row.flatNumber,
            ownerName: String(row.raw.owner_name || "").trim(),
            phone: String(row.raw.phone || "").trim(),
            email: String(row.raw.email || "").trim(),
            monthlyMaintenance: String(row.raw.monthly_maintenance || "").trim(),
            openingBalance: String(row.raw.opening_balance || "").trim()
          };
          if (existing) {
            updateCustomer({ ...existing, ...basePayload, id: existing.id });
            updatedFlats += 1;
          } else {
            if (!canCreateAnotherFlat()) {
              throw new Error(getUpgradeCopy("apartmentFlatCreate").message || "Flat limit reached for current plan.");
            }
            addCustomer(basePayload);
            createdFlats += 1;
            flatByName.set(row.flatNumber, { ...basePayload, name: row.flatNumber });
          }
          return;
        }

        if (row.recordType === "opening_balance" || row.recordType === "due") {
          const existing = flatByName.get(row.flatNumber);
          const balancePayload = row.recordType === "opening_balance"
            ? { openingBalance: String(row.amount), openingBalanceDate: row.date || `${row.month}-01` }
            : { pendingDueAmount: String(row.amount), pendingDueMonth: row.month || (row.date ? row.date.slice(0, 7) : "") };
          if (existing?.id) {
            updateCustomer({ ...existing, ...balancePayload, id: existing.id });
            updatedFlats += 1;
          } else {
            if (!canCreateAnotherFlat()) {
              throw new Error(getUpgradeCopy("apartmentFlatCreate").message || "Flat limit reached for current plan.");
            }
            const createdPayload = { name: row.flatNumber, ...balancePayload };
            addCustomer(createdPayload);
            createdFlats += 1;
            flatByName.set(row.flatNumber, createdPayload);
          }
          return;
        }

        if (row.recordType === "collection") {
          const collectionDate = row.date || `${row.month}-01`;
          addIncome({
            label: String(row.raw.label || `Imported Collection - ${row.flatNumber}`).trim(),
            amount: Number(row.amount),
            date: collectionDate,
            month: row.month || collectionDate.slice(0, 7),
            note: String(row.raw.note || "").trim(),
            flatNumber: row.flatNumber,
            residentName: String(row.raw.owner_name || "").trim(),
            collectionType: String(row.raw.category || "Imported Collection").trim(),
            collectionMonth: row.month || collectionDate.slice(0, 7),
            paymentMode: String(row.raw.payment_mode || "").trim(),
            referenceNo: String(row.raw.reference_no || "").trim()
          });
          importedCollections += 1;
          return;
        }

        if (row.recordType === "expense") {
          const expenseDate = row.date || `${row.month}-01`;
          addExpense({
            label: String(row.raw.label || row.raw.note || "Imported Expense").trim(),
            amount: Number(row.amount),
            date: expenseDate,
            month: expenseDate.slice(0, 7),
            category: String(row.raw.category || "Operations").trim(),
            note: String(row.raw.note || "").trim(),
            paidTo: String(row.raw.paid_to || "").trim(),
            paymentMode: String(row.raw.payment_mode || "").trim(),
            referenceNo: String(row.raw.reference_no || "").trim()
          });
          importedExpenses += 1;
        }
      });

      showNotice(
        `Import complete: ${createdFlats} flat(s) created, ${updatedFlats} flat(s) updated, ${importedCollections} collection(s), ${importedExpenses} expense(s).`,
        "success"
      );
      setImportPreview(null);
      setImportCsvText("");
      setScreen("main");
    } catch (err) {
      logError("Apartment import error", err);
      showNotice("Import failed. Please review the file and try again.");
    } finally {
      setImportingData(false);
    }
  }

  useEffect(() => {
    if (screen !== "support") return;
    loadSupportTickets();
  }, [screen, user?.id]);

  useEffect(() => {
    if (!supportTickets.length) {
      setSelectedSupportTicketId("");
      return;
    }
    if (!supportTickets.some(ticket => ticket.id === selectedSupportTicketId)) {
      setSelectedSupportTicketId(supportTickets[0].id);
    }
  }, [selectedSupportTicketId, supportTickets]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil((filteredCustomerDirectory || []).length / customerPageSize));
    if (customerPage > totalPages) setCustomerPage(totalPages);
  }, [customerPage, customerPageSize, filteredCustomerDirectory]);

  const MenuRow = ({ icon, label, sub, onClick, color, danger, disabled, badge }) => (
    <div onClick={disabled ? undefined : onClick} className="card-row" style={{ cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.56 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {icon ? <div style={{ width: 36, height: 36, borderRadius: 10, background: danger ? "var(--danger-deep)" : color || "var(--surface-high)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div> : null}
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: danger ? "var(--danger)" : "var(--text)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span>{label}</span>
            {badge && <span className="pill" style={{ background: "var(--surface-pop)", color: "var(--text-sec)" }}>{badge}</span>}
          </div>
          {sub && <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{sub}</div>}
        </div>
      </div>
      {!danger && !disabled && <span style={{ color: "var(--text-dim)", fontSize: 18 }}>{">"}</span>}
    </div>
  );

  if (!loaded) {
    return <SectionSkeleton rows={5} showHero={false} />;
  }

  if (screen === "main") {
    if (isOrgMode && user?.role !== "admin") {
      return withNotice(
        <div className="ledger-screen">
          <div className="ledger-feed-card" style={{ padding: 18, marginBottom: 16 }}>
            <div className="ledger-overline" style={{ marginBottom: 8 }}>
              Active Khata
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, color: "var(--text)", lineHeight: 1.1, marginBottom: 8 }}>{account?.name || "My Khata"}</div>
            <div className="ledger-hero-sub">
              {orgConfig.profileNameLabel} profile, directory, and khata-specific records live here.
            </div>
            {(account?.location || account?.phone || account?.email) && (
              <div className="ledger-inline-note" style={{ marginTop: 12 }}>
                {[account?.location, account?.phone, account?.email].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>

          <div className="ledger-block">
            <div className="ledger-block-header">
              <div className="ledger-block-title">Khata</div>
              <div className="ledger-block-caption">Manage your main workspace, people, reports, and records.</div>
            </div>
            <div className="card">
              <MenuRow icon="B" label="Your Khata" sub={account?.name || `Set up your ${orgConfig.profileNameLabel.toLowerCase()}`} onClick={() => setScreen("account")} />
              {organizations.length > 1 && (
                <MenuRow icon="K" label="Switch Khata" sub={`${organizations.length} Khatas — tap to switch or manage`} onClick={() => setShowOrgSwitcher(true)} />
              )}
              {canCreateOrganization && (
                <MenuRow icon="+" label="New Khata" sub="Create another khata for a different use type" onClick={() => setScreen("create-org")} />
              )}
              <MenuRow icon="C" label={orgConfig.customerLabel} sub={`${customers.length} ${orgConfig.customerEntryLabel.toLowerCase()} saved`} onClick={() => setScreen("customers")} />
              <MenuRow icon="R" label="Reports" sub={generatingReport ? "Generating report..." : (isApartmentOrg ? "Download monthly or yearly society reports" : "Download monthly or financial year reports")} onClick={openReportPicker} />
              {isApartmentOrg && (
                <MenuRow
                  icon="I"
                  label="Import Apartment Data"
                  sub="Upload flats, collections, expenses, dues, and opening balances in one CSV"
                  onClick={() => setScreen("apartment-import")}
                />
              )}
              {isApartmentOrg && (
                <MenuRow
                  icon="M"
                  label="Apartment Resident Portal"
                  badge="Coming Soon"
                  sub="Resident portal is temporarily disabled and will return in a future release."
                  onClick={() => setUpgradeInfo(getUpgradeCopy("residentPortal"))}
                />
              )}
              {visibleOrgSections.map(section => (
                <MenuRow
                  key={section.key}
                  icon="•"
                  label={section.label}
                  sub={`${(orgRecords?.[section.key] || []).length} ${section.entryLabel.toLowerCase()} record(s)`}
                  onClick={() => openOrgSection(section.key)}
                />
              ))}
            </div>
          </div>

          {isPersonalOrg && (
            <div className="ledger-block">
              <div className="ledger-block-header">
                <div className="ledger-block-title">Savings Goal</div>
                <div className="ledger-block-caption">Track one clear savings target alongside your monthly cashflow.</div>
              </div>
              <div className="card">
                <MenuRow
                  icon="G"
                  label="Savings Goal"
                  sub={
                    Number(goals?.targetAmount || 0) > 0
                      ? `Target: ${fmtMoney(Number(goals.targetAmount), currency?.symbol || "Rs")} · Saved: ${fmtMoney(Number(goals.savedAmount || 0), currency?.symbol || "Rs")}`
                      : "Set a target, track progress, and add a note"
                  }
                  onClick={() => setScreen("savings-goal")}
                />
              </div>
            </div>
          )}

          {isApartmentOrg && (
            <div className="ledger-block">
              <div className="ledger-block-header">
                <div className="ledger-block-title">Residents &amp; Access</div>
                <div className="ledger-block-caption">Handle resident visibility, roles, and apartment audit history.</div>
              </div>
              <div className="card">
                <MenuRow icon="T" label="Resident Members" sub="Invite residents and manage their roles" onClick={() => setScreen("org-members")} />
                <MenuRow icon="A" label="Audit Log" sub="See who added or changed what and when" onClick={() => setScreen("audit-log")} />
              </div>
            </div>
          )}

          {showReportPicker && (
            <Modal
              title="Download Report"
              onClose={() => !generatingReport && setShowReportPicker(false)}
              onSave={handleReportDownload}
              saveLabel={generatingReport ? "Generating..." : "Download PDF"}
              canSave={!generatingReport}
              accentColor="var(--blue)"
            >
              <Field label="Report Type" required hint="Choose a single month report or the full April to March financial year.">
                <Select value={reportForm.period} onChange={e => setReportForm(current => ({ ...current, period: e.target.value }))}>
                  <option value="month">Month Report</option>
                  <option value="financial-year">Financial Year Report</option>
                </Select>
              </Field>

              {reportForm.period === "month" ? (
                <>
                  <Field label="Month" required>
                    <Select value={reportForm.month} onChange={e => setReportForm(current => ({ ...current, month: Number(e.target.value) }))}>
                      {MONTHS.map((monthLabel, index) => (
                        <option key={monthLabel} value={index}>{monthLabel}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Year" required>
                    <Select value={reportForm.year} onChange={e => setReportForm(current => ({ ...current, year: Number(e.target.value) }))}>
                      {reportYearOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </Select>
                  </Field>
                </>
              ) : (
                <Field label="Financial Year" required hint="Each financial year runs from April to March.">
                  <Select value={reportForm.financialYearStart} onChange={e => setReportForm(current => ({ ...current, financialYearStart: Number(e.target.value) }))}>
                    {financialYearOptions.map(option => (
                      <option key={option} value={option}>{`FY ${option}-${String(option + 1).slice(-2)} (Apr ${option} - Mar ${option + 1})`}</option>
                    ))}
                  </Select>
                </Field>
              )}

              <div className="ledger-feed-card" style={{ padding: 16 }}>
                <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7 }}>
                  {reportForm.period === "financial-year"
                    ? "This will export one PDF covering the full April to March financial year."
                    : "This will export the selected month as a PDF report."}
                </div>
              </div>
              <button
                className="btn-secondary"
                onClick={handleCSVDownload}
                style={{ width: "100%", marginTop: 4, fontWeight: 700, fontSize: 13 }}
              >
                ↓ Download CSV instead
              </button>
            </Modal>
          )}
        </div>
      );
    }

    return withNotice(
      <div className="ledger-screen">
        <div className="ledger-feed-card" style={{ padding: 18, marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 14 }}>
          <Avatar name={user?.name || "?"} size={48} fontSize={18} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", lineHeight: 1.15 }}>{user?.name}</div>
            <div className="ledger-hero-sub" style={{ marginTop: 4 }}>{user?.phone}</div>
            {user?.location && <div className="ledger-inline-note" style={{ marginTop: 6 }}>{user.location}</div>}
            {user?.dateOfBirth && <div className="ledger-inline-note" style={{ marginTop: 4 }}>DOB {user.dateOfBirth}</div>}
            <div className="ledger-inline-note" style={{ marginTop: 8 }}>{planSummary.title}</div>
            <div className="ledger-inline-note" style={{ marginTop: 4 }}>{planSummary.message}</div>
            {!reviewAccessEnabled && user?.subscriptionStatus === "trial" && user?.subscriptionEndsAt && (
              <div style={{ fontSize: 12, color: "var(--gold)", marginTop: 4 }}>Trial ends on {formatSubscriptionDate(user.subscriptionEndsAt)}</div>
            )}
          </div>
        </div>

        {user?.role === "admin" && (
          <div className="ledger-feed-card" style={{ padding: 16, marginBottom: 16, borderLeft: "4px solid var(--gold)" }}>
            <div className="ledger-block-title">Admin Dashboard</div>
            <div className="ledger-block-caption" style={{ marginTop: 8 }}>
              Your admin dashboard is available from the main tab bar. Use it for user management, subscription approvals, and activity reporting.
            </div>
          </div>
        )}

        {user?.role !== "admin" && (
          <div className="ledger-block">
            <div className="ledger-block-header">
              <div className="ledger-block-title">Plans and access</div>
              <div className="ledger-block-caption">Understand your current access and manage upgrades from one place.</div>
            </div>
            <div className="ledger-feed-card" style={{ padding: 16 }}>
              <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6, marginBottom: 14 }}>
              {isPersonalOrg
                ? "Household Khata is permanently free. All features are included at no cost — no trial, no subscription required."
                : reviewAccessEnabled
                ? "Review mode is active. Reports, alerts, PDF exports, and advanced insights are fully unlocked for users right now, and upgrade requests are disabled."
                : currentPlan === PLANS.PRO && user?.subscriptionStatus === "trial"
                  ? "You are currently exploring Pro on a 30-day free trial. Reports, alerts, PDF exports, and advanced insights are fully unlocked until your trial ends."
                  : "Free plan covers basic bookkeeping. Pro unlocks reports, alerts, PDF exports, advanced insights, and reminders."}
            </div>
            {!isPersonalOrg && (
              <>
                <div className="ledger-feed-card" style={{ padding: 14, background: "var(--surface-high)", marginBottom: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <div className="ledger-overline" style={{ color: reviewAccessEnabled ? "var(--accent)" : "var(--text-dim)", marginBottom: 6 }}>
                        {reviewAccessEnabled ? "Review Access" : "Free"}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>
                        {reviewAccessEnabled ? "All premium features are open for feedback and testing. Users do not need to upgrade or submit payment proof right now." : "Basic bookkeeping, limited invoices/customers, and no reports."}
                      </div>
                    </div>
                    <div>
                      <div className="ledger-overline" style={{ color: reviewAccessEnabled ? "var(--blue)" : "var(--accent)", marginBottom: 6 }}>
                        {reviewAccessEnabled ? "Upgrade Flow" : "Pro"}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>
                        {reviewAccessEnabled ? "Temporarily disabled while you collect product feedback from early users." : "PDF exports, reports, smart alerts, advanced dashboard, and priority business tools. New users get a 30-day free trial, then Rs 69/month or Rs 699/year."}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  className="btn-secondary"
                  style={{ width: "100%", opacity: reviewAccessEnabled ? 0.55 : 1, cursor: reviewAccessEnabled ? "not-allowed" : "pointer" }}
                  onClick={() => {
                    if (!reviewAccessEnabled) setScreen("plan-request");
                  }}
                  disabled={reviewAccessEnabled}
                >
                  {reviewAccessEnabled ? "Manage Subscription Disabled During Review Mode" : "Manage Subscription"}
                </button>
              </>
            )}
          </div>
          </div>
        )}

        <div className="ledger-block">
          <div className="ledger-block-header">
            <div className="ledger-block-title">{user?.role === "admin" ? "Admin Account" : "Account"}</div>
            <div className="ledger-block-caption">Update your identity, currency, and reporting tools.</div>
          </div>
          <div className="card">
            <MenuRow icon="P" label={user?.role === "admin" ? "Admin Account" : "Personal Profile"} sub={user?.name || "Update your sign-in profile"} onClick={() => setScreen("profile")} />
            <MenuRow icon="$" label="Currency" sub={`${currency?.flag} ${currency?.code} - ${currency?.symbol}`} onClick={() => setShowCurrPicker(true)} />
            {user?.role === "admin" && <MenuRow icon="R" label="Reports" sub={generatingReport ? "Generating admin report..." : "Choose a month and year for the admin report PDF"} onClick={openReportPicker} />}
          </div>
        </div>

        <div className="ledger-block">
          <div className="ledger-block-header">
            <div className="ledger-block-title">Preferences</div>
            <div className="ledger-block-caption">Theme, notifications, and support all live here.</div>
          </div>
          <div className="card">
            <div className="card-row">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--surface-high)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{theme === "dark" ? "M" : "S"}</div>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
              </div>
              <button className="theme-toggle" onClick={toggle} />
            </div>
            <MenuRow icon="N" label="Notifications" sub={notificationPrefs?.browserEnabled ? "Browser and in-app reminders enabled" : "Manage in-app reminders and browser alerts"} onClick={() => setScreen("notifications")} />
            {user?.role === "admin" ? (
              <MenuRow
                icon="?"
                label="Support Queue"
                sub="Review and resolve customer support tickets from Support Ops"
                onClick={() => window.dispatchEvent(new CustomEvent("ledger:navigate", { detail: { tab: "adminSupport" } }))}
              />
            ) : (
              <MenuRow icon="?" label="Customer Support" sub="Contact support, report bugs, or share feature requests" onClick={() => setScreen("support")} />
            )}
          </div>
        </div>

        <div className="ledger-block">
          <div className="card">
            <MenuRow icon="O" label="Sign Out" danger onClick={() => { if (window.confirm("Sign out?")) logout(); }} />
          </div>
        </div>
        {showCurrPicker && <CurrencyPicker value={currency} onSelect={cur => { setCurrency(cur); setShowCurrPicker(false); }} onClose={() => setShowCurrPicker(false)} />}
        <OrganizationSwitcherModal
          open={showOrgSwitcher}
          onClose={() => setShowOrgSwitcher(false)}
          organizations={organizations}
          activeOrgId={activeOrgId}
          onSwitch={handleSwitchOrganization}
          onDelete={async (orgId) => { await deleteOrganization(orgId); setShowOrgSwitcher(false); }}
        />
        {showReportPicker && (
          <Modal
            title="Download Report"
            onClose={() => !generatingReport && setShowReportPicker(false)}
            onSave={handleReportDownload}
            saveLabel={generatingReport ? "Generating..." : "Download PDF"}
            canSave={!generatingReport}
            accentColor="var(--blue)"
          >
            {user?.role !== "admin" && (
              <Field label="Report Type" required hint="Choose a single month report or the full April to March financial year.">
                <Select value={reportForm.period} onChange={e => setReportForm(current => ({ ...current, period: e.target.value }))}>
                  <option value="month">Month Report</option>
                  <option value="financial-year">Financial Year Report</option>
                </Select>
              </Field>
            )}

            {user?.role === "admin" || reportForm.period === "month" ? (
              <>
                <Field label="Month" required>
                  <Select value={reportForm.month} onChange={e => setReportForm(current => ({ ...current, month: Number(e.target.value) }))}>
                    {MONTHS.map((monthLabel, index) => (
                      <option key={monthLabel} value={index}>{monthLabel}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Year" required>
                  <Select value={reportForm.year} onChange={e => setReportForm(current => ({ ...current, year: Number(e.target.value) }))}>
                    {reportYearOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Select>
                </Field>
              </>
            ) : (
              <Field label="Financial Year" required hint="Each financial year runs from April to March.">
                <Select value={reportForm.financialYearStart} onChange={e => setReportForm(current => ({ ...current, financialYearStart: Number(e.target.value) }))}>
                  {financialYearOptions.map(option => (
                    <option key={option} value={option}>{`FY ${option}-${String(option + 1).slice(-2)} (Apr ${option} - Mar ${option + 1})`}</option>
                  ))}
                </Select>
              </Field>
            )}

            <div className="ledger-feed-card" style={{ padding: 16 }}>
              <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7 }}>
                {user?.role === "admin"
                  ? "Pick the month and year you want to export for admin activity reporting."
                  : reportForm.period === "financial-year"
                    ? "This will export one PDF covering the full April to March financial year."
                    : "This will export the selected month as a PDF report."}
              </div>
            </div>
            {user?.role !== "admin" && (
              <button
                className="btn-secondary"
                onClick={handleCSVDownload}
                style={{ width: "100%", marginTop: 4, fontWeight: 700, fontSize: 13 }}
              >
                ↓ Download CSV instead
              </button>
            )}
          </Modal>
        )}
      </div>
    );
  }

  if (screen === "org-members") {
    return withNotice(
      <OrgMembersScreen onBack={() => setScreen("main")} />
    );
  }

  if (screen === "audit-log") {
    return withNotice(
      <AuditLogScreen onBack={() => setScreen("main")} />
    );
  }

  if (screen === "account") {
    if (user?.role === "admin") {
      return null;
    }
    return withNotice(
      <AccountModal
        form={accForm}
        onFormChange={setAccForm}
        onSave={saveAcc}
        onClose={() => setScreen("main")}
        orgConfig={orgConfig}
        isApartmentOrg={isApartmentOrg}
        showOrgBusinessFields={showOrgBusinessFields}
        orgStateProvinceOptions={orgStateProvinceOptions}
        selectableOrgTypeOptions={selectableOrgTypeOptions}
        orgType={orgType}
        canChangeOrgType={canChangeOrgType}
        pendingOrgTypeChange={pendingOrgTypeChange}
        onCancelOrgTypeChange={() => setPendingOrgTypeChange(null)}
        onConfirmOrgTypeChange={confirmOrgTypeChange}
      />
    );
  }

  if (screen === "create-org") {
    if (user?.role === "admin") return null;

    const isPaid = isPaidActive(user);
    const hasExistingOrg = organizations.length >= 1;

    // At plan limit (Pro: 2 Khatas max)
    if (!canCreateOrganization) {
      const atProMax = isPaid && organizations.length >= 2;
      return withNotice(
        <Modal title="New Khata" onClose={() => setScreen("main")} onSave={atProMax ? () => setScreen("main") : () => setScreen("plan-request")} saveLabel={atProMax ? "Back" : "Upgrade to Pro — Rs 69/mo"} canSave accentColor="var(--blue)">
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7 }}>
              {atProMax
                ? "You have reached the maximum of 2 Khatas on the Pro plan (one per type)."
                : "Your subscription has ended. Upgrade to Pro to create or manage Khatas."}
            </div>
          </div>
        </Modal>
      );
    }

    // Trial user with 1+ org: show upgrade prompt
    if (!isPaid && hasExistingOrg) {
      return withNotice(
        <Modal title="New Khata" onClose={() => setScreen("main")} onSave={() => setScreen("plan-request")} saveLabel="Upgrade to Pro — Rs 69/mo" canSave accentColor="var(--accent)">
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7 }}>
              Your trial includes 1 Khata. Upgrade to Pro for up to 2 Khatas — one per type (Household, Freelancer, Small Business, Apartment).
            </div>
          </div>
        </Modal>
      );
    }

    // Paid (or trial with 0 orgs): show create form filtered to unowned types
    const ownedTypes = new Set(organizations.map(o => o.organizationType));
    const availableTypes = ORG_TYPE_OPTIONS.filter(o => !ownedTypes.has(o.value));

    async function handleCreateOrg() {
      if (!createOrgForm.name?.trim()) { showNotice("Please enter a name for the new Khata."); return; }
      const res = await createOrganization({
        organizationType: getOrgType(createOrgForm.organizationType),
        name: createOrgForm.name.trim()
      });
      if (res?.error === "UPGRADE_REQUIRED") { setScreen("plan-request"); return; }
      if (res?.error) { showNotice(res.error); return; }
      setScreen("main");
    }

    return withNotice(
      <Modal title="New Khata" onClose={() => setScreen("main")} onSave={handleCreateOrg} saveLabel="Create" canSave={!!createOrgForm.name?.trim()}>
        <Field label="Khata Type" required>
          <Select
            value={createOrgForm.organizationType}
            onChange={e => setCreateOrgForm(f => ({ ...f, organizationType: e.target.value }))}
          >
            {availableTypes.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Name" required>
          <Input
            placeholder="e.g. Reddy Freelance, Lake View Society"
            value={createOrgForm.name || ""}
            onChange={e => setCreateOrgForm(f => ({ ...f, name: e.target.value }))}
          />
        </Field>
        <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6, marginTop: 4 }}>
          You currently have {organizations.length} of {maxOrganizations} Khatas.
        </div>
      </Modal>
    );
  }

  if (screen === "profile") {
    return withNotice(
      <ProfileModal
        form={userForm}
        onFormChange={setUserForm}
        onSave={saveUserProfile}
        onClose={() => setScreen("main")}
        user={user}
      />
    );
  }

  if (screen === "customers" || (screen === "customer-detail" && selectedCustomer) || screen === "customer-form") {
    if (user?.role === "admin") return null;
    return withNotice(
      <CustomersScreen
        screen={screen}
        orgConfig={orgConfig}
        currency={currency}
        customerDirectory={customerDirectory}
        filteredCustomerDirectory={filteredCustomerDirectory}
        paginatedCustomerDirectory={paginatedCustomerDirectory}
        customerSearch={customerSearch}
        onCustomerSearchChange={setCustomerSearch}
        customerPage={customerPage}
        onCustomerPageChange={setCustomerPage}
        customerPageSize={customerPageSize}
        onCustomerPageSizeChange={setCustomerPageSize}
        selectedCustomer={selectedCustomer}
        selectedCustomerPayments={selectedCustomerPayments}
        editCust={editCust}
        custForm={custForm}
        onCustFormChange={setCustForm}
        showPersonContactFields={showPersonContactFields}
        showApartmentWhatsappField={showApartmentWhatsappField}
        showFullCustomerForm={showFullCustomerForm}
        renderDynamicField={renderDynamicField}
        onOpenNewCust={openNewCust}
        onOpenEditCust={openEditCust}
        onOpenDetail={openCustomerDetail}
        onSaveCust={saveCust}
        onRemoveCustomer={removeCustomer}
        onBackToList={() => setScreen("customers")}
        onClose={() => setScreen("main")}
      />
    );
  }

  if (screen === "society-portal" || screen === "society-member-access") {
    return withNotice(
      <SocietyPortalScreen
        screen={screen}
        user={user}
        customers={customers}
        societyPortalLoading={societyPortalLoading}
        societyPortalInvites={societyPortalInvites}
        memberInviteForm={memberInviteForm}
        onMemberInviteFormChange={setMemberInviteForm}
        societyPortalForm={societyPortalForm}
        onSocietyPortalFormChange={setSocietyPortalForm}
        societyJoinForm={societyJoinForm}
        onSocietyJoinFormChange={setSocietyJoinForm}
        hasMemberPortalAccess={hasMemberPortalAccess}
        onCreateMemberInvite={createMemberInvite}
        onDeactivateMemberInvite={deactivateMemberInvite}
        onPublish={publishSocietyPortalRecords}
        onJoin={joinSocietyPortalWithInvite}
        onLeave={leaveSocietyPortalAccess}
        normalizeInviteCode={normalizeInviteCode}
        onClose={() => setScreen("main")}
      />
    );
  }

  if (screen === "support") {
    return withNotice(
      <SupportModal
        view={supportView}
        onViewChange={setSupportView}
        form={supportForm}
        onFormChange={setSupportForm}
        tickets={supportTickets}
        loading={supportLoading}
        submitting={submittingSupport}
        replyDrafts={supportReplyDrafts}
        onReplyDraftChange={setSupportReplyDrafts}
        replyingTicketId={replyingTicketId}
        selectedTicketId={selectedSupportTicketId}
        onSelectTicket={setSelectedSupportTicketId}
        selectedTicket={selectedSupportTicket}
        onSubmit={submitSupportTicket}
        onSendReply={sendSupportReply}
        onCopyEmail={copySupportEmail}
        onEmailInstead={openSupportComposer}
        onCopySupportContext={copySupportContext}
        onClose={() => setScreen("main")}
      />
    );
  }

  if (screen === "apartment-import" && isApartmentOrg) {
    return withNotice(
      <Modal
        title="Apartment Data Import"
        onClose={() => setScreen("main")}
        onSave={applyApartmentImport}
        saveLabel={importingData ? "Importing..." : "Import Valid Rows"}
        canSave={!importingData && Boolean(importPreview?.validRows?.length)}
        accentColor="var(--blue)"
      >
        <div className="card" style={{ padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7 }}>
            Upload one CSV file with typed rows using <strong>record_type</strong> values:
            {" "}<code>flat</code>, <code>collection</code>, <code>expense</code>, <code>opening_balance</code>, <code>due</code>.
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            <button type="button" className="btn-secondary" style={{ padding: "8px 12px", fontSize: 12 }} onClick={downloadApartmentImportTemplate}>
              Download Template
            </button>
          </div>
        </div>

        <Field label="Upload CSV" required hint="Use UTF-8 CSV format. XLSX can be saved as CSV before upload.">
          <input
            type="file"
            accept=".csv,text/csv"
            className="input-field"
            onChange={handleApartmentImportFile}
            style={{ marginBottom: 0, padding: "10px 12px" }}
          />
        </Field>

        <Field label="Or Paste CSV" hint="Useful when copying data directly from Excel or Google Sheets.">
          <Textarea
            placeholder="Paste CSV with header row..."
            value={importCsvText}
            onChange={event => setImportCsvText(event.target.value)}
            style={{ minHeight: 140 }}
          />
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button type="button" className="btn-secondary" style={{ padding: "8px 12px", fontSize: 12 }} onClick={() => buildApartmentImportPreview()}>
            Validate Preview
          </button>
        </div>

        {importPreview && (
          <div className="card" style={{ padding: 14, marginTop: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Import Preview</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: 10 }}>
              <div className="card" style={{ marginBottom: 0, padding: 10 }}>Flats: {importPreview.summary.flat}</div>
              <div className="card" style={{ marginBottom: 0, padding: 10 }}>Collections: {importPreview.summary.collection}</div>
              <div className="card" style={{ marginBottom: 0, padding: 10 }}>Expenses: {importPreview.summary.expense}</div>
              <div className="card" style={{ marginBottom: 0, padding: 10 }}>Opening Balances: {importPreview.summary.opening_balance}</div>
              <div className="card" style={{ marginBottom: 0, padding: 10 }}>Dues: {importPreview.summary.due}</div>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 8 }}>
              Valid rows: {importPreview.validRows.length} / Total rows: {importPreview.rows.length}
            </div>
            {importPreview.errors.length > 0 && (
              <div className="card" style={{ marginBottom: 0, padding: 12, background: "var(--danger-deep)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--danger)", marginBottom: 6 }}>
                  {importPreview.errors.length} row error(s)
                </div>
                <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                  {importPreview.errors.slice(0, 20).map(item => (
                    <div key={`${item.rowNumber}-${item.message}`} style={{ fontSize: 12, color: "var(--danger)" }}>
                      Row {item.rowNumber}: {item.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    );
  }

  if (screen === "org-records" && activeOrgSection) {
    const items = orgRecords?.[activeOrgSection.key] || [];
    return withNotice(
      <Modal title={activeOrgSection.label} onClose={() => setScreen("main")} onSave={openNewOrgRecord} saveLabel={`Add ${activeOrgSection.entryLabel}`}>
        {items.length === 0 ? (
          <EmptyState title={`No ${activeOrgSection.label.toLowerCase()} yet`} message={`Add your first ${activeOrgSection.entryLabel.toLowerCase()} record to tailor EazyKhata to your workflow.`} accentColor="var(--blue)" />
        ) : (
          <div className="card">
            {items.map(item => (
              <div key={item.id} className="card-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{item[activeOrgSection.fields[0]?.key] || activeOrgSection.entryLabel}</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                    {activeOrgSection.fields.slice(1).map(field => item[field.key]).filter(Boolean).join(" - ")}
                    {activeOrgSection.key === "services" ? ` - ${Array.isArray(item.products) ? item.products.length : 0} product(s)` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={() => openEditOrgRecord(item)} style={{ background: "var(--blue-deep)", border: "none", borderRadius: 9, color: "var(--blue)", fontSize: 12, fontWeight: 600, padding: "5px 10px", cursor: "pointer", fontFamily: "var(--font)" }}>Edit</button>
                  <DeleteBtn onDelete={() => { if (window.confirm(`Remove this ${activeOrgSection.entryLabel.toLowerCase()}?`)) removeOrgRecord(activeOrgSection.key, item.id); }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    );
  }

  if (screen === "org-record-form" && activeOrgSection && orgRecordForm) {
    return withNotice(
      <Modal title={editOrgRecord ? `Edit ${activeOrgSection.entryLabel}` : `New ${activeOrgSection.entryLabel}`} onClose={() => setScreen("org-records")} onSave={saveOrgSectionRecord} canSave={true}>
        {activeOrgSection.fields.map(field => (
          <Field key={field.key} label={field.label} required={Boolean(field.required)}>
            {renderDynamicField(field, orgRecordForm[field.key], value => setOrgRecordForm(current => ({ ...current, [field.key]: value })))}
          </Field>
        ))}
        {activeOrgSection.key === "services" && (
          <div className="card" style={{ padding: 14, marginTop: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Products for this service</div>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: "7px 10px", fontSize: 12 }}
                onClick={() => setOrgRecordForm(current => ({
                  ...current,
                  products: [...(current.products || []), createEmptyServiceProduct()]
                }))}
              >
                + Add Product
              </button>
            </div>
            {(orgRecordForm.products || []).map(product => (
              <div key={product.id} className="card" style={{ padding: 10, marginBottom: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                  <Input
                    placeholder="Product name"
                    value={product.productName || ""}
                    onChange={event => setOrgRecordForm(current => ({
                      ...current,
                      products: (current.products || []).map(row => row.id === product.id ? { ...row, productName: event.target.value } : row)
                    }))}
                  />
                  <Select
                    value={product.productType || "unit"}
                    onChange={event => setOrgRecordForm(current => ({
                      ...current,
                      products: (current.products || []).map(row => row.id === product.id ? { ...row, productType: event.target.value, unit: row.unit || (event.target.value === "weight" ? "kg" : "pcs") } : row)
                    }))}
                  >
                    <option value="unit">Per Piece</option>
                    <option value="weight">By Weight</option>
                  </Select>
                  <Input
                    placeholder="Unit (pcs/kg/g/l/ml)"
                    value={product.unit || ""}
                    onChange={event => setOrgRecordForm(current => ({
                      ...current,
                      products: (current.products || []).map(row => row.id === product.id ? { ...row, unit: event.target.value } : row)
                    }))}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price"
                    value={product.price || ""}
                    onChange={event => setOrgRecordForm(current => ({
                      ...current,
                      products: (current.products || []).map(row => row.id === product.id ? { ...row, price: event.target.value } : row)
                    }))}
                  />
                  <Input
                    type="number"
                    min="0"
                    step={String(product.productType || "unit") === "weight" ? "0.01" : "1"}
                    placeholder="Opening stock"
                    value={product.quantity || ""}
                    onChange={event => setOrgRecordForm(current => ({
                      ...current,
                      products: (current.products || []).map(row => row.id === product.id ? { ...row, quantity: event.target.value } : row)
                    }))}
                  />
                  <Input
                    type="number"
                    min="0"
                    step={String(product.productType || "unit") === "weight" ? "0.01" : "1"}
                    placeholder="Low stock alert at"
                    value={product.lowStockAt || ""}
                    onChange={event => setOrgRecordForm(current => ({
                      ...current,
                      products: (current.products || []).map(row => row.id === product.id ? { ...row, lowStockAt: event.target.value } : row)
                    }))}
                  />
                </div>
                <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: "8px 10px", fontSize: 12, color: "var(--danger)" }}
                    onClick={() => setOrgRecordForm(current => ({
                      ...current,
                      products: (current.products || []).length <= 1
                        ? current.products
                        : (current.products || []).filter(row => row.id !== product.id)
                    }))}
                    disabled={(orgRecordForm.products || []).length <= 1}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>
              For each product, choose Per Piece or By Weight, set unit, opening stock, and low-stock alert level.
            </div>
          </div>
        )}
      </Modal>
    );
  }

  if (screen === "notifications") {
    return withNotice(
      <NotificationsModal
        form={notificationForm}
        onFormChange={setNotificationForm}
        onSave={saveNotificationSettings}
        onClose={() => setScreen("main")}
        orgConfig={orgConfig}
      />
    );
  }

  if (screen === "savings-goal" && isPersonalOrg) {
    const sym = currency?.symbol || "Rs";
    return withNotice(
      <Modal
        title="Savings Goal"
        onClose={() => setScreen("main")}
        onSave={saveGoalSettings}
        saveLabel="Save Goal"
        canSave={true}
        accentColor="var(--gold)"
      >
        <Field label="Target Amount" hint={`Set how much ${sym} you want to save in total`}>
          <Input
            type="number"
            min="0"
            placeholder="0.00"
            value={goalForm.targetAmount}
            onChange={e => setGoalForm(f => ({ ...f, targetAmount: e.target.value }))}
          />
        </Field>
        <Field label="Amount Already Saved" hint="How much have you saved so far towards this goal">
          <Input
            type="number"
            min="0"
            placeholder="0.00"
            value={goalForm.savedAmount}
            onChange={e => setGoalForm(f => ({ ...f, savedAmount: e.target.value }))}
          />
        </Field>
        <Field label="Target Date" hint="Optional — when do you want to reach this goal">
          <DateSelectInput
            value={goalForm.targetDate}
            onChange={v => setGoalForm(f => ({ ...f, targetDate: v }))}
            min={new Date().toISOString().slice(0, 10)}
            yearOrder="asc"
          />
        </Field>
        <Field label="Goal Note" hint="Optional — what are you saving for?">
          <Input
            placeholder="New car, house deposit, emergency fund..."
            value={goalForm.note}
            onChange={e => setGoalForm(f => ({ ...f, note: e.target.value }))}
          />
        </Field>
        {Number(goalForm.targetAmount || 0) > 0 && (
          <div style={{ marginTop: 4, padding: "12px 14px", background: "var(--surface-high)", borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: "var(--text-sec)", marginBottom: 6 }}>Progress preview</div>
            <div className="progress-bar-track">
              <div style={{ width: `${Math.min(100, Math.round((Number(goalForm.savedAmount || 0) / Number(goalForm.targetAmount)) * 100))}%`, height: "100%", background: "var(--gold)", borderRadius: 999 }} />
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 6 }}>
              {Math.min(100, Math.round((Number(goalForm.savedAmount || 0) / Number(goalForm.targetAmount)) * 100))}% complete
            </div>
          </div>
        )}
      </Modal>
    );
  }

  if (screen === "plan-request") {
    return withNotice(
      <PlanRequestModal
        form={planRequestForm}
        onFormChange={setPlanRequestForm}
        onSubmit={submitPlanRequest}
        submitting={submittingPayment}
        onClose={() => setScreen("main")}
        orgType={orgType}
      />
    );
  }

  return withNotice(
    <UpgradeModal open={!!upgradeInfo} title={upgradeInfo?.title} message={upgradeInfo?.message} onClose={() => setUpgradeInfo(null)} />
  );
}
