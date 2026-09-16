import type { PartyBuffs } from '@generated/proto/common';
import type { Player } from '@sim/player/player';
import { ActionId } from '@sim/proto/action_id';
import { describe, expect, it } from 'vitest';

import { makeQuadstateIconInput } from './input_helpers';

// Battle Shout is the shipped example: the base buff is a tristate field and the fourth state
// is a second, boolean field (the Solarian's Sapphire item).
const battleShout = () =>
	makeQuadstateIconInput<any, PartyBuffs, PartyBuffs>(
		{
			getModObject: (modObj: any) => modObj as PartyBuffs,
			getValue: (modObj: PartyBuffs) => modObj,
			setValue: (modObj: PartyBuffs, newVal: PartyBuffs) => Object.assign(modObj, newVal),
			storeField: 'raid:partyBuffs',
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
});
