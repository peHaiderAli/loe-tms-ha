import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData, type WorkspaceEmployeeListItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import { startTransition, useEffect, useMemo, useState, type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Utilization',
        href: '/utilization',
    },
];

interface UtilizationProject {
    project_id: number;
    name: string;
    type: string;
    allocation: number;
    utilization: number;
    delta: number;
    note?: string | null;
}

interface UtilizationWorkspaceProps {
    employee: {
        id: number;
        name: string;
        preferredName: string;
        stream: string;
        title: string;
        reviewer: string;
        reviewStatus: string;
        location: string;
        focusPrompt: string;
    };
    projects: UtilizationProject[];
    availableProjects: Array<{
        project_id: number;
        name: string;
        type: string;
    }>;
    totals: {
        allocation: number;
        utilization: number;
        variance: number;
    };
    submission: {
        status: string;
        submittedAt: string | null;
    };
    guidance: string[];
}

interface UtilizationPageProps {
    utilizationWorkspace: UtilizationWorkspaceProps;
    employees: WorkspaceEmployeeListItem[];
    activeCycle: {
        id: number;
        name: string;
    };
    canSwitchWorkspace: boolean;
    isOwnWorkspace: boolean;
}

export default function UtilizationPage({ utilizationWorkspace, employees, activeCycle, canSwitchWorkspace, isOwnWorkspace }: UtilizationPageProps) {
    const { flash } = usePage<SharedData>().props;
    const [projectPicker, setProjectPicker] = useState('');
    const syncKey = useMemo(
        () =>
            [
                utilizationWorkspace.employee.id,
                utilizationWorkspace.submission.submittedAt ?? 'blank',
                utilizationWorkspace.projects.map((project) => `${project.project_id}:${project.utilization}:${project.note ?? ''}`).join('|'),
            ].join('::'),
        [utilizationWorkspace.employee.id, utilizationWorkspace.projects, utilizationWorkspace.submission.submittedAt],
    );
    const { data, setData, processing, errors, recentlySuccessful } = useForm({
        utilizations: utilizationWorkspace.projects.map((project) => ({
            project_id: project.project_id,
            name: project.name,
            type: project.type,
            allocation: project.allocation,
            effort: project.utilization,
            note: project.note ?? '',
        })),
    });

    useEffect(() => {
        setData(
            'utilizations',
            utilizationWorkspace.projects.map((project) => ({
                project_id: project.project_id,
                name: project.name,
                type: project.type,
                allocation: project.allocation,
                effort: project.utilization,
                note: project.note ?? '',
            })),
        );
        setProjectPicker('');
    }, [setData, syncKey]);

    const totalUtilization = useMemo(
        () => data.utilizations.reduce((sum, item) => sum + Number(item.effort || 0), 0),
        [data.utilizations],
    );

    const variance = Number((totalUtilization - utilizationWorkspace.totals.allocation).toFixed(2));
    const selectableProjects = useMemo(
        () =>
            utilizationWorkspace.availableProjects.filter(
                (project) => !data.utilizations.some((item) => Number(item.project_id) === project.project_id),
            ),
        [data.utilizations, utilizationWorkspace.availableProjects],
    );

    const addProject = () => {
        const selected = selectableProjects.find((project) => project.project_id.toString() === projectPicker);

        if (!selected) {
            return;
        }

        startTransition(() => {
            setData('utilizations', [
                ...data.utilizations,
                {
                    project_id: selected.project_id,
                    name: selected.name,
                    type: selected.type,
                    allocation: 0,
                    effort: 0,
                    note: '',
                },
            ]);
            setProjectPicker('');
        });
    };

    const updateUtilization = (index: number, field: 'effort' | 'note', value: number | string) => {
        setData(
            'utilizations',
            data.utilizations.map((item, currentIndex) => (currentIndex === index ? { ...item, [field]: value } : item)),
        );
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.put(
            route('loe.utilization.update', utilizationWorkspace.employee.id),
            {
                utilizations: data.utilizations.map((project) => ({
                project_id: Number(project.project_id),
                effort: Number(project.effort || 0),
                note: project.note || '',
            })),
            },
            {
                preserveScroll: true,
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Utilization" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                    <Card className="overflow-hidden rounded-[28px] border-white/60 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.16),_transparent_28%),linear-gradient(135deg,_#f3fffd,_#ffffff_45%,_#f8fbff)] shadow-sm dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.14),_transparent_25%),linear-gradient(135deg,_rgba(2,6,23,0.98),_rgba(15,23,42,0.95),_rgba(17,94,89,0.8))]">
                        <CardHeader className="space-y-5">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.22em]" variant="secondary">
                                    Actual month-end effort
                                </Badge>
                                <Badge variant="outline">{activeCycle.name}</Badge>
                                <Badge variant="outline">{utilizationWorkspace.submission.status}</Badge>
                            </div>
                            <div className="space-y-3">
                                <CardTitle className="text-4xl tracking-tight">
                                    {utilizationWorkspace.employee.preferredName}, capture how the month actually landed.
                                </CardTitle>
                                <CardDescription className="max-w-2xl text-sm leading-6 md:text-base">
                                    {utilizationWorkspace.employee.focusPrompt}
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                <Badge variant="outline">{utilizationWorkspace.employee.stream}</Badge>
                                <Badge variant="outline">{utilizationWorkspace.employee.title}</Badge>
                                <Badge variant="outline">Reviewer: {utilizationWorkspace.employee.reviewer}</Badge>
                                <Badge variant="outline">{utilizationWorkspace.employee.location}</Badge>
                            </div>
                        </CardHeader>
                    </Card>

                    <Card className="rounded-[28px] border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                        <CardHeader>
                            <CardDescription>{canSwitchWorkspace ? 'People selector' : 'Your submission state'}</CardDescription>
                            <CardTitle>{canSwitchWorkspace ? 'Compare actuals across the team' : 'Your current month utilization status'}</CardTitle>
                        </CardHeader>
                        <CardContent className="max-h-[30rem] space-y-3 overflow-y-auto pr-2">
                            {canSwitchWorkspace ? (
                                employees.map((employee) => (
                                    <Link
                                        key={employee.id}
                                        className={`block rounded-2xl border p-4 transition ${
                                            employee.id === utilizationWorkspace.employee.id
                                                ? 'border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950'
                                                : 'border-slate-200/80 hover:border-slate-950 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-300 dark:hover:bg-slate-900'
                                        }`}
                                        href={`/utilization?employee=${employee.id}`}
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
                                <div className="space-y-4 rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                    <div>
                                        <p className="font-medium">{utilizationWorkspace.employee.name}</p>
                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                            Submit actual utilization once the month is clear so planned allocation and actual effort stay comparable.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                            <p className="text-sm text-muted-foreground">Planned allocation</p>
                                            <p className="mt-2 text-3xl font-semibold">{utilizationWorkspace.totals.allocation.toFixed(2)}</p>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                            <p className="text-sm text-muted-foreground">Actual utilization</p>
                                            <p className="mt-2 text-3xl font-semibold">{totalUtilization.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        Allocation is visible here for comparison only. You can update utilization, but not your own allocation.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <form className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]" onSubmit={submit}>
                    <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                        <CardHeader>
                            <CardDescription>{isOwnWorkspace ? 'My monthly actuals' : 'Employee-entered actuals'}</CardDescription>
                            <CardTitle>{isOwnWorkspace ? 'Fill your utilization project by project' : 'Review this employee’s utilization and compare it to allocation'}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3 rounded-2xl border border-dashed border-slate-300 p-4 md:grid-cols-[1fr_auto] dark:border-slate-700">
                                <div className="space-y-2">
                                    <Label htmlFor="project_picker">Add another project</Label>
                                    <select
                                        id="project_picker"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        onChange={(event) => setProjectPicker(event.target.value)}
                                        value={projectPicker}
                                    >
                                        <option value="">Select a project you actually worked on</option>
                                        {selectableProjects.map((project) => (
                                            <option key={project.project_id} value={project.project_id}>
                                                {project.name} - {project.type}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <Button className="w-full md:w-auto" onClick={addProject} type="button" variant="outline">
                                        <Plus className="size-4" />
                                        Add project
                                    </Button>
                                </div>
                            </div>

                            <div className="max-h-[40rem] space-y-4 overflow-y-auto pr-2">
                                {data.utilizations.map((project, index) => {
                                    const delta = Number((Number(project.effort || 0) - Number(project.allocation || 0)).toFixed(2));

                                    return (
                                        <div key={`${project.project_id}-${index}`} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="font-medium">{project.name}</p>
                                                        <Badge variant="secondary">{project.type}</Badge>
                                                    </div>
                                                    <div className="mt-3 flex flex-wrap gap-2 text-sm">
                                                        <Badge variant="outline">Allocated {Number(project.allocation).toFixed(2)}</Badge>
                                                        <Badge variant={delta > 0 ? 'secondary' : delta < 0 ? 'destructive' : 'outline'}>
                                                            Actual {Number(project.effort).toFixed(2)}
                                                        </Badge>
                                                        <Badge variant="outline">Delta {delta >= 0 ? '+' : ''}{delta.toFixed(2)}</Badge>
                                                    </div>
                                                </div>
                                                <div className="rounded-2xl bg-slate-950 px-3 py-2 text-right text-white dark:bg-white dark:text-slate-950">
                                                    <p className="text-[11px] uppercase tracking-[0.18em]">Actual utilization</p>
                                                    <p className="text-2xl font-semibold">{Number(project.effort || 0).toFixed(2)}</p>
                                                </div>
                                            </div>

                                            <div className="mt-5 space-y-2">
                                                <input
                                                    aria-label={`${project.name} utilization`}
                                                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-950 dark:bg-slate-800 dark:accent-white"
                                                    max={1}
                                                    min={0}
                                                    onChange={(event) => updateUtilization(index, 'effort', Number(event.target.value))}
                                                    step={0.05}
                                                    type="range"
                                                    value={Number(project.effort || 0)}
                                                />
                                                <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                                    <span>0.00</span>
                                                    <span>0.50</span>
                                                    <span>1.00</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 space-y-2">
                                                <Label htmlFor={`utilization-note-${index}`}>Comment</Label>
                                                <Input
                                                    id={`utilization-note-${index}`}
                                                    onChange={(event) => updateUtilization(index, 'note', event.target.value)}
                                                    placeholder="What changed from the planned allocation?"
                                                    value={project.note}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {errors.utilizations && <p className="text-sm text-destructive">{errors.utilizations}</p>}
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                            <CardHeader>
                                <CardDescription>Comparison summary</CardDescription>
                                <CardTitle>Planned vs actual in one view</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                        <p className="text-sm text-muted-foreground">Allocated</p>
                                        <p className="mt-3 text-4xl font-semibold">{utilizationWorkspace.totals.allocation.toFixed(2)}</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                        <p className="text-sm text-muted-foreground">Utilized</p>
                                        <p className="mt-3 text-4xl font-semibold">{totalUtilization.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-medium">Variance</p>
                                            <p className="text-sm text-muted-foreground">Positive means the month used more effort than planned.</p>
                                        </div>
                                        <Badge variant={variance > 0 ? 'secondary' : variance < 0 ? 'destructive' : 'outline'}>
                                            {variance >= 0 ? '+' : ''}
                                            {variance.toFixed(2)}
                                        </Badge>
                                    </div>
                                </div>
                                <Button className="w-full bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200" disabled={processing} type="submit">
                                    Save monthly utilization
                                </Button>
                                {(recentlySuccessful || flash?.success) && (
                                    <p className="text-sm text-emerald-600">{flash?.success ?? 'Utilization saved.'}</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                            <CardHeader>
                                <CardDescription>Guidance</CardDescription>
                                <CardTitle>Why this solves the challenge</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {utilizationWorkspace.guidance.map((item) => (
                                    <div key={item} className="flex gap-3 rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                        <CheckCircle2 className="mt-0.5 size-4 text-emerald-500" />
                                        <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                            <CardHeader>
                                <CardDescription>Signal</CardDescription>
                                <CardTitle>Monthly utilization posture</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex gap-3 rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                    {variance >= 0 ? <TrendingUp className="mt-0.5 size-4 text-amber-500" /> : <TrendingDown className="mt-0.5 size-4 text-sky-500" />}
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        {variance === 0
                                            ? 'Actual effort matched the allocation plan exactly.'
                                            : variance > 0
                                              ? 'Actual effort exceeded the planned allocation, which may signal unplanned work or overload.'
                                              : 'Actual effort came in below the allocation plan, which may indicate spare capacity or scope shifts.'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
