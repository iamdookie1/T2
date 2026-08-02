"use client";

const SORTS = [
  { key: "hot", label: "Hot" },
  { key: "new", label: "New" },
  { key: "top", label: "Top" },
  { key: "rising", label: "Rising" },
];

export default function SortBar({ title, sort, onChange }) {
  return (
    <div className="sort-bar">
      <div className="sub-title">{title}</div>
      {SORTS.map((s) => (
        <button
          key={s.key}
          className={`sort-btn${sort === s.key ? " active" : ""}`}
          onClick={() => onChange(s.key)}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
