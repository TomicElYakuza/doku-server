import {
  cookies,
} from "next/headers";

import {
  NextResponse,
} from "next/server";

const AUTH_COOKIE_NAME =
  "dms_user_email";

export async function POST() {
  const cookieStore =
    await cookies();

  cookieStore.delete(
    AUTH_COOKIE_NAME
  );

  return NextResponse.json({
    ok:
      true,
  });
}
