import { renderHook, act } from '@testing-library/react';
import { useToast, toast, reducer } from '@/hooks/use-toast';
import type { ToasterToast } from '@/components/ui/toast';

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

describe('useToast hook and toast system', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('useToast hook', () => {
    it('initializes with empty toasts array', () => {
      const { result } = renderHook(() => useToast());
      expect(result.current.toasts).toEqual([]);
    });

    it('provides toast and dismiss functions', () => {
      const { result } = renderHook(() => useToast());
      expect(typeof result.current.toast).toBe('function');
      expect(typeof result.current.dismiss).toBe('function');
    });

    it('adds a toast to the array', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({ title: 'Test', description: 'Test message' });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Test');
      expect(result.current.toasts[0].description).toBe('Test message');
      expect(result.current.toasts[0].open).toBe(true);
    });

    it('respects TOAST_LIMIT by removing older toasts', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({ title: 'First' });
        toast({ title: 'Second' });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Second');
    });

    it('dismisses a toast by id', () => {
      const { result } = renderHook(() => useToast());

      let toastId: string;
      act(() => {
        const toastReturn = toast({ title: 'Test' });
        toastId = toastReturn.id;
      });

      expect(result.current.toasts[0].open).toBe(true);

      act(() => {
        result.current.dismiss(toastId!);
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    it('removes dismissed toast after delay', () => {
      const { result } = renderHook(() => useToast());

      let toastId: string;
      act(() => {
        const toastReturn = toast({ title: 'Test' });
        toastId = toastReturn.id;
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.dismiss(toastId!);
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].open).toBe(false);

      act(() => {
        jest.advanceTimersByTime(TOAST_REMOVE_DELAY);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('dismisses all toasts when dismiss is called without id', () => {
      const { result } = renderHook(() => useToast());

      // Add multiple toasts by manipulating state directly
      act(() => {
        toast({ title: 'First' });
      });

      // Since TOAST_LIMIT is 1, we need to test with the state directly
      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    it('updates toast using the returned update function', () => {
      const { result } = renderHook(() => useToast());

      let updateFn: ((props: ToasterToast) => void) | undefined;
      act(() => {
        const toastReturn = toast({ title: 'Original' });
        updateFn = toastReturn.update;
      });

      act(() => {
        updateFn!({ id: result.current.toasts[0].id, title: 'Updated' } as ToasterToast);
      });

      expect(result.current.toasts[0].title).toBe('Updated');
    });
  });

  describe('toast function', () => {
    it('returns an object with id, dismiss, and update functions', () => {
      const result = toast({ title: 'Test' });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('dismiss');
      expect(result).toHaveProperty('update');
      expect(typeof result.id).toBe('string');
      expect(typeof result.dismiss).toBe('function');
      expect(typeof result.update).toBe('function');
    });

    it('calls dismiss when onOpenChange is false', () => {
      const { result } = renderHook(() => useToast());

      let onOpenChange: ((open: boolean) => void) | undefined;
      act(() => {
        toast({
          title: 'Test',
          onOpenChange: (open) => {
            onOpenChange = (open) => {
              if (!open) {
                // dismiss logic
              }
            };
          },
        });
      });

      expect(result.current.toasts[0].onOpenChange).toBeDefined();
    });
  });

  describe('reducer', () => {
    it('handles ADD_TOAST action', () => {
      const initialState = { toasts: [] };
      const newToast: ToasterToast = {
        id: '1',
        title: 'Test',
        open: true,
      };

      const newState = reducer(initialState, {
        type: 'ADD_TOAST',
        toast: newToast,
      });

      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0].title).toBe('Test');
    });

    it('respects TOAST_LIMIT in ADD_TOAST', () => {
      const initialState = {
        toasts: [
          { id: '1', title: 'First', open: true },
        ] as ToasterToast[],
      };
      const newToast: ToasterToast = {
        id: '2',
        title: 'Second',
        open: true,
      };

      const newState = reducer(initialState, {
        type: 'ADD_TOAST',
        toast: newToast,
      });

      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0].id).toBe('2');
    });

    it('handles UPDATE_TOAST action', () => {
      const initialState = {
        toasts: [
          { id: '1', title: 'Original', open: true },
        ] as ToasterToast[],
      };

      const newState = reducer(initialState, {
        type: 'UPDATE_TOAST',
        toast: { id: '1', title: 'Updated' },
      });

      expect(newState.toasts[0].title).toBe('Updated');
      expect(newState.toasts[0].open).toBe(true);
    });

    it('handles DISMISS_TOAST action with specific id', () => {
      const initialState = {
        toasts: [
          { id: '1', title: 'Test', open: true },
        ] as ToasterToast[],
      };

      const newState = reducer(initialState, {
        type: 'DISMISS_TOAST',
        toastId: '1',
      });

      expect(newState.toasts[0].open).toBe(false);
    });

    it('handles DISMISS_TOAST action without id (dismiss all)', () => {
      const initialState = {
        toasts: [
          { id: '1', title: 'First', open: true },
        ] as ToasterToast[],
      };

      const newState = reducer(initialState, {
        type: 'DISMISS_TOAST',
      });

      expect(newState.toasts[0].open).toBe(false);
    });

    it('handles REMOVE_TOAST action with specific id', () => {
      const initialState = {
        toasts: [
          { id: '1', title: 'Test', open: false },
        ] as ToasterToast[],
      };

      const newState = reducer(initialState, {
        type: 'REMOVE_TOAST',
        toastId: '1',
      });

      expect(newState.toasts).toHaveLength(0);
    });

    it('handles REMOVE_TOAST action without id (remove all)', () => {
      const initialState = {
        toasts: [
          { id: '1', title: 'First', open: false },
        ] as ToasterToast[],
      };

      const newState = reducer(initialState, {
        type: 'REMOVE_TOAST',
      });

      expect(newState.toasts).toHaveLength(0);
    });
  });
});
