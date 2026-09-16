import { Class, Spec } from '@generated/proto/common';

import { getSpecSitePath, LaunchStatus, Phase } from '../../constants/other';
import { IconSize } from '../player_class';
import { PlayerSpec, SimStatus } from '../player_spec';

export class Priest extends PlayerSpec<Spec.SpecPriest> {
	static specIndex = 0;
	static specID = Spec.SpecPriest as Spec.SpecPriest;
	static classID = Class.ClassPriest as Class.ClassPriest;
	static friendlyName = 'Shadow';
	static simLink = getSpecSitePath('priest', 'dps');

	static isTankSpec = false;
	static isHealingSpec = false;
	static isRangedDpsSpec = true;
	static isMeleeDpsSpec = false;
	static canDualWield = false;

	static launch: SimStatus = {
		phase: Phase.Phase3,
		status: LaunchStatus.Alpha,
	};

	readonly specIndex = Priest.specIndex;
	readonly specID = Priest.specID;
	readonly classID = Priest.classID;
	readonly friendlyName = Priest.friendlyName;
	readonly simLink = Priest.simLink;

	readonly isTankSpec = Priest.isTankSpec;
	readonly isHealingSpec = Priest.isHealingSpec;
	readonly isRangedDpsSpec = Priest.isRangedDpsSpec;
	readonly isMeleeDpsSpec = Priest.isMeleeDpsSpec;

	readonly canDualWield = Priest.canDualWield;

	readonly launch = Priest.launch;

	static getIcon = (size: IconSize): string => {
		return `https://wow.zamimg.com/images/wow/icons/${size}/spell_shadow_shadowwordpain.jpg`;
	};

	getIcon = (size: IconSize): string => {
		return Priest.getIcon(size);
	};
}
