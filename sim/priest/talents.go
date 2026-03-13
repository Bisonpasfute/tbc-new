package priest

import (
	"time"

	"github.com/wowsims/tbc/sim/core"
	"github.com/wowsims/tbc/sim/core/stats"
)

func (priest *Priest) applyImprovedMindBlast() {
	if priest.Talents.ImprovedMindBlast == 0 {
		return
	}

	priest.AddStaticMod(core.SpellModConfig{
		Kind:      core.SpellMod_Cooldown_Flat,
		TimeValue: time.Millisecond * time.Duration(-500*priest.Talents.ImprovedMindBlast),
		ClassMask: PriestSpellMindBlast,
	})
}

func (priest *Priest) applyInnerFocus() {
	if !priest.Talents.InnerFocus {
		return
	}

	critMod := priest.AddDynamicMod(core.SpellModConfig{
		Kind:       core.SpellMod_BonusCrit_Percent,
		FloatValue: 25.0,
		ClassMask:  PriestSpellsAll,
	})

	var innerFocusSpell *core.Spell
	priest.InnerFocusAura = priest.RegisterAura(core.Aura{
		Label:    "Inner Focus",
		ActionID: core.ActionID{SpellID: 14751},
		Duration: time.Hour,
		OnGain: func(aura *core.Aura, sim *core.Simulation) {
			aura.Unit.PseudoStats.SpellCostPercentModifier -= 100
			critMod.Activate()
		},
		OnExpire: func(aura *core.Aura, sim *core.Simulation) {
			aura.Unit.PseudoStats.SpellCostPercentModifier += 100
			critMod.Deactivate()
			innerFocusSpell.CD.Use(sim)
		},
		OnCastComplete: func(aura *core.Aura, sim *core.Simulation, spell *core.Spell) {
			if !spell.Matches(PriestSpellsAll) {
				return
			}
			aura.Deactivate(sim)
		},
	})

	innerFocusSpell = priest.RegisterSpell(core.SpellConfig{
		ActionID:       core.ActionID{SpellID: 14751},
		Flags:          core.SpellFlagNoOnCastComplete | core.SpellFlagAPL,
		ClassSpellMask: PriestSpellFlagNone,
		Cast: core.CastConfig{
			DefaultCast: core.Cast{
				NonEmpty: true,
			},
			CD: core.Cooldown{
				Timer:    priest.NewTimer(),
				Duration: time.Second * 180,
			},
		},
		ApplyEffects: func(sim *core.Simulation, _ *core.Unit, _ *core.Spell) {
			priest.InnerFocusAura.Activate(sim)
		},
		RelatedSelfBuff: priest.InnerFocusAura,
	})

	priest.AddMajorCooldown(core.MajorCooldown{
		Spell: innerFocusSpell,
		Type:  core.CooldownTypeMana,
	})
}

func (priest *Priest) applyMeditation() {
	if priest.Talents.Meditation == 0 {
		return
	}

	priest.PseudoStats.SpiritRegenRateCasting += 0.10 * float64(priest.Talents.Meditation)
	priest.UpdateManaRegenRates()
}

func (priest *Priest) applyMentalAgility() {
	if priest.Talents.MentalAgility == 0 {
		return
	}

	priest.AddStaticMod(core.SpellModConfig{
		Kind:       core.SpellMod_PowerCost_Pct,
		FloatValue: -0.02 * float64(priest.Talents.MentalAgility),
		ClassMask:  PriestSpellInstant,
	})
}

func (priest *Priest) applyDarkness() {
	if priest.Talents.Darkness == 0 {
		return
	}

	priest.AddStaticMod(core.SpellModConfig{
		Kind:       core.SpellMod_DamageDone_Flat,
		FloatValue: 0.02 * float64(priest.Talents.Darkness),
		ClassMask:  PriestShadowSpells,
	})
}

func (priest *Priest) applyShadowFocus() {
	if priest.Talents.ShadowFocus == 0 {
		return
	}

	priest.PseudoStats.SchoolBonusHitChance[stats.SchoolIndexShadow] += 2 * float64(priest.Talents.ShadowFocus)

}

func (priest *Priest) applyImprovedShadowWordPain() {
	if priest.Talents.ImprovedShadowWordPain == 0 {
		return
	}

	priest.AddStaticMod(core.SpellModConfig{
		Kind:      core.SpellMod_DotNumberOfTicks_Flat,
		IntValue:  int32(priest.Talents.ImprovedShadowWordPain),
		ClassMask: PriestSpellShadowWordPain,
	})
}

func (priest *Priest) applyFocusedMind() {
	if priest.Talents.FocusedMind == 0 {
		return
	}

	priest.AddStaticMod(core.SpellModConfig{
		Kind:       core.SpellMod_PowerCost_Pct,
		FloatValue: -0.05 * float64(priest.Talents.FocusedMind),
		ClassMask:  PriestSpellMindBlast | PriestSpellMindFlay,
	})
}

func (priest *Priest) applyShadowAffinity() {
	if priest.Talents.ShadowAffinity == 0 {
		return
	}

	threatReduction := []float64{0, -0.08, -0.16, -0.25}[priest.Talents.ShadowAffinity]

	priest.AddStaticMod(core.SpellModConfig{
		Kind:       core.SpellMod_ThreatMultiplier_Pct,
		FloatValue: threatReduction,
		ClassMask:  PriestShadowSpells,
	})
}

func (priest *Priest) applyShadowPower() {
	if priest.Talents.ShadowPower == 0 {
		return
	}

	priest.AddStaticMod(core.SpellModConfig{
		Kind:       core.SpellMod_BonusCrit_Percent,
		FloatValue: 2.0 * float64(priest.Talents.ShadowPower),
		ClassMask:  PriestSpellMindBlast | PriestSpellShadowWordDeath,
	})
}

func (priest *Priest) applyShadowWeaving() {
	if priest.Talents.ShadowWeaving == 0 {
		return
	}

	swAuras := priest.NewEnemyAuraArray(func(target *core.Unit) *core.Aura {
		return core.ShadowWeavingAura(target)
	})
	procChance := 0.20 * float64(priest.Talents.ShadowWeaving)

	priest.MakeProcTriggerAura(core.ProcTrigger{
		Name:           "Shadow Weaving Trigger",
		ClassSpellMask: PriestShadowSpells,
		Callback:       core.CallbackOnSpellHitDealt,
		Outcome:        core.OutcomeLanded,
		ProcChance:     procChance,
		Handler: func(sim *core.Simulation, spell *core.Spell, result *core.SpellResult) {
			swAuras.Get(result.Target).Activate(sim)
			swAuras.Get(result.Target).AddStack(sim)
		},
	})
}

func (priest *Priest) applyMisery() {
	if priest.Talents.Misery == 0 {
		return
	}

	miseryAuras := priest.NewEnemyAuraArray(func(target *core.Unit) *core.Aura {
		return core.MiseryAura(target, priest.Talents.Misery)
	})

	priest.MakeProcTriggerAura(core.ProcTrigger{
		Name:           "Misery Trigger",
		ClassSpellMask: PriestSpellShadowWordPain | PriestSpellVampiricTouch | PriestSpellMindFlay,
		Outcome:        core.OutcomeLanded,
		Callback:       core.CallbackOnSpellHitDealt,
		Handler: func(sim *core.Simulation, spell *core.Spell, result *core.SpellResult) {
			aura := miseryAuras.Get(result.Target)
			dotDuration := spell.Dot(result.Target).RemainingDuration(sim)
			currentRemaining := aura.RemainingDuration(sim)

			if dotDuration > currentRemaining {
				aura.Duration = dotDuration
			} else {
				aura.Duration = currentRemaining
			}

			aura.Activate(sim)

		},
	})
}

// ---------------------------------------------------------------------------
// Shadowform
// Increases shadow damage by 15%. Reduces physical damage taken by 15%.
// ---------------------------------------------------------------------------

func (priest *Priest) applyShadowform() {
	if !priest.Talents.Shadowform {
		return
	}

	// +15% shadow damage — dynamic so it only applies while the form is up.
	shadowDmgMod := priest.AddDynamicMod(core.SpellModConfig{
		Kind:       core.SpellMod_DamageDone_Flat,
		FloatValue: 0.15,
		ClassMask:  PriestShadowSpells,
	})

	shadowformAura := priest.RegisterAura(core.Aura{
		Label:    "Shadowform",
		ActionID: core.ActionID{SpellID: 15473},
		Duration: core.NeverExpires,
		OnReset: func(aura *core.Aura, sim *core.Simulation) {
			if priest.SelfBuffs.PreShadowform {
				aura.Activate(sim)
			}
		}, OnGain: func(aura *core.Aura, sim *core.Simulation) {
			shadowDmgMod.Activate()
			// -15% physical damage taken
			aura.Unit.PseudoStats.SchoolDamageTakenMultiplier[stats.SchoolIndexPhysical] *= 0.85
		},
		OnExpire: func(aura *core.Aura, sim *core.Simulation) {
			shadowDmgMod.Deactivate()
			aura.Unit.PseudoStats.SchoolDamageTakenMultiplier[stats.SchoolIndexPhysical] /= 0.85
		},
		// Casting any holy-school spell breaks Shadowform.
		OnCastComplete: func(aura *core.Aura, sim *core.Simulation, spell *core.Spell) {
			if spell.SpellSchool.Matches(core.SpellSchoolHoly) {
				aura.Deactivate(sim)
			}
		},
	})

	priest.RegisterSpell(core.SpellConfig{
		ActionID:       core.ActionID{SpellID: 15473},
		SpellSchool:    core.SpellSchoolShadow,
		ProcMask:       core.ProcMaskEmpty,
		Flags:          core.SpellFlagAPL,
		ClassSpellMask: PriestSpellShadowform,

		ManaCost: core.ManaCostOptions{
			BaseCostPercent: 32,
		},
		Cast: core.CastConfig{
			DefaultCast: core.Cast{
				GCD: core.GCDDefault,
			},
		},
		ApplyEffects: func(sim *core.Simulation, _ *core.Unit, _ *core.Spell) {
			shadowformAura.Activate(sim)
		},
	})
}

func (priest *Priest) applyVampiricEmbrace() {
	if !priest.Talents.VampiricEmbrace {
		return
	}

	healPct := 0.15 + 0.05*float64(priest.Talents.ImprovedVampiricEmbrace)
	healthMetrics := priest.NewHealthMetrics(core.ActionID{SpellID: 15286})

	veDebuffAuras := priest.NewEnemyAuraArray(func(target *core.Unit) *core.Aura {
		return target.RegisterAura(core.Aura{
			Label:    "Vampiric Embrace",
			ActionID: core.ActionID{SpellID: 15286},
			Duration: time.Second * 60,

			OnSpellHitTaken: func(aura *core.Aura, sim *core.Simulation, spell *core.Spell, result *core.SpellResult) {
				if !spell.SpellSchool.Matches(core.SpellSchoolShadow) || result.Damage == 0 {
					return
				}
				priest.GainHealth(sim, result.Damage*healPct, healthMetrics)
			},

			OnPeriodicDamageTaken: func(aura *core.Aura, sim *core.Simulation, spell *core.Spell, result *core.SpellResult) {
				if !spell.SpellSchool.Matches(core.SpellSchoolShadow) || result.Damage == 0 {
					return
				}
				priest.GainHealth(sim, result.Damage*healPct, healthMetrics)
			},
		})
	})

	priest.VampiricEmbrace = priest.RegisterSpell(core.SpellConfig{
		ActionID:       core.ActionID{SpellID: 15286},
		SpellSchool:    core.SpellSchoolShadow,
		ProcMask:       core.ProcMaskEmpty,
		Flags:          core.SpellFlagAPL,
		ClassSpellMask: PriestSpellVampiricEmbrace,

		ManaCost: core.ManaCostOptions{
			BaseCostPercent: 2,
		},

		Cast: core.CastConfig{
			DefaultCast: core.Cast{
				GCD: core.GCDDefault,
			},
			CD: core.Cooldown{
				Timer:    priest.NewTimer(),
				Duration: time.Second * 10,
			},
		},

		ApplyEffects: func(sim *core.Simulation, target *core.Unit, spell *core.Spell) {
			veDebuffAuras.Get(target).Activate(sim)
		},

		RelatedAuraArrays: veDebuffAuras.ToMap(),
	})
}
