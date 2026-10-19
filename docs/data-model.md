# ShebaGhor — Data model

8 tables. PK = primary key, FK = foreign key (points to another table), UK = unique.

## Diagram

```mermaid
erDiagram
    User ||--o| ProviderProfile : "is (if provider)"
    User ||--o{ Booking : "books"
    User ||--o{ Review : "writes"
    ProviderProfile ||--o{ Service : "offers"
    ProviderProfile ||--o{ Availability : "works on"
    ProviderProfile ||--o{ Booking : "receives"
    ProviderProfile ||--o{ Review : "receives"
    Category ||--o{ Service : "groups"
    Service ||--o{ Booking : "booked as"
    Booking ||--o| Payment : "paid by"
    Booking ||--o| Review : "reviewed in"

    User {
        string id PK
        string name
        string email UK
        string passwordHash
        string phone
        Role role "CUSTOMER, PROVIDER, ADMIN"
        datetime createdAt
    }
    ProviderProfile {
        string id PK
        string userId FK,UK "one profile per user"
        string area
        string bio
        boolean approved "admin approval (BR-1)"
        float ratingAvg "kept up to date on each review"
        int ratingCount
    }
    Category {
        string id PK
        string name UK
        string slug UK "ac-technician"
    }
    Service {
        string id PK
        string providerId FK
        string categoryId FK
        string title
        string description
        int price "whole taka"
        int durationMin
        string area
        boolean active "soft delete (BR-9)"
        datetime createdAt
    }
    Availability {
        string id PK
        string providerId FK
        int weekday "0 = Sun ... 6 = Sat"
        int startMin "09:00 = 540"
        int endMin "18:00 = 1080"
    }
    Booking {
        string id PK
        string customerId FK
        string providerId FK
        string serviceId FK
        datetime startAt "UTC"
        datetime endAt "UTC"
        int price "copied at booking time (BR-5)"
        string address
        BookingStatus status "PENDING_PAYMENT, CONFIRMED, COMPLETED, CANCELLED"
        datetime createdAt "starts the 15-min hold"
    }
    Payment {
        string id PK
        string bookingId FK,UK
        string tranId UK "sent to SSLCommerz"
        int amount
        PaymentStatus status "INITIATED, PAID, FAILED"
        string valId
        boolean refundRequired
        datetime createdAt
        datetime updatedAt
    }
    Review {
        string id PK
        string bookingId FK,UK "one review per booking (BR-8)"
        string providerId FK
        string customerId FK
        int rating "1-5"
        string comment
        datetime createdAt
    }
```

## The same thing as boxes and lines (for paper)

```text
┌──────────────┐              ┌──────────┐      writes
│ Availability │    ┌─────────┤   User   ├──────────────────┐
└──────┬───────┘    │         └──────┬───┘                  │
       │            │                │                      │
       │works on    │is a            │                      │
       │            │                │books                 │
┌──────┴────────────┴────┐receives   │                ┌─────┴────┐
│    ProviderProfile     ├───────┐   │                │  Review  │
└─┬─────────────────────┬┘       │   │                └──┬────┬──┘
  │                     │        │   │                   │    │
  │                     │offers  │   │                   │    │
  │             groups  │        │   │                   │    │
  │ ┌──────────┐   ┌────┴────┐   │   │                   │    │
  │ │ Category ├───┤ Service │   │   │                   │    │
  │ └──────────┘   └────┬────┘   │   │                   │    │
  │                     │        │   │                   │    │
  │                     │        │   │                   │    │
  │                     │        │   │                   │    │
  │                     │      ┌─┴───┴─────┐ reviewed in │    │
  │                     └──────┤  Booking  ├─────────────┘    │
  │           booked as        └─────┬─────┘                  │
  │                                  │                        │
  │                                  │paid by                 │
  │                                  │                        │
  │                            ┌─────┴─────┐                  │
  │                            │  Payment  │                  │
  │                            └───────────┘                  │
  │                       receives (reviews)                  │
  └───────────────────────────────────────────────────────────┘
```

Every line is "1 to many" except **User → ProviderProfile**, **Booking → Payment** and **Booking → Review**, which are "1 to 0..1" (see the table below).

## Relationships in plain words

| From | To | Type | Meaning |
|---|---|---|---|
| User | ProviderProfile | 1 to 0..1 | A user has a provider profile only if their role is PROVIDER |
| User | Booking | 1 to many | A customer makes many bookings |
| User | Review | 1 to many | A customer writes many reviews |
| ProviderProfile | Service | 1 to many | A provider offers many services |
| ProviderProfile | Availability | 1 to many | Up to 7 rows, one working window per weekday |
| ProviderProfile | Booking | 1 to many | A provider receives many bookings |
| ProviderProfile | Review | 1 to many | A provider receives many reviews |
| Category | Service | 1 to many | Electrician groups many electrician services |
| Service | Booking | 1 to many | One service can be booked many times |
| Booking | Payment | 1 to 0..1 | A booking has at most one payment |
| Booking | Review | 1 to 0..1 | A booking has at most one review |

## Self-check
- **Why does `Booking` store its own `price`?** If the provider changes the service price later, old bookings keep the price the customer actually agreed to.
- **Why is `ProviderProfile` separate from `User`?** Area, bio, approval and rating only apply to providers, so they shouldn't be empty columns on every customer row.
- **Why does `Booking` have both `providerId` and `serviceId`?** You could reach the provider through the service, but the overlap check runs on `(providerId, startAt)`, so storing it directly makes that check one fast indexed query.
- **Why are free slots not a table?** They are calculated from `Availability` minus existing bookings, so they can never get out of sync.
