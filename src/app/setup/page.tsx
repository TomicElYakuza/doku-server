"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  getUser,
  saveUser,
} from "../../lib/userStorage";

import type {
  User,
  UserRole,
} from "../../lib/userStorage";

import {
  getRoleLabel,
} from "../../lib/permissions";

import {
  getAdminUsers,
  updateAdminUserLastLogin,
} from "../../lib/adminUserStorage";

import type {
  AdminUser,
} from "../../lib/adminUserStorage";

import {
  getActiveCompanies,
  getActiveDepartments,
  getActiveDepartmentsByCompanyId,
  getCompanies,
  getDepartments,
} from "../../lib/companyStorage";

import type {
  Company,
  Department,
} from "../../lib/companyStorage";

export default function SetupPage() {
  const [mounted, setMounted] =
    useState(false);

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [role, setRole] =
    useState<UserRole>("admin");

  const [companyId, setCompanyId] =
    useState("");

  const [departmentId, setDepartmentId] =
    useState("");

  const [company, setCompany] =
    useState("Intern");

  const [department, setDepartment] =
    useState("IT");

  const [currentUser, setCurrentUser] =
    useState<User | null>(null);

  const [adminUsers, setAdminUsers] =
    useState<AdminUser[]>([]);

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [selectedAdminUserId, setSelectedAdminUserId] =
    useState("");

  useEffect(() => {
    setMounted(true);

    loadData();

    function handleUserUpdated() {
      loadUser();
    }

    function handleAdminUsersUpdated() {
      loadAdminUsers();
    }

    function handleCompaniesUpdated() {
      loadCompaniesAndDepartments();
    }

    function handleDepartmentsUpdated() {
      loadCompaniesAndDepartments();
    }

    window.addEventListener(
      "userUpdated",
      handleUserUpdated
    );

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
        "userUpdated",
        handleUserUpdated
      );

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
    loadCompaniesAndDepartments();

    loadUser();

    loadAdminUsers();
  }

  function loadCompaniesAndDepartments() {
    setCompanies(
      getCompanies()
    );

    setDepartments(
      getDepartments()
    );
  }

  function loadUser() {
    const user =
      getUser();

    const activeCompanies =
      getActiveCompanies();

    const activeDepartments =
      getActiveDepartments();

    const fallbackCompany =
      activeCompanies[0];

    const fallbackDepartment =
      activeDepartments[0];

    setCurrentUser(
      user
    );

    setName(
      user?.name || "Admin"
    );

    setEmail(
      user?.email || "admin@local"
    );

    setRole(
      user?.role || "admin"
    );

    setCompanyId(
      user?.companyId ||
        fallbackCompany?.id ||
        "company-intern"
    );

    setDepartmentId(
      user?.departmentId ||
        fallbackDepartment?.id ||
        "department-it"
    );

    setCompany(
      user?.company ||
        fallbackCompany?.name ||
        "Intern"
    );

    setDepartment(
      user?.department ||
        fallbackDepartment?.name ||
        "IT"
    );
  }

  function loadAdminUsers() {
    setAdminUsers(
      getAdminUsers()
    );
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

  function handleSaveUser() {
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

    const savedUser =
      saveUser({
        name:
          name.trim(),

        email:
          email.trim(),

        role,

        companyId,

        departmentId,

        company:
          selectedCompanyName,

        department:
          selectedDepartmentName,
      });

    updateAdminUserLastLogin(
      email.trim()
    );

    setCurrentUser(
      savedUser || null
    );

    loadAdminUsers();

    alert(
      "Benutzer wurde gespeichert."
    );
  }

  function applyAdminUser(
    userId: string
  ) {
    setSelectedAdminUserId(
      userId
    );

    const adminUser =
      adminUsers.find(
        (item) =>
          item.id === userId
      );

    if (!adminUser) {
      return;
    }

    setName(
      adminUser.name
    );

    setEmail(
      adminUser.email
    );

    setRole(
      adminUser.role
    );

    setCompanyId(
      adminUser.companyId || ""
    );

    setDepartmentId(
      adminUser.departmentId || ""
    );

    setCompany(
      adminUser.company ||
        getCompanyName(
          adminUser.companyId
        ) ||
        "Intern"
    );

    setDepartment(
      adminUser.department ||
        getDepartmentName(
          adminUser.departmentId
        ) ||
        "Allgemein"
    );
  }

  function loginAsAdminUser(
    adminUser: AdminUser
  ) {
    if (adminUser.status === "inactive") {
      alert(
        "Dieser Benutzer ist inaktiv und kann nicht übernommen werden."
      );

      return;
    }

    const savedUser =
      saveUser({
        name:
          adminUser.name,

        email:
          adminUser.email,

        role:
          adminUser.role,

        companyId:
          adminUser.companyId || "",

        departmentId:
          adminUser.departmentId || "",

        company:
          adminUser.company ||
          getCompanyName(
            adminUser.companyId
          ) ||
          "Intern",

        department:
          adminUser.department ||
          getDepartmentName(
            adminUser.departmentId
          ) ||
          "Allgemein",
      });

    updateAdminUserLastLogin(
      adminUser.email
    );

    setCurrentUser(
      savedUser || null
    );

    setName(
      savedUser.name
    );

    setEmail(
      savedUser.email
    );

    setRole(
      savedUser.role
    );

    setCompanyId(
      savedUser.companyId || ""
    );

    setDepartmentId(
      savedUser.departmentId || ""
    );

    setCompany(
      savedUser.company ||
        "Intern"
    );

    setDepartment(
      savedUser.department ||
        "Allgemein"
    );

    setSelectedAdminUserId(
      adminUser.id
    );

    loadAdminUsers();

    alert(
      `${adminUser.name} wurde als aktueller Benutzer gesetzt.`
    );
  }

  function setDemoAdmin() {
    setName(
      "Admin"
    );

    setEmail(
      "admin@local"
    );

    setRole(
      "admin"
    );

    setCompanyId(
      "company-intern"
    );

    setDepartmentId(
      "department-it"
    );

    setCompany(
      "Intern"
    );

    setDepartment(
      "IT"
    );

    setSelectedAdminUserId("");
  }

  function setDemoEditor() {
    setName(
      "Editor"
    );

    setEmail(
      "editor@local"
    );

    setRole(
      "editor"
    );

    setCompanyId(
      "company-intern"
    );

    setDepartmentId(
      "department-support"
    );

    setCompany(
      "Intern"
    );

    setDepartment(
      "Support"
    );

    setSelectedAdminUserId("");
  }

  function setDemoViewer() {
    setName(
      "Viewer"
    );

    setEmail(
      "viewer@local"
    );

    setRole(
      "viewer"
    );

    setCompanyId(
      "company-intern"
    );

    setDepartmentId(
      "department-office"
    );

    setCompany(
      "Intern"
    );

    setDepartment(
      "Office"
    );

    setSelectedAdminUserId("");
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

    if (status === "invited") {
      return "Eingeladen";
    }

    return "Unbekannt";
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

    if (status === "invited") {
      return "bg-blue-50 text-blue-700";
    }

    return "bg-zinc-100 text-zinc-700";
  }

  function getRoleClass(
    value: string
  ) {
    if (value === "admin") {
      return "bg-red-50 text-red-700";
    }

    if (value === "editor") {
      return "bg-indigo-50 text-indigo-700";
    }

    return "bg-zinc-100 text-zinc-700";
  }

  if (!mounted) {
    return null;
  }

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

        <span className="text-zinc-900">
          setup
        </span>
      </div>

      {/* BACK */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zum Dashboard
        </Link>
      </div>

      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold">
            Benutzer Setup
          </h1>

          <p className="text-zinc-500 mt-2">
            Aktuellen Demo-Benutzer festlegen oder Benutzer aus der Admin-Verwaltung übernehmen
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-end">
          <Link
            href="/admin/users"
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Benutzerverwaltung
          </Link>

          <Link
            href="/admin/companies"
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Firmen
          </Link>

          <Link
            href="/admin"
            className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Admin
          </Link>
        </div>
      </div>

      {/* CURRENT USER */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Aktueller Benutzer
        </h2>

        {!currentUser && (
          <p className="text-zinc-500 mt-4">
            Kein Benutzer geladen.
          </p>
        )}

        {currentUser && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
            <div className="bg-zinc-50 rounded-2xl p-5">
              <p className="text-sm text-zinc-500">
                Name
              </p>

              <p className="font-semibold mt-1">
                {currentUser.name}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-5">
              <p className="text-sm text-zinc-500">
                E-Mail
              </p>

              <p className="font-semibold mt-1">
                {currentUser.email}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-5">
              <p className="text-sm text-zinc-500">
                Rolle
              </p>

              <p className="font-semibold mt-1">
                {getRoleLabel(
                  currentUser.role
                )}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-5">
              <p className="text-sm text-zinc-500">
                Firma
              </p>

              <p className="font-semibold mt-1">
                {currentUser.company ||
                  getCompanyName(
                    currentUser.companyId
                  ) ||
                  "Intern"}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-5">
              <p className="text-sm text-zinc-500">
                Abteilung
              </p>

              <p className="font-semibold mt-1">
                {currentUser.department ||
                  getDepartmentName(
                    currentUser.departmentId
                  ) ||
                  "Allgemein"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ADMIN USER SELECT */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Aus Benutzerverwaltung übernehmen
        </h2>

        <p className="text-zinc-500 mt-2">
          Wähle einen Benutzer aus der Admin-Verwaltung aus und speichere ihn als aktuellen Demo-Benutzer.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <select
            value={selectedAdminUserId}
            onChange={(event) =>
              applyAdminUser(
                event.target.value
              )
            }
            className="md:col-span-2 w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Benutzer auswählen
            </option>

            {adminUsers.map(
              (adminUser) => (
                <option
                  key={adminUser.id}
                  value={adminUser.id}
                >
                  {adminUser.name} · {adminUser.email} · {getRoleLabel(
                    adminUser.role
                  )} · {adminUser.company || "Intern"} / {adminUser.department || "Allgemein"}
                </option>
              )
            )}
          </select>

          <button
            onClick={handleSaveUser}
            className="bg-zinc-900 text-white px-5 py-4 rounded-2xl hover:bg-zinc-700 transition"
          >
            Ausgewählten Benutzer setzen
          </button>
        </div>

        <div className="grid gap-4 mt-6">
          {adminUsers.length === 0 && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5">
              <p className="text-zinc-500">
                Noch keine Admin-Benutzer vorhanden.
              </p>
            </div>
          )}

          {adminUsers.map(
            (adminUser) => (
              <div
                key={adminUser.id}
                className="border border-zinc-200 rounded-2xl p-5"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${getRoleClass(
                          adminUser.role
                        )}`}
                      >
                        {getRoleLabel(
                          adminUser.role
                        )}
                      </span>

                      <span
                        className={`text-xs px-3 py-1 rounded-full ${getStatusClass(
                          adminUser.status
                        )}`}
                      >
                        {getStatusLabel(
                          adminUser.status
                        )}
                      </span>

                      <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
                        {adminUser.company ||
                          getCompanyName(
                            adminUser.companyId
                          ) ||
                          "Intern"}
                      </span>

                      <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                        {adminUser.department ||
                          getDepartmentName(
                            adminUser.departmentId
                          ) ||
                          "Allgemein"}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold mt-4">
                      {adminUser.name}
                    </h3>

                    <p className="text-zinc-500 mt-1">
                      {adminUser.email}
                    </p>

                    <p className="text-sm text-zinc-500 mt-3">
                      Letzter Login:{" "}
                      {adminUser.lastLoginAt ||
                        "Noch nie"}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      loginAsAdminUser(
                        adminUser
                      )
                    }
                    className="bg-white border border-zinc-200 px-4 py-2 rounded-xl hover:bg-zinc-100 transition shrink-0"
                  >
                    Als Benutzer setzen
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* FORM */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Benutzer manuell bearbeiten
        </h2>

        <p className="text-zinc-500 mt-2">
          Diese Demo-Version speichert den aktuellen Benutzer lokal im Browser. Später wird das durch echtes Login und Sessions ersetzt.
        </p>

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

          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5">
            <p className="font-medium">
              Aktuelle Auswahl
            </p>

            <p className="text-sm text-zinc-500 mt-2">
              {company || "Keine Firma"} / {department || "Keine Abteilung"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={handleSaveUser}
            className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
          >
            Benutzer speichern
          </button>

          <button
            onClick={loadUser}
            className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
          >
            Aktuelle Daten neu laden
          </button>
        </div>
      </div>

      {/* ROLE SHORTCUTS */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Demo-Rollen
        </h2>

        <p className="text-zinc-500 mt-2">
          Schnell zwischen Rollen wechseln und danach speichern.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <button
            onClick={setDemoAdmin}
            className="bg-zinc-900 text-white px-5 py-4 rounded-2xl hover:bg-zinc-700 transition text-left"
          >
            <p className="font-semibold">
              Admin
            </p>

            <p className="text-sm text-zinc-300 mt-1">
              Admin · Intern / IT
            </p>
          </button>

          <button
            onClick={setDemoEditor}
            className="bg-white border border-zinc-200 px-5 py-4 rounded-2xl hover:bg-zinc-100 transition text-left"
          >
            <p className="font-semibold">
              Editor
            </p>

            <p className="text-sm text-zinc-500 mt-1">
              Editor · Intern / Support
            </p>
          </button>

          <button
            onClick={setDemoViewer}
            className="bg-white border border-zinc-200 px-5 py-4 rounded-2xl hover:bg-zinc-100 transition text-left"
          >
            <p className="font-semibold">
              Viewer
            </p>

            <p className="text-sm text-zinc-500 mt-1">
              Viewer · Intern / Office
            </p>
          </button>
        </div>
      </div>

      {/* PERMISSIONS INFO */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Rollenübersicht
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="border border-zinc-200 rounded-2xl p-5">
            <h3 className="font-semibold">
              Administrator
            </h3>

            <p className="text-sm text-zinc-500 mt-2">
              Vollzugriff auf Wiki, Tickets, Vorlagen, Aktivitäten, Einstellungen und Admin-Dashboard.
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <h3 className="font-semibold">
              Bearbeiter
            </h3>

            <p className="text-sm text-zinc-500 mt-2">
              Kann Inhalte erstellen und bearbeiten. Lösch- und Admin-Funktionen sind eingeschränkt.
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <h3 className="font-semibold">
              Leser
            </h3>

            <p className="text-sm text-zinc-500 mt-2">
              Nur Lesezugriff. Keine Bearbeitung, keine Kommentare, keine Löschaktionen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}