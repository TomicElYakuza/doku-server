import type {
  Activity,
  ActivityType,
} from "../../../types/activity";

export type ActivityMetadata =
  Record<
    string,
    string | number | boolean | null
  >;

export type ActivityRow = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  entity_type: string | null;
  entity_id: string | null;
  user_name: string | null;
  user_email: string | null;
  user_label: string | null;
  company_id: string | null;
  department_id: string | null;
  company: string | null;
  department: string | null;
  metadata: ActivityMetadata | null;
  created_at: string;
};

function normalizeMetadata(
  metadata: ActivityMetadata | null
): ActivityMetadata {
  if (!metadata) {
    return {};
  }

  return metadata;
}

export function mapActivityRow(
  row: ActivityRow
): Activity {
  return {
    id:
      row.id,

    type:
      row.type as ActivityType,

    title:
      row.title,

    description:
      row.description ||
      "",

    entityType:
      row.entity_type ||
      "",

    entityId:
      row.entity_id ||
      "",

    userName:
      row.user_name ||
      "",

    userEmail:
      row.user_email ||
      "",

    user:
      row.user_label ||
      row.user_name ||
      "Unbekannt",

    companyId:
      row.company_id ||
      "",

    departmentId:
      row.department_id ||
      "",

    company:
      row.company ||
      "Intern",

    department:
      row.department ||
      "Allgemein",

    metadata:
      normalizeMetadata(
        row.metadata
      ),

    createdAt:
      new Date(
        row.created_at
      ).toLocaleString(),
  };
}