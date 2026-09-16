import i18n from '@i18n/config';
import { usePlayer } from '@sim/context/SimHostContext';
import { useStoreSubscribe } from '@sim/hooks/useStoreSubscribe';
import type { Player } from '@sim/player/player';
import { subscribePlayerChange } from '@sim/state/subscriptions';
import { FieldLabel } from '@ui-kit/FormControl';
import { iconEnumPickerShown } from '@ui-kit/IconEnumPicker';
import type { IconEnumPickerConfig } from '@ui-kit/IconEnumPicker/types';
import type { IconPickerConfig } from '@ui-kit/IconPicker/types';
import { type ReactNode, useId } from 'react';

export type ConsumeRowConfig = IconEnumPickerConfig<Player<any>, any> | IconPickerConfig<Player<any>, any>;

const rowConfigShown = (config: ConsumeRowConfig, player: Player<any>): boolean =>
	'values' in config ? iconEnumPickerShown(config, player) : !config.showWhen || config.showWhen(player);

export interface ConsumeRowProps {
	name: 'potions' | 'elixirs' | 'food' | 'engineering' | 'imbue' | 'drums' | 'scrolls' | 'miscellaneous' | 'pet';
	configs?: ReadonlyArray<ConsumeRowConfig>;
	children: ReactNode;
}

export const ConsumeRow = ({ name, configs, children }: ConsumeRowProps) => {
	const player = usePlayer();
	const labelId = useId();
	const shown = useStoreSubscribe(subscribePlayerChange(player), () => !configs || configs.some(config => rowConfigShown(config, player)));

	if (!shown) return null;

	return (
		<div className="ui-field" data-testid="consumes-row" data-input-root="" data-layout="inline" role="group" aria-labelledby={labelId}>
			<FieldLabel as="span" id={labelId}>
				{i18n.t(`settings_tab.consumables.${name}.title`)}
			</FieldLabel>
			{children}
		</div>
	);
};
