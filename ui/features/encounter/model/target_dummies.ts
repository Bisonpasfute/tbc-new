import type { Player } from '@sim/player/player';
import type { Sim } from '@sim/sim';
import { subscribePlayerChange } from '@sim/state/subscriptions';

/** The target-dummy count is the raid's, but whether it may be non-zero is the player's business — a talent or an item swap can take the ability away, and the count has to follow. */
export const watchTargetDummies = (player: Player<any>, sim: Sim): void => {
	if (!player.canEnableTargetDummies()) return;
	subscribePlayerChange(player)(() => {
		if (!player.shouldEnableTargetDummies() && sim.raid.getTargetDummies() !== 0) sim.raid.setTargetDummies(0);
	});
};
