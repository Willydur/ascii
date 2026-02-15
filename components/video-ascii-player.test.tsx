import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { VideoAsciiPlayer } from './video-ascii-player';

describe('VideoAsciiPlayer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('displays first frame initially', () => {
    const frames = ['Frame 1 Content', 'Frame 2 Content', 'Frame 3 Content'];

    render(
      <VideoAsciiPlayer
        videoSrc="test-video.mp4"
        frames={frames}
        fps={10}
      />
    );

    // Verify frame 1 is shown (displayed as "Frame 1 of 3")
    expect(screen.getByText('Frame 1 of 3')).toBeInTheDocument();
    // Verify the first frame content is rendered
    expect(screen.getByText('Frame 1 Content')).toBeInTheDocument();
  });

  it('cycles through frames at specified fps', () => {
    const frames = ['Frame 1', 'Frame 2', 'Frame 3'];
    const fps = 10;
    const frameInterval = 1000 / fps; // 100ms

    render(
      <VideoAsciiPlayer
        videoSrc="test-video.mp4"
        frames={frames}
        fps={fps}
      />
    );

    // Initially at frame 1
    expect(screen.getByText('Frame 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Frame 1')).toBeInTheDocument();

    // Advance by one frame interval
    act(() => {
      vi.advanceTimersByTime(frameInterval);
    });

    // Should now be at frame 2
    expect(screen.getByText('Frame 2 of 3')).toBeInTheDocument();
    expect(screen.getByText('Frame 2')).toBeInTheDocument();

    // Advance by another frame interval
    act(() => {
      vi.advanceTimersByTime(frameInterval);
    });

    // Should now be at frame 3
    expect(screen.getByText('Frame 3 of 3')).toBeInTheDocument();
    expect(screen.getByText('Frame 3')).toBeInTheDocument();
  });

  it('loops back to first frame after last frame', () => {
    const frames = ['Frame A', 'Frame B'];
    const fps = 5;
    const frameInterval = 1000 / fps; // 200ms

    render(
      <VideoAsciiPlayer
        videoSrc="test-video.mp4"
        frames={frames}
        fps={fps}
      />
    );

    // Initially at frame 1
    expect(screen.getByText('Frame 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Frame A')).toBeInTheDocument();

    // Advance to frame 2
    act(() => {
      vi.advanceTimersByTime(frameInterval);
    });

    expect(screen.getByText('Frame 2 of 2')).toBeInTheDocument();
    expect(screen.getByText('Frame B')).toBeInTheDocument();

    // Advance past last frame - should loop back to frame 1
    act(() => {
      vi.advanceTimersByTime(frameInterval);
    });

    // Should be back at frame 1
    expect(screen.getByText('Frame 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Frame A')).toBeInTheDocument();
  });

  it('renders video element with correct src', () => {
    const frames = ['Frame 1'];

    render(
      <VideoAsciiPlayer
        videoSrc="test-video.mp4"
        frames={frames}
        fps={10}
      />
    );

    // Query by element tag since video doesn't have a default accessible role in jsdom
    const videoElement = document.querySelector('video');
    expect(videoElement).toBeInTheDocument();
    expect(videoElement).toHaveAttribute('src', 'test-video.mp4');
  });

  it('returns null when frames array is empty', () => {
    const { container } = render(
      <VideoAsciiPlayer
        videoSrc="test-video.mp4"
        frames={[]}
        fps={10}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('updates frame at correct interval for different fps values', () => {
    const frames = ['F1', 'F2'];

    // Test at 1 fps (1000ms interval)
    const { unmount } = render(
      <VideoAsciiPlayer
        videoSrc="test.mp4"
        frames={frames}
        fps={1}
      />
    );

    expect(screen.getByText('Frame 1 of 2')).toBeInTheDocument();

    // Just before 1000ms, should still be frame 1
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(screen.getByText('Frame 1 of 2')).toBeInTheDocument();

    // At exactly 1000ms, should be frame 2
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByText('Frame 2 of 2')).toBeInTheDocument();

    unmount();

    // Test at 20 fps (50ms interval)
    vi.useRealTimers();
    vi.useFakeTimers();

    render(
      <VideoAsciiPlayer
        videoSrc="test.mp4"
        frames={frames}
        fps={20}
      />
    );

    expect(screen.getByText('Frame 1 of 2')).toBeInTheDocument();

    // Just before 50ms, should still be frame 1
    act(() => {
      vi.advanceTimersByTime(49);
    });
    expect(screen.getByText('Frame 1 of 2')).toBeInTheDocument();

    // At exactly 50ms, should be frame 2
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByText('Frame 2 of 2')).toBeInTheDocument();
  });
});
