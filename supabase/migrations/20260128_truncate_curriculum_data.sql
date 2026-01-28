-- Truncate all curriculum data
-- This will delete all rows from the curriculum table
-- Use this if you need to clear all data and start fresh

TRUNCATE TABLE public.curriculum CASCADE;

-- Reset the sequence if needed
ALTER SEQUENCE IF EXISTS public.curriculum_id_seq RESTART WITH 1;
