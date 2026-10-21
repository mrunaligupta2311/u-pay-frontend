import { Search, X } from "lucide-react";
import "./SearchBar.css";
export default function SearchBar({ value, onChange, placeholder = "Search", onClear }) {
  return <label className="search-bar">
    <Search size={19} />
    <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    {value && <button type="button" className="search-clear" onClick={() => { onChange(""); onClear?.(); }} aria-label="Clear search"><X size={16} /></button>}
  </label>;
}
