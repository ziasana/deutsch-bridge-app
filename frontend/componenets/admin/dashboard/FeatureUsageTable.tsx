import { Card, CardContent, CardHeader, CardTitle } from "@/componenets/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/componenets/ui/table";
import { moduleLabel } from "@/componenets/admin/dashboard/moduleLabels";
import type { FeatureUsageEntry } from "@/types/adminAnalytics";

export default function FeatureUsageTable({ data }: Readonly<{ data: FeatureUsageEntry[] }>) {
    return (
        <Card className="py-0 overflow-hidden">
            <CardHeader className="pt-6">
                <CardTitle className="text-base">Usage Details</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
                {data.length === 0 ? (
                    <p className="px-6 py-10 text-center text-sm text-foreground/50">
                        No usage data for this period.
                    </p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Module</TableHead>
                                <TableHead className="text-right">Learners</TableHead>
                                <TableHead className="text-right">Activities</TableHead>
                                <TableHead className="text-right">Reach</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((row) => (
                                <TableRow key={row.module}>
                                    <TableCell className="font-medium text-foreground">{moduleLabel(row.module)}</TableCell>
                                    <TableCell className="text-right tabular-nums">{row.uniqueLearners.toLocaleString()}</TableCell>
                                    <TableCell className="text-right tabular-nums">{row.activities.toLocaleString()}</TableCell>
                                    <TableCell className="text-right tabular-nums">{row.reachPercentage.toFixed(0)}%</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
