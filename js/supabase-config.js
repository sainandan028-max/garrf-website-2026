const SUPABASE_URL = 'https://wvmopwhzkowqexdikiyy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3MCnO8Yf35tQLxjEvBvZxA_92igmCPJ';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabaseClient;
