import * as React from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";
import { Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Space = {
  id: number | string;
  title: string;
  price: number;
};

type QuoteItem = {
  id: number | string;
  title: string;
  cantidad: number;
  precio: number;
};

const SERVICES = [
  { id: "instalacion", label: "Instalación", price: 500 },
  { id: "diseno", label: "Diseño", price: 800 },
  { id: "retiro", label: "Retiro de lona", price: 300 },
];

export default function QuoteCreatePage() {
  const location = useLocation();
  const spaces: Space[] = location.state?.spaces ?? [];
  const [includeIVA, setIncludeIVA] = React.useState(true);

  const [items, setItems] = React.useState<QuoteItem[]>(
    spaces.map((space) => ({
      id: space.id,
      title: space.title,
      cantidad: 1,
      precio: Number(space.price ?? 0),
    })),
  );

  const [selectedService, setSelectedService] = React.useState("");
  const subtotalGeneral = items.reduce(
    (acc, item) => acc + item.cantidad * item.precio,
    0,
  );

  const ivaGeneral = includeIVA ? subtotalGeneral * 0.16 : 0;

  const totalGeneral = subtotalGeneral + ivaGeneral;

  const updateItem = (id: number | string, changes: Partial<QuoteItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  };

  const removeItem = (id: number | string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addService = (serviceId: string) => {
    const service = SERVICES.find((s) => s.id === serviceId);
    if (!service) return;

    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: service.label,
        cantidad: 1,
        precio: service.price,
      },
    ]);

    setSelectedService("");
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Cotización", 14, 20);

    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 28);

    const tableData = items.map((item) => {
      const subtotal = item.cantidad * item.precio;
      const iva = includeIVA ? subtotal * 0.16 : 0;
      const total = includeIVA ? subtotal + iva : subtotal;

      return [
        item.title,
        item.cantidad,
        `$${item.precio.toLocaleString()}`,
        `$${subtotal.toLocaleString()}`,
        includeIVA ? `$${iva.toLocaleString()}` : "-",
        `$${total.toLocaleString()}`,
      ];
    });

    autoTable(doc, {
      startY: 35,
      head: [["Producto", "Cantidad", "Precio", "Subtotal", "IVA", "Total"]],
      body: tableData,
    });

    const finalY =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 10;

    doc.text(`Subtotal: $${subtotalGeneral.toLocaleString()}`, 140, finalY);

    if (includeIVA) {
      doc.text(`IVA: $${ivaGeneral.toLocaleString()}`, 140, finalY + 6);
    }

    doc.text(`TOTAL: $${totalGeneral.toLocaleString()}`, 140, finalY + 12);

    doc.save("cotizacion.pdf");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-end mt-4">
        <Button onClick={downloadPDF}>Descargar cotización PDF</Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-muted-foreground">
                <th className="text-left py-3">ID</th>
                <th className="text-left">Producto</th>
                <th>Cantidad</th>
                <th>Precio unitario</th>
                <th>Subtotal</th>
                {includeIVA && <th>IVA</th>}
                <th>Total</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => {
                const subtotal = item.cantidad * item.precio;
                const iva = includeIVA ? subtotal * 0.16 : 0;
                const total = includeIVA ? subtotal + iva : subtotal;

                return (
                  <tr key={item.id} className="border-b">
                    <td className="py-4">{item.id}</td>

                    <td>{item.title}</td>

                    <td>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() =>
                            updateItem(item.id, {
                              cantidad: Math.max(1, item.cantidad - 1),
                            })
                          }
                        >
                          <Minus size={14} />
                        </Button>

                        <span className="w-6 text-center">{item.cantidad}</span>

                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() =>
                            updateItem(item.id, {
                              cantidad: item.cantidad + 1,
                            })
                          }
                        >
                          <Plus size={14} />
                        </Button>
                      </div>
                    </td>

                    <td>
                      <Input
                        className="w-24 text-center appearance-none"
                        type="text"
                        inputMode="decimal"
                        value={item.precio}
                        onChange={(e) =>
                          updateItem(item.id, {
                            precio: Number(e.target.value || 0),
                          })
                        }
                      />
                    </td>

                    <td>${subtotal.toLocaleString()}</td>

                    {includeIVA && <td>${iva.toLocaleString()}</td>}

                    <td className="font-semibold">${total.toLocaleString()}</td>
                    <td>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <div className="flex justify-end mt-6">
        <Card className="w-80">
          <CardContent className="p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotalGeneral.toLocaleString()}</span>
            </div>

            {includeIVA && (
              <div className="flex justify-between">
                <span>IVA (16%)</span>
                <span>${ivaGeneral.toLocaleString()}</span>
              </div>
            )}

            <div className="border-t pt-2 flex justify-between font-semibold text-base">
              <span>TOTAL</span>
              <span>${totalGeneral.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-sm space-y-3">
        <div className="text-sm font-medium">Agregar servicio</div>

        <select
          value={selectedService}
          onChange={(e) => {
            setSelectedService(e.target.value);
            addService(e.target.value);
          }}
          className="w-full border rounded-md p-2"
        >
          <option value="">Selecciona un servicio</option>

          {SERVICES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        <div className="text-sm font-medium">¿Incluir IVA?</div>

        <select
          value={includeIVA ? "si" : "no"}
          onChange={(e) => setIncludeIVA(e.target.value === "si")}
          className="w-full border rounded-md p-2"
        >
          <option value="si">Sí</option>
          <option value="no">No</option>
        </select>
      </div>
    </div>
  );
}
