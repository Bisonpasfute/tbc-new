import { describe, expect, it } from 'vitest';

import { getTalentPoints, getTalentTreePoints } from './utils';

// TBC talent strings are one dash-separated run of per-row digits per tree, so the number a caller
// wants is the per-tree total. MoP's factory returns the digits themselves; swapping the two
// type-checks cleanly and quietly breaks talent-preset auto-matching.
describe('getTalentTreePoints', () => {
	it('sums each tree, and reads an empty middle tree as zero', () => {
		// A real TBC default (feral druid): the middle tree is empty, spelled as '--'.
		expect(getTalentTreePoints('2500052300030150330125--053500031003001')).toEqual([40, 0, 21]);
	});

	it('sums the digits of each tree rather than listing them', () => {
		expect(getTalentTreePoints('1231321-12313123-0')).toEqual([13, 16, 0]);
	});

	it('pads a two-tree string out to three trees', () => {
		expect(getTalentTreePoints('11-22')).toHaveLength(3);
		expect(getTalentTreePoints('11-22')).toEqual([2, 4, 0]);
	});

	it('totals every tree for getTalentPoints', () => {
		expect(getTalentPoints('2500052300030150330125--053500031003001')).toBe(61);
	});
});
