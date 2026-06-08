"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  companyRepository,
} from "../../../lib/companyRepository";
import {
  canManageCompanies,
  canViewAdmin,
} from "../../../lib/permissions";
import {
  saveCompanyCreatedActivity,
  saveCompanyDeletedActivity,
  saveCompanyUpdatedActivity,
  saveDepartmentCreatedActivity,
  saveDepartmentDeletedActivity,
  saveDepartmentUpdatedActivity,
} from "../../../lib/organizationActivityHelpers";
import AccessDeniedCard from "../../../components/AccessDeniedCard";
import AppModal from "../../../components/AppModal";
import PageHero from "../../../components/PageHero";
import StatCard from "../../../components/StatCard";
import type {
  Company,
  CompanyStatus,
  Department,
  DepartmentStatus,
} from "../../../types/company";

type FormMode = "company" | "department" | "";
type ViewMode = "table" | "cards";

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getStatusLabel(status: string) {
  if (status === "active") {
    return "Aktiv";
  }

  if (status === "inactive") {
    return "Inaktiv";
  }

  if (status === "archived") {
    return "Archiviert";
  }

  return status || "Unbekannt";
}

function getStatusClass(status: string) {
  if (status === "active") {
    return "bg-green-50 text-green-700 border-green-100";
  }

  if (status === "inactive") {
    return "bg-amber-50 text-amber-700 border-amber-100";
  }

  if (status === "archived") {
    return "bg-zinc-100 text-zinc-600 border-zinc-200";
  }

  return "bg-zinc-100 text-zinc-700 border-zinc-200";
}

function getStatusTone(status: string) {
  if (status === "active") {
    return "green";
  }

  if (status === "inactive") {
    return "orange";
  }

  return "zinc";
}

export default function AdminCompaniesPage() {
  const [mounted, setMounted] = useState(false);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const [formMode, setFormMode] = useState<FormMode>("");
  const [editingCompanyId, setEditingCompanyId] = useState("");
  const [editingDepartmentId, setEditingDepartmentId] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [companySlug, setCompanySlug] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyStatus, setCompanyStatus] = useState<CompanyStatus>("active");

  const [departmentCompanyId, setDepartmentCompanyId] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [departmentSlug, setDepartmentSlug] = useState("");
  const [departmentDescription, setDepartmentDescription] = useState("");
  const [departmentStatus, setDepartmentStatus] =
    useState<DepartmentStatus>("active");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMounted(true);
    void loadData();

    function handleCompaniesUpdated() {
      void loadData();
    }

    function handleDepartmentsUpdated() {
      void loadData();
    }

    window.addEventListener(
      "companiesUpdated",
      handleCompaniesUpdated,
    );
    window.addEventListener(
      "departmentsUpdated",
      handleDepartmentsUpdated,
    );

    return () => {
      window.removeEventListener(
        "companiesUpdated",
        handleCompaniesUpdated,
      );
      window.removeEventListener(
        "departmentsUpdated",
        handleDepartmentsUpdated,
      );
    };
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        nextCompanies,
        nextDepartments,
      ] = await Promise.all([
        companyRepository.listCompanies(),
        companyRepository.listDepartments(),
      ]);

      setCompanies(Array.isArray(nextCompanies) ? nextCompanies : []);
      setDepartments(Array.isArray(nextDepartments) ? nextDepartments : []);
    } catch (loadError) {
      console.error(loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Organisation konnte nicht geladen werden.",
      );
    } finally {
      setLoading(false);
    }
  }

  function getCompanyName(companyId: string) {
    return (
      companies.find((company) => company.id === companyId)?.name ||
      "Unbekannte Firma"
    );
  }

  function getCompanyDepartmentCount(companyId: string) {
    return departments.filter(
      (department) => department.companyId === companyId,
    ).length;
  }

  function resetForms() {
    setFormMode("");
    setEditingCompanyId("");
    setEditingDepartmentId("");

    setCompanyName("");
    setCompanySlug("");
    setCompanyDescription("");
    setCompanyStatus("active");

    setDepartmentCompanyId("");
    setDepartmentName("");
    setDepartmentSlug("");
    setDepartmentDescription("");
    setDepartmentStatus("active");
  }

  function closeModal() {
    resetForms();
  }

  function openCompanyCreateForm() {
    if (!canManageCompanies()) {
      alert("Du hast keine Berechtigung, Firmen zu erstellen.");
      return;
    }

    resetForms();
    setFormMode("company");
  }

  function openDepartmentCreateForm() {
    if (!canManageCompanies()) {
      alert("Du hast keine Berechtigung, Abteilungen zu erstellen.");
      return;
    }

    resetForms();
    setDepartmentCompanyId(companies[0]?.id || "");
    setFormMode("department");
  }

  function startEditCompany(company: Company) {
    if (!canManageCompanies()) {
      alert("Du hast keine Berechtigung, Firmen zu bearbeiten.");
      return;
    }

    resetForms();
    setEditingCompanyId(company.id);
    setCompanyName(company.name);
    setCompanySlug(company.slug);
    setCompanyDescription(company.description || "");
    setCompanyStatus(company.status);
    setFormMode("company");
  }

  function startEditDepartment(department: Department) {
    if (!canManageCompanies()) {
      alert("Du hast keine Berechtigung, Abteilungen zu bearbeiten.");
      return;
    }

    resetForms();
    setEditingDepartmentId(department.id);
    setDepartmentCompanyId(department.companyId);
    setDepartmentName(department.name);
    setDepartmentSlug(department.slug);
    setDepartmentDescription(department.description || "");
    setDepartmentStatus(department.status);
    setFormMode("department");
  }

  const filteredCompanies = useMemo(() => {
    const query = search.trim().toLowerCase();

    return companies.filter((company) => {
      const matchesSearch =
        !query ||
        [
          company.name,
          company.slug,
          company.description,
          company.status,
          company.createdAt,
          company.updatedAt,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        !statusFilter ||
        company.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    companies,
    search,
    statusFilter,
  ]);

  const filteredDepartments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return departments.filter((department) => {
      const companyNameValue = getCompanyName(department.companyId);

      const matchesSearch =
        !query ||
        [
          department.name,
          department.slug,
          department.description,
          department.status,
          companyNameValue,
          department.createdAt,
          department.updatedAt,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesCompany =
        !companyFilter ||
        department.companyId === companyFilter;

      const matchesStatus =
        !statusFilter ||
        department.status === statusFilter;

      return (
        matchesSearch &&
        matchesCompany &&
        matchesStatus
      );
    });
  }, [
    departments,
    companies,
    search,
    companyFilter,
    statusFilter,
  ]);

  const activeCompanies = useMemo(
    () => companies.filter((company) => company.status === "active"),
    [
      companies,
    ],
  );

  const inactiveCompanies = useMemo(
    () => companies.filter((company) => company.status === "inactive"),
    [
      companies,
    ],
  );

  const archivedCompanies = useMemo(
    () => companies.filter((company) => company.status === "archived"),
    [
      companies,
    ],
  );

  const activeDepartments = useMemo(
    () => departments.filter((department) => department.status === "active"),
    [
      departments,
    ],
  );

  const inactiveDepartments = useMemo(
    () => departments.filter((department) => department.status === "inactive"),
    [
      departments,
    ],
  );

  const latestCompany = companies[0];

  async function handleCompanySubmit(event: FormEvent) {
    event.preventDefault();

    if (!canManageCompanies()) {
      alert("Du hast keine Berechtigung, Firmen zu verwalten.");
      return;
    }

    if (!companyName.trim()) {
      alert("Bitte einen Firmennamen eingeben.");
      return;
    }

    const nextSlug = companySlug.trim()
      ? createSlug(companySlug)
      : createSlug(companyName);

    if (!nextSlug) {
      alert("Bitte einen gültigen Slug eingeben.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      if (editingCompanyId) {
        const updatedCompany = await companyRepository.updateCompany(
          editingCompanyId,
          {
            name: companyName.trim(),
            slug: nextSlug,
            description: companyDescription.trim(),
            status: companyStatus,
          },
        );

        if (updatedCompany) {
          saveCompanyUpdatedActivity(updatedCompany);
        }

        resetForms();
        await loadData();
        setMessage("Firma wurde gespeichert.");
        return;
      }

      const createdCompany = await companyRepository.createCompany({
        name: companyName.trim(),
        slug: nextSlug,
        description: companyDescription.trim(),
        status: companyStatus,
      });

      saveCompanyCreatedActivity(createdCompany);

      resetForms();
      await loadData();
      setMessage("Firma wurde erstellt.");
    } catch (saveError) {
      console.error(saveError);

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Firma konnte nicht gespeichert werden.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDepartmentSubmit(event: FormEvent) {
    event.preventDefault();

    if (!canManageCompanies()) {
      alert("Du hast keine Berechtigung, Abteilungen zu verwalten.");
      return;
    }

    if (!departmentName.trim()) {
      alert("Bitte einen Abteilungsnamen eingeben.");
      return;
    }

    if (!departmentCompanyId) {
      alert("Bitte eine Firma auswählen.");
      return;
    }

    const nextSlug = departmentSlug.trim()
      ? createSlug(departmentSlug)
      : createSlug(departmentName);

    if (!nextSlug) {
      alert("Bitte einen gültigen Slug eingeben.");
      return;
    }

    const companyNameValue = getCompanyName(departmentCompanyId);

    try {
      setSaving(true);
      setMessage("");
      setError("");

      if (editingDepartmentId) {
        const updatedDepartment =
          await companyRepository.updateDepartment(
            editingDepartmentId,
            {
              companyId: departmentCompanyId,
              name: departmentName.trim(),
              slug: nextSlug,
              description: departmentDescription.trim(),
              status: departmentStatus,
            },
          );

        if (updatedDepartment) {
          saveDepartmentUpdatedActivity(
            updatedDepartment,
            companyNameValue,
          );
        }

        resetForms();
        await loadData();
        setMessage("Abteilung wurde gespeichert.");
        return;
      }

      const createdDepartment =
        await companyRepository.createDepartment({
          companyId: departmentCompanyId,
          name: departmentName.trim(),
          slug: nextSlug,
          description: departmentDescription.trim(),
          status: departmentStatus,
        });

      saveDepartmentCreatedActivity(
        createdDepartment,
        companyNameValue,
      );

      resetForms();
      await loadData();
      setMessage("Abteilung wurde erstellt.");
    } catch (saveError) {
      console.error(saveError);

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Abteilung konnte nicht gespeichert werden.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCompany(company: Company) {
    if (!canManageCompanies()) {
      alert("Du hast keine Berechtigung, Firmen zu löschen.");
      return;
    }

    const relatedDepartments = departments.filter(
      (department) => department.companyId === company.id,
    );

    const confirmed = confirm(
      `Firma "${company.name}" wirklich löschen? Zugeordnete Abteilungen: ${relatedDepartments.length}`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setError("");

      saveCompanyDeletedActivity(company);
      await companyRepository.deleteCompany(company.id);
      await loadData();

      setMessage("Firma wurde gelöscht.");
    } catch (deleteError) {
      console.error(deleteError);

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Firma konnte nicht gelöscht werden.",
      );
    }
  }

  async function handleDeleteDepartment(department: Department) {
    if (!canManageCompanies()) {
      alert("Du hast keine Berechtigung, Abteilungen zu löschen.");
      return;
    }

    const confirmed = confirm(
      `Abteilung "${department.name}" wirklich löschen?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setError("");

      saveDepartmentDeletedActivity(
        department,
        getCompanyName(department.companyId),
      );

      await companyRepository.deleteDepartment(department.id);
      await loadData();

      setMessage("Abteilung wurde gelöscht.");
    } catch (deleteError) {
      console.error(deleteError);

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Abteilung konnte nicht gelöscht werden.",
      );
    }
  }

  function resetFilters() {
    setSearch("");
    setCompanyFilter("");
    setStatusFilter("");
  }

  if (!mounted) {
    return null;
  }

  if (!canViewAdmin()) {
    return (
      <AccessDeniedCard
        title="Firmen & Abteilungen"
        description="Du hast keine Berechtigung für die Organisationsverwaltung."
        backHref="/admin"
        backLabel="Zum Admin Dashboard"
      />
    );
  }

  return (
    <div className="space-y-8">
      <AppModal
        open={formMode === "company"}
        onClose={closeModal}
        title={editingCompanyId ? "Firma bearbeiten" : "Firma erstellen"}
        description="Firmen werden direkt in PostgreSQL gespeichert."
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="bg-zinc-100 text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-200 transition disabled:opacity-50"
            >
              Abbrechen
            </button>

            <button
              type="submit"
              form="company-form"
              disabled={saving}
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition disabled:opacity-50 font-bold app-brand-shadow"
            >
              {saving
                ? "Speichert..."
                : editingCompanyId
                  ? "Firma speichern"
                  : "Firma erstellen"}
            </button>
          </>
        }
      >
        <form
          id="company-form"
          onSubmit={(event) => void handleCompanySubmit(event)}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div>
              <label className="block mb-2 font-medium">
                Name
              </label>
              <input
                value={companyName}
                onChange={(event) => {
                  const value = event.target.value;

                  setCompanyName(value);

                  if (!companySlug) {
                    setCompanySlug(createSlug(value));
                  }
                }}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                placeholder="Firma GmbH"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Slug
              </label>
              <input
                value={companySlug}
                onChange={(event) =>
                  setCompanySlug(createSlug(event.target.value))
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                placeholder="firma-gmbh"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Status
              </label>
              <select
                value={companyStatus}
                onChange={(event) =>
                  setCompanyStatus(event.target.value as CompanyStatus)
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
              >
                <option value="active">
                  Aktiv
                </option>
                <option value="inactive">
                  Inaktiv
                </option>
                <option value="archived">
                  Archiviert
                </option>
              </select>
            </div>

            <div className="xl:col-span-2">
              <label className="block mb-2 font-medium">
                Beschreibung
              </label>
              <textarea
                value={companyDescription}
                onChange={(event) => setCompanyDescription(event.target.value)}
                rows={4}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus resize-none"
                placeholder="Beschreibung..."
              />
            </div>
          </div>
        </form>
      </AppModal>

      <AppModal
        open={formMode === "department"}
        onClose={closeModal}
        title={
          editingDepartmentId
            ? "Abteilung bearbeiten"
            : "Abteilung erstellen"
        }
        description="Abteilungen werden einer Firma zugeordnet."
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="bg-zinc-100 text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-200 transition disabled:opacity-50"
            >
              Abbrechen
            </button>

            <button
              type="submit"
              form="department-form"
              disabled={saving}
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition disabled:opacity-50 font-bold app-brand-shadow"
            >
              {saving
                ? "Speichert..."
                : editingDepartmentId
                  ? "Abteilung speichern"
                  : "Abteilung erstellen"}
            </button>
          </>
        }
      >
        <form
          id="department-form"
          onSubmit={(event) => void handleDepartmentSubmit(event)}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div>
              <label className="block mb-2 font-medium">
                Firma
              </label>
              <select
                value={departmentCompanyId}
                onChange={(event) =>
                  setDepartmentCompanyId(event.target.value)
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
              >
                <option value="">
                  Firma auswählen
                </option>

                {companies.map((company) => (
                  <option
                    key={company.id}
                    value={company.id}
                  >
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Name
              </label>
              <input
                value={departmentName}
                onChange={(event) => {
                  const value = event.target.value;

                  setDepartmentName(value);

                  if (!departmentSlug) {
                    setDepartmentSlug(createSlug(value));
                  }
                }}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                placeholder="IT"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Slug
              </label>
              <input
                value={departmentSlug}
                onChange={(event) =>
                  setDepartmentSlug(createSlug(event.target.value))
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                placeholder="it"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Status
              </label>
              <select
                value={departmentStatus}
                onChange={(event) =>
                  setDepartmentStatus(event.target.value as DepartmentStatus)
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
              >
                <option value="active">
                  Aktiv
                </option>
                <option value="inactive">
                  Inaktiv
                </option>
                <option value="archived">
                  Archiviert
                </option>
              </select>
            </div>

            <div className="xl:col-span-2">
              <label className="block mb-2 font-medium">
                Beschreibung
              </label>
              <textarea
                value={departmentDescription}
                onChange={(event) =>
                  setDepartmentDescription(event.target.value)
                }
                rows={4}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus resize-none"
                placeholder="Beschreibung..."
              />
            </div>
          </div>
        </form>
      </AppModal>

      <PageHero
        eyebrow="Velunis Admin"
        title="Firmen & Abteilungen"
        description="Organisationsstruktur aus PostgreSQL verwalten. Firmen und Abteilungen steuern Sichtbarkeit, Zuständigkeiten und Benutzerzuordnung."
        badges={[
          {
            label: `${companies.length} Firmen`,
          },
          {
            label: `${departments.length} Abteilungen`,
          },
          {
            label: `${activeCompanies.length} Firmen aktiv`,
          },
          {
            label: latestCompany
              ? `Neueste: ${latestCompany.name}`
              : "Noch keine Firma",
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

            {canManageCompanies() && (
              <>
                <button
                  type="button"
                  onClick={openCompanyCreateForm}
                  className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
                >
                  Firma erstellen
                </button>

                <button
                  type="button"
                  onClick={openDepartmentCreateForm}
                  className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
                >
                  Abteilung erstellen
                </button>
              </>
            )}
          </>
        }
      />

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Organisation wird geladen...
          </p>
        </div>
      )}

      {message && (
        <div className="bg-green-50 border border-green-100 rounded-3xl p-6 shadow-sm">
          <p className="text-green-700 font-medium">
            {message}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-red-700">
            Fehler
          </h2>
          <p className="text-red-600 mt-2">
            {error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Firmen"
          value={companies.length}
          description={`${activeCompanies.length} aktiv`}
          icon="🏢"
          tone="blue"
          active={!companyFilter && !statusFilter && !search}
          onClick={resetFilters}
        />

        <StatCard
          label="Aktive Firmen"
          value={activeCompanies.length}
          description={`${inactiveCompanies.length} inaktiv`}
          icon="✅"
          tone="green"
          active={statusFilter === "active"}
          onClick={() => setStatusFilter("active")}
        />

        <StatCard
          label="Abteilungen"
          value={departments.length}
          description={`${activeDepartments.length} aktiv`}
          icon="🧭"
          tone="indigo"
        />

        <StatCard
          label="Archiviert"
          value={archivedCompanies.length}
          description={`${inactiveDepartments.length} Abteilungen inaktiv`}
          icon="🗄️"
          tone="orange"
          active={statusFilter === "archived"}
          onClick={() => setStatusFilter("archived")}
        />
      </div>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <h2 className="text-2xl font-bold">
              Suche & Filter
            </h2>
            <p className="text-zinc-500 mt-1">
              Suche nach Firmen, Abteilungen, Slugs, Status oder Beschreibung.
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
            placeholder="Organisation suchen..."
          />

          <select
            value={companyFilter}
            onChange={(event) => setCompanyFilter(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
          >
            <option value="">
              Alle Firmen
            </option>

            {companies.map((company) => (
              <option
                key={company.id}
                value={company.id}
              >
                {company.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
          >
            <option value="">
              Alle Status
            </option>
            <option value="active">
              Aktiv
            </option>
            <option value="inactive">
              Inaktiv
            </option>
            <option value="archived">
              Archiviert
            </option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-5">
          <span className="text-sm text-zinc-500">
            {filteredCompanies.length} Firmen und {filteredDepartments.length} Abteilungen gefunden.
          </span>

          {search && (
            <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
              Suche: {search}
            </span>
          )}

          {companyFilter && (
            <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
              Firma: {getCompanyName(companyFilter)}
            </span>
          )}

          {statusFilter && (
            <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
              Status: {getStatusLabel(statusFilter)}
            </span>
          )}
        </div>
      </section>

      {viewMode === "table" && (
        <section className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Typ
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Name
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Firma
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Slug
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Status
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Beschreibung
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Aktionen
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100">
                {filteredCompanies.length === 0 &&
                  filteredDepartments.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-10 text-center text-zinc-500"
                      >
                        Keine Organisationseinträge gefunden.
                      </td>
                    </tr>
                  )}

                {filteredCompanies.map((company) => (
                  <tr
                    key={`company-${company.id}`}
                    className="hover:bg-zinc-50 transition"
                  >
                    <td className="px-5 py-4 align-top">
                      <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
                        Firma
                      </span>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <p className="font-black text-zinc-950">
                        {company.name}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {getCompanyDepartmentCount(company.id)} Abteilungen
                      </p>
                    </td>

                    <td className="px-5 py-4 align-top text-sm text-zinc-500">
                      —
                    </td>

                    <td className="px-5 py-4 align-top text-sm text-zinc-500">
                      {company.slug}
                    </td>

                    <td className="px-5 py-4 align-top">
                      <span
                        className={`text-xs px-3 py-1 rounded-full border font-bold ${getStatusClass(
                          company.status,
                        )}`}
                      >
                        {getStatusLabel(company.status)}
                      </span>
                    </td>

                    <td className="px-5 py-4 align-top text-sm text-zinc-500 max-w-sm">
                      <p className="line-clamp-2">
                        {company.description || "Keine Beschreibung vorhanden."}
                      </p>
                    </td>

                    <td className="px-5 py-4 align-top">
                      {canManageCompanies() && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEditCompany(company)}
                            className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition font-bold"
                          >
                            Bearbeiten
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDeleteCompany(company)}
                            className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition font-bold"
                          >
                            Löschen
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredDepartments.map((department) => (
                  <tr
                    key={`department-${department.id}`}
                    className="hover:bg-zinc-50 transition"
                  >
                    <td className="px-5 py-4 align-top">
                      <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full font-bold">
                        Abteilung
                      </span>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <p className="font-black text-zinc-950">
                        {department.name}
                      </p>
                    </td>

                    <td className="px-5 py-4 align-top text-sm text-zinc-500">
                      {getCompanyName(department.companyId)}
                    </td>

                    <td className="px-5 py-4 align-top text-sm text-zinc-500">
                      {department.slug}
                    </td>

                    <td className="px-5 py-4 align-top">
                      <span
                        className={`text-xs px-3 py-1 rounded-full border font-bold ${getStatusClass(
                          department.status,
                        )}`}
                      >
                        {getStatusLabel(department.status)}
                      </span>
                    </td>

                    <td className="px-5 py-4 align-top text-sm text-zinc-500 max-w-sm">
                      <p className="line-clamp-2">
                        {department.description || "Keine Beschreibung vorhanden."}
                      </p>
                    </td>

                    <td className="px-5 py-4 align-top">
                      {canManageCompanies() && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEditDepartment(department)}
                            className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition font-bold"
                          >
                            Bearbeiten
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDeleteDepartment(department)}
                            className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition font-bold"
                          >
                            Löschen
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {viewMode === "cards" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">
                  Firmen
                </h2>
                <p className="text-zinc-500 mt-1">
                  Mandanten und Organisationen.
                </p>
              </div>

              <span className="rounded-full app-accent-soft app-accent-text px-4 py-2 text-sm font-bold">
                {filteredCompanies.length}
              </span>
            </div>

            {filteredCompanies.length === 0 && (
              <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm text-center">
                <p className="text-zinc-500">
                  Keine Firmen gefunden.
                </p>
              </div>
            )}

            {filteredCompanies.map((company) => (
              <article
                key={company.id}
                className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`text-xs px-3 py-1 rounded-full border font-bold ${getStatusClass(
                          company.status,
                        )}`}
                      >
                        {getStatusLabel(company.status)}
                      </span>

                      <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
                        {getCompanyDepartmentCount(company.id)} Abteilungen
                      </span>
                    </div>

                    <h3 className="text-2xl font-black mt-4 line-clamp-1">
                      {company.name}
                    </h3>

                    <p className="text-zinc-500 mt-2 line-clamp-2">
                      {company.description || "Keine Beschreibung vorhanden."}
                    </p>

                    <p className="text-sm text-zinc-400 mt-4">
                      Slug: {company.slug}
                    </p>
                  </div>

                  {canManageCompanies() && (
                    <div className="flex flex-wrap gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditCompany(company)}
                        className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition font-bold"
                      >
                        Bearbeiten
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDeleteCompany(company)}
                        className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition font-bold"
                      >
                        Löschen
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </section>

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">
                  Abteilungen
                </h2>
                <p className="text-zinc-500 mt-1">
                  Teams innerhalb der Firmen.
                </p>
              </div>

              <span className="rounded-full app-accent-soft app-accent-text px-4 py-2 text-sm font-bold">
                {filteredDepartments.length}
              </span>
            </div>

            {filteredDepartments.length === 0 && (
              <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm text-center">
                <p className="text-zinc-500">
                  Keine Abteilungen gefunden.
                </p>
              </div>
            )}

            {filteredDepartments.map((department) => (
              <article
                key={department.id}
                className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`text-xs px-3 py-1 rounded-full border font-bold ${getStatusClass(
                          department.status,
                        )}`}
                      >
                        {getStatusLabel(department.status)}
                      </span>

                      <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                        {getCompanyName(department.companyId)}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black mt-4 line-clamp-1">
                      {department.name}
                    </h3>

                    <p className="text-zinc-500 mt-2 line-clamp-2">
                      {department.description || "Keine Beschreibung vorhanden."}
                    </p>

                    <p className="text-sm text-zinc-400 mt-4">
                      Slug: {department.slug}
                    </p>
                  </div>

                  {canManageCompanies() && (
                    <div className="flex flex-wrap gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditDepartment(department)}
                        className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition font-bold"
                      >
                        Bearbeiten
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDeleteDepartment(department)}
                        className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition font-bold"
                      >
                        Löschen
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}