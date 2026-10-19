# ShebaGhor — Requirements (user stories)

A website for Dhaka where customers book a home-service professional for a time slot, pay online and review the job afterwards.
IDs in brackets point back to PROJECT_OVERVIEW.md §4.

## Customer
- As a customer, I can sign up and log in with my email and password. (FR-C1)
- As a customer, I can search services by keyword, category and area, one page of results at a time. (FR-C2)
- As a customer, I can open a service and see its price, how long it takes, who provides it, and its rating and reviews. (FR-C3)
- As a customer, I can pick a day in the next two weeks and see only the times the provider is actually free. (FR-C4)
- As a customer, I can book a free slot and give the address where the job should happen. (FR-C5)
- As a customer, I have 15 minutes to pay before my held slot is released to others. (BR-4)
- As a customer, I can pay online through SSLCommerz, and my booking is confirmed only after the server checks the payment is real. (FR-C6, NFR-2)
- As a customer, I never get a slot that someone else already booked, even if we click at the same moment. (NFR-1, BR-3)
- As a customer, I pay the price shown when I booked, even if the provider changes it later. (BR-5)
- As a customer, I can see all my bookings and whether each is pending, confirmed, completed or cancelled. (FR-C7)
- As a customer, I can cancel a booking before it starts, and if I already paid, it is flagged for a refund. (FR-C8)
- As a customer, I can rate a completed job 1–5 stars with a comment, only once per booking. (FR-C9, BR-8)
- As a customer, I see every time in Dhaka time and can use the site comfortably on my phone. (NFR-5, NFR-7)

## Provider
- As a provider, I can sign up, but my services stay hidden until an admin approves me. (FR-P1, BR-1)
- As a provider, I can add, edit and hide my services with a title, category, price, duration and area. (FR-P2, BR-9)
- As a provider, I can set my weekly working hours once, and I only get bookings inside those hours. (FR-P3, BR-2)
- As a provider, I can see the bookings customers have made with me. (FR-P4)
- As a provider, I can mark a job as completed when I finish it, and nobody else can. (FR-P5, BR-7)
- As a provider, my average rating updates as soon as a customer reviews my work. (§5.3)

## Admin
- As an admin, I can see providers waiting for approval and approve or reject each one. (FR-A1)
- As an admin, I can create service categories like Electrician, Plumber, AC Technician and Tutor. (FR-A2)
- As an admin, I can see platform stats: users by role, bookings by status, total revenue and refunds to process. (FR-A3)
- As an admin, I know nobody can make themselves an admin by signing up on the website. (BR-10)
