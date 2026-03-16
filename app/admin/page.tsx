export default function AdminPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p>POST CSV/JSON payloads to:</p>
      <ul className="list-disc pl-6 text-zinc-300">
        <li>/api/admin/artists/import</li>
        <li>/api/admin/metrics/import</li>
      </ul>
    </div>
  );
}
