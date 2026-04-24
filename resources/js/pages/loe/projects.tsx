import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PriorityLane, type ProjectHighlight } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Activity, ArrowUpRight, BriefcaseBusiness, Shapes } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Project Health',
        href: '/projects',
    },
];

interface ProjectsPageProps {
    projectHighlights: ProjectHighlight[];
    priorityLanes: PriorityLane[];
    leadershipSignals: string[];
}

const healthTone: Record<string, string> = {
    Stable: 'bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
    Watch: 'bg-amber-500/12 text-amber-700 ring-amber-500/20 dark:text-amber-300',
    Opportunity: 'bg-sky-500/12 text-sky-700 ring-sky-500/20 dark:text-sky-300',
    'Hidden load': 'bg-violet-500/12 text-violet-700 ring-violet-500/20 dark:text-violet-300',
    Concentrated: 'bg-rose-500/12 text-rose-700 ring-rose-500/20 dark:text-rose-300',
};

export default function ProjectsPage({ projectHighlights, priorityLanes, leadershipSignals }: ProjectsPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Project Health" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                    <Card className="overflow-hidden rounded-[28px] border-white/60 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.16),_transparent_28%),linear-gradient(135deg,_#fffaf1,_#ffffff_45%,_#f4fbff)] shadow-sm dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.15),_transparent_28%),linear-gradient(135deg,_rgba(2,6,23,0.98),_rgba(30,41,59,0.95),_rgba(120,53,15,0.72))]">
                        <CardHeader className="space-y-5">
                            <Badge className="w-fit rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.22em]" variant="secondary">
                                Management portfolio view
                            </Badge>
                            <div className="space-y-3">
                                <CardTitle className="text-4xl tracking-tight">See which projects are staffed, fragile, or quietly draining capacity.</CardTitle>
                                <CardDescription className="max-w-2xl text-sm leading-6 md:text-base">
                                    This view translates LOE entries into project-level health so leadership can decide where to rebalance, where to protect focus, and where to invest spare capacity.
                                </CardDescription>
                            </div>
                        </CardHeader>
                    </Card>

                    <Card className="rounded-[28px] border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                        <CardHeader>
                            <CardDescription>Portfolio rules</CardDescription>
                            <CardTitle>Priority lanes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {priorityLanes.map((lane) => (
                                <div key={lane.lane} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="font-medium">{lane.lane}</p>
                                        <Shapes className="size-4 text-muted-foreground" />
                                    </div>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{lane.description}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                    <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                        <CardHeader>
                            <CardDescription>Coverage by initiative</CardDescription>
                            <CardTitle>Project health model</CardTitle>
                        </CardHeader>
                        <CardContent className="max-h-[42rem] space-y-4 overflow-y-auto pr-2">
                            {projectHighlights.map((project) => (
                                <div key={project.name} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-medium">{project.name}</p>
                                                <Badge variant="outline">Priority {project.priority}</Badge>
                                                <Badge className={`ring-1 ${healthTone[project.health] ?? ''}`} variant="outline">
                                                    {project.health}
                                                </Badge>
                                            </div>
                                            <p className="mt-2 text-sm text-muted-foreground">Owner: {project.owner}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-semibold">{project.coverage}%</p>
                                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Coverage</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                        <div className="h-full rounded-full bg-[linear-gradient(90deg,#0f766e,#f59e0b)]" style={{ width: `${project.coverage}%` }} />
                                    </div>
                                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <button className="text-left" type="button">
                                                    <div className="rounded-2xl border border-slate-200/80 p-3 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-900">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Assigned people</p>
                                                                <p className="mt-2 text-2xl font-semibold">{project.assignedPeople ?? 0}</p>
                                                            </div>
                                                            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">View details</span>
                                                        </div>
                                                    </div>
                                                </button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl rounded-3xl">
                                                <DialogHeader>
                                                    <DialogTitle>{project.name} staffing</DialogTitle>
                                                    <DialogDescription>See who is assigned to this project and which teams the staffing is coming from.</DialogDescription>
                                                </DialogHeader>
                                                <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
                                                    <div className="space-y-4">
                                                        <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                                            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Assigned people</p>
                                                            <p className="mt-3 text-4xl font-semibold">{project.assignedPeople ?? 0}</p>
                                                            <p className="mt-2 text-sm leading-6 text-muted-foreground">Unique contributors with planned allocation on this project in the active cycle.</p>
                                                        </div>
                                                        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                                                            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Team mix</p>
                                                            <div className="mt-3 space-y-2">
                                                                {Object.entries(
                                                                    (project.contributors ?? []).reduce<Record<string, number>>((groups, contributor) => {
                                                                        groups[contributor.stream] = (groups[contributor.stream] ?? 0) + 1;
                                                                        return groups;
                                                                    }, {}),
                                                                ).map(([stream, count]) => (
                                                                    <div key={stream} className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-sm dark:bg-slate-950">
                                                                        <span>{stream}</span>
                                                                        <span className="font-medium">{count}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="max-h-[420px] space-y-2 overflow-y-auto pr-2">
                                                        {(project.contributors ?? []).map((contributor) => (
                                                            <Link
                                                                key={`${project.name}-people-${contributor.employeeId}`}
                                                                href={`/workspace?employee=${contributor.employeeId}`}
                                                                className="block rounded-2xl border border-slate-200/80 p-3 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                                                                prefetch
                                                            >
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div>
                                                                        <p className="font-medium">{contributor.name}</p>
                                                                        <p className="text-sm text-muted-foreground">
                                                                            {contributor.stream} • {contributor.title}
                                                                        </p>
                                                                    </div>
                                                                    <Badge variant="outline">{contributor.reviewStatus.replace('_', ' ')}</Badge>
                                                                </div>
                                                                <p className="mt-3 text-sm font-medium">Allocated effort {contributor.effort.toFixed(2)}</p>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <button className="text-left" type="button">
                                                    <div className="rounded-2xl border border-slate-200/80 p-3 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-900">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">FTE</p>
                                                                <p className="mt-2 text-2xl font-semibold">{Number(project.fte ?? 0).toFixed(2)}</p>
                                                            </div>
                                                            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">View details</span>
                                                        </div>
                                                    </div>
                                                </button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl rounded-3xl">
                                                <DialogHeader>
                                                    <DialogTitle>{project.name} FTE composition</DialogTitle>
                                                    <DialogDescription>See how the full-time effort total is built from individual allocation percentages.</DialogDescription>
                                                </DialogHeader>
                                                <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
                                                    <div className="space-y-4">
                                                        <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                                            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Total FTE</p>
                                                            <p className="mt-3 text-4xl font-semibold">{Number(project.fte ?? 0).toFixed(2)}</p>
                                                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                                                FTE is the sum of all allocation percentages divided by 100. A total of 300% becomes 3.00 FTE.
                                                            </p>
                                                        </div>
                                                        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                                                            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Coverage context</p>
                                                            <p className="mt-3 text-sm leading-6 text-muted-foreground">{project.signal}</p>
                                                        </div>
                                                    </div>
                                                    <div className="max-h-[420px] space-y-2 overflow-y-auto pr-2">
                                                        {(project.contributors ?? []).map((contributor) => (
                                                            <Link
                                                                key={`${project.name}-fte-${contributor.employeeId}`}
                                                                href={`/workspace?employee=${contributor.employeeId}`}
                                                                className="block rounded-2xl border border-slate-200/80 p-3 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                                                                prefetch
                                                            >
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div>
                                                                        <p className="font-medium">{contributor.name}</p>
                                                                        <p className="text-sm text-muted-foreground">
                                                                            {contributor.stream} • {contributor.title}
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-sm font-medium">{contributor.effort.toFixed(2)} FTE</p>
                                                                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                                                            {(contributor.effort * 100).toFixed(0)}%
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{project.signal}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                            <CardHeader>
                                <CardDescription>Decision support</CardDescription>
                                <CardTitle>What leadership should monitor every cycle</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {leadershipSignals.map((signal, index) => (
                                    <div key={signal} className="flex gap-3 rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                        <div className="rounded-full bg-slate-950 p-2 text-white dark:bg-white dark:text-slate-950">
                                            {index === 0 ? <Activity className="size-4" /> : index === 1 ? <ArrowUpRight className="size-4" /> : <BriefcaseBusiness className="size-4" />}
                                        </div>
                                        <p className="text-sm leading-6 text-muted-foreground">{signal}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-white/60 bg-slate-950 text-white shadow-sm dark:border-white/10 dark:bg-white dark:text-slate-950">
                            <CardContent className="p-6">
                                <p className="text-sm uppercase tracking-[0.18em] text-white/60 dark:text-slate-500">North star</p>
                                <p className="mt-3 text-lg leading-8">
                                    A project is only truly healthy when the team is staffed, the allocations are reviewed, and the capacity signal is believable.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
