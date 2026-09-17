import type { Outcome } from '@sim/proto/combat_log';

export const OUTCOME_LABEL: Record<Outcome, string> = {
	miss: 'Miss',
	dodge: 'Dodge',
	parry: 'Parry',
	'critical-block': 'Critical Block',
	block: 'Block',
	glance: 'Glance',
	crit: 'Crit',
	'suppressed-crit': 'Suppressed Crit',
	crush: 'Crush',
	hit: 'Hit',
};
