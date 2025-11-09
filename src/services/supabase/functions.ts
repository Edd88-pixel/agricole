import { supabase } from './client';

type InvokeOptions<TPayload> = {
  body: TPayload;
  headers?: Record<string, string>;
};

export const invokeEdgeFunction = async <TResult, TPayload = Record<string, unknown>>(
  name: string,
  options: InvokeOptions<TPayload>
): Promise<TResult> => {
  const { data, error } = await supabase.functions.invoke(name, {
    body: options.body,
    headers: options.headers
  }) as { data: TResult | null; error: Error | null };

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(`Supabase function ${name} returned no data`);
  }

  return data;
};
