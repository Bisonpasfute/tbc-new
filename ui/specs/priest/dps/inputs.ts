import { ActionId } from '@sim/proto/action_id';
import { PriestSpecs } from '@sim/proto/spec_types';
import * as InputHelpers from '@ui-kit/input_helpers';

// Configuration for class-specific UI elements on the settings tab.
// These don't need to be in a separate file but it keeps things cleaner.

export const ShadowformInput = <SpecType extends PriestSpecs>() =>
	InputHelpers.makeClassOptionsBooleanIconInput<SpecType>({
		fieldName: 'preShadowform',
		id: ActionId.fromSpellId(15473),
		// `showWhen` reads talents, so the picker has to watch them as well as the default specOptions.
		storeField: ['specOptions', 'talentsString'] as const,
		showWhen: player => player.getTalents().shadowform,
	});
