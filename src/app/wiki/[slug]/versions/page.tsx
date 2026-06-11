"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import {
  useParams,
} from "next/navigation";

import AccessDeniedCard from "../../../../components/AccessDeniedCard";
import EmptyState from "../../../../components/EmptyState";
import LoadingState from "../../../../components/LoadingState";
import PageHero from "../../../../components/PageHero";
import {
  usePermissions,
} from "../../../../hooks/usePermissions";
import {
  wikiRepository,
} from "../../../../lib/wikiRepository";
import type {
  WikiVersion,
} from "../../../../types/wiki";

function getWikiStatusLabel(status?: string | null) {
  if (status === "draft") {
    return "Entwurf";
  }

  if (status === "archived") {
    return "Archiviert";
  }

  return "Veröffentlicht";
}

function getWikiVisibilityLabel(visibility?: string | null) {
  if (visibility === "global") {
    return "Global";
  }

  if (visibility === "department") {
    return "Abteilung";
  }

  return "Firma";
}

function getWikiStatusClass(status?: string | null) {
  if (status === "draft") {
    return "bg-amber-50 text-amber-700 border-amber-100";
  }

  if (status === "archived") {
    return "bg-zinc-100 text-zinc-600 border-zinc-200";
  }

  return "bg-green-50 text-green-700 border-green-100";
}

function getWikiVisibilityClass(visibility?: string | null) {
  if (visibility === "global") {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  if (visibility === "department") {
    return "bg-purple-50 text-purple-700 border-purple-100";
  }

  return "bg-indigo-50 text-indigo-700 border-indigo-100";
}

function getSafeTags(tags?: string[]) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .map((tag) => String(tag || "").trim())
    .filter(Boolean);
}

export default function WikiVersionsPage() {
  const params = useParams<{
    slug?: string;
  }>();

  const slug =
    typeof params.slug === "string"
      ? decodeURIComponent(params.slug)
      : "";

  const {
    isAdmin,
    hasAnyPermission,
    loading: permissionsLoading,
  } = usePermissions();

  const canViewVersions =
    isAdmin ||
    hasAnyPermission([
      "wiki.edit",
      "wiki.manage",
      "admin.view",
    ]);

  const [versions, setVersions] = useState<WikiVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (permissionsLoading) {
      return;
    }

    if (!canViewVersions) {
      setLoading(false);
      return;
    }

    void loadVersions();
  }, [
    slug,
    permissionsLoading,
    canViewVersions,
  ]);

  async function loadVersions() {
    if (!slug) {
      setLoading(false);
      setError("Keine Wiki-Seite angegeben.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const nextVersions =
        await wikiRepository.listVersions(slug);

      setVersions(
        Array.isArray(nextVersions)
          ? nextVersions
          : [],
      );
    } catch (loadError) {
      console.error(loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Wiki-Versionen konnten nicht geladen werden.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRestoreVersion(version: WikiVersion) {
    const confirmed = confirm(
      `Version vom ${version.createdAt} wiederherstellen?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await wikiRepository.restoreVersion(
        slug,
        version.id,
      );

      await loadVersions();

      alert("Version wurde wiederhergestellt.");
    } catch (restoreError) {
      console.error(restoreError);

      setError(
        restoreError instanceof Error
          ? restoreError.message
          : "Version konnte nicht wiederhergestellt werden.",
      );
    }
  }

  if (!permissionsLoading && !canViewVersions) {
    return (
      <AccessDeniedCard
        title="Kein Zugriff"
        description="Du hast keine Berechtigung, Wiki-Versionen anzuzeigen."
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Wiki"
        title="Wiki-Versionen"
        description="Gespeicherte ältere Stände dieser Wiki-Seite. Jede Änderung legt automatisch eine Version an."
        badges={[
          {
            label: `${versions.length} Versionen`,
          },
          {
            label: slug || "Wiki-Seite",
          },
        ]}
        actions={
          <Link
            href={`/wiki/${encodeURIComponent(slug)}`}
            className="app-muted-surface text-zinc-800 border border-white/40 px-3.5 py-2 rounded-xl hover:shadow-md transition font-bold text-sm"
          >
            Zurück zur Wiki-Seite
          </Link>
        }
      />

      {loading && (
        <LoadingState
          title="Wiki-Versionen wird geladen..."
          description="Gespeicherte Wiki-Versionen werden aus PostgreSQL geladen."
        />
      )}

      {error && (
        <EmptyState
          icon="⚠️"
          title="Versionen konnten nicht geladen werden"
          description={error}
        />
      )}

      {!loading && !error && versions.length === 0 && (
        <EmptyState
          icon="🕘"
          title="Noch kein Änderungsverlauf vorhanden"
          description="Sobald diese Wiki-Seite bearbeitet, archiviert oder gelöscht wird, wird der vorherige Stand automatisch gespeichert."
          action={
            <Link
              href={`/wiki/${encodeURIComponent(slug)}`}
              className="app-accent-bg text-white px-3.5 py-2 rounded-xl transition font-bold app-brand-shadow text-sm hover:shadow-md"
            >
              Zurück zur Wiki-Seite
            </Link>
          }
        />
      )}

      {!loading && !error && versions.length > 0 && (
        <section className="space-y-5">
          {versions.map((version, index) => {
            const tags = getSafeTags(version.tags);

            return (
              <article
                key={version.id}
                className="app-surface border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative hover:shadow-md transition"
              >
                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

                <div className="relative space-y-5">
                  <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] font-black app-accent-text">
                        Version {versions.length - index}
                      </p>

                      <h2 className="text-2xl font-black mt-2 leading-tight">
                        {version.title || "Ohne Titel"}
                      </h2>

                      <p className="text-zinc-500 mt-2 text-sm">
                        Gespeichert am {version.createdAt}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 items-center">
                      <button
                        type="button"
                        onClick={() => void handleRestoreVersion(version)}
                        className="app-accent-bg text-white px-3 py-1.5 rounded-xl transition font-bold app-brand-shadow text-xs hover:shadow-md"
                      >
                        Wiederherstellen
                      </button>

                      <span className="text-xs text-zinc-500 max-w-[220px]">
                        Aktuelle Seite wird vorher gesichert.
                      </span>

                      <span className={`text-xs border px-3 py-1 rounded-full font-bold ${getWikiStatusClass(version.status)}`}>
                        {getWikiStatusLabel(version.status)}
                      </span>

                      <span className={`text-xs border px-3 py-1 rounded-full font-bold ${getWikiVisibilityClass(version.visibility)}`}>
                        {getWikiVisibilityLabel(version.visibility)}
                      </span>

                      {version.pinned && (
                        <span className="text-[11px] app-accent-soft app-accent-text px-2.5 py-1 rounded-full font-bold">
                          Fixiert
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="app-muted-surface rounded-2xl p-4">
                      <p className="text-zinc-500">
                        Firma
                      </p>
                      <p className="font-bold mt-1">
                        {version.company || "Intern"}
                      </p>
                    </div>

                    <div className="app-muted-surface rounded-2xl p-4">
                      <p className="text-zinc-500">
                        Abteilung
                      </p>
                      <p className="font-bold mt-1">
                        {version.department || "Keine Abteilung"}
                      </p>
                    </div>

                    <div className="app-muted-surface rounded-2xl p-4">
                      <p className="text-zinc-500">
                        Kategorie
                      </p>
                      <p className="font-bold mt-1">
                        {version.category || "Keine Kategorie"}
                      </p>
                    </div>
                  </div>

                  <p className="text-zinc-600 leading-relaxed">
                    {version.description || "Keine Beschreibung vorhanden."}
                  </p>

                  <div className="app-muted-surface rounded-2xl p-5 border border-zinc-100">
                    <p className="text-sm font-bold text-zinc-500 mb-2">
                      Gespeicherte Inhaltsversion
                    </p>

                    <p className="text-zinc-700 whitespace-pre-wrap line-clamp-6 leading-relaxed">
                      {version.content || "In dieser Version wurde kein Inhalt gespeichert."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 items-center">
                    {tags.length === 0 && (
                      <span className="text-[11px] app-muted-surface text-zinc-500 border border-zinc-200 px-2.5 py-1 rounded-full">
                        Keine Tags hinterlegt
                      </span>
                    )}

                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] app-muted-surface text-zinc-700 border border-zinc-200 px-2.5 py-1 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}