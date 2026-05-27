"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  canViewAdmin,
} from "../../../lib/permissions";

import {
  permissionRepository,
} from "../../../lib/permissionRepository";

import {
  companyRepository,
} from "../../../lib/companyRepository";

import {
  adminUserRepository,
} from "../../../lib/adminUserRepository";

import AccessDeniedCard from "../../../components/AccessDeniedCard";

import PageHero from "../../../components/PageHero";

import StatCard from "../../../components/StatCard";

import type {
  Permission,
  PermissionScopeType,
  UserPermission,
} from "../../../types/permission";

import type {
  Company,
  Department,
} from "../../../types/company";

import type {
  AdminUser,
} from "../../../types/user";

type TabKey =
  | "catalog"
  | "companies"
  | "departments"
  | "users";

const tabs: Array<{
  key: TabKey;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    key: "catalog",
    label: "Berechtigungskatalog",
    description: "Alle verfügbaren Berechtigungen mit Beschreibung.",
    icon: "📚",
  },
  {
    key: "companies",
    label: "Firmenrechte",
    description: "Rechte global pro Firma vergeben.",
    icon: "🏢",
  },
  {
    key: "departments",
    label: "Abteilungsrechte",
    description: "Rechte gezielt pro Abteilung vergeben.",
    icon: "🧩",
  },
  {
    key: "users",
    label: "Benutzerrechte",
    description: "Zusätzliche Einzelrechte pro Benutzer vergeben.",
    icon: "👤",
  },
];

const scopeOptions: Array<{
  value: PermissionScopeType;
  label: string;
  description: string;
}> = [
  {
    value: "global",
    label: "Global",
    description: "Gilt unabhängig von Firma oder Abteilung.",
  },
  {
    value: "company",
    label: "Firma",
    description: "Gilt nur innerhalb einer Firma.",
  },
  {
    value: "department",
    label: "Abteilung",
    description: "Gilt nur innerhalb einer Abteilung.",
  },
  {
    value: "own",
    label: "Eigene Inhalte",
    description: "Gilt nur für eigene Inhalte oder eigene Tickets.",
  },
];

function groupPermissionsByCategory(
  permissions: Permission[]
) {
  return permissions.reduce<Record<string, Permission[]>>(
    (
      groups,
      permission
    ) => {
      const category =
        permission.category ||
        "Sonstige";

      if (!groups[category]) {
        groups[category] =
          [];
      }

      groups[category].push(
        permission
      );

      return groups;
    },
    {}
  );
}

function includesPermission(
  permissionKeys: string[],
  permissionKey: string
) {
  return permissionKeys.includes(
    permissionKey
  );
}

function togglePermissionKey(
  permissionKeys: string[],
  permissionKey: string
) {
  if (
    includesPermission(
      permissionKeys,
      permissionKey
    )
  ) {
    return permissionKeys.filter(
      (key) =>
        key !== permissionKey
    );
  }

  return [
    ...permissionKeys,
    permissionKey,
  ];
}

function getRoleLabel(
  role: string
) {
  return adminUserRepository.getRoleLabel(
    role
  );
}

function getScopeLabel(
  scopeType: PermissionScopeType
) {
  return (
    scopeOptions.find(
      (scope) =>
        scope.value === scopeType
    )?.label ||
    scopeType
  );
}

function getPermissionScopeType(
  permission: Permission
): PermissionScopeType {
  const rawPermission =
    permission as unknown as Record<string, unknown>;

  const value =
    rawPermission.scopeType ||
    rawPermission.scope_type ||
    rawPermission.scope ||
    "global";

  if (
    value === "global" ||
    value === "company" ||
    value === "department" ||
    value === "own"
  ) {
    return value;
  }

  return "global";
}

export default function AdminPermissionsPage() {
  const [mounted, setMounted] =
    useState(false);

  const [permissions, setPermissions] =
    useState<Permission[]>([]);

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [users, setUsers] =
    useState<AdminUser[]>([]);

  const [activeTab, setActiveTab] =
    useState<TabKey>("catalog");

  const [search, setSearch] =
    useState("");

  const [selectedCompanyId, setSelectedCompanyId] =
    useState("");

  const [selectedDepartmentCompanyId, setSelectedDepartmentCompanyId] =
    useState("");

  const [selectedDepartmentId, setSelectedDepartmentId] =
    useState("");

  const [selectedUserId, setSelectedUserId] =
    useState("");

  const [companyPermissionKeys, setCompanyPermissionKeys] =
    useState<string[]>([]);

  const [departmentPermissionKeys, setDepartmentPermissionKeys] =
    useState<string[]>([]);

  const [userPermissions, setUserPermissions] =
    useState<UserPermission[]>([]);

  const [userScopeType, setUserScopeType] =
    useState<PermissionScopeType>("global");

  const [userScopeId, setUserScopeId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    setMounted(
      true
    );

    void loadData();

    function handlePermissionsUpdated() {
      void loadData();
    }

    window.addEventListener(
      "permissionsUpdated",
      handlePermissionsUpdated
    );

    return () => {
      window.removeEventListener(
        "permissionsUpdated",
        handlePermissionsUpdated
      );
    };
  }, []);

  useEffect(() => {
    if (!selectedCompanyId) {
      setCompanyPermissionKeys(
        []
      );

      return;
    }

    void loadCompanyPermissions(
      selectedCompanyId
    );
  }, [
    selectedCompanyId,
  ]);

  useEffect(() => {
    if (!selectedDepartmentId) {
      setDepartmentPermissionKeys(
        []
      );

      return;
    }

    void loadDepartmentPermissions(
      selectedDepartmentId
    );
  }, [
    selectedDepartmentId,
  ]);

  useEffect(() => {
    if (!selectedUserId) {
      setUserPermissions(
        []
      );

      return;
    }

    void loadUserPermissions(
      selectedUserId
    );
  }, [
    selectedUserId,
  ]);

  async function loadData() {
    try {
      setLoading(
        true
      );

      setError(
        ""
      );

      const [
        nextPermissions,
        nextCompanies,
        nextDepartments,
        nextUsers,
      ] =
        await Promise.all([
          permissionRepository.listPermissions(),
          companyRepository.listCompanies(),
          companyRepository.listDepartments(),
          adminUserRepository.list(),
        ]);

      setPermissions(
        Array.isArray(
          nextPermissions
        )
          ? nextPermissions
          : []
      );

      setCompanies(
        Array.isArray(
          nextCompanies
        )
          ? nextCompanies
          : []
      );

      setDepartments(
        Array.isArray(
          nextDepartments
        )
          ? nextDepartments
          : []
      );

      setUsers(
        Array.isArray(
          nextUsers
        )
          ? nextUsers
          : []
      );

      if (
        !selectedCompanyId &&
        nextCompanies[0]
      ) {
        setSelectedCompanyId(
          nextCompanies[0].id
        );
      }

      if (
        !selectedDepartmentCompanyId &&
        nextCompanies[0]
      ) {
        setSelectedDepartmentCompanyId(
          nextCompanies[0].id
        );
      }

      const firstDepartment =
        nextDepartments.find(
          (department) =>
            department.companyId ===
            (
              selectedDepartmentCompanyId ||
              nextCompanies[0]?.id
            )
        );

      if (
        !selectedDepartmentId &&
        firstDepartment
      ) {
        setSelectedDepartmentId(
          firstDepartment.id
        );
      }

      if (
        !selectedUserId &&
        nextUsers[0]
      ) {
        setSelectedUserId(
          nextUsers[0].id
        );
      }
    } catch (loadError) {
      console.error(
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Berechtigungen konnten nicht geladen werden."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  async function loadCompanyPermissions(
    companyId: string
  ) {
    try {
      const nextPermissionKeys =
        await permissionRepository.listCompanyPermissions(
          companyId
        );

      setCompanyPermissionKeys(
        Array.isArray(
          nextPermissionKeys
        )
          ? nextPermissionKeys
          : []
      );
    } catch (loadError) {
      console.error(
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Firmenrechte konnten nicht geladen werden."
      );
    }
  }

  async function loadDepartmentPermissions(
    departmentId: string
  ) {
    try {
      const nextPermissionKeys =
        await permissionRepository.listDepartmentPermissions(
          departmentId
        );

      setDepartmentPermissionKeys(
        Array.isArray(
          nextPermissionKeys
        )
          ? nextPermissionKeys
          : []
      );
    } catch (loadError) {
      console.error(
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Abteilungsrechte konnten nicht geladen werden."
      );
    }
  }

  async function loadUserPermissions(
    userId: string
  ) {
    try {
      const nextPermissions =
        await permissionRepository.listUserPermissions(
          userId
        );

      setUserPermissions(
        Array.isArray(
          nextPermissions
        )
          ? nextPermissions
          : []
      );
    } catch (loadError) {
      console.error(
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Benutzerrechte konnten nicht geladen werden."
      );
    }
  }

  const filteredPermissions =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (!query) {
          return permissions;
        }

        return permissions.filter(
          (permission) =>
            [
              permission.permissionKey,
              permission.label,
              permission.description,
              permission.category,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(
                query
              )
        );
      },
      [
        permissions,
        search,
      ]
    );

  const groupedPermissions =
    useMemo(
      () =>
        groupPermissionsByCategory(
          filteredPermissions
        ),
      [
        filteredPermissions,
      ]
    );

  const categories =
    useMemo(
      () =>
        Object.keys(
          groupedPermissions
        ).sort(
          (
            a,
            b
          ) =>
            a.localeCompare(
              b
            )
        ),
      [
        groupedPermissions,
      ]
    );

  const departmentOptions =
    useMemo(
      () => {
        if (!selectedDepartmentCompanyId) {
          return departments;
        }

        return departments.filter(
          (department) =>
            department.companyId === selectedDepartmentCompanyId
        );
      },
      [
        departments,
        selectedDepartmentCompanyId,
      ]
    );

  const selectedCompany =
    useMemo(
      () =>
        companies.find(
          (company) =>
            company.id === selectedCompanyId
        ) ||
        null,
      [
        companies,
        selectedCompanyId,
      ]
    );

  const selectedDepartment =
    useMemo(
      () =>
        departments.find(
          (department) =>
            department.id === selectedDepartmentId
        ) ||
        null,
      [
        departments,
        selectedDepartmentId,
      ]
    );

  const selectedUser =
    useMemo(
      () =>
        users.find(
          (user) =>
            user.id === selectedUserId
        ) ||
        null,
      [
        users,
        selectedUserId,
      ]
    );

  const companyScopedPermissions =
    useMemo(
      () =>
        permissions.filter(
          (permission) =>
            getPermissionScopeType(
              permission
            ) === "company"
        ),
      [
        permissions,
      ]
    );

  const departmentScopedPermissions =
    useMemo(
      () =>
        permissions.filter(
          (permission) =>
            getPermissionScopeType(
              permission
            ) === "department"
        ),
      [
        permissions,
      ]
    );

  function userHasPermission(
    permissionKey: string
  ) {
    return userPermissions.some(
      (permission) =>
        permission.permissionKey === permissionKey
    );
  }

  function toggleUserPermission(
    permissionKey: string
  ) {
    setUserPermissions(
      (current) => {
        const exists =
          current.some(
            (permission) =>
              permission.permissionKey === permissionKey
          );

        if (exists) {
          return current.filter(
            (permission) =>
              permission.permissionKey !== permissionKey
          );
        }

        const nextPermission: UserPermission = {
          id:
            "",

          userId:
            selectedUserId,

          permissionKey,

          scopeType:
            userScopeType,

          scopeId:
            userScopeId,

          createdAt:
            "",
        };

        return [
          ...current,
          nextPermission,
        ];
      }
    );
  }

  function updateUserPermissionScope(
    permissionKey: string,
    scopeType: PermissionScopeType,
    scopeId: string
  ) {
    setUserPermissions(
      (current) =>
        current.map(
          (permission) =>
            permission.permissionKey === permissionKey
              ? {
                  ...permission,
                  scopeType,
                  scopeId,
                }
              : permission
        )
    );
  }

  async function handleSaveCompanyPermissions() {
    if (!selectedCompanyId) {
      alert(
        "Bitte zuerst eine Firma auswählen."
      );

      return;
    }

    try {
      setSaving(
        true
      );

      setMessage(
        ""
      );

      setError(
        ""
      );

      await permissionRepository.saveCompanyPermissions(
        selectedCompanyId,
        companyPermissionKeys
      );

      setMessage(
        "Firmenrechte wurden gespeichert."
      );
    } catch (saveError) {
      console.error(
        saveError
      );

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Firmenrechte konnten nicht gespeichert werden."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  async function handleSaveDepartmentPermissions() {
    if (!selectedDepartmentId) {
      alert(
        "Bitte zuerst eine Abteilung auswählen."
      );

      return;
    }

    try {
      setSaving(
        true
      );

      setMessage(
        ""
      );

      setError(
        ""
      );

      await permissionRepository.saveDepartmentPermissions(
        selectedDepartmentId,
        departmentPermissionKeys
      );

      setMessage(
        "Abteilungsrechte wurden gespeichert."
      );
    } catch (saveError) {
      console.error(
        saveError
      );

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Abteilungsrechte konnten nicht gespeichert werden."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  async function handleSaveUserPermissions() {
    if (!selectedUserId) {
      alert(
        "Bitte zuerst einen Benutzer auswählen."
      );

      return;
    }

    try {
      setSaving(
        true
      );

      setMessage(
        ""
      );

      setError(
        ""
      );

      await permissionRepository.saveUserPermissions(
        selectedUserId,
        userPermissions
      );

      setMessage(
        "Benutzerrechte wurden gespeichert."
      );
    } catch (saveError) {
      console.error(
        saveError
      );

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Benutzerrechte konnten nicht gespeichert werden."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  function renderPermissionCheckboxList(
    selectedPermissionKeys: string[],
    onToggle: (permissionKey: string) => void
  ) {
    return (
      <div className="space-y-6">
        {categories.length === 0 && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold">
              Keine Berechtigungen gefunden
            </h2>

            <p className="text-zinc-500 mt-2">
              Prüfe den Suchfilter oder den Permission-Katalog.
            </p>
          </div>
        )}

        {categories.map(
          (category) => (
            <section
              key={category}
              className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    {category}
                  </h3>

                  <p className="text-zinc-500 mt-1">
                    {groupedPermissions[category].length} Rechte
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-5">
                {groupedPermissions[category].map(
                  (permission) => {
                    const checked =
                      includesPermission(
                        selectedPermissionKeys,
                        permission.permissionKey
                      );

                    return (
                      <label
                        key={permission.permissionKey}
                        className={`flex items-start gap-4 border rounded-3xl p-5 transition ${
                          checked
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-200 bg-white hover:bg-zinc-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            onToggle(
                              permission.permissionKey
                            )
                          }
                          className="mt-1 h-5 w-5"
                        />

                        <span>
                          <span className="font-semibold block">
                            {permission.label}
                          </span>

                          <span className={checked ? "text-zinc-300 text-sm block mt-1" : "text-zinc-500 text-sm block mt-1"}>
                            {permission.description}
                          </span>

                          <span className={checked ? "text-zinc-400 text-xs font-mono block mt-3" : "text-zinc-400 text-xs font-mono block mt-3"}>
                            {permission.permissionKey}
                          </span>
                        </span>
                      </label>
                    );
                  }
                )}
              </div>
            </section>
          )
        )}
      </div>
    );
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

      <PageHero
        eyebrow="Admin Backend"
        title="Berechtigungen"
        description="Rollen, Firmenrechte, Abteilungsrechte und einzelne Benutzerrechte zentral verwalten. Administratoren haben immer vollständigen Zugriff."
        badges={[
          {
            label:
              `${permissions.length} Berechtigungen`,
          },
          {
            label:
              `${companies.length} Firmen`,
          },
          {
            label:
              `${departments.length} Abteilungen`,
          },
          {
            label:
              `${users.length} Benutzer`,
          },
        ]}
        actions={(
          <>
            <button
              type="button"
              onClick={() =>
                void loadData()
              }
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
            >
              Aktualisieren
            </button>
          </>
        )}
      />

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Berechtigungen werden geladen...
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          label="Katalog"
          value={permissions.length}
          description={`${categories.length} Kategorien`}
          icon="📚"
          active={activeTab === "catalog"}
          onClick={() =>
            setActiveTab(
              "catalog"
            )
          }
        />

        <StatCard
          label="Firmenrechte"
          value={companyPermissionKeys.length}
          description={selectedCompany?.name || "Keine Firma ausgewählt"}
          icon="🏢"
          tone="green"
          active={activeTab === "companies"}
          onClick={() =>
            setActiveTab(
              "companies"
            )
          }
        />

        <StatCard
          label="Abteilungsrechte"
          value={departmentPermissionKeys.length}
          description={selectedDepartment?.name || "Keine Abteilung ausgewählt"}
          icon="🧩"
          tone="indigo"
          active={activeTab === "departments"}
          onClick={() =>
            setActiveTab(
              "departments"
            )
          }
        />

        <StatCard
          label="Benutzerrechte"
          value={userPermissions.length}
          description={selectedUser?.name || "Kein Benutzer ausgewählt"}
          icon="👤"
          tone="orange"
          active={activeTab === "users"}
          onClick={() =>
            setActiveTab(
              "users"
            )
          }
        />
      </div>

      <section className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {tabs.map(
          (tab) => {
            const active =
              activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() =>
                  setActiveTab(
                    tab.key
                  )
                }
                className={`text-left rounded-3xl p-5 border transition ${
                  active
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <div className="text-3xl">
                  {tab.icon}
                </div>

                <h2 className="font-semibold mt-4">
                  {tab.label}
                </h2>

                <p className={active ? "text-zinc-300 text-sm mt-2" : "text-zinc-500 text-sm mt-2"}>
                  {tab.description}
                </p>
              </button>
            );
          }
        )}
      </section>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <h2 className="text-xl font-semibold">
              Suche
            </h2>

            <p className="text-zinc-500 mt-1">
              Filtert Rechte nach Schlüssel, Titel, Beschreibung oder Kategorie.
            </p>
          </div>

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            className="w-full xl:w-96 border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
            placeholder="Berechtigungen suchen..."
          />
        </div>

        <p className="text-sm text-zinc-500 mt-5">
          {filteredPermissions.length} von {permissions.length} Berechtigungen gefunden.
        </p>
      </section>

      {activeTab === "catalog" && (
        <section className="space-y-6">
          {categories.length === 0 && !loading && (
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <h2 className="text-xl font-semibold">
                Keine Berechtigungen gefunden
              </h2>

              <p className="text-zinc-500 mt-2">
                Prüfe, ob der Permission-Katalog in PostgreSQL eingefügt wurde.
              </p>
            </div>
          )}

          {categories.map(
            (category) => (
              <section
                key={category}
                className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {category}
                    </h3>

                    <p className="text-zinc-500 mt-1">
                      {groupedPermissions[category].length} Rechte
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-5">
                  {groupedPermissions[category].map(
                    (permission) => (
                      <div
                        key={permission.permissionKey}
                        className="border border-zinc-200 rounded-3xl p-5"
                      >
                        <h4 className="font-semibold">
                          {permission.label}
                        </h4>

                        <p className="text-zinc-500 text-sm mt-2">
                          {permission.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-4">
                          <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                            {permission.permissionKey}
                          </span>

                          <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                            {getScopeLabel(
                              getPermissionScopeType(
                                permission
                              )
                            )}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            )
          )}
        </section>
      )}

      {activeTab === "companies" && (
        <section className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
              <div>
                <h2 className="text-2xl font-semibold">
                  Firmenrechte
                </h2>

                <p className="text-zinc-500 mt-1">
                  Rechte gelten für Benutzer innerhalb der ausgewählten Firma.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void handleSaveCompanyPermissions()
                }
                disabled={
                  saving ||
                  !selectedCompanyId
                }
                className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition disabled:opacity-50"
              >
                {saving
                  ? "Speichert..."
                  : "Firmenrechte speichern"}
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-6">
              <div>
                <label className="block mb-2 font-medium">
                  Firma
                </label>

                <select
                  value={selectedCompanyId}
                  onChange={(event) =>
                    setSelectedCompanyId(
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

              <div className="bg-zinc-50 rounded-2xl p-5">
                <p className="text-sm text-zinc-500">
                  Aktuelle Auswahl
                </p>

                <p className="font-semibold mt-1">
                  {selectedCompany?.name ||
                    "Keine Firma ausgewählt"}
                </p>

                <p className="text-sm text-zinc-500 mt-2">
                  {companyPermissionKeys.length} Rechte aktiv
                </p>
              </div>
            </div>

            {companyScopedPermissions.length > 0 && (
              <p className="text-sm text-zinc-500 mt-5">
                {companyScopedPermissions.length} Rechte sind speziell für Firmen-Scope vorgesehen.
              </p>
            )}
          </div>

          {renderPermissionCheckboxList(
            companyPermissionKeys,
            (permissionKey) =>
              setCompanyPermissionKeys(
                (current) =>
                  togglePermissionKey(
                    current,
                    permissionKey
                  )
              )
          )}
        </section>
      )}

      {activeTab === "departments" && (
        <section className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
              <div>
                <h2 className="text-2xl font-semibold">
                  Abteilungsrechte
                </h2>

                <p className="text-zinc-500 mt-1">
                  Rechte gelten für Benutzer innerhalb der ausgewählten Abteilung.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void handleSaveDepartmentPermissions()
                }
                disabled={
                  saving ||
                  !selectedDepartmentId
                }
                className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition disabled:opacity-50"
              >
                {saving
                  ? "Speichert..."
                  : "Abteilungsrechte speichern"}
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-6">
              <div>
                <label className="block mb-2 font-medium">
                  Firma
                </label>

                <select
                  value={selectedDepartmentCompanyId}
                  onChange={(event) => {
                    const nextCompanyId =
                      event.target.value;

                    setSelectedDepartmentCompanyId(
                      nextCompanyId
                    );

                    const firstDepartment =
                      departments.find(
                        (department) =>
                          department.companyId === nextCompanyId
                      );

                    setSelectedDepartmentId(
                      firstDepartment?.id ||
                        ""
                    );
                  }}
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
                  Abteilung
                </label>

                <select
                  value={selectedDepartmentId}
                  onChange={(event) =>
                    setSelectedDepartmentId(
                      event.target.value
                    )
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
                >
                  <option value="">
                    Abteilung auswählen
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

              <div className="bg-zinc-50 rounded-2xl p-5">
                <p className="text-sm text-zinc-500">
                  Aktuelle Auswahl
                </p>

                <p className="font-semibold mt-1">
                  {selectedDepartment?.name ||
                    "Keine Abteilung ausgewählt"}
                </p>

                <p className="text-sm text-zinc-500 mt-2">
                  {departmentPermissionKeys.length} Rechte aktiv
                </p>
              </div>
            </div>

            {departmentScopedPermissions.length > 0 && (
              <p className="text-sm text-zinc-500 mt-5">
                {departmentScopedPermissions.length} Rechte sind speziell für Abteilungs-Scope vorgesehen.
              </p>
            )}
          </div>

          {renderPermissionCheckboxList(
            departmentPermissionKeys,
            (permissionKey) =>
              setDepartmentPermissionKeys(
                (current) =>
                  togglePermissionKey(
                    current,
                    permissionKey
                  )
              )
          )}
        </section>
      )}

      {activeTab === "users" && (
        <section className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
              <div>
                <h2 className="text-2xl font-semibold">
                  Benutzerrechte
                </h2>

                <p className="text-zinc-500 mt-1">
                  Einzelrechte erweitern die Rechte aus Rolle, Firma und Abteilung.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void handleSaveUserPermissions()
                }
                disabled={
                  saving ||
                  !selectedUserId
                }
                className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition disabled:opacity-50"
              >
                {saving
                  ? "Speichert..."
                  : "Benutzerrechte speichern"}
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-6">
              <div>
                <label className="block mb-2 font-medium">
                  Benutzer
                </label>

                <select
                  value={selectedUserId}
                  onChange={(event) =>
                    setSelectedUserId(
                      event.target.value
                    )
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
                >
                  <option value="">
                    Benutzer auswählen
                  </option>

                  {users.map(
                    (user) => (
                      <option
                        key={user.id}
                        value={user.id}
                      >
                        {user.name} · {getRoleLabel(user.role)}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Standard-Scope für neue Rechte
                </label>

                <select
                  value={userScopeType}
                  onChange={(event) =>
                    setUserScopeType(
                      event.target.value as PermissionScopeType
                    )
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
                >
                  {scopeOptions.map(
                    (scope) => (
                      <option
                        key={scope.value}
                        value={scope.value}
                      >
                        {scope.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Scope-ID
                </label>

                <input
                  value={userScopeId}
                  onChange={(event) =>
                    setUserScopeId(
                      event.target.value
                    )
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                  placeholder="optional: Firma-/Abteilungs-ID"
                />
              </div>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-5 mt-6">
              <p className="text-sm text-zinc-500">
                Aktuelle Auswahl
              </p>

              <p className="font-semibold mt-1">
                {selectedUser?.name ||
                  "Kein Benutzer ausgewählt"}
              </p>

              <p className="text-sm text-zinc-500 mt-2">
                {userPermissions.length} Zusatzrechte aktiv
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {categories.map(
              (category) => (
                <section
                  key={category}
                  className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
                >
                  <h3 className="text-xl font-semibold">
                    {category}
                  </h3>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-5">
                    {groupedPermissions[category].map(
                      (permission) => {
                        const checked =
                          userHasPermission(
                            permission.permissionKey
                          );

                        const activeUserPermission =
                          userPermissions.find(
                            (userPermission) =>
                              userPermission.permissionKey === permission.permissionKey
                          );

                        return (
                          <div
                            key={permission.permissionKey}
                            className={`border rounded-3xl p-5 transition ${
                              checked
                                ? "border-zinc-900 bg-zinc-50"
                                : "border-zinc-200 bg-white"
                            }`}
                          >
                            <label className="flex items-start gap-4">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  toggleUserPermission(
                                    permission.permissionKey
                                  )
                                }
                                className="mt-1 h-5 w-5"
                              />

                              <span>
                                <span className="font-semibold block">
                                  {permission.label}
                                </span>

                                <span className="text-zinc-500 text-sm block mt-1">
                                  {permission.description}
                                </span>

                                <span className="text-zinc-400 text-xs font-mono block mt-3">
                                  {permission.permissionKey}
                                </span>
                              </span>
                            </label>

                            {checked && activeUserPermission && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
                                <select
                                  value={activeUserPermission.scopeType}
                                  onChange={(event) =>
                                    updateUserPermissionScope(
                                      permission.permissionKey,
                                      event.target.value as PermissionScopeType,
                                      activeUserPermission.scopeId
                                    )
                                  }
                                  className="border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-zinc-500 bg-white"
                                >
                                  {scopeOptions.map(
                                    (scope) => (
                                      <option
                                        key={scope.value}
                                        value={scope.value}
                                      >
                                        {scope.label}
                                      </option>
                                    )
                                  )}
                                </select>

                                <input
                                  value={activeUserPermission.scopeId}
                                  onChange={(event) =>
                                    updateUserPermissionScope(
                                      permission.permissionKey,
                                      activeUserPermission.scopeType,
                                      event.target.value
                                    )
                                  }
                                  className="border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-zinc-500"
                                  placeholder="Scope-ID optional"
                                />
                              </div>
                            )}

                            {checked && activeUserPermission && (
                              <p className="text-xs text-zinc-500 mt-3">
                                Scope: {getScopeLabel(activeUserPermission.scopeType)}
                                {activeUserPermission.scopeId
                                  ? ` · ${activeUserPermission.scopeId}`
                                  : ""}
                              </p>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </section>
              )
            )}
          </div>
        </section>
      )}
    </div>
  );
}