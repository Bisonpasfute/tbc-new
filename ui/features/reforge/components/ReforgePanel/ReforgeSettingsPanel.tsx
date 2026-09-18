import type { ReforgeOptimizerModel, ReforgeOptimizerOptions } from '@features/reforge/model/reforge_optimizer';
import { gemPhaseValues } from '@features/reforge/model/utils';
import { SavedEpWeights } from '@features/stat-weights/components/SavedEpWeights';
import { useOpenEpWeights } from '@features/stat-weights/hooks/useEpWeightsDialog';
import { ItemQuality } from '@generated/proto/common';
import i18n from '@i18n/config';
import { translateItemQuality } from '@i18n/localization';
import { useSimHost, useSpecConfig } from '@sim/context/SimHostContext';
import { BooleanPicker } from '@ui-kit/BooleanPicker';
import { Button } from '@ui-kit/Button';
import { EnumPicker } from '@ui-kit/EnumPicker';
import { useMemo } from 'react';

import { trackEvent } from '../../../../tracking/utils';
import { useReforgeField } from '../../hooks/useReforgeField';
import { ReforgeBreakpointLimits } from './ReforgeBreakpointLimits';
import { ReforgeFrozenSlots } from './ReforgeFrozenSlots';
import { ReforgeStatCaps } from './ReforgeStatCaps';
import { buildStatTooltips } from './utils';

export interface ReforgeSettingsPanelProps {
	model: ReforgeOptimizerModel;
	options?: ReforgeOptimizerOptions;
	/** Closes the popover when the EP weights dialog opens over it. */
	onClose: () => void;
}

/** The popover's body. Mounted only while the popover is open, so every section is built per open. */
export const ReforgeSettingsPanel = ({ model, options, onClose }: ReforgeSettingsPanelProps) => {
	const host = useSimHost();
	const player = host.player;
	const individualConfig = useSpecConfig();
	const openEpWeights = useOpenEpWeights();
	const settings = model.settings;

	const useCustomEPValues = useReforgeField(settings, 'useCustomEPValues', () => settings.useCustomEPValues);
	const useSoftCapBreakpoints = useReforgeField(settings, 'useSoftCapBreakpoints', () => settings.useSoftCapBreakpoints);
	const freezeItemSlots = useReforgeField(settings, 'freezeItemSlots', () => settings.freezeItemSlots);

	const statTooltips = useMemo(() => buildStatTooltips(options?.statTooltips), [options]);
	const phaseValues = useMemo(() => gemPhaseValues().map(phase => ({ name: i18n.t(`common.phases.${phase}`), value: phase })), []);
	const qualityValues = useMemo(
		() =>
			Object.values(ItemQuality)
				.filter(
					(quality): quality is number =>
						typeof quality === 'number' && quality >= ItemQuality.ItemQualityUncommon && quality <= ItemQuality.ItemQualityEpic,
				)
				.map(quality => ({ name: translateItemQuality(quality), value: quality })),
		[],
	);
	const softCapsConfig = model.softCapsConfig;
	const hasSoftCaps = !!softCapsConfig?.length;

	return (
		<>
			<BooleanPicker
				modObject={player}
				config={{
					extraClassNames: ['mb-2'],
					id: 'reforge-optimizer-enable-custom-ep-weights',
					label: i18n.t('sidebar.buttons.suggest_reforges.use_custom'),
					layout: 'inline',
					storeField: 'reforge:useCustomEPValues',
					getValue: () => settings.useCustomEPValues,
					setValue: (_player, newValue) => {
						trackEvent({ action: 'settings', category: 'reforging', label: 'use_custom_ep', value: newValue });
						settings.setUseCustomEPValues(newValue);
					},
				}}
			/>
			{!useCustomEPValues && (
				<div className="mb-0">
					<p>{i18n.t('sidebar.buttons.suggest_reforges.enable_modification')}</p>
					<p>{i18n.t('sidebar.buttons.suggest_reforges.modify_in_editor')}</p>
					<p>{i18n.t('sidebar.buttons.suggest_reforges.hard_cap_info')}</p>
				</div>
			)}
			<ReforgeStatCaps
				model={model}
				player={player}
				displayStats={individualConfig.displayStats}
				statTooltips={statTooltips}
				useCustomEPValues={useCustomEPValues}
			/>
			{hasSoftCaps && (
				<BooleanPicker
					modObject={player}
					config={{
						extraClassNames: ['mb-2'],
						id: 'reforge-optimizer-enable-soft-cap-breakpoints',
						label: i18n.t('sidebar.buttons.suggest_reforges.use_soft_cap_breakpoints'),
						layout: 'inline',
						storeField: 'reforge:useSoftCapBreakpoints',
						getValue: () => settings.useSoftCapBreakpoints,
						setValue: (_player, newValue) => {
							trackEvent({ action: 'settings', category: 'reforging', label: 'softcap_breakpoints', value: newValue });
							settings.setUseSoftCapBreakpoints(newValue);
						},
					}}
				/>
			)}
			{model.enableBreakpointLimits && hasSoftCaps && (
				<ReforgeBreakpointLimits settings={settings} softCapsConfig={softCapsConfig} player={player} useSoftCapBreakpoints={useSoftCapBreakpoints} />
			)}
			<BooleanPicker
				modObject={player}
				config={{
					extraClassNames: ['mb-2'],
					id: 'reforge-optimizer-disable-unique-gems',
					label: i18n.t('sidebar.buttons.suggest_reforges.disable_unique_gems'),
					layout: 'inline',
					storeField: 'reforge:disableUniqueGems',
					getValue: () => settings.disableUniqueGems,
					setValue: (_player, newValue) => {
						trackEvent({ action: 'settings', category: 'reforging', label: 'disable_unique_gems', value: newValue });
						model.setDisableUniqueGems(newValue);
					},
				}}
			/>
			<EnumPicker
				modObject={player}
				config={{
					extraClassNames: ['mb-2'],
					id: 'reforge-optimizer-max-gem-phase',
					label: i18n.t('sidebar.buttons.suggest_reforges.max_gem_phase'),
					defaultValue: model.getMaxGemPhase(),
					values: phaseValues,
					storeField: 'reforge:maxGemPhase',
					getValue: () => model.getMaxGemPhase(),
					setValue: (_player, newValue) => {
						trackEvent({ action: 'settings', category: 'reforging', label: 'max_gem_phase', value: newValue });
						model.setMaxGemPhase(newValue);
					},
				}}
			/>
			<EnumPicker
				modObject={player}
				config={{
					extraClassNames: ['mb-2'],
					id: 'reforge-optimizer-max-gem-quality',
					label: i18n.t('sidebar.buttons.suggest_reforges.max_gem_quality'),
					defaultValue: model.getMaxGemQuality(),
					values: qualityValues,
					storeField: 'reforge:maxGemQuality',
					getValue: () => model.getMaxGemQuality(),
					setValue: (_player, newValue) => {
						trackEvent({ action: 'settings', category: 'reforging', label: 'max_gem_quality', value: newValue });
						model.setMaxGemQuality(newValue);
					},
				}}
			/>
			<BooleanPicker
				modObject={player}
				config={{
					extraClassNames: ['mb-2'],
					id: 'reforge-optimizer-freeze-item-slots',
					label: i18n.t('sidebar.buttons.suggest_reforges.freeze_item_slots'),
					labelTooltip: i18n.t('sidebar.buttons.suggest_reforges.freeze_item_slots_tooltip'),
					layout: 'inline',
					storeField: 'reforge:freezeItemSlots',
					getValue: () => settings.freezeItemSlots,
					setValue: (_player, newValue) => {
						trackEvent({ action: 'settings', category: 'reforging', label: 'freeze_item_slots', value: newValue });
						settings.setFreezeItemSlots(newValue);
					},
				}}
			/>
			<ReforgeFrozenSlots settings={settings} player={player} freezeItemSlots={freezeItemSlots} />
			<SavedEpWeights className="mt-4" loadOnly presetsOnly={!useCustomEPValues} />
			<Button
				variant="outline-primary"
				className="mt-2"
				data-testid="reforge-edit-weights"
				onClick={() => {
					openEpWeights();
					onClose();
				}}>
				{i18n.t('sidebar.buttons.suggest_reforges.edit_weights')}
			</Button>
		</>
	);
};
