"use client";

interface Props {
  action: () => Promise<void>;
}

export default function DeleteRecipeForm({ action }: Props) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Delete this recipe? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="px-4 py-2 rounded-lg text-sm font-medium"
        style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}
      >
        Delete
      </button>
    </form>
  );
}
