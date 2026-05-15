"use client";

import { useEffect, useState } from "react";

export default function TicketsPage() {
  const [tickets, setTickets] =
    useState<any[]>([]);

  useEffect(() => {
    const demoTickets = [
      {
        id: "T-1001",
        title: "VPN funktioniert nicht",
        status: "offen",
        priority: "hoch",
        department: "IT",
        createdAt: "15.05.2026",
      },
      {
        id: "T-1002",
        title: "Neuen Benutzer anlegen",
        status: "in bearbeitung",
        priority: "mittel",
        department: "IT",
        createdAt: "14.05.2026",
      },
      {
        id: "T-1003",
        title: "Drucker im Büro offline",
        status: "geschlossen",
        priority: "niedrig",
        department: "Office",
        createdAt: "12.05.2026",
      },
    ];

    setTickets(demoTickets);
  }, []);

  function getStatusClass(status: string) {
    if (status === "offen") {
      return "bg-red-100 text-red-700";
    }

    if (status === "in bearbeitung") {
      return "bg-yellow-100 text-yellow-700";
    }

    if (status === "geschlossen") {
      return "bg-green-100 text-green-700";
    }

    return "bg-zinc-100 text-zinc-700";
  }

  function getPriorityClass(priority: string) {
    if (priority === "hoch") {
      return "bg-red-100 text-red-700";
    }

    if (priority === "mittel") {
      return "bg-yellow-100 text-yellow-700";
    }

    if (priority === "niedrig") {
      return "bg-green-100 text-green-700";
    }

    return "bg-zinc-100 text-zinc-700";
  }

  const openTickets = tickets.filter(
    (ticket) =>
      ticket.status !== "geschlossen"
  );

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold">
            Tickets
          </h1>

          <p className="text-zinc-500 mt-2">
            Übersicht über Support- und interne Aufgaben
          </p>
        </div>

        <button className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition">
          Neues Ticket
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Tickets gesamt
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {tickets.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Offen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {openTickets.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Geschlossen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {
              tickets.filter(
                (ticket) =>
                  ticket.status ===
                  "geschlossen"
              ).length
            }
          </h2>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="text-left px-5 py-4 font-semibold">
                Ticket
              </th>

              <th className="text-left px-5 py-4 font-semibold">
                Titel
              </th>

              <th className="text-left px-5 py-4 font-semibold">
                Status
              </th>

              <th className="text-left px-5 py-4 font-semibold">
                Priorität
              </th>

              <th className="text-left px-5 py-4 font-semibold">
                Abteilung
              </th>

              <th className="text-left px-5 py-4 font-semibold">
                Erstellt
              </th>
            </tr>
          </thead>

          <tbody>
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 transition"
              >
                <td className="px-5 py-4 font-medium">
                  {ticket.id}
                </td>

                <td className="px-5 py-4">
                  {ticket.title}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${getStatusClass(
                      ticket.status
                    )}`}
                  >
                    {ticket.status}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${getPriorityClass(
                      ticket.priority
                    )}`}
                  >
                    {ticket.priority}
                  </span>
                </td>

                <td className="px-5 py-4 text-zinc-600">
                  {ticket.department}
                </td>

                <td className="px-5 py-4 text-zinc-600">
                  {ticket.createdAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}