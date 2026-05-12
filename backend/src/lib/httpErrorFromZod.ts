import type { ZodError } from "zod";
import { HttpError } from "./httpError.js";

/** Machine-readable body for `validation_error` responses (see backend conventions). */
export type ZodValidationDetails = {
  fieldErrors: Record<string, string[]>;
  formErrors: string[];
};

function firstIssueMessage(flat: ZodValidationDetails): string {
  const fieldKey = Object.keys(flat.fieldErrors)[0];
  const fromField = fieldKey ? flat.fieldErrors[fieldKey]?.[0] : undefined;
  return fromField ?? flat.formErrors[0] ?? "Invalid request body";
}

export function httpErrorFromZod(zodError: ZodError): HttpError {
  const flat = zodError.flatten();
  const details: ZodValidationDetails = {
    fieldErrors: flat.fieldErrors as Record<string, string[]>,
    formErrors: flat.formErrors
  };
  return new HttpError(400, firstIssueMessage(details), "validation_error", details);
}
