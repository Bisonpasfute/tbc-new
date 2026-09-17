import { PlayerClasses } from '@sim/player/classes/index';
import type { PlayerSpec } from '@sim/player/player_spec';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SimTitleDropdown } from './SimTitleDropdown';

const firstSpec = Object.values(PlayerClasses.naturalOrder[0].specs)[0] as PlayerSpec<any>;

const openRoot = () => {
	render(<SimTitleDropdown currentSpec={firstSpec} />);
	fireEvent.click(document.querySelector('[data-testid="sim-title-dropdown-root"] [data-testid="sim-link"]')!);
	return document.querySelector('[data-testid="sim-title-popup"]')!;
};

describe('SimTitleDropdown', () => {
	it('lists every class as a submenu trigger', () => {
		const triggers = openRoot().querySelectorAll('[aria-haspopup="menu"]');
		expect(triggers).toHaveLength(PlayerClasses.naturalOrder.length);
		expect([...triggers].every(trigger => trigger.getAttribute('role') === 'menuitem')).toBe(true);
	});

	it('opens a class submenu onto that class’s specs', () => {
		const trigger = openRoot().querySelector('[aria-haspopup="menu"]')!;
		fireEvent.click(trigger);
		expect(trigger.getAttribute('aria-expanded')).toBe('true');
		const links = [...document.querySelectorAll('[data-testid="sim-title-popup"][data-nested] a')];
		expect(links).toHaveLength(Object.values(PlayerClasses.naturalOrder[0].specs).length);
	});
});
