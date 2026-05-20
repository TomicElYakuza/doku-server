import {
  getUser,
} from "./userStorage";

export type NewsCategory =
  | "Allgemein"
  | "System"
  | "Tickets"
  | "Wiki"
  | "Organisation";

export type NewsPost = {
  id: string;
  title: string;
  description: string;
  content: string;
  category: NewsCategory;
  author: string;
  createdAt: string;
  pinned?: boolean;
};

const NEWS_STORAGE_KEY =
  "dms_news_posts";

const OPENED_NEWS_STORAGE_KEY =
  "dms_opened_news_posts";

const defaultNewsPosts: NewsPost[] = [
  {
    id:
      "1",

    title:
      "Willkommen im Intranet",

    description:
      "Das Intranet ist die zentrale Startseite für interne Informationen, Dokumentation, Tickets und spätere Unternehmensnews.",

    content:
      "Hier werden später interne Neuigkeiten, Ankündigungen, Änderungen und wichtige Informationen für alle Benutzer veröffentlicht.",

    category:
      "Allgemein",

    author:
      "System",

    createdAt:
      new Date().toLocaleDateString(),

    pinned:
      true,
  },
  {
    id:
      "2",

    title:
      "Neue Ticket-Funktionen verfügbar",

    description:
      "Tickets unterstützen jetzt numerische IDs, Anhänge, geschlossene Tickets und eine übersichtlichere Tabellenansicht.",

    content:
      "Die Ticketverwaltung wurde erweitert. Neue Tickets erhalten fortlaufende IDs, Dateien und Anhänge können gespeichert werden und geschlossene Tickets lassen sich gezielt ein- oder ausblenden.",

    category:
      "Tickets",

    author:
      "Admin",

    createdAt:
      new Date().toLocaleDateString(),

    pinned:
      true,
  },
  {
    id:
      "3",

    title:
      "Wiki wurde verbessert",

    description:
      "Das Wiki ist vorbereitet für Firmen, Abteilungen, Favoriten, zuletzt geöffnete Dokumente und Anhänge.",

    content:
      "Die Wiki-Struktur wurde optisch und funktional verbessert. Firmen und Abteilungen sind direkt sichtbar, zuletzt geöffnete Seiten werden angezeigt und Dateien können Dokumenten zugeordnet werden.",

    category:
      "Wiki",

    author:
      "Admin",

    createdAt:
      new Date().toLocaleDateString(),
  },
  {
    id:
      "4",

    title:
      "Login ersetzt Setup",

    description:
      "Das bisherige Setup wird schrittweise zur Login-Seite und dient später als Basis für echte Authentifizierung.",

    content:
      "Der aktuelle lokale Benutzer kann über die Login-Seite gesetzt werden. Später wird dieser Bereich durch echte Sessions, Passwort-Login und serverseitige Berechtigungen ersetzt.",

    category:
      "System",

    author:
      "System",

    createdAt:
      new Date().toLocaleDateString(),
  },
  {
    id:
      "5",

    title:
      "Firmen und Abteilungen vorbereitet",

    description:
      "Die Organisationsstruktur ist vorbereitet, damit Tickets, Benutzer und später Wiki-Dokumente sauber zugeordnet werden können.",

    content:
      "Firmen und Abteilungen werden zentral verwaltet. Diese Struktur ist wichtig für spätere Rechteverwaltung, Datenbank-Anbindung und mandantenfähige Ansichten.",

    category:
      "Organisation",

    author:
      "Admin",

    createdAt:
      new Date().toLocaleDateString(),
  },
];

function dispatchNewsUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(
      "newsUpdated"
    )
  );

  window.dispatchEvent(
    new Event(
      "dataUpdated"
    )
  );
}

function dispatchOpenedNewsUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(
      "newsOpenedUpdated"
    )
  );

  window.dispatchEvent(
    new Event(
      "dataUpdated"
    )
  );
}

function getCurrentUserKey() {
  const user =
    getUser();

  const email =
    user?.email
      ?.trim()
      .toLowerCase();

  if (!email) {
    return "anonymous";
  }

  return email.replace(
    /[^a-z0-9._-]/g,
    "_"
  );
}

function getOpenedNewsStorageKey() {
  return `${OPENED_NEWS_STORAGE_KEY}_${getCurrentUserKey()}`;
}

function normalizeCategory(
  value: unknown
): NewsCategory {
  if (value === "System") {
    return "System";
  }

  if (value === "Tickets") {
    return "Tickets";
  }

  if (value === "Wiki") {
    return "Wiki";
  }

  if (value === "Organisation") {
    return "Organisation";
  }

  return "Allgemein";
}

function normalizeNewsPost(
  post: Partial<NewsPost>,
  fallbackId = ""
): NewsPost {
  return {
    id:
      String(
        post.id ||
        fallbackId ||
        ""
      ),

    title:
      post.title ||
      "Unbenannte News",

    description:
      post.description ||
      "",

    content:
      post.content ||
      "",

    category:
      normalizeCategory(
        post.category
      ),

    author:
      post.author ||
      "Unbekannt",

    createdAt:
      post.createdAt ||
      new Date().toLocaleDateString(),

    pinned:
      Boolean(
        post.pinned
      ),
  };
}

function normalizeNewsPosts(
  posts: Partial<NewsPost>[]
): NewsPost[] {
  return posts.map(
    (post, index) =>
      normalizeNewsPost(
        post,
        String(index + 1)
      )
  );
}

function readRawNewsPosts(): Partial<NewsPost>[] {
  if (typeof window === "undefined") {
    return defaultNewsPosts;
  }

  const raw =
    localStorage.getItem(
      NEWS_STORAGE_KEY
    );

  if (!raw) {
    localStorage.setItem(
      NEWS_STORAGE_KEY,
      JSON.stringify(
        defaultNewsPosts
      )
    );

    return defaultNewsPosts;
  }

  try {
    const parsed =
      JSON.parse(
        raw
      );

    if (!Array.isArray(parsed)) {
      return defaultNewsPosts;
    }

    return parsed;
  } catch {
    return defaultNewsPosts;
  }
}

function getNextNewsId(
  posts: NewsPost[]
) {
  const maxId =
    posts.reduce(
      (max, post) => {
        const numericId =
          Number(
            post.id
          );

        if (
          Number.isNaN(
            numericId
          )
        ) {
          return max;
        }

        return Math.max(
          max,
          numericId
        );
      },
      0
    );

  return String(
    maxId + 1
  );
}

export function getNewsPosts() {
  const posts =
    normalizeNewsPosts(
      readRawNewsPosts()
    );

  if (typeof window !== "undefined") {
    const currentRaw =
      localStorage.getItem(
        NEWS_STORAGE_KEY
      );

    const nextRaw =
      JSON.stringify(
        posts
      );

    if (currentRaw !== nextRaw) {
      localStorage.setItem(
        NEWS_STORAGE_KEY,
        nextRaw
      );
    }
  }

  return posts;
}

export function saveNewsPosts(
  posts: NewsPost[]
) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedPosts =
    normalizeNewsPosts(
      posts
    );

  localStorage.setItem(
    NEWS_STORAGE_KEY,
    JSON.stringify(
      normalizedPosts
    )
  );

  dispatchNewsUpdated();
}

export function createNewsPost(
  post: Omit<
    NewsPost,
    "id" | "createdAt"
  >
) {
  const posts =
    getNewsPosts();

  const newPost =
    normalizeNewsPost({
      ...post,

      id:
        getNextNewsId(
          posts
        ),

      createdAt:
        new Date().toLocaleDateString(),
    });

  saveNewsPosts([
    newPost,
    ...posts,
  ]);

  return newPost;
}

export function updateNewsPost(
  id: string,
  updates: Partial<NewsPost>
) {
  let updatedPost:
    | NewsPost
    | null =
    null;

  const posts =
    getNewsPosts();

  const updatedPosts =
    posts.map(
      (post) => {
        if (post.id !== id) {
          return post;
        }

        const nextPost =
          normalizeNewsPost({
            ...post,
            ...updates,

            id:
              post.id,

            createdAt:
              post.createdAt,
          });

        updatedPost =
          nextPost;

        return nextPost;
      }
    );

  saveNewsPosts(
    updatedPosts
  );

  return updatedPost;
}

export function deleteNewsPost(
  id: string
) {
  const posts =
    getNewsPosts();

  saveNewsPosts(
    posts.filter(
      (post) =>
        post.id !== id
    )
  );
}

export function resetNewsPosts() {
  saveNewsPosts(
    defaultNewsPosts
  );
}

export function getPinnedNewsPosts() {
  return getNewsPosts().filter(
    (post) =>
      post.pinned
  );
}

export function getLatestNewsPosts(
  limit = 5
) {
  return [
    ...getNewsPosts(),
  ].slice(
    0,
    limit
  );
}

export function getNewsCategories() {
  return Array.from(
    new Set(
      getNewsPosts().map(
        (post) =>
          post.category
      )
    )
  );
}

export function getNewsPostsByCategory(
  category: string
) {
  return getNewsPosts().filter(
    (post) =>
      post.category === category
  );
}

export function getNewsPostById(
  id: string
) {
  return (
    getNewsPosts().find(
      (post) =>
        post.id === id
    ) || null
  );
}

export function searchNewsPosts(
  query: string
) {
  const normalizedQuery =
    query
      .trim()
      .toLowerCase();

  if (!normalizedQuery) {
    return getNewsPosts();
  }

  return getNewsPosts().filter(
    (post) => {
      const haystack = [
        post.id,
        post.title,
        post.description,
        post.content,
        post.category,
        post.author,
        post.createdAt,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(
        normalizedQuery
      );
    }
  );
}

export function getOpenedNewsPostIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const userSpecificKey =
    getOpenedNewsStorageKey();

  const userRaw =
    localStorage.getItem(
      userSpecificKey
    );

  if (userRaw) {
    try {
      const parsed =
        JSON.parse(
          userRaw
        );

      if (Array.isArray(parsed)) {
        return parsed.map(
          (item) =>
            String(item)
        );
      }
    } catch {
      return [];
    }
  }

  const legacyRaw =
    localStorage.getItem(
      OPENED_NEWS_STORAGE_KEY
    );

  if (!legacyRaw) {
    return [];
  }

  try {
    const parsedLegacy =
      JSON.parse(
        legacyRaw
      );

    if (!Array.isArray(parsedLegacy)) {
      return [];
    }

    const migratedIds =
      parsedLegacy.map(
        (item) =>
          String(item)
      );

    saveOpenedNewsPostIds(
      migratedIds
    );

    return migratedIds;
  } catch {
    return [];
  }
}

export function saveOpenedNewsPostIds(
  ids: string[]
) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    getOpenedNewsStorageKey(),
    JSON.stringify(
      Array.from(
        new Set(
          ids
        )
      )
    )
  );

  dispatchOpenedNewsUpdated();
}

export function markNewsPostOpened(
  id: string
) {
  const openedIds =
    getOpenedNewsPostIds();

  if (
    openedIds.includes(
      id
    )
  ) {
    return;
  }

  saveOpenedNewsPostIds([
    ...openedIds,
    id,
  ]);
}

export function markAllNewsPostsOpened() {
  const allIds =
    getNewsPosts().map(
      (post) =>
        post.id
    );

  saveOpenedNewsPostIds(
    allIds
  );
}

export function isNewsPostOpened(
  id: string
) {
  return getOpenedNewsPostIds().includes(
    id
  );
}

export function clearOpenedNewsForCurrentUser() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    getOpenedNewsStorageKey()
  );

  dispatchOpenedNewsUpdated();
}