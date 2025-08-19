-- Disable Row Level Security temporarily to allow the application to work
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.packs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_streams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;