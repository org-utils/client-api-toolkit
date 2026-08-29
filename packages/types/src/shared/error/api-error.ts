import { STATUS_CODES } from "./error-codes.js";



/**
 * A single field/value-level error detail, used for validation failures.
 *
 * @property field - Dot-path of the offending field, e.g. `"address.zipCode"`.
 *   Omitted for non-field errors.
 * @property message - Human-readable explanation of what's wrong with this field.
 * @property code - Machine-readable sub-code for this specific detail (e.g.
 *   `"too_small"`, `"invalid_type"`). Should be one of the `STATUS_CODES`.
 * @property value - The value that failed validation.
 * @property [key: string] - Additional arbitrary properties.
 */
export interface ErrorDetail {
  /** Dot-path of the offending field, e.g. "address.zipCode". Omitted for non-field errors. */
  field?: string;
  /** Human-readable explanation of what's wrong with this field. */
  message: string;
  /** Machine-readable sub-code for this specific detail (e.g. "too_small", "invalid_type"). */
  code?: STATUS_CODES;
  /** The value that failed validation. */
  value?: unknown;
  [key: string]: unknown;
}