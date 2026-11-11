import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/core";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>MyDash</CardTitle>
          <CardDescription>
            Fondations en place. Le shell applicatif arrive avec la suite de la Phase 0.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button>Bientôt</Button>
        </CardContent>
      </Card>
    </main>
  );
}
