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

      const data = (await response.json()) as HealthState;

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
      setDepartments(Array.isArray(nextDepartments) ? nextDepartments : []);
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
        icon: "🧩",
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
        eyebrow="Velunis Workspace"
        title={`Willkommen zurück, ${currentUser?.name || "Dashboard"}`}
        description={`Deine Übersicht für ${
          settings.appName || "Intranet"
        } · ${
          settings.companyName || "Velunis"
        }. Hier siehst du offene Arbeit, wichtige News und den aktuellen Systemstatus.`}
        badges={[
          {
            label: getRoleLabel(currentUser?.role),
          },
          {
            label: currentUser?.company || "Velunis",
          },
          {
            label: currentUser?.department || "Keine Abteilung",
          },
          {
            label: `Datenbank: ${getHealthLabel(health)}`,
          },
        ]}
        actions={
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
          >
            Aktualisieren
          </button>
        }
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Offene Tickets"
          value={openTickets.length}
          description="Nicht geschlossene Tickets"
          icon="🎫"
          tone="blue"
        />

        <StatCard
          label="Hoch / Dringend"
          value={urgentTickets.length}
          description="Tickets mit erhöhter Priorität"
          icon="⚡"
          tone="orange"
        />

        <StatCard
          label="News"
          value={newsPosts.length}
          description={`${pinnedNews.length} fixiert`}
          icon="📰"
          tone="indigo"
        />

        {userIsAdmin ? (
          <StatCard
            label="Benutzer"
            value={activeUsers.length}
            description={`${users.length} insgesamt`}
            icon="👥"
            tone="purple"
          />
        ) : (
          <StatCard
            label="Organisation"
            value={companies.length + departments.length}
            description="Firmen & Abteilungen"
            icon="🏢"
            tone="purple"
          />
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm xl:col-span-2">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5 mb-6">
            <div>
              <h2 className="text-2xl font-bold">
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

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative overflow-hidden border border-zinc-200 bg-white rounded-3xl p-5 shadow-sm hover:border-indigo-200 hover:shadow-md transition"
              >
                <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full app-accent-bg opacity-10 blur-2xl" />

                <div className="relative flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center text-xl shrink-0">
                    {item.icon}
                  </div>

                  <div>
                    <h3 className="font-black text-zinc-950 group-hover:app-accent-text transition">
                      {item.title}
                    </h3>
                    <p className="text-sm text-zinc-500 mt-2">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h2 className="text-2xl font-bold">
                Ticket-Fortschritt
              </h2>
              <p className="text-zinc-500 mt-1">
                Geschlossene Tickets im Verhältnis zu allen Tickets.
              </p>
            </div>

            <span className="rounded-full app-accent-bg text-white px-3 py-1 text-xs font-black app-brand-shadow">
              {ticketCompletionPercent}%
            </span>
          </div>

          <div className="mt-7">
            <div className="h-3 rounded-full bg-zinc-100 overflow-hidden">
              <div
                className="h-full rounded-full app-accent-bg"
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
                <p className="text-2xl font-black mt-1">
                  {closedTickets.length}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">
                  Gesamt
                </p>
                <p className="text-2xl font-black mt-1">
                  {tickets.length}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-zinc-100 pt-5 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500">
                Firmen
              </span>
              <span className="font-bold">
                {companies.length}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500">
                Abteilungen
              </span>
              <span className="font-bold">
                {departments.length}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500">
                Datenbank
              </span>
              <span
                className={`text-xs px-3 py-1 rounded-full ${getHealthClass(
                  health,
                )}`}
              >
                {getHealthLabel(health)}
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 mb-6">
            <div>
              <h2 className="text-2xl font-bold">
                Deine Tickets
              </h2>
              <p className="text-zinc-500 mt-1">
                Tickets, die dir zugeordnet sind oder von dir erstellt wurden.
              </p>
            </div>

            <Link
              href="/tickets"
              className="bg-zinc-100 text-zinc-900 px-4 py-2 rounded-xl hover:bg-zinc-200 transition font-medium"
            >
              Alle Tickets
            </Link>
          </div>

          {myTickets.length === 0 && (
            <div className="border border-dashed border-zinc-200 rounded-3xl p-8 text-center">
              <h3 className="font-bold">
                Aktuell keine direkt zugeordneten Tickets.
              </h3>
              <p className="text-zinc-500 mt-2">
                Neue oder zugewiesene Tickets erscheinen hier automatisch.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {myTickets.slice(0, 5).map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="block border border-zinc-100 rounded-2xl p-4 hover:bg-zinc-50 transition"
              >
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${getTicketStatusClass(
                      ticket.status,
                    )}`}
                  >
                    {getTicketStatusLabel(ticket.status)}
                  </span>

                  <span
                    className={`text-xs px-3 py-1 rounded-full ${getTicketPriorityClass(
                      ticket.priority,
                    )}`}
                  >
                    {getTicketPriorityLabel(ticket.priority)}
                  </span>
                </div>

                <h3 className="font-black mt-3 line-clamp-1">
                  #{ticket.id} · {ticket.title}
                </h3>

                <p className="text-sm text-zinc-500 mt-2 line-clamp-2">
                  {ticket.description || "Keine Beschreibung vorhanden."}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 mb-6">
            <div>
              <h2 className="text-2xl font-bold">
                Aktuelle News
              </h2>
              <p className="text-zinc-500 mt-1">
                Wichtige Meldungen und neue Beiträge.
              </p>
            </div>

            <Link
              href="/news"
              className="bg-zinc-100 text-zinc-900 px-4 py-2 rounded-xl hover:bg-zinc-200 transition font-medium"
            >
              Alle News
            </Link>
          </div>

          {latestNews.length === 0 && (
            <div className="border border-dashed border-zinc-200 rounded-3xl p-8 text-center">
              <h3 className="font-bold">
                Noch keine News vorhanden.
              </h3>
              <p className="text-zinc-500 mt-2">
                Neue interne Beiträge erscheinen hier.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {latestNews.map((post) => {
              const category = getPostCategory(post);

              return (
                <Link
                  key={post.id}
                  href={`/news/${post.id}`}
                  className="block border border-zinc-100 rounded-2xl p-4 hover:bg-zinc-50 transition"
                >
                  <div className="flex flex-wrap gap-2">
                    {category && (
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${getCategoryClass(
                          category,
                        )}`}
                      >
                        {category}
                      </span>
                    )}

                    {post.pinned && (
                      <span className="text-xs bg-zinc-900 text-white px-3 py-1 rounded-full">
                        Fixiert
                      </span>
                    )}
                  </div>

                  <h3 className="font-black mt-3 line-clamp-1">
                    {post.title}
                  </h3>

                  <p className="text-sm text-zinc-500 mt-2 line-clamp-2">
                    {post.description || "Keine Beschreibung vorhanden."}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 mb-6">
          <div>
            <h2 className="text-2xl font-bold">
              Letzte Tickets
            </h2>
            <p className="text-zinc-500 mt-1">
              Neueste Tickets im System.
            </p>
          </div>

          <Link
            href="/tickets"
            className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition font-bold"
          >
            Tickets öffnen
          </Link>
        </div>

        {latestTickets.length === 0 && (
          <div className="border border-dashed border-zinc-200 rounded-3xl p-8 text-center">
            <h3 className="font-bold">
              Noch keine Tickets vorhanden.
            </h3>
            <p className="text-zinc-500 mt-2">
              Neue Tickets erscheinen hier automatisch.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {latestTickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/tickets/${ticket.id}`}
              className="border border-zinc-100 rounded-2xl p-4 hover:bg-zinc-50 transition"
            >
              <div className="flex flex-wrap gap-2">
                <span
                  className={`text-xs px-3 py-1 rounded-full ${getTicketStatusClass(
                    ticket.status,
                  )}`}
                >
                  {getTicketStatusLabel(ticket.status)}
                </span>

                <span
                  className={`text-xs px-3 py-1 rounded-full ${getTicketPriorityClass(
                    ticket.priority,
                  )}`}
                >
                  {getTicketPriorityLabel(ticket.priority)}
                </span>
              </div>

              <h3 className="font-black mt-3 line-clamp-1">
                #{ticket.id} · {ticket.title}
              </h3>

              <p className="text-sm text-zinc-500 mt-2">
                {ticket.company || "Intern"} · {ticket.department || "Keine Abteilung"}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}