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
    <h3 className="mb-2 text-sm font-medium text-muted-foreground text-right">{children}</h3>
  );
}

export function ExamDataView({ data, notes }: { data: ExamData; notes?: string | null }) {
  const custom = data.custom ?? [];

  return (
    <div className="space-y-8">
      <section>
        <SectionTitle>حدت بینایی (V/A)</SectionTitle>
        <div className="overflow-hidden rounded-lg border" dir="ltr">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32 text-center">چشم</TableHead>
                <TableHead className="text-center">SC (بدون عینک)</TableHead>
                <TableHead className="text-center">CC (با عینک)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-center">راست (OD)</TableCell>
                <TableCell className="text-center">{dash(data.va?.od?.sc)}</TableCell>
                <TableCell className="text-center">{dash(data.va?.od?.cc)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-center">چپ (OS)</TableCell>
                <TableCell className="text-center">{dash(data.va?.os?.sc)}</TableCell>
                <TableCell className="text-center">{dash(data.va?.os?.cc)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <SectionTitle>رفرکشن Dry</SectionTitle>
        <div className="overflow-hidden rounded-lg border" dir="ltr">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32 text-center">چشم</TableHead>
                <TableHead className="text-center">SPH</TableHead>
                <TableHead className="text-center">CYL</TableHead>
                <TableHead className="text-center">AXIS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-center">راست (OD)</TableCell>
                <TableCell dir="ltr" className="text-center">{dash(data.refractionDry?.od?.sph)}</TableCell>
                <TableCell dir="ltr" className="text-center">{dash(data.refractionDry?.od?.cyl)}</TableCell>
                <TableCell dir="ltr" className="text-center">{dash(data.refractionDry?.od?.axis)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-center">چپ (OS)</TableCell>
                <TableCell dir="ltr" className="text-center">{dash(data.refractionDry?.os?.sph)}</TableCell>
                <TableCell dir="ltr" className="text-center">{dash(data.refractionDry?.os?.cyl)}</TableCell>
                <TableCell dir="ltr" className="text-center">{dash(data.refractionDry?.os?.axis)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <SectionTitle>رفرکشن Cyclo</SectionTitle>
        <div className="overflow-hidden rounded-lg border" dir="ltr">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32 text-center">چشم</TableHead>
                <TableHead className="text-center">SPH</TableHead>
                <TableHead className="text-center">CYL</TableHead>
                <TableHead className="text-center">AXIS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-center">راست (OD)</TableCell>
                <TableCell dir="ltr" className="text-center">{dash(data.refractionCyclo?.od?.sph)}</TableCell>
                <TableCell dir="ltr" className="text-center">{dash(data.refractionCyclo?.od?.cyl)}</TableCell>
                <TableCell dir="ltr" className="text-center">{dash(data.refractionCyclo?.od?.axis)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-center">چپ (OS)</TableCell>
                <TableCell dir="ltr" className="text-center">{dash(data.refractionCyclo?.os?.sph)}</TableCell>
                <TableCell dir="ltr" className="text-center">{dash(data.refractionCyclo?.os?.cyl)}</TableCell>
                <TableCell dir="ltr" className="text-center">{dash(data.refractionCyclo?.os?.axis)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {data.diagnosis && (
        <section>
          <SectionTitle>تشخیص</SectionTitle>
          <p className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm leading-7">
            {data.diagnosis}
          </p>
        </section>
      )}

      {data.plan && (
        <section>
          <SectionTitle>پلن</SectionTitle>
          <p className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm leading-7">
            {data.plan}
          </p>
        </section>
      )}

      {custom.map((section) => (
        <section key={section.id}>
          <SectionTitle>{section.label}</SectionTitle>
          <div className="overflow-hidden rounded-lg border" dir="ltr">
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
