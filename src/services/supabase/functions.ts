import { supabase } from './client';

type InvokeOptions<TPayload> = {
  body: TPayload;
  headers?: Record<string, string>;
};

export const invokeEdgeFunction = async <TResult, TPayload = Record<string, unknown>>(
  name: string,
  options: InvokeOptions<TPayload>
): Promise<TResult> => {
  const { data, error } = await supabase.functions.invoke<TResult>(name, {
    body: options.body,
    headers: options.headers
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(`Supabase function ${name} returned no data`);
  }

  return data;
};
