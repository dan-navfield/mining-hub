-- Create a function to execute dynamic SQL queries safely
-- This is needed for complex aggregation queries in the holders service

CREATE OR REPLACE FUNCTION execute_sql(query TEXT, params JSON DEFAULT '[]'::JSON)
RETURNS TABLE(result JSON)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sql_query TEXT;
    param_value TEXT;
    i INTEGER;
BEGIN
    -- Start with the base query
    sql_query := query;
    
    -- Replace parameter placeholders with actual values
    -- This is a simplified parameter replacement - in production you'd want more robust handling
    FOR i IN 1..JSON_ARRAY_LENGTH(params) LOOP
        param_value := JSON_EXTRACT_PATH_TEXT(params, (i-1)::TEXT);
        sql_query := REPLACE(sql_query, '$' || i::TEXT, quote_literal(param_value));
    END LOOP;
    
    -- Execute the query and return results as JSON
    RETURN QUERY EXECUTE 'SELECT row_to_json(t) FROM (' || sql_query || ') t';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_sql(TEXT, JSON) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql(TEXT, JSON) TO service_role;
