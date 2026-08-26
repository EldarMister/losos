import { serviceOperatorDetails } from "../lib/legal-info";

export function LegalOperatorDetails({ className = "" }: { className?: string }) {
  return (
    <dl className={`legal-operator-details ${className}`.trim()}>
      {serviceOperatorDetails.map(({ label, value }) => (
        <div key={label}>
          <dt>{label}:</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
