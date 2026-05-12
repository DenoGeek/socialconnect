import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createEvent } from "../actions";

export default function NewEvent() {
  return (
    <div className="max-w-xl space-y-6">
      <header>
        <h1 className="text-display text-3xl text-plum-900">New event</h1>
      </header>
      <Card>
        <form action={createEvent} className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input name="title" required />
          </div>
          <div>
            <Label>Subtitle</Label>
            <Input name="subtitle" />
          </div>
          <div>
            <Label>City</Label>
            <Input name="city" />
          </div>
          <div>
            <Label>Venue</Label>
            <Input name="venue" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Starts at</Label>
              <Input type="datetime-local" name="startsAt" required />
            </div>
            <div>
              <Label>Ends at</Label>
              <Input type="datetime-local" name="endsAt" required />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea name="description" rows={5} />
          </div>
          <div>
            <Label>Hero image URL</Label>
            <Input name="heroImageUrl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Capacity</Label>
              <Input type="number" name="capacity" defaultValue={100} />
            </div>
            <div>
              <Label>
                <input type="checkbox" name="eliteOnly" /> Elite-only
              </Label>
            </div>
          </div>
          <CardSubtitle>
            You can add tickets and the itinerary after saving the event.
          </CardSubtitle>
          <Button type="submit">Create event</Button>
        </form>
      </Card>
    </div>
  );
}
