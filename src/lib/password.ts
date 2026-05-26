import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "crypto";

import {
  promisify,
} from "util";

const scrypt =
  promisify(
    scryptCallback
  );

const PASSWORD_PREFIX =
  "scrypt";

const KEY_LENGTH =
  64;

export async function hashPassword(
  password: string
) {
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
      KEY_LENGTH
    ) as Buffer;

  return [
    PASSWORD_PREFIX,
    salt,
    derivedKey.toString(
      "hex"
    ),
  ].join(
    "$"
  );
}

export async function verifyPassword(
  password: string,
  passwordHash: string
) {
  const [
    prefix,
    salt,
    storedHash,
  ] =
    passwordHash.split(
      "$"
    );

  if (
    prefix !== PASSWORD_PREFIX ||
    !salt ||
    !storedHash
  ) {
    return false;
  }

  const storedBuffer =
    Buffer.from(
      storedHash,
      "hex"
    );

  const derivedKey =
    await scrypt(
      password,
      salt,
      storedBuffer.length
    ) as Buffer;

  if (
    storedBuffer.length !==
    derivedKey.length
  ) {
    return false;
  }

  return timingSafeEqual(
    storedBuffer,
    derivedKey
  );
}