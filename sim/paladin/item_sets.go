package paladin

import (
	"github.com/wowsims/tbc/sim/core"
)

// T4 Ret - Justicar Battlegear
// (2) Set: Increases the damage bonus of your Judgement of the Crusader by 15%.
// (4) Set: Increases the damage dealt by your Judgement of Command by 10%.
var ItemSetJusticarBattlegear = core.NewItemSet(core.ItemSet{
	ID:   626,
	Name: "Justicar Battlegear",
	Bonuses: map[int32]core.ApplySetBonus{
		2: func(agent core.Agent, setBonusAura *core.Aura) {
			setBonusAura.ExposeToAPL(37186)
		},
		4: func(agent core.Agent, setBonusAura *core.Aura) {
			setBonusAura.AttachSpellMod(core.SpellModConfig{
				Kind:       core.SpellMod_DamageDone_Flat,
				FloatValue: 0.10,
				ClassMask:  SpellMaskJudgementOfCommand,
			}).ExposeToAPL(37187)
		},
	},
})
