import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Briefcase, Users } from 'lucide-react';
import { useColaboradoresQuery } from '../hooks/useColaboradoresQuery';
import { cn } from "@/lib/utils";

interface OrgNode {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar?: string;
  children?: OrgNode[];
}

const OrgChartNode = ({ node, level = 0 }: { node: OrgNode, level?: number }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className={cn("flex flex-col relative items-center", level > 0 && "mt-6")}>
      <div className="flex items-center justify-center relative z-10">
        <Card className="w-[240px] shadow-sm border hover:border-primary/50 transition-colors bg-card">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2 relative">
            {hasChildren && (
              <button 
                onClick={() => setExpanded(!expanded)}
                className="absolute -bottom-3 bg-background border rounded-full p-0.5 shadow-sm hover:bg-muted text-muted-foreground z-20"
              >
                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            )}
            <Avatar className="w-12 h-12 border-2 border-primary/20 overflow-hidden">
              <AvatarImage src={node.avatar} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                {node.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h4 className="font-bold text-xs leading-tight">{node.name}</h4>
              <p className="text-[11px] font-medium text-primary flex items-center justify-center gap-1">
                <Briefcase className="w-3 h-3" /> {node.role}
              </p>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-1">
                {node.department}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {hasChildren && expanded && (
        <div className="relative pt-6 flex justify-center gap-4 before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-px before:h-6 before:bg-border">
          {node.children!.length > 1 && (
            <div className="absolute top-6 left-[calc(50%-calc(var(--spread)/2))] w-[var(--spread)] h-px bg-border"
                 style={{ '--spread': `${(node.children!.length - 1) * 256}px` } as any} 
            />
          )}
          {node.children!.map((child) => (
            <div key={child.id} className="relative flex flex-col items-center before:absolute before:-top-6 before:left-1/2 before:-translate-x-1/2 before:w-px before:h-6 before:bg-border px-2">
              <OrgChartNode node={child} level={level + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function OrganogramaView() {
  const { colaboradores } = useColaboradoresQuery();

  if (colaboradores.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground bg-muted/10 rounded-xl border border-dashed my-4">
        <Users className="w-12 h-12 text-primary opacity-40 mx-auto mb-3" />
        <h4 className="font-bold text-sm text-foreground">Nenhum colaborador cadastrado para exibir no Organograma.</h4>
        <p className="text-xs mt-1">Cadastre o primeiro colaborador na aba "Lista de Colaboradores" para montar a árvore hierárquica.</p>
      </div>
    );
  }

  // Construir árvore hierárquica dinâmica
  const rootColab = colaboradores[0];
  const rootNode: OrgNode = {
    id: rootColab.id,
    name: rootColab.nomeCompleto,
    role: rootColab.cargo,
    department: rootColab.departamento,
    avatar: rootColab.foto,
    children: colaboradores.slice(1).map(c => ({
      id: c.id,
      name: c.nomeCompleto,
      role: c.cargo,
      department: c.departamento,
      avatar: c.foto
    }))
  };

  return (
    <div className="w-full overflow-x-auto pb-10 pt-4 scrollbar-hide animate-fade-in bg-muted/10 rounded-xl border border-dashed">
      <div className="min-w-max p-8 flex justify-center">
        <OrgChartNode node={rootNode} />
      </div>
    </div>
  );
}
