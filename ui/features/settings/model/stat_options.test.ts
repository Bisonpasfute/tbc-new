import { Stat } from '@generated/proto/common';
import { UnitStat } from '@sim/proto/stats';
import { fakeHost } from '@sim/testing';
import { describe, expect, it } from 'vitest';

import { type PickerStatOptions, relevantStatOptions } from './stat_options';

const option = (stats: Array<Stat>) => ({ config: { label: stats.join('/') }, stats }) as unknown as PickerStatOptions;

const manaSpring = option([Stat.StatMP5]);
const manaTide = option([Stat.StatMP5]);
const bloodlust = option([]);
const strengthOfEarth = option([Stat.StatStrength]);
const fortitude = option([Stat.StatStamina]);
const options = [manaSpring, manaTide, bloodlust, strengthOfEarth, fortitude];

const host = (parts: { epStats?: Array<Stat>; displayStats?: Array<UnitStat>; include?: Array<unknown>; exclude?: Array<unknown> }) =>
	fakeHost({
		individualConfig: {
			epStats: parts.epStats ?? [],
			displayStats: parts.displayStats ?? [],
			includeBuffDebuffInputs: parts.include ?? [],
			excludeBuffDebuffInputs: parts.exclude ?? [],
		},
	});

describe('relevantStatOptions', () => {
	it('keeps an option tagged with an EP stat or a displayed stat, and every untagged option', () => {
		const shown = relevantStatOptions(options, host({ epStats: [Stat.StatMP5], displayStats: [UnitStat.fromStat(Stat.StatStamina)] }));
		expect(shown).toEqual([manaSpring, manaTide, bloodlust, fortitude]);
	});

	it('includes by stat, the way every TBC spec lists them', () => {
		expect(relevantStatOptions(options, host({ include: [Stat.StatStrength] }))).toEqual([bloodlust, strengthOfEarth]);
	});

	it('excludes by stat, the sentinel way the feral specs drop Windfury', () => {
		expect(relevantStatOptions(options, host({ epStats: [Stat.StatMP5], exclude: [Stat.StatMP5] }))).toEqual([bloodlust]);
	});

	it('includes and excludes a single input by its config, so one MP5 buff can go while the other stays', () => {
		const shown = relevantStatOptions(
			options,
			host({ epStats: [Stat.StatMP5], include: [fortitude.config], exclude: [manaTide.config, bloodlust.config] }),
		);
		expect(shown).toEqual([manaSpring, fortitude]);
	});
});
