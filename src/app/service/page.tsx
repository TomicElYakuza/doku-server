"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import AccessDeniedCard from "../../components/AccessDeniedCard";
import AppModal from "../../components/AppModal";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import PageHero from "../../components/PageHero";
import StatCard from "../../components/StatCard";
import {
  assignableUserRepository,
  type AssignableUser,
} from "../../lib/assignableUserRepository";
import { companyRepository } from "../../lib/companyRepository";
import { serviceCenterRepository } from "../../lib/serviceCenterRepository";
import type { Company, Department } from "../../types/company";
import type {
  ServiceCase,
  ServiceCaseInput,
  ServiceCasePriority,
  ServiceCaseStatus,
  ServiceCaseType,
  ServicePaymentStatus,
} from "../../types/service";

type ViewMode = "table" | "cards";
type ServiceAssignableUser = AssignableUser;

type ServiceForm = {
  customerName: string;
  customerCompanyName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerNotes: string;
  type: ServiceCaseType;
  status: ServiceCaseStatus;
  priority: ServiceCasePriority;
  title: string;
  description: string;
  deviceName: string;
  deviceSerialNumber: string;
  deviceAccessories: string;
  intakeNotes: string;
  internalNotes: string;
  assignedUserId: string;
  assignedUserName: string;
  companyId: string;
  departmentId: string;
  inventoryAssetId: string;
  ticketId: string;
  quoteAmount: number;
  materialCost: number;
  laborCost: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: ServicePaymentStatus;
  paymentMethod: string;
  receiptNumber: string;
  intakeDate: string;
  dueDate: string;
  completedAt: string;
};

const emptyForm: ServiceForm = {
  customerName: "",
  customerCompanyName: "",
  customerEmail: "",
  customerPhone: "",
  customerAddress: "",
  customerNotes: "",
  type: "repair",
  status: "new",
  priority: "normal",
  title: "",
  description: "",
  deviceName: "",
  deviceSerialNumber: "",
  deviceAccessories: "",
  intakeNotes: "",
  internalNotes: "",
  assignedUserId: "",
  assignedUserName: "",
  companyId: "",
  departmentId: "",
  inventoryAssetId: "",
  ticketId: "",
  quoteAmount: 0,
  materialCost: 0,
  laborCost: 0,
  totalAmount: 0,
  paidAmount: 0,
  paymentStatus: "open",
  paymentMethod: "",
  receiptNumber: "",
  intakeDate: "",
  dueDate: "",
  completedAt: "",
};

const typeOptions: Array<{ value: ServiceCaseType; label: string }> = [
  { value: "repair", label: "Reparatur" },
  { value: "sale", label: "Verkauf" },
  { value: "consulting", label: "Beratung" },
  { value: "warranty", label: "Garantie" },
  { value: "complaint", label: "Reklamation" },
  { value: "maintenance", label: "Wartung" },
  { value: "other", label: "Sonstiges" },
];

const statusOptions: Array<{ value: ServiceCaseStatus; label: string }> = [
  { value: "new", label: "Neu" },
  { value: "checking", label: "In Prüfung" },
  { value: "offer", label: "Angebot" },
  { value: "in_progress", label: "In Arbeit" },
  { value: "waiting_customer", label: "Wartet auf Kunde" },
  { value: "ready_for_pickup", label: "Abholbereit" },
  { value: "completed", label: "Abgeschlossen" },
  { value: "cancelled", label: "Storniert" },
];

const priorityOptions: Array<{ value: ServiceCasePriority; label: string }> = [
  { value: "low", label: "Niedrig" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Hoch" },
  { value: "urgent", label: "Dringend" },
];

const paymentStatusOptions: Array<{
  value: ServicePaymentStatus;
  label: string;
}> = [
  { value: "open", label: "Offen" },
  { value: "partial", label: "Teilbezahlt" },
  { value: "paid", label: "Bezahlt" },
  { value: "refunded", label: "Erstattet" },
  { value: "cancelled", label: "Storniert" },
];

function normalizeType(value: string): ServiceCaseType {
  if (
    value === "repair" ||
    value === "sale" ||
    value === "consulting" ||
    value === "warranty" ||
    value === "complaint" ||
    value === "maintenance" ||
    value === "other"
  ) {
    return value;
  }

  return "repair";
}

function normalizeStatus(value: string): ServiceCaseStatus {
  if (
    value === "new" ||
    value === "checking" ||
    value === "offer" ||
    value === "in_progress" ||
    value === "waiting_customer" ||
    value === "ready_for_pickup" ||
    value === "completed" ||
    value === "cancelled"
  ) {
    return value;
  }

  return "new";
}

function normalizePriority(value: string): ServiceCasePriority {
  if (
    value === "low" ||
    value === "normal" ||
    value === "high" ||
    value === "urgent"
  ) {
    return value;
  }

  return "normal";
}

function normalizePaymentStatus(value: string): ServicePaymentStatus {
  if (
    value === "open" ||
    value === "partial" ||
    value === "paid" ||
    value === "refunded" ||
    value === "cancelled"
  ) {
    return value;
  }

  return "open";
}

function normalizeMoney(value: unknown) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return 0;
  }

  return Math.round(numberValue * 100) / 100;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));
}

function formatDate(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("de-AT");
}

function getStatusClass(status: string) {
  if (status === "new") {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  if (status === "checking" || status === "offer") {
    return "bg-indigo-50 text-indigo-700 border-indigo-100";
  }

  if (status === "in_progress") {
    return "bg-orange-50 text-orange-700 border-orange-100";
  }

  if (status === "waiting_customer") {
    return "bg-purple-50 text-purple-700 border-purple-100";
  }

  if (status === "ready_for_pickup") {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }

  if (status === "completed") {
    return "bg-green-50 text-green-700 border-green-100";
  }

  if (status === "cancelled") {
    return "bg-zinc-100 text-zinc-600 border-zinc-200";
  }

  return "bg-zinc-100 text-zinc-700 border-zinc-200";
}

function getPriorityClass(priority: string) {
  if (priority === "urgent") {
    return "bg-red-50 text-red-700 border-red-100";
  }

  if (priority === "high") {
    return "bg-orange-50 text-orange-700 border-orange-100";
  }

  if (priority === "normal") {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  return "bg-zinc-100 text-zinc-700 border-zinc-200";
}

function getPaymentClass(status: string) {
  if (status === "paid") {
    return "bg-green-50 text-green-700 border-green-100";
  }

  if (status === "partial") {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  if (status === "open") {
    return "bg-orange-50 text-orange-700 border-orange-100";
  }

  if (status === "refunded") {
    return "bg-purple-50 text-purple-700 border-purple-100";
  }

  return "bg-zinc-100 text-zinc-600 border-zinc-200";
}

function getTypeIcon(type: string) {
  if (type === "repair") {
    return "◇";
  }

  if (type === "sale") {
    return "€";
  }

  if (type === "warranty") {
    return "✓";
  }

  if (type === "complaint") {
    return "!";
  }

  if (type === "maintenance") {
    return "◫";
  }

  return "○";
}

function serviceCaseToForm(serviceCase: ServiceCase): ServiceForm {
  return {
    customerName: serviceCase.customerName || "",
    customerCompanyName: "",
    customerEmail: serviceCase.customerEmail || "",
    customerPhone: serviceCase.customerPhone || "",
    customerAddress: "",
    customerNotes: serviceCase.customerNotes || "",
    type: normalizeType(serviceCase.type),
    status: normalizeStatus(serviceCase.status),
    priority: normalizePriority(serviceCase.priority),
    title: serviceCase.title || "",
    description: serviceCase.description || "",
    deviceName: serviceCase.deviceName || "",
    deviceSerialNumber: serviceCase.deviceSerialNumber || "",
    deviceAccessories: serviceCase.deviceAccessories || "",
    intakeNotes: serviceCase.intakeNotes || "",
    internalNotes: serviceCase.internalNotes || "",
    assignedUserId: serviceCase.assignedUserId || "",
    assignedUserName: serviceCase.assignedUserName || "",
    companyId: serviceCase.companyId || "",
    departmentId: serviceCase.departmentId || "",
    inventoryAssetId: serviceCase.inventoryAssetId || "",
    ticketId: serviceCase.ticketId || "",
    quoteAmount: Number(serviceCase.quoteAmount || 0),
    materialCost: Number(serviceCase.materialCost || 0),
    laborCost: Number(serviceCase.laborCost || 0),
    totalAmount: Number(serviceCase.totalAmount || 0),
    paidAmount: Number(serviceCase.paidAmount || 0),
    paymentStatus: normalizePaymentStatus(serviceCase.paymentStatus),
    paymentMethod: serviceCase.paymentMethod || "",
    receiptNumber: serviceCase.receiptNumber || "",
    intakeDate: serviceCase.intakeDate || "",
    dueDate: serviceCase.dueDate || "",
    completedAt: serviceCase.completedAt || "",
  };
}

function formToInput(form: ServiceForm): ServiceCaseInput {
  return {
    customerName: form.customerName.trim(),
    customerCompanyName: form.customerCompanyName.trim(),
    customerEmail: form.customerEmail.trim(),
    customerPhone: form.customerPhone.trim(),
    customerAddress: form.customerAddress.trim(),
    customerNotes: form.customerNotes.trim(),
    type: form.type,
    status: form.status,
    priority: form.priority,
    title: form.title.trim(),
    description: form.description.trim(),
    deviceName: form.deviceName.trim(),
    deviceSerialNumber: form.deviceSerialNumber.trim(),
    deviceAccessories: form.deviceAccessories.trim(),
    intakeNotes: form.intakeNotes.trim(),
    internalNotes: form.internalNotes.trim(),
    assignedUserId: form.assignedUserId.trim(),
    assignedUserName: form.assignedUserName.trim(),
    companyId: form.companyId.trim(),
    departmentId: form.departmentId.trim(),
    inventoryAssetId: form.inventoryAssetId.trim(),
    ticketId: form.ticketId.trim(),
    quoteAmount: normalizeMoney(form.quoteAmount),
    materialCost: normalizeMoney(form.materialCost),
    laborCost: normalizeMoney(form.laborCost),
    totalAmount: normalizeMoney(form.totalAmount),
    paidAmount: normalizeMoney(form.paidAmount),
    paymentStatus: form.paymentStatus,
    paymentMethod: form.paymentMethod.trim(),
    receiptNumber: form.receiptNumber.trim(),
    intakeDate: form.intakeDate,
    dueDate: form.dueDate,
    completedAt: form.completedAt,
  };
}

export default function ServiceCenterPage() {
  const [mounted, setMounted] = useState(false);
  const [serviceCases, setServiceCases] = useState<ServiceCase[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<ServiceAssignableUser[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCaseId, setEditingCaseId] = useState("");
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    void loadData();

    function handleServiceCasesUpdated() {
      void loadData();
    }

    window.addEventListener("serviceCasesUpdated", handleServiceCasesUpdated);

    return () => {
      window.removeEventListener("serviceCasesUpdated", handleServiceCasesUpdated);
    };
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [nextCases, nextCompanies, nextDepartments, nextUsers] =
        await Promise.all([
          serviceCenterRepository.list(),
          companyRepository.listCompanies(),
          companyRepository.listDepartments(),
          assignableUserRepository.list(),
        ]);

      setServiceCases(Array.isArray(nextCases) ? nextCases : []);
      setCompanies(Array.isArray(nextCompanies) ? nextCompanies : []);
      setDepartments(Array.isArray(nextDepartments) ? nextDepartments : []);
      setUsers(Array.isArray(nextUsers) ? nextUsers : []);
    } catch (loadError) {
      console.error(loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Service-Center konnte nicht geladen werden.",
      );
    } finally {
      setLoading(false);
    }
  }

  function updateForm<TKey extends keyof ServiceForm>(
    key: TKey,
    value: ServiceForm[TKey],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetFilters() {
    setSearch("");
    setTypeFilter("");
    setStatusFilter("");
    setPaymentFilter("");
    setPriorityFilter("");
    setCompanyFilter("");
    setDepartmentFilter("");
  }

  function openCreateModal() {
    setEditingCaseId("");
    setForm({
      ...emptyForm,
      intakeDate: new Date().toISOString().slice(0, 10),
    });
    setMessage("");
    setError("");
    setModalOpen(true);
  }

  function openEditModal(serviceCase: ServiceCase) {
    setEditingCaseId(serviceCase.id);
    setForm(serviceCaseToForm(serviceCase));
    setMessage("");
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    setEditingCaseId("");
    setForm(emptyForm);
    setModalOpen(false);
  }

  function getCompanyName(companyId?: string) {
    if (!companyId) {
      return "";
    }

    return companies.find((company) => company.id === companyId)?.name || "";
  }

  function getDepartmentName(departmentId?: string) {
    if (!departmentId) {
      return "";
    }

    return (
      departments.find((department) => department.id === departmentId)?.name || ""
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!form.customerName.trim()) {
      alert("Bitte einen Kunden eingeben.");
      return;
    }

    if (!form.title.trim()) {
      alert("Bitte einen Titel eingeben.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const input = formToInput(form);

      if (editingCaseId) {
        const updatedCase = await serviceCenterRepository.update(
          editingCaseId,
          input,
        );

        setServiceCases((current) =>
          current.map((serviceCase) =>
            serviceCase.id === updatedCase.id ? updatedCase : serviceCase,
          ),
        );

        closeModal();
        setMessage("Servicefall wurde gespeichert.");
        return;
      }

      const createdCase = await serviceCenterRepository.create(input);

      setServiceCases((current) => [createdCase, ...current]);
      closeModal();
      setMessage("Servicefall wurde erstellt.");
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Servicefall konnte nicht gespeichert werden.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteServiceCase(serviceCase: ServiceCase) {
    const confirmed = confirm(
      `Servicefall "${serviceCase.title}" wirklich löschen?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setError("");

      await serviceCenterRepository.delete(serviceCase.id);

      setServiceCases((current) =>
        current.filter((item) => item.id !== serviceCase.id),
      );
      setMessage("Servicefall wurde gelöscht.");
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Servicefall konnte nicht gelöscht werden.",
      );
    }
  }

  const filteredDepartments = useMemo(() => {
    if (!companyFilter) {
      return departments;
    }

    return departments.filter(
      (department) => department.companyId === companyFilter,
    );
  }, [departments, companyFilter]);

  const formDepartments = useMemo(() => {
    if (!form.companyId) {
      return departments;
    }

    return departments.filter(
      (department) => department.companyId === form.companyId,
    );
  }, [departments, form.companyId]);

  const calculatedTotal = useMemo(
    () =>
      normalizeMoney(form.quoteAmount) +
      normalizeMoney(form.materialCost) +
      normalizeMoney(form.laborCost),
    [form.quoteAmount, form.materialCost, form.laborCost],
  );

  const filteredCases = useMemo(() => {
    const query = search.trim().toLowerCase();

    return serviceCases.filter((serviceCase) => {
      const companyName = getCompanyName(serviceCase.companyId);
      const departmentName = getDepartmentName(serviceCase.departmentId);

      const matchesSearch =
        !query ||
        [
          serviceCase.caseNumber,
          serviceCase.customerName,
          serviceCase.customerEmail,
          serviceCase.customerPhone,
          serviceCase.title,
          serviceCase.description,
          serviceCase.deviceName,
          serviceCase.deviceSerialNumber,
          serviceCase.assignedUserName,
          serviceCase.receiptNumber,
          companyName,
          departmentName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesType = !typeFilter || serviceCase.type === typeFilter;
      const matchesStatus = !statusFilter || serviceCase.status === statusFilter;
      const matchesPayment =
        !paymentFilter || serviceCase.paymentStatus === paymentFilter;
      const matchesPriority =
        !priorityFilter || serviceCase.priority === priorityFilter;
      const matchesCompany =
        !companyFilter || serviceCase.companyId === companyFilter;
      const matchesDepartment =
        !departmentFilter || serviceCase.departmentId === departmentFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesPayment &&
        matchesPriority &&
        matchesCompany &&
        matchesDepartment
      );
    });
  }, [
    serviceCases,
    search,
    typeFilter,
    statusFilter,
    paymentFilter,
    priorityFilter,
    companyFilter,
    departmentFilter,
    companies,
    departments,
  ]);

  const newCount = serviceCases.filter(
    (serviceCase) => serviceCase.status === "new",
  ).length;
  const inProgressCount = serviceCases.filter(
    (serviceCase) =>
      serviceCase.status === "checking" ||
      serviceCase.status === "offer" ||
      serviceCase.status === "in_progress",
  ).length;
  const pickupCount = serviceCases.filter(
    (serviceCase) => serviceCase.status === "ready_for_pickup",
  ).length;
  const openPaymentAmount = serviceCases.reduce((sum, serviceCase) => {
    if (serviceCase.paymentStatus === "paid") {
      return sum;
    }

    return sum + Math.max(0, serviceCase.totalAmount - serviceCase.paidAmount);
  }, 0);

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-8">
      <AppModal
        open={modalOpen}
        title={editingCaseId ? "Servicefall bearbeiten" : "Servicefall erstellen"}
        description="Kundenannahme, Gerät, Status, Zuweisung und Zahlung erfassen."
        onClose={closeModal}
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="bg-zinc-100 hover:bg-zinc-200 px-5 py-3 rounded-2xl transition font-bold"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              form="service-form"
              disabled={saving}
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow disabled:opacity-60"
            >
              {saving
                ? "Speichert..."
                : editingCaseId
                  ? "Änderungen speichern"
                  : "Servicefall erstellen"}
            </button>
          </>
        }
      >
        <form
          id="service-form"
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-8"
        >
          <section className="bg-zinc-50 border border-zinc-100 rounded-3xl p-5">
            <h3 className="text-xl font-black">Kunde</h3>
            <p className="text-zinc-500 mt-1">
              Kundendaten für Annahme, Verkauf, Reparatur oder Reklamation.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Kundenname
                </span>
                <input
                  value={form.customerName}
                  onChange={(event) =>
                    updateForm("customerName", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="Max Mustermann"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Firma optional
                </span>
                <input
                  value={form.customerCompanyName}
                  onChange={(event) =>
                    updateForm("customerCompanyName", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="Firma"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">E-Mail</span>
                <input
                  value={form.customerEmail}
                  onChange={(event) =>
                    updateForm("customerEmail", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="kunde@example.com"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">Telefon</span>
                <input
                  value={form.customerPhone}
                  onChange={(event) =>
                    updateForm("customerPhone", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="+43 ..."
                />
              </label>

              <label className="md:col-span-2 space-y-2">
                <span className="text-sm font-bold text-zinc-600">Adresse</span>
                <input
                  value={form.customerAddress}
                  onChange={(event) =>
                    updateForm("customerAddress", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="Adresse"
                />
              </label>
            </div>
          </section>

          <section className="bg-zinc-50 border border-zinc-100 rounded-3xl p-5">
            <h3 className="text-xl font-black">Servicefall</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">Titel</span>
                <input
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="z. B. Notebook startet nicht"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">Typ</span>
                <select
                  value={form.type}
                  onChange={(event) =>
                    updateForm("type", normalizeType(event.target.value))
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">Status</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    updateForm("status", normalizeStatus(event.target.value))
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Priorität
                </span>
                <select
                  value={form.priority}
                  onChange={(event) =>
                    updateForm("priority", normalizePriority(event.target.value))
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="md:col-span-2 space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Beschreibung
                </span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                  rows={4}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus resize-none"
                  placeholder="Problem, Wunsch, Verkaufs-/Servicebeschreibung..."
                />
              </label>
            </div>
          </section>

          <section className="bg-zinc-50 border border-zinc-100 rounded-3xl p-5">
            <h3 className="text-xl font-black">Gerät / Artikel</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Gerät / Artikel
                </span>
                <input
                  value={form.deviceName}
                  onChange={(event) =>
                    updateForm("deviceName", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="Notebook, PC, Monitor, Zubehör..."
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Seriennummer
                </span>
                <input
                  value={form.deviceSerialNumber}
                  onChange={(event) =>
                    updateForm("deviceSerialNumber", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="Seriennummer"
                />
              </label>

              <label className="md:col-span-2 space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Mitgebrachtes Zubehör
                </span>
                <textarea
                  value={form.deviceAccessories}
                  onChange={(event) =>
                    updateForm("deviceAccessories", event.target.value)
                  }
                  rows={3}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus resize-none"
                  placeholder="Netzteil, Tasche, Kabel, Datenträger..."
                />
              </label>
            </div>
          </section>

          <section className="bg-zinc-50 border border-zinc-100 rounded-3xl p-5">
            <h3 className="text-xl font-black">Zuweisung</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <label className="md:col-span-2 space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Zuständiger Mitarbeiter
                </span>
                <select
                  value={form.assignedUserId}
                  onChange={(event) => {
                    const selectedUser = users.find(
                      (user) => user.id === event.target.value,
                    );

                    updateForm("assignedUserId", selectedUser?.id || "");
                    updateForm("assignedUserName", selectedUser?.name || "");
                  }}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  <option value="">Nicht zugewiesen</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} · {user.email}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">Firma</span>
                <select
                  value={form.companyId}
                  onChange={(event) => {
                    updateForm("companyId", event.target.value);
                    updateForm("departmentId", "");
                  }}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  <option value="">Keine Firma</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Abteilung
                </span>
                <select
                  value={form.departmentId}
                  onChange={(event) =>
                    updateForm("departmentId", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  <option value="">Keine Abteilung</option>
                  {formDepartments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="bg-zinc-50 border border-zinc-100 rounded-3xl p-5">
            <h3 className="text-xl font-black">Beträge & Zahlung</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Kostenvoranschlag
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.quoteAmount}
                  onChange={(event) =>
                    updateForm("quoteAmount", Number(event.target.value || 0))
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Materialkosten
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.materialCost}
                  onChange={(event) =>
                    updateForm("materialCost", Number(event.target.value || 0))
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Arbeitskosten
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.laborCost}
                  onChange={(event) =>
                    updateForm("laborCost", Number(event.target.value || 0))
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Gesamtbetrag
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.totalAmount}
                  onChange={(event) =>
                    updateForm("totalAmount", Number(event.target.value || 0))
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder={String(calculatedTotal)}
                />
                <span className="text-xs text-zinc-400">
                  Vorschlag: {formatMoney(calculatedTotal)}
                </span>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Bezahlt
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.paidAmount}
                  onChange={(event) =>
                    updateForm("paidAmount", Number(event.target.value || 0))
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Zahlungsstatus
                </span>
                <select
                  value={form.paymentStatus}
                  onChange={(event) =>
                    updateForm(
                      "paymentStatus",
                      normalizePaymentStatus(event.target.value),
                    )
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  {paymentStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Zahlungsmethode
                </span>
                <input
                  value={form.paymentMethod}
                  onChange={(event) =>
                    updateForm("paymentMethod", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="Bar, Karte, Überweisung..."
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-bold text-zinc-600">
                  Beleg-/Rechnungsnummer
                </span>
                <input
                  value={form.receiptNumber}
                  onChange={(event) =>
                    updateForm("receiptNumber", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="Belegnummer"
                />
              </label>
            </div>
          </section>

          <section className="bg-zinc-50 border border-zinc-100 rounded-3xl p-5">
            <h3 className="text-xl font-black">Termine & Notizen</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Annahmedatum
                </span>
                <input
                  type="date"
                  value={form.intakeDate}
                  onChange={(event) =>
                    updateForm("intakeDate", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Fällig bis
                </span>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => updateForm("dueDate", event.target.value)}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Abschlussdatum
                </span>
                <input
                  type="datetime-local"
                  value={form.completedAt}
                  onChange={(event) =>
                    updateForm("completedAt", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                />
              </label>

              <label className="md:col-span-3 space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Annahme-Notizen
                </span>
                <textarea
                  value={form.intakeNotes}
                  onChange={(event) =>
                    updateForm("intakeNotes", event.target.value)
                  }
                  rows={3}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus resize-none"
                  placeholder="Zustand bei Annahme, Kundenaussage, sichtbare Schäden..."
                />
              </label>

              <label className="md:col-span-3 space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Interne Notizen
                </span>
                <textarea
                  value={form.internalNotes}
                  onChange={(event) =>
                    updateForm("internalNotes", event.target.value)
                  }
                  rows={3}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus resize-none"
                  placeholder="Interne Diagnose, Arbeitsschritte, Ersatzteile..."
                />
              </label>
            </div>
          </section>
        </form>
      </AppModal>

      <PageHero
        eyebrow="Kundenannahme"
        title="Service-Center"
        description="Kunden, Reparaturen, Verkäufe, Reklamationen, Zahlungen und Abholungen zentral verwalten."
        badges={[
          { label: `${serviceCases.length} Fälle` },
          { label: `${newCount} neu` },
          { label: `${inProgressCount} in Arbeit` },
          { label: `${pickupCount} abholbereit` },
          { label: `${formatMoney(openPaymentAmount)} offen` },
        ]}
        actions={
          <>
            <button
              type="button"
              onClick={() => void loadData()}
              className="bg-white/10 text-white border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/20 transition font-bold"
            >
              Aktualisieren
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
            >
              Servicefall erstellen
            </button>
          </>
        }
      />

      {loading && (
        <LoadingState
          title="Service-Center wird geladen..."
          description="Fälle, Kunden, Zahlungen und Zuweisungen werden vorbereitet."
        />
      )}

      {message && (
        <section className="bg-green-50 border border-green-100 rounded-3xl p-6 shadow-sm">
          <p className="text-green-700 font-bold">{message}</p>
        </section>
      )}

      {error && (
        <EmptyState
          icon="⚠️"
          title="Service-Center konnte nicht geladen werden"
          description={error}
          action={
            <button
              type="button"
              onClick={() => void loadData()}
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
            >
              Erneut laden
            </button>
          }
        />
      )}

      {!loading && error.includes("Keine Berechtigung") && <AccessDeniedCard />}

      {!error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              label="Neu"
              value={newCount}
              description="Neue Servicefälle"
              icon="◇"
              tone="blue"
              active={statusFilter === "new"}
              onClick={() => setStatusFilter("new")}
            />
            <StatCard
              label="In Arbeit"
              value={inProgressCount}
              description="Prüfung, Angebot, Arbeit"
              icon="◫"
              tone="orange"
              active={statusFilter === "in_progress"}
              onClick={() => setStatusFilter("in_progress")}
            />
            <StatCard
              label="Abholbereit"
              value={pickupCount}
              description="Bereit für Kunden"
              icon="✓"
              tone="green"
              active={statusFilter === "ready_for_pickup"}
              onClick={() => setStatusFilter("ready_for_pickup")}
            />
            <StatCard
              label="Offen"
              value={formatMoney(openPaymentAmount)}
              description="Offene Zahlungen"
              icon="€"
              tone="indigo"
              active={paymentFilter === "open"}
              onClick={() => setPaymentFilter("open")}
            />
          </div>

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

            <div className="relative">
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                <div>
                  <h2 className="text-2xl font-black">Suche & Filter</h2>
                  <p className="text-zinc-500 mt-1">
                    Filtere nach Kunde, Status, Typ, Zahlung, Priorität oder Organisation.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={`px-4 py-2 rounded-xl transition font-medium ${
                      viewMode === "table"
                        ? "app-accent-bg text-white app-brand-shadow"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
                    }`}
                  >
                    Tabelle
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("cards")}
                    className={`px-4 py-2 rounded-xl transition font-medium ${
                      viewMode === "cards"
                        ? "app-accent-bg text-white app-brand-shadow"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
                    }`}
                  >
                    Karten
                  </button>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition font-medium"
                  >
                    Zurücksetzen
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-6 gap-4 mt-5">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Servicefälle suchen..."
                  className="xl:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                />

                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  <option value="">Alle Typen</option>
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  <option value="">Alle Status</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={paymentFilter}
                  onChange={(event) => setPaymentFilter(event.target.value)}
                  className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  <option value="">Alle Zahlungen</option>
                  {paymentStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={priorityFilter}
                  onChange={(event) => setPriorityFilter(event.target.value)}
                  className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  <option value="">Alle Prioritäten</option>
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={companyFilter}
                  onChange={(event) => {
                    setCompanyFilter(event.target.value);
                    setDepartmentFilter("");
                  }}
                  className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  <option value="">Alle Firmen</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>

                <select
                  value={departmentFilter}
                  onChange={(event) => setDepartmentFilter(event.target.value)}
                  className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  <option value="">Alle Abteilungen</option>
                  {filteredDepartments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-sm text-zinc-500 mt-5">
                {filteredCases.length} von {serviceCases.length} Servicefällen gefunden.
              </p>
            </div>
          </section>

          {!loading && filteredCases.length === 0 && (
            <EmptyState
              icon="◇"
              title="Keine Servicefälle gefunden"
              description="Erstelle den ersten Servicefall oder passe die Filter an."
              action={
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
                >
                  Servicefall erstellen
                </button>
              }
            />
          )}

          {viewMode === "table" && filteredCases.length > 0 && (
            <section className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-5 py-4 font-bold text-zinc-500">Fall</th>
                      <th className="px-5 py-4 font-bold text-zinc-500">Kunde</th>
                      <th className="px-5 py-4 font-bold text-zinc-500">Status</th>
                      <th className="px-5 py-4 font-bold text-zinc-500">Zahlung</th>
                      <th className="px-5 py-4 font-bold text-zinc-500">Zuweisung</th>
                      <th className="px-5 py-4 font-bold text-zinc-500 text-right">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredCases.map((serviceCase) => (
                      <tr key={serviceCase.id} className="hover:bg-zinc-50 transition">
                        <td className="px-5 py-4 align-top min-w-[320px]">
                          <div className="flex items-start gap-3">
                            <span className="h-11 w-11 rounded-2xl border bg-indigo-50 text-indigo-700 border-indigo-100 flex items-center justify-center font-black shrink-0">
                              {getTypeIcon(serviceCase.type)}
                            </span>
                            <div>
                              <p className="font-black text-zinc-950">
                                {serviceCase.title}
                              </p>
                              <p className="text-xs text-zinc-400 mt-1">
                                {serviceCase.caseNumber}
                              </p>
                              <p className="text-zinc-500 mt-2">
                                {serviceCase.deviceName || "Kein Gerät/Artikel"}
                              </p>
                              {serviceCase.deviceSerialNumber && (
                                <p className="text-xs text-zinc-400 mt-1">
                                  SN: {serviceCase.deviceSerialNumber}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 align-top">
                          <p className="font-bold">{serviceCase.customerName}</p>
                          <p className="text-xs text-zinc-500 mt-1">
                            {serviceCase.customerEmail || "Keine E-Mail"}
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">
                            {serviceCase.customerPhone || "Kein Telefon"}
                          </p>
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`text-xs px-3 py-1 rounded-full border font-bold ${getStatusClass(
                                serviceCase.status,
                              )}`}
                            >
                              {serviceCenterRepository.getStatusLabel(
                                serviceCase.status,
                              )}
                            </span>
                            <span
                              className={`text-xs px-3 py-1 rounded-full border font-bold ${getPriorityClass(
                                serviceCase.priority,
                              )}`}
                            >
                              {serviceCenterRepository.getPriorityLabel(
                                serviceCase.priority,
                              )}
                            </span>
                          </div>
                          {serviceCase.dueDate && (
                            <p className="text-xs text-zinc-500 mt-2">
                              Fällig: {formatDate(serviceCase.dueDate)}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 align-top">
                          <p className="font-black">
                            {formatMoney(serviceCase.totalAmount)}
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">
                            Bezahlt: {formatMoney(serviceCase.paidAmount)}
                          </p>
                          <span
                            className={`inline-flex text-xs px-3 py-1 rounded-full border font-bold mt-2 ${getPaymentClass(
                              serviceCase.paymentStatus,
                            )}`}
                          >
                            {serviceCenterRepository.getPaymentStatusLabel(
                              serviceCase.paymentStatus,
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 align-top">
                          <p className="font-bold">
                            {serviceCase.assignedUserName || "Nicht zugewiesen"}
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">
                            {getCompanyName(serviceCase.companyId) || "Keine Firma"}
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">
                            {getDepartmentName(serviceCase.departmentId) ||
                              "Keine Abteilung"}
                          </p>
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(serviceCase)}
                              className="app-accent-bg text-white px-3 py-2 rounded-xl transition font-bold app-brand-shadow"
                            >
                              Bearbeiten
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteServiceCase(serviceCase)}
                              className="bg-red-600 text-white hover:bg-red-500 px-3 py-2 rounded-xl transition font-bold"
                            >
                              Löschen
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {viewMode === "cards" && filteredCases.length > 0 && (
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredCases.map((serviceCase) => (
                <article
                  key={serviceCase.id}
                  className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition overflow-hidden relative"
                >
                  <div className="absolute -right-14 -top-14 h-32 w-32 rounded-full app-accent-bg opacity-10 blur-3xl" />

                  <div className="relative">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`text-xs px-3 py-1 rounded-full border font-bold ${getStatusClass(
                              serviceCase.status,
                            )}`}
                          >
                            {serviceCenterRepository.getStatusLabel(
                              serviceCase.status,
                            )}
                          </span>
                          <span
                            className={`text-xs px-3 py-1 rounded-full border font-bold ${getPaymentClass(
                              serviceCase.paymentStatus,
                            )}`}
                          >
                            {serviceCenterRepository.getPaymentStatusLabel(
                              serviceCase.paymentStatus,
                            )}
                          </span>
                        </div>

                        <h2 className="text-2xl font-black mt-4">
                          {getTypeIcon(serviceCase.type)} {serviceCase.title}
                        </h2>
                        <p className="text-zinc-500 mt-2">
                          {serviceCase.customerName} ·{" "}
                          {serviceCenterRepository.getTypeLabel(serviceCase.type)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => openEditModal(serviceCase)}
                        className="app-accent-bg text-white px-4 py-2 rounded-xl transition font-bold app-brand-shadow shrink-0"
                      >
                        Bearbeiten
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="bg-zinc-50 rounded-2xl p-4">
                        <p className="text-xs text-zinc-500">Fallnummer</p>
                        <p className="font-black mt-1 break-all">
                          {serviceCase.caseNumber}
                        </p>
                      </div>
                      <div className="bg-zinc-50 rounded-2xl p-4">
                        <p className="text-xs text-zinc-500">Gesamt</p>
                        <p className="font-black mt-1">
                          {formatMoney(serviceCase.totalAmount)}
                        </p>
                      </div>
                      <div className="bg-zinc-50 rounded-2xl p-4">
                        <p className="text-xs text-zinc-500">Bezahlt</p>
                        <p className="font-black mt-1">
                          {formatMoney(serviceCase.paidAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="bg-zinc-50 rounded-2xl p-4">
                        <p className="text-xs text-zinc-500">Gerät / Artikel</p>
                        <p className="font-black mt-1">
                          {serviceCase.deviceName || "-"}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {serviceCase.deviceSerialNumber || "Keine Seriennummer"}
                        </p>
                      </div>
                      <div className="bg-zinc-50 rounded-2xl p-4">
                        <p className="text-xs text-zinc-500">Zuweisung</p>
                        <p className="font-black mt-1">
                          {serviceCase.assignedUserName || "Nicht zugewiesen"}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {getCompanyName(serviceCase.companyId) || "Keine Firma"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-6">
                      <button
                        type="button"
                        onClick={() => openEditModal(serviceCase)}
                        className="app-accent-bg text-white px-4 py-2 rounded-xl transition font-bold app-brand-shadow"
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteServiceCase(serviceCase)}
                        className="bg-red-600 text-white hover:bg-red-500 px-4 py-2 rounded-xl transition font-bold"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}