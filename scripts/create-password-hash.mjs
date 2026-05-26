import {
  randomBytes,
  scrypt as scryptCallback,
} from "crypto";

import {
  promisify,
} from "util";

const scrypt =
  promisify(
    scryptCallback
  );

const password =
  process.argv[2];

if (!password) {
  console.error(
    "Bitte Passwort angeben: node scripts/create-password-hash.mjs MeinPasswort"
  );

  process.exit(
    1
  );
}

const salt =
  randomBytes(
    16
  ).toString(
    "hex"
  );

const derivedKey =
  await scrypt(
    password,
    salt,
    64
);

console.log(
  [
    "scrypt",
    salt,
    derivedKey.toString(
      "hex"
    ),
  ].join(
    "$"
  )
);