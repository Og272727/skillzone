-- PUBG Mobile Integration Schema Updates

-- Update tournaments table to support PUBG Mobile
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS pubg_map VARCHAR(50),
ADD COLUMN IF NOT EXISTS pubg_mode VARCHAR(50),
ADD COLUMN IF NOT EXISTS pubg_perspective VARCHAR(20);

-- Update game_type constraint to include PUBG Mobile
ALTER TABLE tournaments
DROP CONSTRAINT IF EXISTS tournaments_game_type_check;

ALTER TABLE tournaments
ADD CONSTRAINT tournaments_game_type_check
CHECK (game_type IN ('Warzone', 'Call of Duty: Modern Warfare', 'Fortnite', 'Apex Legends', 'Valorant', 'CS:GO', 'Rocket League', 'Other', 'PUBG Mobile'));

-- Create PUBG player accounts table
CREATE TABLE IF NOT EXISTS public.user_pubg_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pubg_player_id VARCHAR(100) UNIQUE,
  pubg_player_name VARCHAR(100),
  platform VARCHAR(50) DEFAULT 'steam',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on user_pubg_accounts
ALTER TABLE public.user_pubg_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for user_pubg_accounts
CREATE POLICY "Users can view own PUBG accounts" ON public.user_pubg_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own PUBG accounts" ON public.user_pubg_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own PUBG accounts" ON public.user_pubg_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own PUBG accounts" ON public.user_pubg_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Update player_performance table to include PUBG-specific fields
ALTER TABLE player_performance
ADD COLUMN IF NOT EXISTS survival_time INTEGER,
ADD COLUMN IF NOT EXISTS damage_done DECIMAL(10,2);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_pubg_accounts
DROP TRIGGER IF EXISTS update_user_pubg_accounts_updated_at ON user_pubg_accounts;
CREATE TRIGGER update_user_pubg_accounts_updated_at
    BEFORE UPDATE ON user_pubg_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
