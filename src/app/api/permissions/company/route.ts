import {
  NextResponse,
} from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      message:
        "Bitte /api/permissions/company/[companyId] verwenden.",
    },
    {
      status:
        400,
    }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      message:
        "Bitte /api/permissions/company/[companyId] verwenden.",
    },
    {
      status:
        400,
    }
  );
}