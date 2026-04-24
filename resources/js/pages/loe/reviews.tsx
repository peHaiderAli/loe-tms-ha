import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type InsightCard, type ReviewMetric, type ReviewQueueItem, type ReviewerLoadItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, ClipboardCheck, Clock3, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Review Center',
        href: '/reviews',
    },
];

interface ReviewsPageProps {
    reviewFlow: ReviewMetric[];
    reviewQueue: ReviewQueueItem[];
    reviewerLoad: ReviewerLoadItem[];
    reviewPlaybook: InsightCard[];
    activeCycle: {
        id: number;
        name: string;
    };
}

export default function ReviewsPage({ reviewFlow, reviewQueue, reviewerLoad, reviewPlaybook, activeCycle }: ReviewsPageProps) {
    const [streamFilter, setStreamFilter] = useState<'All' | 'Engineering' | 'Experience'>('All');

    const filteredQueue = useMemo(() => {
        if (streamFilter === 'All') {
            return reviewQueue;
        }

        return reviewQueue.filter((item) => item.stream === streamFilter);
    }, [reviewQueue, streamFilter]);

    const updateReview = (reviewId: number | null, status: 'in_progress' | 'complete') => {
        if (!reviewId) {
            return;
        }

        router.patch(route('loe.reviews.update', reviewId), { status });
    };

    const sendReminder = (reviewId: number | null) => {
        if (!reviewId) {
            return;
        }

        router.post(route('loe.reviews.remind', reviewId), {}, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Review Center" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <Card className="overflow-hidden rounded-[28px] border-white/60 bg-[radial-gradient(circle_at_top_left,_rgba(244,63,94,0.14),_transparent_30%),linear-gradient(135deg,_#fff7f7,_#ffffff_45%,_#f8fafc)] shadow-sm dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(244,63,94,0.18),_transparent_28%),linear-gradient(135deg,_rgba(2,6,23,0.98),_rgba(30,41,59,0.95),_rgba(69,10,10,0.75))]">
                        <CardHeader className="space-y-5">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge className="w-fit rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.22em]" variant="secondary">
                                    Reviewer workflow
                                </Badge>
                                <Badge variant="outline">{activeCycle.name}</Badge>
                            </div>
                            <div className="space-y-3">
                                <CardTitle className="text-4xl tracking-tight">Review LOE as a queue, not as scattered status cells.</CardTitle>
                                <CardDescription className="max-w-2xl text-sm leading-6 md:text-base">
                                    The reviewer experience surfaces overload, available capacity, and missing decisions before it asks anyone to read a row.
                                </CardDescription>
                            </div>
                        </CardHeader>
                    </Card>

                    <Card className="rounded-[28px] border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                        <CardHeader>
                            <CardDescription>Cycle health</CardDescription>
                            <CardTitle>Current review posture</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                            {reviewFlow.map((metric) => (
                                <div key={metric.label} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                    <p className="text-sm font-medium">{metric.label}</p>
                                    <p className="mt-3 text-4xl font-semibold">{metric.value}</p>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{metric.detail}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                    <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                        <CardHeader>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <CardDescription>Priority queue</CardDescription>
                                    <CardTitle>Review what matters first</CardTitle>
                                </div>
                                <div className="flex rounded-full border border-slate-200 p-1 dark:border-slate-800">
                                    {(['All', 'Engineering', 'Experience'] as const).map((option) => (
                                        <button
                                            key={option}
                                            className={`rounded-full px-3 py-1.5 text-sm transition ${streamFilter === option ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'text-muted-foreground'}`}
                                            onClick={() => setStreamFilter(option)}
                                            type="button"
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="max-h-[38rem] space-y-3 overflow-y-auto pr-2">
                            {filteredQueue.map((item) => (
                                <div key={`${item.member}-${item.id}`} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-medium">{item.member}</p>
                                                <Badge variant="outline">{item.stream}</Badge>
                                                <Badge variant={item.risk === 'Critical' ? 'destructive' : item.risk === 'High' ? 'secondary' : 'outline'}>{item.risk}</Badge>
                                            </div>
                                            <p className="mt-2 text-sm text-muted-foreground">Reviewer: {item.reviewer}</p>
                                        </div>
                                        <div className="rounded-2xl bg-slate-950 px-3 py-2 text-right text-white dark:bg-white dark:text-slate-950">
                                            <p className="text-[11px] uppercase tracking-[0.18em]">Allocation</p>
                                            <p className="text-2xl font-semibold">{item.allocation.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-sm leading-6 text-muted-foreground">{item.blocker}</p>
                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        <Badge variant="secondary">{item.status}</Badge>
                                        <Button asChild size="sm" type="button" variant="outline">
                                            <Link href={`/utilization?employee=${item.employeeId}`}>
                                                Open utilization
                                            </Link>
                                        </Button>
                                        <Button onClick={() => sendReminder(item.id)} size="sm" type="button" variant="outline">
                                            Send reminder
                                        </Button>
                                        <Button onClick={() => updateReview(item.id, 'in_progress')} size="sm" type="button" variant="outline">
                                            Mark in progress
                                        </Button>
                                        <Button onClick={() => updateReview(item.id, 'complete')} size="sm" type="button">
                                            Mark complete
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                            <CardHeader>
                                <CardDescription>Reviewer balance</CardDescription>
                                <CardTitle>Who needs help this cycle</CardTitle>
                            </CardHeader>
                            <CardContent className="max-h-[18rem] space-y-3 overflow-y-auto pr-2">
                                {reviewerLoad.map((reviewer) => (
                                    <div key={reviewer.reviewer} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="font-medium">{reviewer.reviewer}</p>
                                                <p className="text-sm text-muted-foreground">{reviewer.serviceLevel}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-semibold">{reviewer.openItems}</p>
                                                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Open reviews</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                                            <span>Critical items</span>
                                            <span>{reviewer.critical}</span>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                            <CardHeader>
                                <CardDescription>Operating model</CardDescription>
                                <CardTitle>Reviewer playbook</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {reviewPlaybook.map((play) => (
                                    <div key={play.title} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-full bg-slate-950 p-2 text-white dark:bg-white dark:text-slate-950">
                                                {play.title.includes('risk') ? <AlertTriangle className="size-4" /> : play.title.includes('context') ? <ClipboardCheck className="size-4" /> : <Clock3 className="size-4" />}
                                            </div>
                                            <div>
                                                <p className="font-medium">{play.title}</p>
                                                <p className="mt-2 text-sm leading-6 text-muted-foreground">{play.body}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <section>
                    <Card className="rounded-3xl border-white/60 bg-slate-950 text-white shadow-sm dark:border-white/10 dark:bg-white dark:text-slate-950">
                        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm uppercase tracking-[0.18em] text-white/60 dark:text-slate-500">Key principle</p>
                                <p className="mt-2 max-w-3xl text-lg leading-8">
                                    Review status should be the result of a workflow with ownership, priority, and escalation, not just a text value in a cell.
                                </p>
                            </div>
                            <ShieldCheck className="size-10 shrink-0" />
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}
