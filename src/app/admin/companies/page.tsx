"use client";

import Link from "next/link";

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

import type {
  Company,
  CompanyStatus,
  Department,
  DepartmentStatus,
} from "../../../types/company";

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

function getStatusLabel(
  status: string
) {
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

function getStatusClass(
  status: string
) {
  if (status === "active") {
    return "bg-green-50 text-green-700";
  }

  if (status === "inactive") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "archived") {
    return "bg-zinc-100 text-zinc-600";
  }

  return "bg-zinc-100 text-zinc-700";
}

type FormMode =
  | "company"
  | "department"
  | "";

export default function AdminCompaniesPage() {
  const [mounted, setMounted] =
    useState(false);

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [search, setSearch] =
    useState("");

  const [companyFilter, setCompanyFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [formMode, setFormMode] =
    useState<FormMode>("");

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

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    setMounted(
      true
    );

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
      setLoading(
        true
      );

      setError(
        ""
      );

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
    } catch (loadError) {
      console.error(
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Organisation konnte nicht geladen werden."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  function getCompanyName(
    companyId: string
  ) {
    return (
      companies.find(
        (company) =>
          company.id === companyId
      )?.name ||
      "Unbekannte Firma"
    );
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

  function openCompanyCreateForm() {
    resetForms();

    setFormMode(
      "company"
    );
  }

  function openDepartmentCreateForm() {
    resetForms();

    setDepartmentCompanyId(
      companies[0]?.id ||
        ""
    );

    setFormMode(
      "department"
    );
  }

  function startEditCompany(
    company: Company
  ) {
    resetForms();

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
      company.description
    );

    setCompanyStatus(
      company.status
    );

    setFormMode(
      "company"
    );

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
    resetForms();

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
      department.description
    );

    setDepartmentStatus(
      department.status
    );

    setFormMode(
      "department"
    );

    window.scrollTo({
      top:
        0,

      behavior:
        "smooth",
    });
  }

  const filteredCompanies =
    useMemo(
      () => {
        const query =
          search.trim().toLowerCase();

        return companies.filter(
          (company) => {
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
      },
      [
        companies,
        search,
        statusFilter,
      ]
    );

  const filteredDepartments =
    useMemo(
      () => {
        const query =
          search.trim().toLowerCase();

        return departments.filter(
          (department) => {
            const companyNameValue =
              getCompanyName(
                department.companyId
              );

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
                .includes(
                  query
                );

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
          }
        );
      },
      [
        departments,
        companies,
        search,
        companyFilter,
        statusFilter,
      ]
    );

  const activeCompanies =
    companies.filter(
      (company) =>
        company.status === "active"
    );

  const activeDepartments =
    departments.filter(
      (department) =>
        department.status === "active"
    );

  async function handleCompanySubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!canManageCompanies()) {
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
      companySlug.trim()
        ? createSlug(
            companySlug
          )
        : createSlug(
            companyName
          );

    try {
      setSaving(
        true
      );

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

        resetForms();

        await loadData();

        return;
      }

      const createdCompany =
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
        createdCompany
      );

      resetForms();

      await loadData();
    } catch (saveError) {
      console.error(
        saveError
      );

      alert(
        saveError instanceof Error
          ? saveError.message
          : "Firma konnte nicht gespeichert werden."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  async function handleDepartmentSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!canManageCompanies()) {
      alert(
        "Du hast keine Berechtigung, Abteilungen zu verwalten."
      );

      return;
    }

    if (!departmentName.trim()) {
      alert(
        "Bitte einen Abteilungsnamen eingeben."
      );

      return;
    }

    if (!departmentCompanyId) {
      alert(
        "Bitte eine Firma auswählen."
      );

      return;
    }

    const nextSlug =
      departmentSlug.trim()
        ? createSlug(
            departmentSlug
          )
        : createSlug(
            departmentName
          );

    const companyNameValue =
      getCompanyName(
        departmentCompanyId
      );

    try {
      setSaving(
        true
      );

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
            companyNameValue
          );
        }

        resetForms();

        await loadData();

        return;
      }

      const createdDepartment =
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
        createdDepartment,
        companyNameValue
      );

      resetForms();

      await loadData();
    } catch (saveError) {
      console.error(
        saveError
      );

      alert(
        saveError instanceof Error
          ? saveError.message
          : "Abteilung konnte nicht gespeichert werden."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  async function handleDeleteCompany(
    company: Company
  ) {
    if (!canManageCompanies()) {
      alert(
        "Du hast keine Berechtigung, Firmen zu löschen."
      );

      return;
    }

    const relatedDepartments =
      departments.filter(
        (department) =>
          department.companyId === company.id
      );

    const confirmed =
      confirm(
        `Firma "${company.name}" wirklich löschen? Zugeordnete Abteilungen: ${relatedDepartments.length}`
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
    } catch (deleteError) {
      console.error(
        deleteError
      );

      alert(
        deleteError instanceof Error
          ? deleteError.message
          : "Firma konnte nicht gelöscht werden."
      );
    }
  }

  async function handleDeleteDepartment(
    department: Department
  ) {
    if (!canManageCompanies()) {
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
    } catch (deleteError) {
      console.error(
        deleteError
      );

      alert(
        deleteError instanceof Error
          ? deleteError.message
          : "Abteilung konnte nicht gelöscht werden."
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
      <AccessDeniedCard />
    );
  }

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

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div>
          <h1 className="text-4xl font-bold">
            Firmen & Abteilungen
          </h1>

          <p className="text-zinc-500 mt-2">
            Organisationsstruktur aus PostgreSQL verwalten.
          </p>
        </div>

        {canManageCompanies() && (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openCompanyCreateForm}
              className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
            >
              Firma erstellen
            </button>

            <button
              type="button"
              onClick={openDepartmentCreateForm}
              className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
            >
              Abteilung erstellen
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Organisation wird geladen...
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
        <button
          type="button"
          onClick={resetFilters}
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Firmen
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
            {activeCompanies.length}
          </h2>
        </button>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Abteilungen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {departments.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Aktive Abteilungen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {activeDepartments.length}
          </h2>
        </div>
      </div>

      {formMode === "company" && (
        <form
          onSubmit={(event) =>
            void handleCompanySubmit(
              event
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm space-y-6"
        >
          <div>
            <h2 className="text-2xl font-semibold">
              {editingCompanyId
                ? "Firma bearbeiten"
                : "Firma erstellen"}
            </h2>

            <p className="text-zinc-500 mt-1">
              Firma wird direkt in PostgreSQL gespeichert.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block mb-2 font-medium">
                Name
              </label>

              <input
                value={companyName}
                onChange={(event) => {
                  const value =
                    event.target.value;

                  setCompanyName(
                    value
                  );

                  if (!companySlug) {
                    setCompanySlug(
                      createSlug(
                        value
                      )
                    );
                  }
                }}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
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
                  setCompanySlug(
                    createSlug(
                      event.target.value
                    )
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
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
                rows={3}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-none"
                placeholder="Beschreibung..."
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition disabled:opacity-50"
            >
              {saving
                ? "Speichert..."
                : editingCompanyId
                  ? "Firma speichern"
                  : "Firma erstellen"}
            </button>

            <button
              type="button"
              onClick={resetForms}
              className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {formMode === "department" && (
        <form
          onSubmit={(event) =>
            void handleDepartmentSubmit(
              event
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm space-y-6"
        >
          <div>
            <h2 className="text-2xl font-semibold">
              {editingDepartmentId
                ? "Abteilung bearbeiten"
                : "Abteilung erstellen"}
            </h2>

            <p className="text-zinc-500 mt-1">
              Abteilung wird direkt in PostgreSQL gespeichert.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                Name
              </label>

              <input
                value={departmentName}
                onChange={(event) => {
                  const value =
                    event.target.value;

                  setDepartmentName(
                    value
                  );

                  if (!departmentSlug) {
                    setDepartmentSlug(
                      createSlug(
                        value
                      )
                    );
                  }
                }}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
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
                rows={3}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-none"
                placeholder="Beschreibung..."
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition disabled:opacity-50"
            >
              {saving
                ? "Speichert..."
                : editingDepartmentId
                  ? "Abteilung speichern"
                  : "Abteilung erstellen"}
            </button>

            <button
              type="button"
              onClick={resetForms}
              className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-5">
          <div>
            <h2 className="text-xl font-semibold">
              Suche & Filter
            </h2>

            <p className="text-zinc-500 mt-1">
              Suche nach Firmen, Abteilungen, Slugs oder Status.
            </p>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="text-sm bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
          >
            Zurücksetzen
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
            placeholder="Organisation suchen..."
          />

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
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Firmen
          </h2>

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
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                  <div>
                    <span className={`text-xs px-3 py-1 rounded-full ${getStatusClass(company.status)}`}>
                      {getStatusLabel(
                        company.status
                      )}
                    </span>

                    <h3 className="text-2xl font-bold mt-4">
                      {company.name}
                    </h3>

                    <p className="text-zinc-500 mt-2">
                      {company.description ||
                        "Keine Beschreibung vorhanden."}
                    </p>

                    <p className="text-sm text-zinc-400 mt-4">
                      Slug: {company.slug}
                    </p>
                  </div>

                  {canManageCompanies() && (
                    <div className="flex flex-wrap gap-3 shrink-0">
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
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Abteilungen
          </h2>

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
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-xs px-3 py-1 rounded-full ${getStatusClass(department.status)}`}>
                        {getStatusLabel(
                          department.status
                        )}
                      </span>

                      <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                        {getCompanyName(
                          department.companyId
                        )}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold mt-4">
                      {department.name}
                    </h3>

                    <p className="text-zinc-500 mt-2">
                      {department.description ||
                        "Keine Beschreibung vorhanden."}
                    </p>

                    <p className="text-sm text-zinc-400 mt-4">
                      Slug: {department.slug}
                    </p>
                  </div>

                  {canManageCompanies() && (
                    <div className="flex flex-wrap gap-3 shrink-0">
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
        </section>
      </div>
    </div>
  );
}