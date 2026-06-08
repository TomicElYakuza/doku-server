import {
  activityRepository,
} from "./activityRepository";

import type {
  NewsPost,
} from "../types/news";

function createNewsActivity(
  post: NewsPost,
  type: string,
  title: string,
  description: string
) {
  void activityRepository
    .create({
      type,

      title,

      description,

      entityType:
        "news",

      entityId:
        post.id,

      userName:
        post.author ||
        "System",

      userEmail:
        "",

      user:
        post.author ||
        "System",

      companyId:
        "",

      departmentId:
        "",

      company:
        "Intern",

      department:
        "",

      metadata: {
        newsId:
          post.id,

        newsTitle:
          post.title,

        category:
          String(
            post.category
          ),

        pinned:
          Boolean(
            post.pinned
          ),
      },
    })
    .catch(
      (error) => {
        console.error(
          "News-Aktivität konnte nicht gespeichert werden:",
          error
        );
      }
    );
}

export function saveNewsCreatedActivity(
  post: NewsPost
) {
  createNewsActivity(
    post,
    "created",
    "News erstellt",
    `News "${post.title}" wurde erstellt.`
  );
}

export function saveNewsUpdatedActivity(
  post: NewsPost
) {
  createNewsActivity(
    post,
    "edited",
    "News bearbeitet",
    `News "${post.title}" wurde bearbeitet.`
  );
}

export function saveNewsDeletedActivity(
  post: NewsPost
) {
  createNewsActivity(
    post,
    "deleted",
    "News gelöscht",
    `News "${post.title}" wurde gelöscht.`
  );
}

export function saveNewsPinnedActivity(
  post: NewsPost
) {
  createNewsActivity(
    post,
    "edited",
    "News fixiert",
    `News "${post.title}" wurde fixiert.`
  );
}

export function saveNewsUnpinnedActivity(
  post: NewsPost
) {
  createNewsActivity(
    post,
    "edited",
    "News-Fixierung entfernt",
    `News "${post.title}" wurde nicht mehr fixiert.`
  );
}

