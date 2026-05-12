/** HTTP error with stable `status` for Express error handler. */
export class HttpError extends Error {
  readonly status: number;
  readonly code?: string;
  /** Optional structured payload (e.g. Zod `fieldErrors` / `formErrors`). */
  readonly details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
