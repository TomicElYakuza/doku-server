"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  adminUserRepository,
} from "../../lib/adminUserRepository";

import {
  companyRepository,
} from "../../lib/companyRepository";

import {
  loginCurrentUser,
} from "../../lib/currentUserRepository";

import {
  saveUserCreatedActivity,
  saveUserLoginActivity,
} from "../../lib/userActivityHelpers";

import type {
  AdminUser,
  UserRole,
} from "../../types/user";

import type {
  Company,
  Department,
} from "../../types/company";

function getRoleLabel(
  role: UserRole | string
) {
  if (role === "admin") {
    return "Administrator";
  }

  if (role === "editor") {
    return "Bearbeiter";
  }

  return "Leser";
}

export default function LoginPage() {
  const router =
    useRouter();

  const [mounted, setMounted] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [users, setUsers] =
    useState<AdminUser[]>([]);

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [selectedEmail, setSelectedEmail] =
    useState("");

  const [manualEmail, setManualEmail] =
    useState("");

  const [firstAdminName, setFirstAdminName] =
    useState("Administrator");

  const [firstAdminEmail, setFirstAdminEmail] =
    useState("");

  const [firstAdminCompanyId, setFirstAdminCompanyId] =
    useState("");

  const [firstAdminDepartmentId, setFirstAdminDepartmentId] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    setMounted(
      true
    );

    void loadData();
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

      const firstActiveUser =
        nextUsers.find(
          (user) =>
            user.status === "active"
        );

      setSelectedEmail(
        firstActiveUser?.email ||
          ""
      );

      if (nextCompanies.length > 0) {
        setFirstAdminCompanyId(
          nextCompanies[0].id
        );
      }

      const firstDepartment =
        nextDepartments.find(
          (department) =>
            department.companyId === nextCompanies[0]?.id
        );

      setFirstAdminDepartmentId(
        firstDepartment?.id ||
          ""
      );
    } catch (loadError) {
      console.error(
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Login-Daten konnten nicht geladen werden."
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
      "Intern"
    );
  }

  function getDepartmentName(
    departmentId: string
  ) {
    return (
      departments.find(
        (department) =>
          department.id === departmentId
      )?.name ||
      "Allgemein"
    );
  }

  function getDepartmentsForFirstAdminCompany() {
    if (!firstAdminCompanyId) {
      return departments;
    }

    return departments.filter(
      (department) =>
        department.companyId === firstAdminCompanyId
    );
  }

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const email =
      manualEmail.trim() ||
      selectedEmail.trim();

    if (!email) {
      setError(
        "Bitte einen Benutzer auswählen oder eine E-Mail eingeben."
      );

      return;
    }

    try {
      setSubmitting(
        true
      );

      setError(
        ""
      );

      const currentUser =
        await loginCurrentUser(
          email
        );

      if (!currentUser) {
        setError(
          "Benutzer wurde nicht gefunden oder ist nicht aktiv."
        );

        return;
      }

      const adminUser =
        await adminUserRepository.findByEmail(
          currentUser.email
        );

      if (adminUser) {
        saveUserLoginActivity(
          adminUser
        );
      }

      router.push(
        "/news"
      );

      router.refresh();
    } catch (loginError) {
      console.error(
        loginError
      );

      setError(
        loginError instanceof Error
          ? loginError.message
          : "Login konnte nicht durchgeführt werden."
      );
    } finally {
      setSubmitting(
        false
      );
    }
  }

  async function handleCreateFirstAdmin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!firstAdminName.trim()) {
      setError(
        "Bitte einen Namen eingeben."
      );

      return;
    }

    if (!firstAdminEmail.trim()) {
      setError(
        "Bitte eine E-Mail eingeben."
      );

      return;
    }

    try {
      setSubmitting(
        true
      );

      setError(
        ""
      );

      const companyName =
        getCompanyName(
          firstAdminCompanyId
        );

      const departmentName =
        getDepartmentName(
          firstAdminDepartmentId
        );

      const newAdmin =
        await adminUserRepository.create({
          name:
            firstAdminName.trim(),

          email:
            firstAdminEmail.trim().toLowerCase(),

          role:
            "admin",

          status:
            "active",

          companyId:
            firstAdminCompanyId,

          departmentId:
            firstAdminDepartmentId,

          company:
            companyName,

          department:
            departmentName,
        });

      saveUserCreatedActivity(
        newAdmin
      );

      const currentUser =
        await loginCurrentUser(
          newAdmin.email
        );

      if (!currentUser) {
        setError(
          "Administrator wurde erstellt, konnte aber nicht angemeldet werden."
        );

        await loadData();

        return;
      }

      saveUserLoginActivity(
        newAdmin
      );

      router.push(
        "/news"
      );

      router.refresh();
    } catch (createError) {
      console.error(
        createError
      );

      setError(
        createError instanceof Error
          ? createError.message
          : "Administrator konnte nicht erstellt werden."
      );
    } finally {
      setSubmitting(
        false
      );
    }
  }

  if (!mounted) {
    return null;
  }

  const activeUsers =
    users.filter(
      (user) =>
        user.status === "active"
    );

  const showFirstAdminSetup =
    !loading &&
    users.length === 0;

  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-8">
        <section className="bg-zinc-900 text-white rounded-3xl p-10 shadow-sm flex flex-col justify-between min-h-[560px]">
          <div>
            <p className="text-zinc-400">
              DMS · Ticket · Intranet
            </p>

            <h1 className="text-5xl font-bold mt-5 leading-tight">
              Willkommen im internen Portal
            </h1>

            <p className="text-zinc-300 mt-5 text-lg leading-relaxed">
              Melde dich mit einem aktiven PostgreSQL-Benutzer an.
              Die alte LocalStorage-Anmeldung wurde entfernt.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
            <div className="bg-white/10 rounded-2xl p-5">
              <p className="text-sm text-zinc-400">
                Benutzer
              </p>

              <p className="text-3xl font-bold mt-2">
                {users.length}
              </p>
            </div>

            <div className="bg-white/10 rounded-2xl p-5">
              <p className="text-sm text-zinc-400">
                Firmen
              </p>

              <p className="text-3xl font-bold mt-2">
                {companies.length}
              </p>
            </div>

            <div className="bg-white/10 rounded-2xl p-5">
              <p className="text-sm text-zinc-400">
                Abteilungen
              </p>

              <p className="text-3xl font-bold mt-2">
                {departments.length}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          {loading && (
            <div>
              <h2 className="text-3xl font-bold">
                Login wird vorbereitet
              </h2>

              <p className="text-zinc-500 mt-3">
                Benutzer werden aus PostgreSQL geladen...
              </p>
            </div>
          )}

          {!loading && showFirstAdminSetup && (
            <form
              onSubmit={(event) =>
                void handleCreateFirstAdmin(
                  event
                )
              }
              className="space-y-6"
            >
              <div>
                <h2 className="text-3xl font-bold">
                  Ersten Administrator erstellen
                </h2>

                <p className="text-zinc-500 mt-3">
                  Es gibt noch keinen Benutzer in PostgreSQL. Erstelle jetzt den ersten Admin.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4">
                  {error}
                </div>
              )}

              <div>
                <label className="block mb-2 font-medium">
                  Name
                </label>

                <input
                  value={firstAdminName}
                  onChange={(event) =>
                    setFirstAdminName(
                      event.target.value
                    )
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                  placeholder="Administrator"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  E-Mail
                </label>

                <input
                  type="email"
                  value={firstAdminEmail}
                  onChange={(event) =>
                    setFirstAdminEmail(
                      event.target.value
                    )
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                  placeholder="admin@firma.local"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Firma
                </label>

                <select
                  value={firstAdminCompanyId}
                  onChange={(event) => {
                    const companyId =
                      event.target.value;

                    setFirstAdminCompanyId(
                      companyId
                    );

                    const firstDepartment =
                      departments.find(
                        (department) =>
                          department.companyId === companyId
                      );

                    setFirstAdminDepartmentId(
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
                  value={firstAdminDepartmentId}
                  onChange={(event) =>
                    setFirstAdminDepartmentId(
                      event.target.value
                    )
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
                >
                  <option value="">
                    Keine Abteilung
                  </option>

                  {getDepartmentsForFirstAdminCompany().map(
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

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition disabled:opacity-50"
              >
                {submitting
                  ? "Admin wird erstellt..."
                  : "Admin erstellen und anmelden"}
              </button>
            </form>
          )}

          {!loading && !showFirstAdminSetup && (
            <form
              onSubmit={(event) =>
                void handleLogin(
                  event
                )
              }
              className="space-y-6"
            >
              <div>
                <h2 className="text-3xl font-bold">
                  Login
                </h2>

                <p className="text-zinc-500 mt-3">
                  Wähle einen aktiven Benutzer oder gib eine E-Mail-Adresse ein.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4">
                  {error}
                </div>
              )}

              <div>
                <label className="block mb-2 font-medium">
                  Benutzer auswählen
                </label>

                <select
                  value={selectedEmail}
                  onChange={(event) =>
                    setSelectedEmail(
                      event.target.value
                    )
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
                >
                  <option value="">
                    Benutzer auswählen
                  </option>

                  {activeUsers.map(
                    (user) => (
                      <option
                        key={user.id}
                        value={user.email}
                      >
                        {user.name} · {getRoleLabel(user.role)} · {user.email}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="relative">
                <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-200" />

                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-sm text-zinc-400">
                    oder
                  </span>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  E-Mail manuell
                </label>

                <input
                  type="email"
                  value={manualEmail}
                  onChange={(event) =>
                    setManualEmail(
                      event.target.value
                    )
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                  placeholder="name@firma.local"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition disabled:opacity-50"
              >
                {submitting
                  ? "Anmelden..."
                  : "Anmelden"}
              </button>

              <button
                type="button"
                onClick={() =>
                  void loadData()
                }
                className="w-full bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
              >
                Benutzer neu laden
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}