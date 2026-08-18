"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateEvent } from "@/lib/hooks/useEvents";
import { ApiError } from "@/lib/api-client";

export default function NewEventPage() {
  const router = useRouter();
  const createEvent = useCreateEvent();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const event = await createEvent.mutateAsync({
        name,
        description: description || undefined,
        eventDate: eventDate || undefined,
      });
      router.push(`/dashboard/events/${event.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Create a new event</CardTitle>
          <CardDescription>
            You&apos;ll get a QR code guests can scan to start uploading photos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Event name</Label>
              <Input
                id="name"
                required
                placeholder="Sarah's Birthday Bash"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="A night to remember"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="eventDate">Date (optional)</Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={createEvent.isPending} className="mt-2">
              {createEvent.isPending ? "Creating…" : "Create event"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
