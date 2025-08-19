-- Disable Row Level Security temporarily to allow initial setup
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.packs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_streams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS users_policy ON public.users;
DROP POLICY IF EXISTS packs_read_policy ON public.packs;
DROP POLICY IF EXISTS packs_write_policy ON public.packs;
DROP POLICY IF EXISTS pack_streams_policy ON public.pack_streams;
DROP POLICY IF EXISTS notifications_policy ON public.notifications;

-- Create a service role policy for users table that allows all operations
-- This is needed because our application is using the service role to create users
CREATE POLICY service_role_users_policy ON public.users
    USING (true)
    WITH CHECK (true);

-- Re-enable Row Level Security with the new policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for the packs table
-- Allow reading public packs or own packs
CREATE POLICY packs_read_policy ON public.packs
    FOR SELECT USING (visibility = 'public' OR owner_id = auth.uid());

-- Allow creating/updating/deleting own packs
CREATE POLICY packs_write_policy ON public.packs
    FOR ALL USING (owner_id = auth.uid());

-- Create policy for pack_streams
CREATE POLICY pack_streams_policy ON public.pack_streams
    FOR ALL USING (
        pack_id IN (
            SELECT id FROM public.packs WHERE owner_id = auth.uid()
        )
    );

-- Create policy for notifications
CREATE POLICY notifications_policy ON public.notifications
    FOR ALL USING (user_id = auth.uid());