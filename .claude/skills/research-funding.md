# Funding Research Agent

## Purpose
Research and discover active funding opportunities for early-stage startups in the Chicago ecosystem.

## Trigger
Run with: `/research-funding` or when user asks to find new funding opportunities

## Data Sources to Search
1. **Primary Sources**:
   - Illinois DCEO (Department of Commerce & Economic Opportunity)
   - Chicago BACP (Business Affairs & Consumer Protection)
   - SBA Chicago District
   - SBIR/STTR.gov for federal grants

2. **VC/Angel Networks**:
   - Hyde Park Angels announcements
   - Chicago Ventures portfolio news
   - Lightbank, Pritzker Group updates
   - M25, Origin Ventures activity

3. **Accelerator Programs**:
   - 1871 programs and deadlines
   - Techstars Chicago
   - mHub (hardware)
   - MATTER (healthtech)
   - Polsky Center (U of C)
   - The Garage (Northwestern)

4. **Competitions & Grants**:
   - Chicago Innovation Awards
   - Get Seeded competitions
   - Illinois Innovation Network
   - Propel by MEDI programs

## Output Format
For each opportunity found, document:

```csv
name,organization,type,amount_range,deadline,stage,sectors,chicago_focused,link,verified_date,notes
```

## Workflow
1. Search each source category
2. Filter for opportunities with:
   - Open application windows
   - Relevant to early-stage (pre-seed to Series A)
   - Active in 2025
3. Verify each link is working
4. Output to `/data/deals/` in the Capital Access Workspace
5. Flag high-priority opportunities (deadline < 30 days, high funding amount)

## Hot Opportunity Criteria
Mark as "HOT" if:
- Deadline within 30 days
- Amount > $50K
- Chicago-focused or Chicago-friendly
- Non-dilutive (grants preferred)
