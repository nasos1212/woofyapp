DROP VIEW IF EXISTS businesses_public;
CREATE VIEW businesses_public AS
SELECT id,
    business_name,
    description,
    category,
    categories,
    address,
    city,
    website,
    google_maps_url,
    logo_url,
    instagram_url,
    facebook_url,
    tiktok_url,
    verification_status,
    verified_at,
    created_at,
    updated_at
FROM businesses
WHERE verification_status = 'approved'::verification_status;