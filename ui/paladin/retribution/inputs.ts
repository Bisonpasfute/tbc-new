// Configuration for spec-specific UI elements on the settings tab.
// These don't need to be in a separate file but it keeps things cleaner.
import * as InputHelpers from '../../core/components/input_helpers';
import { Spec } from '../../core/proto/common';

export const PaladinRotationConfig = {
	inputs: [
		InputHelpers.makeRotationBooleanInput<Spec.SpecRetributionPaladin>({
			fieldName: 'useExorcism',
			label: 'Use Exorcism',
			labelTooltip: 'If <b>true</b>, will use Excorism in rotation if target is undead or demon.',
			changeEmitter: player => player.rotationChangeEmitter,
			getValue: player => player.getSimpleRotation().useExorcism,
		}),
		InputHelpers.makeRotationBooleanInput<Spec.SpecRetributionPaladin>({
			fieldName: 'useConsecrate',
			label: 'Use Consecrate',
			labelTooltip: 'If <b>true</b>, will use Consecrate in rotation. Exorcism is priority',
			changeEmitter: player => player.rotationChangeEmitter,
			getValue: player => player.getSimpleRotation().useConsecrate,
		}),
		InputHelpers.makeRotationNumberInput<Spec.SpecRetributionPaladin>({
			fieldName: 'delayMajorCDs',
			label: 'Delay Major CDs',
			labelTooltip: 'Delays the first automatic use of major cooldowns (e.g. Bloodlust, Drums) by the specified number of seconds.',
			changeEmitter: player => player.rotationChangeEmitter,
			getValue: player => player.getSimpleRotation().delayMajorCDs,
			positive: true,
		}),
		InputHelpers.makeRotationBooleanInput<Spec.SpecRetributionPaladin>({
			fieldName: 'prepullSotC',
			label: 'Prepull Seal of the Crusader',
			labelTooltip:
				'If <b>true</b>, will use Seal of the Crusader on prepull for the target Debuff. Set this to true if you are the only paladin applying SotC. <br/><br/> If <b>false</b>, make sure to enable SotC in settings under debuffs.',
			changeEmitter: player => player.rotationChangeEmitter,
			getValue: player => player.getSimpleRotation().prepullSotC,
		}),
	],
};
