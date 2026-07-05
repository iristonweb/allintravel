/** HTTP error from API with optional validation details. */
export class ApiError extends Error {
  readonly status: number;
  readonly errors?: unknown[];

  constructor(message: string, status: number, errors?: unknown[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

export function formatApiErrorDescription(err: ApiError): string {
  if (err.errors?.length) {
    return err.errors
      .map((e) => {
        if (typeof e === "object" && e && "message" in e) {
          return String((e as { message: string }).message);
        }
        return String(e);
      })
      .join("; ");
  }
  return err.message;
}

export async function parseErrorResponse(res: Response): Promise<ApiError> {
  const text = (await res.text()) || res.statusText;
  let message = text;
  let errors: unknown[] | undefined;
  try {
    const json = JSON.parse(text) as { message?: string; errors?: unknown[] };
    if (json.message) message = json.message;
    if (json.errors) errors = json.errors;
  } catch {
    /* plain text */
  }
  return new ApiError(message, res.status, errors);
}
