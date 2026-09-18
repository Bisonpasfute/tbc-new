import { ItemSlot } from '@generated/proto/common';

const emptySlotIcons: Record<ItemSlot, string> = {
	[ItemSlot.ItemSlotHead]: '/tbc/assets/item_slots/head.jpg',
	[ItemSlot.ItemSlotNeck]: '/tbc/assets/item_slots/neck.jpg',
	[ItemSlot.ItemSlotShoulder]: '/tbc/assets/item_slots/shoulders.jpg',
	[ItemSlot.ItemSlotBack]: '/tbc/assets/item_slots/shirt.jpg',
	[ItemSlot.ItemSlotChest]: '/tbc/assets/item_slots/chest.jpg',
	[ItemSlot.ItemSlotWrist]: '/tbc/assets/item_slots/wrists.jpg',
	[ItemSlot.ItemSlotHands]: '/tbc/assets/item_slots/hands.jpg',
	[ItemSlot.ItemSlotWaist]: '/tbc/assets/item_slots/waist.jpg',
	[ItemSlot.ItemSlotLegs]: '/tbc/assets/item_slots/legs.jpg',
	[ItemSlot.ItemSlotFeet]: '/tbc/assets/item_slots/feet.jpg',
	[ItemSlot.ItemSlotFinger1]: '/tbc/assets/item_slots/finger.jpg',
	[ItemSlot.ItemSlotFinger2]: '/tbc/assets/item_slots/finger.jpg',
	[ItemSlot.ItemSlotTrinket1]: '/tbc/assets/item_slots/trinket.jpg',
	[ItemSlot.ItemSlotTrinket2]: '/tbc/assets/item_slots/trinket.jpg',
	[ItemSlot.ItemSlotMainHand]: '/tbc/assets/item_slots/mainhand.jpg',
	[ItemSlot.ItemSlotOffHand]: '/tbc/assets/item_slots/offhand.jpg',
	[ItemSlot.ItemSlotRanged]: '/tbc/assets/item_slots/ranged.jpg',
};

export const getEmptySlotIconUrl = (slot: ItemSlot): string => emptySlotIcons[slot];
