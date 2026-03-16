import Link from "next/link";

export default function LandingPage() {
  return (
    <main>
      <h1>Music Momentum Market</h1>
      <p>Trade artist momentum and dominate weekly fantasy rankings.</p>
      <div className="grid grid-2">
        <div className="card">
          <h3>Start your season</h3>
          <p>Get starter cash, build a portfolio, and lock a lineup before Monday UTC.</p>
          <Link href="/sign-up">Create account →</Link>
        </div>
        <div className="card">
          <h3>Already playing?</h3>
          <p>Review your dashboard, manage positions, and watch weekly points climb.</p>
          <Link href="/sign-in">Sign in →</Link>
        </div>
      </div>
    </main>
  );
}
