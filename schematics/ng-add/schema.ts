export interface Schema {
  /** Name of the project to target. */
  project: string;
  translationFile: string;
  autoTargetFile?: string;
  targetTranslationPath: string;
  includeContextInTarget: boolean;
  packageScript: boolean;
}
