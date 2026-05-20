"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  getVersions,
} from "../../../../lib/versionStorage";

import {
  wikiRepository,
} from "../../../../lib/wikiRepository";

import type {
  WikiPage,
} from "../../../../lib/wikiRepository";

import {
  activityRepository,
} from "../../../../lib/activityRepository";

import {
  getUser,
} from "../../../../lib/userStorage";

type WikiVersion = {
  title?: string;
  company?: string;
  category?: string;
  department?: string;
  description?: string;
  tags?: string[];
  content?: string;
  updatedAt?: string;
  savedAt?: string;
};

type VersionMap = Record<
  string,
  WikiVersion[]
>;

export default function HistoryPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const slug =
    params.slug as string;

  const [mounted, setMounted] =
    useState(false);

  const [pageChecked, setPageChecked] =
    useState(false);

  const [pageFound, setPageFound] =
    useState(false);

  const [pageTitle, setPageTitle] =
    useState("");

  const [pageCompany, setPageCompany] =
    useState("Intern");

  const [pageCategory, setPageCategory] =
    useState("");

  const [documentSlug, setDocumentSlug] =
    useState("");

  const [versions, setVersions] =
    useState<WikiVersion[]>([]);

  useEffect(() => {
    setMounted(
      true
    );

    loadData();

    function handleVersionsUpdated() {
      loadData();
    }

    function handleWikiPagesUpdated() {
      loadData();
    }

    window.addEventListener(
      "versionsUpdated",
      handleVersionsUpdated
    );

    window.addEventListener(
      "wikiPagesUpdated",
      handleWikiPagesUpdated
    );

    return () => {
      window.removeEventListener(
        "versionsUpdated",
        handleVersionsUpdated
      );

      window.removeEventListener(
        "wikiPagesUpdated",
        handleWikiPagesUpdated
      );
    };
  }, [
    slug,
  ]);

  function loadData() {
    const decodedSlug =
      decodeURIComponent(
        slug
      );

    const page =
      (
        wikiRepository.findBySlug(
          decodedSlug
        ) ||
        wikiRepository.findBySlug(
          slug
        )
      ) as WikiPage | null;

    const allVersions =
      getVersions() as VersionMap;

    const versionKey =
      String(
        page?.slug ||
          decodedSlug ||
          slug
      );

    setVersions(
      allVersions[versionKey] ||
      allVersions[slug] ||
      allVersions[decodedSlug] ||
      []
    );

    if (!page) {
      setPageFound(
        false
      );

      setPageChecked(
        true
      );

      return;
    }

    setPageFound(
      true
    );

    setDocumentSlug(
      String(
        page.slug ||
          decodedSlug
      )
    );

    setPageTitle(
      String(
        page.title ||
          ""
      )
    );

    setPageCompany(
      String(
        page.company ||
          "Intern"
      )
    );

    setPageCategory(
      String(
        page.category ||
          page.department ||
          ""
      )
    );

    setPageChecked(
      true
    );
  }

  function getDocumentHref() {
    if (!documentSlug) {
      return "/wiki";
    }

    return `/wiki/${encodeURIComponent(
      documentSlug
    )}`;
  }

  function goToDocument() {
    router.push(
      getDocumentHref()
    );
  }

  function restoreVersion(
    version: WikiVersion
  ) {
    const confirmed =
      confirm(
        "Version wirklich wiederherstellen?"
      );

    if (!confirmed) {
      return;
    }

    const decodedSlug =
      decodeURIComponent(
        slug
      );

    const existingPage =
      (
        wikiRepository.findBySlug(
          documentSlug
        ) ||
        wikiRepository.findBySlug(
          decodedSlug
        ) ||
        wikiRepository.findBySlug(
          slug
        )
      ) as WikiPage | null;

    if (!existingPage) {
      alert(
        "Dokument existiert nicht mehr und kann deshalb nicht aus der Historie wiederhergestellt werden."
      );

      return;
    }

    const existingSlug =
      String(
        existingPage.slug ||
          documentSlug ||
          decodedSlug
      );

    wikiRepository.update(
      existingSlug,
      {
        title:
          version.title ||
          existingPage.title,

        company:
          version.company ||
          existingPage.company ||
          "Intern",

        category:
          version.category ||
          version.department ||
          existingPage.category,

        department:
          version.department ||
          version.category ||
          existingPage.department,

        description:
          version.description ||
          "",

        excerpt:
          version.description ||
          "",

        tags:
          Array.isArray(
            version.tags
          )
            ? version.tags
            : [],

        content:
          version.content ||
          "",

        updatedAt:
          new Date().toLocaleDateString(),
      }
    );

    activityRepository.create({
      type:
        "restored",

      title:
        version.title ||
        String(
          existingPage.title ||
            existingSlug
        ),

      company:
        version.company ||
        String(
          existingPage.company ||
            "Intern"
        ),

      user:
        getUser()?.name ||
        "Unbekannt",

      createdAt:
        new Date().toLocaleString(),
    });

    alert(
      "Version wurde wiederhergestellt."
    );

    router.push(
      `/wiki/${encodeURIComponent(
        existingSlug
      )}`
    );
  }

  if (
    !mounted ||
    !pageChecked
  ) {
    return null;
  }

  if (!pageFound) {
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
          <Link
            href="/wiki"
            className="hover:text-zinc-900 transition"
          >
            Wiki
          </Link>

          <span>/</span>

          <span>
            Historie
          </span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h1 className="text-4xl font-bold">
            Dokument nicht gefunden
          </h1>

          <p className="text-zinc-500 mt-3">
            Die Historie für{" "}
            <span className="font-mono text-zinc-700">
              {decodeURIComponent(
                slug
              )}
            </span>{" "}
            kann nicht geöffnet werden, weil das Dokument nicht existiert oder gelöscht wurde.
          </p>

          {versions.length > 0 && (
            <p className="text-zinc-500 mt-3">
              Für dieses Dokument sind noch {versions.length} alte Versionen gespeichert, aber das aktive Dokument existiert nicht mehr.
            </p>
          )}

          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              href="/wiki"
              className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
            >
              Zurück zur Wiki-Übersicht
            </Link>

            <Link
              href="/wiki/trash"
              className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
            >
              Papierkorb öffnen
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const reversedVersions =
    [
      ...versions,
    ].reverse();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
        <Link
          href="/wiki"
          className="hover:text-zinc-900 transition"
        >
          Wiki
        </Link>

        <span>/</span>

        <Link
          href={`/wiki?company=${encodeURIComponent(
            pageCompany
          )}`}
          className="hover:text-zinc-900 transition"
        >
          {pageCompany}
        </Link>

        {pageCategory && (
          <>
            <span>/</span>

            <Link
              href={`/wiki?department=${encodeURIComponent(
                pageCategory
              )}`}
              className="hover:text-zinc-900 transition"
            >
              {pageCategory}
            </Link>
          </>
        )}

        <span>/</span>

        <span>
          Historie
        </span>
      </div>

      <div>
        <button
          type="button"
          onClick={goToDocument}
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zum Dokument
        </button>
      </div>

      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
              {pageCompany}
            </span>

            {pageCategory && (
              <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                {pageCategory}
              </span>
            )}
          </div>

          <p className="text-sm text-zinc-500 mt-5">
            Versionshistorie
          </p>

          <h1 className="text-4xl font-bold mt-2">
            {pageTitle ||
              documentSlug ||
              slug}
          </h1>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl px-5 py-4 shadow-sm">
          <p className="text-sm text-zinc-500">
            Versionen
          </p>

          <p className="text-2xl font-bold mt-1">
            {versions.length}
          </p>
        </div>
      </div>

      {versions.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <p className="text-zinc-500">
            Noch keine Versionen vorhanden.
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {reversedVersions.map(
          (version, index) => {
            const versionNumber =
              versions.length - index;

            const versionCompany =
              version.company ||
              pageCompany ||
              "Intern";

            const versionCategory =
              version.category ||
              version.department ||
              pageCategory ||
              "Keine Kategorie";

            const versionTags =
              Array.isArray(
                version.tags
              )
                ? version.tags
                : [];

            return (
              <div
                key={`${version.savedAt}-${versionNumber}`}
                className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h2 className="text-2xl font-bold">
                      Version {versionNumber}
                    </h2>

                    <p className="text-zinc-500 mt-2">
                      {version.savedAt ||
                        "Unbekannt"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      restoreVersion(
                        version
                      )
                    }
                    className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-500 transition"
                  >
                    Wiederherstellen
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div>
                    <p className="text-sm text-zinc-500">
                      Titel
                    </p>

                    <p className="font-semibold mt-1">
                      {version.title ||
                        "Ohne Titel"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-zinc-500">
                      Firma
                    </p>

                    <p className="font-semibold mt-1">
                      {versionCompany}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-zinc-500">
                      Kategorie / Abteilung
                    </p>

                    <p className="font-semibold mt-1">
                      {versionCategory}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm text-zinc-500">
                    Beschreibung
                  </p>

                  <p className="mt-1">
                    {version.description ||
                      "Keine Beschreibung"}
                  </p>
                </div>

                <div className="mt-6">
                  <p className="text-sm text-zinc-500">
                    Tags
                  </p>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {versionTags.length > 0 ? (
                      versionTags.map(
                        (tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full"
                          >
                            #{tag}
                          </span>
                        )
                      )
                    ) : (
                      <span className="text-zinc-500">
                        Keine Tags
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm text-zinc-500 mb-2">
                    Inhalt Vorschau
                  </p>

                  <pre className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm whitespace-pre-wrap overflow-x-auto">
                    {version.content ||
                      "Kein Inhalt"}
                  </pre>
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}