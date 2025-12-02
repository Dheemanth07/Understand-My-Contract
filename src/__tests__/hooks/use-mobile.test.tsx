import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '@/hooks/use-mobile';

describe('useIsMobile hook', () => {
  const MOBILE_BREAKPOINT = 768;
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    // Reset window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    // Reset matchMedia mock
    (window.matchMedia as jest.Mock).mockImplementation((query) => ({
      matches: query === `(max-width: ${MOBILE_BREAKPOINT - 1}px)` && window.innerWidth < MOBILE_BREAKPOINT,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it('returns false for desktop width on initial render', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('returns true for mobile width on initial render', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('correctly identifies breakpoint at 768px as desktop', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('correctly identifies breakpoint at 767px as mobile', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 767,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('updates state when resizing from mobile to desktop', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { result, rerender } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);

    // Simulate resize event
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const matchMediaMock = window.matchMedia as jest.Mock;
      const listeners = (matchMediaMock.mock.results[0].value.addEventListener as jest.Mock).mock.calls;
      if (listeners.length > 0) {
        const changeHandler = listeners[0][1];
        changeHandler({ matches: false });
      }
    });

    rerender();
    expect(result.current).toBe(false);
  });

  it('updates state when resizing from desktop to mobile', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const { result, rerender } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // Simulate resize event
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const matchMediaMock = window.matchMedia as jest.Mock;
      const listeners = (matchMediaMock.mock.results[0].value.addEventListener as jest.Mock).mock.calls;
      if (listeners.length > 0) {
        const changeHandler = listeners[0][1];
        changeHandler({ matches: true });
      }
    });

    rerender();
    expect(result.current).toBe(true);
  });

  it('removes event listener on unmount', () => {
    const { unmount } = renderHook(() => useIsMobile());

    const matchMediaMock = window.matchMedia as jest.Mock;
    const mockMediaQueryList = matchMediaMock.mock.results[0]?.value;

    if (mockMediaQueryList) {
      const removeEventListenerSpy = mockMediaQueryList.removeEventListener as jest.Mock;
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalled();
    }
  });

  it('handles multiple resize events correctly', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const { result, rerender } = renderHook(() => useIsMobile());

    const resizeSteps = [375, 800, 600, 1200];

    resizeSteps.forEach((width) => {
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });

        const matchMediaMock = window.matchMedia as jest.Mock;
        const listeners = (matchMediaMock.mock.results[0].value.addEventListener as jest.Mock).mock.calls;
        if (listeners.length > 0) {
          const changeHandler = listeners[0][1];
          changeHandler({ matches: width < MOBILE_BREAKPOINT });
        }
      });

      rerender();
      expect(result.current).toBe(width < MOBILE_BREAKPOINT);
    });
  });
});
