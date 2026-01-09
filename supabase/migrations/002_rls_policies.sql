-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.due_diligence_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM public.users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Administrators can view all users" ON public.users
    FOR SELECT USING (get_user_role(auth.uid()) = 'Administrator');

CREATE POLICY "Administrators can manage all users" ON public.users
    FOR ALL USING (get_user_role(auth.uid()) = 'Administrator');

-- Tenements policies
CREATE POLICY "Administrators can view all tenements" ON public.tenements
    FOR SELECT USING (get_user_role(auth.uid()) = 'Administrator');

CREATE POLICY "Consultants can view assigned tenements" ON public.tenements
    FOR SELECT USING (
        get_user_role(auth.uid()) = 'Consultant' AND 
        consultant_user_id = auth.uid()
    );

CREATE POLICY "Administrators can manage all tenements" ON public.tenements
    FOR ALL USING (get_user_role(auth.uid()) = 'Administrator');

CREATE POLICY "Consultants can update assigned tenements" ON public.tenements
    FOR UPDATE USING (
        get_user_role(auth.uid()) = 'Consultant' AND 
        consultant_user_id = auth.uid()
    );

-- Actions policies
CREATE POLICY "Administrators can view all actions" ON public.actions
    FOR SELECT USING (get_user_role(auth.uid()) = 'Administrator');

CREATE POLICY "Consultants can view assigned actions" ON public.actions
    FOR SELECT USING (
        get_user_role(auth.uid()) = 'Consultant' AND 
        (assigned_to_user_id = auth.uid() OR 
         tenement_id IN (
             SELECT id FROM public.tenements 
             WHERE consultant_user_id = auth.uid()
         ))
    );

CREATE POLICY "Administrators can manage all actions" ON public.actions
    FOR ALL USING (get_user_role(auth.uid()) = 'Administrator');

CREATE POLICY "Consultants can manage assigned actions" ON public.actions
    FOR ALL USING (
        get_user_role(auth.uid()) = 'Consultant' AND 
        (assigned_to_user_id = auth.uid() OR 
         tenement_id IN (
             SELECT id FROM public.tenements 
             WHERE consultant_user_id = auth.uid()
         ))
    );

-- Due diligence runs policies
CREATE POLICY "Users can view their own due diligence runs" ON public.due_diligence_runs
    FOR SELECT USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can create due diligence runs" ON public.due_diligence_runs
    FOR INSERT WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY "Administrators can view all due diligence runs" ON public.due_diligence_runs
    FOR SELECT USING (get_user_role(auth.uid()) = 'Administrator');

CREATE POLICY "Administrators can manage all due diligence runs" ON public.due_diligence_runs
    FOR ALL USING (get_user_role(auth.uid()) = 'Administrator');

-- Audit events policies
CREATE POLICY "Administrators can view all audit events" ON public.audit_events
    FOR SELECT USING (get_user_role(auth.uid()) = 'Administrator');

CREATE POLICY "Consultants can view audit events for their entities" ON public.audit_events
    FOR SELECT USING (
        get_user_role(auth.uid()) = 'Consultant' AND 
        (actor_user_id = auth.uid() OR
         (entity = 'Tenement' AND entity_id IN (
             SELECT id FROM public.tenements 
             WHERE consultant_user_id = auth.uid()
         )) OR
         (entity = 'Action' AND entity_id IN (
             SELECT a.id FROM public.actions a
             JOIN public.tenements t ON a.tenement_id = t.id
             WHERE t.consultant_user_id = auth.uid() OR a.assigned_to_user_id = auth.uid()
         )))
    );

-- Service role can bypass all RLS (for background jobs and admin operations)
CREATE POLICY "Service role bypass" ON public.users FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON public.tenements FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON public.actions FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON public.due_diligence_runs FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON public.audit_events FOR ALL TO service_role USING (true);
