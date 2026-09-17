import type { PartyBuffs } from '@generated/proto/common';
import type { Player } from '@sim/player/player';
import { ActionId } from '@sim/proto/action_id';
import { describe, expect, it } from 'vitest';

import { makeBooleanIconInput, makeQuadstateIconInput } from './input_helpers';

// Battle Shout is the shipped example: the base buff is a tristate field and the fourth state
// is a second, boolean field (the Solarian's Sapphire item).
const battleShout = (extra: { showWhen?: (modObj: PartyBuffs) => boolean } = {}) =>
	makeQuadstateIconInput<any, PartyBuffs, PartyBuffs>(
		{
			getModObject: (modObj: any) => modObj as PartyBuffs,
			getValue: (modObj: PartyBuffs) => modObj,
			setValue: (modObj: PartyBuffs, newVal: PartyBuffs) => Object.assign(modObj, newVal),
			storeField: 'raid:partyBuffs',
			...extra,
		},
		ActionId.fromSpellId(2048),
		ActionId.fromSpellId(12861),
		ActionId.fromItemId(30446),
		'battleShout',
		'bsSolarianSapphire',
	);

describe('makeQuadstateIconInput', () => {
	it('spreads its four states across the buff field and the second improved flag', () => {
		const buffs = { battleShout: 0, bsSolarianSapphire: false } as unknown as PartyBuffs;
		const input = battleShout();
		const player = buffs as unknown as Player<any>;

		expect(input.states).toBe(4);

		const roundTrip = [0, 1, 2, 3].map(value => {
			input.setValue(player, value);
			return [buffs.battleShout, buffs.bsSolarianSapphire, input.getValue(player)];
		});

		expect(roundTrip).toEqual([
			[0, false, 0],
			[1, false, 1],
			[2, false, 2],
			[2, true, 3],
		]);
	});

	// Every tristate, quadstate and multistate buff factory routes through makeNumberIconInput, so a
	// predicate it drops takes the faction gate on all of them with it.
	it('keeps showWhen, which the picker hides on', () => {
		const player = { battleShout: 0, bsSolarianSapphire: false } as unknown as Player<any>;
		const seen: PartyBuffs[] = [];

		expect(battleShout({ showWhen: modObj => (seen.push(modObj), false) }).showWhen!(player)).toBe(false);
		expect(seen).toEqual([player]);
		expect(battleShout({ showWhen: () => true }).showWhen!(player)).toBe(true);
		expect(battleShout().showWhen!(player)).toBe(true);
	});
});

// The picker is handed the player, while a buff config is written against the party or raid it
// reaches through, so every predicate has to be mapped on the way out or it can never fire.
describe('makeBooleanIconInput', () => {
	const partyInput = (enableWhen?: (party: { buffs: PartyBuffs; leaderPresent: boolean }) => boolean) =>
		makeBooleanIconInput<any, PartyBuffs, { buffs: PartyBuffs; leaderPresent: boolean }>(
			{
				getModObject: (player: Player<any>) => (player as unknown as { party: { buffs: PartyBuffs; leaderPresent: boolean } }).party,
				getValue: modObj => modObj.buffs,
				setValue: (modObj, newVal) => Object.assign(modObj.buffs, newVal),
				storeField: 'raid:partyBuffs',
				enableWhen,
			},
			ActionId.fromSpellId(2048),
			'battleShout',
		);

	it('maps enableWhen onto the mod object the config was written against', () => {
		const party = { buffs: { battleShout: false } as unknown as PartyBuffs, leaderPresent: false };
		const player = { party } as unknown as Player<any>;
		const input = partyInput(modObj => modObj.leaderPresent);

		expect(input.enableWhen!(player)).toBe(false);
		party.leaderPresent = true;
		expect(input.enableWhen!(player)).toBe(true);
	});

	it('leaves enableWhen unset when the config names none, so the picker stays enabled', () => {
		expect(partyInput().enableWhen).toBeUndefined();
	});
});
