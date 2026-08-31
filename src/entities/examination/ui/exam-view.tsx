import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import type { ExamData } from "../model";

const dash = (v: string | number | null | undefined) =>
  v === null || v === undefined || v === "" ? "—" : String(v);

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-sm font-medium text-muted-foreground">{children}</h3>
  );
}

export function ExamDataView({ data, notes }: { data: ExamData; notes?: string | null }) {
  const custom = data.custom ?? [];

  return (
    <div className="space-y-8">
      <section>
        <SectionTitle>حدت بینایی (V/A)</SectionTitle>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">چشم</TableHead>
                <TableHead>SC (بدون عینک)</TableHead>
                <TableHead>CC (با عینک)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">راست (OD)</TableCell>
                <TableCell>{dash(data.va?.od?.sc)}</TableCell>
                <TableCell>{dash(data.va?.od?.cc)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">چپ (OS)</TableCell>
                <TableCell>{dash(data.va?.os?.sc)}</TableCell>
                <TableCell>{dash(data.va?.os?.cc)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <SectionTitle>رفرکشن / قدر عینک</SectionTitle>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">چشم</TableHead>
                <TableHead>SPH</TableHead>
                <TableHead>CYL</TableHead>
                <TableHead>AXIS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">راست (OD)</TableCell>
                <TableCell dir="ltr">{dash(data.refraction?.od?.sph)}</TableCell>
                <TableCell dir="ltr">{dash(data.refraction?.od?.cyl)}</TableCell>
                <TableCell dir="ltr">{dash(data.refraction?.od?.axis)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">چپ (OS)</TableCell>
                <TableCell dir="ltr">{dash(data.refraction?.os?.sph)}</TableCell>
                <TableCell dir="ltr">{dash(data.refraction?.os?.cyl)}</TableCell>
                <TableCell dir="ltr">{dash(data.refraction?.os?.axis)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {custom.map((section) => (
        <section key={section.id}>
          <SectionTitle>{section.label}</SectionTitle>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">—</TableHead>
                  {section.columns.map((c) => (
                    <TableHead key={c}>{c}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {section.rows.map((row, r) => (
                  <TableRow key={row + r}>
                    <TableCell className="font-medium">{row}</TableCell>
                    {section.columns.map((_, c) => (
                      <TableCell key={c}>
                        {dash(section.cells?.[`${r}:${c}`])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ))}

      {notes ? (
        <section>
          <SectionTitle>F — یادداشت / فوندوس</SectionTitle>
          <p className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm leading-7">
            {notes}
          </p>
        </section>
      ) : null}
    </div>
  );
}
