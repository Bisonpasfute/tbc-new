import { Race, TristateEffect } from '@generated/proto/common';
import { SimHostProvider } from '@sim/context/SimHostContext';
import { fakeHost } from '@sim/testing';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSavedSettings } from './useSavedSettings';

vi.mock('@sim/state/subscriptions', async () => (await import('@sim/testing')).mockSubscriptions());

let key = '';

const store = (entries: Record<string, unknown>) => window.localStorage.setItem(key, JSON.stringify(entries));

const load = () =>
	renderHook(() => useSavedSettings(), {
		wrapper: ({ children }: { children: ReactNode }) => (
			<SimHostProvider host={fakeHost({ getSavedSettingsStorageKey: () => key })}>{children}</SimHostProvider>
		),
	}).result.current;

beforeEach(() => {
	// A fresh key per test: `useTypedLocalStorage` caches the raw string per key across a file.
	key = `tbc-test-savedSettings-${Math.random()}`;
});

describe('useSavedSettings', () => {
	it('reads a current entry', () => {
		store({ Raid: { race: 'RaceOrc' } });

		const { entries } = load();
		expect(entries.map(entry => entry.name)).toEqual(['Raid']);
		expect(entries[0].data.race).toBe(Race.RaceOrc);
	});

	// Saves written before e4d97302e6 hold a bool here, which `SavedSettings.fromJson` throws on;
	// `useSavedData` swallows that and the entry would be gone from the panel without a word.
	it('keeps an entry whose improvedSealOfTheCrusader is a legacy bool', () => {
		store({ Legacy: { race: 'RaceOrc', debuffs: { improvedSealOfTheCrusader: true, misery: true } } });

		const { entries } = load();
		expect(entries.map(entry => entry.name)).toEqual(['Legacy']);
		expect(entries[0].data.debuffs?.improvedSealOfTheCrusader).toBe(TristateEffect.TristateEffectImproved);
		expect(entries[0].data.debuffs?.misery).toBe(true);
	});

	// The migration keys on the bool and not on truthiness: `toJson` writes an enum as its name, so
	// coercing every truthy value the way master's `updateSavedSettings` does would turn a saved
	// Regular into Improved.
	it('leaves a current enum name alone', () => {
		store({ Current: { debuffs: { improvedSealOfTheCrusader: 'TristateEffectRegular' } } });

		expect(load().entries[0].data.debuffs?.improvedSealOfTheCrusader).toBe(TristateEffect.TristateEffectRegular);
	});

	it('does not drop the other entries of the slot', () => {
		store({ Legacy: { debuffs: { improvedSealOfTheCrusader: true } }, Current: { race: 'RaceOrc' } });

		expect(load().entries.map(entry => entry.name)).toEqual(['Legacy', 'Current']);
	});
});
