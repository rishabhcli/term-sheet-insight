
-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by owner" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Scenarios table
CREATE TABLE public.scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  round_label TEXT NOT NULL,
  description TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  pre_money_valuation BIGINT NOT NULL,
  investment_amount BIGINT NOT NULL,
  base_shareholders JSONB NOT NULL,
  clean_terms JSONB NOT NULL,
  exit_range JSONB NOT NULL,
  is_preset BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public scenarios readable by all" ON public.scenarios FOR SELECT USING (is_public = true OR auth.uid() = owner_id);
CREATE POLICY "Users can insert own scenarios" ON public.scenarios FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own scenarios" ON public.scenarios FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own scenarios" ON public.scenarios FOR DELETE USING (auth.uid() = owner_id);
CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON public.scenarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Scenario snapshots
CREATE TABLE public.scenario_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  active_clause_ids JSONB NOT NULL DEFAULT '[]',
  exit_value BIGINT NOT NULL,
  snapshot_payload JSONB NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scenario_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Snapshots readable by owner or if linked to public scenario" ON public.scenario_snapshots FOR SELECT USING (
  auth.uid() = owner_id OR EXISTS (SELECT 1 FROM public.scenarios WHERE scenarios.id = scenario_snapshots.scenario_id AND scenarios.is_public = true)
);
CREATE POLICY "Users can insert own snapshots" ON public.scenario_snapshots FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can delete own snapshots" ON public.scenario_snapshots FOR DELETE USING (auth.uid() = owner_id);

-- Share links
CREATE TABLE public.share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  scenario_snapshot_id UUID NOT NULL REFERENCES public.scenario_snapshots(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public share links readable by all" ON public.share_links FOR SELECT USING (is_public = true OR auth.uid() = created_by);
CREATE POLICY "Users can create share links" ON public.share_links FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Event logs (lightweight analytics)
CREATE TABLE public.event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_name TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own events" ON public.event_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read own events" ON public.event_logs FOR SELECT USING (auth.uid() = user_id);

-- Seed preset scenarios
INSERT INTO public.scenarios (slug, name, round_label, description, currency, pre_money_valuation, investment_amount, base_shareholders, clean_terms, exit_range, is_preset, is_public, owner_id)
VALUES
  ('nova-series-a', 'Nova', 'Series A', 'A clean Series A with a $20M pre-money valuation and $5M raise.', 'USD', 20000000, 5000000,
   '[{"id":"founders","label":"Founders","shares":8500000,"classType":"common","displayOrder":1},{"id":"pool","label":"Employee Pool","shares":1000000,"classType":"pool","displayOrder":2},{"id":"advisors","label":"Advisors","shares":500000,"classType":"advisor","displayOrder":3}]',
   '{"liquidationPreferenceMultiple":1,"participationMode":"non-participating","optionPoolTargetPostMoneyPct":0,"optionPoolTiming":"none","board":{"founderSeats":2,"investorSeats":1,"independentSeats":0},"vetoRights":[]}',
   '{"min":10000000,"max":100000000,"step":5000000,"default":30000000}', true, true, NULL),
  ('northstar-seed', 'Northstar', 'Seed', 'An early-stage seed round with a modest valuation.', 'USD', 6000000, 2000000,
   '[{"id":"founders","label":"Founders","shares":7000000,"classType":"common","displayOrder":1},{"id":"pool","label":"Employee Pool","shares":2000000,"classType":"pool","displayOrder":2},{"id":"advisors","label":"Advisors","shares":1000000,"classType":"advisor","displayOrder":3}]',
   '{"liquidationPreferenceMultiple":1,"participationMode":"non-participating","optionPoolTargetPostMoneyPct":0,"optionPoolTiming":"none","board":{"founderSeats":2,"investorSeats":1,"independentSeats":0},"vetoRights":[]}',
   '{"min":5000000,"max":50000000,"step":2500000,"default":15000000}', true, true, NULL),
  ('lattice-series-a', 'Lattice', 'Series A', 'A larger Series A with concentrated founder ownership.', 'USD', 30000000, 8000000,
   '[{"id":"founders","label":"Founders","shares":9000000,"classType":"common","displayOrder":1},{"id":"pool","label":"Employee Pool","shares":500000,"classType":"pool","displayOrder":2},{"id":"advisors","label":"Advisors","shares":500000,"classType":"advisor","displayOrder":3}]',
   '{"liquidationPreferenceMultiple":1,"participationMode":"non-participating","optionPoolTargetPostMoneyPct":0,"optionPoolTiming":"none","board":{"founderSeats":3,"investorSeats":1,"independentSeats":1},"vetoRights":[]}',
   '{"min":20000000,"max":150000000,"step":10000000,"default":50000000}', true, true, NULL),
  ('pulse-series-b', 'Pulse', 'Series B', 'A growth-stage Series B with higher stakes.', 'USD', 80000000, 20000000,
   '[{"id":"founders","label":"Founders","shares":6000000,"classType":"common","displayOrder":1},{"id":"pool","label":"Employee Pool","shares":2000000,"classType":"pool","displayOrder":2},{"id":"advisors","label":"Advisors","shares":500000,"classType":"advisor","displayOrder":3},{"id":"existing-investor","label":"Series A Investor","shares":1500000,"classType":"common","displayOrder":4}]',
   '{"liquidationPreferenceMultiple":1,"participationMode":"non-participating","optionPoolTargetPostMoneyPct":0,"optionPoolTiming":"none","board":{"founderSeats":2,"investorSeats":2,"independentSeats":1},"vetoRights":[]}',
   '{"min":50000000,"max":500000000,"step":25000000,"default":150000000}', true, true, NULL);
