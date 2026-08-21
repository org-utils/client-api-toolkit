
export type ValidationPath = readonly (string | number)[];

export type ValidationIssue = {
  path: ValidationPath;
  field: string;
  message: string;
  code: string;
}

export type ValidationTree = {
  errors: ValidationIssue[];
  children: Record<string, ValidationTree>;
}

export type ValidationResult = {
  issues: ValidationIssue[];
  tree: ValidationTree;
  messages: string[];
}
