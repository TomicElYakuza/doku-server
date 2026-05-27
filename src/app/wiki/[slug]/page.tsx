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
  wikiRepository,
} from "../../../lib/wikiRepository";

import {
  usePermissions,
} from "../../../hooks/usePermissions";

import PageHero from "../../../components/PageHero";

import type {
  WikiPage,
} from "../../../types/wiki";

import FileList from "../../../components/wiki/FileList";

import Comments from "../../../components/wiki/Comments";

function getPageSlug(
  page: WikiPage
) {
  return String(
    page.slug ||
      ""
  );
}

function getPageTitle(
  page: WikiPage
) {
  return String(
    page.title ||
      "Unbenannt"
  );
}

function getPageContent(
  page: WikiPage
) {
  return String(
    page.content ||
      ""
  );
}

function getPageTags(
  page: WikiPage
) {
  if (
    Array.isArray(
      page.tags
    )
  ) {
    return page.tags.map(
      (tag) =>
        String(
          tag
        )
    );
  }

  return [];
}

export default function WikiDetailPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const {
    user,
    loading:
      permissionsLoading,
    isAdmin,
    hasAnyPermission,
  } =
    usePermissions();

  const canManageWiki =
    isAdmin ||
    hasAnyPermission([
      "wiki.manage",
    ]);

  const canViewWiki =
    canManageWiki ||
    hasAnyPermission([
      "wiki.view",
    ]);

  const canEditWiki =
    canManageWiki ||
    hasAnyPermission([
      "wiki.edit",
    ]);

  const canDeleteWiki =
    canManageWiki ||
    hasAnyPermission([
      "wiki.delete",
    ]);

  const slug =
    String(
      params.slug ||
        ""
    );

  const [page, setPage] =
    useState<WikiPage | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    void loadPage();

    function handleWikiPagesUpdated() {
      void loadPage();
    }

    window.addEventListener(
      "wikiPagesUpdated",
      handleWikiPagesUpdated
    );

    return () => {
      window.removeEventListener(
        "wikiPagesUpdated",
        handleWikiPagesUpdated
      );
    };
  }, [
    slug,
  ]);

  async function loadPage() {
    if (!slug) {
      return;
    }

    try {
      setLoading(
        true
      );

      setError(
        ""
      );

      const nextPage =
        await wikiRepository.findBySlug(
          decodeURIComponent(
            slug
          )
        );

      setPage(
        nextPage
      );

      if (!nextPage) {
        setError(
          "Wiki-Seite wurde nicht gefunden."
        );
      }
    } catch (loadError) {
      console.error(
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Wiki-Seite konnte nicht geladen werden."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  function userCanSeePage(
    wikiPage: WikiPage
  ) {
    if (
      isAdmin ||
      canManageWiki
    ) {
      return true;
    }

    if (
      !user ||
      !canViewWiki
    ) {
      return false;
    }

    const pageCompany =
      wikiPage.company ||
      "";

    const pageDepartment =
      wikiPage.department ||
      wikiPage.category ||
      "";

    if (user.department) {
      return pageDepartment === user.department;
    }

    if (user.company) {
      return pageCompany === user.company;
    }

    return false;
  }

  async function handleDelete() {
    if (!page) {
      return;
    }

    if (!canDeleteWiki) {
      alert(
        "Du hast keine Berechtigung, diese Seite zu löschen."
      );

      return;
    }

    const confirmed =
      confirm(
        `Wiki-Seite "${getPageTitle(
          page
        )}" wirklich löschen?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await wikiRepository.delete(
        getPageSlug(
          page
        )
      );

      router.push(
        "/wiki"
      );
    } catch (deleteError) {
      console.error(
        deleteError
      );

      alert(
        deleteError instanceof Error
          ? deleteError.message
          : "Wiki-Seite konnte nicht gelöscht werden."
      );
    }
  }

  if (
    loading ||
    permissionsLoading
  ) {
    return (
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <p className="text-zinc-500">
          Wiki-Seite wird geladen...
        </p>
      </div>
    );
  }

  if (
    error ||
    !page
  ) {
    return (
      <div className="space-y-8">
        <div>
          <Link
            href="/wiki"
            className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            ← Zurück zum Wiki
          </Link>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h1 className="text-3xl font-bold">
            Seite nicht gefunden
          </h1>

          <p className="text-zinc-500 mt-2">
            {error ||
              "Diese Wiki-Seite existiert nicht."}
          </p>
        </div>
      </div>
    );
  }

  if (
    !userCanSeePage(
      page
    )
  ) {
    return (
      <div className="space-y-8">
        <div>
          <Link
            href="/wiki"
            className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            ← Zurück zum Wiki
          </Link>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h1 className="text-3xl font-bold">
            Keine Berechtigung
          </h1>

          <p className="text-zinc-500 mt-2">
            Du hast keine Berechtigung, diese Wiki-Seite zu öffnen.
          </p>
        </div>
      </div>
    );
  }

  const tags =
    getPageTags(
      page
    );

  const pageSlug =
    getPageSlug(
      page
    );

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/wiki"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zum Wiki
        </Link>
      </div>

      <PageHero
        eyebrow="Wiki"
        title={getPageTitle(
          page
        )}
        description={
          page.description ||
          page.excerpt ||
          "Keine Beschreibung vorhanden."
        }
        badges={[
          {
            label:
              page.company ||
              "Intern",
          },
          {
            label:
              page.department ||
              page.category ||
              "Allgemein",
          },
          {
            label:
              page.author
                ? `Autor: ${page.author}`
                : "Autor: Unbekannt",
          },
        ]}
        actions={(
          <>
            {canEditWiki && (
              <Link
                href="/wiki"
                className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
              >
                In Übersicht bearbeiten
              </Link>
            )}

            {canDeleteWiki && (
              <button
                type="button"
                onClick={() =>
                  void handleDelete()
                }
                className="bg-red-600 text-white px-5 py-3 rounded-2xl hover:bg-red-500 transition"
              >
                Löschen
              </button>
            )}
          </>
        )}
      />

      {tags.length > 0 && (
        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Tags
          </h2>

          <div className="flex flex-wrap gap-2 mt-4">
            {tags.map(
              (tag) => (
                <Link
                  key={tag}
                  href={`/wiki?tag=${encodeURIComponent(
                    tag
                  )}`}
                  className="text-xs bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full hover:bg-zinc-200 transition"
                >
                  #{tag}
                </Link>
              )
            )}
          </div>
        </section>
      )}

      <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <div className="flex flex-wrap gap-5 text-sm text-zinc-400 mb-8">
          <span>
            Autor:{" "}
            {page.author ||
              "Unbekannt"}
          </span>

          <span>
            Erstellt:{" "}
            {page.createdAt}
          </span>

          <span>
            Aktualisiert:{" "}
            {page.updatedAt}
          </span>
        </div>

        <article className="prose prose-zinc max-w-none">
          <div className="whitespace-pre-wrap text-zinc-800 leading-8">
            {getPageContent(
              page
            ) ||
              "Noch kein Inhalt vorhanden."}
          </div>
        </article>
      </section>

      <FileList
        pageSlug={pageSlug}
        editable={canEditWiki}
      />

      <Comments
        pageSlug={pageSlug}
      />
    </div>
  );
}