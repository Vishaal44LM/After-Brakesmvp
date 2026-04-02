
CREATE TABLE public.vehicle_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  title TEXT,
  file_url TEXT NOT NULL,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own documents" ON public.vehicle_documents
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Insert own documents" ON public.vehicle_documents
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Update own documents" ON public.vehicle_documents
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Delete own documents" ON public.vehicle_documents
  FOR DELETE TO authenticated USING (user_id = auth.uid());
