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
import { inventoryRepository } from "../../lib/inventoryRepository";
import type { Company, Department } from "../../types/company";
import type {
  InventoryAsset,
  InventoryAssetInput,
  InventoryAssetStatus,
  InventoryAssetType,
} from "../../types/inventory";

type ViewMode = "table" | "cards";

type InventoryForm = {
  assetNumber: string;
  name: string;
  type: InventoryAssetType;
  status: InventoryAssetStatus;
  manufacturer: string;
  model: string;
  serialNumber: string;
  hostname: string;
  ipAddress: string;
  location: string;
  assignedUserId: string;
  assignedUserName: string;
  companyId: string;
  departmentId: string;
  operatingSystem: string;
  cpu: string;
  gpu: string;
  ramGb: number;
  storageGb: number;
  hardwareNotes: string;
  softwareNotes: string;
  purchaseDate: string;
  warrantyUntil: string;
  lastSeenAt: string;
};

const emptyForm: InventoryForm = {
  assetNumber: "",
  name: "",
  type: "desktop",
  status: "active",
  manufacturer: "",
  model: "",
  serialNumber: "",
  hostname: "",
  ipAddress: "",
  location: "",
  assignedUserId: "",
  assignedUserName: "",
  companyId: "",
  departmentId: "",
  operatingSystem: "",
  cpu: "",
  gpu: "",
  ramGb: 0,
  storageGb: 0,
  hardwareNotes: "",
  softwareNotes: "",
  purchaseDate: "",
  warrantyUntil: "",
  lastSeenAt: "",
};

const typeOptions: Array<{
  value: InventoryAssetType;
  label: string;
}> = [
  {
    value: "desktop",
    label: "PC",
  },
  {
    value: "notebook",
    label: "Notebook",
  },
  {
    value: "server",
    label: "Server",
  },
  {
    value: "virtual_machine",
    label: "Virtuelle Maschine",
  },
  {
    value: "printer",
    label: "Drucker",
  },
  {
    value: "network",
    label: "Netzwerkgerät",
  },
  {
    value: "mobile",
    label: "Mobilgerät",
  },
  {
    value: "peripheral",
    label: "Peripherie",
  },
  {
    value: "other",
    label: "Sonstiges",
  },
];

const statusOptions: Array<{
  value: InventoryAssetStatus;
  label: string;
}> = [
  {
    value: "active",
    label: "Aktiv",
  },
  {
    value: "in_stock",
    label: "Lager",
  },
  {
    value: "in_repair",
    label: "In Reparatur",
  },
  {
    value: "retired",
    label: "Ausgemustert",
  },
  {
    value: "lost",
    label: "Verloren",
  },
  {
    value: "archived",
    label: "Archiviert",
  },
];

function normalizeType(value: string): InventoryAssetType {
  if (
    value === "desktop" ||
    value === "notebook" ||
    value === "server" ||
    value === "virtual_machine" ||
    value === "printer" ||
    value === "network" ||
    value === "mobile" ||
    value === "peripheral" ||
    value === "other"
  ) {
    return value;
  }

  return "desktop";
}

function normalizeStatus(value: string): InventoryAssetStatus {
  if (
    value === "active" ||
    value === "in_stock" ||
    value === "in_repair" ||
    value === "retired" ||
    value === "lost" ||
    value === "archived"
  ) {
    return value;
  }

  return "active";
}

function getStatusClass(status: string) {
  if (status === "active") {
    return "bg-green-50 text-green-700 border-green-100";
  }

  if (status === "in_stock") {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  if (status === "in_repair") {
    return "bg-orange-50 text-orange-700 border-orange-100";
  }

  if (status === "retired" || status === "archived") {
    return "bg-zinc-100 text-zinc-600 border-zinc-200";
  }

  if (status === "lost") {
    return "bg-red-50 text-red-700 border-red-100";
  }

  return "bg-zinc-100 text-zinc-700 border-zinc-200";
}

function getTypeClass(type: string) {
  if (type === "server" || type === "virtual_machine") {
    return "bg-purple-50 text-purple-700 border-purple-100";
  }

  if (type === "notebook" || type === "desktop") {
    return "bg-indigo-50 text-indigo-700 border-indigo-100";
  }

  if (type === "network") {
    return "bg-sky-50 text-sky-700 border-sky-100";
  }

  if (type === "printer" || type === "peripheral") {
    return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }

  if (type === "mobile") {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }

  return "bg-zinc-100 text-zinc-700 border-zinc-200";
}

function getAssetIcon(type: string) {
  if (type === "server") {
    return "▥";
  }

  if (type === "virtual_machine") {
    return "◫";
  }

  if (type === "notebook") {
    return "▰";
  }

  if (type === "desktop") {
    return "▣";
  }

  if (type === "network") {
    return "⌘";
  }

  if (type === "printer") {
    return "▤";
  }

  if (type === "mobile") {
    return "▯";
  }

  return "■";
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

function normalizeNumber(value: unknown) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return 0;
  }

  return Math.floor(numberValue);
}

function assetToForm(asset: InventoryAsset): InventoryForm {
  return {
    assetNumber: asset.assetNumber || "",
    name: asset.name || "",
    type: normalizeType(asset.type),
    status: normalizeStatus(asset.status),
    manufacturer: asset.manufacturer || "",
    model: asset.model || "",
    serialNumber: asset.serialNumber || "",
    hostname: asset.hostname || "",
    ipAddress: asset.ipAddress || "",
    location: asset.location || "",
    assignedUserId: asset.assignedUserId || "",
    assignedUserName: asset.assignedUserName || "",
    companyId: asset.companyId || "",
    departmentId: asset.departmentId || "",
    operatingSystem: asset.operatingSystem || "",
    cpu: asset.cpu || "",
    gpu: asset.gpu || "",
    ramGb: Number(asset.ramGb || 0),
    storageGb: Number(asset.storageGb || 0),
    hardwareNotes: asset.hardwareNotes || "",
    softwareNotes: asset.softwareNotes || "",
    purchaseDate: asset.purchaseDate || "",
    warrantyUntil: asset.warrantyUntil || "",
    lastSeenAt: asset.lastSeenAt || "",
  };
}

function formToInput(form: InventoryForm): InventoryAssetInput {
  return {
    assetNumber: form.assetNumber.trim(),
    name: form.name.trim(),
    type: form.type,
    status: form.status,
    manufacturer: form.manufacturer.trim(),
    model: form.model.trim(),
    serialNumber: form.serialNumber.trim(),
    hostname: form.hostname.trim(),
    ipAddress: form.ipAddress.trim(),
    location: form.location.trim(),
    assignedUserId: form.assignedUserId.trim(),
    assignedUserName: form.assignedUserName.trim(),
    companyId: form.companyId.trim(),
    departmentId: form.departmentId.trim(),
    operatingSystem: form.operatingSystem.trim(),
    cpu: form.cpu.trim(),
    gpu: form.gpu.trim(),
    ramGb: normalizeNumber(form.ramGb),
    storageGb: normalizeNumber(form.storageGb),
    hardwareNotes: form.hardwareNotes.trim(),
    softwareNotes: form.softwareNotes.trim(),
    purchaseDate: form.purchaseDate,
    warrantyUntil: form.warrantyUntil,
    lastSeenAt: form.lastSeenAt,
  };
}

export default function InventoryPage() {
  const [mounted, setMounted] = useState(false);
  const [assets, setAssets] = useState<InventoryAsset[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState("");
  const [form, setForm] = useState<InventoryForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    void loadData();

    function handleInventoryUpdated() {
      void loadData();
    }

    function handleCompaniesUpdated() {
      void loadOrganization();
    }

    function handleDepartmentsUpdated() {
      void loadOrganization();
    }

    window.addEventListener("inventoryUpdated", handleInventoryUpdated);
    window.addEventListener("companiesUpdated", handleCompaniesUpdated);
    window.addEventListener("departmentsUpdated", handleDepartmentsUpdated);

    return () => {
      window.removeEventListener("inventoryUpdated", handleInventoryUpdated);
      window.removeEventListener("companiesUpdated", handleCompaniesUpdated);
      window.removeEventListener("departmentsUpdated", handleDepartmentsUpdated);
    };
  }, []);

  async function loadOrganization() {
    try {
      const [nextCompanies, nextDepartments] = await Promise.all([
        companyRepository.listCompanies(),
        companyRepository.listDepartments(),
      ]);

      setCompanies(Array.isArray(nextCompanies) ? nextCompanies : []);
      setDepartments(Array.isArray(nextDepartments) ? nextDepartments : []);
    } catch (loadError) {
      console.error("Organisation konnte nicht geladen werden:", loadError);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [nextAssets, nextCompanies, nextDepartments, nextUsers] = await Promise.all([
        inventoryRepository.list(),
        companyRepository.listCompanies(),
        companyRepository.listDepartments(),
        assignableUserRepository.list(),
      ]);

      setAssets(Array.isArray(nextAssets) ? nextAssets : []);
      setCompanies(Array.isArray(nextCompanies) ? nextCompanies : []);
      setDepartments(Array.isArray(nextDepartments) ? nextDepartments : []);
      setUsers(Array.isArray(nextUsers) ? nextUsers : []);
    } catch (loadError) {
      console.error(loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "IT-Inventar konnte nicht geladen werden.",
      );
    } finally {
      setLoading(false);
    }
  }

  function updateForm<TKey extends keyof InventoryForm>(
    key: TKey,
    value: InventoryForm[TKey],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
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

  function resetFilters() {
    setSearch("");
    setTypeFilter("");
    setStatusFilter("");
    setCompanyFilter("");
    setDepartmentFilter("");
  }

  function openCreateModal() {
    setEditingAssetId("");
    setForm(emptyForm);
    setMessage("");
    setError("");
    setModalOpen(true);
  }

  function openEditModal(asset: InventoryAsset) {
    setEditingAssetId(asset.id);
    setForm(assetToForm(asset));
    setMessage("");
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    setEditingAssetId("");
    setForm(emptyForm);
    setModalOpen(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("Bitte einen Namen eingeben.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const input = formToInput(form);

      if (editingAssetId) {
        const updatedAsset = await inventoryRepository.update(editingAssetId, input);

        setAssets((current) =>
          current.map((asset) =>
            asset.id === updatedAsset.id ? updatedAsset : asset,
          ),
        );

        closeModal();
        setMessage("Inventar-Asset wurde gespeichert.");
        return;
      }

      const createdAsset = await inventoryRepository.create(input);

      setAssets((current) => [createdAsset, ...current]);
      closeModal();
      setMessage("Inventar-Asset wurde erstellt.");
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Inventar-Asset konnte nicht gespeichert werden.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteAsset(asset: InventoryAsset) {
    const confirmed = confirm(
      `Inventar-Asset "${asset.name}" wirklich löschen?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setError("");

      await inventoryRepository.delete(asset.id);

      setAssets((current) => current.filter((item) => item.id !== asset.id));
      setMessage("Inventar-Asset wurde gelöscht.");
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Inventar-Asset konnte nicht gelöscht werden.",
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

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return assets.filter((asset) => {
      const companyName = getCompanyName(asset.companyId);
      const departmentName = getDepartmentName(asset.departmentId);

      const matchesSearch =
        !query ||
        [
          asset.id,
          asset.assetNumber,
          asset.name,
          asset.type,
          asset.status,
          asset.manufacturer,
          asset.model,
          asset.serialNumber,
          asset.hostname,
          asset.ipAddress,
          asset.location,
          asset.assignedUserName,
          companyName,
          departmentName,
          asset.operatingSystem,
          asset.cpu,
          asset.gpu,
          asset.hardwareNotes,
          asset.softwareNotes,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesType = !typeFilter || asset.type === typeFilter;
      const matchesStatus = !statusFilter || asset.status === statusFilter;
      const matchesCompany = !companyFilter || asset.companyId === companyFilter;
      const matchesDepartment =
        !departmentFilter || asset.departmentId === departmentFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesCompany &&
        matchesDepartment
      );
    });
  }, [
    assets,
    search,
    typeFilter,
    statusFilter,
    companyFilter,
    departmentFilter,
    companies,
    departments,
  ]);

  const activeCount = assets.filter((asset) => asset.status === "active").length;
  const serverCount = assets.filter(
    (asset) => asset.type === "server" || asset.type === "virtual_machine",
  ).length;
  const assignedCount = assets.filter(
    (asset) => asset.assignedUserId || asset.assignedUserName,
  ).length;
  const repairCount = assets.filter(
    (asset) => asset.status === "in_repair",
  ).length;

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-8">
      <AppModal
        open={modalOpen}
        title={editingAssetId ? "Asset bearbeiten" : "Asset erstellen"}
        description="Erfasse Gerätedaten, Zuweisung, Hardware und Softwareinformationen."
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
              form="inventory-form"
              disabled={saving}
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow disabled:opacity-60"
            >
              {saving
                ? "Speichert..."
                : editingAssetId
                  ? "Änderungen speichern"
                  : "Asset erstellen"}
            </button>
          </>
        }
      >
        <form
          id="inventory-form"
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-8"
        >
          <section className="bg-zinc-50 border border-zinc-100 rounded-3xl p-5">
            <h3 className="text-xl font-black">Basisdaten</h3>
            <p className="text-zinc-500 mt-1">
              Allgemeine Informationen zum Gerät oder Server.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Inventarnummer
                </span>
                <input
                  value={form.assetNumber}
                  onChange={(event) =>
                    updateForm("assetNumber", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="wird automatisch vergeben, wenn leer"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">Name</span>
                <input
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="z. B. NB-TH-001"
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
            </div>
          </section>

          <section className="bg-zinc-50 border border-zinc-100 rounded-3xl p-5">
            <h3 className="text-xl font-black">Gerätedaten</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Hersteller
                </span>
                <input
                  value={form.manufacturer}
                  onChange={(event) =>
                    updateForm("manufacturer", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="z. B. Dell, Lenovo, HP"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">Modell</span>
                <input
                  value={form.model}
                  onChange={(event) => updateForm("model", event.target.value)}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="z. B. Latitude 5450"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Seriennummer
                </span>
                <input
                  value={form.serialNumber}
                  onChange={(event) =>
                    updateForm("serialNumber", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="Seriennummer"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">Hostname</span>
                <input
                  value={form.hostname}
                  onChange={(event) =>
                    updateForm("hostname", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="Hostname"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  IP-Adresse
                </span>
                <input
                  value={form.ipAddress}
                  onChange={(event) =>
                    updateForm("ipAddress", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="192.168.0.10"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Standort
                </span>
                <input
                  value={form.location}
                  onChange={(event) =>
                    updateForm("location", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="Büro, Raum, Standort"
                />
              </label>
            </div>
          </section>

          <section className="bg-zinc-50 border border-zinc-100 rounded-3xl p-5">
            <h3 className="text-xl font-black">Zuweisung</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Zugewiesener Benutzer
                </span>
                <input
                  value={form.assignedUserName}
                  onChange={(event) =>
                    updateForm("assignedUserName", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="Name des Benutzers"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Benutzer-ID
                </span>
                <input
                  value={form.assignedUserId}
                  onChange={(event) =>
                    updateForm("assignedUserId", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="optional"
                />
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
            <h3 className="text-xl font-black">Hardware & Software</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Betriebssystem
                </span>
                <input
                  value={form.operatingSystem}
                  onChange={(event) =>
                    updateForm("operatingSystem", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="Windows 11 Pro, Ubuntu, ESXi..."
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">CPU</span>
                <input
                  value={form.cpu}
                  onChange={(event) => updateForm("cpu", event.target.value)}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="CPU"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  RAM in GB
                </span>
                <input
                  type="number"
                  min={0}
                  value={form.ramGb}
                  onChange={(event) =>
                    updateForm("ramGb", Number(event.target.value || 0))
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Speicher in GB
                </span>
                <input
                  type="number"
                  min={0}
                  value={form.storageGb}
                  onChange={(event) =>
                    updateForm("storageGb", Number(event.target.value || 0))
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                />
              </label>

              <label className="md:col-span-2 space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Hardware-Notizen
                </span>
                <textarea
                  value={form.hardwareNotes}
                  onChange={(event) =>
                    updateForm("hardwareNotes", event.target.value)
                  }
                  rows={4}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus resize-none"
                  placeholder="Hardware, Komponenten, Besonderheiten..."
                />
              </label>

              <label className="md:col-span-2 space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Software-Notizen
                </span>
                <textarea
                  value={form.softwareNotes}
                  onChange={(event) =>
                    updateForm("softwareNotes", event.target.value)
                  }
                  rows={4}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus resize-none"
                  placeholder="Installierte Software, Lizenzen, Besonderheiten..."
                />
              </label>
            </div>
          </section>

          <section className="bg-zinc-50 border border-zinc-100 rounded-3xl p-5">
            <h3 className="text-xl font-black">Kauf & Wartung</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Kaufdatum
                </span>
                <input
                  type="date"
                  value={form.purchaseDate}
                  onChange={(event) =>
                    updateForm("purchaseDate", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Garantie bis
                </span>
                <input
                  type="date"
                  value={form.warrantyUntil}
                  onChange={(event) =>
                    updateForm("warrantyUntil", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-600">
                  Zuletzt gesehen
                </span>
                <input
                  type="datetime-local"
                  value={form.lastSeenAt}
                  onChange={(event) =>
                    updateForm("lastSeenAt", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                />
              </label>
            </div>
          </section>
        </form>
      </AppModal>

      <PageHero
        eyebrow="IT-Verwaltung"
        title="IT-Inventar"
        description="Geräte, Server, Hardware, Software, Standorte und Benutzerzuweisungen zentral verwalten."
        badges={[
          {
            label: `${assets.length} Assets`,
          },
          {
            label: `${activeCount} aktiv`,
          },
          {
            label: `${serverCount} Server/VMs`,
          },
          {
            label: `${assignedCount} zugewiesen`,
          },
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
              Asset erstellen
            </button>
          </>
        }
      />

      {loading && (
        <LoadingState
          title="IT-Inventar wird geladen..."
          description="Assets, Firmen, Abteilungen und Zuweisungen werden vorbereitet."
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
          title="IT-Inventar konnte nicht geladen werden"
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
              label="Aktiv"
              value={activeCount}
              description="Aktive Assets"
              icon="▣"
              tone="green"
              active={statusFilter === "active"}
              onClick={() => setStatusFilter("active")}
            />
            <StatCard
              label="Server"
              value={serverCount}
              description="Server und virtuelle Maschinen"
              icon="▥"
              tone="indigo"
              active={typeFilter === "server"}
              onClick={() => setTypeFilter("server")}
            />
            <StatCard
              label="Zugewiesen"
              value={assignedCount}
              description="Assets mit Benutzer"
              icon="◉"
              tone="blue"
            />
            <StatCard
              label="Reparatur"
              value={repairCount}
              description="In Reparatur"
              icon="!"
              tone="orange"
              active={statusFilter === "in_repair"}
              onClick={() => setStatusFilter("in_repair")}
            />
          </div>

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

            <div className="relative">
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                <div>
                  <h2 className="text-2xl font-black">Suche & Filter</h2>
                  <p className="text-zinc-500 mt-1">
                    Filtere nach Gerätetyp, Status, Firma, Abteilung, Benutzer,
                    Hostname oder Seriennummer.
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

              <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 mt-5">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Assets suchen..."
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

              <div className="flex flex-wrap items-center gap-3 mt-5">
                <span className="text-sm text-zinc-500">
                  {filteredAssets.length} von {assets.length} Assets gefunden.
                </span>

                {search && (
                  <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                    Suche: {search}
                  </span>
                )}

                {typeFilter && (
                  <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
                    Typ: {inventoryRepository.getTypeLabel(typeFilter)}
                  </span>
                )}

                {statusFilter && (
                  <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                    Status: {inventoryRepository.getStatusLabel(statusFilter)}
                  </span>
                )}
              </div>
            </div>
          </section>

          {!loading && filteredAssets.length === 0 && (
            <EmptyState
              icon="▣"
              title="Keine Assets gefunden"
              description="Erstelle das erste Asset oder passe die Filter an."
              action={
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
                >
                  Asset erstellen
                </button>
              }
            />
          )}

          {viewMode === "table" && filteredAssets.length > 0 && (
            <section className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-5 py-4 font-bold text-zinc-500">
                        Asset
                      </th>
                      <th className="px-5 py-4 font-bold text-zinc-500">Typ</th>
                      <th className="px-5 py-4 font-bold text-zinc-500">
                        Zuweisung
                      </th>
                      <th className="px-5 py-4 font-bold text-zinc-500">
                        Hardware
                      </th>
                      <th className="px-5 py-4 font-bold text-zinc-500">
                        Status
                      </th>
                      <th className="px-5 py-4 font-bold text-zinc-500 text-right">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredAssets.map((asset) => {
                      const companyName = getCompanyName(asset.companyId);
                      const departmentName = getDepartmentName(asset.departmentId);

                      return (
                        <tr
                          key={asset.id}
                          className="hover:bg-zinc-50 transition"
                        >
                          <td className="px-5 py-4 align-top min-w-[320px]">
                            <div className="flex items-start gap-3">
                              <span
                                className={`h-11 w-11 rounded-2xl border flex items-center justify-center font-black shrink-0 ${getTypeClass(
                                  asset.type,
                                )}`}
                              >
                                {getAssetIcon(asset.type)}
                              </span>
                              <div>
                                <p className="font-black text-zinc-950">
                                  {asset.name}
                                </p>
                                <p className="text-xs text-zinc-400 mt-1">
                                  {asset.assetNumber || "Keine Inventarnummer"}
                                </p>
                                <p className="text-zinc-500 mt-2">
                                  {[asset.manufacturer, asset.model]
                                    .filter(Boolean)
                                    .join(" ") || "Keine Gerätedaten"}
                                </p>
                                {asset.serialNumber && (
                                  <p className="text-xs text-zinc-400 mt-1">
                                    SN: {asset.serialNumber}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 align-top">
                            <span
                              className={`text-xs px-3 py-1 rounded-full border font-bold ${getTypeClass(
                                asset.type,
                              )}`}
                            >
                              {inventoryRepository.getTypeLabel(asset.type)}
                            </span>
                            {asset.hostname && (
                              <p className="text-xs text-zinc-500 mt-2">
                                Host: {asset.hostname}
                              </p>
                            )}
                            {asset.ipAddress && (
                              <p className="text-xs text-zinc-500 mt-1">
                                IP: {asset.ipAddress}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4 align-top">
                            <p className="font-bold">
                              {asset.assignedUserName || "Nicht zugewiesen"}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                              {companyName || "Keine Firma"}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                              {departmentName || "Keine Abteilung"}
                            </p>
                            {asset.location && (
                              <p className="text-xs text-zinc-400 mt-2">
                                Standort: {asset.location}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4 align-top">
                            <p className="font-bold">
                              {asset.operatingSystem || "Kein OS"}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                              {asset.cpu || "Keine CPU"}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                              {asset.ramGb || 0} GB RAM ·{" "}
                              {asset.storageGb || 0} GB Speicher
                            </p>
                          </td>

                          <td className="px-5 py-4 align-top">
                            <span
                              className={`text-xs px-3 py-1 rounded-full border font-bold ${getStatusClass(
                                asset.status,
                              )}`}
                            >
                              {inventoryRepository.getStatusLabel(asset.status)}
                            </span>
                            {asset.warrantyUntil && (
                              <p className="text-xs text-zinc-500 mt-2">
                                Garantie bis {formatDate(asset.warrantyUntil)}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4 align-top">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditModal(asset)}
                                className="app-accent-bg text-white px-3 py-2 rounded-xl transition font-bold app-brand-shadow"
                              >
                                Bearbeiten
                              </button>
                              <button
                                type="button"
                                onClick={() => void deleteAsset(asset)}
                                className="bg-red-600 text-white hover:bg-red-500 px-3 py-2 rounded-xl transition font-bold"
                              >
                                Löschen
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {viewMode === "cards" && filteredAssets.length > 0 && (
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredAssets.map((asset) => {
                const companyName = getCompanyName(asset.companyId);
                const departmentName = getDepartmentName(asset.departmentId);

                return (
                  <article
                    key={asset.id}
                    className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition overflow-hidden relative"
                  >
                    <div className="absolute -right-14 -top-14 h-32 w-32 rounded-full app-accent-bg opacity-10 blur-3xl" />

                    <div className="relative">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`text-xs px-3 py-1 rounded-full border font-bold ${getTypeClass(
                                asset.type,
                              )}`}
                            >
                              {inventoryRepository.getTypeLabel(asset.type)}
                            </span>
                            <span
                              className={`text-xs px-3 py-1 rounded-full border font-bold ${getStatusClass(
                                asset.status,
                              )}`}
                            >
                              {inventoryRepository.getStatusLabel(asset.status)}
                            </span>
                          </div>

                          <h2 className="text-2xl font-black mt-4">
                            {getAssetIcon(asset.type)} {asset.name}
                          </h2>
                          <p className="text-zinc-500 mt-2">
                            {[asset.manufacturer, asset.model]
                              .filter(Boolean)
                              .join(" ") || "Keine Gerätedaten hinterlegt."}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => openEditModal(asset)}
                          className="app-accent-bg text-white px-4 py-2 rounded-xl transition font-bold app-brand-shadow shrink-0"
                        >
                          Bearbeiten
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="bg-zinc-50 rounded-2xl p-4">
                          <p className="text-xs text-zinc-500">Inventarnummer</p>
                          <p className="font-black mt-1 break-all">
                            {asset.assetNumber || "-"}
                          </p>
                        </div>
                        <div className="bg-zinc-50 rounded-2xl p-4">
                          <p className="text-xs text-zinc-500">Benutzer</p>
                          <p className="font-black mt-1">
                            {asset.assignedUserName || "Nicht zugewiesen"}
                          </p>
                        </div>
                        <div className="bg-zinc-50 rounded-2xl p-4">
                          <p className="text-xs text-zinc-500">Standort</p>
                          <p className="font-black mt-1">
                            {asset.location || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-zinc-50 rounded-2xl p-4">
                          <p className="text-xs text-zinc-500">
                            Organisation
                          </p>
                          <p className="font-black mt-1">
                            {companyName || "Keine Firma"}
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">
                            {departmentName || "Keine Abteilung"}
                          </p>
                        </div>
                        <div className="bg-zinc-50 rounded-2xl p-4">
                          <p className="text-xs text-zinc-500">
                            Hardware
                          </p>
                          <p className="font-black mt-1">
                            {asset.cpu || "Keine CPU"}
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">
                            {asset.ramGb || 0} GB RAM ·{" "}
                            {asset.storageGb || 0} GB Speicher
                          </p>
                        </div>
                      </div>

                      {(asset.hostname ||
                        asset.ipAddress ||
                        asset.operatingSystem ||
                        asset.serialNumber) && (
                        <div className="flex flex-wrap gap-2 mt-5">
                          {asset.hostname && (
                            <span className="text-xs bg-zinc-100 text-zinc-700 px-2 py-1 rounded-lg">
                              Host: {asset.hostname}
                            </span>
                          )}
                          {asset.ipAddress && (
                            <span className="text-xs bg-zinc-100 text-zinc-700 px-2 py-1 rounded-lg">
                              IP: {asset.ipAddress}
                            </span>
                          )}
                          {asset.operatingSystem && (
                            <span className="text-xs bg-zinc-100 text-zinc-700 px-2 py-1 rounded-lg">
                              {asset.operatingSystem}
                            </span>
                          )}
                          {asset.serialNumber && (
                            <span className="text-xs bg-zinc-100 text-zinc-700 px-2 py-1 rounded-lg">
                              SN: {asset.serialNumber}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mt-6">
                        <button
                          type="button"
                          onClick={() => openEditModal(asset)}
                          className="app-accent-bg text-white px-4 py-2 rounded-xl transition font-bold app-brand-shadow"
                        >
                          Bearbeiten
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteAsset(asset)}
                          className="bg-red-600 text-white hover:bg-red-500 px-4 py-2 rounded-xl transition font-bold"
                        >
                          Löschen
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </>
      )}
    </div>
  );
}