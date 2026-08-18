"use client";

import { use, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoUploader } from "@/components/photo-uploader";
import { PhotoGallery } from "@/components/photo-gallery";
import { usePublicEvent, useEnsureGuestSession, useUpdateGuestName } from "@/lib/hooks/useGuest";

export default function GuestEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: event, isLoading: eventLoading, isError: eventError } = usePublicEvent(slug);
  const ensureSession = useEnsureGuestSession();
  const updateName = useUpdateGuestName();
  const initialized = useRef(false);

  const [name, setName] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (initialized.current || !slug) return;
    initialized.current = true;
    ensureSession.mutate(
      { slug },
      {
        onSuccess: (data) => {
          if (data.guest.name) {
            setName(data.guest.name);
            setConfirmed(true);
          }
        },
      }
    );
    // Only run once per mount — this establishes the guest cookie.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim()) {
      await updateName.mutateAsync({ slug, name: name.trim() });
    }
    setConfirmed(true);
  }

  if (eventLoading) {
    return <p className="flex-1 p-12 text-center text-sm text-muted-foreground">Loading event…</p>;
  }

  if (eventError || !event) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center">
        <p className="text-muted-foreground">
          This event link doesn&apos;t look right. Double-check the QR code or link.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="text-center">
        <span className="text-4xl">📸</span>
        <h1 className="mt-3 text-2xl font-semibold">{event.name}</h1>
        {event.description && <p className="mt-1 text-muted-foreground">{event.description}</p>}
        {event.eventDate && (
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(event.eventDate).toLocaleDateString()}
          </p>
        )}
      </div>

      <Card className="mx-auto w-full max-w-sm text-left">
        <CardHeader>
          <CardTitle>{confirmed ? "Add photos" : "Join this event"}</CardTitle>
          <CardDescription>
            {confirmed
              ? "They'll show up below for everyone as soon as they're uploaded."
              : "Add your name so hosts and other guests know whose photos are whose (optional)."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!confirmed ? (
            <form onSubmit={handleContinue} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  placeholder="Jamie"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={ensureSession.isPending}>
                Continue
              </Button>
            </form>
          ) : (
            <PhotoUploader slug={slug} />
          )}
        </CardContent>
      </Card>

      <PhotoGallery slug={slug} eventId={event.id} />
    </div>
  );
}
