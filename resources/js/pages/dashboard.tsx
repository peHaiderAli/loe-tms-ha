import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import {
    type AllocationHealthItem,
    type BreadcrumbItem,
    type CapacityInsightGroup,
    type InsightCard,
    type MetricCard,
    type ProjectHighlight,
    type SystemView,
    type TeamMixItem,
    type ReviewMetric,
} from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, CircleAlert, Layers3, Sparkles, UsersRound } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Overview',
        href: '/dashboard',
    },
];

const toneClasses: Record<MetricCard['tone'], string> = {
    sky: 'bg-sky-500/12 text-sky-700 ring-sky-500/20 dark:text-sky-300',
    emerald: 'bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
    amber: 'bg-amber-500/12 text-amber-700 ring-amber-500/20 dark:text-amber-300',
    rose: 'bg-rose-500/12 text-rose-700 ring-rose-500/20 dark:text-rose-300',
};

interface DashboardProps {
    companyMetrics: MetricCard[];
    teamMix: TeamMixItem[];
    reviewFlow: ReviewMetric[];
    allocationHealth: AllocationHealthItem[];
    capacityInsights: {
        available: CapacityInsightGroup[];
        overAllocated: CapacityInsightGroup[];
    };
    frictionPoints: InsightCard[];
    systemViews: SystemView[];
    projectHighlights: ProjectHighlight[];
}

export default function Dashboard({ companyMetrics, teamMix, reviewFlow, allocationHealth, capacityInsights, frictionPoints, systemViews, projectHighlights }: DashboardProps) {
    const healthCount = (label: string) => allocationHealth.find((item) => item.label === label)?.value ?? 0;

    const metricInsights = (metric: MetricCard) => {
        if (metric.label === 'People in scope') {
            return {
                title: 'People In Scope',
                description: 'This metric shows the total active workforce included in the current LOE cycle.',
                points: teamMix.map((team) => `${team.name}: ${team.count} people (${team.share}%)`),
                spotlight: `${teamMix.length} workforce groups are currently represented in the active cycle.`,
            };
        }

        if (metric.label === 'Reviewed this cycle') {
            return {
                title: 'Review Completion',
                description: 'This measures how many employee profiles are already reliable enough for leadership reporting.',
                points: reviewFlow.map((item) => `${item.label}: ${item.value} profiles`),
                spotlight: 'Complete and in-progress reviews are what keep utilization reporting trustworthy for leadership.',
            };
        }

        if (metric.label === 'Available capacity') {
            return {
                title: 'Available Capacity',
                description: 'These contributors still have room before reaching full planned LOE.',
                points: allocationHealth.map((item) => `${item.label}: ${item.value} people`),
                spotlight: `${healthCount('Under-allocated')} people can still absorb more work before crossing 1.0 LOE.`,
            };
        }

        if (metric.label === 'Over-allocated') {
            return {
                title: 'Over-Allocated People',
                description: 'These contributors are above full planned capacity and should be reviewed first.',
                points: allocationHealth.map((item) => `${item.label}: ${item.value} people`),
                spotlight: `${healthCount('Over-allocated')} people need rebalancing so planned effort stays realistic.`,
            };
        }

        return {
            title: metric.label,
            description: metric.detail,
            points: [] as string[],
            spotlight: 'This metric summarizes the current cycle without leaving the overview.',
        };
    };

    const metricCapacityGroups = (metric: MetricCard) => {
        if (metric.label === 'Available capacity') {
            return capacityInsights.available;
        }

        if (metric.label === 'Over-allocated') {
            return capacityInsights.overAllocated;
        }

        return [] as CapacityInsightGroup[];
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pixeledge LOE TMS" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <section className="relative overflow-hidden rounded-[28px] border border-white/60 bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.18),_transparent_30%),linear-gradient(135deg,_#fff8ee,_#ffffff_45%,_#effcf7)] p-6 shadow-sm dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.2),_transparent_25%),linear-gradient(135deg,_rgba(10,10,10,0.98),_rgba(15,23,42,0.95),_rgba(6,78,59,0.65))] md:p-8">
                    <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.18),_transparent_55%)] lg:block" />
                    <div className="relative grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
                        <div className="space-y-5">
                            <Badge className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.24em]" variant="secondary">
                                Comprehensive LOE system
                            </Badge>
                            <div className="space-y-3">
                                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-5xl">
                                    Make LOE updates easy for the team and trustworthy for leadership.
                                </h1>
                                <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                                    Pixeledge LOE TMS turns a spreadsheet-heavy monthly ritual into one guided employee flow, one reviewer queue, and one management view of utilization risk.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Button asChild size="lg" className="bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
                                    <Link href="/workspace" prefetch>
                                        Open employee flow
                                        <ArrowRight />
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" size="lg">
                                    <Link href="/reviews" prefetch>
                                        Open reviewer queue
                                    </Link>
                                </Button>
                            </div>
                        </div>
                        <Card className="border-0 bg-slate-950 text-white shadow-xl shadow-slate-950/10 dark:bg-white dark:text-slate-950">
                            <CardHeader>
                                <CardDescription className="text-slate-300 dark:text-slate-600">Why this matters</CardDescription>
                                <CardTitle className="text-2xl">The workbook logic is solid. The workflow around it is the real problem.</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-slate-200 dark:text-slate-700">
                                <div className="flex items-start gap-3 rounded-2xl bg-white/8 p-4 dark:bg-slate-100">
                                    <Sparkles className="mt-0.5 size-4" />
                                    <p>Employees should only answer one question at a time: where should my remaining capacity go?</p>
                                </div>
                                <div className="flex items-start gap-3 rounded-2xl bg-white/8 p-4 dark:bg-slate-100">
                                    <CircleAlert className="mt-0.5 size-4" />
                                    <p>Managers need review compliance, under-allocation, and overload surfaced automatically.</p>
                                </div>
                                <div className="flex items-start gap-3 rounded-2xl bg-white/8 p-4 dark:bg-slate-100">
                                    <UsersRound className="mt-0.5 size-4" />
                                    <p>Leadership needs portfolio health without reading every row in a sheet.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {companyMetrics.map((metric) => {
                        const insight = metricInsights(metric);

                        return (
                        <Dialog key={metric.label}>
                            <DialogTrigger asChild>
                                <button className="group text-left" type="button">
                                    <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md group-hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950/15 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:hover:border-white/20 dark:group-hover:bg-slate-950">
                                        <CardHeader className="space-y-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <Badge className={`w-fit rounded-full ring-1 ${toneClasses[metric.tone]}`} variant="outline">
                                                    {metric.label}
                                                </Badge>
                                                <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground transition group-hover:text-foreground">
                                                    View details
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                <CardTitle className="text-4xl">{metric.value}</CardTitle>
                                                <CardDescription className="mt-2 text-sm leading-6">{metric.detail}</CardDescription>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl rounded-3xl">
                                <DialogHeader>
                                    <DialogTitle>{insight.title}</DialogTitle>
                                    <DialogDescription>{insight.description}</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
                                    <div className="space-y-4">
                                        <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Current value</p>
                                            <p className="mt-3 text-4xl font-semibold">{metric.value}</p>
                                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{metric.detail}</p>
                                        </div>
                                        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                                            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">What it means</p>
                                            <p className="mt-3 text-sm leading-6 text-muted-foreground">{insight.spotlight}</p>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Insights</p>
                                        <div className="mt-3 space-y-3">
                                            {metricCapacityGroups(metric).length > 0 ? (
                                                <div className="max-h-[420px] space-y-4 overflow-y-auto pr-2">
                                                    {metricCapacityGroups(metric).map((group) => (
                                                        <div key={group.team} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <p className="font-medium">{group.team}</p>
                                                                <Badge variant="outline">{group.count} people</Badge>
                                                            </div>
                                                            <div className="mt-3 space-y-2">
                                                                {group.people.map((person) => (
                                                                    <Link
                                                                        key={person.id}
                                                                        href={`/workspace?employee=${person.id}`}
                                                                        className="block rounded-2xl border border-slate-200/80 bg-white p-3 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700"
                                                                        prefetch
                                                                    >
                                                                        <div className="flex items-start justify-between gap-3">
                                                                            <div>
                                                                                <p className="font-medium">{person.name}</p>
                                                                                <p className="text-sm text-muted-foreground">{person.title}</p>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <p className="text-sm font-medium">Allocated {person.allocation.toFixed(2)}</p>
                                                                                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                                                                    {metric.label === 'Available capacity'
                                                                                        ? `Capacity left ${person.availability.toFixed(2)}`
                                                                                        : `Over by ${person.variance.toFixed(2)}`}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : insight.points.length > 0 ? (
                                                insight.points.map((point) => (
                                                    <div key={point} className="rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-muted-foreground dark:bg-slate-900">
                                                        {point}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-muted-foreground dark:bg-slate-900">
                                                    This metric summarizes the current cycle without leaving the overview.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                        );
                    })}
                </section>

                <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                        <CardHeader>
                            <CardDescription>Portfolio composition</CardDescription>
                            <CardTitle>Who the system supports each cycle</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {teamMix.map((team) => (
                                <div key={team.name} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{team.name}</span>
                                        <span className="text-muted-foreground">{team.count} people</span>
                                    </div>
                                    <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                        <div className={`h-full rounded-full ${team.color}`} style={{ width: `${team.share}%` }} />
                                    </div>
                                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{team.share}% of tracked workforce</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                        <CardHeader>
                            <CardDescription>Compliance view</CardDescription>
                            <CardTitle>Review flow this cycle</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {reviewFlow.map((item) => (
                                <div key={item.label} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium">{item.label}</p>
                                            <p className="text-sm text-muted-foreground">{item.detail}</p>
                                        </div>
                                        <span className="text-3xl font-semibold">{item.value}</span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                        <CardHeader>
                            <CardDescription>Allocation health</CardDescription>
                            <CardTitle>Make the capacity signal impossible to miss</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-3">
                            {allocationHealth.map((item) => (
                                <div key={item.label} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                    <p className="text-sm font-medium">{item.label}</p>
                                    <p className="mt-4 text-4xl font-semibold">{item.value}</p>
                                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                        <CardHeader>
                            <CardDescription>Product shape</CardDescription>
                            <CardTitle>One system, four tightly connected views</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {systemViews.map((view) => (
                                <Link
                                    key={view.title}
                                    href={view.href}
                                    className="group block rounded-2xl border border-slate-200/80 p-4 transition hover:border-slate-950 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-300 dark:hover:bg-slate-900"
                                    prefetch
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="font-medium">{view.title}</p>
                                            <p className="mt-1 text-sm leading-6 text-muted-foreground">{view.description}</p>
                                        </div>
                                        <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                                    </div>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                        <CardHeader>
                            <CardDescription>Root causes from the current process</CardDescription>
                            <CardTitle>What the new experience is designed to fix</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {frictionPoints.map((point) => (
                                <div key={point.title} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 rounded-full bg-slate-950 p-2 text-white dark:bg-white dark:text-slate-950">
                                            <Layers3 className="size-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{point.title}</p>
                                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{point.body}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                        <CardHeader>
                            <CardDescription>Project pulse</CardDescription>
                            <CardTitle>Leadership-ready signals without opening the workbook</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {projectHighlights.slice(0, 4).map((project) => (
                                <div key={project.name} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="font-medium">{project.name}</p>
                                            <p className="text-sm text-muted-foreground">Owner: {project.owner}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">Priority {project.priority}</Badge>
                                            <Badge variant="secondary">{project.health}</Badge>
                                        </div>
                                    </div>
                                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                        <div className="h-full rounded-full bg-[linear-gradient(90deg,#0f766e,#f59e0b)]" style={{ width: `${project.coverage}%` }} />
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                        <span>Coverage</span>
                                        <span>{project.coverage}%</span>
                                    </div>
                                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{project.signal}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}
