export async function requestJson<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response =
    await fetch(
      url,
      {
        ...options,

        headers: {
          "Content-Type":
            "application/json",

          ...(options?.headers || {}),
        },
      }
    );

  if (!response.ok) {
    let message =
      "Anfrage fehlgeschlagen.";

    try {
      const body =
        await response.json();

      message =
        body.message ||
        body.error ||
        message;
    } catch {
      // Keine JSON-Antwort.
    }

    throw new Error(
      message
    );
  }

  return response.json() as Promise<T>;
}