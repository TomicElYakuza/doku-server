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
  createAdminUser,
  deleteAdminUser,
  getAdminUserRoleClass,
  getAdminUserRoleLabel,
  getAdminUserStatusClass,
  getAdminUserStatusLabel,
  getAdminUsers,
  updateAdminUser,
} from "../../../lib/adminUserStorage";

import type {
  AdminUser,
  AdminUserStatus,
} from "../../../lib/adminUserStorage";

import type {
  UserRole,
} from "../../../lib/userStorage";

import {
  getActiveCompanies,
  getActiveDepartments,
  getActiveDepartmentsByCompanyId,
  getCompanies,
  getDepartments,
} from "../../../lib/companyStorage";

import type {
  Company,
  Department,
} from "../../../lib/companyStorage";

import {
  saveUserCreatedActivity,
  saveUserDeletedActivity,
  saveUserUpdatedActivity,
} from "../../../lib/userActivityHelpers";

type ViewMode =
  | "cards"
  | "table";

export default function AdminUsersPage() {
  const [mounted, setMounted] =
    useState(false);

  const [users, setUsers] =
    useState<AdminUser[]>([]);

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [search, setSearch] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [companyFilter, setCompanyFilter] =
    useState("");

  const [departmentFilter, setDepartmentFilter] =
    useState("");

  const [viewMode, setViewMode] =
    useState<ViewMode>("cards");

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState("");

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [role, setRole] =
    useState<UserRole>("viewer");

  const [status, setStatus] =
    useState<AdminUserStatus>("active");

  const [companyId, setCompanyId] =
    useState("");

  const [departmentId, setDepartmentId] =
    useState("");

  const [company, setCompany] =
    useState("Intern");

  const [department, setDepartment] =
    useState("Allgemein");

  useEffect(() => {
    setMounted(true);

    loadData();

    function handleAdminUsersUpdated() {
      loadData();
    }

    function handleCompaniesUpdated() {
      loadData();
    }

    function handleDepartmentsUpdated() {
      loadData();
    }

    window.addEventListener(
      "adminUsersUpdated",
      handleAdminUsersUpdated
    );

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
        "adminUsersUpdated",
        handleAdminUsersUpdated
      );

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

  function loadData() {
    const nextCompanies =
      getCompanies();

    const nextDepartments =
      getDepartments();

    setUsers(
      getAdminUsers()
    );

    setCompanies(
      nextCompanies
    );

    setDepartments(
      nextDepartments
    );

    if (
      !companyId &&
      nextCompanies.length > 0
    ) {
      setCompanyId(
        nextCompanies[0].id
      );

      setCompany(
        nextCompanies[0].name
      );
    }

    if (
      !departmentId &&
      nextDepartments.length > 0
    ) {
      setDepartmentId(
        nextDepartments[0].id
      );

      setDepartment(
        nextDepartments[0].name
      );
    }
  }

  function getCompanyName(
    nextCompanyId?: string
  ) {
    if (!nextCompanyId) {
      return "";
    }

    return (
      companies.find(
        (item) =>
          item.id === nextCompanyId
      )?.name || ""
    );
  }

  function getDepartmentName(
    nextDepartmentId?: string
  ) {
    if (!nextDepartmentId) {
      return "";
    }

    return (
      departments.find(
        (item) =>
          item.id === nextDepartmentId
      )?.name || ""
    );
  }

  function getSelectableDepartments() {
    if (!companyId) {
      return getActiveDepartments();
    }

    return getActiveDepartmentsByCompanyId(
      companyId
    );
  }

  function handleCompanyChange(
    nextCompanyId: string
  ) {
    setCompanyId(
      nextCompanyId
    );

    const selectedCompany =
      companies.find(
        (item) =>
          item.id === nextCompanyId
      );

    setCompany(
      selectedCompany?.name ||
        "Intern"
    );

    const nextDepartments =
      getActiveDepartmentsByCompanyId(
        nextCompanyId
      );

    const firstDepartment =
      nextDepartments[0];

    setDepartmentId(
      firstDepartment?.id || ""
    );

    setDepartment(
      firstDepartment?.name ||
        "Allgemein"
    );
  }

  function handleDepartmentChange(
    nextDepartmentId: string
  ) {
    setDepartmentId(
      nextDepartmentId
    );

    const selectedDepartment =
      departments.find(
        (item) =>
          item.id === nextDepartmentId
      );

    setDepartment(
      selectedDepartment?.name ||
        "Allgemein"
    );
  }

  function resetForm() {
    const activeCompanies =
      getActiveCompanies();

    const firstCompany =
      activeCompanies[0];

    const activeDepartments =
      firstCompany
        ? getActiveDepartmentsByCompanyId(
            firstCompany.id
          )
        : getActiveDepartments();

    const firstDepartment =
      activeDepartments[0];

    setEditingId("");

    setName("");

    setEmail("");

    setRole("viewer");

    setStatus("active");

    setCompanyId(
      firstCompany?.id || ""
    );

    setDepartmentId(
      firstDepartment?.id || ""
    );

    setCompany(
      firstCompany?.name || "Intern"
    );

    setDepartment(
      firstDepartment?.name || "Allgemein"
    );

    setShowForm(false);
  }

  function openCreateForm() {
    resetForm();

    setShowForm(true);
  }

  function startEditUser(
    user: AdminUser
  ) {
    setEditingId(
      user.id
    );

    setName(
      user.name
    );

    setEmail(
      user.email
    );

    setRole(
      user.role
    );

    setStatus(
      user.status
    );

    setCompanyId(
      user.companyId || ""
    );

    setDepartmentId(
      user.departmentId || ""
    );

    setCompany(
      user.company || "Intern"
    );

    setDepartment(
      user.department || "Allgemein"
    );

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleSaveUser() {
    if (!canManageSystem()) {
      alert(
        "Du hast keine Berechtigung, Benutzer zu verwalten."
      );

      return;
    }

    if (!name.trim()) {
      alert(
        "Bitte einen Namen eingeben."
      );

      return;
    }

    if (!email.trim()) {
      alert(
        "Bitte eine E-Mail-Adresse eingeben."
      );

      return;
    }

    const selectedCompanyName =
      getCompanyName(
        companyId
      ) ||
      company.trim() ||
      "Intern";

    const selectedDepartmentName =
      getDepartmentName(
        departmentId
      ) ||
      department.trim() ||
      "Allgemein";

    const userData = {
      name:
        name.trim(),

      email:
        email.trim(),

      role,

      status,

      companyId,

      departmentId,

      company:
        selectedCompanyName,

      department:
        selectedDepartmentName,

      lastLoginAt:
        "",
    };

    if (editingId) {
      const updatedUser =
        updateAdminUser(
          editingId,
          userData
        );

      if (updatedUser) {
        saveUserUpdatedActivity(
          updatedUser
        );
      }

      resetForm();

      return;
    }

    const newUser =
      createAdminUser(
        userData
      );

    saveUserCreatedActivity(
      newUser
    );

    resetForm();
  }

  function handleDeleteUser(
    user: AdminUser
  ) {
    if (!canManageSystem()) {
      alert(
        "Du hast keine Berechtigung, Benutzer zu löschen."
      );

      return;
    }

    const confirmed =
      confirm(
        `Benutzer "${user.name}" wirklich löschen?`
      );

    if (!confirmed) {
      return;
    }

    saveUserDeletedActivity(
      user
    );

    deleteAdminUser(
      user.id
    );
  }

  function resetFilters() {
    setSearch("");

    setRoleFilter("");

    setStatusFilter("");

    setCompanyFilter("");

    setDepartmentFilter("");
  }

  function getUserCompany(
    user: AdminUser
  ) {
    return (
      user.company ||
      getCompanyName(
        user.companyId
      ) ||
      "Intern"
    );
  }

  function getUserDepartment(
    user: AdminUser
  ) {
    return (
      user.department ||
      getDepartmentName(
        user.departmentId
      ) ||
      "Allgemein"
    );
  }

  if (!mounted) {
    return null;
  }

  if (!canViewAdmin()) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/"
            className="text-zinc-500 hover:text-zinc-900 transition"
          >
            dashboard
          </Link>

          <span className="text-zinc-400">
            /
          </span>

          <Link
            href="/admin"
            className="text-zinc-500 hover:text-zinc-900 transition"
          >
            admin
          </Link>

          <span className="text-zinc-400">
            /
          </span>

          <span className="text-zinc-900">
            benutzer
          </span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-10 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center text-2xl mb-6">
            🔒
          </div>

          <h1 className="text-4xl font-bold">
            Kein Zugriff
          </h1>

          <p className="text-zinc-500 mt-3">
            Du hast mit deiner aktuellen Rolle keine Berechtigung für die Benutzerverwaltung.
          </p>
        </div>
      </div>
    );
  }

  const adminCount =
    users.filter(
      (user) =>
        user.role === "admin"
    ).length;

  const editorCount =
    users.filter(
      (user) =>
        user.role === "editor"
    ).length;

  const viewerCount =
    users.filter(
      (user) =>
        user.role === "viewer"
    ).length;

  const activeCount =
    users.filter(
      (user) =>
        user.status === "active"
    ).length;

  const filteredUsers =
    users.filter(
      (user) => {
        const query =
          search.toLowerCase();

        const userCompany =
          getUserCompany(
            user
          );

        const userDepartment =
          getUserDepartment(
            user
          );

        const matchesSearch =
          user.name
            .toLowerCase()
            .includes(query) ||
          user.email
            .toLowerCase()
            .includes(query) ||
          getAdminUserRoleLabel(
            user.role
          )
            .toLowerCase()
            .includes(query) ||
          getAdminUserStatusLabel(
            user.status
          )
            .toLowerCase()
            .includes(query) ||
          userCompany
            .toLowerCase()
            .includes(query) ||
          userDepartment
            .toLowerCase()
            .includes(query);

        const matchesRole =
          !roleFilter ||
          user.role === roleFilter;

        const matchesStatus =
          !statusFilter ||
          user.status === statusFilter;

        const matchesCompany =
          !companyFilter ||
          user.companyId === companyFilter ||
          user.company ===
            getCompanyName(
              companyFilter
            );

        const matchesDepartment =
          !departmentFilter ||
          user.departmentId === departmentFilter ||
          user.department ===
            getDepartmentName(
              departmentFilter
            );

        return (
          matchesSearch &&
          matchesRole &&
          matchesStatus &&
          matchesCompany &&
          matchesDepartment
        );
      }
    );

  return (
    <div className="space-y-8">
      {/* TOP NAV */}
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/"
          className="text-zinc-500 hover:text-zinc-900 transition"
        >
          dashboard
        </Link>

        <span className="text-zinc-400">
          /
        </span>

        <Link
          href="/admin"
          className="text-zinc-500 hover:text-zinc-900 transition"
        >
          admin
        </Link>

        <span className="text-zinc-400">
          /
        </span>

        <span className="text-zinc-900">
          benutzer
        </span>
      </div>

      {/* BACK */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zum Admin-Dashboard
        </Link>
      </div>

      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold">
            Benutzerverwaltung
          </h1>

          <p className="text-zinc-500 mt-2">
            Benutzer, Rollen, Status, Firmen und Abteilungen verwalten
          </p>
        </div>

        {canManageSystem() && (
          <button
            onClick={openCreateForm}
            className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Benutzer erstellen
          </button>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <button
          onClick={() =>
            setRoleFilter("")
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Gesamt
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {users.length}
          </h2>
        </button>

        <button
          onClick={() =>
            setRoleFilter("admin")
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-red-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Admins
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {adminCount}
          </h2>
        </button>

        <button
          onClick={() =>
            setRoleFilter("editor")
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-indigo-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Bearbeiter
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {editorCount}
          </h2>
        </button>

        <button
          onClick={() =>
            setRoleFilter("viewer")
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Leser
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {viewerCount}
          </h2>
        </button>

        <button
          onClick={() =>
            setStatusFilter("active")
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-green-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Aktiv
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {activeCount}
          </h2>
        </button>
      </div>

      {/* FORM */}
      {showForm && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">
            {editingId
              ? "Benutzer bearbeiten"
              : "Benutzer erstellen"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            <div>
              <label className="block mb-2 font-medium">
                Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Name"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                E-Mail
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="email@firma.at"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Rolle
              </label>

              <select
                value={role}
                onChange={(event) =>
                  setRole(
                    event.target.value as UserRole
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                <option value="admin">
                  Administrator
                </option>

                <option value="editor">
                  Bearbeiter
                </option>

                <option value="viewer">
                  Leser
                </option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as AdminUserStatus
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

                <option value="invited">
                  Eingeladen
                </option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Firma
              </label>

              <select
                value={companyId}
                onChange={(event) =>
                  handleCompanyChange(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                <option value="">
                  Firma auswählen
                </option>

                {getActiveCompanies().map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Abteilung
              </label>

              <select
                value={departmentId}
                onChange={(event) =>
                  handleDepartmentChange(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                <option value="">
                  Abteilung auswählen
                </option>

                {getSelectableDepartments().map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={handleSaveUser}
              className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
            >
              {editingId
                ? "Änderungen speichern"
                : "Benutzer erstellen"}
            </button>

            <button
              onClick={resetForm}
              className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* FILTER */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold">
              Suche & Filter
            </h2>

            <p className="text-zinc-500 mt-1">
              Filtere Benutzer nach Text, Rolle, Status, Firma und Abteilung.
            </p>
          </div>

          <div className="flex gap-2 bg-zinc-100 rounded-2xl p-1">
            <button
              onClick={() =>
                setViewMode("cards")
              }
              className={`px-4 py-2 rounded-xl transition ${
                viewMode === "cards"
                  ? "bg-white shadow-sm"
                  : "hover:bg-zinc-200"
              }`}
            >
              Karten
            </button>

            <button
              onClick={() =>
                setViewMode("table")
              }
              className={`px-4 py-2 rounded-xl transition ${
                viewMode === "table"
                  ? "bg-white shadow-sm"
                  : "hover:bg-zinc-200"
              }`}
            >
              Tabelle
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-5">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Nach Name, E-Mail, Rolle, Firma oder Abteilung suchen..."
            className="md:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
          />

          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(
                event.target.value
              )
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Rollen
            </option>

            <option value="admin">
              Administrator
            </option>

            <option value="editor">
              Bearbeiter
            </option>

            <option value="viewer">
              Leser
            </option>
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

            <option value="invited">
              Eingeladen
            </option>
          </select>

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
              (item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              )
            )}
          </select>

          <select
            value={departmentFilter}
            onChange={(event) =>
              setDepartmentFilter(
                event.target.value
              )
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Abteilungen
            </option>

            {departments.map(
              (item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              )
            )}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-5">
          <p className="text-sm text-zinc-500">
            {filteredUsers.length} von{" "}
            {users.length} Benutzern gefunden
          </p>

          <button
            onClick={resetFilters}
            className="text-sm bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
          >
            Filter zurücksetzen
          </button>
        </div>
      </div>

      {/* CARDS */}
      {viewMode === "cards" && (
        <div className="grid gap-4">
          {filteredUsers.length === 0 && (
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <p className="text-zinc-500">
                Keine Benutzer gefunden.
              </p>
            </div>
          )}

          {filteredUsers.map(
            (user) => {
              const userCompany =
                getUserCompany(
                  user
                );

              const userDepartment =
                getUserDepartment(
                  user
                );

              return (
                <div
                  key={user.id}
                  className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`text-xs px-3 py-1 rounded-full ${getAdminUserRoleClass(
                            user.role
                          )}`}
                        >
                          {getAdminUserRoleLabel(
                            user.role
                          )}
                        </span>

                        <span
                          className={`text-xs px-3 py-1 rounded-full ${getAdminUserStatusClass(
                            user.status
                          )}`}
                        >
                          {getAdminUserStatusLabel(
                            user.status
                          )}
                        </span>

                        <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
                          {userCompany}
                        </span>

                        <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                          {userDepartment}
                        </span>
                      </div>

                      <h2 className="text-2xl font-bold mt-4">
                        {user.name}
                      </h2>

                      <p className="text-zinc-500 mt-2">
                        {user.email}
                      </p>

                      <div className="flex flex-wrap gap-6 text-sm text-zinc-500 mt-5">
                        <p>
                          Erstellt:{" "}
                          {user.createdAt}
                        </p>

                        <p>
                          Aktualisiert:{" "}
                          {user.updatedAt}
                        </p>

                        <p>
                          Letzter Login:{" "}
                          {user.lastLoginAt ||
                            "Noch nie"}
                        </p>
                      </div>
                    </div>

                    {canManageSystem() && (
                      <div className="flex flex-wrap gap-3 justify-end shrink-0">
                        <button
                          onClick={() =>
                            startEditUser(
                              user
                            )
                          }
                          className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition"
                        >
                          Bearbeiten
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteUser(
                              user
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
              );
            }
          )}
        </div>
      )}

      {/* TABLE */}
      {viewMode === "table" && (
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-5 py-4 font-semibold">
                    Benutzer
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Rolle
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Status
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Firma
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Abteilung
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Letzter Login
                  </th>

                  <th className="px-5 py-4 font-semibold text-right">
                    Aktionen
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-8 text-zinc-500"
                    >
                      Keine Benutzer gefunden.
                    </td>
                  </tr>
                )}

                {filteredUsers.map(
                  (user) => {
                    const userCompany =
                      getUserCompany(
                        user
                      );

                    const userDepartment =
                      getUserDepartment(
                        user
                      );

                    return (
                      <tr
                        key={user.id}
                        className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                      >
                        <td className="px-5 py-4 min-w-[240px]">
                          <p className="font-semibold">
                            {user.name}
                          </p>

                          <p className="text-xs text-zinc-500 mt-1">
                            {user.email}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`text-xs px-3 py-1 rounded-full ${getAdminUserRoleClass(
                              user.role
                            )}`}
                          >
                            {getAdminUserRoleLabel(
                              user.role
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`text-xs px-3 py-1 rounded-full ${getAdminUserStatusClass(
                              user.status
                            )}`}
                          >
                            {getAdminUserStatusLabel(
                              user.status
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-zinc-600">
                          {userCompany}
                        </td>

                        <td className="px-5 py-4 text-zinc-600">
                          {userDepartment}
                        </td>

                        <td className="px-5 py-4 text-zinc-500 whitespace-nowrap">
                          {user.lastLoginAt ||
                            "Noch nie"}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {canManageSystem() && (
                              <>
                                <button
                                  onClick={() =>
                                    startEditUser(
                                      user
                                    )
                                  }
                                  className="bg-zinc-900 text-white px-3 py-2 rounded-xl hover:bg-zinc-700 transition"
                                >
                                  Bearbeiten
                                </button>

                                <button
                                  onClick={() =>
                                    handleDeleteUser(
                                      user
                                    )
                                  }
                                  className="bg-red-600 text-white px-3 py-2 rounded-xl hover:bg-red-500 transition"
                                >
                                  Löschen
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}