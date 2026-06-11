const fs = require("fs");

const checks = [];

function exists(file) {
  return fs.existsSync(file);
}

function read(file) {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function addCheck(name, ok, detail = "") {
  checks.push({
    name,
    ok,
    detail,
  });
}

function contains(file, text) {
  if (!exists(file)) {
    return false;
  }

  return read(file).includes(text);
}

function hasRegex(file, regex) {
  if (!exists(file)) {
    return false;
  }

  return regex.test(read(file));
}

const files = [
  "src/app/wiki/page.tsx",
  "src/app/wiki/[slug]/page.tsx",
  "src/app/wiki/[slug]/versions/page.tsx",
  "src/app/api/wiki-pages/route.ts",
  "src/app/api/wiki-pages/[slug]/route.ts",
  "src/app/api/wiki-pages/[slug]/versions/route.ts",
  "src/app/api/wiki-pages/[slug]/versions/[versionId]/restore/route.ts",
  "src/lib/wikiRepository.ts",
  "src/types/wiki.ts",
];

for (const file of files) {
  addCheck(
    `Datei vorhanden: ${file}`,
    exists(file),
  );
}

addCheck(
  "Debug-Route entfernt",
  !exists("src/app/api/debug"),
);

addCheck(
  "Wiki Type: WikiStatus vorhanden",
  contains("src/types/wiki.ts", "export type WikiStatus"),
);

addCheck(
  "Wiki Type: WikiVisibility vorhanden",
  contains("src/types/wiki.ts", "export type WikiVisibility"),
);

addCheck(
  "Wiki Type: WikiVersion vorhanden",
  contains("src/types/wiki.ts", "export type WikiVersion"),
);

addCheck(
  "Repository: listVersions vorhanden",
  contains("src/lib/wikiRepository.ts", "listVersions"),
);

addCheck(
  "Repository: restoreVersion vorhanden",
  contains("src/lib/wikiRepository.ts", "restoreVersion"),
);

addCheck(
  "Wiki Liste: Statusfilter vorhanden",
  contains("src/app/wiki/page.tsx", "statusFilter"),
);

addCheck(
  "Wiki Liste: Sichtbarkeitsfilter vorhanden",
  contains("src/app/wiki/page.tsx", "visibilityFilter"),
);

addCheck(
  "Wiki Liste: Fixiertfilter vorhanden",
  contains("src/app/wiki/page.tsx", "pinnedFilter"),
);

addCheck(
  "Wiki Detail: Status-State vorhanden",
  contains("src/app/wiki/[slug]/page.tsx", "setStatus"),
);

addCheck(
  "Wiki Detail: Versionsbutton vorhanden",
  contains("src/app/wiki/[slug]/page.tsx", "Versionsverlauf") ||
    contains("src/app/wiki/[slug]/page.tsx", "/versions"),
);

addCheck(
  "Versionsseite: Restore-Button vorhanden",
  contains("src/app/wiki/[slug]/versions/page.tsx", "wiederherstellen") ||
    contains("src/app/wiki/[slug]/versions/page.tsx", "Wiederherstellen"),
);

for (const file of files.filter(exists)) {
  addCheck(
    `Keine leeren Buttons: ${file}`,
    !hasRegex(file, /<button([^>]*)>\s*<\/button>/),
  );

  addCheck(
    `Keine leeren Links: ${file}`,
    !hasRegex(file, /<Link([^>]*)>\s*<\/Link>/),
  );
}

addCheck(
  "Wiki Listen-GET ohne create/edit/delete als reine Leserechte",
  !hasRegex(
    "src/app/api/wiki-pages/route.ts",
    /"wiki\.create"[\s\S]*"wiki\.edit"[\s\S]*"wiki\.delete"/,
  ),
);

addCheck(
  "Wiki Detail-GET ohne create/edit/delete als reine Leserechte",
  !hasRegex(
    "src/app/api/wiki-pages/[slug]/route.ts",
    /"wiki\.create"[\s\S]*"wiki\.edit"[\s\S]*"wiki\.delete"/,
  ),
);

const failed = checks.filter((check) => !check.ok);

console.log("");
console.log("=== Wiki Regression Precheck ===");
console.log("");

for (const check of checks) {
  console.log(`${check.ok ? "OK " : "ERR"} ${check.name}${check.detail ? ` - ${check.detail}` : ""}`);
}

console.log("");
console.log(`Ergebnis: ${checks.length - failed.length}/${checks.length} Checks OK`);

if (failed.length > 0) {
  console.log("");
  console.log("Fehlgeschlagene Checks:");
  for (const check of failed) {
    console.log(`- ${check.name}`);
  }

  process.exitCode = 1;
}