import "./SectionHeading.css";
export default function SectionHeading({ title, subtitle, action }) {
  return <div className="section-heading">
    <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
    {action && <div className="section-heading-action">{action}</div>}
  </div>;
}
