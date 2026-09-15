package itemhelpers

import (
	"github.com/wowsims/tbc/sim/common/shared"
	"github.com/wowsims/tbc/sim/core"
)

// Registers a weapon proc whose handler runs on every landed hit that passes the weapon's PPM
// roll. The handler generator runs once per character and may return nil to opt out. The other
// helpers build on this one.
func CreateWeaponProcTrigger(itemID int32, itemName string, ppm float64, spellFlagExclude core.SpellFlag, triggerImmediately bool,
	handlerGenerator func(character *core.Character) core.ProcHandler) {

	core.NewItemEffect(itemID, func(agent core.Agent) {
		character := agent.GetCharacter()

		handler := handlerGenerator(character)
		if handler == nil {
			return
		}

		aura := character.MakeProcTriggerAura(core.ProcTrigger{
			Name:               itemName + " Proc",
			Callback:           core.CallbackOnSpellHitDealt,
			Outcome:            core.OutcomeLanded,
			DPM:                character.NewDynamicLegacyProcForWeapon(itemID, ppm, 0),
			SpellFlagsExclude:  spellFlagExclude,
			TriggerImmediately: triggerImmediately,
			Handler:            handler,
		})

		character.ItemSwap.RegisterProc(itemID, aura)
	})
}

// Registers a weapon proc that deals flat damage. The DefenseType (from SpellCategories) picks the
// hit table and crit multiplier; dmgRange is added on top of dmgMin, so a 60-70 proc is (60, 10).
func CreateWeaponProcDamage(itemID int32, itemName string, ppm float64, spellID int32, school core.SpellSchool,
	dmgMin float64, dmgRange float64, bonusCoef float64, defType core.DefenseType, spellFlagExclude core.SpellFlag) {

	shared.NewProcDamageEffect(shared.ProcDamageEffect{
		ItemID:           itemID,
		SpellID:          spellID,
		School:           school,
		DefenseType:      defType,
		MinDmg:           dmgMin,
		MaxDmg:           dmgMin + dmgRange,
		BonusCoefficient: bonusCoef,
		Flags:            core.SpellFlagNoOnCastComplete | core.SpellFlagPassiveSpell,
		Trigger: core.ProcTrigger{
			Name:              itemName + " Proc",
			Callback:          core.CallbackOnSpellHitDealt,
			Outcome:           core.OutcomeLanded,
			SpellFlagsExclude: spellFlagExclude,
		},
		TriggerDPM: func(character *core.Character) *core.DynamicProcManager {
			return character.NewDynamicLegacyProcForWeapon(itemID, ppm, 0)
		},
	})
}

// Registers a "Chance on hit" weapon damage proc.
func CreateWeaponCoHProcDamage(itemID int32, itemName string, ppm float64, spellID int32, school core.SpellSchool,
	dmgMin float64, dmgRange float64, bonusCoef float64, defType core.DefenseType) {

	CreateWeaponProcDamage(itemID, itemName, ppm, spellID, school, dmgMin, dmgRange, bonusCoef, defType, core.SpellFlagSuppressWeaponProcs)
}

// Registers an "Equip" weapon damage proc.
func CreateWeaponEquipProcDamage(itemID int32, itemName string, ppm float64, spellID int32, school core.SpellSchool,
	dmgMin float64, dmgRange float64, bonusCoef float64, defType core.DefenseType) {

	CreateWeaponProcDamage(itemID, itemName, ppm, spellID, school, dmgMin, dmgRange, bonusCoef, defType, core.SpellFlagSuppressEquipProcs)
}

// Registers a weapon proc that casts a custom spell on the target that was hit. The generator may
// return nil to opt the character out (e.g. a resource proc on a class without that resource).
func CreateWeaponProcSpell(itemID int32, itemName string, ppm float64, procSpellGenerator func(character *core.Character) *core.Spell) {
	CreateWeaponProcTrigger(itemID, itemName, ppm, core.SpellFlagSuppressWeaponProcs, true, func(character *core.Character) core.ProcHandler {
		procSpell := procSpellGenerator(character)
		if procSpell == nil {
			return nil
		}
		procSpell.Flags |= core.SpellFlagNoOnCastComplete | core.SpellFlagPassiveSpell

		return func(sim *core.Simulation, spell *core.Spell, result *core.SpellResult) {
			procSpell.Cast(sim, result.Target)
		}
	})
}

// Registers a weapon proc that activates a custom aura on the wearer.
func CreateWeaponProcAura(itemID int32, itemName string, ppm float64, procAuraGenerator func(character *core.Character) *core.Aura) {
	core.NewItemEffect(itemID, func(agent core.Agent) {
		AddWeaponProcAura(agent.GetCharacter(), itemID, itemName, ppm, procAuraGenerator)
	})
}

// Adds a weapon proc for a custom aura to an existing item effect. A stacking aura is filled to its
// maximum on every proc.
func AddWeaponProcAura(character *core.Character, itemID int32, itemName string, ppm float64, procAuraGenerator func(character *core.Character) *core.Aura) {
	procAura := procAuraGenerator(character)

	aura := character.MakeProcTriggerAura(core.ProcTrigger{
		Name:              itemName + " Proc",
		Callback:          core.CallbackOnSpellHitDealt,
		Outcome:           core.OutcomeLanded,
		DPM:               character.NewDynamicLegacyProcForWeapon(itemID, ppm, 0),
		SpellFlagsExclude: core.SpellFlagSuppressWeaponProcs,
		Handler: func(sim *core.Simulation, spell *core.Spell, result *core.SpellResult) {
			procAura.Activate(sim)
			if procAura.MaxStacks > 0 {
				procAura.SetStacks(sim, procAura.MaxStacks)
			}
		},
	})

	character.ItemSwap.RegisterProc(itemID, aura)
}
