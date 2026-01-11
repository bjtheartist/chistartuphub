# Archived Table Schemas - Chistartuphub

**Archived on:** 2026-01-09
**Reason:** Tables were empty and unused

---

## upcoming_opportunities

```sql
CREATE TABLE public.upcoming_opportunities (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  organization text,
  description text,
  opportunity_type text,
  deadline date,
  application_link text,
  requirements text[],
  prize_amount text,
  is_active boolean DEFAULT true,
  created_date timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.upcoming_opportunities ENABLE ROW LEVEL SECURITY;
```

---

## resource_submissions

```sql
CREATE TABLE public.resource_submissions (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  resource_type text,
  resource_name text NOT NULL,
  resource_url text,
  description text,
  status text DEFAULT 'pending',
  submitted_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone
);

ALTER TABLE public.resource_submissions ENABLE ROW LEVEL SECURITY;
```

---

## contact_submissions

```sql
CREATE TABLE public.contact_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  status text DEFAULT 'new' CHECK (status = ANY (ARRAY['new', 'read', 'replied', 'archived'])),
  admin_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
```

---

## Restoration Instructions

To restore any of these tables, run the corresponding CREATE TABLE statement above, then re-add any RLS policies as needed.
