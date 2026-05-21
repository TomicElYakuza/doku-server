import {
  redirect,
} from "next/navigation";

type WikiCompanyPageProps = {
  params: Promise<{
    company: string;
  }>;
};

export default async function WikiCompanyPage({
  params,
}: WikiCompanyPageProps) {
  const {
    company,
  } =
    await params;

  redirect(
    `/wiki?company=${encodeURIComponent(
      decodeURIComponent(
        company
      )
    )}`
  );
}