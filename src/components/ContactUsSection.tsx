import { Mail } from "lucide-react";

/**
 * Simple Contact Us card. Renders inside the Profile tab of both the
 * Customer and Mechanic dashboards. No form — just a mailto link that
 * opens the user's default email client with the recipient pre-filled.
 */
export default function ContactUsSection() {
  const email = "afterbrakes@gmail.com";
  return (
    <section className="bg-card rounded-xl border border-border p-5 animate-slide-up">
      <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
        <Mail className="h-5 w-5 text-primary" /> Contact Us
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        For feedback, complaints, suggestions, or support, please contact us via email.
      </p>
      <a
        href={`mailto:${email}`}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors text-sm font-medium text-foreground break-all"
      >
        <Mail className="h-4 w-4 flex-shrink-0" />
        {email}
      </a>
    </section>
  );
}
