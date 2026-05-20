"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  getUser,
  saveUser,
} from "../../lib/userStorage";

import type {
  User,
  UserRole,
} from "../../lib/userStorage";

import {
  adminUserRepository,
} from "../../lib/adminUserRepository";

import type {
  AdminUser,
} from "../../lib/adminUserStorage";

import {
  companyRepository,
} from "../../lib/companyRepository";

import type {
  Company,
  Department,
} from "../../lib/companyStorage";

import {
  getRoleLabel,
} from "../../lib/permissions";

type LoginMode =
  | "quick"
  | "manual";

function getRoleClass(
  role: UserRole
) {
  if (role === "admin") {
    return "bg-red-50 text-red-700";
  }

  if (role === "editor") {
    return "bg-indigo-50 text-indigo-700";
  }

  return "bg-zinc-100 text-zinc-700";
}

function getStatusClass(
  status?: string
) {
  if (status === "active") {
    return "bg-green-50 text-green-700";
  }

  if (status === "invited") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "inactive") {
    return "bg-zinc-100 text-zinc-700";
  }

  return "bg-zinc-100 text-zinc-700";
}

export default function LoginPage() {
  const router =
    useRouter();

  const [mounted, setMounted] =
    useState(false);

  const [currentUser, setCurrentUser] =
    useState<User | null>(null);

  const [adminUsers, setAdminUsers] =
    useState<AdminUser[]>([]);

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [loginMode, setLoginMode] =
    useState<LoginMode>("quick");

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [role, setRole] =
    useState<UserRole>("viewer");

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
    const user =
      getUser();

    const nextAdminUsers =
      adminUserRepository.list();

    const nextCompanies =
      companyRepository.listCompanies();

    const nextDepartments =
      companyRepository.listDepartments();

    setCurrentUser(
      user
    );

    setAdminUsers(
      nextAdminUsers
    );

    setCompanies(
      nextCompanies
    );

    setDepartments(
      nextDepartments
    );

    if (user) {
      setName(
        user.name ||
          ""
      );

      setEmail(
        user.email ||
          ""
      );

      setRole(
        user.role ||
          "viewer"
      );

      setCompanyId(
        user.companyId ||
          ""
      );

      setDepartmentId(
        user.departmentId ||
          ""
      );

      setCompany(
        user.company ||
          "Intern"
      );

      setDepartment(
        user.department ||
          "Allgemein"
      );

      return;
    }

    const firstActiveCompany =
      companyRepository.listActiveCompanies()[0];

    const firstActiveDepartment =
      firstActiveCompany
        ? companyRepository.listActiveDepartmentsByCompanyId(
            firstActiveCompany.id
          )[0]
        : companyRepository.listActiveDepartments()[0];

    if (firstActiveCompany) {
      setCompanyId(
        firstActiveCompany.id
      );

      setCompany(
        firstActiveCompany.name
      );
    }

    if (firstActiveDepartment) {
      setDepartmentId(
        firstActiveDepartment.id
      );

      setDepartment(
        firstActiveDepartment.name
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
      return companyRepository.listActiveDepartments();
    }

    return companyRepository.listActiveDepartmentsByCompanyId(
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
      companyRepository.listActiveDepartmentsByCompanyId(
        nextCompanyId
      );

    const firstDepartment =
      nextDepartments[0];

    setDepartmentId(
      firstDepartment?.id ||
        ""
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

  function loginAsAdminUser(
    adminUser: AdminUser
  ) {
    if (adminUser.status === "inactive") {
      alert(
        "Dieser Benutzer ist inaktiv."
      );

      return;
    }

    const nextUser: User = {
      name:
        adminUser.name,

      email:
        adminUser.email,

      role:
        adminUser.role,

      companyId:
        adminUser.companyId ||
        "",

      departmentId:
        adminUser.departmentId ||
        "",

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
    };

    saveUser(
      nextUser
    );

    adminUserRepository.updateLastLogin(
      adminUser.email
    );

    router.push(
      "/"
    );
  }

  function handleManualLogin() {
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

    const adminUser =
      adminUserRepository.findByEmail(
        email.trim()
      );

    if (adminUser) {
      loginAsAdminUser(
        adminUser
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

    const nextUser: User = {
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
    };

    saveUser(
      nextUser
    );

    router.push(
      "/"
    );
  }

function handleLogout() {
  localStorage.removeItem(
    "dms-user"
  );

  window.dispatchEvent(
    new Event(
      "userUpdated"
    )
  );

  setCurrentUser(
    null
  );

  setName("");
  setEmail("");
  setRole("viewer");

  router.push(
    "/login"
  );
}

  if (!mounted) {
    return null;
  }

  const activeAdminUsers =
    adminUsers.filter(
      (user) =>
        user.status !== "inactive"
    );

  const activeCompanies =
    companyRepository.listActiveCompanies();

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
      <div className="w-full max-w-6xl grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-6">
        <div className="bg-zinc-900 text-white rounded-3xl p-8 shadow-sm">
          <p className="text-sm text-zinc-300">
            Anmeldung
          </p>

          <h1 className="text-4xl font-black tracking-tight mt-3">
            Intranet Login
          </h1>

          <p className="text-zinc-300 mt-4 leading-relaxed">
            Diese Seite dient aktuell als lokaler Login-Ersatz. Später wird daraus die echte Anmeldung mit Benutzerkonto, Rollen, Firmen und Abteilungen.
          </p>

          <div className="grid gap-4 mt-8">
            <div className="bg-white/10 rounded-2xl p-5">
              <p className="text-sm text-zinc-300">
                Aktueller Benutzer
              </p>

              <p className="text-xl font-semibold mt-2">
                {currentUser?.name ||
                  "Nicht angemeldet"}
              </p>

              {currentUser && (
                <p className="text-sm text-zinc-300 mt-2">
                  {getRoleLabel(
                    currentUser.role
                  )} ·{" "}
                  {currentUser.company ||
                    "Intern"}{" "}
                  ·{" "}
                  {currentUser.department ||
                    "Allgemein"}
                </p>
              )}
            </div>

            <div className="bg-white/10 rounded-2xl p-5">
              <p className="text-sm text-zinc-300">
                Vorbereitet für
              </p>

              <ul className="text-sm text-zinc-300 mt-3 space-y-2">
                <li>
                  Benutzerverwaltung
                </li>

                <li>
                  Rollen & Rechte
                </li>

                <li>
                  Firmen & Abteilungen
                </li>

                <li>
                  spätere Datenbank-Anmeldung
                </li>
              </ul>
            </div>
          </div>

          {currentUser && (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full bg-white text-zinc-900 px-5 py-4 rounded-2xl hover:bg-zinc-100 transition mt-8"
            >
              Lokal abmelden
            </button>
          )}
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <h2 className="text-3xl font-bold">
                Benutzer wählen
              </h2>

              <p className="text-zinc-500 mt-2">
                Schnell als vorhandener Admin-Benutzer anmelden oder manuell einen lokalen Benutzer setzen.
              </p>
            </div>

            <div className="flex gap-2 bg-zinc-100 rounded-2xl p-1">
              <button
                type="button"
                onClick={() =>
                  setLoginMode(
                    "quick"
                  )
                }
                className={`px-4 py-2 rounded-xl transition ${
                  loginMode === "quick"
                    ? "bg-white shadow-sm"
                    : "hover:bg-zinc-200"
                }`}
              >
                Schnell
              </button>

              <button
                type="button"
                onClick={() =>
                  setLoginMode(
                    "manual"
                  )
                }
                className={`px-4 py-2 rounded-xl transition ${
                  loginMode === "manual"
                    ? "bg-white shadow-sm"
                    : "hover:bg-zinc-200"
                }`}
              >
                Manuell
              </button>
            </div>
          </div>

          {loginMode === "quick" && (
            <div className="grid gap-4 mt-8">
              {activeAdminUsers.length === 0 && (
                <div className="border border-zinc-200 rounded-2xl p-6">
                  <p className="text-zinc-500">
                    Noch keine aktiven Admin-Benutzer vorhanden.
                  </p>

                  <Link
                    href="/admin/users"
                    className="inline-flex mt-4 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
                  >
                    Benutzerverwaltung öffnen
                  </Link>
                </div>
              )}

              {activeAdminUsers.map(
                (adminUser) => (
                  <button
                    key={adminUser.id}
                    type="button"
                    onClick={() =>
                      loginAsAdminUser(
                        adminUser
                      )
                    }
                    className="text-left border border-zinc-200 rounded-2xl p-5 hover:bg-zinc-50 transition"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {adminUser.name}
                        </h3>

                        <p className="text-zinc-500 mt-1">
                          {adminUser.email}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className={`text-xs px-3 py-1 rounded-full ${getRoleClass(adminUser.role)}`}>
                          {getRoleLabel(
                            adminUser.role
                          )}
                        </span>

                        <span className={`text-xs px-3 py-1 rounded-full ${getStatusClass(adminUser.status)}`}>
                          {adminUser.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-4 text-sm text-zinc-500">
                      <span>
                        {adminUser.company ||
                          getCompanyName(
                            adminUser.companyId
                          ) ||
                          "Intern"}
                      </span>

                      <span>
                        ·
                      </span>

                      <span>
                        {adminUser.department ||
                          getDepartmentName(
                            adminUser.departmentId
                          ) ||
                          "Allgemein"}
                      </span>

                      <span>
                        ·
                      </span>

                      <span>
                        Letzter Login:{" "}
                        {adminUser.lastLoginAt ||
                          "Noch nie"}
                      </span>
                    </div>
                  </button>
                )
              )}
            </div>
          )}

          {loginMode === "manual" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
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
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                  placeholder="max@firma.at"
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

                  {activeCompanies.map(
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

              <div className="md:col-span-2 flex flex-wrap gap-3 mt-3">
                <button
                  type="button"
                  onClick={handleManualLogin}
                  className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
                >
                  Anmelden
                </button>

                <Link
                  href="/"
                  className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
                >
                  Zurück
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}