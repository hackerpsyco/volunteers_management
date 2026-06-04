-- Add reviewer_rate to reward_configurations table
ALTER TABLE public.reward_configurations 
ADD COLUMN IF NOT EXISTS reviewer_rate numeric DEFAULT 0;
