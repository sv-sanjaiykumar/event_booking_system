import { useNavigate } from "react-router-dom";

import AccountHeader from "../auth/AccountHeader.jsx";
import EventForm from "./EventForm.jsx";
import { createEvent } from "./eventApi.js";

export default function CreateEventPage() {
  const navigate = useNavigate();

  async function handleCreate(payload) {
    await createEvent(payload);
    navigate("/creator/dashboard", {
      replace: true,
      state: { notice: "Your event is on the lineup." },
    });
  }

  return (
    <div className="site-shell">
      <AccountHeader />
      <main className="dashboard content-width">
        <section className="dashboard__intro">
          <p className="eyebrow">START A GATHERING</p>
          <h1>Create an event<span>.</span></h1>
          <p>Bring people together around something worth showing up for.</p>
        </section>
        <section className="create-event-page" aria-labelledby="create-event-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR LINEUP STARTS HERE</p>
              <h2 id="create-event-title">Event details<span>.</span></h2>
            </div>
          </div>
          <EventForm submitLabel="Publish event" onSubmit={handleCreate} />
        </section>
      </main>
    </div>
  );
}
