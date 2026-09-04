import { createFileRoute } from "@tanstack/react-router";
import { AgendaProjetosScreen } from "@/features/projetos/agenda/AgendaProjetosScreen";

export const Route = createFileRoute("/agenda-de-entregas")({
  component: AgendaDeEntregasPage,
});

function AgendaDeEntregasPage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      <AgendaProjetosScreen />
    </div>
  );
}
