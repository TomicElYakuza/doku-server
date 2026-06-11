"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AccessDeniedCard from "../../components/AccessDeniedCard";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import PageHero from "../../components/PageHero";
import {
  usePermissions,
} from "../../hooks/usePermissions";
import StatCard from "../../components/StatCard";
import {
  appSettingsRepository,
} from "../../lib/appSettingsRepository";
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
  NewsPost,
} from "../../types/news";
import type {
  AppSettings,
} from "../../types/settings";
import type {
  Ticket,
} from "../../types/ticket";
import type {
  User,
} from "../../types/user";

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
    loading: permissionsLoading,
    permissionKeys,
    hasPermission,
    isAdmin: permissionUserIsAdmin,
  } = usePermissions();
  const [
    currentUser,
    setCurrentUser,
  ] = useState<User | null>(getCachedCurrentUser());

  const [
    tickets,
    setTickets,
  ] = useState<Ticket[]>([]);

  const [
    newsPosts,
    setNewsPosts,
  ] = useState<NewsPost[]>([]);

  const [
    settings,
    setSettings,
  ] = useState<AppSettings>(appSettingsRepository.getDefault());

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    if (permissionsLoading) {
      return;
    }

    void loadDashboard();

    function handleDashboardRefresh() {
      void loadDashboard();
    }

    window.addEventListener(
      "ticketsUpdated",
      handleDashboardRefresh,
    );
    window.addEventListener(
      "ticketUpdated",
      handleDashboardRefresh,
    );
    window.addEventListener(
      "newsUpdated",
      handleDashboardRefresh,
    );
    window.addEventListener(
      "appSettingsUpdated",
      handleDashboardRefresh,
    );
    window.addEventListener(
      "currentUserUpdated",
      handleDashboardRefresh,
    );

    return () => {
      window.removeEventListener(
        "ticketsUpdated",
        handleDashboardRefresh,
      );
      window.removeEventListener(
        "ticketUpdated",
        handleDashboardRefresh,
      );
      window.removeEventListener(
        "newsUpdated",
        handleDashboardRefresh,
      );
      window.removeEventListener(
        "appSettingsUpdated",
        handleDashboardRefresh,
      );
      window.removeEventListener(
        "currentUserUpdated",
        handleDashboardRefresh,
      );
    };
  }, [
    permissionsLoading,
    permissionUserIsAdmin,
    permissionKeys,
  ]);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const nextUser = await loadCurrentUser();

      const nextSettings =
        await appSettingsRepository.get().catch((settingsError) => {
          console.warn(
            "App-Einstellungen konnten im Dashboard nicht geladen werden:",
            settingsError,
          );

          return appSettingsRepository.getDefault();
        });

      const nextUserIsAdmin =
        nextUser?.role === "admin" || permissionUserIsAdmin;

      const nextCanViewTickets =
        nextUserIsAdmin || hasPermission("tickets.view");

      const nextCanViewNews =
        nextUserIsAdmin || hasPermission("news.view");

      const [
        nextTickets,
        nextNewsPosts,
      ] = await Promise.all([
        nextCanViewTickets
          ? ticketRepository.list().catch((ticketError) => {
              console.warn(
                "Tickets konnten im Dashboard nicht geladen werden:",
                ticketError,
              );

              return [];
            })
          : Promise.resolve([]),
        nextCanViewNews
          ? newsRepository.list().catch((newsError) => {
              console.warn(
                "News konnten im Dashboard nicht geladen werden:",
                newsError,
              );

              return [];
            })
          : Promise.resolve([]),
      ]);

      setCurrentUser(nextUser);
      setTickets(Array.isArray(nextTickets) ? nextTickets : []);
      setNewsPosts(Array.isArray(nextNewsPosts) ? nextNewsPosts : []);
      setSettings(nextSettings);
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

  const urgentTickets = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          ticket.status !== "closed" &&
          (
            ticket.priority === "urgent" ||
            ticket.priority === "high"
          ),
      ),
    [
      tickets,
    ],
  );

  const myTickets = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    const userName = String(currentUser.name || "").toLowerCase();
    const userEmail = String(currentUser.email || "").toLowerCase();

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

  const myOpenTickets = useMemo(
    () => myTickets.filter((ticket) => ticket.status !== "closed"),
    [
      myTickets,
    ],
  );

  const closedTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status === "closed"),
    [
      tickets,
    ],
  );

  const latestTickets = useMemo(
    () => [
      ...tickets,
    ].slice(0, 6),
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

  const ticketCompletionPercent =
    tickets.length === 0
      ? 0
      : Math.round((closedTickets.length / tickets.length) * 100);

  const userIsAdmin =
    currentUser?.role === "admin" || permissionUserIsAdmin;

  const canViewDashboard =
    userIsAdmin || hasPermission("dashboard.view");

  const canViewTickets =
    userIsAdmin || hasPermission("tickets.view");

  const canViewNews =
    userIsAdmin || hasPermission("news.view");

  if (permissionsLoading) {
    return (
      <LoadingState
        title="Berechtigungen werden geprüft..."
        description="Dein Dashboard-Zugriff wird vorbereitet."
      />
    );
  }

  if (!canViewDashboard) {
    return (
      <AccessDeniedCard
        title="Dashboard nicht freigegeben"
        description="Dein Benutzer hat keine Berechtigung für das Dashboard. Ein Administrator kann das Recht dashboard.view vergeben."
        backHref="/forbidden"
        backLabel="Zur Fehlerseite"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Dashboard"
        title={`Willkommen${currentUser?.name ? `, ${currentUser.name}` : ""}`}
        description={`${settings.appName || "Intranet"} zeigt dir deine wichtigsten Aufgaben, offenen Punkte und aktuellen Meldungen.`}
        badges={[
          {
            label: currentUser
              ? getRoleLabel(currentUser.role)
              : "Benutzer",
          },
          {
            label: settings.appVersion || settings.version || "Version",
          },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
            >
              Aktualisieren
            </button>

            {canViewTickets && (
              <Link
                href="/tickets"
                className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
              >
                Tickets öffnen
              </Link>
            )}

            {userIsAdmin && (
              <Link
                href="/admin"
                className="bg-white/15 text-white px-5 py-3 rounded-2xl transition font-bold hover:bg-white/25 border border-white/20"
              >
                Admin Backend
              </Link>
            )}
          </div>
        }
      />

      {loading && (
        <LoadingState
          title="Dashboard wird geladen..."
          description="Deine Aufgaben und Meldungen werden vorbereitet."
        />
      )}

      {error && (
        <EmptyState
          icon="⚠"
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Meine offenen Punkte"
              value={myOpenTickets.length}
              description="Dir zugeordnet oder von dir erstellt"
              tone="indigo"
              icon="◎"
            />

            <StatCard
              label="Offene Tickets"
              value={openTickets.length}
              description="Aktive Fälle im System"
              tone="blue"
              icon="◫"
            />

            <StatCard
              label="Hohe Priorität"
              value={urgentTickets.length}
              description="Dringend oder hoch priorisiert"
              tone={urgentTickets.length > 0 ? "orange" : "green"}
              icon="!"
            />

            <StatCard
              label="Aktuelle News"
              value={newsPosts.length}
              description={`${pinnedNews.length} fixierte Meldungen`}
              tone="purple"
              icon="●"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="app-surface rounded-3xl p-6 xl:col-span-2">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xl font-black text-zinc-950">
                    Meine Tickets
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    Offene Tickets mit direktem Bezug zu dir.
                  </p>
                </div>

                <Link
                  href="/tickets"
                  className="text-sm font-bold app-accent-text hover:underline"
                >
                  Alle Tickets
                </Link>
              </div>

              {myOpenTickets.length === 0 && (
                <div className="app-muted-surface rounded-3xl p-8">
                  <EmptyState
                    icon="✓"
                    title="Keine eigenen offenen Tickets"
                    description="Aktuell sind dir keine offenen Tickets direkt zugeordnet."
                  />
                </div>
              )}

              {myOpenTickets.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {myOpenTickets.slice(0, 6).map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={`/tickets/${encodeURIComponent(String(ticket.id))}`}
                      className="app-muted-surface app-card-hover block rounded-2xl p-4 transition"
                    >
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${getTicketStatusClass(ticket.status)}`}
                        >
                          {getTicketStatusLabel(ticket.status)}
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${getTicketPriorityClass(ticket.priority)}`}
                        >
                          {getTicketPriorityLabel(ticket.priority)}
                        </span>
                      </div>

                      <h3 className="font-black text-zinc-950">
                        #{ticket.id} · {ticket.title}
                      </h3>
                      <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                        {ticket.description || "Keine Beschreibung vorhanden."}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="app-surface rounded-3xl p-6">
              <div>
                <h2 className="text-xl font-black text-zinc-950">
                  Arbeitsstatus
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Ticket-Fortschritt im aktuellen Bereich.
                </p>
              </div>

              <div className="mt-6">
                <div className="flex items-end justify-between gap-4 mb-3">
                  <span className="text-5xl font-black text-zinc-950">
                    {ticketCompletionPercent}%
                  </span>
                  <span className="text-sm font-bold text-zinc-500">
                    abgeschlossen
                  </span>
                </div>

                <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800">
                  <div
                    className="h-full app-accent-bg rounded-full transition-all"
                    style={{
                      width: `${ticketCompletionPercent}%`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="app-muted-surface rounded-2xl p-4">
                    <p className="text-xs font-bold text-zinc-500 uppercase">
                      Offen
                    </p>
                    <p className="text-2xl font-black text-zinc-950">
                      {openTickets.length}
                    </p>
                  </div>

                  <div className="app-muted-surface rounded-2xl p-4">
                    <p className="text-xs font-bold text-zinc-500 uppercase">
                      Erledigt
                    </p>
                    <p className="text-2xl font-black text-zinc-950">
                      {closedTickets.length}
                    </p>
                  </div>
                </div>

                <div className="app-muted-surface mt-4 rounded-2xl p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                    Rolle
                  </p>
                  <p className="mt-1 font-black text-zinc-950">
                    {getRoleLabel(currentUser?.role)}
                  </p>
                  <p className="text-sm text-zinc-500 mt-1">
                    Admin- und Datenbankdetails liegen im Admin Backend.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <section className="app-surface rounded-3xl p-6">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xl font-black text-zinc-950">
                    Letzte Ticket-Aktivität
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    Neueste Tickets im System.
                  </p>
                </div>

                <Link
                  href="/tickets"
                  className="text-sm font-bold app-accent-text hover:underline"
                >
                  Tickets öffnen
                </Link>
              </div>

              {latestTickets.length === 0 && (
                <EmptyState
                  icon="◫"
                  title="Keine Tickets vorhanden"
                  description="Neue Supportfälle erscheinen automatisch in dieser Übersicht."
                />
              )}

              {latestTickets.length > 0 && (
                <div className="space-y-3">
                  {latestTickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={`/tickets/${encodeURIComponent(String(ticket.id))}`}
                      className="app-muted-surface app-card-hover block rounded-2xl p-4 transition"
                    >
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${getTicketStatusClass(ticket.status)}`}
                        >
                          {getTicketStatusLabel(ticket.status)}
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${getTicketPriorityClass(ticket.priority)}`}
                        >
                          {getTicketPriorityLabel(ticket.priority)}
                        </span>
                      </div>

                      <h3 className="font-black text-zinc-950">
                        #{ticket.id} · {ticket.title}
                      </h3>
                      <p className="text-sm text-zinc-500 mt-1">
                        {ticket.company || "Intern"} ·{" "}
                        {ticket.department || "Keine Abteilung"}
                      </p>
                      <p className="text-xs text-zinc-400 mt-20">
                        Aktualisiert: {formatDate(ticket.updatedAt)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="app-surface rounded-3xl p-6">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xl font-black text-zinc-950">
                    Aktuelle News
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    Wichtige Meldungen und neue Beiträge.
                  </p>
                </div>

                <Link
                  href="/news"
                  className="text-sm font-bold app-accent-text hover:underline"
                >
                  Alle News
                </Link>
              </div>

              {latestNews.length === 0 && (
                <EmptyState
                  icon="●"
                  title="Keine News vorhanden"
                  description="Sobald interne Meldungen erstellt werden, erscheinen sie hier."
                />
              )}

              {latestNews.length > 0 && (
                <div className="space-y-3">
                  {latestNews.map((post) => {
                    const category = getPostCategory(post);

                    return (
                      <article
                        key={post.id}
                        className="app-muted-surface rounded-2xl p-4"
                      >
                        <div className="flex flex-wrap gap-2 mb-3">
                          {category && (
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-full ${getCategoryClass(category)}`}
                            >
                              {category}
                            </span>
                          )}

                          {post.pinned && (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                              Fixiert
                            </span>
                          )}
                        </div>

                        <h3 className="font-black text-zinc-950">
                          {post.title}
                        </h3>
                        <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                          {post.description || "Keine Beschreibung vorhanden."}
                        </p>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
