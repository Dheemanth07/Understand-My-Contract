describe('supabaseClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSupabaseClient function', () => {
    it('exports a createSupabaseClient factory function', () => {
      const { createSupabaseClient } = require('@/lib/supabaseClient');
      expect(typeof createSupabaseClient).toBe('function');
    });

    it('creates a client with provided url and key', () => {
      const { createSupabaseClient } = require('@/lib/supabaseClient');
      const client = createSupabaseClient('https://example.supabase.co', 'test-key');
      expect(client).toBeDefined();
    });
  });

  describe('supabase client instance', () => {
    it('exports a supabase client instance', () => {
      const { supabase } = require('@/lib/supabaseClient');
      expect(supabase).toBeDefined();
    }
  });

    it('client instance has auth property', () => {
      const { supabase } = require('@/lib/supabaseClient');
      expect(supabase.auth).toBeDefined();
    }
  });

    it('client instance has from method for database queries', () => {
      const { supabase } = require('@/lib/supabaseClient');
      expect(typeof supabase.from).toBe('function');
    });
  });
});
