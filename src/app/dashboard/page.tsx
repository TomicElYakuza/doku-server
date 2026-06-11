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

type FocusItem = {
  key: string;
  title: string;
  description: string;
  href: string;
  badge: string;
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

  return "bg-zinc-100 text-zinc-700 dark:text-zinc-200";
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
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [
        nextUser,
        nextTickets,
        nextNewsPosts,
        nextSettings,
      ] = await Promise.all([
        loadCurrentUser(),
        ticketRepository.list(),
        newsRepository.list(),
        appSettingsRepository.get(),
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

  const ticketCompletionPercent =
    tickets.length === 0
      ? 0
      : Math.round((closedTickets.length / tickets.length) * 100);

  const focusItems = useMemo(() => {
    const items: FocusItem[] = [];
    const usedTicketIds = new Set<string>();

    myOpenTickets.slice(0, 2).forEach((ticket) => {
      const id = String(ticket.id);

      usedTicketIds.add(id);

      items.push({
        key: `my-ticket-${id}`,
        title: ticket.title,
        description: ticket.description || "Dieses Ticket ist dir zugeordnet oder wurde von dir erstellt.",
        href: `/tickets/${encodeURIComponent(id)}`,
        badge: "Mein Ticket",
        icon: "◎",
      });
    });

    urgentTickets
      .filter((ticket) => !usedTicketIds.has(String(ticket.id)))
      .slice(0, 2)
      .forEach((ticket) => {
        const id = String(ticket.id);

        items.push({
          key: `urgent-ticket-${id}`,
          title: ticket.title,
          description: ticket.description || "Dieses Ticket hat eine hohe Priorität.",
          href: `/tickets/${encodeURIComponent(id)}`,
          badge: getTicketPriorityLabel(ticket.priority),
          icon: "!",
        });
      });

    pinnedNews.slice(0, 2).forEach((post) => {
      items.push({
        key: `news-${post.id}`,
        title: post.title,
        description: post.description || "Fixierte interne Meldung.",
        href: "/news",
        badge: "News",
        icon: "●",
      });
    });

    return items.slice(0, 5);
  }, [
    myOpenTickets,
    urgentTickets,
    pinnedNews,
  ]);

  const userIsAdmin = currentUser?.role === "admin";

  return (
    <div className="space-y-8">
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

            <Link
              href="/tickets"
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
            >
              Tickets öffnen
            </Link>

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
            <section className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-6 xl:col-span-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-xl font-black text-zinc-950">
                    Heute im Fokus
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    Was für dich gerade wichtig ist.
                  </p>
                </div>

                <span className="text-xs font-bold px-3 py-2 rounded-full app-accent-soft app-accent-text">
                  {focusItems.length > 0 ? `${focusItems.length} Hinweise` : "Alles ruhig"}
                </span>
              </div>

              {focusItems.length === 0 && (
                <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-8">
                  <EmptyState
                    icon="✓"
                    title="Keine dringenden Punkte"
                    description="Aktuell gibt es keine eigenen offenen Tickets, keine hohen Prioritäten und keine fixierten Meldungen."
                    action={
                      <Link
                        href="/tickets"
                        className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
                      >
                        Tickets prüfen
                      </Link>
                    }
                  />
                </div>
              )}

              {focusItems.length > 0 && (
                <div className="space-y-3">
                  {focusItems.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      className="block border border-zinc-200 rounded-3xl p-5 bg-white hover:border-indigo-200 hover:shadow-sm transition"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl font-black app-accent-text">
                          {item.icon}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full app-accent-soft app-accent-text">
                              {item.badge}
                            </span>
                          </div>

                          <h3 className="font-black text-zinc-950 truncate">
                            {item.title}
                          </h3>
                          <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-6">
              <div>
                <h2 className="text-xl font-black text-zinc-950">
                  Arbeitsstatus
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Ticket-Fortschritt im aktuellen Bereich.
                </p>
              </div>

              <div className="mt-8">
                <div className="flex items-end justify-between gap-4 mb-3">
                  <span className="text-5xl font-black text-zinc-950">
                    {ticketCompletionPercent}%
                  </span>
                  <span className="text-sm font-bold text-zinc-500">
                    abgeschlossen
                  </span>
                </div>

                <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full app-accent-bg rounded-full transition-all"
                    style={{
                      width: `${ticketCompletionPercent}%`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="rounded-2xl border border-zinc-200 p-4">
                    <p className="text-xs font-bold text-zinc-500 uppercase">
                      Offen
                    </p>
                    <p className="text-2xl font-black text-zinc-950">
                      {openTickets.length}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 p-4">
                    <p className="text-xs font-bold text-zinc-500 uppercase">
                      Erledigt
                    </p>
                    <p className="text-2xl font-black text-zinc-950">
                      {closedTickets.length}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-zinc-50 border border-zinc-200 p-4">
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
            <section className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-6">
              <div className="flex items-center justify-between gap-4 mb-6">
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
                <EmptyState
                  icon="✓"
                  title="Keine eigenen offenen Tickets"
                  description="Aktuell sind dir keine offenen Tickets direkt zugeordnet."
                />
              )}

              {myOpenTickets.length > 0 && (
                <div className="space-y-3">
                  {myOpenTickets.slice(0, 5).map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={`/tickets/${encodeURIComponent(String(ticket.id))}`}
                      className="block border border-zinc-200 rounded-2xl p-4 hover:border-indigo-200 hover:shadow-sm transition"
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

            <section className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-6">
              <div className="flex items-center justify-between gap-4 mb-6">
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
                        className="border border-zinc-200 rounded-2xl p-4"
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

          <section className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-6">
            <div className="flex items-center justify-between gap-4 mb-6">
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
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {latestTickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${encodeURIComponent(String(ticket.id))}`}
                    className="block border border-zinc-200 rounded-2xl p-4 hover:border-indigo-200 hover:shadow-sm transition"
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
                    <p className="text-xs text-zinc-4000 mt-2">
                      Aktualisiert: {formatDate(ticket.updatedAt)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
