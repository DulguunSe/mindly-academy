-- Allow admins to update and delete purchases for payment management
CREATE POLICY "Admins can update purchases" 
ON public.purchases 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete purchases" 
ON public.purchases 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));