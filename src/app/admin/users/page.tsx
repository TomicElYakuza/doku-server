"use client";

import Link from "next/link";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  adminUserRepository,
} from "../../../lib/adminUserRepository";

import {
  companyRepository,
} from "../../../lib/companyRepository";

import {
  canManageUsers,
  canViewAdmin,
} from "../../../lib/permissions";

import {
  saveUserCreatedActivity,
  saveUserDeletedActivity,
  saveUserUpdatedActivity,
} from "../../../lib/userActivityHelpers";

import AccessDeniedCard from "../../../components/AccessDeniedCard";

import type {
  AdminUser,
  AdminUserStatus,
  UserRole,
} from "../../../types/user";

import type {
  Company,
  Department,
} from "../../../types/company";

function getRoleLabel(
  role: UserRole | string
) {
  return adminUserRepository.getRoleLabel(
    role
  );
}

function getRoleClass(
  role: UserRole | string
) {
  return adminUserRepository.getRoleClass(
    role
  );
}

function getStatusLabel(
  status: AdminUserStatus | string
) {
  return adminUserRepository.getStatusLabel(
    status
  );
}

function getStatusClass(
  status: AdminUserStatus | string
) {
  return adminUserRepository.getStatusClass(
    status
  );
}

function buildUsernameFromEmail(
  email: string
) {
  return email
    .split("@")[0]
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".");
}

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

  const [showForm, setShowForm] =
    useState(false);

  const [editingUserId, setEditingUserId] =
    useState("");

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [passwordMustChange, setPasswordMustChange] =
    useState(true);

  const [role, setRole] =
    useState<UserRole>("employee");

  const [status, setStatus] =
    useState<AdminUserStatus>("active");

  const [companyId, setCompanyId] =
    useState("");

  const [departmentId, setDepartmentId] =
    useState("");

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

    function handleAdminUsersUpdated() {
      void loadData();
    }

    function handleCompaniesUpdated() {
      void loadOrganization();
    }

    function handleDepartmentsUpdated() {
      void loadOrganization();
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

  async function loadOrganization() {
    try {
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
        "Organisation konnte nicht geladen werden:",
        loadError
      );
    }
  }

  async function loadData() {
    try {
      setLoading(
        true
      );

      setError(
        ""
      );

      const [
        nextUsers,
        nextCompanies,
        nextDepartments,
      ] =
        await Promise.all([
          adminUserRepository.list(),
          companyRepository.listCompanies(),
          companyRepository.listDepartments(),
        ]);

      setUsers(
        nextUsers
      );

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
          : "Benutzer konnten nicht geladen werden."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  function resetForm() {
    setEditingUserId("");
    setName("");
    setEmail("");
    setUsername("");
    setPassword("");
    setPasswordMustChange(true);
    setRole("employee");
    setStatus("active");
    setCompanyId("");
    setDepartmentId("");
    setShowForm(false);
  }

  function openCreateForm() {
    resetForm();

    const firstCompany =
      companies[0];

    const firstDepartment =
      departments.find(
        (department) =>
          department.companyId === firstCompany?.id
      );

    setCompanyId(
      firstCompany?.id ||
        ""
    );

    setDepartmentId(
      firstDepartment?.id ||
        ""
    );

    setShowForm(true);
  }

  function startEditUser(
    user: AdminUser
  ) {
    setEditingUserId(
      user.id
    );

    setName(
      user.name
    );

    setEmail(
      user.email
    );

    setUsername(
      user.username ||
        buildUsernameFromEmail(
          user.email
        )
    );

    setPassword("");

    setPasswordMustChange(
      Boolean(
        user.passwordMustChange
      )
    );

    setRole(
      user.role
    );

    setStatus(
      user.status
    );

    setCompanyId(
      user.companyId ||
        ""
    );

    setDepartmentId(
      user.departmentId ||
        ""
    );

    setShowForm(true);

    window.scrollTo({
      top:
        0,

      behavior:
        "smooth",
    });
  }

  function getCompanyName(
    id?: string
  ) {
    if (!id) {
      return "Intern";
    }

    return (
      companies.find(
        (company) =>
          company.id === id
      )?.name ||
      "Intern"
    );
  }

  function getDepartmentName(
    id?: string
  ) {
    if (!id) {
      return "Allgemein";
    }

    return (
      departments.find(
        (department) =>
          department.id === id
      )?.name ||
      "Allgemein"
    );
  }

  const departmentOptions =
    useMemo(
      () => {
        if (!companyId) {
          return departments;
        }

        return departments.filter(
          (department) =>
            department.companyId === companyId
        );
      },
      [
        departments,
        companyId,
      ]
    );

  const filteredDepartments =
    useMemo(
      () => {
        if (!companyFilter) {
          return departments;
        }

        return departments.filter(
          (department) =>
            department.companyId === companyFilter
        );
      },
      [
        departments,
        companyFilter,
      ]
    );

  const filteredUsers =
    useMemo(
      () => {
        const query =
          search.trim().toLowerCase();

        return users.filter(
          (user) => {
            const companyName =
              getCompanyName(
                user.companyId
              );

            const departmentName =
              getDepartmentName(
                user.departmentId
              );

            const matchesSearch =
              !query ||
              [
                user.name,
                user.email,
                user.username,
                user.role,
                user.status,
                user.company,
                user.department,
                companyName,
                departmentName,
                user.hasPassword
                  ? "passwort gesetzt"
                  : "kein passwort",
                user.passwordMustChange
                  ? "passwort ändern"
                  : "",
                user.createdAt,
                user.updatedAt,
                user.lastLoginAt,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(
                  query
                );

            const matchesRole =
              !roleFilter ||
              user.role === roleFilter;

            const matchesStatus =
              !statusFilter ||
              user.status === statusFilter;

            const matchesCompany =
              !companyFilter ||
              user.companyId === companyFilter;

            const matchesDepartment =
              !departmentFilter ||
              user.departmentId === departmentFilter;

            return (
              matchesSearch &&
              matchesRole &&
              matchesStatus &&
              matchesCompany &&
              matchesDepartment
            );
          }
        );
      },
      [
        users,
        search,
        roleFilter,
        statusFilter,
        companyFilter,
        departmentFilter,
        companies,
        departments,
      ]
    );

  const activeUsers =
    users.filter(
      (user) =>
        user.status === "active"
    );

  const adminUsers =
    users.filter(
      (user) =>
        user.role === "admin"
    );

  const departmentLeadUsers =
    users.filter(
      (user) =>
        user.role === "department_lead"
    );

  const passwordResetUsers =
    users.filter(
      (user) =>
        user.passwordMustChange
    );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!canManageUsers()) {
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
        "Bitte eine E-Mail eingeben."
      );

      return;
    }

    if (!username.trim()) {
      alert(
        "Bitte einen Benutzernamen eingeben."
      );

      return;
    }

    if (
      !editingUserId &&
      !password.trim()
    ) {
      alert(
        "Bitte ein vordefiniertes Passwort eingeben."
      );

      return;
    }

    const companyName =
      getCompanyName(
        companyId
      );

    const departmentName =
      getDepartmentName(
        departmentId
      );

    try {
      setSaving(
        true
      );

      if (editingUserId) {
        const updatedUser =
          await adminUserRepository.update(
            editingUserId,
            {
              name:
                name.trim(),

              email:
                email.trim().toLowerCase(),

              username:
                username.trim().toLowerCase(),

              ...(password.trim()
                ? {
                    password:
                      password.trim(),
                  }
                : {}),

              passwordMustChange,

              role,

              status,

              companyId,

              departmentId,

              company:
                companyName,

              department:
                departmentName,
            }
          );

        if (updatedUser) {
          saveUserUpdatedActivity(
            updatedUser
          );
        }

        resetForm();

        await loadData();

        return;
      }

      const createdUser =
        await adminUserRepository.create({
          name:
            name.trim(),

          email:
            email.trim().toLowerCase(),

          username:
            username.trim().toLowerCase(),

          password:
            password.trim(),

          passwordMustChange,

          role,

          status,

          companyId,

          departmentId,

          company:
            companyName,

          department:
            departmentName,
        });

      saveUserCreatedActivity(
        createdUser
      );

      resetForm();

      await loadData();
    } catch (saveError) {
      console.error(
        saveError
      );

      alert(
        saveError instanceof Error
          ? saveError.message
          : "Benutzer konnte nicht gespeichert werden."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  async function handleDeleteUser(
    user: AdminUser
  ) {
    if (!canManageUsers()) {
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

    try {
      saveUserDeletedActivity(
        user
      );

      await adminUserRepository.delete(
        user.id
      );

      await loadData();
    } catch (deleteError) {
      console.error(
        deleteError
      );

      alert(
        deleteError instanceof Error
          ? deleteError.message
          : "Benutzer konnte nicht gelöscht werden."
      );
    }
  }

  function resetFilters() {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setCompanyFilter("");
    setDepartmentFilter("");
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
            Benutzerverwaltung
          </h1>

          <p className="text-zinc-500 mt-2">
            Benutzer, Login-Daten, Rollen, Status und Organisation aus PostgreSQL verwalten.
          </p>
        </div>

        {canManageUsers() && (
          <button
            type="button"
            onClick={openCreateForm}
            className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Benutzer erstellen
          </button>
        )}
      </div>

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Benutzer werden geladen...
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <button
          type="button"
          onClick={resetFilters}
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Benutzer gesamt
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {users.length}
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
            Aktiv
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {activeUsers.length}
          </h2>
        </button>

        <button
          type="button"
          onClick={() =>
            setRoleFilter(
              "admin"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-red-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Administratoren
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {adminUsers.length}
          </h2>
        </button>

        <button
          type="button"
          onClick={() =>
            setSearch(
              "passwort ändern"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-orange-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Passwort ändern
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {passwordResetUsers.length}
          </h2>

          <p className="text-sm text-zinc-400 mt-2">
            {departmentLeadUsers.length} Abteilungsleiter
          </p>
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(event) =>
            void handleSubmit(
              event
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm space-y-6"
        >
          <div>
            <h2 className="text-2xl font-semibold">
              {editingUserId
                ? "Benutzer bearbeiten"
                : "Benutzer erstellen"}
            </h2>

            <p className="text-zinc-500 mt-1">
              Account wird direkt in PostgreSQL gespeichert.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block mb-2 font-medium">
                Name
              </label>

              <input
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Max Mustermann"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                E-Mail
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => {
                  const nextEmail =
                    event.target.value;

                  setEmail(
                    nextEmail
                  );

                  if (!editingUserId && !username) {
                    setUsername(
                      buildUsernameFromEmail(
                        nextEmail
                      )
                    );
                  }
                }}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="max@firma.local"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Benutzername
              </label>

              <input
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="max.mustermann"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                {editingUserId
                  ? "Neues Passwort setzen"
                  : "Vordefiniertes Passwort"}
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder={
                  editingUserId
                    ? "Leer lassen = unverändert"
                    : "Startpasswort"
                }
              />
            </div>

            <label className="md:col-span-2 flex items-center justify-between gap-5 bg-zinc-50 rounded-2xl p-5">
              <span>
                <span className="block font-medium">
                  Passwort bei nächster Anmeldung ändern
                </span>

                <span className="block text-sm text-zinc-500 mt-1">
                  AD-ähnlich: Der Benutzer muss nach dem ersten Login oder Passwort-Reset ein neues Passwort vergeben.
                </span>
              </span>

              <input
                type="checkbox"
                checked={passwordMustChange}
                onChange={(event) =>
                  setPasswordMustChange(
                    event.target.checked
                  )
                }
                className="h-5 w-5"
              />
            </label>

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
                <option value="employee">
                  Mitarbeiter
                </option>

                <option value="department_lead">
                  Abteilungsleiter
                </option>

                <option value="admin">
                  Administrator
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

                <option value="invited">
                  Eingeladen
                </option>

                <option value="inactive">
                  Inaktiv
                </option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Firma
              </label>

              <select
                value={companyId}
                onChange={(event) => {
                  const nextCompanyId =
                    event.target.value;

                  setCompanyId(
                    nextCompanyId
                  );

                  const firstDepartment =
                    departments.find(
                      (department) =>
                        department.companyId === nextCompanyId
                    );

                  setDepartmentId(
                    firstDepartment?.id ||
                      ""
                  );
                }}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                <option value="">
                  Keine Firma
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
                Abteilung
              </label>

              <select
                value={departmentId}
                onChange={(event) =>
                  setDepartmentId(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                <option value="">
                  Keine Abteilung
                </option>

                {departmentOptions.map(
                  (department) => (
                    <option
                      key={department.id}
                      value={department.id}
                    >
                      {department.name}
                    </option>
                  )
                )}
              </select>
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
                : editingUserId
                  ? "Änderungen speichern"
                  : "Benutzer erstellen"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-5">
          <div>
            <h2 className="text-xl font-semibold">
              Suche & Filter
            </h2>

            <p className="text-zinc-500 mt-1">
              Suche nach Benutzername, E-Mail, Rolle, Status oder Organisation.
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mt-5">
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            className="xl:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
            placeholder="Benutzer suchen..."
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

            <option value="department_lead">
              Abteilungsleiter
            </option>

            <option value="employee">
              Mitarbeiter
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

            <option value="invited">
              Eingeladen
            </option>

            <option value="inactive">
              Inaktiv
            </option>
          </select>

          <select
            value={companyFilter}
            onChange={(event) => {
              setCompanyFilter(
                event.target.value
              );

              setDepartmentFilter(
                ""
              );
            }}
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

            {filteredDepartments.map(
              (department) => (
                <option
                  key={department.id}
                  value={department.id}
                >
                  {department.name}
                </option>
              )
            )}
          </select>
        </div>

        <p className="text-sm text-zinc-500 mt-5">
          {filteredUsers.length} von {users.length} Benutzern gefunden.
        </p>
      </div>

      <div className="space-y-4">
        {filteredUsers.length === 0 && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold">
              Keine Benutzer gefunden
            </h2>

            <p className="text-zinc-500 mt-2">
              Passe die Filter an oder erstelle einen neuen Benutzer.
            </p>
          </div>
        )}

        {filteredUsers.map(
          (user) => (
            <div
              key={user.id}
              className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full ${getRoleClass(user.role)}`}>
                      {getRoleLabel(
                        user.role
                      )}
                    </span>

                    <span className={`text-xs px-3 py-1 rounded-full ${getStatusClass(user.status)}`}>
                      {getStatusLabel(
                        user.status
                      )}
                    </span>

                    {user.hasPassword ? (
                      <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full">
                        Passwort gesetzt
                      </span>
                    ) : (
                      <span className="text-xs bg-red-50 text-red-700 px-3 py-1 rounded-full">
                        Kein Passwort
                      </span>
                    )}

                    {user.passwordMustChange && (
                      <span className="text-xs bg-orange-50 text-orange-700 px-3 py-1 rounded-full">
                        Passwort ändern
                      </span>
                    )}

                    <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                      {getCompanyName(
                        user.companyId
                      )}
                    </span>

                    <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                      {getDepartmentName(
                        user.departmentId
                      )}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold mt-4">
                    {user.name}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-zinc-500 mt-2">
                    <p>
                      E-Mail:{" "}
                      {user.email}
                    </p>

                    <p>
                      Benutzername:{" "}
                      <span className="font-medium text-zinc-700">
                        {user.username ||
                          "-"}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-5 text-sm text-zinc-400 mt-5">
                    <span>
                      Erstellt:{" "}
                      {user.createdAt}
                    </span>

                    <span>
                      Aktualisiert:{" "}
                      {user.updatedAt}
                    </span>

                    <span>
                      Letzter Login:{" "}
                      {user.lastLoginAt ||
                        "Noch nie"}
                    </span>
                  </div>
                </div>

                {canManageUsers() && (
                  <div className="flex flex-wrap gap-3 shrink-0">
                    <button
                      type="button"
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
                      type="button"
                      onClick={() =>
                        void handleDeleteUser(
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
          )
        )}
      </div>
    </div>
  );
}