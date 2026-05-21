"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { activityRepository } from "../lib/activityRepository";
import { getCachedCurrentUser } from "../lib/currentUserRepository";
import { ticketRepository } from "../lib/ticketRepository";
import type { Activity } from "../types/activity";
import type { Ticket } from "../types/ticket";
import type { User } from "../types/user";

type LoadState = "idle" | "loading" | "ready" | "error";

function formatDateTime(value?: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getActivityTone(type: string) {
  if (type === "created") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (type === "edited") {
    return "bg-blue-50 text-blue-700 ring-blue-100";
  }

  if (type === "deleted" || type === "deletedForever") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  if (type === "restored") {
    return "bg-indigo-50 text-indigo-700 ring-indigo-100";
  }

  return "bg-zinc-100 text-zinc-700 ring-zinc-200";
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 11) {
    return "Guten Morgen";
  }

  if (hour < 18) {
    return "Willkommen zurück";
  }

  return "Guten Abend";
}

export default function HomePage() {
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [user, setUser] = useState<User | null>(getCachedCurrentUser());
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoadState("loading");

        const [nextTickets, nextActivities] = await Promise.all([
          ticketRepository.list(),
          activityRepository.list(),
        ]);

        if (cancelled) {
          return;
        }

        setUser(getCachedCurrentUser());
        setTickets(Array.isArray(nextTickets) ? nextTickets : []);
        setActivities(Array.isArray(nextActivities) ? nextActivities : []);
        setLoadState("ready");
      } catch (error) {
        console.error("Dashboard konnte nicht geladen werden:", error);

        if (!cancelled) {
          setUser(getCachedCurrentUser());
          setTickets([]);
          setActivities([]);
          setLoadState("error");
        }
      }
    }

    function handleDataUpdated() {
      void loadDashboard();
    }

    void loadDashboard();

    window.addEventListener("ticketsUpdated", handleDataUpdated);
    window.addEventListener("activitiesUpdated", handleDataUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("ticketsUpdated", handleDataUpdated);
      window.removeEventListener("activitiesUpdated", handleDataUpdated);
    };
  }, []);

  const isLoading = loadState === "idle" || loadState === "loading";

  const openTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status !== "closed"),
    [tickets]
  );

  const myAssignedTickets = useMemo(() => {
    if (!user) {
      return [];
    }

    const identifiers = [user.name, user.email].filter(Boolean);

    return tickets.filter((ticket) =>
      identifiers.some((identifier) => ticket.assignedTo === identifier)
    );
  }, [tickets, user]);

  const myCreatedTickets = useMemo(() => {
    if (!user) {
      return [];
    }

    const identifiers = [user.name, user.email].filter(Boolean);

    return tickets.filter((ticket) =>
      identifiers.some((identifier) => ticket.createdBy === identifier)
    );
  }, [tickets, user]);

  const urgentTickets = useMemo(
    () =>
      tickets.filter(
        (ticket) => ticket.priority === "urgent" || ticket.priority === "high"
      ),
    [tickets]
  );

  const latestTickets = useMemo(
    () =>
      [...tickets]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 5),
    [tickets]
  );

  const latestActivities = useMemo(
    () =>
      [...activities]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 6),
    [activities]
  );

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 text-sm font-medium text-zinc-500">
              User Dashboard
            </p>

            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">
              {getGreeting()}
              {user?.name ? `, ${user.name}` : ""}
            </h1>

            <p className="mt-3 max-w-2xl text-base text-zinc-500">
              Deine persönliche Übersicht für Tickets, Aufgaben und letzte
              Änderungen im Intranet.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/tickets"
              className="rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Tickets öffnen
            </Link>

            <Link
              href="/wiki"
              className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Wiki öffnen
            </Link>
          </div>
        </div>
      </section>

      {loadState === "error" && (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Dashboard-Daten konnten nicht geladen werden. Prüfe API und
          Datenbankverbindung.
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">Meine offenen Tickets</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-950">
            {isLoading ? "…" : myAssignedTickets.length}
          </p>
          <p className="mt-2 text-sm text-zinc-400">Dir zugewiesen</p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">Von mir erstellt</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-950">
            {isLoading ? "…" : myCreatedTickets.length}
          </p>
          <p className="mt-2 text-sm text-zinc-400">Eigene Tickets</p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">Offen gesamt</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-950">
            {isLoading ? "…" : openTickets.length}
          </p>
          <p className="mt-2 text-sm text-zinc-400">Nicht geschlossen</p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">Hohe Priorität</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-950">
            {isLoading ? "…" : urgentTickets.length}
          </p>
          <p className="mt-2 text-sm text-zinc-400">Hoch oder dringend</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-950">
                Letzte Tickets
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Aktuelle Vorgänge aus dem Ticketsystem.
              </p>
            </div>

            <Link
              href="/tickets"
              className="rounded-2xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Alle anzeigen
            </Link>
          </div>

          {isLoading && (
            <div className="rounded-3xl bg-zinc-50 p-5 text-sm text-zinc-500">
              Tickets werden geladen …
            </div>
          )}

          {!isLoading && latestTickets.length === 0 && (
            <div className="rounded-3xl bg-zinc-50 p-5 text-sm text-zinc-500">
              Noch keine Tickets vorhanden.
            </div>
          )}

          <div className="space-y-3">
            {latestTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="block rounded-3xl border border-zinc-100 bg-white p-5 transition hover:bg-zinc-50"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${ticketRepository.getStatusClass(
                      ticket.status
                    )}`}
                  >
                    {ticketRepository.getStatusLabel(ticket.status)}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${ticketRepository.getPriorityClass(
                      ticket.priority
                    )}`}
                  >
                    {ticketRepository.getPriorityLabel(ticket.priority)}
                  </span>

                  {ticket.company && (
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600">
                      {ticket.company}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-semibold text-zinc-950">
                  {ticket.title}
                </h3>

                {ticket.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
                    {ticket.description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                  <span>#{ticket.id}</span>
                  <span>{ticket.department || "Allgemein"}</span>
                  <span>{formatDateTime(ticket.updatedAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-zinc-950">
              Mein Bereich
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Name
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-900">
                  {user?.name || "Unbekannt"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Firma
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-900">
                  {user?.company || "Intern"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Abteilung
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-900">
                  {user?.department || "Allgemein"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-zinc-950">
                  Letzte Aktivitäten
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Kurzer Überblick, nicht die Startseite.
                </p>
              </div>

              <Link
                href="/activity"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-950"
              >
                Öffnen
              </Link>
            </div>

            {isLoading && (
              <div className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-500">
                Aktivitäten werden geladen …
              </div>
            )}

            {!isLoading && latestActivities.length === 0 && (
              <div className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-500">
                Noch keine Aktivitäten vorhanden.
              </div>
            )}

            <div className="space-y-3">
              {latestActivities.map((activity) => (
                <div key={activity.id} className="rounded-2xl bg-zinc-50 p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${getActivityTone(
                        activity.type
                      )}`}
                    >
                      {activityRepository.getTypeLabel(activity.type)}
                    </span>

                    <span className="text-xs text-zinc-400">
                      {formatDateTime(activity.createdAt)}
                    </span>
                  </div>

                  <p className="line-clamp-2 text-sm font-medium text-zinc-900">
                    {activity.title}
                  </p>

                  {activity.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                      {activity.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}