import { useNavigate, useParams } from "react-router";
import { CheckoutPanel } from "../../features/ordering/checkout-panel.tsx";
import { BrandLink, PageMain } from "../../shared/components/chrome.tsx";

export function CheckoutPage() {
  const { venueSlug = "", requestId = "" } = useParams();
  const navigate = useNavigate();
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border px-4 py-3">
        <BrandLink />
      </header>
      <PageMain className="mx-auto max-w-lg px-4 py-6">
        <CheckoutPanel
          draftId={requestId}
          venueSlug={venueSlug}
          onPaid={(id) => navigate(`/request/${id}`)}
        />
      </PageMain>
    </div>
  );
}
