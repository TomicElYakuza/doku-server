"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ticketRepository,
} from "../../lib/ticketRepository";

import {
  newsRepository,
} from "../../lib/newsRepository";

import {
  appSettingsRepository,
} from "../../lib/appSettingsRepository";

import {
  companyRepository,
} from "../../lib/companyRepository";

import {
  adminUserRepository,
} from "../../lib/adminUserRepository";

import {
  getCachedCurrentUser,
  loadCurrentUser,
} from "../../lib/currentUserRepository";

import {
  useFeatureFlags,
} from "../../hooks/useFeatureFlags";

import {
  usePermissions,
} from "../../hooks/usePermissions";

import PageHero from "../../components/PageHero";

import StatCard from "../../components/StatCard";

import type {
  Ticket,
} from "../../types/ticket";

import type {
  NewsPost,
} from "../../types/news";

import type {
  AppSettings,
} from "../../types/settings";

import type {
  Company,
  Department,
} from "../../types/company";

import type {
  AdminUser,
  User,
} from "../../types/user";

type HealthState = {
  ok: boolean;
  database: string;
  error?: string;
};

type QuickLink = {
  title: string;
  description: string;
  href: string;
  icon: string;
  permissionAny?: string[];
  adminOnly?: boolean;
};

function getTicketStatusLabel(
  status: string
) {
  return ticketRepository.getStatusLabel(
    status
  );
}

function getTicketStatusClass(
  status: string
) {
  return ticketRepository.getStatusClass(
    status
  );
}

function getTicketPriorityLabel(
  priority: string
) {
  return ticketRepository.getPriorityLabel(
    priority
  );
}

function getTicketPriorityClass(
  priority: string
) {
  return ticketRepository.getPriorityClass(
    priority
  );
}

function getCategoryClass(
  category: string
) {
  if (category === "System") {
    return "bg-blue-50 text-blue-700";
  }

  if (category === "Tickets") {
    return "bg-orange-100 text-orange-700";
  }

  if (category === "Wiki") {
    return "bg-indigo-50 text-indigo-700";
  }

  if (category === "Organisation") {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-zinc-100 text-zinc-700";
}

function getRoleLabel(
  role?: string
) {
  if (role === "admin") {
    return "Administrator";
  }

  if (role === "department_lead") {
    return "Abteilungsleiter";
  }

  return "Mitarbeiter";
}

export default function DashboardPage() {
  const {
    ticketTemplatesEnabled,
  } =
    useFeatureFlags();

  const {
    isAdmin,
    hasAnyPermission,
  } =
    usePermissions();

  const [currentUser, setCurrentUser] =
    useState<User | null>(
      getCachedCurrentUser()
    );

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [newsPosts, setNewsPosts] =
    useState<NewsPost[]>([]);

  const [settings, setSettings] =
    useState<AppSettings>(
      appSettingsRepository.getDefault()
    );

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [users, setUsers] =
    useState<AdminUser[]>([]);

  const [health, setHealth] =
    useState<HealthState | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadHealth() {
    try {
      const response =
        await fetch(
          "/api/database/health"
        );

      const data =
        await response.json() as HealthState;

      setHealth(
        data
      );
    } catch (healthError) {
      console.error(
        "Datenbankstatus konnte nicht geladen werden:",
        healthError
      );

      setHealth({
        ok:
          false,

        database:
          "error",

        error:
          "Healthcheck nicht erreichbar.",
      });
    }
  }

  async function loadDashboard() {
    try {
      setLoading(
        true
      );

      setError(
        ""
      );

      const nextUser =
        await loadCurrentUser();

      setCurrentUser(
        nextUser
      );

      const [
        nextTickets,
        nextNewsPosts,
        nextSettings,
        nextCompanies,
        nextDepartments,
      ] =
        await Promise.all([
          ticketRepository.list(),
          newsRepository.list(),
          appSettingsRepository.get(),
          companyRepository.listCompanies(),
          companyRepository.listDepartments(),
        ]);

      setTickets(
        Array.isArray(
          nextTickets
        )
          ? nextTickets
          : []
      );

      setNewsPosts(
        Array.isArray(
          nextNewsPosts
        )
          ? nextNewsPosts
          : []
      );

      setSettings(
        nextSettings
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

      if (nextUser?.role === "admin") {
        const nextUsers =
          await adminUserRepository.list();

        setUsers(
          Array.isArray(
            nextUsers
          )
            ? nextUsers
            : []
        );
      } else {
        setUsers(
          []
        );
      }

      await loadHealth();
    } catch (loadError) {
      console.error(
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Dashboard konnte nicht geladen werden."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  const openTickets =
    useMemo(
      () =>
        tickets.filter(
          (ticket) =>
            ticket.status !== "closed"
        ),
      [
        tickets,
      ]
    );

  const closedTickets =
    useMemo(
      () =>
        tickets.filter(
          (ticket) =>
            ticket.status === "closed"
        ),
      [
        tickets,
      ]
    );

  const urgentTickets =
    useMemo(
      () =>
        tickets.filter(
          (ticket) =>
            ticket.priority === "urgent" ||
            ticket.priority === "high"
        ),
      [
        tickets,
      ]
    );

  const myTickets =
    useMemo(
      () => {
        if (!currentUser) {
          return [];
        }

        const userName =
          currentUser.name.toLowerCase();

        const userEmail =
          currentUser.email.toLowerCase();

        return tickets.filter(
          (ticket) => {
            const assignedTo =
              String(
                ticket.assignedTo ||
                  ""
              ).toLowerCase();

            const createdBy =
              String(
                ticket.createdBy ||
                  ""
              ).toLowerCase();

            return (
              assignedTo.includes(
                userName
              ) ||
              assignedTo.includes(
                userEmail
              ) ||
              createdBy.includes(
                userName
              ) ||
              createdBy.includes(
                userEmail
              )
            );
          }
        );
      },
      [
        tickets,
        currentUser,
      ]
    );

  const latestTickets =
    useMemo(
      () =>
        [
          ...tickets,
        ].slice(
          0,
          5
        ),
      [
        tickets,
      ]
    );

  const latestNews =
    useMemo(
      () =>
        [
          ...newsPosts,
        ].slice(
          0,
          4
        ),
      [
        newsPosts,
      ]
    );

  const pinnedNews =
    useMemo(
      () =>
        newsPosts.filter(
          (post) =>
            post.pinned
        ),
      [
        newsPosts,
      ]
    );

  const activeUsers =
    useMemo(
      () =>
        users.filter(
          (user) =>
            user.status === "active"
        ),
      [
        users,
      ]
    );

  const ticketCompletionPercent =
    tickets.length === 0
      ? 0
      : Math.round(
          (
            closedTickets.length /
            tickets.length
          ) * 100
        );

  const quickLinks =
    useMemo(
      () => {
        const links: QuickLink[] = [
          {
            title:
              "Tickets öffnen",

            description:
              "Supportfälle und Aufgaben verwalten",

            href:
              "/tickets",

            icon:
              "🎫",

            permissionAny: [
              "tickets.view",
              "tickets.manage",
            ],
          },
          {
            title:
              "Wiki öffnen",

            description:
              "Dokumentation durchsuchen",

            href:
              "/wiki",

            icon:
              "📚",

            permissionAny: [
              "wiki.view",
              "wiki.manage",
            ],
          },
          {
            title:
              "News lesen",

            description:
              "Aktuelle interne Meldungen",

            href:
              "/news",

            icon:
              "📰",

            permissionAny: [
              "news.view",
              "news.manage",
            ],
          },
          {
            title:
              "Dateien",

            description:
              "Anhänge und Uploads verwalten",

            href:
              "/files",

            icon:
              "📁",

            permissionAny: [
              "files.view",
              "files.manage",
            ],
          },
        ];

        if (ticketTemplatesEnabled) {
          links.push({
            title:
              "Ticket-Vorlagen",

            description:
              "Vorlagen für wiederkehrende Fälle",

            href:
              "/tickets/templates",

            icon:
              "📋",

            permissionAny: [
              "tickets.manage",
              "tickets.templates.view",
              "tickets.templates.manage",
            ],
          });
        }

        if (isAdmin) {
          links.push({
            title:
              "Admin Backend",

            description:
              "Benutzer, Rechte und System verwalten",

            href:
              "/admin",

            icon:
              "⚙️",

            adminOnly:
              true,
          });
        }

        return links;
      },
      [
        ticketTemplatesEnabled,
        isAdmin,
      ]
    );

  const visibleQuickLinks =
    useMemo(
      () =>
        quickLinks.filter(
          (link) => {
            if (link.adminOnly) {
              return isAdmin;
            }

            if (
              !link.permissionAny ||
              link.permissionAny.length === 0
            ) {
              return true;
            }

            return hasAnyPermission(
              link.permissionAny
            );
          }
        ),
      [
        quickLinks,
        isAdmin,
        hasAnyPermission,
      ]
    );

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Willkommen zurück"
        title={currentUser?.name || "Dashboard"}
        description={`Deine Übersicht für ${settings.appName || "Intranet"} · ${settings.companyName || "Intern"}. Hier siehst du offene Arbeit, wichtige News und den Systemstatus.`}
        badges={[
          {
            label:
              getRoleLabel(
                currentUser?.role
              ),
          },
          {
            label:
              currentUser?.company ||
              "Intern",
          },
          {
            label:
              currentUser?.department ||
              "Allgemein",
          },
          {
            label:
              health?.ok
                ? "Datenbank online"
                : "Datenbank unbekannt",
          },
        ]}
        actions={(
          <>
            <button
              type="button"
              onClick={() =>
                void loadDashboard()
              }
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
            >
              Aktualisieren
            </button>

            {isAdmin && (
              <Link
                href="/admin"
                className="bg-white/10 text-white border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/20 transition"
              >
                Admin Backend
              </Link>
            )}
          </>
        )}
      />

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Dashboard wird geladen...
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
        <Link href="/tickets">
          <StatCard
            label="Offene Tickets"
            value={openTickets.length}
            description="Nicht geschlossene Tickets"
            icon="📬"
            tone="blue"
          />
        </Link>

        <Link href="/tickets?priority=urgent">
          <StatCard
            label="Hoch / Dringend"
            value={urgentTickets.length}
            description="Tickets mit erhöhter Priorität"
            icon="🚨"
            tone="red"
          />
        </Link>

        <Link href="/news">
          <StatCard
            label="News"
            value={newsPosts.length}
            description={`${pinnedNews.length} fixiert`}
            icon="📰"
            tone="green"
          />
        </Link>

        {isAdmin ? (
          <Link href="/admin/users">
            <StatCard
              label="Benutzer"
              value={activeUsers.length}
              description={`${users.length} insgesamt`}
              icon="👥"
              tone="indigo"
            />
          </Link>
        ) : (
          <Link href="/wiki">
            <StatCard
              label="Wissen"
              value={companies.length + departments.length}
              description="Organisationsbereiche"
              icon="📚"
              tone="indigo"
            />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <section className="xl:col-span-2 bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div>
              <h2 className="text-2xl font-semibold">
                Schnellzugriff
              </h2>

              <p className="text-zinc-500 mt-1">
                Häufige Bereiche direkt öffnen.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            {visibleQuickLinks.map(
              (item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border border-zinc-200 rounded-3xl p-6 hover:bg-zinc-50 transition"
                >
                  <div className="text-3xl">
                    {item.icon}
                  </div>

                  <h3 className="text-xl font-semibold mt-4">
                    {item.title}
                  </h3>

                  <p className="text-zinc-500 mt-2">
                    {item.description}
                  </p>
                </Link>
              )
            )}
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">
            Ticket-Fortschritt
          </h2>

          <p className="text-zinc-500 mt-1">
            Verhältnis aus geschlossenen zu allen Tickets.
          </p>

          <div className="mt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-5xl font-bold tracking-tight">
                  {ticketCompletionPercent}%
                </p>

                <p className="text-zinc-500 mt-2">
                  abgeschlossen
                </p>
              </div>

              <div className="text-right text-sm text-zinc-500">
                <p>
                  Geschlossen
                </p>

                <p className="font-semibold text-zinc-900">
                  {closedTickets.length}
                </p>

                <p className="mt-2">
                  Gesamt
                </p>

                <p className="font-semibold text-zinc-900">
                  {tickets.length}
                </p>
              </div>
            </div>

            <div className="h-3 bg-zinc-100 rounded-full overflow-hidden mt-6">
              <div
                className="h-full bg-zinc-900 rounded-full transition-all"
                style={{
                  width:
                    `${ticketCompletionPercent}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-zinc-50 p-5">
            <p className="text-sm text-zinc-500">
              Datenbank
            </p>

            <p className="font-semibold mt-1">
              {health?.ok
                ? "Online"
                : "Unbekannt"}
            </p>

            <p className="text-sm text-zinc-500 mt-1">
              {health?.database ||
                "PostgreSQL"}
            </p>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h2 className="text-2xl font-semibold">
                Deine Tickets
              </h2>

              <p className="text-zinc-500 mt-1">
                Tickets, die dir zugeordnet sind oder von dir erstellt wurden.
              </p>
            </div>

            <Link
              href="/tickets"
              className="bg-zinc-100 px-4 py-2 rounded-xl hover:bg-zinc-200 transition text-sm"
            >
              Alle Tickets
            </Link>
          </div>

          <div className="space-y-4 mt-6">
            {myTickets.length === 0 && (
              <p className="text-zinc-500">
                Aktuell keine direkt zugeordneten Tickets.
              </p>
            )}

            {myTickets
              .slice(
                0,
                5
              )
              .map(
                (ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="block border border-zinc-200 rounded-2xl p-5 hover:bg-zinc-50 transition"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-xs px-3 py-1 rounded-full ${getTicketStatusClass(ticket.status)}`}>
                        {getTicketStatusLabel(
                          ticket.status
                        )}
                      </span>

                      <span className={`text-xs px-3 py-1 rounded-full ${getTicketPriorityClass(ticket.priority)}`}>
                        {getTicketPriorityLabel(
                          ticket.priority
                        )}
                      </span>
                    </div>

                    <h3 className="font-semibold mt-3">
                      #{ticket.id} · {ticket.title}
                    </h3>

                    <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                      {ticket.description ||
                        "Keine Beschreibung vorhanden."}
                    </p>
                  </Link>
                )
              )}
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h2 className="text-2xl font-semibold">
                Aktuelle News
              </h2>

              <p className="text-zinc-500 mt-1">
                Wichtige Meldungen und neue Beiträge.
              </p>
            </div>

            <Link
              href="/news"
              className="bg-zinc-100 px-4 py-2 rounded-xl hover:bg-zinc-200 transition text-sm"
            >
              Alle News
            </Link>
          </div>

          <div className="space-y-4 mt-6">
            {latestNews.length === 0 && (
              <p className="text-zinc-500">
                Noch keine News vorhanden.
              </p>
            )}

            {latestNews.map(
              (post) => (
                <Link
                  key={post.id}
                  href={`/news/${post.id}`}
                  className="block border border-zinc-200 rounded-2xl p-5 hover:bg-zinc-50 transition"
                >
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full ${getCategoryClass(
                      String(
                        post.category ||
                          "Allgemein"
                      )
                    )}`}>
                      {post.category ||
                        "Allgemein"}
                    </span>

                    {post.pinned && (
                      <span className="text-xs bg-zinc-900 text-white px-3 py-1 rounded-full">
                        Fixiert
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold mt-3">
                    {post.title}
                  </h3>

                  <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                    {post.description ||
                      "Keine Beschreibung vorhanden."}
                  </p>
                </Link>
              )
            )}
          </div>
        </section>
      </div>

      <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <div className="flex items-start justify-between gap-5">
          <div>
            <h2 className="text-2xl font-semibold">
              Letzte Tickets
            </h2>

            <p className="text-zinc-500 mt-1">
              Neueste Tickets im System.
            </p>
          </div>

          <Link
            href="/tickets"
            className="bg-zinc-100 px-4 py-2 rounded-xl hover:bg-zinc-200 transition text-sm"
          >
            Tickets öffnen
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6">
          {latestTickets.length === 0 && (
            <p className="text-zinc-500">
              Noch keine Tickets vorhanden.
            </p>
          )}

          {latestTickets.map(
            (ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="border border-zinc-200 rounded-2xl p-5 hover:bg-zinc-50 transition"
              >
                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs px-3 py-1 rounded-full ${getTicketStatusClass(ticket.status)}`}>
                    {getTicketStatusLabel(
                      ticket.status
                    )}
                  </span>

                  <span className={`text-xs px-3 py-1 rounded-full ${getTicketPriorityClass(ticket.priority)}`}>
                    {getTicketPriorityLabel(
                      ticket.priority
                    )}
                  </span>
                </div>

                <h3 className="font-semibold mt-3">
                  #{ticket.id} · {ticket.title}
                </h3>

                <p className="text-sm text-zinc-500 mt-2">
                  {ticket.company ||
                    "Intern"}{" "}
                  ·{" "}
                  {ticket.department ||
                    "Allgemein"}
                </p>
              </Link>
            )
          )}
        </div>
      </section>
    </div>
  );
}