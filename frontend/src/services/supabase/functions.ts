import { supabase } from './client';

type InvokeOptions<TPayload> = {
  body: TPayload;
  headers?: Record<string, string>;
};

export const invokeEdgeFunction = async <TResult, TPayload = Record<string, unknown>>(
  name: string,
  options: InvokeOptions<TPayload>
): Promise<TResult> => {
  // Keep headers simple to avoid unnecessary CORS preflights
  const defaultHeaders = { 'Content-Type': 'application/json' } as const;

  // Force JSON encoding to avoid cases where fetch sends "[object Object]"
  const encodedBody = (options?.body ?? null) as unknown as Record<string, unknown> | null;

  const { data, error }: { data: TResult | null; error: any } = await supabase.functions.invoke(name, {
    body: encodedBody ? JSON.stringify(encodedBody) : undefined,
    headers: { ...defaultHeaders, ...(options.headers ?? {}) }
  });

  if (error) {
    const status = typeof error.status === 'number' ? ` (status ${error.status})` : '';
    const details = error.context ? `: ${JSON.stringify(error.context)}` : '';
    throw new Error(`${error.message}${status}${details}`);
  }

  if (!data) {
    throw new Error(`Supabase function ${name} returned no data`);
  }

  return data;
};
