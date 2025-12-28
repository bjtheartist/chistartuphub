# Opportunity Verification Agent

## Purpose
Take raw funding opportunity data and create a clean, verified, standardized output with working links.

## Trigger
Run with: `/verify-opportunities` or after research-funding completes

## Input
CSV or list of opportunities from research phase

## Verification Steps

### 1. Link Verification
For each opportunity:
- Fetch the URL to confirm it's accessible
- Check if the opportunity page still shows an active application
- Note if deadline has passed or changed
- Flag any 404s or redirects

### 2. Data Standardization
Normalize fields to match Supabase schema:

```javascript
{
  name: "String - Program/Fund Name",
  organization: "String - Who runs it",
  description: "String - What it offers",
  opportunity_type: "grant|competition|accelerator|vc|angel",
  check_size_min: Number,
  check_size_max: Number,
  stage: ["pre-seed", "seed", "series-a"],
  sectors: ["fintech", "healthtech", "deeptech", etc],
  website: "Verified URL",
  application_link: "Direct application URL if different",
  deadline: "YYYY-MM-DD or null if rolling",
  is_active: true,
  chicago_focused: boolean,
  featured: boolean (set true if HOT),
  verified_date: "YYYY-MM-DD"
}
```

### 3. Quality Flags
Add verification notes:
- `verified`: Link works, deadline confirmed
- `needs_review`: Link works but deadline unclear
- `expired`: Deadline passed
- `broken`: Link 404 or program discontinued

## Output
1. Clean CSV ready for Supabase import
2. Summary report with:
   - Total opportunities verified
   - New opportunities found
   - Expired/removed opportunities
   - HOT opportunities (deadline < 30 days)

## File Locations
- Input: `/data/deals/raw-opportunities.csv`
- Output: `/data/deals/verified-opportunities.csv`
- Report: `/data/reports/verification-log-YYYY-MM-DD.md`
