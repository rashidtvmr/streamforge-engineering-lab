import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App.tsx';

describe('app foundation', () => {
  it('announces the project with an accessible heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /build\. test\. ship\./i })).toBeVisible();
  });

  it('explains the engineering lab state to users', () => {
    render(<App />);
    expect(screen.getByRole('region', { name: 'Project status' })).toHaveTextContent(
      /unit testing, and CI configured/i,
    );
  });
});
