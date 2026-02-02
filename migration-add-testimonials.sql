-- Migration: Add testimonials table for customer testimonial images
-- This enables admins to upload and manage customer chat screenshots as testimonials

CREATE TABLE IF NOT EXISTS public.testimonials (
  testimonialid uuid NOT NULL DEFAULT gen_random_uuid(),
  imageurl text NOT NULL,
  sortorder integer NOT NULL DEFAULT 0,
  isactive boolean NOT NULL DEFAULT true,
  createdat timestamp with time zone NOT NULL DEFAULT now(),
  updatedat timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT testimonials_pkey PRIMARY KEY (testimonialid)
);

-- Add index for better query performance on active testimonials
CREATE INDEX IF NOT EXISTS idx_testimonials_isactive_sortorder 
ON public.testimonials(isactive, sortorder);

-- Add index for sorting
CREATE INDEX IF NOT EXISTS idx_testimonials_sortorder 
ON public.testimonials(sortorder);
