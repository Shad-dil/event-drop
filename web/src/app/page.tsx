export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="text-4xl">📸</span>
      <h1 className="text-3xl font-semibold tracking-tight">EventDrop</h1>
      <p className="max-w-sm text-muted-foreground">
        Scan a QR code, drop your photos, and watch the memories roll in — no account needed.
      </p>
    </div>
  );
}
