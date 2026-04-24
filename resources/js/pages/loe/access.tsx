import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Access',
        href: '/access',
    },
];

interface AccessUser {
    id: number;
    name: string;
    email: string;
    role: string;
    employee: {
        id: number;
        name: string;
        stream: string;
    } | null;
}

interface AccessEmployee {
    id: number;
    name: string;
    email: string;
    stream: string;
    linkedUserId: number | null;
    reviewerName: string | null;
}

interface ReviewerOption {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface AccessPageProps {
    users: AccessUser[];
    employees: AccessEmployee[];
    reviewers: ReviewerOption[];
}

function ReviewerAssignmentRow({
    employee,
    reviewers,
}: {
    employee: AccessEmployee;
    reviewers: ReviewerOption[];
}) {
    const form = useForm({
        reviewer_name: employee.reviewerName ?? '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.patch(route('loe.access.reviewer.update', employee.id), {
            preserveScroll: true,
        });
    };

    return (
        <form className="grid gap-3 rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800 lg:grid-cols-[1.2fr_0.9fr_1.4fr_auto]" onSubmit={submit}>
            <div>
                <p className="font-medium">{employee.name}</p>
                <p className="text-sm text-muted-foreground">{employee.email || 'No employee email imported yet'}</p>
            </div>
            <div className="text-sm text-muted-foreground">
                <p>{employee.stream}</p>
                <p>{employee.linkedUserId ? 'Linked account' : 'No account linked'}</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor={`reviewer-${employee.id}`}>Reviewer</Label>
                <select
                    id={`reviewer-${employee.id}`}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    onChange={(event) => form.setData('reviewer_name', event.target.value)}
                    value={form.data.reviewer_name}
                >
                    <option value="">Unassigned</option>
                    {reviewers.map((reviewer) => (
                        <option key={reviewer.id} value={reviewer.name}>
                            {reviewer.name} - {reviewer.role}
                        </option>
                    ))}
                </select>
                {form.errors.reviewer_name && <p className="text-sm text-destructive">{form.errors.reviewer_name}</p>}
            </div>
            <div className="flex items-end">
                <Button
                    className="w-full bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    disabled={form.processing}
                    type="submit"
                >
                    Save reviewer
                </Button>
            </div>
        </form>
    );
}

export default function AccessPage({ users, employees, reviewers }: AccessPageProps) {
    const { flash } = usePage<SharedData>().props;
    const defaultEmployee = employees.find((employee) => !employee.linkedUserId) ?? employees[0];
    const { data, setData, post, processing, errors } = useForm({
        employee_id: defaultEmployee?.id?.toString() ?? '',
        name: defaultEmployee?.name ?? '',
        email: defaultEmployee?.email ?? '',
        role: 'employee',
        password: '',
    });

    useEffect(() => {
        const selectedEmployee = employees.find((employee) => employee.id.toString() === data.employee_id);

        if (!selectedEmployee) {
            return;
        }

        const linkedUser = users.find((user) => user.employee?.id === selectedEmployee.id);

        setData((current) => ({
            ...current,
            name: linkedUser?.name ?? selectedEmployee.name,
            email: linkedUser?.email ?? selectedEmployee.email ?? '',
            role: linkedUser?.role ?? current.role,
        }));
    }, [data.employee_id, employees, setData, users]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('loe.access.store'));
    };

    const generateAccessLink = (userId: number) => {
        router.post(route('loe.access.link', userId), {}, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Access" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                        <CardHeader>
                            <CardDescription>Identity linking</CardDescription>
                            <CardTitle>Connect imported employees to real accounts</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <form className="space-y-4" onSubmit={submit}>
                                <div className="space-y-2">
                                    <Label htmlFor="employee_id">Employee</Label>
                                    <select
                                        id="employee_id"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        onChange={(event) => setData('employee_id', event.target.value)}
                                        value={data.employee_id}
                                    >
                                        {employees.map((employee) => (
                                            <option key={employee.id} value={employee.id}>
                                                {employee.name} - {employee.stream}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.employee_id && <p className="text-sm text-destructive">{errors.employee_id}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">Account name</Label>
                                    <Input id="name" onChange={(event) => setData('name', event.target.value)} value={data.name} />
                                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" onChange={(event) => setData('email', event.target.value)} value={data.email} />
                                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <select
                                        id="role"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        onChange={(event) => setData('role', event.target.value)}
                                        value={data.role}
                                    >
                                        <option value="employee">Employee</option>
                                        <option value="reviewer">Reviewer</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Temporary password</Label>
                                    <Input id="password" onChange={(event) => setData('password', event.target.value)} type="password" value={data.password} />
                                    <p className="text-sm text-muted-foreground">Optional if you plan to send a secure set-password link instead.</p>
                                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                                </div>

                                <Button
                                    className="w-full bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                                    disabled={processing}
                                    type="submit"
                                >
                                    Create or update access
                                </Button>
                            </form>

                            {flash?.success && <p className="text-sm text-emerald-600">{flash.success}</p>}
                            {flash?.inviteLink && (
                                <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900/60 dark:bg-emerald-950/40">
                                    <p className="font-medium text-emerald-900 dark:text-emerald-100">
                                        Secure access link ready{flash.inviteEmail ? ` for ${flash.inviteEmail}` : ''}.
                                    </p>
                                    <Input readOnly value={flash.inviteLink} />
                                    <p className="text-emerald-800/80 dark:text-emerald-100/80">Share this once so the teammate can set a password with Laravel&apos;s built-in reset flow.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                        <CardHeader>
                            <CardDescription>Current linked accounts</CardDescription>
                            <CardTitle>Who can log in right now</CardTitle>
                        </CardHeader>
                        <CardContent className="max-h-[34rem] space-y-3 overflow-y-auto pr-2">
                            {users.map((user) => (
                                <div key={user.id} className="space-y-3 rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="font-medium">{user.name}</p>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>
                                        <span className="rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{user.role}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {user.employee ? `${user.employee.name} - ${user.employee.stream}` : 'No employee linked'}
                                    </p>
                                    <Button className="w-full" type="button" variant="outline" onClick={() => generateAccessLink(user.id)}>
                                        Generate set-password link
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>

                <section>
                    <Card className="rounded-3xl border-white/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                        <CardHeader>
                            <CardDescription>Reviewer ownership</CardDescription>
                            <CardTitle>Assign reviewers before the cycle starts drifting</CardTitle>
                        </CardHeader>
                        <CardContent className="max-h-[36rem] space-y-3 overflow-y-auto pr-2">
                            {employees.map((employee) => (
                                <ReviewerAssignmentRow key={employee.id} employee={employee} reviewers={reviewers} />
                            ))}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}
