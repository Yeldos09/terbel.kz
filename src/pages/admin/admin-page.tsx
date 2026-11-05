import { Link } from "react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDemoDb } from "../../app/hooks.ts";
import { StaffGate } from "../../features/auth/guard.tsx";
import { sessionStore, useSession } from "../../features/auth/session.ts";
import { buildAnalytics } from "../../domain/analytics.ts";
import { BrandLink, PageMain, PageSkeleton } from "../../shared/components/chrome.tsx";
import { useMessages } from "../../shared/i18n/context.ts";
import { formatKzt, formatNumber } from "../../shared/lib/format.ts";
import { Button } from "../../shared/ui/button.tsx";
import { repository } from "../../mocks/repository.ts";
import { RegisterVenueForm } from "./register-venue.tsx";

export function AdminPage() {
  return (
    <StaffGate area="platform">
      <AdminDashboard />
    </StaffGate>
  );
}

function AdminDashboard() {
  const messages = useMessages();
  const db = useDemoDb();
  const session = useSession();
  if (!db.data || !session) return <PageSkeleton />;
  const analytics = buildAnalytics(db.data);
  const statusRows = analytics.byStatus.map((item) => ({
    name: messages.status[item.status],
    count: item.count,
  }));
  const venueRows = analytics.byVenue.map((item) => ({
    name: item.name,
    amount: item.amount,
  }));
  const tooltipStyle = {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    color: "var(--popover-foreground)",
  };
  const axisTick = { fill: "var(--muted-foreground)", fontSize: 11 };

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <BrandLink />
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">{messages.cabinet.signedIn}: {session.email}</p>
            <Button variant="outline" size="sm" onClick={() => sessionStore.logout()}>{messages.cabinet.logout}</Button>
          </div>
        </div>
      </header>
      <PageMain className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
        <div>
          <p className="text-sm font-semibold text-primary">{messages.landing.statsCaption}</p>
          <h1 className="mt-2 font-display text-4xl">{messages.admin.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{messages.admin.lead}</p>
          {repository.isMemoryOnly() ? <p className="mt-2 text-sm text-warning">{messages.admin.memory}</p> : null}
        </div>
        <RegisterVenueForm />
        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border p-4">
            <dt className="text-sm text-muted-foreground">{messages.landing.statRequests}</dt>
            <dd className="font-display text-3xl">{formatNumber(analytics.totals.requests)}</dd>
          </div>
          <div className="rounded-2xl border border-border p-4">
            <dt className="text-sm text-muted-foreground">{messages.landing.statQueue}</dt>
            <dd className="font-display text-3xl">{formatNumber(analytics.totals.queued)}</dd>
          </div>
          <div className="rounded-2xl border border-border p-4">
            <dt className="text-sm text-muted-foreground">{messages.landing.statAmount}</dt>
            <dd className="font-display text-3xl text-primary">{formatKzt(analytics.totals.exampleAmount)}</dd>
          </div>
        </dl>
        <section className="rounded-2xl border border-border p-4">
          <h2 className="font-display text-xl">{messages.admin.statusChart}</h2>
          <div className="mt-3 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusRows}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" tick={axisTick} interval={0} angle={-25} height={70} textAnchor="end" />
                <YAxis stroke="var(--muted-foreground)" tick={axisTick} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="var(--primary)" radius={6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border p-4">
            <h2 className="font-display text-xl">{messages.admin.venueChart}</h2>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={venueRows}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" tick={axisTick} interval={0} />
                  <YAxis stroke="var(--muted-foreground)" tick={axisTick} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="amount" fill="var(--chart-violet)" radius={6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-border p-4">
            <h2 className="font-display text-xl">{messages.admin.dayChart}</h2>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.byDay}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" tick={axisTick} />
                  <YAxis stroke="var(--muted-foreground)" tick={axisTick} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="var(--chart-blue)" radius={6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
        <section className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">{messages.admin.columnVenue}</th>
                <th className="px-4 py-3 font-medium">{messages.cabinet.columnOwner}</th>
                <th className="px-4 py-3 font-medium">{messages.admin.columnMode}</th>
                <th className="px-4 py-3 font-medium">{messages.admin.columnOpen}</th>
                <th className="px-4 py-3 font-medium">{messages.admin.columnRequests}</th>
                <th className="px-4 py-3 font-medium">{messages.admin.open}</th>
              </tr>
            </thead>
            <tbody>
              {db.data.venues.map((venue) => {
                const count = db.data?.requests.filter((request) => request.venueId === venue.id).length ?? 0;
                const owner = db.data?.accounts.find((account) => account.venueId === venue.id);
                return (
                  <tr key={venue.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <span className="block font-semibold">{venue.name}</span>
                      <span className="text-xs text-faint">{messages.kind[venue.kind]} · {venue.city}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block">{owner?.name ?? "—"}</span>
                      <span className="text-xs text-faint">{owner?.email ?? ""}</span>
                    </td>
                    <td className="px-4 py-3">{messages.mode[venue.mode]}</td>
                    <td className="px-4 py-3">{venue.isOpen ? messages.venue.openState : messages.venue.closedState}</td>
                    <td className="px-4 py-3">{formatNumber(count)}</td>
                    <td className="px-4 py-3">
                      <Link className="text-primary" to={`/v/${venue.slug}`}>{messages.shells.guestOf}</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
        <section className="flex flex-wrap gap-3 text-sm">
          {analytics.byMode.map((item) => (
            <p key={item.mode} className="rounded-full bg-muted px-3 py-2">
              {messages.admin.modeChart}: {messages.mode[item.mode]} · {formatNumber(item.count)}
            </p>
          ))}
        </section>
      </PageMain>
    </div>
  );
}
