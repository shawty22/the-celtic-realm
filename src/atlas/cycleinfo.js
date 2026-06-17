const CYCLES = {
  mythological: {
    title: 'The Mythological Cycle',
    sub: 'The God-Age — before history',
    color: '#C8A84B',
    body: `
      <p>The oldest of Ireland's four mythological cycles, set in a primordial epoch before human history. It tells of the divine races who inhabited Ireland in succession — each wave displacing the last.</p>
      <h4>The Peoples of Ireland</h4>
      <ul>
        <li><strong>Fomorians</strong> — ancient sea-dwelling forces of chaos and darkness, present before all others</li>
        <li><strong>Partholón & Nemedians</strong> — early colonisers, eventually overcome</li>
        <li><strong>Fir Bolg</strong> — pre-divine inhabitants; divided Ireland into five provinces</li>
        <li><strong>Tuatha Dé Danann</strong> — the divine race, People of the Goddess Danu; masters of magic and craft. They defeated the Fir Bolg at Mag Tuired and the Fomorians in the Second Battle of Mag Tuired</li>
        <li><strong>Milesians</strong> — the ancestral Irish people, who defeated the Tuatha Dé Danann, driving them underground into the sídhe (fairy mounds)</li>
      </ul>
      <h4>Key Sites</h4>
      <p>The Hill of Tara (seat of the High Kings), Brú na Bóinne (Newgrange — sídhe of the Dagda), Uisneach (navel of Ireland), and the twin battlefields of Mag Tuired in Connacht.</p>
      <p class="cycle-note">Primary sources: <em>Lebor Gabála Érenn</em> (Book of Invasions), <em>Cath Maige Tuired</em>, <em>Togail Bruidne Dá Derga</em></p>
    `
  },
  ulster: {
    title: 'The Ulster Cycle',
    sub: 'Age of Heroes — the Iron Age',
    color: '#C87070',
    body: `
      <p>Set in the Iron Age (roughly 1st century BC–1st century AD), the Ulster Cycle centres on Emain Macha (Navan Fort, Co. Armagh) — seat of Conchobar mac Nessa, King of Ulster — and the warriors of the Red Branch.</p>
      <h4>The Central Hero</h4>
      <p><strong>Cú Chulainn</strong> (the Hound of Culann) — Ireland's greatest warrior, son of the god Lugh and the mortal Deichtine. His feats include the single-handed defence of Ulster during the Táin Bó Cúailnge, and his tragic death at the Pillar Stone of Lugaid.</p>
      <h4>Key Tales</h4>
      <ul>
        <li><strong>Táin Bó Cúailnge</strong> — the great Cattle Raid of Cooley; Queen Medb of Connacht marches on Ulster to steal the Brown Bull. Cú Chulainn holds the ford alone.</li>
        <li><strong>Deirdre of the Sorrows</strong> — a tragic love story; Deirdre and Naoise flee to Scotland, return, and are destroyed by Conchobar's jealousy</li>
        <li><strong>Fled Bricrenn</strong> — the feast of the trickster Bricriu; the beheading challenge later echoed in <em>Sir Gawain and the Green Knight</em></li>
      </ul>
      <h4>Key Sites</h4>
      <p>Emain Macha (Navan Fort), Rathcroghan (Medb's seat in Connacht), the Cooley Peninsula (Co. Louth), Dún Delca (Dundalk — Cú Chulainn's fort), and Knocknarea (Medb's cairn).</p>
      <p class="cycle-note">Primary sources: <em>Táin Bó Cúailnge</em>, <em>Longes mac nUislenn</em>, <em>Fled Bricrenn</em></p>
    `
  },
  fenian: {
    title: 'The Fenian Cycle',
    sub: 'The Fianna — warriors of the wild',
    color: '#6AA880',
    body: `
      <p>Centred on <strong>Fionn mac Cumhaill</strong> and his warrior-brotherhood, the Fianna — an elite band of hunter-warriors who served the High King of Ireland. Unlike the Ulster Cycle's fortress-bound heroism, the Fenian tales are characterised by nature, the open landscape, hunting, magic, and romance.</p>
      <h4>Fionn mac Cumhaill</h4>
      <p>Fionn gained wisdom by accidentally tasting the Salmon of Knowledge on the River Boyne, burning his thumb and touching it to his lips. Ever after, he could access all wisdom by chewing his thumb. His seat was the Hill of Allen in Co. Kildare.</p>
      <h4>Key Tales</h4>
      <ul>
        <li><strong>Tóraíocht Dhiarmada agus Ghráinne</strong> — the Pursuit of Diarmuid and Gráinne; Gráinne elopes with Diarmuid on the night of her betrothal to Fionn, and the Fianna pursue them across all of Ireland for sixteen years</li>
        <li><strong>Oisín in Tír na nÓg</strong> — Fionn's son Oisín is taken to the Land of Youth by Niamh of the Golden Hair; returns to find 300 years have passed</li>
        <li><strong>The Battle of Gabhra</strong> — the destruction of the Fianna; Ben Bulben is associated with Diarmuid's death</li>
      </ul>
      <h4>Key Sites</h4>
      <p>Hill of Allen (Co. Kildare), Ben Bulben (Co. Sligo), the Boyne (Salmon of Knowledge), Giant's Causeway (Fionn's bridge to Scotland), Lough Leane (Killarney).</p>
      <p class="cycle-note">Primary sources: <em>Acallam na Senórach</em> (Tales of the Elders), <em>Tóraíocht Dhiarmada agus Ghráinne</em>, <em>Agallamh na Seanórach</em></p>
    `
  }
}

export function initCycleModal() {
  const modal = document.getElementById('cycle-modal')
  const content = document.getElementById('cycle-modal-content')
  const backdrop = modal.querySelector('.cycle-modal-backdrop')
  const closeBtn = modal.querySelector('.cycle-modal-close')

  function open(cycleId) {
    const c = CYCLES[cycleId]
    if (!c) return
    content.innerHTML = `
      <div class="cmi-header" style="--cycle-col: ${c.color}">
        <span class="cmi-sub">${c.sub}</span>
        <h2 class="cmi-title">${c.title}</h2>
      </div>
      <div class="cmi-body">${c.body}</div>
    `
    modal.classList.add('is-open')
    modal.setAttribute('aria-hidden', 'false')
  }

  function close() {
    modal.classList.remove('is-open')
    modal.setAttribute('aria-hidden', 'true')
  }

  backdrop.addEventListener('click', close)
  closeBtn.addEventListener('click', close)
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close() })

  document.querySelectorAll('.cycle-info-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      open(btn.dataset.cycle)
    })
  })
}
