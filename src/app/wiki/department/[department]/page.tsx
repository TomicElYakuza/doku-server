import {
  redirect,
} from "next/navigation";

type WikiDepartmentPageProps = {
  params: Promise<{
    department: string;
  }>;
};

export default async function WikiDepartmentPage({
  params,
}: WikiDepartmentPageProps) {
  const {
    department,
  } =
    await params;

  redirect(
    `/wiki?department=${encodeURIComponent(
      decodeURIComponent(
        department
      )
    )}`
  );
}