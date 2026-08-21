


/** A single field/value-level error detail, used for validation failures. */
export interface ErrorDetail {
  /** Dot-path of the offending field, e.g. "address.zipCode". Omitted for non-field errors. */
  field?: string;
  /** Human-readable explanation of what's wrong with this field. */
  message: string;
  /** Machine-readable sub-code for this specific detail (e.g. "too_small", "invalid_type"). */
  code?: string;
  value?: unknown;
  [key: string]: unknown;
}
