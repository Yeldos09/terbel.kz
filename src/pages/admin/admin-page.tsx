import { Link } from "react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDemoDb } from "../../app/hooks.ts";
import { buildAnalytics } from "../../domain/analytics.ts";
import { BrandLink, PageMain, PageSkeleton } from "../../shared/components/chrome.tsx";
import { ResetDemoButton } from "../../shared/components/locale-and-reset.tsx";
import { useMessages } from "../../shared/i18n/context.ts";
import { reservedApiBaseUrl } from "../../shared/lib/api.ts";
import { formatKzt, formatNumber } from "../../shared/lib/format.ts";
import { repository } from "../../mocks/repository.ts";

export function AdminPage() {
  const messages = useMessages();
  const db = useDemoDb();
  if (!db.data) return <PageSkeleton />;
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
    background: "#16161b",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    color: "#f4f4f5",
  };

  return (
    <div className="min-h-dvh bg-[#09090b]">
      <header className="border-b border-white/10 px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <BrandLink />
          <ResetDemoButton />
        </div>
      </header>
      <PageMain className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
        <div>
          <p className="text-sm font-semibold text-primary">{messages.landing.statsCaption}</p>
          <h1 className="mt-2 font-display text-4xl">{messages.admin.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">{messages.admin.lead}</p>
          <p className="mt-3 break-all text-sm text-zinc-300">
            {messages.admin.api} <span className="text-primary">{reservedApiBaseUrl()}</span>
          </p>
          {repository.isMemoryOnly() ? <p className="mt-2 text-sm text-amber-100">{messages.admin.memory}</p> : null}
        </div>
        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 p-4">
            <dt className="text-sm text-zinc-400">{messages.landing.statRequests}</dt>
            <dd className="font-display text-3xl">{formatNumber(analytics.totals.requests)}</dd>
          </div>
          <div className="rounded-2xl border border-white/10 p-4">
            <dt className="text-sm text-zinc-400">{messages.landing.statQueue}</dt>
            <dd className="font-display text-3xl">{formatNumber(analytics.totals.queued)}</dd>
          </div>
          <div className="rounded-2xl border border-white/10 p-4">
            <dt className="text-sm text-zinc-400">{messages.landing.statAmount}</dt>
            <dd className="font-display text-3xl text-primary">{formatKzt(analytics.totals.exampleAmount)}</dd>
          </div>
        </dl>
        <section className="rounded-2xl border border-white/10 p-4">
          <h2 className="font-display text-xl">{messages.admin.statusChart}</h2>
          <div className="mt-3 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusRows}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fontSize: 11 }} interval={0} angle={-25} height={70} textAnchor="end" />
                <YAxis stroke="#a1a1aa" allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#d6ff4a" radius={6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 p-4">
            <h2 className="font-display text-xl">{messages.admin.venueChart}</h2>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={venueRows}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fontSize: 11 }} interval={0} />
                  <YAxis stroke="#a1a1aa" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="amount" fill="#8b7cf7" radius={6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 p-4">
            <h2 className="font-display text-xl">{messages.admin.dayChart}</h2>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.byDay}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="day" stroke="#a1a1aa" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#a1a1aa" allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="#6b8cff" radius={6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
        <section className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-white/5 text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">{messages.admin.columnVenue}</th>
                <th className="px-4 py-3 font-medium">{messages.admin.columnMode}</th>
                <th className="px-4 py-3 font-medium">{messages.admin.columnOpen}</th>
                <th className="px-4 py-3 font-medium">{messages.admin.columnRequests}</th>
                <th className="px-4 py-3 font-medium">{messages.admin.open}</th>
              </tr>
            </thead>
            <tbody>
              {db.data.venues.map((venue) => {
                const count = db.data?.requests.filter((request) => request.venueId === venue.id).length ?? 0;
                return (
                  <tr key={venue.id} className="border-t border-white/10">
                    <td className="px-4 py-3">
                      <span className="block font-semibold">{venue.name}</span>
                      <span className="text-xs text-zinc-500">{messages.kind[venue.kind]} · {venue.city}</span>
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
            <p key={item.mode} className="rounded-full bg-white/5 px-3 py-2">
              {messages.admin.modeChart}: {messages.mode[item.mode]} · {formatNumber(item.count)}
            </p>
          ))}
        </section>
      </PageMain>
    </div>
  );
}
