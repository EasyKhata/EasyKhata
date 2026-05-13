import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useConfirm } from "../context/DialogContext";
import { isNative } from "../utils/native";
import { openExternal } from "../utils/openExternal";
import { supportApi, adminApi, orgsApi, usersApi } from "../lib/api";
import { logError } from "../utils/logger";
import PlanRequestModal from "./settings/PlanRequestModal";
import SubscriptionHistoryScreen from "./settings/SubscriptionHistoryScreen";
import NotificationsModal from "./settings/NotificationsModal";
import SupportModal, { SUPPORT_TOPIC_OPTIONS } from "./settings/SupportModal";
import ProfileModal from "./settings/ProfileModal";
import AccountModal from "./settings/AccountModal";
import OrganizationSwitcherModal from "../components/OrganizationSwitcherModal";
import { useCoachMark } from "../components/CoachMark";
import BusinessImportScreen from "./settings/BusinessImportScreen";
import CustomersScreen from "./settings/CustomersScreen";
import StaffScreen from "./settings/StaffScreen";
import AuditLogScreen from "./settings/AuditLogScreen";
import OrgMembersScreen from "./settings/OrgMembersScreen";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useTheme } from "../context/ThemeContext";
import { callAuthedFunction as callFunction } from "../utils/functionsClient";
import { loadRazorpay } from "../utils/razorpay";
import { Modal, Field, Input, Textarea, Select, CurrencyPicker, Avatar, DateSelectInput, DeleteBtn, fmtMoney, MONTHS, MonthSelectInput, UpgradeModal, ToastNotice, SectionSkeleton, WorkflowRecordCard, WorkflowSetupCard } from "../components/UI";
import { downloadMonthlyReport, downloadAdminMonthlyReport, downloadFinancialYearReport } from "../utils/reportGen";
import TemplatePicker from "../components/TemplatePicker";
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
  isValidIndianPincode,
  isValidUserPhoneNumber,
  parseLocationFields,
  parseDateOfBirthParts,
  sanitizePhoneDigits,
  sanitizeIndianPincode,
  splitPhoneNumber
} from "../utils/profile";
import {
  BILLING_CYCLES,
  PAYMENT_REQUEST_STATUS,
  UPI_CONFIG,
  canUseFeature,
  canChangeOrgType as canChangeOrgTypeFn,
  canCreatePaidOrg,
  formatSubscriptionDate,
  getBillingAmount,
  getOwnedPaidOrgCount,
  getPaidOrgLimit,
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
import { ORG_TYPE_OPTIONS, ORG_TYPES, getOrgConfig, getOrgType, getSecondaryOrgTypeOptions, getSelectableOrgTypeOptions } from "../utils/orgTypes";

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
  const district = account?.district || parsedLocation.district || "";
  const pincode = account?.pincode || parsedLocation.pincode || "";
  const country = "India";
  const location = account?.location || buildLocationLabel({ city, district, state, pincode, country });
  return {
    name: account?.name || "",
    email: account?.email || user?.email || "",
    phone: account?.phone || user?.phone || "",
    phoneCountryCode: account?.phoneCountryCode || phoneParts.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE,
    phoneNumber: phoneParts.phoneNumber,
    addressLine,
    city,
    state,
    district,
    pincode,
    country,
    location,
    address: account?.address || buildLocationLabel({ addressLine, city, district, state, pincode, country }),
    gstin: account?.gstin || "",
    showHSN: account?.showHSN ?? true,
    organizationType: getOrgType(account?.organizationType || user?.organizationType),
    logoBase64: account?.logoBase64 || "",
    logoRatio: account?.logoRatio || null,
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
  const confirm = useConfirm();
  const { user, logout, deleteAccount, updateProfile, setUser } = useAuth();
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
    addInvoice,
    notificationPrefs,
    saveNotificationPrefs,
    orgRecords,
    addOrgRecord,
    updateOrgRecord,
    removeOrgRecord,
    organizations,
    ownedOrganizations,
    activeOrgId,
    activeSharedOrgKey,
    createOrganization,
    switchOrganization,
    switchToSharedOrg,
    switchToOwnOrg,
    deleteOrganization,
    maxOrganizations,
    canCreateOrganization,
    ensureCollectionLoaded,
    collectionFetched,
    canManageRecord,
    isViewerMode
  } = useData();
  useTheme();

  const [screen, setScreen] = useState("main");
  const { seen: coachCustSeen, dismiss: dismissCustCoach } = useCoachMark(user?.id, "settings-customers");
  const { seen: coachStaffSeen, dismiss: dismissStaffCoach } = useCoachMark(user?.id, "settings-staff");
  const [custForm, setCustForm] = useState(null);
  const [editCust, setEditCust] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [staffForm, setStaffForm] = useState(null);
  const [editStaff, setEditStaff] = useState(null);
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
    district: user?.district || initialLocationParts.district || "",
    pincode: user?.pincode || initialLocationParts.pincode || "",
    country: user?.country || initialLocationParts.country || "India",
    marketingPushEnabled: user?.marketingPushEnabled !== false
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
    targetPlan: PLANS.PRO,
    billingCycle: BILLING_CYCLES.MONTHLY,
    note: ""
  });
  const [paymentOrgId, setPaymentOrgId] = useState(activeOrgId || "");
  const [pendingNewOrgDraft, setPendingNewOrgDraft] = useState(null);
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
    organizationType: getOrgType(account?.organizationType || user?.organizationType) === ORG_TYPES.PERSONAL
      ? ORG_TYPES.FREELANCER
      : getOrgType(account?.organizationType || user?.organizationType),
    addressLine: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    country: "India"
  });
  const [upgradeInfo, setUpgradeInfo] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showReportPicker, setShowReportPicker] = useState(false);
  const [reportPreviewUrl, setReportPreviewUrl] = useState(null);
  const [generatingReportPreview, setGeneratingReportPreview] = useState(false);
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
      financialYearStart: getCurrentFinancialYearStart(now),
      templateId: account?.reportTemplate || "classic"
    };
  });
  const currentPlan = getUserPlan(user);
  const reviewAccessEnabled = isReviewAccessEnabled();
  const isOrgMode = sectionMode === "org";
  const orgType = getOrgType(accForm.organizationType || account?.organizationType || user?.organizationType);
  const planSummary = getPlanSummary(user, orgType, account, ownedOrganizations);
  const isPrimaryHouseholdOrg = orgType === ORG_TYPES.PERSONAL;
  const canChangeOrgType = (user?.role === "admin" || canChangeOrgTypeFn(user)) && !isPrimaryHouseholdOrg;
  const isPersonalOrg = orgType === ORG_TYPES.PERSONAL;
  const isApartmentOrg = orgType === ORG_TYPES.APARTMENT;
  const isFreelancerOrg = orgType === ORG_TYPES.FREELANCER;
  const showApartmentWhatsappField = isApartmentOrg;
  const showOrgBusinessFields = !isPersonalOrg;
  const showPersonContactFields = orgType !== "apartment" && orgType !== ORG_TYPES.PERSONAL;
  const orgConfig = getOrgConfig(orgType);
  const showFullCustomerForm = showPersonContactFields && !orgConfig.simpleCustomerForm;
  const paidOrgCount = getOwnedPaidOrgCount(ownedOrganizations);
  const paidOrgLimit = getPaidOrgLimit(user);
  const paymentOrganizations = useMemo(() => {
    if (pendingNewOrgDraft) {
      return [{
        id: pendingNewOrgDraft.orgId,
        name: pendingNewOrgDraft.name,
        organizationType: pendingNewOrgDraft.organizationType,
        isOwned: true,
        plan: "free",
        subscriptionStatus: "pending_payment",
        subscriptionEndsAt: ""
      }];
    }
    return (ownedOrganizations || []).filter(org => getOrgType(org.organizationType) !== ORG_TYPES.PERSONAL);
  }, [ownedOrganizations, pendingNewOrgDraft]);
  const selectedPaymentOrg = paymentOrganizations.find(org => org.id === paymentOrgId) || paymentOrganizations[0] || null;
  const selectableOrgTypeOptions = useMemo(() => {
    if (isPrimaryHouseholdOrg) {
      return ORG_TYPE_OPTIONS.filter(option => getOrgType(option.value) === ORG_TYPES.PERSONAL);
    }
    return getSecondaryOrgTypeOptions(accForm.organizationType || orgType);
  }, [accForm.organizationType, orgType, isPrimaryHouseholdOrg]);
  const selectableCreateOrgTypeOptions = useMemo(() => getSecondaryOrgTypeOptions(createOrgForm.organizationType), [createOrgForm.organizationType]);

  const [customerInsights, setCustomerInsights] = useState(customers);
  const CUSTOMER_SCREENS = new Set(["customers", "customer-detail", "customer-form"]);

  // Ensure the right collections are loaded when the customer directory opens,
  // so inline briefs and analytics show real data without needing to visit section tabs first.
  useEffect(() => {
    if (!CUSTOMER_SCREENS.has(screen)) return;
    if (isPersonalOrg) {
      ensureCollectionLoaded?.("expenses");
      ensureCollectionLoaded?.("income");
    }
    if (isApartmentOrg)  ensureCollectionLoaded?.("income");
    if (!isPersonalOrg && !isApartmentOrg) {
      ensureCollectionLoaded?.("income");
      ensureCollectionLoaded?.("invoices");
    }
  }, [isPersonalOrg, isApartmentOrg, screen, ensureCollectionLoaded]);

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
    const insightsById = new Map(safeInsights.map(c => [c.id, c]));
    return safeCustomers.map(customer => ({
      ...customer,
      ...(insightsById.get(customer.id) || {})
    }));
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
  const orgStateProvinceOptions = useMemo(() => getStateProvinceOptions("India"), []);
  const createOrgStateProvinceOptions = orgStateProvinceOptions;
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

  async function handleSwitchOrganization(target) {
    const org = typeof target === "object"
      ? target
      : organizations.find(item => item.id === target || item.switchKey === target);
    if (!org) {
      showNotice("That Khata was not found.");
      return;
    }

    let res = { success: true };
    if (org.isShared) {
      await switchToSharedOrg?.(org.switchKey || org.key);
    } else if (activeSharedOrgKey) {
      switchToOwnOrg?.(org.id);
    } else {
      res = await switchOrganization(org.id);
    }

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
    if (isPrimaryHouseholdOrg) {
      setPendingOrgTypeChange(null);
      showNotice("Household stays as your default Khata and cannot change type.");
      return;
    }
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
      country: user?.country || nextLocationParts.country || "India",
      marketingPushEnabled: user?.marketingPushEnabled !== false
    });
  }, [user?.addressLine, user?.city, user?.country, user?.dateOfBirth, user?.email, user?.gender, user?.location, user?.marketingPushEnabled, user?.name, user?.phone, user?.phoneCountryCode, user?.state]);

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
    const rawType = getOrgType(account?.organizationType || user?.organizationType);
    setCreateOrgForm(current => ({
      ...current,
      organizationType: rawType === ORG_TYPES.PERSONAL ? ORG_TYPES.FREELANCER : rawType
    }));
  }, [account?.organizationType, user?.organizationType]);

  useEffect(() => {
    if (!pendingNewOrgDraft && activeOrgId) setPaymentOrgId(activeOrgId);
  }, [activeOrgId, pendingNewOrgDraft]);

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

    if (navigationTarget.screen === "profile") {
      setScreen("profile");
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
      setPendingNewOrgDraft(null);
      setPaymentOrgId("");
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
    // Personal address fields were removed from the profile UI — addresses now live
    // on the Khata (org) profile only. We keep the existing values intact rather
    // than wiping them, so users who had a personal address from the old form
    // don't lose it from their User row.

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

    const res = await updateProfile({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      phoneCountryCode: cleanPhoneCountryCode,
      gender: cleanGender,
      dateOfBirth: cleanDateOfBirth,
      ageGroup: getAgeGroupFromDateOfBirth(cleanDateOfBirth)
    });
    if (res?.error) {
      showNotice(res.error);
      return;
    }

    // Marketing-push opt-in/out lives on a dedicated endpoint because it isn't
    // a profile field (no email/phone/location concerns). We fire it after the
    // main profile save so a failure here doesn't roll back the rest.
    const desiredMarketing = userForm.marketingPushEnabled !== false;
    if (desiredMarketing !== (user?.marketingPushEnabled !== false)) {
      try {
        await usersApi.setMarketingPref(user.id, desiredMarketing);
      } catch (err) {
        logError("Marketing pref update failed", err);
        // Non-fatal — show a soft notice and keep the rest of the save.
        showNotice("Profile saved, but couldn't update notification preference. Try again later.", "warning");
        setScreen("main");
        return;
      }
    }

    showNotice("Your personal profile has been updated.", "success");
    setScreen("main");
  }

  function handleLogoFile(e) {
    const file = e?.target?.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) { showNotice("Logo must be under 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const MAX_W = 320, MAX_H = 120;
        const scale = Math.min(MAX_W / img.width, MAX_H / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        const logoBase64 = canvas.toDataURL("image/jpeg", 0.85);
        const logoRatio = canvas.width / canvas.height;
        setAccForm(f => ({ ...f, logoBase64, logoRatio }));
      };
      img.src = String(ev.target?.result || "");
    };
    reader.readAsDataURL(file);
  }

  const saveAcc = async () => {
    if (isViewerMode) return;
    const cleanEmail = showOrgBusinessFields ? normalizeEmail(accForm.email) : "";
    const cleanPhoneNumber = showOrgBusinessFields ? sanitizePhoneDigits(accForm.phoneNumber) : "";
    const cleanPhoneCountryCode = accForm.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE;
    const cleanPhone = buildPhoneNumber(cleanPhoneCountryCode, cleanPhoneNumber);
    const cleanName = String(accForm.name || "").trim();
    const cleanGstin = showOrgBusinessFields ? String(accForm.gstin || "").trim().toUpperCase() : "";
    const cleanAddressLine = String(accForm.addressLine || "").trim();
    const cleanCity = String(accForm.city || "").trim();
    const cleanState = String(accForm.state || "").trim();
    const cleanDistrict = String(accForm.district || "").trim();
    const cleanPincode = sanitizeIndianPincode(accForm.pincode || "");
    const cleanCountry = "India";
    const cleanLocation = buildLocationLabel({ city: cleanCity, district: cleanDistrict, state: cleanState, pincode: cleanPincode, country: cleanCountry });
    const cleanAddress = buildLocationLabel({ addressLine: cleanAddressLine, city: cleanCity, district: cleanDistrict, state: cleanState, pincode: cleanPincode, country: cleanCountry });
    const cleanOrganizationType = getOrgType(accForm.organizationType);
    const previousOrganizationType = getOrgType(account?.organizationType || user?.organizationType);
    const isOrgTypeChanging = previousOrganizationType !== cleanOrganizationType;
    const duplicateOrgType = organizations.some(
      org => org.id !== activeOrgId && getOrgType(org.organizationType) === cleanOrganizationType
    );

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
    if (!cleanAddressLine || !cleanCity || !cleanDistrict || !cleanState || !cleanPincode) {
      showNotice("Please complete the Khata address: address, city, district, state, and pincode are required.");
      return;
    }
    if (!isValidIndianPincode(cleanPincode)) {
      showNotice("Please enter a valid 6-digit Indian pincode.");
      return;
    }
    if (duplicateOrgType && cleanOrganizationType === ORG_TYPES.PERSONAL) {
      showNotice("Household is already your default Khata.");
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
      district: cleanDistrict,
      pincode: cleanPincode,
      country: cleanCountry,
      location: cleanLocation,
      address: cleanAddress,
      gstin: cleanGstin,
      showHSN: showOrgBusinessFields ? Boolean(accForm.showHSN) : false,
      organizationType: cleanOrganizationType,
      logoBase64: showOrgBusinessFields ? (accForm.logoBase64 || "") : "",
      logoRatio: showOrgBusinessFields ? (accForm.logoRatio || null) : null,
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
    if (isViewerMode) return;
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
    if (!(canManageRecord?.(customer) ?? !isViewerMode)) return;
    setCustForm(buildCustomerFormState(customer, orgType));
    setEditCust(customer);
    setScreen("customer-form");
  }

  function openCustomerDetail(customer) {
    const detail = orgConfig.showCustomerFinancials === false
      ? customer
      : customerDirectory.find(item => item.id === customer.id) || customer;
    setSelectedCustomer(detail);
    setScreen("customer-detail");
  }

  function saveCust() {
    if (editCust ? !(canManageRecord?.(editCust) ?? !isViewerMode) : isViewerMode) return;
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
    if (showPersonContactFields && !cleanPhoneNumber) {
      showNotice("Please enter the client phone number.");
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

    if (editCust) updateCustomer({
      ...payload,
      id: editCust.id,
      ...(editCust?.isPrimaryProfile ? { isPrimaryProfile: true, isLockedProfile: true } : {})
    });
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
    if (isViewerMode) return;
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
    if (!(canManageRecord?.(record) ?? !isViewerMode)) return;
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
    if (editOrgRecord ? !(canManageRecord?.(editOrgRecord) ?? !isViewerMode) : isViewerMode) return;
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

  function openNewStaff() {
    if (isViewerMode) return;
    setEditStaff(null);
    setStaffForm({
      name: "",
      phoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE,
      phoneNumber: "",
      phone: "",
      idCardType: "",
      idCardNumber: "",
      email: "",
      address: ""
    });
    setScreen("staff-form");
  }

  function openEditStaff(member) {
    if (!(canManageRecord?.(member) ?? !isViewerMode)) return;
    setEditStaff(member);
    const phoneParts = splitPhoneNumber(member.phone || "", member.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE);
    setStaffForm({
      ...member,
      phoneCountryCode: phoneParts.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE,
      phoneNumber: phoneParts.phoneNumber || ""
    });
    setScreen("staff-form");
  }

  async function saveStaffMember() {
    if (editStaff ? !(canManageRecord?.(editStaff) ?? !isViewerMode) : isViewerMode) return;
    const name = String(staffForm?.name || "").trim();
    const cleanPhoneNumber = sanitizePhoneDigits(staffForm?.phoneNumber || "");
    const cleanPhoneCountryCode = staffForm?.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE;
    const cleanPhone = buildPhoneNumber(cleanPhoneCountryCode, cleanPhoneNumber);
    if (!name) { showNotice("Please enter the employee name."); return; }
    if (!cleanPhoneNumber) { showNotice("Please enter the employee phone number."); return; }
    const payload = {
      name,
      phone: cleanPhone,
      phoneNumber: cleanPhoneNumber,
      phoneCountryCode: cleanPhoneCountryCode,
      idCardType: String(staffForm?.idCardType || "").trim(),
      idCardNumber: String(staffForm?.idCardNumber || "").trim(),
      email: String(staffForm?.email || "").trim(),
      address: String(staffForm?.address || "").trim()
    };
    if (editStaff) updateOrgRecord("staff", { ...editStaff, ...payload });
    else addOrgRecord("staff", payload);
    setScreen("staff");
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
    if (!canUseFeature(user, "reports", {}, orgType, account)) {
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
        await downloadFinancialYearReport(reportData, financialYearStart, currency?.symbol || "Rs", reportForm.templateId);
      } else {
        await downloadMonthlyReport(reportData, year, month, currency?.symbol || "Rs", reportForm.templateId);
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

  async function handleReportPreview() {
    if (!canUseFeature(user, "reports")) {
      setUpgradeInfo(getUpgradeCopy("reports"));
      return;
    }
    const year = Number(reportForm.year);
    const month = Number(reportForm.month);
    const financialYearStart = Number(reportForm.financialYearStart);
    const reportData = { account, currency, customers, income, expenses, invoices, goals, budgets, orgRecords };
    setGeneratingReportPreview(true);
    try {
      let url;
      if (reportForm.period === "financial-year") {
        url = await downloadFinancialYearReport(reportData, financialYearStart, currency?.symbol || "Rs", reportForm.templateId, true);
      } else {
        url = await downloadMonthlyReport(reportData, year, month, currency?.symbol || "Rs", reportForm.templateId, true);
      }
      if (url) setReportPreviewUrl(url);
    } catch (err) {
      logError("Report preview error", err);
    } finally {
      setGeneratingReportPreview(false);
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
    const targetOrg = selectedPaymentOrg;
    const targetOrgId = targetOrg?.id || (pendingNewOrgDraft?.orgId || "account_plan");
    const targetOrgType = getOrgType(targetOrg?.organizationType || orgType);
    const targetOrgName = String(targetOrg?.name || pendingNewOrgDraft?.name || account?.name || "EazyKhata account").trim();
    const targetPlan = planRequestForm.targetPlan || PLANS.PRO;
    if (!pendingNewOrgDraft && targetOrg?.isOwned === false) {
      showNotice("Only the Khata owner can pay for this subscription.");
      return;
    }
    if (pendingNewOrgDraft && !canCreatePaidOrg(user, ownedOrganizations, targetPlan)) {
      showNotice(`${PLAN_LABELS[targetPlan]} does not have enough Khata slots for this new Khata. Choose Business or remove another paid Khata.`);
      return;
    }

    // On Android, in-app payments are not allowed (Play Store policy).
    // Send users to the website to complete the upgrade there.
    if (isNative) {
      const upgradeUrl = new URL(APP_UPGRADE_URL);
      upgradeUrl.searchParams.set("plan", targetPlan);
      upgradeUrl.searchParams.set("billing", planRequestForm.billingCycle || BILLING_CYCLES.MONTHLY);
      if (pendingNewOrgDraft) {
        upgradeUrl.searchParams.set("orgId", targetOrgId);
        upgradeUrl.searchParams.set("orgName", targetOrgName);
        upgradeUrl.searchParams.set("orgType", targetOrgType);
      }
      import("@capacitor/browser").then(({ Browser }) => {
        Browser.open({ url: upgradeUrl.toString() });
      }).catch(() => {
        window.open(upgradeUrl.toString(), "_blank");
      });
      setScreen("main");
      return;
    }

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
        orgId: targetOrgId,
        orgName: targetOrgName,
        orgType: targetOrgType,
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
        description: `${PLAN_LABELS[targetPlan] || "Plan"} membership`,
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
          orgId: targetOrgId,
          orgName: targetOrgName,
          orgType: targetOrgType,
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
            if (pendingNewOrgDraft) {
              const created = await createOrganization({ ...pendingNewOrgDraft, orgId: targetOrgId, planOverride: targetPlan });
              if (created?.error) {
                showNotice(`Payment received, but Khata creation needs support: ${created.error}`);
                return;
              }
              setPendingNewOrgDraft(null);
            }
            setUser(prev => prev ? {
              ...prev,
              plan: targetPlan,
              subscriptionStatus: "active",
              subscriptionEndsAt: endsAt,
              trialEligible: false,
              updatedAt: nowIso
            } : prev);

            setPlanRequestForm({ targetPlan: PLANS.PRO, billingCycle: BILLING_CYCLES.MONTHLY, note: "" });
            setScreen("main");
            showNotice(`Payment successful! ${PLAN_LABELS[targetPlan]} is active until ${formatSubscriptionDate(endsAt)}.`, "success");
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
    const targetOrg = selectedPaymentOrg;
    const targetOrgType = getOrgType(targetOrg?.organizationType || orgType);
    const targetPlan = planRequestForm.targetPlan || PLANS.PRO;
    const amount = getBillingAmount(planRequestForm.billingCycle || BILLING_CYCLES.MONTHLY, targetPlan, targetOrgType);
    const paymentOrgName = String(targetOrg?.name || pendingNewOrgDraft?.name || account?.name || "EazyKhata account").trim();
    const subject = encodeURIComponent(`EazyKhata payment proof - ${PLAN_LABELS[targetPlan] || targetPlan}`);
    const body = encodeURIComponent(
      `Hello,\n\nI have completed the payment for EazyKhata.\n\nPlan: ${PLAN_LABELS[targetPlan] || targetPlan}\nBilling cycle: ${planRequestForm.billingCycle || BILLING_CYCLES.MONTHLY}\nAmount: Rs ${amount}\nKhata context: ${paymentOrgName}\nKhata type: ${getOrgConfig(targetOrgType)?.typeLabel || targetOrgType}\n\nPlease find my payment screenshot attached.\n\nThanks.`
    );
    openExternal(`mailto:${APP_SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
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
    openExternal(`mailto:${APP_SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
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
      "flat,A-101,A-101,susan ,9876543210,susan@example.com,,,,,,,," ,
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
    if (isViewerMode) return;
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
    if (isViewerMode) return;
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
    if (isViewerMode) return;
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

  const MenuRow = ({ icon, label, sub, onClick, color, danger, disabled, badge }) => {
    const resolvedLabel = label === "Switch Khata" ? "Manage Khatas" : label;
    const resolvedSub = label === "Switch Khata"
      ? (organizations.length > 1 ? `${organizations.length} unique Khatas — open, review, or delete` : "Create or review your available Khata workspaces")
      : sub;
    return (
    <div onClick={disabled ? undefined : onClick} className="card-row" style={{ cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.56 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        {icon ? <div style={{ width: 34, height: 34, borderRadius: 10, background: danger ? "var(--danger-deep)" : color || "var(--surface-high)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{icon}</div> : null}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: danger ? "var(--danger)" : "var(--text)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span>{resolvedLabel}</span>
            {badge && <span className="pill" style={{ background: "var(--surface-pop)", color: "var(--text-sec)" }}>{badge}</span>}
          </div>
          {resolvedSub && <div style={{ fontSize: 11, color: "var(--text-dim)", lineHeight: 1.35 }}>{resolvedSub}</div>}
        </div>
      </div>
      {!danger && !disabled && <span style={{ color: "var(--text-dim)", fontSize: 16, flexShrink: 0 }}>{">"}</span>}
    </div>
    );
  };

  if (!loaded) {
    return <SectionSkeleton rows={5} showHero={false} />;
  }

  if (screen === "main") {
    if (isOrgMode && user?.role !== "admin") {
      return withNotice(
        <div className="ledger-screen">
          <div className="card" style={{ padding: 14, marginBottom: 14 }}>
            <div className="ledger-overline" style={{ marginBottom: 6 }}>
              Active Khata
            </div>
            <div style={{ fontSize: "clamp(11px, 7vw, 15px)", fontWeight: 700, color: "var(--text)", lineHeight: 1.03, letterSpacing: "-0.03em", marginBottom: 6, maxWidth: "15ch", overflowWrap: "anywhere" }}>{account?.name || "My Khata"}</div>
            <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.5 }}>
              {orgConfig.profileNameLabel} profile, directory, and records live here.
            </div>
            {(account?.location || account?.phone || account?.email) && (
              <div className="ledger-inline-note" style={{ marginTop: 10 }}>
                {[account?.location, account?.phone, account?.email].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>

          <div className="ledger-block">
            <div className="ledger-block-header">
              <div className="ledger-block-title">Khata Settings</div>
                <div className="ledger-block-caption">Manage your workspace, residents, reports, and records.</div>
            </div>
            <div className="card">
              <MenuRow icon="B" label="Khata Profile" sub={account?.name ? `${account.name} · ${orgConfig.typeLabel}` : `Set up your ${orgConfig.profileNameLabel.toLowerCase()}`} onClick={() => setScreen("account")} />
              <MenuRow icon="K" label="Manage Khatas" sub={`${organizations.length} Khatas — switch, review, or manage workspaces`} onClick={() => setShowOrgSwitcher(true)} />
              {canCreateOrganization && (
                <MenuRow icon="+" label="New Khata" sub="Create another khata for a different use type" onClick={() => {
                  setPendingNewOrgDraft(null);
                  setCreateOrgForm({ name: "", organizationType: ORG_TYPES.FREELANCER, addressLine: "", city: "", district: "", state: "", pincode: "", country: "India" });
                  setScreen("create-org");
                }} />
              )}
              <MenuRow icon="C" label={orgConfig.customerLabel} sub={`${customers.length} ${orgConfig.customerEntryLabel.toLowerCase()} saved`} onClick={() => { setScreen("customers"); dismissCustCoach(); }} />
              {customers.length === 0 && !coachCustSeen && !isViewerMode && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "color-mix(in srgb, var(--saffron) 10%, var(--surface-high))", borderTop: "1px solid color-mix(in srgb, var(--saffron) 18%, var(--border))", boxSizing: "border-box" }}>
                  <span style={{ fontSize: 18 }}>👆</span>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => { setScreen("customers"); dismissCustCoach(); }}
                    onKeyDown={e => e.key === "Enter" && (setScreen("customers"), dismissCustCoach())}
                    style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--saffron)" }}>Add your first {orgConfig.customerEntryLabel.toLowerCase()} here</div>
                    <div style={{ fontSize: 11, color: "var(--text-sec)" }}>Tap to open {orgConfig.customerLabel} →</div>
                  </div>
                  <button
                    type="button"
                    onClick={dismissCustCoach}
                    style={{ background: "none", border: "none", color: "var(--text-dim)", fontSize: 16, cursor: "pointer", padding: "4px 6px", lineHeight: 1, flexShrink: 0 }}
                    aria-label="Dismiss"
                  >×</button>
                </div>
              )}
              {isFreelancerOrg && (
                <MenuRow
                  icon="E"
                  label="Employees"
                  sub={`${(orgRecords?.staff || []).length} employee(s)`}
                  onClick={() => { setScreen("staff"); dismissStaffCoach(); }}
                />
              )}
              {isFreelancerOrg && (orgRecords?.staff || []).length === 0 && !coachStaffSeen && !isViewerMode && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "color-mix(in srgb, var(--saffron) 10%, var(--surface-high))", borderTop: "1px solid color-mix(in srgb, var(--saffron) 18%, var(--border))", boxSizing: "border-box" }}>
                  <span style={{ fontSize: 18 }}>👆</span>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => { setScreen("staff"); dismissStaffCoach(); }}
                    onKeyDown={e => e.key === "Enter" && (setScreen("staff"), dismissStaffCoach())}
                    style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--saffron)" }}>Add your first employee here</div>
                    <div style={{ fontSize: 11, color: "var(--text-sec)" }}>Tap to open Employees →</div>
                  </div>
                  <button
                    type="button"
                    onClick={dismissStaffCoach}
                    style={{ background: "none", border: "none", color: "var(--text-dim)", fontSize: 16, cursor: "pointer", padding: "4px 6px", lineHeight: 1, flexShrink: 0 }}
                    aria-label="Dismiss"
                  >×</button>
                </div>
              )}
              {isFreelancerOrg && !isViewerMode && (
                <MenuRow icon="↑" label="Import Data" sub="Import payments, spends, or invoices from a CSV file" onClick={() => setScreen("business-import")} />
              )}
              {!isPersonalOrg && <MenuRow icon="R" label="Reports" sub={generatingReport ? "Generating report..." : (isApartmentOrg ? "Download monthly or yearly society reports" : "Download monthly or financial year reports")} onClick={openReportPicker} />}
              {isApartmentOrg && (
                <MenuRow
                  icon="B"
                  label="Bills / Invoices"
                  sub="Open apartment receipts and bills"
                  onClick={() => window.dispatchEvent(new CustomEvent("ledger:navigate", { detail: { tab: "invoices" } }))}
                />
              )}
              {isApartmentOrg && !isViewerMode && (
                <MenuRow
                  icon="I"
                  label="Import Apartment Data"
                  sub="Upload flats, collections, expenses, dues, and opening balances in one CSV"
                  onClick={() => setScreen("apartment-import")}
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

          {isFreelancerOrg && (
            <div className="ledger-block">
              <div className="ledger-block-header">
                <div className="ledger-block-title">Team &amp; Access</div>
                <div className="ledger-block-caption">Invite team members and manage who can view or edit this khata.</div>
              </div>
              <div className="card">
                <MenuRow icon="T" label="Team Members" sub="Invite members and manage admin or viewer access" onClick={() => setScreen("org-members")} />
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

              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7 }}>
                  {reportForm.period === "financial-year"
                    ? "This will export one PDF covering the full April to March financial year."
                    : "This will export the selected month as a PDF report."}
                </div>
              </div>
              <div style={{ padding: "12px 0 4px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.6 }}>Report Template</div>
                  <button
                    type="button"
                    onClick={handleReportPreview}
                    disabled={generatingReportPreview}
                    style={{ border: "none", background: "var(--surface-pop)", borderRadius: 10, padding: "6px 12px", cursor: "pointer", color: "var(--text)", fontWeight: 700, fontSize: 12 }}
                  >
                    {generatingReportPreview ? "Generating..." : "Preview Report"}
                  </button>
                </div>
                <TemplatePicker type="report" selected={reportForm.templateId || "classic"} onChange={id => setReportForm(f => ({ ...f, templateId: id }))} />
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
          <OrganizationSwitcherModal
            open={showOrgSwitcher}
            onClose={() => setShowOrgSwitcher(false)}
            organizations={organizations}
            activeOrgId={activeOrgId}
            activeSharedOrgKey={activeSharedOrgKey}
            onSwitch={handleSwitchOrganization}
            onDelete={handleDeleteOrganization}
          />
          {reportPreviewUrl && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 1200, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "#16161e", borderBottom: "1px solid #ffffff18" }}>
                <button onClick={() => { URL.revokeObjectURL(reportPreviewUrl); setReportPreviewUrl(null); }} style={{ border: "none", background: "#ffffff18", borderRadius: 10, padding: "8px 14px", cursor: "pointer", color: "#fff", fontWeight: 700, fontSize: 13 }}>Close</button>
                <span style={{ flex: 1, fontSize: 13, color: "#aaa" }}>Select a template above, then click Preview again to compare</span>
                <button onClick={handleReportDownload} disabled={generatingReport} style={{ border: "none", background: "var(--blue)", borderRadius: 10, padding: "8px 16px", cursor: "pointer", color: "#fff", fontWeight: 700, fontSize: 13 }}>{generatingReport ? "Generating..." : "Download PDF"}</button>
              </div>
              <iframe src={reportPreviewUrl} style={{ flex: 1, border: "none", background: "#fff" }} title="Report Preview" />
            </div>
          )}
        </div>
      );
    }

    return withNotice(
      <div className="ledger-screen">
        <div className="card" style={{ padding: 14, marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 12 }}>
          <Avatar name={user?.name || "?"} size={42} fontSize={16} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", lineHeight: 1.12 }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.5, marginTop: 2 }}>{user?.phone}</div>
            <div className="ledger-inline-note" style={{ marginTop: 7, padding: 1 }}>{planSummary.title}, {planSummary.message}</div>
            {!reviewAccessEnabled && user?.subscriptionStatus === "trial" && user?.subscriptionEndsAt && (
              <div style={{ fontSize: 12, color: "var(--gold)", marginTop: 4 }}>Your trial ends on {formatSubscriptionDate(user.subscriptionEndsAt)}</div>
            )}
            {!reviewAccessEnabled && isPaidActive(user) && user?.subscriptionStatus === "active" && user?.subscriptionEndsAt && (
              <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 4 }}>{PLAN_LABELS[currentPlan] || "Plan"} active - renews {formatSubscriptionDate(user.subscriptionEndsAt)}</div>
            )}
            {false && !reviewAccessEnabled && isPaidActive(user) && user?.subscriptionStatus === "active" && user?.subscriptionEndsAt && (
              <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 4 }}>Khata Pro active — renews {formatSubscriptionDate(account.subscriptionEndsAt)}</div>
            )}
          </div>
        </div>

        {user?.role === "admin" && (
          <div className="card" style={{ padding: 14, marginBottom: 14, borderLeft: "4px solid var(--gold)" }}>
            <div className="ledger-block-title">Admin Dashboard</div>
            <div className="ledger-block-caption" style={{ marginTop: 6 }}>
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
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.55, marginBottom: 12 }}>
              {isPersonalOrg
                ? "Household Khata is permanently free. All features are included at no cost — no trial, no subscription required."
                : reviewAccessEnabled
                ? "Review mode is active. Reports, alerts, PDF exports, and advanced insights are fully unlocked for users right now, and upgrade requests are disabled."
                : isPaidActive(user) && user?.subscriptionStatus === "active"
                  ? `${PLAN_LABELS[currentPlan] || "Plan"} is active${user?.subscriptionEndsAt ? ` until ${formatSubscriptionDate(user.subscriptionEndsAt)}` : ""}. You are using ${paidOrgCount}/${paidOrgLimit} paid Khata slots.`
                  : currentPlan !== PLANS.FREE && user?.subscriptionStatus === "trial"
                    ? `${PLAN_LABELS[currentPlan] || "Pro"} trial is active. Household is free, and paid Khatas use your plan slots.`
                    : "Household is free. Pro gives 2 paid Khatas; Business gives 5 paid Khatas."}
            </div>
            {!isPersonalOrg && (
              <>
                  <div className="card" style={{ padding: 12, background: "var(--surface-high)", marginBottom: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                    <div>
                      <div className="ledger-overline" style={{ color: reviewAccessEnabled ? "var(--accent)" : "var(--text-dim)", marginBottom: 6 }}>
                        {reviewAccessEnabled ? "Review Access" : "Free"}
                      </div>
                        <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.5 }}>
                        {reviewAccessEnabled ? "All premium features are open for feedback and testing. Users do not need to upgrade or submit payment proof right now." : "Basic bookkeeping, limited invoices/customers, and no reports."}
                      </div>
                    </div>
                    <div>
                      <div className="ledger-overline" style={{ color: reviewAccessEnabled ? "var(--blue)" : "var(--accent)", marginBottom: 6 }}>
                        {reviewAccessEnabled ? "Upgrade Flow" : "Pro / Business"}
                      </div>
                        <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.5 }}>
                        {reviewAccessEnabled ? "Temporarily disabled while you collect product feedback from early users." : "Pro: 2 paid Khatas for Rs 99/month or Rs 999/year. Business: 5 paid Khatas for Rs 199/month or Rs 1999/year."}
                      </div>
                    </div>
                  </div>
                </div>
                {isPaidActive(user) && user?.subscriptionStatus === "active" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--surface-high)", borderRadius: 8, border: "1px solid var(--border)" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{PLAN_LABELS[currentPlan] || "Plan"} Active</div>
                      <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 1 }}>{paidOrgCount}/{paidOrgLimit} paid Khatas used</div>
                      {user?.subscriptionEndsAt && (
                        <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 1 }}>Renews on {formatSubscriptionDate(user.subscriptionEndsAt)}</div>
                      )}
                    </div>
                    <button className="btn-secondary" onClick={() => { setPendingNewOrgDraft(null); setPaymentOrgId(""); setScreen("plan-request"); }}>Change Plan</button>
                  </div>
                ) : (
                  <button
                    className="btn-secondary"
                    style={{ width: "100%", opacity: reviewAccessEnabled ? 0.55 : 1, cursor: reviewAccessEnabled ? "not-allowed" : "pointer" }}
                    onClick={() => {
                      if (!reviewAccessEnabled) {
                        setPendingNewOrgDraft(null);
                        setPaymentOrgId("");
                        setScreen("plan-request");
                      }
                    }}
                    disabled={reviewAccessEnabled}
                  >
                    {reviewAccessEnabled ? "Manage Subscription Disabled During Review Mode" : "Manage Subscription"}
                  </button>
                )}
                {!reviewAccessEnabled && (
                  <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 8, background: "var(--surface-high)", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-sec)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.4 }}>If your subscription expires</div>
                    <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.55 }}>
                      Your data is never deleted when a plan expires. Paid Khatas switch to read-only — you can view and export everything, but adding new entries requires renewing. Your household Khata stays free and fully active regardless. Contact <a href={`mailto:${APP_SUPPORT_EMAIL}`} style={{ color: "var(--accent)" }}>{APP_SUPPORT_EMAIL}</a> if you need help exporting your data.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="card" style={{ marginTop: 8 }}>
            <MenuRow icon="H" label="Billing History" sub="View past subscription payments and download receipts" onClick={() => setScreen("billing-history")} />
          </div>
          </div>
        )}

        <div className="ledger-block">
          <div className="ledger-block-header">
            <div className="ledger-block-title">{user?.role === "admin" ? "Admin Account" : "Your Profile"}</div>
            <div className="ledger-block-caption">Update your identity, currency, and reporting tools.</div>
          </div>
          <div className="card">
            <MenuRow icon="P" label={user?.role === "admin" ? "Admin Account" : "Personal Profile"} sub={user?.name ? `${user.name} · sign-in details` : "Update your sign-in profile"} onClick={() => setScreen("profile")} />
            <MenuRow icon="$" label="Currency" sub={`${currency?.flag} ${currency?.code} - ${currency?.symbol}`} onClick={() => setShowCurrPicker(true)} />
            {user?.role === "admin" && <MenuRow icon="R" label="Reports" sub={generatingReport ? "Generating admin report..." : "Choose a month and year for the admin report PDF"} onClick={openReportPicker} />}
            {user?.role !== "admin" && (
              <MenuRow
                icon="X"
                label="Delete Account"
                sub="Permanently delete your account and all data"
                danger
                onClick={async () => {
                  const confirmed = await confirm(
                    "This will permanently delete your account, all your financial records, invoices, and data. This cannot be undone.",
                    { title: "Delete Account", confirmLabel: "Delete Permanently" }
                  );
                  if (!confirmed) return;
                  try {
                    await deleteAccount();
                  } catch (err) {
                    showNotice("Could not delete account. Please try again or contact support.", "error");
                  }
                }}
              />
            )}
          </div>
        </div>

        <div className="ledger-block">
          <div className="ledger-block-header">
            <div className="ledger-block-title">Preferences</div>
            <div className="ledger-block-caption">Notifications and support all live here.</div>
          </div>
          <div className="card">
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
            <MenuRow icon="O" label="Sign Out" danger onClick={async () => { if (await confirm("Are you sure you want to sign out?", { title: "Sign Out", confirmLabel: "Sign Out" })) logout(); }} />
          </div>
        </div>
        {showCurrPicker && <CurrencyPicker value={currency} onSelect={cur => { setCurrency(cur); setShowCurrPicker(false); }} onClose={() => setShowCurrPicker(false)} />}
        <OrganizationSwitcherModal
          open={showOrgSwitcher}
          onClose={() => setShowOrgSwitcher(false)}
          organizations={organizations}
          activeOrgId={activeOrgId}
          activeSharedOrgKey={activeSharedOrgKey}
          onSwitch={handleSwitchOrganization}
          onDelete={handleDeleteOrganization}
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

            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7 }}>
                {user?.role === "admin"
                  ? "Pick the month and year you want to export for admin activity reporting."
                  : reportForm.period === "financial-year"
                    ? "This will export one PDF covering the full April to March financial year."
                    : "This will export the selected month as a PDF report."}
              </div>
            </div>
            {user?.role !== "admin" && (
              <div style={{ padding: "12px 0 4px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.6 }}>Report Template</div>
                  <button
                    type="button"
                    onClick={handleReportPreview}
                    disabled={generatingReportPreview}
                    style={{ border: "none", background: "var(--surface-pop)", borderRadius: 10, padding: "6px 12px", cursor: "pointer", color: "var(--text)", fontWeight: 700, fontSize: 12 }}
                  >
                    {generatingReportPreview ? "Generating..." : "Preview Report"}
                  </button>
                </div>
                <TemplatePicker type="report" selected={reportForm.templateId || "classic"} onChange={id => setReportForm(f => ({ ...f, templateId: id }))} />
              </div>
            )}
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
        {reportPreviewUrl && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 1200, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "#16161e", borderBottom: "1px solid #ffffff18" }}>
              <button onClick={() => { URL.revokeObjectURL(reportPreviewUrl); setReportPreviewUrl(null); }} style={{ border: "none", background: "#ffffff18", borderRadius: 10, padding: "8px 14px", cursor: "pointer", color: "#fff", fontWeight: 700, fontSize: 13 }}>Close</button>
              <span style={{ flex: 1, fontSize: 13, color: "#aaa" }}>Select a template above, then click Preview again to compare</span>
              <button onClick={handleReportDownload} disabled={generatingReport} style={{ border: "none", background: "var(--blue)", borderRadius: 10, padding: "8px 16px", cursor: "pointer", color: "#fff", fontWeight: 700, fontSize: 13 }}>{generatingReport ? "Generating..." : "Download PDF"}</button>
            </div>
            <iframe src={reportPreviewUrl} style={{ flex: 1, border: "none", background: "#fff" }} title="Report Preview" />
          </div>
        )}
      </div>
    );
  }

  if (screen === "org-members") {
    return withNotice(
      <OrgMembersScreen onBack={() => setScreen("main")} />
    );
  }

  if (screen === "staff" || screen === "staff-form") {
    return withNotice(
      <StaffScreen
        screen={screen}
        items={orgRecords?.staff || []}
        staffForm={staffForm}
        onStaffFormChange={setStaffForm}
        editStaff={editStaff}
        onOpenNewStaff={openNewStaff}
        onOpenEditStaff={openEditStaff}
        onSaveStaff={saveStaffMember}
        onRemoveStaff={id => removeOrgRecord("staff", id)}
        onBackToList={() => setScreen("staff")}
        onClose={() => setScreen("main")}
        canCreateRecords={!isViewerMode}
        canManageRecord={canManageRecord}
      />
    );
  }

  if (screen === "audit-log") {
    return withNotice(
      <AuditLogScreen onBack={() => setScreen("main")} />
    );
  }

  if (screen === "business-import" && isFreelancerOrg && !isViewerMode) {
    return withNotice(
      <BusinessImportScreen
        onClose={() => setScreen("main")}
        addIncome={addIncome}
        addExpense={addExpense}
        addInvoice={addInvoice}
        invoices={invoices}
        currency={currency}
      />
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
        onSave={!isViewerMode ? saveAcc : undefined}
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
        onLogoChange={handleLogoFile}
      />
    );
  }

  if (screen === "create-org") {
    if (user?.role === "admin") return null;

    // Paid (or trial with 0 orgs): show create form filtered to unowned types
    const availableTypes = getSecondaryOrgTypeOptions(createOrgForm.organizationType);

    async function handleCreateOrg() {
      const cleanAddressLine = String(createOrgForm.addressLine || "").trim();
      const cleanCity = String(createOrgForm.city || "").trim();
      const cleanDistrict = String(createOrgForm.district || "").trim();
      const cleanState = String(createOrgForm.state || "").trim();
      const cleanPincode = sanitizeIndianPincode(createOrgForm.pincode || "");
      const cleanCountry = "India";
      if (!createOrgForm.name?.trim()) { showNotice("Please enter a name for the new Khata."); return; }
      if (!cleanAddressLine || !cleanCity || !cleanDistrict || !cleanState || !cleanPincode) {
        showNotice("Please complete the Khata address before creating it.");
        return;
      }
      if (!isValidIndianPincode(cleanPincode)) {
        showNotice("Please enter a valid 6-digit Indian pincode.");
        return;
      }
      const cleanLocation = buildLocationLabel({ city: cleanCity, district: cleanDistrict, state: cleanState, pincode: cleanPincode, country: cleanCountry });
      const cleanAddress = buildLocationLabel({ addressLine: cleanAddressLine, city: cleanCity, district: cleanDistrict, state: cleanState, pincode: cleanPincode, country: cleanCountry });
      const newOrgType = getOrgType(createOrgForm.organizationType);
      const draftIdSeed = window.crypto?.randomUUID?.() || `${Date.now()}_${Math.random()}`;
      const draft = {
        orgId: `org_${draftIdSeed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24)}`,
        organizationType: newOrgType,
        name: createOrgForm.name.trim(),
        addressLine: cleanAddressLine,
        city: cleanCity,
        district: cleanDistrict,
        state: cleanState,
        pincode: cleanPincode,
        country: cleanCountry,
        location: cleanLocation,
        address: cleanAddress
      };
      if (newOrgType !== ORG_TYPES.PERSONAL && !canCreatePaidOrg(user, ownedOrganizations)) {
        setPendingNewOrgDraft(draft);
        setPaymentOrgId(draft.orgId);
        setPlanRequestForm(current => ({
          ...current,
          targetPlan: canCreatePaidOrg(user, ownedOrganizations, PLANS.PRO) ? PLANS.PRO : PLANS.BUSINESS
        }));
        setScreen("plan-request");
        showNotice("Choose a plan to create and activate this Khata.");
        return;
      }
      const res = await createOrganization(draft);
      if (res?.error === "UPGRADE_REQUIRED") { setScreen("plan-request"); return; }
      if (res?.error) { showNotice(res.error); return; }
      setScreen("main");
    }

    return withNotice(
      <Modal title="New Khata" onClose={() => setScreen("main")} onSave={handleCreateOrg} saveLabel="Continue" canSave={!!createOrgForm.name?.trim()}>
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
            placeholder="e.g. Business, Lake View Society"
            value={createOrgForm.name || ""}
            onChange={e => setCreateOrgForm(f => ({ ...f, name: e.target.value }))}
          />
        </Field>
        <Field label="Address" required hint="Building, street, area, and landmark.">
          <Input
            placeholder="Lake View Residency, MG Road"
            value={createOrgForm.addressLine || ""}
            onChange={e => setCreateOrgForm(f => ({ ...f, addressLine: e.target.value }))}
            autoComplete="street-address"
          />
        </Field>
        <div className="desktop-grid-2">
          <Field label="City" required>
            <Input
              placeholder="Hyderabad"
              value={createOrgForm.city || ""}
              onChange={e => setCreateOrgForm(f => ({ ...f, city: e.target.value }))}
              autoComplete="address-level2"
            />
          </Field>
          <Field label="District" required>
            <Input
              placeholder="Hyderabad"
              value={createOrgForm.district || ""}
              onChange={e => setCreateOrgForm(f => ({ ...f, district: e.target.value }))}
              autoComplete="address-level2"
            />
          </Field>
        </div>
        <div className="desktop-grid-2">
          <Field label="State" required>
            <Select
              value={createOrgForm.state || ""}
              onChange={e => setCreateOrgForm(f => ({ ...f, state: e.target.value }))}
            >
              <option value="">Select state</option>
              {createOrgStateProvinceOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
          </Field>
          <Field label="Pincode" required>
            <Input
              inputMode="numeric"
              maxLength={6}
              placeholder="500081"
              value={createOrgForm.pincode || ""}
              onChange={e => setCreateOrgForm(f => ({ ...f, pincode: sanitizeIndianPincode(e.target.value) }))}
              autoComplete="postal-code"
            />
          </Field>
        </div>
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
        allExpenses={expenses}
        allIncome={income}
        isApartmentOrg={isApartmentOrg}
        expensesLoaded={collectionFetched?.expenses ?? false}
        incomeLoaded={collectionFetched?.income ?? false}
        canManageRecord={canManageRecord}
        canCreateRecords={!isViewerMode}
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

  if (screen === "apartment-import" && isApartmentOrg && !isViewerMode) {
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
      <Modal title={activeOrgSection.label} onClose={() => setScreen("main")} onSave={!isViewerMode ? openNewOrgRecord : undefined} saveLabel={`Add ${activeOrgSection.entryLabel}`}>
        {items.length === 0 ? (
          <WorkflowSetupCard
            title={`Add your first ${activeOrgSection.entryLabel.toLowerCase()}`}
            body={`Create a ${activeOrgSection.entryLabel.toLowerCase()} record to tailor this khata to your workflow.`}
            tone="blue"
          />
        ) : (
          <div className="card">
            {items.map(item => (
              <WorkflowRecordCard
                key={item.id}
                title={item[activeOrgSection.fields[0]?.key] || activeOrgSection.entryLabel}
                meta={[
                  activeOrgSection.fields.slice(1).map(field => item[field.key]).filter(Boolean).join(" · "),
                  activeOrgSection.key === "services" ? `${Array.isArray(item.products) ? item.products.length : 0} product(s)` : ""
                ].filter(Boolean).join(" · ")}
                actions={(canManageRecord?.(item) ?? !isViewerMode) ? [
                  { label: "Edit", onClick: () => openEditOrgRecord(item), tone: "blue" },
                  {
                    label: "Delete",
                    onClick: async () => { if (await confirm(`Remove this ${activeOrgSection.entryLabel.toLowerCase()}?`, { title: "Delete Record", confirmLabel: "Delete" })) removeOrgRecord(activeOrgSection.key, item.id); },
                    tone: "danger"
                  }
                ] : []}
              />
            ))}
          </div>
        )}
      </Modal>
    );
  }

  if (screen === "org-record-form" && activeOrgSection && orgRecordForm) {
    return withNotice(
      <Modal title={editOrgRecord ? `Edit ${activeOrgSection.entryLabel}` : `New ${activeOrgSection.entryLabel}`} onClose={() => setScreen("org-records")} onSave={(editOrgRecord ? (canManageRecord?.(editOrgRecord) ?? !isViewerMode) : !isViewerMode) ? saveOrgSectionRecord : undefined} canSave={true}>
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
        onClose={() => { setPendingNewOrgDraft(null); setScreen("main"); }}
        orgType={selectedPaymentOrg?.organizationType || orgType}
        orgName={selectedPaymentOrg?.name || account?.name || ""}
        orgId={selectedPaymentOrg?.id || activeOrgId || ""}
        user={user}
        organizations={ownedOrganizations}
        selectedOrgId={paymentOrgId || selectedPaymentOrg?.id || ""}
        onSelectedOrgIdChange={setPaymentOrgId}
        lockedOrgSelection={Boolean(pendingNewOrgDraft)}
      />
    );
  }

  if (screen === "billing-history" && user?.role !== "admin") {
    return withNotice(
      <SubscriptionHistoryScreen onBack={() => setScreen("main")} />
    );
  }

  return withNotice(
    <UpgradeModal open={!!upgradeInfo} title={upgradeInfo?.title} message={upgradeInfo?.message} onClose={() => setUpgradeInfo(null)} />
  );
}
