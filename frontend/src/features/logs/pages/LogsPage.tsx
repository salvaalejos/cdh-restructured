import { useState } from "react";
import { useLogs } from "../api/logHooks";
import type { AppLog } from "../types";
import { 
  Bug, 
  Search, 
  Filter, 
  RefreshCw, 
  AlertTriangle, 
  AlertCircle, 
  Info as InfoIcon,
  ChevronLeft, 
  ChevronRight,
  Terminal,
  User as UserIcon,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [tagFilter, setTagFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedLog, setSelectedLog] = useState<AppLog | null>(null);

  const { data, isLoading, isFetching, refetch } = useLogs({
    page,
    limit: 15,
    level: levelFilter !== "ALL" ? levelFilter : undefined,
    tag: tagFilter !== "ALL" ? tagFilter : undefined,
    search: searchTerm || undefined,
  });

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "ERROR":
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> ERROR</Badge>;
      case "WARN":
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> WARN</Badge>;
      case "INFO":
      default:
        return <Badge variant="secondary" className="flex items-center gap-1"><InfoIcon className="w-3 h-3" /> INFO</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-destructive/10 text-destructive rounded-lg">
              <Bug className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Logs de Telemetría y Depuración
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Visualización en tiempo real de errores de sincronización, conectividad y estado del sistema.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Errores</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {data?.stats?.totalErrors ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Errores críticos registrados</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fallos de Subida (UPLOAD)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {data?.stats?.uploadErrors ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Fallos en sincronización de encuestas</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Eventos</CardTitle>
            <Terminal className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {data?.stats?.totalLogs ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Eventos guardados en base de datos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 bg-card border-border shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en mensaje o módulo..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">Nivel:</span>
              <select
                value={levelFilter}
                onChange={(e) => {
                  setLevelFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-32 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
              >
                <option value="ALL">Todos</option>
                <option value="ERROR">ERROR</option>
                <option value="WARN">WARN</option>
                <option value="INFO">INFO</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Módulo:</span>
              <select
                value={tagFilter}
                onChange={(e) => {
                  setTagFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-36 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
              >
                <option value="ALL">Todos</option>
                <option value="UPLOAD">UPLOAD</option>
                <option value="DATABASE">DATABASE</option>
                <option value="NETWORK">NETWORK</option>
                <option value="SYSTEM">SYSTEM</option>
                <option value="AUTH">AUTH</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
              <tr>
                <th className="px-4 py-3">Fecha y Hora</th>
                <th className="px-4 py-3">Nivel</th>
                <th className="px-4 py-3">Módulo</th>
                <th className="px-4 py-3">Usuario / Encuestador</th>
                <th className="px-4 py-3">Mensaje</th>
                <th className="px-4 py-3 text-right">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Cargando logs del sistema...
                  </td>
                </tr>
              ) : !data?.logs || data.logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    No se encontraron registros de logs con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                data.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getLevelBadge(log.level)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant="outline" className="font-mono text-xs">
                        {log.tag}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      {log.user ? (
                        <div className="flex items-center gap-1.5 text-foreground font-medium">
                          <UserIcon className="w-3.5 h-3.5 text-primary" />
                          {log.user.name} ({log.user.username})
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Anónimo / Sistema</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground max-w-md truncate font-mono text-xs">
                      {log.message}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="text-xs"
                      >
                        Ver Detalle
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Página {data.page} de {data.totalPages} ({data.total} registros)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(p + 1, data.totalPages))}
                disabled={page === data.totalPages}
              >
                Siguiente <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Log Details Modal */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Terminal className="h-5 w-5 text-primary" />
              Detalle del Registro #{selectedLog?.id}
            </DialogTitle>
            <DialogDescription>
              Inspección completa del evento de telemetría y metadatos capturados.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted/40 rounded-lg border border-border">
                <div>
                  <span className="font-semibold text-muted-foreground">Fecha y Hora:</span>
                  <div className="text-foreground font-medium mt-0.5">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Nivel / Módulo:</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {getLevelBadge(selectedLog.level)}
                    <Badge variant="outline">{selectedLog.tag}</Badge>
                  </div>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Usuario:</span>
                  <div className="text-foreground font-medium mt-0.5">
                    {selectedLog.user ? `${selectedLog.user.name} (@${selectedLog.user.username})` : "Anónimo / Sistema"}
                  </div>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">ID de Log:</span>
                  <div className="text-foreground font-mono mt-0.5">#{selectedLog.id}</div>
                </div>
              </div>

              <div>
                <span className="font-semibold text-muted-foreground block mb-1">Mensaje:</span>
                <div className="p-3 bg-card border border-border rounded-lg text-foreground font-mono text-sm leading-relaxed">
                  {selectedLog.message}
                </div>
              </div>

              {selectedLog.details && (
                <div>
                  <span className="font-semibold text-muted-foreground block mb-1">
                    Metadatos JSON / Stack Trace:
                  </span>
                  <pre className="p-3 bg-slate-950 text-slate-100 rounded-lg overflow-x-auto font-mono text-xs leading-relaxed max-h-80">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
