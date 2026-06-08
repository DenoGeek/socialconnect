import { EventEditor } from "@/components/admin/event-editor";
import { createEvent } from "../actions";

export default function NewEvent() {
  return (
    <EventEditor
      tickets={[]}
      kesPerUsd={130}
      rateSource="fallback"
      rateFetchedAt={new Date().toISOString()}
      updateAction={async () => {}}
      addTicketAction={async () => {}}
      createAction={createEvent}
    />
  );
}
