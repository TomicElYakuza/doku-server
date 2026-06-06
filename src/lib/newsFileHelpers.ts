import {
  activityRepository,
} from "./activityRepository";

import {
  fileRepository,
} from "./fileRepository";

import type {
  StoredFile,
} from "../types/file";

import type {
  NewsPost,
} from "../types/news";

function getNewsFileKey(
  newsId: string
) {
  return `news-${newsId}`;
}

function createNewsFileActivity(
  post: NewsPost,
  type: string,
  title: string,
  description: string,
  fileName = ""
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

        fileName,
      },
    })
    .catch(
      (error) => {
        console.error(
          "News-Datei-AktivitÃ¤t konnte nicht gespeichert werden:",
          error
        );
      }
    );
}

export async function getNewsFiles(
  newsId: string
) {
  return fileRepository.listForKey(
    getNewsFileKey(
      newsId
    )
  );
}

export async function saveNewsFile(
  post: NewsPost,
  file: Partial<StoredFile>
) {
  await fileRepository.addToKey(
    getNewsFileKey(
      post.id
    ),
    file
  );

  createNewsFileActivity(
    post,
    "created",
    "News-Datei hochgeladen",
    `Datei "${file.name || "Unbenannte Datei"}" wurde zu News "${post.title}" hochgeladen.`,
    file.name ||
      ""
  );
}

export async function deleteNewsFile(
  post: NewsPost,
  index: number,
  fileName = ""
) {
  await fileRepository.deleteFromKey(
    getNewsFileKey(
      post.id
    ),
    index
  );

  createNewsFileActivity(
    post,
    "deleted",
    "News-Datei gelÃ¶scht",
    `Datei "${fileName || "Unbenannte Datei"}" wurde von News "${post.title}" gelÃ¶scht.`,
    fileName
  );
}

export async function deleteNewsFiles(
  newsId: string
) {
  await fileRepository.deleteKey(
    getNewsFileKey(
      newsId
    )
  );
}

