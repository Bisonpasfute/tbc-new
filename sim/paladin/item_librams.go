package paladin

import (
	"time"

	"github.com/wowsims/tbc/sim/core"
	"github.com/wowsims/tbc/sim/core/stats"
)

func init() {
	core.NewItemEffect(27484, func(agent core.Agent) {
		paladin := agent.(PaladinAgent).GetPaladin()

		buffAura := paladin.NewTemporaryStatsAura(
			"Justice",
			core.ActionID{SpellID: 34258},
			stats.Stats{stats.MeleeCritRating: 53, stats.SpellCritRating: 53},
			time.Second*5,
		)

		aura := core.MakePermanent(paladin.RegisterAura(core.Aura{
			Label: "Libram of Avengement",
		}).AttachProcTrigger(core.ProcTrigger{
			Callback:       core.CallbackOnSpellHitDealt,
			ClassSpellMask: SpellMaskJudgementOfCommand | SpellMaskJudgementOfRighteousness | SpellMaskJudgementOfBlood | SpellMaskJudgementOfVengeance,
			ProcChance:     1,
			Handler: func(sim *core.Simulation, spell *core.Spell, result *core.SpellResult) {
				buffAura.Activate(sim)
			},
		}))

		paladin.ItemSwap.RegisterProc(27484, aura)
	})
}
