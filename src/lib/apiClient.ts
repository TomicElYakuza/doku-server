export type ApiClientResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

const API_BASE_PATH =
  "/api";

async function parseResponse<T>(
  response: Response
): Promise<ApiClientResult<T>> {
  try {
    const data =
      await response.json();

    if (!response.ok) {
      return {
        success:
          false,

        error:
          data?.error ||
          "API-Anfrage fehlgeschlagen.",
      };
    }

    return {
      success:
        true,

      data:
        data as T,
    };
  } catch {
    return {
      success:
        false,

      error:
        "API-Antwort konnte nicht gelesen werden.",
    };
  }
}

export async function apiGet<T>(
  path: string
): Promise<ApiClientResult<T>> {
  try {
    const response =
      await fetch(
        `${API_BASE_PATH}${path}`,
        {
          method:
            "GET",

          headers:
            {
              "Content-Type":
                "application/json",
            },
        }
      );

    return parseResponse<T>(
      response
    );
  } catch {
    return {
      success:
        false,

      error:
        "API konnte nicht erreicht werden.",
    };
  }
}

export async function apiPost<T>(
  path: string,
  body: unknown
): Promise<ApiClientResult<T>> {
  try {
    const response =
      await fetch(
        `${API_BASE_PATH}${path}`,
        {
          method:
            "POST",

          headers:
            {
              "Content-Type":
                "application/json",
            },

          body:
            JSON.stringify(
              body
            ),
        }
      );

    return parseResponse<T>(
      response
    );
  } catch {
    return {
      success:
        false,

      error:
        "API konnte nicht erreicht werden.",
    };
  }
}

export async function apiPatch<T>(
  path: string,
  body: unknown
): Promise<ApiClientResult<T>> {
  try {
    const response =
      await fetch(
        `${API_BASE_PATH}${path}`,
        {
          method:
            "PATCH",

          headers:
            {
              "Content-Type":
                "application/json",
            },

          body:
            JSON.stringify(
              body
            ),
        }
      );

    return parseResponse<T>(
      response
    );
  } catch {
    return {
      success:
        false,

      error:
        "API konnte nicht erreicht werden.",
    };
  }
}

export async function apiDelete<T>(
  path: string
): Promise<ApiClientResult<T>> {
  try {
    const response =
      await fetch(
        `${API_BASE_PATH}${path}`,
        {
          method:
            "DELETE",

          headers:
            {
              "Content-Type":
                "application/json",
            },
        }
      );

    return parseResponse<T>(
      response
    );
  } catch {
    return {
      success:
        false,

      error:
        "API konnte nicht erreicht werden.",
    };
  }
}