"use client";

import { useActionState } from "react";
import { submitRecipe, type SubmitRecipeState } from "../actions/recipes";

const RECIPE_TYPES = [
  { value: "plugin", label: "Plugin" },
  { value: "theme", label: "Theme" },
  { value: "workflow", label: "Workflow" },
  { value: "cartridge", label: "PNA Cartridge" },
];

const initialState: SubmitRecipeState = { error: null, success: false };

export default function RecipeSubmitForm() {
  const [state, action, pending] = useActionState(submitRecipe, initialState);

  if (state.success) {
    return (
      <div
        className="p-8 rounded-xl text-center space-y-4 w-full"
        style={{ border: "1px solid var(--color-border)" }}
      >
        <p className="font-semibold" style={{ color: "var(--color-foreground)" }}>
          Recipe submitted
        </p>
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          Your recipe has been added to the registry.
        </p>
        <a
          href="/recipes"
          className="inline-flex px-5 py-2.5 rounded-lg text-sm font-semibold no-underline"
          style={{ backgroundColor: "var(--color-accent)", color: "var(--color-accent-fg)" }}
        >
          Browse Recipes
        </a>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <p
          className="px-4 py-3 rounded-lg text-sm"
          style={{ border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
        >
          {state.error}
        </p>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="githubUrl"
          className="block text-sm font-medium"
          style={{ color: "var(--color-foreground)" }}
        >
          GitHub repository URL
        </label>
        <input
          id="githubUrl"
          name="githubUrl"
          type="url"
          placeholder="https://github.com/owner/repo"
          required
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-background)",
            color: "var(--color-foreground)",
          }}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="type"
          className="block text-sm font-medium"
          style={{ color: "var(--color-foreground)" }}
        >
          Recipe type
        </label>
        <select
          id="type"
          name="type"
          required
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-background)",
            color: "var(--color-foreground)",
          }}
        >
          <option value="">Select a type</option>
          {RECIPE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
        style={{ backgroundColor: "var(--color-accent)", color: "var(--color-accent-fg)" }}
      >
        {pending ? "Submitting..." : "Submit Recipe"}
      </button>
    </form>
  );
}
