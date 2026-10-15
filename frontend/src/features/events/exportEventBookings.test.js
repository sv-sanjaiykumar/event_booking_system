import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { createEventBookingsWorkbook } from "./exportEventBookings.js";

describe("event attendee workbook", () => {
  it("creates an Excel workbook with event and permitted booking details", async () => {
    const event = {
      id: 7,
      name: "Garden Workshop",
      date: "2030-11-28T10:00:00Z",
    };
    const bookings = [
      {
        id: 33,
        user_name: "Attendee Name",
        quantity: 3,
        booking_date: "2026-10-14T03:00:00Z",
      },
    ];

    const workbook = createEventBookingsWorkbook(event, bookings);
    const files = unzipSync(workbook);
    const workbookXml = strFromU8(files["xl/workbook.xml"]);
    const worksheet = strFromU8(files["xl/worksheets/sheet1.xml"]);

    expect(Object.keys(files)).toEqual(expect.arrayContaining([
      "[Content_Types].xml",
      "_rels/.rels",
      "xl/workbook.xml",
      "xl/styles.xml",
      "xl/worksheets/sheet1.xml",
    ]));
    expect(workbookXml).toContain('<sheet name="Attendees"');
    expect(worksheet).toContain("<t xml:space=\"preserve\">Garden Workshop</t>");
    expect(worksheet).toContain("<t xml:space=\"preserve\">Attendee name</t>");
    expect(worksheet).toContain("<t xml:space=\"preserve\">Booking date (UTC)</t>");
    expect(worksheet).toContain("<t xml:space=\"preserve\">Attendee Name</t>");
    expect(worksheet).toContain('<c r="B5"><v>33</v></c>');
    expect(worksheet).toContain("<t xml:space=\"preserve\">Seats</t>");
    expect(worksheet).toContain('<c r="C5"><v>3</v></c>');
    expect(worksheet).toContain('r="D5" s="1"');
    expect(worksheet).toContain('<autoFilter ref="A4:D5"/>');
  });

  it("escapes attendee text before putting it into worksheet XML", () => {
    const workbook = createEventBookingsWorkbook(
      { id: 2, name: "Gather <Together>", date: "2030-11-28T10:00:00Z" },
      [{ id: 1, user_name: "<script>&Name", booking_date: "2026-10-14T03:00:00Z" }],
    );
    const worksheet = strFromU8(unzipSync(workbook)["xl/worksheets/sheet1.xml"]);

    expect(worksheet).toContain("Gather &lt;Together&gt;");
    expect(worksheet).toContain("&lt;script&gt;&amp;Name");
    expect(worksheet).not.toContain("<script>");
  });
});
