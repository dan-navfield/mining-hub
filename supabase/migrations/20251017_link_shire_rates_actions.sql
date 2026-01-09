-- Add action_id column to shire_rates table to link with actions
ALTER TABLE public.shire_rates 
ADD COLUMN action_id UUID REFERENCES public.actions(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_shire_rates_action_id ON public.shire_rates(action_id);

-- Add shire_rates_id column to actions table for bidirectional linking
ALTER TABLE public.actions 
ADD COLUMN shire_rates_id UUID REFERENCES public.shire_rates(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_actions_shire_rates_id ON public.actions(shire_rates_id);

-- Add action_type column to actions table to categorize different types of actions
ALTER TABLE public.actions 
ADD COLUMN action_type VARCHAR(50) DEFAULT 'general';

-- Update existing actions to have a type
UPDATE public.actions SET action_type = 'general' WHERE action_type IS NULL;

-- Create index for action types
CREATE INDEX IF NOT EXISTS idx_actions_action_type ON public.actions(action_type);
