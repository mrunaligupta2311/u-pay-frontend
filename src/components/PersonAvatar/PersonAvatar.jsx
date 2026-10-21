import { initials } from "../../utils/format";
import "./PersonAvatar.css";
const colors = ["#e8edff","#ffe9d9","#dff7ed","#f7e5ff","#fff0c2","#dff4ff"];
export default function PersonAvatar({ name, size = "md", index = 0 }) {
  return <div className={`person-avatar avatar-${size}`} style={{ background: colors[(index + (name?.length || 0)) % colors.length] }}>{initials(name)}</div>;
}
