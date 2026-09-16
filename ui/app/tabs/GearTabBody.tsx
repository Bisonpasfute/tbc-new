import { GearPicker } from '@features/gear/components/GearPicker';
import { SavedGear } from '@features/gear/components/SavedGear';
import { SelectorModal } from '@features/gear/components/SelectorModal';
import { GemSummary } from '@features/gear/components/SummaryTable';
import { OpenSelectorModalContext, useSelectorModalState } from '@features/gear/hooks/useSelectorModal';
import { PresetConfigurationCategory } from '@sim/constants/preset_categories';
import { useSimReady } from '@sim/hooks/useSimReady';
import { TabPanelColumns } from '@ui-kit/TabPanelColumns';

import { PresetConfigurationPicker } from '../PresetConfigurationPicker';

const GEAR_PRESETS = [PresetConfigurationCategory.Gear];

export const GearTabBody = () => {
	const ready = useSimReady();
	const selector = useSelectorModalState();

	return (
		<OpenSelectorModalContext value={selector.openTab}>
			<TabPanelColumns.Left variant="auto-columns">
				<GearPicker ready={ready} />
				<div className="grid grid-flow-row grid-cols-2 gap-section max-md:grid-cols-1">
					<GemSummary />
				</div>
			</TabPanelColumns.Left>
			{/*
			 * SEAM (app lane): TBC's `gear_tab.ts` swaps this pair for a phase/group-filtered
			 * `PresetGroupPicker` when any preset carries a `phase` or `group`. That grouping — the
			 * phase tab bar and the grouped gear-set chips — belongs to the app lane, which owns
			 * preset configuration end to end. Replace the two children below when it lands.
			 */}
			<TabPanelColumns.Right>
				<PresetConfigurationPicker categories={GEAR_PRESETS} />
				<SavedGear />
			</TabPanelColumns.Right>
			<SelectorModal state={selector} />
		</OpenSelectorModalContext>
	);
};
