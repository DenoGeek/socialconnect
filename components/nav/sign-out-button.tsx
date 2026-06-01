/**
 * Sign-out control. Renders a real POST form (no JS required) instead of a link,
 * so the framework never prefetches it — a prefetched GET /logout would run the
 * sign-out side effect and silently destroy the session. Logout mutates state,
 * so POST is also the correct semantics.
 */
export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action="/logout" method="post" className="contents">
      <button type="submit" className={className}>
        Sign out
      </button>
    </form>
  );
}
