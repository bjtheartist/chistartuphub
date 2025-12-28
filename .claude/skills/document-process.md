# Process Documentation Agent

## Purpose
Document the funding research and verification process, creating a clear audit trail and knowledge base.

## Trigger
Run with: `/document-process` after research and verification cycles

## Documentation Outputs

### 1. Weekly Research Log
Location: `/content/cap-drafts/research-log-YYYY-WW.md`

```markdown
# Funding Research Log - Week of [DATE]

## Sources Checked
- [ ] Illinois DCEO
- [ ] SBA Chicago
- [ ] 1871 Programs
- [ ] Hyde Park Angels
- [etc...]

## New Opportunities Found
| Name | Type | Amount | Deadline | Status |
|------|------|--------|----------|--------|

## Updated Opportunities
| Name | Change | Previous | New |
|------|--------|----------|-----|

## Removed/Expired
| Name | Reason | Last Active |
|------|--------|-------------|

## Researcher Notes
[Any patterns, insights, or follow-ups needed]

## Next Steps
- [ ] Upload to Supabase
- [ ] Update HOT opportunities on homepage
- [ ] Newsletter consideration
```

### 2. Verification Report
Location: `/data/reports/verification-YYYY-MM-DD.md`

```markdown
# Opportunity Verification Report - [DATE]

## Summary
- Total Checked: X
- Verified Active: X
- Expired/Removed: X
- Links Broken: X
- New Additions: X

## HOT Opportunities (Featured)
[List with countdown to deadline]

## Data Quality Notes
[Any issues found, corrections made]

## Supabase Sync Status
- Last sync: [timestamp]
- Records updated: X
- Records added: X
```

### 3. Process Playbook Updates
Location: `/reference/research-notes/playbook.md`

Document any:
- New sources discovered
- Changes to existing source URLs
- Best times to check for updates
- Seasonal patterns (grant cycles, accelerator cohorts)

## Automation Hooks

### Supabase Upload Script
After verification, run the import:

```javascript
// scripts/sync-opportunities.js
// Reads verified-opportunities.csv
// Upserts to funding_opportunities table
// Marks stale records as is_active: false
```

### Homepage HOT Update
After sync, the homepage automatically shows:
- Opportunities where `featured: true`
- Sorted by deadline ascending
- Shows countdown days remaining
