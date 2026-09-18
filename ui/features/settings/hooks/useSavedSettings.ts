import { TristateEffect } from '@generated/proto/common';
import { SavedSettings } from '@generated/proto/ui';
import { useSimHost } from '@sim/context/SimHostContext';
import type { SavedDataCodec } from '@ui-kit/hooks/useSavedData';
import { useSavedData } from '@ui-kit/hooks/useSavedData';

// `debuffs.improvedSealOfTheCrusader` was a bool before e4d97302e6 made it a TristateEffect, and
// `fromJson` asserts on a bool where an enum belongs. `useSavedData` drops any entry whose codec
// throws, so without this an old save would disappear from the panel with only a console warning.
const migrateLegacyDebuffs = (json: any): any => {
	const legacy = json?.debuffs?.improvedSealOfTheCrusader;
	if (typeof legacy !== 'boolean') return json;
	return {
		...json,
		debuffs: {
			...json.debuffs,
			improvedSealOfTheCrusader: legacy ? TristateEffect.TristateEffectImproved : TristateEffect.TristateEffectMissing,
		},
	};
};

const savedSettingsCodec: SavedDataCodec<SavedSettings> = {
	toJson: settings => SavedSettings.toJson(settings),
	fromJson: json => SavedSettings.fromJson(migrateLegacyDebuffs(json)),
};

export const useSavedSettings = () => useSavedData(useSimHost().getSavedSettingsStorageKey(), savedSettingsCodec);
