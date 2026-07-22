export function actionErrorMessage(error: unknown, fallback: string): string {
  // Server and network errors can contain infrastructure details or user
  // content. Keep client-facing mutation failures useful without echoing the
  // raw exception into the interface.
  void error;
  return fallback;
}
