import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserMenu from '../../app-shell/UserMenu';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key
  })
}));

describe('UserMenu', () => {
  it('renders basic identity fallback when no avatar is provided', () => {
    render(
      <MemoryRouter>
        <UserMenu userName="Jane Doe" userEmail="jane@example.com" userAvatar={null} onSignOut={() => undefined} />
      </MemoryRouter>
    );

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('invokes sign-out when the corresponding action is selected', async () => {
    const onSignOut = vi.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <UserMenu userName="John Doe" userEmail="john@example.com" userAvatar={null} onSignOut={onSignOut} />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /john doe/i }));
    const action = await screen.findByRole('menuitem', { name: 'common.signOut' });
    await user.click(action);

    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});
