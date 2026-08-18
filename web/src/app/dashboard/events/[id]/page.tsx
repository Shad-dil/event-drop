"use client";

import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventQrCode } from "@/components/event-qr-code";
import { useEvent } from "@/lib/hooks/useEvents";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: event, isLoading, isError } = useEvent(id);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (isError || !event) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-destructive">
          Couldn&apos;t find that event, or you don&apos;t have access to it.
        </p>
        <Button asChild variant="outline" className="w-fit">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{event.name}</h1>
        {event.description && <p className="mt-1 text-muted-foreground">{event.description}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <EventQrCode slug={event.slug} eventName={event.name} />

        <Card>
          <CardHeader>
            <CardTitle>Event details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>{event.eventDate ? new Date(event.eventDate).toLocaleDateString() : "Not set"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Photo approval</span>
              <span>{event.autoApprove ? "Automatic" : "Manual review"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{new Date(event.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
