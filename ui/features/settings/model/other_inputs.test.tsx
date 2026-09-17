import { SimHostProvider } from '@sim/context/SimHostContext';
import { fakeHost } from '@sim/testing';
import { render, screen } from '@testing-library/react';
import { NumberPicker } from '@ui-kit/NumberPicker';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DistanceFromTarget } from './other_inputs';

const source = vi.hoisted(() => {
	const listeners = new Set<() => void>();
	return {
		subscribe: (onChange: () => void) => {
			listeners.add(onChange);
			return () => listeners.delete(onChange);
		},
		notify: () => listeners.forEach(listener => listener()),
		clear: () => listeners.clear(),
	};
});

vi.mock('@sim/state/subscriptions', async () => (await import('@sim/testing')).mockSubscriptions(source.subscribe));
vi.mock('@i18n/config', () => ({ default: { t: (key: string) => key } }));

let distance = 0;

const mount = () => {
	const player = {
		getDistanceFromTarget: () => distance,
		setDistanceFromTarget: (value: number) => {
			distance = value;
			source.notify();
		},
	} as any;
	render(
		<SimHostProvider host={fakeHost({ player })}>
			<NumberPicker modObject={player} config={DistanceFromTarget} />
		</SimHostProvider>,
	);
};

const input = () => screen.getByRole('textbox') as HTMLInputElement;

const commit = (text: string) => {
	input().value = text;
	input().dispatchEvent(new Event('change', { bubbles: true }));
};

beforeEach(() => {
	source.clear();
	distance = 20;
});

describe('DistanceFromTarget', () => {
	it('keeps the decimals the user typed', () => {
		mount();
		expect(input().value).toBe('20.00');

		commit('5.5');
		expect(distance).toBe(5.5);
		expect(input().value).toBe('5.50');
	});

	// A negative distance is accepted by the sim and then persisted into saved settings and share
	// links, so the picker is what has to reject it.
	it('drops the sign on a negative distance', () => {
		mount();

		commit('-5');
		expect(distance).toBe(5);
	});
});
