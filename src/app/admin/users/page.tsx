"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import AccessDeniedCard from "../../../components/AccessDeniedCard";
import AppModal from "../../../components/AppModal";
import EmptyState from "../../../components/EmptyState";
import LoadingState from "../../../components/LoadingState";
import PageHero from "../../../components/PageHero";
import StatCard from "../../../components/StatCard";
import {
  useAppSettings,
} from "../../../hooks/useAppSettings";
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
  rolePermissionTemplateRepository,
} from "../../../lib/rolePermissionTemplateRepository";
import {
  saveUserCreatedActivity,
  saveUserDeletedActivity,
  saveUserUpdatedActivity,
} from "../../../lib/userActivityHelpers";
import type {
  Company,
  Department,
} from "../../../types/company";
import type {
  RolePermissionTemplate,
} from "../../../types/rolePermissionTemplate";
import type {
  AdminUser,
  AdminUserStatus,
  UserRole,
} from "../../../types/user";

type RoleOption = {
  value: UserRole;
  label: string;
  description: string;
};

type StatusOption = {
  value: AdminUserStatus;
  label: string;
  description: string;
};

type ViewMode = "table" | "cards";

const roleOptions: RoleOption[] = [
  {
    value: "employee",
    label: "Mitarbeiter",
    description:
      "Standardrolle. Rechte kommen über Firma, Abteilung oder Einzelrechte.",
  },
  {
    value: "department_lead",
    label: "Abteilungsleiter",
    description:
      "Kann Inhalte der eigenen Abteilung verwalten.",
  },
  {
    value: "admin",
    label: "Administrator",
    description:
      "Vollzugriff auf System, Admin Backend und alle Daten.",
  },
];

const statusOptions: StatusOption[] = [
  {
    value: "active",
    label: "Aktiv",
    description: "Benutzer kann sich anmelden.",
  },
  {
    value: "invited",
    label: "Eingeladen",
    description:
      "Benutzer ist vorbereitet, aber noch nicht vollständig aktiv.",
  },
  {
    value: "inactive",
    label: "Inaktiv",
    description: "Benutzer ist gesperrt.",
  },
];

function getRoleLabel(role: UserRole | string) {
  return adminUserRepository.getRoleLabel(role);
}

function getStatusLabel(status: AdminUserStatus | string) {
  return adminUserRepository.getStatusLabel(status);
}

function buildUsernameFromEmail(email: string) {
  return email
    .split("@")[0]
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".");
}

function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".");
}

function normalizeDefaultUserRole(value?: string): UserRole {
  if (value === "admin") {
    return "admin";
  }

  if (value === "department_lead") {
    return "department_lead";
  }

  return "employee";
}

function getRoleTone(role: string) {
  if (role === "admin") {
    return "bg-red-50 text-red-700 border-red-100";
  }

  if (role === "department_lead") {
    return "bg-indigo-50 text-indigo-700 border-indigo-100";
  }

  return "bg-blue-50 text-blue-700 border-blue-100";
}

function getStatusTone(status: string) {
  if (status === "active") {
    return "bg-green-50 text-green-700 border-green-100";
  }

  if (status === "invited") {
    return "bg-orange-50 text-orange-700 border-orange-100";
  }

  return "bg-zinc-100 text-zinc-600 border-zinc-200";
}

export default function AdminUsersPage() {
  const {
    settings: appSettings,
  } = useAppSettings();

  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roleTemplates, setRoleTemplates] = useState<RolePermissionTemplate[]>(
    [],
  );

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState("");
  const [selectedTemplateKey, setSelectedTemplateKey] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordMustChange, setPasswordMustChange] = useState(true);
  const [role, setRole] = useState<UserRole>("employee");
  const [status, setStatus] = useState<AdminUserStatus>("active");
  const [companyId, setCompanyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMounted(true);
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

    function handleRoleTemplatesUpdated() {
      void loadRoleTemplates();
    }

    window.addEventListener(
      "adminUsersUpdated",
      handleAdminUsersUpdated,
    );

    window.addEventListener(
      "companiesUpdated",
      handleCompaniesUpdated,
    );

    window.addEventListener(
      "departmentsUpdated",
      handleDepartmentsUpdated,
    );

    window.addEventListener(
      "rolePermissionTemplatesUpdated",
      handleRoleTemplatesUpdated,
    );

    return () => {
      window.removeEventListener(
        "adminUsersUpdated",
        handleAdminUsersUpdated,
      );

      window.removeEventListener(
        "companiesUpdated",
        handleCompaniesUpdated,
      );

      window.removeEventListener(
        "departmentsUpdated",
        handleDepartmentsUpdated,
      );

      window.removeEventListener(
        "rolePermissionTemplatesUpdated",
        handleRoleTemplatesUpdated,
      );
    };
  }, []);

  async function loadOrganization() {
    try {
      const [
        nextCompanies,
        nextDepartments,
      ] = await Promise.all([
        companyRepository.listCompanies(),
        companyRepository.listDepartments(),
      ]);

      setCompanies(Array.isArray(nextCompanies) ? nextCompanies : []);
      setDepartments(
        Array.isArray(nextDepartments) ? nextDepartments : [],
      );
    } catch (loadError) {
      console.error(
        "Organisation konnte nicht geladen werden:",
        loadError,
      );
    }
  }

  async function loadRoleTemplates() {
    try {
      const nextTemplates =
        await rolePermissionTemplateRepository.listActive();

      setRoleTemplates(
        Array.isArray(nextTemplates) ? nextTemplates : [],
      );
    } catch (loadError) {
      console.error(
        "Rollen-Vorlagen konnten nicht geladen werden:",
        loadError,
      );
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        nextUsers,
        nextCompanies,
        nextDepartments,
        nextRoleTemplates,
      ] = await Promise.all([
        adminUserRepository.list(),
        companyRepository.listCompanies(),
        companyRepository.listDepartments(),
        rolePermissionTemplateRepository.listActive(),
      ]);

      setUsers(Array.isArray(nextUsers) ? nextUsers : []);
      setCompanies(Array.isArray(nextCompanies) ? nextCompanies : []);
      setDepartments(
        Array.isArray(nextDepartments) ? nextDepartments : [],
      );
      setRoleTemplates(
        Array.isArray(nextRoleTemplates) ? nextRoleTemplates : [],
      );
    } catch (loadError) {
      console.error(loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Benutzer konnten nicht geladen werden.",
      );
    } finally {
      setLoading(false);
    }
  }

  function getCompanyName(id?: string) {
    if (!id) {
      return "Intern";
    }

    return (
      companies.find((company) => company.id === id)?.name ||
      "Intern"
    );
  }

  function getDepartmentName(id?: string) {
    if (!id) {
      return "Keine Abteilung";
    }

    return (
      departments.find((department) => department.id === id)?.name ||
      "Keine Abteilung"
    );
  }

  const activeCompanies = useMemo(
    () => companies.filter((company) => company.status === "active"),
    [
      companies,
    ],
  );

  const activeDepartments = useMemo(
    () =>
      departments.filter(
        (department) => department.status === "active",
      ),
    [
      departments,
    ],
  );

  const departmentOptions = useMemo(() => {
    const source =
      activeDepartments.length > 0
        ? activeDepartments
        : departments;

    if (!companyId) {
      return source;
    }

    return source.filter(
      (department) => department.companyId === companyId,
    );
  }, [
    activeDepartments,
    departments,
    companyId,
  ]);

  const filteredDepartments = useMemo(() => {
    if (!companyFilter) {
      return departments;
    }

    return departments.filter(
      (department) => department.companyId === companyFilter,
    );
  }, [
    departments,
    companyFilter,
  ]);

  const filteredUsers = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return users.filter((user) => {
      const companyName = getCompanyName(user.companyId);
      const departmentName = getDepartmentName(user.departmentId);

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
          user.hasPassword ? "passwort gesetzt" : "kein passwort",
          user.passwordMustChange ? "passwort ändern" : "",
          user.createdAt,
          user.updatedAt,
          user.lastLoginAt,
        ]
          .filter(Boolean)
          .join(" ")
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
    });
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
    companyFilter,
    departmentFilter,
    companies,
    departments,
  ]);

  const activeUsers = useMemo(
    () => users.filter((user) => user.status === "active"),
    [
      users,
    ],
  );

  const inactiveUsers = useMemo(
    () => users.filter((user) => user.status === "inactive"),
    [
      users,
    ],
  );

  const invitedUsers = useMemo(
    () => users.filter((user) => user.status === "invited"),
    [
      users,
    ],
  );

  const adminUsers = useMemo(
    () => users.filter((user) => user.role === "admin"),
    [
      users,
    ],
  );

  const departmentLeadUsers = useMemo(
    () => users.filter((user) => user.role === "department_lead"),
    [
      users,
    ],
  );

  const employeeUsers = useMemo(
    () => users.filter((user) => user.role === "employee"),
    [
      users,
    ],
  );

  const passwordResetUsers = useMemo(
    () => users.filter((user) => user.passwordMustChange),
    [
      users,
    ],
  );

  const selectedTemplate = useMemo(
    () =>
      roleTemplates.find(
        (template) => template.key === selectedTemplateKey,
      ) || null,
    [
      roleTemplates,
      selectedTemplateKey,
    ],
  );

  function setAuthorDefaults() {
    setRole(normalizeDefaultUserRole(appSettings.defaultUserRole));
  }

  function resetForm() {
    setEditingUserId("");
    setSelectedTemplateKey("");
    setName("");
    setEmail("");
    setUsername("");
    setPassword("");
    setPasswordMustChange(true);
    setRole(normalizeDefaultUserRole(appSettings.defaultUserRole));
    setStatus("active");
    setCompanyId("");
    setDepartmentId("");
  }

  function closeModal() {
    setModalOpen(false);
    resetForm();
  }

  function openCreateForm() {
    if (!canManageUsers()) {
      alert("Du hast keine Berechtigung, Benutzer zu erstellen.");
      return;
    }

    resetForm();

    const firstCompany = activeCompanies[0] || companies[0];
    const firstDepartment =
      departments.find(
        (department) =>
          department.companyId === firstCompany?.id &&
          department.status === "active",
      ) ||
      departments.find(
        (department) => department.companyId === firstCompany?.id,
      ) ||
      departments[0];

    setCompanyId(firstCompany?.id || "");
    setDepartmentId(firstDepartment?.id || "");
    setAuthorDefaults();
    setModalOpen(true);
  }

  function startEditUser(user: AdminUser) {
    if (!canManageUsers()) {
      alert("Du hast keine Berechtigung, Benutzer zu bearbeiten.");
      return;
    }

    setEditingUserId(user.id);
    setSelectedTemplateKey("");
    setName(user.name);
    setEmail(user.email);
    setUsername(user.username || buildUsernameFromEmail(user.email));
    setPassword("");
    setPasswordMustChange(Boolean(user.passwordMustChange));
    setRole(user.role);
    setStatus(user.status);
    setCompanyId(user.companyId || "");
    setDepartmentId(user.departmentId || "");
    setModalOpen(true);
  }

  function handleRoleTemplateChange(templateKey: string) {
    setSelectedTemplateKey(templateKey);

    const template = roleTemplates.find(
      (item) => item.key === templateKey,
    );

    if (!template) {
      return;
    }

    setRole(normalizeDefaultUserRole(String(template.roleKey)));
  }

  function handleRoleChange(nextRole: UserRole) {
    setSelectedTemplateKey("");
    setRole(nextRole);
  }

  function handleCompanyChange(nextCompanyId: string) {
    setCompanyId(nextCompanyId);

    const firstDepartment =
      departments.find(
        (department) =>
          department.companyId === nextCompanyId &&
          department.status === "active",
      ) ||
      departments.find(
        (department) => department.companyId === nextCompanyId,
      );

    setDepartmentId(firstDepartment?.id || "");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!canManageUsers()) {
      alert("Du hast keine Berechtigung, Benutzer zu verwalten.");
      return;
    }

    if (!name.trim()) {
      alert("Bitte einen Namen eingeben.");
      return;
    }

    if (!email.trim()) {
      alert("Bitte eine E-Mail eingeben.");
      return;
    }

    if (!username.trim()) {
      alert("Bitte einen Benutzernamen eingeben.");
      return;
    }

    if (!editingUserId && !password.trim()) {
      alert("Bitte ein vordefiniertes Passwort eingeben.");
      return;
    }

    const companyName = getCompanyName(companyId);
    const departmentName = departmentId
      ? getDepartmentName(departmentId)
      : "";

    try {
      setSaving(true);
      setMessage("");
      setError("");

      if (editingUserId) {
        const updatedUser = await adminUserRepository.update(
          editingUserId,
          {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            username: normalizeUsername(username),
            ...(password.trim()
              ? {
                  password: password.trim(),
                }
              : {}),
            passwordMustChange,
            role,
            status,
            companyId,
            departmentId,
            company: companyName,
            department: departmentName,
          },
        );

        if (updatedUser) {
          if (selectedTemplateKey) {
            await rolePermissionTemplateRepository.applyToUser(
              updatedUser.id,
              selectedTemplateKey,
              true,
            );
          }

          saveUserUpdatedActivity(updatedUser);
        }

        closeModal();
        await loadData();

        setMessage(
          selectedTemplateKey
            ? "Benutzer wurde aktualisiert und Rollen-Vorlage wurde angewendet."
            : "Benutzer wurde aktualisiert.",
        );

        return;
      }

      const createdUser = await adminUserRepository.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        username: normalizeUsername(username),
        password: password.trim(),
        passwordMustChange,
        role,
        status,
        companyId,
        departmentId,
        company: companyName,
        department: departmentName,
      });

      if (selectedTemplateKey) {
        await rolePermissionTemplateRepository.applyToUser(
          createdUser.id,
          selectedTemplateKey,
          true,
        );
      }

      saveUserCreatedActivity(createdUser);

      closeModal();
      await loadData();

      setMessage(
        selectedTemplateKey
          ? "Benutzer wurde erstellt und Rollen-Vorlage wurde angewendet."
          : "Benutzer wurde erstellt.",
      );
    } catch (saveError) {
      console.error(saveError);

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Benutzer konnte nicht gespeichert werden.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteUser(user: AdminUser) {
    if (!canManageUsers()) {
      alert("Du hast keine Berechtigung, Benutzer zu löschen.");
      return;
    }

    const confirmed = confirm(
      `Benutzer "${user.name}" wirklich löschen?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setError("");

      saveUserDeletedActivity(user);

      await adminUserRepository.delete(user.id);
      await loadData();

      setMessage("Benutzer wurde gelöscht.");
    } catch (deleteError) {
      console.error(deleteError);

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Benutzer konnte nicht gelöscht werden.",
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
      <AccessDeniedCard
        title="Benutzerverwaltung nicht verfügbar"
        description="Du hast keine Berechtigung, Benutzer zu verwalten."
        backHref="/admin"
        backLabel="Zurück zum Admin Dashboard"
      />
    );
  }

  return (
    <div className="space-y-8">
      <AppModal
        open={modalOpen}
        onClose={closeModal}
        title={editingUserId ? "Benutzer bearbeiten" : "Benutzer erstellen"}
        description="Lege Benutzerkonten, Rollen, Organisation und Startpasswort zentral fest."
        size="2xl"
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="bg-zinc-100 text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-200 transition disabled:opacity-50 font-bold"
            >
              Abbrechen
            </button>

            <button
              type="submit"
              form="user-form"
              disabled={saving}
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition disabled:opacity-50 font-bold app-brand-shadow"
            >
              {saving
                ? "Speichert..."
                : editingUserId
                  ? "Änderungen speichern"
                  : "Benutzer erstellen"}
            </button>
          </>
        }
      >
        <form
          id="user-form"
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-8"
        >
          <section className="bg-zinc-50 border border-zinc-100 rounded-3xl p-5">
            <h3 className="text-xl font-black">
              Login & Konto
            </h3>

            <p className="text-zinc-500 mt-1">
              Grunddaten für Anmeldung und Passwort.
            </p>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-5">
              <div>
                <label className="block mb-2 font-bold">
                  Name
                </label>

                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="Max Mustermann"
                />
              </div>

              <div>
                <label className="block mb-2 font-bold">
                  E-Mail
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    const nextEmail = event.target.value;

                    setEmail(nextEmail);

                    if (!editingUserId && !username) {
                      setUsername(buildUsernameFromEmail(nextEmail));
                    }
                  }}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="max@firma.local"
                />
              </div>

              <div>
                <label className="block mb-2 font-bold">
                  Benutzername
                </label>

                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="max.mustermann"
                />
              </div>

              <div>
                <label className="block mb-2 font-bold">
                  {editingUserId
                    ? "Neues Passwort setzen"
                    : "Vordefiniertes Passwort"}
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder={
                    editingUserId
                      ? "Leer lassen = unverändert"
                      : "Startpasswort"
                  }
                />
              </div>

              <label className="xl:col-span-2 flex items-start gap-3 bg-white border border-zinc-200 rounded-2xl p-4">
                <input
                  type="checkbox"
                  checked={passwordMustChange}
                  onChange={(event) =>
                    setPasswordMustChange(event.target.checked)
                  }
                  className="h-5 w-5 mt-1 accent-indigo-600"
                />

                <span>
                  <span className="block font-bold">
                    Passwort bei nächster Anmeldung ändern
                  </span>
                  <span className="block text-zinc-500 text-sm mt-1">
                    Der Benutzer muss nach dem ersten Login oder Passwort-Reset ein neues Passwort vergeben.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <section className="bg-zinc-50 border border-zinc-100 rounded-3xl p-5">
            <h3 className="text-xl font-black">
              Rolle & Status
            </h3>

            <p className="text-zinc-500 mt-1">
              Die Rolle legt die Grundhierarchie fest. Rollen-Vorlagen setzen zusätzlich globale Benutzerrechte.
            </p>

            <div className="mt-5">
              <label className="block mb-2 font-bold">
                Rollen-Vorlage
              </label>

              <select
                value={selectedTemplateKey}
                onChange={(event) =>
                  handleRoleTemplateChange(event.target.value)
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
              >
                <option value="">
                  Keine Vorlage auswählen
                </option>

                {roleTemplates.map((template) => (
                  <option
                    key={template.key}
                    value={template.key}
                  >
                    {template.name} · {getRoleLabel(String(template.roleKey))}
                  </option>
                ))}
              </select>

              {selectedTemplate && (
                <div className="bg-white border border-zinc-200 rounded-3xl p-5 mt-4">
                  <h4 className="font-black text-zinc-950">
                    {selectedTemplate.name}
                  </h4>

                  <p className="text-zinc-500 mt-1">
                    {selectedTemplate.description || "Keine Beschreibung"}
                  </p>

                  <p className="text-sm font-bold mt-4">
                    {selectedTemplate.permissionKeys.length} Rechte
                  </p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedTemplate.permissionKeys
                      .slice(0, 10)
                      .map((permission) => (
                        <span
                          key={permission}
                          className="text-xs bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full"
                        >
                          {permission}
                        </span>
                      ))}

                    {selectedTemplate.permissionKeys.length > 10 && (
                      <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
                        +{selectedTemplate.permissionKeys.length - 10}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-zinc-500 mt-4">
                    Beim Speichern wird die Rolle gesetzt und die globalen Benutzerrechte werden aus dieser Vorlage neu geschrieben.
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-5">
              {roleOptions.map((option) => {
                const active = role === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleRoleChange(option.value)}
                    className={`text-left border rounded-3xl p-5 transition ${
                      active
                        ? "app-accent-bg text-white app-brand-shadow border-transparent"
                        : "border-zinc-200 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <h4 className="font-black">
                      {option.label}
                    </h4>

                    <p
                      className={`text-sm mt-2 ${
                        active ? "text-white/70" : "text-zinc-500"
                      }`}
                    >
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-5">
              {statusOptions.map((option) => {
                const active = status === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value)}
                    className={`text-left border rounded-3xl p-5 transition ${
                      active
                        ? "app-accent-bg text-white border-transparent app-brand-shadow"
                        : "border-zinc-200 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <h4 className="font-black">
                      {option.label}
                    </h4>

                    <p
                      className={`text-sm mt-2 ${
                        active ? "text-white/70" : "text-zinc-500"
                      }`}
                    >
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="bg-zinc-50 border border-zinc-100 rounded-3xl p-5">
            <h3 className="text-xl font-black">
              Organisation
            </h3>

            <p className="text-zinc-500 mt-1">
              Firma und Abteilung bestimmen, welche Bereichsdaten der Benutzer sieht.
            </p>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-5">
              <div>
                <label className="block mb-2 font-bold">
                  Firma
                </label>

                <select
                  value={companyId}
                  onChange={(event) =>
                    handleCompanyChange(event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  <option value="">
                    Keine Firma
                  </option>

                  {(activeCompanies.length > 0
                    ? activeCompanies
                    : companies
                  ).map((company) => (
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
                <label className="block mb-2 font-bold">
                  Abteilung
                </label>

                <select
                  value={departmentId}
                  onChange={(event) =>
                    setDepartmentId(event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  <option value="">
                    Keine Abteilung
                  </option>

                  {departmentOptions.map((department) => (
                    <option
                      key={department.id}
                      value={department.id}
                    >
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        </form>
      </AppModal>

      <PageHero
        eyebrow="Velunis Admin"
        title="Benutzer"
        description="Benutzerkonten, Rollen, Status, Organisation und Passwortvorgaben zentral verwalten."
        badges={[
          {
            label: `${users.length} Benutzer`,
          },
          {
            label: `${activeUsers.length} aktiv`,
          },
          {
            label: `${adminUsers.length} Admins`,
          },
          {
            label: `${passwordResetUsers.length} Passwortwechsel offen`,
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

            {canManageUsers() && (
              <button
                type="button"
                onClick={openCreateForm}
                className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
              >
                Benutzer erstellen
              </button>
            )}
          </>
        }
      />

      {loading && (
        <LoadingState
          title="Benutzer werden geladen..."
          description="Konten, Organisationen und Rollen-Vorlagen werden vorbereitet."
        />
      )}

      {message && (
        <section className="bg-green-50 border border-green-100 rounded-3xl p-6 shadow-sm">
          <p className="text-green-700 font-bold">
            {message}
          </p>
        </section>
      )}

      {error && (
        <EmptyState
          icon="⚠️"
          title="Benutzer konnten nicht geladen werden"
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Aktiv"
          value={activeUsers.length}
          description={`${users.length} Benutzer gesamt`}
          icon="✅"
          tone="green"
          active={statusFilter === "active"}
          onClick={() => setStatusFilter("active")}
        />

        <StatCard
          label="Admins"
          value={adminUsers.length}
          description={`${departmentLeadUsers.length} Abteilungsleiter`}
          icon="🛡️"
          tone="red"
          active={roleFilter === "admin"}
          onClick={() => setRoleFilter("admin")}
        />

        <StatCard
          label="Leitung"
          value={departmentLeadUsers.length}
          description={`${employeeUsers.length} Mitarbeiter`}
          icon="👥"
          tone="indigo"
          active={roleFilter === "department_lead"}
          onClick={() => setRoleFilter("department_lead")}
        />

        <StatCard
          label="Passwortwechsel"
          value={passwordResetUsers.length}
          description="Muss beim nächsten Login geändert werden"
          icon="🔐"
          tone="orange"
          active={search === "passwort ändern"}
          onClick={() => setSearch("passwort ändern")}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Mitarbeiter"
          value={employeeUsers.length}
          description="Standardrolle"
          icon="👤"
          tone="blue"
          active={roleFilter === "employee"}
          onClick={() => setRoleFilter("employee")}
        />

        <StatCard
          label="Eingeladen"
          value={invitedUsers.length}
          description="Noch nicht vollständig aktiv"
          icon="📨"
          tone="purple"
          active={statusFilter === "invited"}
          onClick={() => setStatusFilter("invited")}
        />

        <StatCard
          label="Inaktiv"
          value={inactiveUsers.length}
          description="Gesperrte Benutzer"
          icon="⛔"
          tone="default"
          active={statusFilter === "inactive"}
          onClick={() => setStatusFilter("inactive")}
        />
      </div>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

        <div className="relative">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
            <div>
              <h2 className="text-2xl font-black">
                Suche & Filter
              </h2>

              <p className="text-zinc-500 mt-1">
                Suche nach Name, Benutzername, E-Mail, Rolle, Status oder Organisation.
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

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 mt-6">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="xl:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
              placeholder="Benutzer suchen..."
            />

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
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
              onChange={(event) => setStatusFilter(event.target.value)}
              className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
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
                setCompanyFilter(event.target.value);
                setDepartmentFilter("");
              }}
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
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
              className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
            >
              <option value="">
                Alle Abteilungen
              </option>

              {filteredDepartments.map((department) => (
                <option
                  key={department.id}
                  value={department.id}
                >
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <span className="text-sm text-zinc-500">
              {filteredUsers.length} von {users.length} Benutzern gefunden.
            </span>

            {search && (
              <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                Suche: {search}
              </span>
            )}

            {roleFilter && (
              <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
                Rolle: {getRoleLabel(roleFilter)}
              </span>
            )}

            {statusFilter && (
              <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                Status: {getStatusLabel(statusFilter)}
              </span>
            )}
          </div>
        </div>
      </section>

      {!loading && !error && filteredUsers.length === 0 && (
        <EmptyState
          icon="👤"
          title="Keine Benutzer gefunden"
          description="Passe die Filter an oder erstelle einen neuen Benutzer."
          action={
            canManageUsers() ? (
              <button
                type="button"
                onClick={openCreateForm}
                className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
              >
                Benutzer erstellen
              </button>
            ) : undefined
          }
        />
      )}

      {viewMode === "table" && filteredUsers.length > 0 && (
        <section className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Benutzer
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Rolle
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Status
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Organisation
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Sicherheit
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Letzter Login
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Aktionen
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100">
                {filteredUsers.map((user) => {
                  const companyName = getCompanyName(user.companyId);
                  const departmentName = getDepartmentName(user.departmentId);

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-zinc-50 transition"
                    >
                      <td className="px-5 py-4 align-top min-w-[260px]">
                        <p className="font-black text-zinc-950">
                          {user.name}
                        </p>

                        <p className="text-sm text-zinc-500 mt-1">
                          {user.email}
                        </p>

                        <p className="text-xs text-zinc-400 mt-1">
                          @{user.username || "-"}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <span
                          className={`text-xs px-3 py-1 rounded-full border font-bold ${getRoleTone(
                            user.role,
                          )}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <span
                          className={`text-xs px-3 py-1 rounded-full border font-bold ${getStatusTone(
                            user.status,
                          )}`}
                        >
                          {getStatusLabel(user.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-top text-sm text-zinc-500 min-w-[220px]">
                        <p className="font-medium text-zinc-700">
                          {companyName}
                        </p>
                        <p className="mt-1">
                          {departmentName}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-col gap-2">
                          {user.hasPassword ? (
                            <span className="text-xs bg-green-50 text-green-700 border border-green-100 px-3 py-1 rounded-full font-bold">
                              Passwort gesetzt
                            </span>
                          ) : (
                            <span className="text-xs bg-red-50 text-red-700 border border-red-100 px-3 py-1 rounded-full font-bold">
                              Kein Passwort
                            </span>
                          )}

                          {user.passwordMustChange && (
                            <span className="text-xs bg-orange-50 text-orange-700 border border-orange-100 px-3 py-1 rounded-full font-bold">
                              Passwort ändern
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top text-sm text-zinc-500 whitespace-nowrap">
                        {user.lastLoginAt || "Noch nie"}
                      </td>

                      <td className="px-5 py-4 align-top">
                        {canManageUsers() && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => startEditUser(user)}
                              className="app-accent-bg text-white px-4 py-2 rounded-xl transition font-bold app-brand-shadow"
                            >
                              Bearbeiten
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleDeleteUser(user)}
                              className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition font-bold"
                            >
                              Löschen
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {viewMode === "cards" && filteredUsers.length > 0 && (
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredUsers.map((user) => {
            const companyName = getCompanyName(user.companyId);
            const departmentName = getDepartmentName(user.departmentId);

            return (
              <article
                key={user.id}
                className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition overflow-hidden relative"
              >
                <div className="absolute -right-14 -top-14 h-32 w-32 rounded-full app-accent-bg opacity-10 blur-3xl" />

                <div className="relative">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`text-xs px-3 py-1 rounded-full border font-bold ${getRoleTone(
                            user.role,
                          )}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>

                        <span
                          className={`text-xs px-3 py-1 rounded-full border font-bold ${getStatusTone(
                            user.status,
                          )}`}
                        >
                          {getStatusLabel(user.status)}
                        </span>

                        {user.hasPassword ? (
                          <span className="text-xs bg-green-50 text-green-700 border border-green-100 px-3 py-1 rounded-full font-bold">
                            Passwort gesetzt
                          </span>
                        ) : (
                          <span className="text-xs bg-red-50 text-red-700 border border-red-100 px-3 py-1 rounded-full font-bold">
                            Kein Passwort
                          </span>
                        )}

                        {user.passwordMustChange && (
                          <span className="text-xs bg-orange-50 text-orange-700 border border-orange-100 px-3 py-1 rounded-full font-bold">
                            Passwort ändern
                          </span>
                        )}
                      </div>

                      <h2 className="text-2xl font-black mt-4">
                        {user.name}
                      </h2>

                      <p className="text-zinc-500 mt-1 break-all">
                        {user.email}
                      </p>
                    </div>

                    {canManageUsers() && (
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditUser(user)}
                          className="app-accent-bg text-white px-4 py-2 rounded-xl transition font-bold app-brand-shadow"
                        >
                          Bearbeiten
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleDeleteUser(user)}
                          className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition font-bold"
                        >
                          Löschen
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-zinc-50 rounded-2xl p-4">
                      <p className="text-xs text-zinc-500">
                        Benutzername
                      </p>
                      <p className="font-black mt-1">
                        {user.username || "-"}
                      </p>
                    </div>

                    <div className="bg-zinc-50 rounded-2xl p-4">
                      <p className="text-xs text-zinc-500">
                        Firma
                      </p>
                      <p className="font-black mt-1">
                        {companyName}
                      </p>
                    </div>

                    <div className="bg-zinc-50 rounded-2xl p-4">
                      <p className="text-xs text-zinc-500">
                        Abteilung
                      </p>
                      <p className="font-black mt-1">
                        {departmentName}
                      </p>
                    </div>

                    <div className="bg-zinc-50 rounded-2xl p-4">
                      <p className="text-xs text-zinc-500">
                        Letzter Login
                      </p>
                      <p className="font-black mt-1">
                        {user.lastLoginAt || "Noch nie"}
                      </p>
                    </div>

                    <div className="bg-zinc-50 rounded-2xl p-4">
                      <p className="text-xs text-zinc-500">
                        Erstellt
                      </p>
                      <p className="font-black mt-1">
                        {user.createdAt || "-"}
                      </p>
                    </div>

                    <div className="bg-zinc-50 rounded-2xl p-4">
                      <p className="text-xs text-zinc-500">
                        Aktualisiert
                      </p>
                      <p className="font-black mt-1">
                        {user.updatedAt || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}