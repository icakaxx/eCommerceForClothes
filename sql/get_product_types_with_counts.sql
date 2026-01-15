-- PostgreSQL function to get product types with counts using LEFT OUTER JOINs and GROUP BY
-- Run this in your Supabase SQL editor to create the function

CREATE OR REPLACE FUNCTION get_product_types_with_counts(p_rfproducttypeid INTEGER DEFAULT NULL)
RETURNS TABLE (
  producttypeid UUID,
  name TEXT,
  createdat TIMESTAMPTZ,
  updatedat TIMESTAMPTZ,
  propertiescount INTEGER,
  productscount INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.producttypeid,
    pt.name,
    pt.createdat,
    pt.updatedat,
    COALESCE(COUNT(DISTINCT ptp.propertyid), 0)::INTEGER as propertiescount,
    COALESCE(COUNT(DISTINCT CASE WHEN p.isdeleted = false THEN p.productid END), 0)::INTEGER as productscount
  FROM product_types pt
  LEFT OUTER JOIN product_type_properties ptp ON pt.producttypeid = ptp.producttypeid
  LEFT OUTER JOIN products p ON pt.producttypeid = p.producttypeid
  WHERE (p_rfproducttypeid IS NULL OR pt.rfproducttypeid = p_rfproducttypeid)
  GROUP BY pt.producttypeid, pt.name, pt.createdat, pt.updatedat
  ORDER BY pt.name ASC;
END;
$$;

-- Grant execute permission (adjust as needed for your RLS policies)
GRANT EXECUTE ON FUNCTION get_product_types_with_counts TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_types_with_counts TO anon;
