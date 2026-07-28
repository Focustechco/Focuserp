import { createFileRoute } from "@tanstack/react-router";
import { ProdutosScreen } from "@/features/produtos/components/ProdutosScreen";

export const Route = createFileRoute("/produtos")({
  component: ProdutosPage,
});

function ProdutosPage() {
  return <ProdutosScreen />;
}
