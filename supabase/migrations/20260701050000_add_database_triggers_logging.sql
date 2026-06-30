-- Create or replace database trigger function for activity logging
CREATE OR REPLACE FUNCTION public.log_database_table_change()
RETURNS TRIGGER AS $$
DECLARE
    current_email TEXT;
    current_name TEXT;
    details_str TEXT;
    act_type TEXT;
BEGIN
    -- Resolve actor email and name from Supabase JWT if available
    BEGIN
        current_email := auth.jwt() ->> 'email';
        current_name := auth.jwt() -> 'user_metadata' ->> 'full_name';
    EXCEPTION WHEN OTHERS THEN
        current_email := NULL;
        current_name := NULL;
    END;
    
    -- Fallback to system actor if the change was made outside a user session (e.g. Supabase dashboard, direct SQL script)
    IF current_email IS NULL THEN
        current_email := 'database_system@wes.org';
        current_name := 'Database System (Direct SQL/Console)';
    END IF;
    
    -- Determine action type and details based on operation
    IF TG_OP = 'INSERT' THEN
        act_type := 'CREATE';
        IF TG_TABLE_NAME = 'students' THEN
            details_str := 'Created student: ' || COALESCE(NEW.name, 'Unnamed') || ' (Email: ' || COALESCE(NEW.email, 'N/A') || ')';
        ELSIF TG_TABLE_NAME = 'classes' THEN
            details_str := 'Created class: ' || COALESCE(NEW.name, 'Unnamed');
        ELSIF TG_TABLE_NAME = 'sessions' THEN
            details_str := 'Created session: "' || COALESCE(NEW.title, 'Untitled') || '" (Date: ' || COALESCE(NEW.session_date::text, 'N/A') || ')';
        ELSE
            details_str := 'Inserted record in table ' || TG_TABLE_NAME;
        END IF;
        
    ELSIF TG_OP = 'UPDATE' THEN
        act_type := 'UPDATE';
        IF TG_TABLE_NAME = 'students' THEN
            details_str := 'Updated student details for: ' || COALESCE(NEW.name, OLD.name) || ' (Email: ' || COALESCE(NEW.email, OLD.email) || ')';
            -- Log profile lock toggles specifically if changed
            IF OLD.allow_profile_edit IS DISTINCT FROM NEW.allow_profile_edit THEN
                act_type := CASE WHEN NEW.allow_profile_edit THEN 'UNLOCK' ELSE 'LOCK' END;
                details_str := (CASE WHEN NEW.allow_profile_edit THEN 'Unlocked' ELSE 'Locked' END) || ' profile editing for student: ' || COALESCE(NEW.name, OLD.name);
            END IF;
        ELSIF TG_TABLE_NAME = 'classes' THEN
            IF OLD.name IS DISTINCT FROM NEW.name THEN
                details_str := 'Renamed class: "' || OLD.name || '" to "' || NEW.name || '"';
            ELSE
                details_str := 'Updated class details for: ' || COALESCE(NEW.name, OLD.name);
            END IF;
        ELSIF TG_TABLE_NAME = 'sessions' THEN
            IF OLD.status IS DISTINCT FROM NEW.status THEN
                details_str := 'Updated session status for "' || COALESCE(NEW.title, OLD.title) || '" to: ' || NEW.status;
            ELSE
                details_str := 'Updated session details for: "' || COALESCE(NEW.title, OLD.title) || '"';
            END IF;
        ELSE
            details_str := 'Updated record in table ' || TG_TABLE_NAME;
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        act_type := 'DELETE';
        IF TG_TABLE_NAME = 'students' THEN
            details_str := 'Deleted student: ' || COALESCE(OLD.name, 'Unnamed') || ' (Email: ' || COALESCE(OLD.email, 'N/A') || ')';
        ELSIF TG_TABLE_NAME = 'classes' THEN
            details_str := 'Deleted class: ' || COALESCE(OLD.name, 'Unnamed');
        ELSIF TG_TABLE_NAME = 'sessions' THEN
            details_str := 'Deleted session: "' || COALESCE(OLD.title, 'Untitled') || '"';
        ELSE
            details_str := 'Deleted record from table ' || TG_TABLE_NAME;
        END IF;
    END IF;

    -- Avoid logging inserts on the activity_logs table itself to prevent recursion!
    IF TG_TABLE_NAME != 'activity_logs' THEN
        INSERT INTO public.activity_logs (user_email, user_name, action, module, details)
        VALUES (current_email, current_name, act_type, INITCAP(TG_TABLE_NAME), details_str);
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS log_students_change_trig ON public.students;
DROP TRIGGER IF EXISTS log_classes_change_trig ON public.classes;
DROP TRIGGER IF EXISTS log_sessions_change_trig ON public.sessions;
DROP TRIGGER IF EXISTS log_tasks_change_trig ON public.student_task_feedback;

-- Attach triggers to tables (EXCLUDING student_task_feedback)
CREATE TRIGGER log_students_change_trig
AFTER INSERT OR UPDATE OR DELETE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.log_database_table_change();

CREATE TRIGGER log_classes_change_trig
AFTER INSERT OR UPDATE OR DELETE ON public.classes
FOR EACH ROW EXECUTE FUNCTION public.log_database_table_change();

CREATE TRIGGER log_sessions_change_trig
AFTER INSERT OR UPDATE OR DELETE ON public.sessions
FOR EACH ROW EXECUTE FUNCTION public.log_database_table_change();
