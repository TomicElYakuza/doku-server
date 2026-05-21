"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  canManageSystem,
  canViewAdmin,
} from "../../../lib/permissions";

import {
  companyRepository,
} from "../../../lib/companyRepository";

import type {
  Company,
  CompanyStatus,
  Department,
  DepartmentStatus,
} from "../../../types/company";

import {
  saveCompanyCreatedActivity,
  saveCompanyDeletedActivity,
  saveCompanyUpdatedActivity,
  saveDepartmentCreatedActivity,
  saveDepartmentDeletedActivity,
  saveDepartmentUpdatedActivity,
} from "../../../lib/organizationActivityHelpers";

import AccessDeniedCard from "../../../components/AccessDeniedCard";

type ViewMode =
  | "companies"
  | "departments";

function createSlug(
  value: string
) {
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

function getStatusClass(
  status: string
) {
  if (status === "active") {
    return "bg-green-50 text-green-700";
  }

  if (status === "inactive") {
    return "bg-zinc-100 text-zinc-700";
  }

  if (status === "archived") {
    return "bg-yellow-100 text-yellow-700";
  }

  return "bg-zinc-100 text-zinc-700";
}

export default function AdminCompaniesPage() {
  const [mounted, setMounted] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [viewMode, setViewMode] =
    useState<ViewMode>("companies");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [companyFilter, setCompanyFilter] =
    useState("");

  const [showCompanyForm, setShowCompanyForm] =
    useState(false);

  const [showDepartmentForm, setShowDepartmentForm] =
    useState(false);

  const [editingCompanyId, setEditingCompanyId] =
    useState("");

  const [editingDepartmentId, setEditingDepartmentId] =
    useState("");

  const [companyName, setCompanyName] =
    useState("");

  const [companySlug, setCompanySlug] =
    useState("");

  const [companyDescription, setCompanyDescription] =
    useState("");

  const [companyStatus, setCompanyStatus] =
    useState<CompanyStatus>("active");

  const [departmentCompanyId, setDepartmentCompanyId] =
    useState("");

  const [departmentName, setDepartmentName] =
    useState("");

  const [departmentSlug, setDepartmentSlug] =
    useState("");

  const [departmentDescription, setDepartmentDescription] =
    useState("");

  const [departmentStatus, setDepartmentStatus] =
    useState<DepartmentStatus>("active");

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
      handleCompaniesUpdated
    );

    window.addEventListener(
      "departmentsUpdated",
      handleDepartmentsUpdated
    );

    return () => {
      window.removeEventListener(
        "companiesUpdated",
        handleCompaniesUpdated
      );

      window.removeEventListener(
        "departmentsUpdated",
        handleDepartmentsUpdated
      );
    };
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [
        nextCompanies,
        nextDepartments,
      ] =
        await Promise.all([
          companyRepository.listCompanies(),
          companyRepository.listDepartments(),
        ]);

      setCompanies(
        nextCompanies
      );

      setDepartments(
        nextDepartments
      );

      if (
        !departmentCompanyId &&
        nextCompanies.length > 0
      ) {
        setDepartmentCompanyId(
          nextCompanies[0].id
        );
      }
    } catch (error) {
      console.error(
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Firmen und Abteilungen konnten nicht geladen werden."
      );
    } finally {
      setLoading(false);
    }
  }

  function getCompanyName(
    companyId?: string
  ) {
    if (!companyId) {
      return "";
    }

    return (
      companies.find(
        (company) =>
          company.id === companyId
      )?.name || ""
    );
  }

  function getDepartmentCount(
    companyId: string
  ) {
    return departments.filter(
      (department) =>
        department.companyId === companyId
    ).length;
  }

  function resetCompanyForm() {
    setEditingCompanyId("");
    setCompanyName("");
    setCompanySlug("");
    setCompanyDescription("");
    setCompanyStatus("active");
    setShowCompanyForm(false);
  }

  function resetDepartmentForm() {
    setEditingDepartmentId("");
    setDepartmentCompanyId(
      companies[0]?.id ||
        ""
    );
    setDepartmentName("");
    setDepartmentSlug("");
    setDepartmentDescription("");
    setDepartmentStatus("active");
    setShowDepartmentForm(false);
  }

  function openCompanyForm() {
    resetCompanyForm();

    setShowCompanyForm(true);
    setShowDepartmentForm(false);
    setViewMode("companies");
  }

  function openDepartmentForm() {
    resetDepartmentForm();

    setShowDepartmentForm(true);
    setShowCompanyForm(false);
    setViewMode("departments");
  }

  function startEditCompany(
    company: Company
  ) {
    setEditingCompanyId(
      company.id
    );

    setCompanyName(
      company.name
    );

    setCompanySlug(
      company.slug
    );

    setCompanyDescription(
      company.description ||
        ""
    );

    setCompanyStatus(
      company.status
    );

    setShowCompanyForm(true);
    setShowDepartmentForm(false);
    setViewMode("companies");

    window.scrollTo({
      top:
        0,

      behavior:
        "smooth",
    });
  }

  function startEditDepartment(
    department: Department
  ) {
    setEditingDepartmentId(
      department.id
    );

    setDepartmentCompanyId(
      department.companyId
    );

    setDepartmentName(
      department.name
    );

    setDepartmentSlug(
      department.slug
    );

    setDepartmentDescription(
      department.description ||
        ""
    );

    setDepartmentStatus(
      department.status
    );

    setShowDepartmentForm(true);
    setShowCompanyForm(false);
    setViewMode("departments");

    window.scrollTo({
      top:
        0,

      behavior:
        "smooth",
    });
  }

  async function handleSaveCompany() {
    if (!canManageSystem()) {
      alert(
        "Du hast keine Berechtigung, Firmen zu verwalten."
      );

      return;
    }

    if (!companyName.trim()) {
      alert(
        "Bitte einen Firmennamen eingeben."
      );

      return;
    }

    const nextSlug =
      companySlug.trim() ||
      createSlug(
        companyName
      );

    try {
      if (editingCompanyId) {
        const updatedCompany =
          await companyRepository.updateCompany(
            editingCompanyId,
            {
              name:
                companyName.trim(),

              slug:
                nextSlug,

              description:
                companyDescription.trim(),

              status:
                companyStatus,
            }
          );

        if (updatedCompany) {
          saveCompanyUpdatedActivity(
            updatedCompany
          );
        }

        resetCompanyForm();

        await loadData();

        return;
      }

      const newCompany =
        await companyRepository.createCompany({
          name:
            companyName.trim(),

          slug:
            nextSlug,

          description:
            companyDescription.trim(),

          status:
            companyStatus,
        });

      saveCompanyCreatedActivity(
        newCompany
      );

      resetCompanyForm();

      await loadData();
    } catch (error) {
      console.error(
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Firma konnte nicht gespeichert werden."
      );
    }
  }

  async function handleSaveDepartment() {
    if (!canManageSystem()) {
      alert(
        "Du hast keine Berechtigung, Abteilungen zu verwalten."
      );

      return;
    }

    if (!departmentCompanyId) {
      alert(
        "Bitte eine Firma auswählen."
      );

      return;
    }

    if (!departmentName.trim()) {
      alert(
        "Bitte einen Abteilungsnamen eingeben."
      );

      return;
    }

    const nextSlug =
      departmentSlug.trim() ||
      createSlug(
        departmentName
      );

    const companyNameForActivity =
      getCompanyName(
        departmentCompanyId
      );

    try {
      if (editingDepartmentId) {
        const updatedDepartment =
          await companyRepository.updateDepartment(
            editingDepartmentId,
            {
              companyId:
                departmentCompanyId,

              name:
                departmentName.trim(),

              slug:
                nextSlug,

              description:
                departmentDescription.trim(),

              status:
                departmentStatus,
            }
          );

        if (updatedDepartment) {
          saveDepartmentUpdatedActivity(
            updatedDepartment,
            companyNameForActivity
          );
        }

        resetDepartmentForm();

        await loadData();

        return;
      }

      const newDepartment =
        await companyRepository.createDepartment({
          companyId:
            departmentCompanyId,

          name:
            departmentName.trim(),

          slug:
            nextSlug,

          description:
            departmentDescription.trim(),

          status:
            departmentStatus,
        });

      saveDepartmentCreatedActivity(
        newDepartment,
        companyNameForActivity
      );

      resetDepartmentForm();

      await loadData();
    } catch (error) {
      console.error(
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Abteilung konnte nicht gespeichert werden."
      );
    }
  }

  async function handleDeleteCompany(
    company: Company
  ) {
    if (!canManageSystem()) {
      alert(
        "Du hast keine Berechtigung, Firmen zu löschen."
      );

      return;
    }

    const departmentCount =
      getDepartmentCount(
        company.id
      );

    const confirmed =
      confirm(
        departmentCount > 0
          ? `Firma "${company.name}" wirklich löschen? Es sind noch ${departmentCount} Abteilungen zugeordnet.`
          : `Firma "${company.name}" wirklich löschen?`
      );

    if (!confirmed) {
      return;
    }

    try {
      saveCompanyDeletedActivity(
        company
      );

      await companyRepository.deleteCompany(
        company.id
      );

      await loadData();
    } catch (error) {
      console.error(
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Firma konnte nicht gelöscht werden."
      );
    }
  }

  async function handleDeleteDepartment(
    department: Department
  ) {
    if (!canManageSystem()) {
      alert(
        "Du hast keine Berechtigung, Abteilungen zu löschen."
      );

      return;
    }

    const confirmed =
      confirm(
        `Abteilung "${department.name}" wirklich löschen?`
      );

    if (!confirmed) {
      return;
    }

    try {
      saveDepartmentDeletedActivity(
        department,
        getCompanyName(
          department.companyId
        )
      );

      await companyRepository.deleteDepartment(
        department.id
      );

      await loadData();
    } catch (error) {
      console.error(
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Abteilung konnte nicht gelöscht werden."
      );
    }
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
    setCompanyFilter("");
  }

  if (!mounted) {
    return null;
  }

  if (!canViewAdmin()) {
    return (
      <AccessDeniedCard />
    );
  }

  const activeCompanies =
    companies.filter(
      (company) =>
        company.status === "active"
    ).length;

  const inactiveCompanies =
    companies.filter(
      (company) =>
        company.status === "inactive"
    ).length;

  const activeDepartments =
    departments.filter(
      (department) =>
        department.status === "active"
    ).length;

  const filteredCompanies =
    companies.filter(
      (company) => {
        const query =
          search.toLowerCase();

        const matchesSearch =
          !query ||
          company.name
            .toLowerCase()
            .includes(
              query
            ) ||
          company.slug
            .toLowerCase()
            .includes(
              query
            ) ||
          company.description
            ?.toLowerCase()
            .includes(
              query
            );

        const matchesStatus =
          !statusFilter ||
          company.status === statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );

  const filteredDepartments =
    departments.filter(
      (department) => {
        const query =
          search.toLowerCase();

        const companyName =
          getCompanyName(
            department.companyId
          );

        const matchesSearch =
          !query ||
          department.name
            .toLowerCase()
            .includes(
              query
            ) ||
          department.slug
            .toLowerCase()
            .includes(
              query
            ) ||
          department.description
            ?.toLowerCase()
            .includes(
              query
            ) ||
          companyName
            .toLowerCase()
            .includes(
              query
            );

        const matchesStatus =
          !statusFilter ||
          department.status === statusFilter;

        const matchesCompany =
          !companyFilter ||
          department.companyId === companyFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesCompany
        );
      }
    );

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zum Admin-Dashboard
        </Link>
      </div>

      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold">
            Firmen & Abteilungen
          </h1>

          <p className="text-zinc-500 mt-2">
            Organisationsstruktur für Benutzer, Tickets, Wiki und PostgreSQL verwalten
          </p>
        </div>

        {canManageSystem() && (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openCompanyForm}
              className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
            >
              Firma erstellen
            </button>

            <button
              type="button"
              onClick={openDepartmentForm}
              className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
            >
              Abteilung erstellen
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm text-zinc-500">
          Daten werden geladen...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <button
          type="button"
          onClick={() =>
            setViewMode(
              "companies"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Firmen gesamt
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {companies.length}
          </h2>
        </button>

        <button
          type="button"
          onClick={() =>
            setStatusFilter(
              "active"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-green-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Aktive Firmen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {activeCompanies}
          </h2>
        </button>

        <button
          type="button"
          onClick={() =>
            setStatusFilter(
              "inactive"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Inaktive Firmen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {inactiveCompanies}
          </h2>
        </button>

        <button
          type="button"
          onClick={() =>
            setViewMode(
              "departments"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-indigo-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Abteilungen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {departments.length}
          </h2>
        </button>

        <button
          type="button"
          onClick={() => {
            setViewMode(
              "departments"
            );

            setStatusFilter(
              "active"
            );
          }}
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-blue-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Aktive Abteilungen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {activeDepartments}
          </h2>
        </button>
      </div>

      {showCompanyForm && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">
            {editingCompanyId
              ? "Firma bearbeiten"
              : "Firma erstellen"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            <div>
              <label className="block mb-2 font-medium">
                Firmenname
              </label>

              <input
                type="text"
                value={companyName}
                onChange={(event) => {
                  const value =
                    event.target.value;

                  setCompanyName(
                    value
                  );

                  if (!editingCompanyId) {
                    setCompanySlug(
                      createSlug(
                        value
                      )
                    );
                  }
                }}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Intern, Kunde GmbH..."
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Slug
              </label>

              <input
                type="text"
                value={companySlug}
                onChange={(event) =>
                  setCompanySlug(
                    createSlug(
                      event.target.value
                    )
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="intern"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Status
              </label>

              <select
                value={companyStatus}
                onChange={(event) =>
                  setCompanyStatus(
                    event.target.value as CompanyStatus
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
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

            <div className="md:col-span-2">
              <label className="block mb-2 font-medium">
                Beschreibung
              </label>

              <textarea
                value={companyDescription}
                onChange={(event) =>
                  setCompanyDescription(
                    event.target.value
                  )
                }
                rows={4}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-none"
                placeholder="Beschreibung der Firma..."
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              type="button"
              onClick={handleSaveCompany}
              className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
            >
              {editingCompanyId
                ? "Änderungen speichern"
                : "Firma erstellen"}
            </button>

            <button
              type="button"
              onClick={resetCompanyForm}
              className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {showDepartmentForm && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">
            {editingDepartmentId
              ? "Abteilung bearbeiten"
              : "Abteilung erstellen"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            <div>
              <label className="block mb-2 font-medium">
                Firma
              </label>

              <select
                value={departmentCompanyId}
                onChange={(event) =>
                  setDepartmentCompanyId(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                <option value="">
                  Firma auswählen
                </option>

                {companies.map(
                  (company) => (
                    <option
                      key={company.id}
                      value={company.id}
                    >
                      {company.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Abteilungsname
              </label>

              <input
                type="text"
                value={departmentName}
                onChange={(event) => {
                  const value =
                    event.target.value;

                  setDepartmentName(
                    value
                  );

                  if (!editingDepartmentId) {
                    setDepartmentSlug(
                      createSlug(
                        value
                      )
                    );
                  }
                }}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="IT, Support, Office..."
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Slug
              </label>

              <input
                type="text"
                value={departmentSlug}
                onChange={(event) =>
                  setDepartmentSlug(
                    createSlug(
                      event.target.value
                    )
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
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
                  setDepartmentStatus(
                    event.target.value as DepartmentStatus
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
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

            <div className="md:col-span-2">
              <label className="block mb-2 font-medium">
                Beschreibung
              </label>

              <textarea
                value={departmentDescription}
                onChange={(event) =>
                  setDepartmentDescription(
                    event.target.value
                  )
                }
                rows={4}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-none"
                placeholder="Beschreibung der Abteilung..."
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              type="button"
              onClick={handleSaveDepartment}
              className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
            >
              {editingDepartmentId
                ? "Änderungen speichern"
                : "Abteilung erstellen"}
            </button>

            <button
              type="button"
              onClick={resetDepartmentForm}
              className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold">
              Suche & Filter
            </h2>

            <p className="text-zinc-500 mt-1">
              Suche nach Firmen oder Abteilungen und filtere nach Status.
            </p>
          </div>

          <div className="flex gap-2 bg-zinc-100 rounded-2xl p-1">
            <button
              type="button"
              onClick={() =>
                setViewMode(
                  "companies"
                )
              }
              className={`px-4 py-2 rounded-xl transition ${
                viewMode === "companies"
                  ? "bg-white shadow-sm"
                  : "hover:bg-zinc-200"
              }`}
            >
              Firmen
            </button>

            <button
              type="button"
              onClick={() =>
                setViewMode(
                  "departments"
                )
              }
              className={`px-4 py-2 rounded-xl transition ${
                viewMode === "departments"
                  ? "bg-white shadow-sm"
                  : "hover:bg-zinc-200"
              }`}
            >
              Abteilungen
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Nach Name, Slug oder Beschreibung suchen..."
            className="md:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
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

          {viewMode === "departments" && (
            <select
              value={companyFilter}
              onChange={(event) =>
                setCompanyFilter(
                  event.target.value
                )
              }
              className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
            >
              <option value="">
                Alle Firmen
              </option>

              {companies.map(
                (company) => (
                  <option
                    key={company.id}
                    value={company.id}
                  >
                    {company.name}
                  </option>
                )
              )}
            </select>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-5">
          <p className="text-sm text-zinc-500">
            {viewMode === "companies"
              ? `${filteredCompanies.length} von ${companies.length} Firmen gefunden`
              : `${filteredDepartments.length} von ${departments.length} Abteilungen gefunden`}
          </p>

          <button
            type="button"
            onClick={resetFilters}
            className="text-sm bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
          >
            Filter zurücksetzen
          </button>
        </div>
      </div>

      {viewMode === "companies" && (
        <div className="grid gap-4">
          {filteredCompanies.length === 0 && (
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <p className="text-zinc-500">
                Keine Firmen gefunden.
              </p>
            </div>
          )}

          {filteredCompanies.map(
            (company) => (
              <div
                key={company.id}
                className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-xs px-3 py-1 rounded-full ${getStatusClass(company.status)}`}>
                        {companyRepository.getCompanyStatusLabel(
                          company.status
                        )}
                      </span>

                      <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                        {company.slug}
                      </span>

                      <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                        {getDepartmentCount(
                          company.id
                        )}{" "}
                        Abteilungen
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold mt-4">
                      {company.name}
                    </h2>

                    <p className="text-zinc-500 mt-2">
                      {company.description ||
                        "Keine Beschreibung"}
                    </p>

                    <div className="flex flex-wrap gap-6 text-sm text-zinc-500 mt-5">
                      <p>
                        Erstellt:{" "}
                        {company.createdAt}
                      </p>

                      <p>
                        Aktualisiert:{" "}
                        {company.updatedAt}
                      </p>
                    </div>
                  </div>

                  {canManageSystem() && (
                    <div className="flex flex-wrap gap-3 justify-end shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          startEditCompany(
                            company
                          )
                        }
                        className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition"
                      >
                        Bearbeiten
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void handleDeleteCompany(
                            company
                          )
                        }
                        className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition"
                      >
                        Löschen
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {viewMode === "departments" && (
        <div className="grid gap-4">
          {filteredDepartments.length === 0 && (
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <p className="text-zinc-500">
                Keine Abteilungen gefunden.
              </p>
            </div>
          )}

          {filteredDepartments.map(
            (department) => (
              <div
                key={department.id}
                className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-xs px-3 py-1 rounded-full ${getStatusClass(department.status)}`}>
                        {companyRepository.getDepartmentStatusLabel(
                          department.status
                        )}
                      </span>

                      <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
                        {getCompanyName(
                          department.companyId
                        ) || "Keine Firma"}
                      </span>

                      <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                        {department.slug}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold mt-4">
                      {department.name}
                    </h2>

                    <p className="text-zinc-500 mt-2">
                      {department.description ||
                        "Keine Beschreibung"}
                    </p>

                    <div className="flex flex-wrap gap-6 text-sm text-zinc-500 mt-5">
                      <p>
                        Erstellt:{" "}
                        {department.createdAt}
                      </p>

                      <p>
                        Aktualisiert:{" "}
                        {department.updatedAt}
                      </p>
                    </div>
                  </div>

                  {canManageSystem() && (
                    <div className="flex flex-wrap gap-3 justify-end shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          startEditDepartment(
                            department
                          )
                        }
                        className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition"
                      >
                        Bearbeiten
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void handleDeleteDepartment(
                            department
                          )
                        }
                        className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition"
                      >
                        Löschen
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}