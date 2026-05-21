import fs from "fs";
import path from "path";

import {
  db,
} from "./db";

export async function initDatabase() {
  const schemaPath =
    path.join(
      process.cwd(),
      "src",
      "lib",
      "database",
      "schema.sql"
    );

  const schema =
    fs.readFileSync(
      schemaPath,
      "utf8"
    );

  await db.query(
    schema
  );
}