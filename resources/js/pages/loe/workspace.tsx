import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type QuickAction, type SharedData, type WorkspaceEmployeeListItem, type WorkspacePayload } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Gauge, Radar, Sparkles } from 'lucide-react';
import type { FormEvent } from 'react';
import { startTransition, useEffect, useMemo } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'My Workspace',
        href: '/workspace',
    },
];

interface WorkspacePageProps {
    employeeWorkspace: WorkspacePayload;
    employees: WorkspaceEmployeeListItem[];
    allocationPrinciples: string[];
    quickActions: QuickAction[];
    allocationChanges: Array<{
        id: number;
        changedBy: string;
        changedAt: string | null;
        beforeTotal: number;
        afterTotal: number;
        summary: string | null;
    }>;
    activeCycle: {
        id: number;
        name: string;
    };
    canEditAllocation: boolean;
    isOwnWorkspace: boolean;
}

export default function WorkspacePage({ employeeWorkspace, employees, allocationPrinciples, quickActions, allocationChanges, activeCycle, canEditAllocation, isOwnWorkspace }: WorkspacePageProps) {
    const { permissions, flash } = usePage<SharedData>().props;
    const canSwitchWorkspace = permissions?.canSwitchWorkspace ?? false;

    const { data, setData, put, errors, processing, recentlySuccessful } = useForm({
        allocations: employeeWorkspace.projects.map((project) => ({
            project_id: project.project_id,
            effort: project.allocation,
        })),
    });

    useEffect(() => {
        setData(
            'allocations',
            employeeWorkspace.projects.map((project) => ({
                project_id: project.project_id,
                effort: project.allocation,
            })),
        );
    }, [employeeWorkspace.employee.id, employeeWorkspace.projects, setData]);

    const total = useMemo(() => data.allocations.reduce((sum, value) => sum + Number(value.effort), 0), [data.allocations]);
    const availability = useMemo(() => Number((1 - total).toFixed(2)), [total]);
    const delta = Number((1 - total).toFixed(2));

    const state = useMemo(() => {
        if (total > 1) {
            return {
                label: 'Over capacity',
                tone: 'destructive' as const,
                message: `Reduce ${Math.abs(delta).toFixed(2)} before this can be submitted.`,
            };
        }

        if (total < 1) {
            return {
                label: 'Capacity still open',
                tone: 'secondary' as const,
                message: `${delta.toFixed(2)} capacity is still unassigned.`,
            };
        }

        return {
            label: 'Ready to submit',
            tone: 'default' as const,
            message: 'Your allocation is balanced and ready for reviewer confirmation.',
        };
    }, [delta, total]);

    const updateAllocation = (index: number, nextValue: number) => {
        setData(
            'allocations',
            data.allocations.map((allocation, currentIndex) =>
                currentIndex === index ? { ...allocation, effort: nextValue } : allocation,
            ),
        );
    };

    const applyPreset = (values: number[]) => {
        startTransition(() => {
            setData(
                'allocations',
                data.allocations.map((allocation, index) => ({
                    ...allocation,
                    effort: values[index] ?? 0,
                })),
            );
        });
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!canEditAllocation) {
            return;
        }

        put(route('loe.workspace.update', employeeWorkspace.employee.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Workspace" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                    <Card className="overflow-hidden rounded-[28px] border-white/60 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_28%),linear-gradient(135deg,_#f7fcff,_#ffffff_45%,_#f5fffb)] shadow-sm dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_25%),linear-gradient(135deg,_rgba(2,6,23,0.98),_rgba(15,23,42,0.95),_rgba(8,47,73,0.8))]">
                        <CardHeader className="space-y-5">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.22em]" variant="secondary">
                                    Employee-first flow
                                </Badge>
                                <Badge variant="outline">{activeCycle.name}</Badge>
                            </div>
                            <div className="space-y-3">
                                <CardTitle className="text-4xl tracking-tight">{employeeWorkspace.employee.preferredName}, update your month in three minutes.</CardTitle>
                                <CardDescription className="max-w-2xl text-sm leading-6 md:text-base">
                                    {employeeWorkspace.employee.focusPrompt}
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                <Badge variant="outline">{employeeWorkspace.employee.stream}</Badge>
                                <Badge variant="outline">{employeeWorkspace.employee.title}</Badge>
                                <Badge variant="outline">Reviewer: {employeeWorkspace.employee.reviewer}</Badge>
                                <Badge variant="outline">{employeeWorkspace.employee.location}</Badge>
                            </div>
                        </CardHeader>
                    </Card>

                    <Card className="rounded-[28px] border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                        <CardHeader>
                            <CardDescription>{canSwitchWorkspace ? 'People selector' : 'Your cycle snapshot'}</CardDescription>
                            <CardTitle>{canSwitchWorkspace ? 'Switch perspectives without leaving the flow' : 'You only see your own workspace'}</CardTitle>
                        </CardHeader>
                        <CardContent className="max-h-[30rem] space-y-3 overflow-y-auto pr-2">
                            {canSwitchWorkspace ? (
                                employees.map((employee) => (
                                    <Link
                                        key={employee.id}
                                        className={`block rounded-2xl border p-4 transition ${
                                            employee.id === employeeWorkspace.employee.id
                                                ? 'border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950'
                                                : 'border-slate-200/80 hover:border-slate-950 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-300 dark:hover:bg-slate-900'
                                        }`}
                                        href={`/workspace?employee=${employee.id}`}
                                        prefetch
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="font-medium">{employee.preferredName}</p>
                                                <p className="text-sm opacity-80">{employee.stream}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-semibold">{employee.totalAllocation.toFixed(2)}</p>
                                                <p className="text-xs uppercase tracking-[0.18em] opacity-70">{employee.reviewStatus}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                    <p className="font-medium">{employeeWorkspace.employee.name}</p>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                        Role-aware access keeps employee users focused on their own allocation instead of browsing the whole team.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <form className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]" onSubmit={submit}>
                    <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                        <CardHeader>
                            <CardDescription>{canEditAllocation ? 'Allocation editor' : 'Allocation view'}</CardDescription>
                            <CardTitle>{canEditAllocation ? 'Only the relevant projects are in front of you' : 'You can review allocation, but only utilization is editable for your own profile'}</CardTitle>
                        </CardHeader>
                        <CardContent className="max-h-[38rem] space-y-4 overflow-y-auto pr-2">
                            {employeeWorkspace.projects.map((project, index) => (
                                <div key={project.project_id} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-medium">{project.name}</p>
                                                <Badge variant="outline">Priority {project.priority}</Badge>
                                                <Badge variant="secondary">{project.type}</Badge>
                                            </div>
                                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.note}</p>
                                        </div>
                                        <div className="rounded-2xl bg-slate-950 px-3 py-2 text-right text-white dark:bg-white dark:text-slate-950">
                                            <p className="text-[11px] uppercase tracking-[0.18em]">Allocation</p>
                                            <p className="text-2xl font-semibold">{Number(data.allocations[index]?.effort ?? 0).toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <div className="mt-5 space-y-2">
                                        <input
                                            aria-label={`${project.name} allocation`}
                                            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-950 dark:bg-slate-800 dark:accent-white"
                                            disabled={!canEditAllocation}
                                            max={1}
                                            min={0}
                                            onChange={(event) => updateAllocation(index, Number(event.target.value))}
                                            step={0.05}
                                            type="range"
                                            value={Number(data.allocations[index]?.effort ?? 0)}
                                        />
                                        <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                            <span>0.00</span>
                                            <span>0.50</span>
                                            <span>1.00</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex flex-wrap gap-2 text-sm">
                                                <Badge variant="outline">Utilized {Number(project.utilization ?? 0).toFixed(2)}</Badge>
                                                <Badge
                                                    variant={
                                                        Number(project.utilizationDelta ?? 0) > 0
                                                            ? 'secondary'
                                                            : Number(project.utilizationDelta ?? 0) < 0
                                                              ? 'destructive'
                                                              : 'outline'
                                                    }
                                                >
                                                    Delta {Number(project.utilizationDelta ?? 0) >= 0 ? '+' : ''}
                                                    {Number(project.utilizationDelta ?? 0).toFixed(2)}
                                                </Badge>
                                            </div>
                                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Actual month usage</p>
                                        </div>
                                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                            {project.utilizationNote || 'No utilization note has been submitted for this project yet.'}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {errors.allocations && <p className="text-sm text-destructive">{errors.allocations}</p>}
                            {!canEditAllocation && (
                                <p className="text-sm text-muted-foreground">
                                    {isOwnWorkspace
                                        ? 'Your own allocation is view-only. Update your actual month in My Utilization instead.'
                                        : 'Allocation editing is restricted on this profile.'}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                            <CardHeader>
                                <CardDescription>Live submission state</CardDescription>
                                <CardTitle>Instant feedback replaces spreadsheet guesswork</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                        <p className="text-sm text-muted-foreground">Total allocation</p>
                                        <p className="mt-3 text-4xl font-semibold">{total.toFixed(2)}</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                        <p className="text-sm text-muted-foreground">Availability</p>
                                        <p className="mt-3 text-4xl font-semibold">{Math.max(availability, 0).toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Actual utilization</p>
                                            <p className="mt-3 text-4xl font-semibold">{employeeWorkspace.totals.utilization?.toFixed(2) ?? '0.00'}</p>
                                        </div>
                                        <Badge variant="outline">
                                            Delta {(Number((employeeWorkspace.totals.utilization ?? 0) - total).toFixed(2)) >= 0 ? '+' : ''}
                                            {Number((employeeWorkspace.totals.utilization ?? 0) - total).toFixed(2)}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-medium">Submission status</p>
                                            <p className="text-sm text-muted-foreground">{state.message}</p>
                                        </div>
                                        <Badge variant={state.tone}>{state.label}</Badge>
                                    </div>
                                </div>
                                {canEditAllocation ? (
                                    <Button className="w-full bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200" disabled={processing} type="submit">
                                        Save allocation draft
                                    </Button>
                                ) : (
                                    <Button asChild className="w-full bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
                                        <Link href={isOwnWorkspace ? '/utilization' : `/utilization?employee=${employeeWorkspace.employee.id}`} prefetch>
                                            Open utilization
                                        </Link>
                                    </Button>
                                )}
                                {(recentlySuccessful || flash?.success) && (
                                    <p className="text-sm text-emerald-600">{flash?.success ?? 'Allocation saved and moved into review.'}</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                            <CardHeader>
                                <CardDescription>Quick templates</CardDescription>
                                <CardTitle>Suggested splits reduce decision fatigue</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {employeeWorkspace.presets.map((preset) => (
                                    <button
                                        key={preset.label}
                                        className="w-full rounded-2xl border border-slate-200/80 p-4 text-left transition hover:border-slate-950 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-300 dark:hover:bg-slate-900"
                                        onClick={() => applyPreset(preset.allocations)}
                                        type="button"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="font-medium">{preset.label}</p>
                                            <Sparkles className="size-4 text-muted-foreground" />
                                        </div>
                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{preset.description}</p>
                                    </button>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </form>

                <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                    <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                        <CardHeader>
                            <CardDescription>Rules from the current operating model</CardDescription>
                            <CardTitle>The system still respects your existing LOE math</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {allocationPrinciples.map((principle) => (
                                <div key={principle} className="flex gap-3 rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                    <CheckCircle2 className="mt-0.5 size-4 text-emerald-500" />
                                    <p className="text-sm leading-6 text-muted-foreground">{principle}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                        <CardHeader>
                            <CardDescription>What makes this comprehensive</CardDescription>
                            <CardTitle>Employee convenience and admin control are designed together</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-3">
                            {quickActions.map((action, index) => (
                                <div key={action.title} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="font-medium">{action.title}</p>
                                        {index === 0 ? <Radar className="size-4 text-muted-foreground" /> : index === 1 ? <Gauge className="size-4 text-muted-foreground" /> : <Sparkles className="size-4 text-muted-foreground" />}
                                    </div>
                                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{action.detail}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>

                <section>
                    <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                        <CardHeader>
                            <CardDescription>Allocation history</CardDescription>
                            <CardTitle>See who changed this allocation and what moved</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {allocationChanges.length > 0 ? (
                                allocationChanges.map((change) => (
                                    <div key={change.id} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <p className="font-medium">{change.changedBy}</p>
                                                <p className="text-sm text-muted-foreground">{change.changedAt ?? 'Recently updated'}</p>
                                            </div>
                                            <Badge variant="outline">
                                                {change.beforeTotal.toFixed(2)} to {change.afterTotal.toFixed(2)}
                                            </Badge>
                                        </div>
                                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                            {change.summary || 'Allocation was updated for this cycle.'}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        No allocation changes have been recorded for this employee in the active cycle yet.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}
