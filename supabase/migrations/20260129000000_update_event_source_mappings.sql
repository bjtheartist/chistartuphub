-- Update event_sources field_mapping to use format-aware sub-mappings.
-- The standardizer picks the right sub-mapping based on the _sourceFormat tag
-- attached by each scraper to its raw event data.
--
-- NOTE: registration_url is NOT mapped here because standardize.ts
-- automatically falls back to source_url when registration_url is empty.

-- Meetup: raw GraphQL objects (single format)
UPDATE event_sources
SET field_mapping = '{
  "default": {
    "id": "external_id",
    "title": "title",
    "description": "description",
    "dateTime": "start_time",
    "endTime": "end_time",
    "eventUrl": "source_url",
    "isOnline": "is_virtual",
    "venue.name": "venue_name",
    "venue.address": "venue_address",
    "venue.city": "city",
    "venue.state": "state",
    "group.name": "organizer_name",
    "group.link": "organizer_url",
    "images[0].baseUrl": "image_url"
  }
}'::jsonb
WHERE name = 'meetup';

-- Eventbrite: three possible formats
UPDATE event_sources
SET field_mapping = '{
  "default": {
    "id": "external_id",
    "name.text": "title",
    "description.text": "description",
    "start.local": "start_time",
    "end.local": "end_time",
    "url": "source_url",
    "online_event": "is_virtual",
    "venue.name": "venue_name",
    "venue.address.localized_address_display": "venue_address",
    "venue.address.city": "city",
    "venue.address.region": "state",
    "organizer.name": "organizer_name",
    "organizer.url": "organizer_url",
    "logo.url": "image_url",
    "is_free": "is_free",
    "ticket_availability.minimum_ticket_price.display": "price_info"
  },
  "api": {
    "id": "external_id",
    "name.text": "title",
    "description.text": "description",
    "start.local": "start_time",
    "end.local": "end_time",
    "url": "source_url",
    "online_event": "is_virtual",
    "venue.name": "venue_name",
    "venue.address.localized_address_display": "venue_address",
    "venue.address.city": "city",
    "venue.address.region": "state",
    "organizer.name": "organizer_name",
    "organizer.url": "organizer_url",
    "logo.url": "image_url",
    "is_free": "is_free",
    "ticket_availability.minimum_ticket_price.display": "price_info"
  },
  "jsonld": {
    "name": "title",
    "description": "description",
    "startDate": "start_time",
    "endDate": "end_time",
    "url": "source_url",
    "location.name": "venue_name",
    "location.address.streetAddress": "venue_address",
    "location.address.addressLocality": "city",
    "location.address.addressRegion": "state",
    "organizer.name": "organizer_name",
    "organizer.url": "organizer_url",
    "image": "image_url",
    "isAccessibleForFree": "is_free"
  },
  "serverdata": {
    "id": "external_id",
    "name": "title",
    "summary": "description",
    "start_date": "start_time",
    "end_date": "end_time",
    "url": "source_url",
    "is_online_event": "is_virtual",
    "primary_venue.name": "venue_name",
    "primary_venue.address.localized_address_display": "venue_address",
    "primary_venue.address.city": "city",
    "primary_venue.address.region": "state",
    "primary_organizer.name": "organizer_name",
    "image.url": "image_url",
    "is_free": "is_free"
  }
}'::jsonb
WHERE name = 'eventbrite';

-- Luma: raw API objects + JSON-LD fallback
UPDATE event_sources
SET field_mapping = '{
  "default": {
    "api_id": "external_id",
    "name": "title",
    "description": "description",
    "start_at": "start_time",
    "end_at": "end_time",
    "url": "source_url",
    "cover_url": "image_url"
  },
  "jsonld": {
    "name": "title",
    "description": "description",
    "startDate": "start_time",
    "endDate": "end_time",
    "url": "source_url",
    "location.name": "venue_name",
    "location.address.streetAddress": "venue_address",
    "location.address.addressLocality": "city",
    "organizer.name": "organizer_name",
    "image": "image_url",
    "isAccessibleForFree": "is_free"
  }
}'::jsonb
WHERE name = 'luma';
