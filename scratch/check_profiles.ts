if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: () => null,
    setItem: () => null,
    removeItem: () => null,
    clear: () => null,
  };
}

async function run() {
  const { supabase } = await import('../src/integrations/supabase/client');
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, email, name, role_id');
  if (error) {
    console.error(error);
  } else {
    console.log(data);
  }
}
run();
