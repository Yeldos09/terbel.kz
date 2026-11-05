import type { ComponentType } from "react";
import { createBrowserRouter } from "react-router";
import { NotFoundPage } from "../pages/not-found-page.tsx";
import { RootError, RootLayout } from "./root-layout.tsx";

function chunk(load: () => Promise<Record<string, ComponentType>>, name: string) {
  return async () => {
    const mod = await load();
    const Component = mod[name];
    if (!Component) throw new Error(name);
    return { Component };
  };
}

const landing = () => import("../pages/landing/landing-page.tsx");
const guest = () => import("../pages/guest/guest-catalog-page.tsx");
const checkout = () => import("../pages/guest/checkout-page.tsx");
const status = () => import("../pages/guest/request-status-page.tsx");
const demo = () => import("../pages/demo/demo-page.tsx");
const dj = () => import("../pages/dj/dj-area.tsx");
const venue = () => import("../pages/venue/venue-area.tsx");
const admin = () => import("../pages/admin/admin-page.tsx");
const login = () => import("../pages/login/login-page.tsx");

function routerBasename() {
  const base = import.meta.env.BASE_URL;
  if (!base || base === "/") return undefined;
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RootError />,
    children: [
      { path: "/", lazy: chunk(landing, "LandingPage") },
      { path: "/v/:venueSlug", lazy: chunk(guest, "GuestCatalogPage") },
      { path: "/v/:venueSlug/checkout/:requestId", lazy: chunk(checkout, "CheckoutPage") },
      { path: "/request/:requestId", lazy: chunk(status, "RequestStatusPage") },
      { path: "/demo", lazy: chunk(demo, "DemoPage") },
      {
        path: "/dj",
        lazy: chunk(dj, "DjLayout"),
        children: [
          { index: true, lazy: chunk(dj, "DjHomePage") },
          { path: "requests", lazy: chunk(dj, "DjRequestsPage") },
          { path: "queue", lazy: chunk(dj, "DjQueuePage") },
          { path: "history", lazy: chunk(dj, "DjHistoryPage") },
        ],
      },
      {
        path: "/venue",
        lazy: chunk(venue, "VenueLayout"),
        children: [
          { index: true, lazy: chunk(venue, "VenueHomePage") },
          { path: "settings", lazy: chunk(venue, "VenueSettingsPage") },
          { path: "catalog", lazy: chunk(venue, "VenueCatalogPage") },
          { path: "qr", lazy: chunk(venue, "VenueQrPage") },
        ],
      },
      { path: "/admin", lazy: chunk(admin, "AdminPage") },
      { path: "/login", lazy: chunk(login, "LoginPage") },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
], { basename: routerBasename() });
