import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { DatabaseZap, FileSpreadsheet, RefreshCcw } from 'lucide-react';
import type { FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Imports',
        href: '/imports',
    },
];

interface ImportsPageProps {
    activeCycle: {
        id: number;
        name: string;
        starts_on: string;
        ends_on: string;
    };
    importStats: {
        employees: number;
        projects: number;
        allocations: number;
        reviews: number;
    };
    importChecklist: string[];
}

export default function ImportsPage({ activeCycle, importStats, importChecklist }: ImportsPageProps) {
    const { flash } = usePage<SharedData>().props;
    const { data, setData, post, processing, errors, progress } = useForm<{
        cycle_name: string;
        workbook: File | null;
    }>({
        cycle_name: activeCycle.name,
        workbook: null,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('loe.imports.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Imports" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card className="overflow-hidden rounded-[28px] border-white/60 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_28%),linear-gradient(135deg,_#f4fff8,_#ffffff_45%,_#f7fbff)] shadow-sm dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.15),_transparent_28%),linear-gradient(135deg,_rgba(2,6,23,0.98),_rgba(15,23,42,0.95),_rgba(6,78,59,0.72))]">
                        <CardHeader className="space-y-5">
                            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
                                Admin import flow
                            </div>
                            <div className="space-y-3">
                                <CardTitle className="text-4xl tracking-tight">Refresh the system from the real LOE workbook.</CardTitle>
                                <CardDescription className="max-w-2xl text-sm leading-6 md:text-base">
                                    Upload the latest workbook export and promote it into the active cycle without leaving the app or touching the CLI.
                                </CardDescription>
                            </div>
                        </CardHeader>
                    </Card>

                    <Card className="rounded-[28px] border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                        <CardHeader>
                            <CardDescription>Current live cycle</CardDescription>
                            <CardTitle>{activeCycle.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                            <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                <p className="text-sm text-muted-foreground">Employees</p>
                                <p className="mt-3 text-4xl font-semibold">{importStats.employees}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                <p className="text-sm text-muted-foreground">Projects</p>
                                <p className="mt-3 text-4xl font-semibold">{importStats.projects}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                <p className="text-sm text-muted-foreground">Allocations</p>
                                <p className="mt-3 text-4xl font-semibold">{importStats.allocations}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                <p className="text-sm text-muted-foreground">Reviews</p>
                                <p className="mt-3 text-4xl font-semibold">{importStats.reviews}</p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                    <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                        <CardHeader>
                            <CardDescription>Upload workbook</CardDescription>
                            <CardTitle>Import a fresh cycle</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-5" onSubmit={submit}>
                                <div className="space-y-2">
                                    <Label htmlFor="cycle_name">Cycle name</Label>
                                    <Input
                                        id="cycle_name"
                                        onChange={(event) => setData('cycle_name', event.target.value)}
                                        placeholder="April 2026"
                                        value={data.cycle_name}
                                    />
                                    {errors.cycle_name && <p className="text-sm text-destructive">{errors.cycle_name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="workbook">Workbook file</Label>
                                    <Input
                                        accept=".xlsx,.xls"
                                        id="workbook"
                                        onChange={(event) => setData('workbook', event.target.files?.[0] ?? null)}
                                        type="file"
                                    />
                                    {errors.workbook && <p className="text-sm text-destructive">{errors.workbook}</p>}
                                </div>

                                {progress && (
                                    <div className="space-y-2">
                                        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                            <div className="h-full rounded-full bg-[linear-gradient(90deg,#0f766e,#22c55e)]" style={{ width: `${progress.percentage}%` }} />
                                        </div>
                                        <p className="text-sm text-muted-foreground">Uploading {progress.percentage}%</p>
                                    </div>
                                )}

                                <Button className="w-full bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200" disabled={processing} type="submit">
                                    {processing ? 'Importing workbook...' : 'Import workbook'}
                                </Button>

                                {flash?.success && <p className="text-sm text-emerald-600">{flash.success}</p>}
                            </form>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                            <CardHeader>
                                <CardDescription>Import checklist</CardDescription>
                                <CardTitle>What this screen now does for admins</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {importChecklist.map((item, index) => (
                                    <div key={item} className="flex gap-3 rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
                                            {index + 1}
                                        </div>
                                        <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                            <CardContent className="grid gap-4 p-6 md:grid-cols-3">
                                <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                    <FileSpreadsheet className="size-5 text-muted-foreground" />
                                    <p className="mt-3 font-medium">Workbook-driven</p>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">Matches your current operating source instead of forcing manual re-entry.</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                    <RefreshCcw className="size-5 text-muted-foreground" />
                                    <p className="mt-3 font-medium">Cycle refresh</p>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">Each import can establish a fresh active cycle for reporting and review.</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                    <DatabaseZap className="size-5 text-muted-foreground" />
                                    <p className="mt-3 font-medium">Live data</p>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">Employees, projects, allocations, and review status update in the product database.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
