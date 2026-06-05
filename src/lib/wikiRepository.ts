import type {
  WikiPage,
} from "../types/wiki";

type WikiPagePayload = {
  slug?: string;
  title: string;
  description?: string;
  excerpt?: string;
  company?: string;
  category: string;
  department?: string;
  author?: string;
  tags?: string[];
  content?: string;
};

function normalizeTags(tags?: string[]) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return Array.from(
    new Set(
      tags
        .map((tag) => String(tag).trim())
        .filter(Boolean),
    ),
  );
}

async function parseJsonResponse<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      fallbackMessage,
    );
  }

  return data as T;
}

function buildQuery(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [
    key,
    value,
  ] of Object.entries(params)) {
    if (value && value.trim()) {
      searchParams.set(key, value.trim());
    }
  }

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

function normalizePayload(payload: WikiPagePayload) {
  return {
    slug: payload.slug?.trim() || undefined,
    title: payload.title.trim(),
    description: payload.description?.trim() || "",
    excerpt: payload.excerpt?.trim() || payload.description?.trim() || "",
    company: payload.company?.trim() || "Intern",
    category: payload.category.trim(),
    department: payload.department?.trim() || "Allgemein",
    author: payload.author?.trim() || "System",
    tags: normalizeTags(payload.tags),
    content: payload.content || "",
  };
}

export const wikiRepository = {
  async list(filters?: {
    company?: string;
    department?: string;
    category?: string;
    tag?: string;
  }) {
    const query = buildQuery({
      company: filters?.company,
      department: filters?.department,
      category: filters?.category,
      tag: filters?.tag,
    });

    const response = await fetch(`/api/wiki-pages${query}`, {
      cache: "no-store",
    });

    return parseJsonResponse<WikiPage[]>(
      response,
      "Wiki-Seiten konnten nicht geladen werden.",
    );
  },

  async findBySlug(slug: string) {
    const response = await fetch(
      `/api/wiki-pages/${encodeURIComponent(slug)}`,
      {
        cache: "no-store",
      },
    );

    if (response.status === 404) {
      return null;
    }

    return parseJsonResponse<WikiPage>(
      response,
      "Wiki-Seite konnte nicht geladen werden.",
    );
  },

  async create(payload: WikiPagePayload) {
    const normalizedPayload = normalizePayload(payload);

    if (!normalizedPayload.title) {
      throw new Error("Titel ist erforderlich.");
    }

    if (!normalizedPayload.category) {
      throw new Error("Kategorie ist erforderlich.");
    }

    const response = await fetch("/api/wiki-pages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(normalizedPayload),
    });

    const createdPage = await parseJsonResponse<WikiPage>(
      response,
      "Wiki-Seite konnte nicht erstellt werden.",
    );

    window.dispatchEvent(new Event("wikiPagesUpdated"));

    return createdPage;
  },

  async update(
    slug: string,
    payload: WikiPagePayload,
  ) {
    const normalizedPayload = normalizePayload(payload);

    if (!normalizedPayload.title) {
      throw new Error("Titel ist erforderlich.");
    }

    if (!normalizedPayload.category) {
      throw new Error("Kategorie ist erforderlich.");
    }

    const response = await fetch(
      `/api/wiki-pages/${encodeURIComponent(slug)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(normalizedPayload),
      },
    );

    const updatedPage = await parseJsonResponse<WikiPage>(
      response,
      "Wiki-Seite konnte nicht aktualisiert werden.",
    );

    window.dispatchEvent(new Event("wikiPagesUpdated"));

    return updatedPage;
  },

  async delete(slug: string) {
    const response = await fetch(
      `/api/wiki-pages/${encodeURIComponent(slug)}`,
      {
        method: "DELETE",
      },
    );

    await parseJsonResponse<{
      ok: boolean;
    }>(
      response,
      "Wiki-Seite konnte nicht gelöscht werden.",
    );

    window.dispatchEvent(new Event("wikiPagesUpdated"));

    return true;
  },
};