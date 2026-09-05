import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PlaceholderPageProps {
  title: string;
  description: string;
  features?: string[];
}

export function PlaceholderPage({ title, description, features = [] }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 lg:p-8">
      <div className="hidden md:flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <Badge variant="secondary" className="text-[10px]">Em breve</Badge>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary">
            <Construction className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium">Módulo em construção</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Este módulo faz parte do escopo do Focus Finance e será entregue nas próximas iterações.
            </p>
          </div>
          {features.length > 0 && (
            <div className="mt-4 grid w-full max-w-2xl grid-cols-1 gap-2 text-left sm:grid-cols-2">
              {features.map((f) => (
                <div
                  key={f}
                  className="flex items-start gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
