-- Drop the existing policy that doesn't check purchase status
DROP POLICY IF EXISTS "Purchasers can view course lessons" ON public.lessons;

-- Create new policy that checks for completed purchase status
CREATE POLICY "Purchasers can view course lessons"
ON public.lessons FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM purchases
    WHERE purchases.course_id = lessons.course_id
      AND purchases.user_id = auth.uid()
      AND purchases.status = 'completed'
  )
);