import {
  redirect,
} from "next/navigation";

type WikiTagPageProps = {
  params: Promise<{
    tag: string;
  }>;
};

export default async function WikiTagPage({
  params,
}: WikiTagPageProps) {
  const {
    tag,
  } =
    await params;

  redirect(
    `/wiki?tag=${encodeURIComponent(
      decodeURIComponent(
        tag
      )
    )}`
  );
}