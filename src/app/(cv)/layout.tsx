/**
 * Pages imprimables (CV) : sans la barre latérale ni l'en-tête de l'app,
 * pour que l'impression ne contienne que le document.
 */
export default function PrintLayout({ children }: LayoutProps<"/">) {
  return <div className="min-h-screen bg-neutral-3 print:min-h-0 print:bg-neutral-1">{children}</div>;
}
