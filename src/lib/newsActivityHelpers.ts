import {
  saveActivity,
} from "./activityStorage";

import type {
  NewsPost,
} from "./newsStorage";

import {
  getUser,
} from "./userStorage";

function getCurrentUserName() {
  return (
    getUser()?.name ||
    "Unbekannt"
  );
}

export function saveNewsCreatedActivity(
  post: NewsPost
) {
  saveActivity({
    type:
      "created",

    title:
      `News erstellt: ${post.title}`,

    company:
      "News",

    user:
      getCurrentUserName(),

    createdAt:
      new Date().toLocaleString(),
  });
}

export function saveNewsUpdatedActivity(
  post: NewsPost
) {
  saveActivity({
    type:
      "updated",

    title:
      `News bearbeitet: ${post.title}`,

    company:
      "News",

    user:
      getCurrentUserName(),

    createdAt:
      new Date().toLocaleString(),
  });
}

export function saveNewsDeletedActivity(
  post: NewsPost
) {
  saveActivity({
    type:
      "deleted",

    title:
      `News gelöscht: ${post.title}`,

    company:
      "News",

    user:
      getCurrentUserName(),

    createdAt:
      new Date().toLocaleString(),
  });
}