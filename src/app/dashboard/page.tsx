"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import PageHero from "../../components/PageHero";
import StatCard from "../../components/StatCard";
import {
  useFeatureFlags,
} from "../../hooks/useFeatureFlags";
import {
  adminUserRepository,
} from "../../lib/adminUserRepository";
import {
  appSettingsRepository,
} from "../../lib/appSettingsRepository";
import {
  companyRepository,
} from "../../lib/companyRepository";
import {
  getCachedCurrentUser,
  loadCurrentUser,
} from "../../lib/currentUserRepository";
import {
  newsRepository,
} from "../../lib/newsRepository";
import {
  ticketRepository,
} from "../../lib/ticketRepository";
import type {
  Company,
  Department,
} from "../../types/company";
import type {
  NewsPost,
} from "../../types/news";
import type {
  AppSettings,
} from "../../types/settings";
import type {
  Ticket,
} from "../../types/ticket";
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
};

function getTicketStatusLabel(status: string) {
  return ticketRepository.getStatusLabel(status);
}

function getTicketStatusClass(status: string) {
  return ticketRepository.getStatusClass(status);
}

function getTicketPriorityLabel(priority: string) {
  return ticketRepository.getPriorityLabel(priority);
}

function getTicketPriorityClass(priority: string) {
  return ticketRepository.getPriorityClass(priority);
}

function getCategoryClass(category: string) {
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

function getRoleLabel(role?: string) {
  if (role === "admin") {
    return "Administrator";
  }

  if (role === "department_lead") {
    return "Abteilungsleiter";
  }

  return "Mitarbeiter";
}

function getPostCategory(post: NewsPost) {
  return String(post.category || "");
}

function getHealthLabel(health: HealthState | null) {
  if (!health) {
    return "Unbekannt";
  }

  if (health.ok) {
    return "Online";
  }

  return "Fehler";
}

function getHealthClass(health: HealthState | null) {
  if (!health) {
    return "bg-zinc-100 text-zinc-600 border border-zinc-200";
  }

  if (health.ok) {
    return "bg-green-50 text-green-700 border border-green-100";
  }

  return "bg-red-50 text-red-700 border border-red-100";
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  try {
    return new Date(value).toLocaleString("de-AT");
  } catch {
    return value;
  }
}

export default function DashboardPage() {
  const {
    ticketTemplatesEnabled,
  } = useFeatureFlags();

  const [currentUser, setCurrentUser] = useState<User | null>(
    getCachedCurrentUser(),
  );
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([]);
  const [settings, setSettings] = useState<AppSettings>(
    appSettingsRepository.getDefault(),
  );
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [health, setHealth] = useState<HealthState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadHealth() {
    try {
      const response = await fetch("/api/database/health", {
        cache: "no-store",
      });

      const data = await response.json() as HealthState;

      setHealth(data);
    } catch (healthError) {
      console.error(
        "Datenbankstatus konnte nicht geladen werden:",
        healthError,
      );

      setHealth({
        ok: false,
        database: "error",
        error: "Healthcheck nicht erreichbar.",
      });
    }
  }

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [
        nextUser,
        nextTickets,
        nextNewsPosts,
        nextSettings,
        nextCompanies,
        nextDepartments,
        nextUsers,
      ] = await Promise.all([
        loadCurrentUser(),
        ticketRepository.list(),
        newsRepository.list(),
        appSettingsRepository.get(),
        companyRepository.listCompanies(),
        companyRepository.listDepartments(),
        adminUserRepository.list(),
      ]);

      setCurrentUser(nextUser);
      setTickets(Array.isArray(nextTickets) ? nextTickets : []);
      setNewsPosts(Array.isArray(nextNewsPosts) ? nextNewsPosts : []);
      setSettings(nextSettings);
      setCompanies(Array.isArray(nextCompanies) ? nextCompanies : []);
      setDepartments(
        Array.isArray(nextDepartments) ? nextDepartments : [],
      );
      setUsers(Array.isArray(nextUsers) ? nextUsers : []);

      await loadHealth();
    } catch (loadError) {
      console.error(loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Dashboard konnte nicht geladen werden.",
      );
    } finally {
      setLoading(false);
    }
  }

  const openTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status !== "closed"),
    [
      tickets,
    ],
  );

  const closedTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status === "closed"),
    [
      tickets,
    ],
  );

  const urgentTickets = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          ticket.priority === "urgent" ||
          ticket.priority === "high",
      ),
    [
      tickets,
    ],
  );

  const myTickets = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    const userName = currentUser.name.toLowerCase();
    const userEmail = currentUser.email.toLowerCase();

    return tickets.filter((ticket) => {
      const assignedTo = String(ticket.assignedTo || "").toLowerCase();
      const createdBy = String(ticket.createdBy || "").toLowerCase();

      return (
        assignedTo.includes(userName) ||
        assignedTo.includes(userEmail) ||
        createdBy.includes(userName) ||
        createdBy.includes(userEmail)
      );
    });
  }, [
    tickets,
    currentUser,
  ]);

  const latestTickets = useMemo(
    () => [
      ...tickets,
    ].slice(0, 5),
    [
      tickets,
    ],
  );

  const latestNews = useMemo(
    () => [
      ...newsPosts,
    ].slice(0, 4),
    [
      newsPosts,
    ],
  );

  const pinnedNews = useMemo(
    () => newsPosts.filter((post) => post.pinned),
    [
      newsPosts,
    ],
  );

  const activeUsers = useMemo(
    () => users.filter((user) => user.status === "active"),
    [
      users,
    ],
  );

  const ticketCompletionPercent =
    tickets.length === 0
      ? 0
      : Math.round((closedTickets.length / tickets.length) * 100);

  const quickLinks = useMemo(() => {
    const links: QuickLink[] = [
      {
        title: "Tickets öffnen",
        description: "Supportfälle und Aufgaben verwalten",
        href: "/tickets",
        icon: "🎫",
      },
      {
        title: "Wiki öffnen",
        description: "Dokumentation durchsuchen",
        href: "/wiki",
        icon: "📚",
      },
      {
        title: "News lesen",
        description: "Aktuelle interne Meldungen",
        href: "/news",
        icon: "📰",
      },
      {
        title: "Dateien",
        description: "Anhänge und Uploads verwalten",
        href: "/files",
        icon: "📁",
      },
    ];

    if (ticketTemplatesEnabled) {
      links.push({
        title: "Ticket-Vorlagen",
        description: "Vorlagen für wiederkehrende Fälle",
        href: "/tickets/templates",
        icon: "🧾",
      });
    }

    return links;
  }, [
    ticketTemplatesEnabled,
  ]);

  const userIsAdmin = currentUser?.role === "admin";

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow={settings.companyName || "Velunis Workspace"}
        title={`Willkommen${currentUser?.name ? `, ${currentUser.name}` : ""}`}
        description="Dein zentraler Überblick über Tickets, News, Organisation und Systemstatus."
        badges={[
          {
            label: getRoleLabel(currentUser?.role),
          },
          {
            label: `${openTickets.length} offene Tickets`,
          },
          {
            label: `${pinnedNews.length} fixierte News`,
          },
          {
            label: getHealthLabel(health),
          },
        ]}
        actions={
          <>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
            >
              Aktualisieren
            </button>

            {userIsAdmin && (
              <Link
                href="/admin"
                className="bg-white/10 text-white border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/20 transition font-bold"
              >
                Admin Backend
              </Link>
            )}
          </>
        }
      />

      {loading && (
        <LoadingState
          title="Dashboard wird geladen..."
          description="Tickets, News, Organisation und Systemstatus werden vorbereitet."
        />
      )}

      {error && (
        <EmptyState
          icon="⚠️"
          title="Dashboard konnte nicht geladen werden"
          description={error}
          action={
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
            >
              Erneut laden
            </button>
          }
        />
      )}

      {!loading && !error && (
        <>
          {userIsAdmin ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <StatCard
                label="Offene Tickets"
                value={openTickets.length}
                description={`${closedTickets.length} geschlossen`}
                icon="🎫"
                tone="orange"
              />

              <StatCard
                label="Benutzer"
                value={activeUsers.length}
                description={`${users.length} Benutzer gesamt`}
                icon="👥"
                tone="blue"
              />

              <StatCard
                label="Organisation"
                value={companies.length}
                description={`${departments.length} Abteilungen`}
                icon="🏢"
                tone="indigo"
              />

              <StatCard
                label="Datenbank"
                value={getHealthLabel(health)}
                description={health?.database || "PostgreSQL"}
                icon={health?.ok ? "✅" : "⚠️"}
                tone={health?.ok ? "green" : "red"}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <StatCard
                label="Meine Tickets"
                value={myTickets.length}
                description="Zugeordnet oder erstellt"
                icon="👤"
                tone="blue"
              />

              <StatCard
                label="Offene Tickets"
                value={openTickets.length}
                description={`${urgentTickets.length} wichtig`}
                icon="🎫"
                tone="orange"
              />

              <StatCard
                label="News"
                value={newsPosts.length}
                description={`${pinnedNews.length} fixiert`}
                icon="📰"
                tone="indigo"
              />

              <StatCard
                label="Datenbank"
                value={getHealthLabel(health)}
                description={health?.database || "PostgreSQL"}
                icon={health?.ok ? "✅" : "⚠️"}
                tone={health?.ok ? "green" : "red"}
              />
            </div>
          )}

          <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-8">
            <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

              <div className="relative">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                  <div>
                    <h2 className="text-2xl font-black">
                      Schnellzugriff
                    </h2>

                    <p className="text-zinc-500 mt-1">
                      Häufige Bereiche direkt öffnen.
                    </p>
                  </div>

                  <span className="rounded-full app-accent-soft app-accent-text px-4 py-2 text-sm font-bold">
                    {quickLinks.length} Bereiche
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {quickLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group border border-zinc-200 rounded-3xl p-5 hover:border-indigo-200 hover:shadow-md transition bg-white"
                    >
                      <div className="h-12 w-12 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center text-2xl">
                        {item.icon}
                      </div>

                      <h3 className="font-black text-zinc-950 mt-4 group-hover:app-accent-text transition">
                        {item.title}
                      </h3>

                      <p className="text-zinc-500 mt-2 leading-7">
                        {item.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

              <div className="relative">
                <h2 className="text-2xl font-black">
                  Ticket-Fortschritt
                </h2>

                <p className="text-zinc-500 mt-1">
                  Geschlossene Tickets im Verhältnis zu allen Tickets.
                </p>

                <div className="mt-7">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-5xl font-black tracking-[-0.06em] text-zinc-950">
                        {ticketCompletionPercent}%
                      </p>

                      <p className="text-zinc-500 mt-1">
                        abgeschlossen
                      </p>
                    </div>

                    <span
                      className={`px-4 py-2 rounded-full text-sm font-bold ${getHealthClass(
                        health,
                      )}`}
                    >
                      {getHealthLabel(health)}
                    </span>
                  </div>

                  <div className="h-4 bg-zinc-100 rounded-full overflow-hidden mt-6">
                    <div
                      className="h-full app-accent-bg rounded-full transition-all"
                      style={{
                        width: `${ticketCompletionPercent}%`,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-zinc-50 rounded-2xl p-4">
                      <p className="text-xs text-zinc-500">
                        Geschlossen
                      </p>
                      <p className="font-black text-2xl mt-1">
                        {closedTickets.length}
                      </p>
                    </div>

                    <div className="bg-zinc-50 rounded-2xl p-4">
                      <p className="text-xs text-zinc-500">
                        Gesamt
                      </p>
                      <p className="font-black text-2xl mt-1">
                        {tickets.length}
                      </p>
                    </div>

                    <div className="bg-zinc-50 rounded-2xl p-4">
                      <p className="text-xs text-zinc-500">
                        Firmen
                      </p>
                      <p className="font-black text-2xl mt-1">
                        {companies.length}
                      </p>
                    </div>

                    <div className="bg-zinc-50 rounded-2xl p-4">
                      <p className="text-xs text-zinc-500">
                        Abteilungen
                      </p>
                      <p className="font-black text-2xl mt-1">
                        {departments.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

              <div className="relative">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <h2 className="text-2xl font-black">
                      Deine Tickets
                    </h2>

                    <p className="text-zinc-500 mt-1">
                      Tickets, die dir zugeordnet sind oder von dir erstellt wurden.
                    </p>
                  </div>

                  <Link
                    href="/tickets"
                    className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition font-bold shrink-0"
                  >
                    Alle Tickets
                  </Link>
                </div>

                {myTickets.length === 0 && (
                  <div className="mt-6">
                    <EmptyState
                      icon="🎫"
                      title="Aktuell keine direkt zugeordneten Tickets"
                      description="Neue oder zugewiesene Tickets erscheinen hier automatisch."
                    />
                  </div>
                )}

                <div className="space-y-3 mt-6">
                  {myTickets.slice(0, 5).map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={`/tickets/${ticket.id}`}
                      className="block border border-zinc-200 rounded-2xl p-4 hover:border-indigo-200 hover:bg-zinc-50 transition"
                    >
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-bold ${getTicketStatusClass(
                            ticket.status,
                          )}`}
                        >
                          {getTicketStatusLabel(ticket.status)}
                        </span>

                        <span
                          className={`text-xs px-3 py-1 rounded-full font-bold ${getTicketPriorityClass(
                            ticket.priority,
                          )}`}
                        >
                          {getTicketPriorityLabel(ticket.priority)}
                        </span>
                      </div>

                      <h3 className="font-black text-zinc-950 mt-3 line-clamp-1">
                        #{ticket.id} · {ticket.title}
                      </h3>

                      <p className="text-zinc-500 mt-2 line-clamp-2">
                        {ticket.description || "Keine Beschreibung vorhanden."}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

              <div className="relative">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <h2 className="text-2xl font-black">
                      Aktuelle News
                    </h2>

                    <p className="text-zinc-500 mt-1">
                      Wichtige Meldungen und neue Beiträge.
                    </p>
                  </div>

                  <Link
                    href="/news"
                    className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition font-bold shrink-0"
                  >
                    Alle News
                  </Link>
                </div>

                {latestNews.length === 0 && (
                  <div className="mt-6">
                    <EmptyState
                      icon="📰"
                      title="Noch keine News vorhanden"
                      description="Neue interne Beiträge erscheinen hier."
                    />
                  </div>
                )}

                <div className="space-y-3 mt-6">
                  {latestNews.map((post) => {
                    const category = getPostCategory(post);

                    return (
                      <Link
                        key={post.id}
                        href={`/news/${post.id}`}
                        className="block border border-zinc-200 rounded-2xl p-4 hover:border-indigo-200 hover:bg-zinc-50 transition"
                      >
                        <div className="flex flex-wrap gap-2">
                          {category && (
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-bold ${getCategoryClass(
                                category,
                              )}`}
                            >
                              {category}
                            </span>
                          )}

                          {post.pinned && (
                            <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
                              Fixiert
                            </span>
                          )}
                        </div>

                        <h3 className="font-black text-zinc-950 mt-3 line-clamp-1">
                          {post.title}
                        </h3>

                        <p className="text-zinc-500 mt-2 line-clamp-2">
                          {post.description || "Keine Beschreibung vorhanden."}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          </section>

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

            <div className="relative">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                <div>
                  <h2 className="text-2xl font-black">
                    Letzte Tickets
                  </h2>

                  <p className="text-zinc-500 mt-1">
                    Neueste Tickets im System.
                  </p>
                </div>

                <Link
                  href="/tickets"
                  className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
                >
                  Tickets öffnen
                </Link>
              </div>

              {latestTickets.length === 0 && (
                <div className="mt-6">
                  <EmptyState
                    icon="🎫"
                    title="Noch keine Tickets vorhanden"
                    description="Neue Tickets erscheinen hier automatisch."
                  />
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6">
                {latestTickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="border border-zinc-200 rounded-3xl p-5 hover:border-indigo-200 hover:shadow-md transition bg-white"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-bold ${getTicketStatusClass(
                          ticket.status,
                        )}`}
                      >
                        {getTicketStatusLabel(ticket.status)}
                      </span>

                      <span
                        className={`text-xs px-3 py-1 rounded-full font-bold ${getTicketPriorityClass(
                          ticket.priority,
                        )}`}
                      >
                        {getTicketPriorityLabel(ticket.priority)}
                      </span>
                    </div>

                    <h3 className="font-black text-zinc-950 mt-4 line-clamp-1">
                      #{ticket.id} · {ticket.title}
                    </h3>

                    <p className="text-sm text-zinc-500 mt-3">
                      {ticket.company || "Intern"} ·{" "}
                      {ticket.department || "Keine Abteilung"}
                    </p>

                    <p className="text-xs text-zinc-400 mt-3">
                      Aktualisiert: {formatDate(ticket.updatedAt)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}